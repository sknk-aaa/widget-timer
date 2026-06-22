import { create } from 'zustand';
import {
  listRunningTimers,
  insertRunningTimer,
  updateRunningTimer,
  deleteRunningTimer,
} from '../db/repo';
import type { Preset, RunningTimer, TimerSource } from '../domain/types';
import { nowMs, remainingSecOf } from '../domain/format';
import { uuid } from '../domain/uuid';
import { alarmService } from '../native/alarm';
import { liveActivityService } from '../native/liveActivity';
import { widgetService } from '../native/widget';
import { readRunningFromAppGroup, takeCancelledFromAppGroup } from '../native/shared';
import { haptics } from '../ui/haptics';

interface StartInput {
  presetId: string | null;
  icon: string;
  color: string;
  durationSec: number;
  source: TimerSource;
}

interface TimersState {
  timers: RunningTimer[];
  load: () => void;
  start: (input: StartInput) => Promise<RunningTimer>;
  startFromPreset: (preset: Preset, source: TimerSource) => Promise<RunningTimer>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  /** 完了表示のタイマーを消す。 */
  dismiss: (id: string) => Promise<void>;
  /** 残り0以下になった running タイマーを finished に遷移させる。 */
  reconcile: () => void;
  /** ウィジェット/ロック画面から無音起動したぶんを App Group から取り込む。 */
  importFromShared: () => void;
}

function liveParams(t: RunningTimer) {
  return {
    timerId: t.id,
    endAt: t.endAt,
    icon: t.icon,
    color: t.color,
    paused: t.state === 'paused',
    pausedRemainingSec: t.pausedRemainingSec,
  };
}

export const useTimersStore = create<TimersState>((set, get) => ({
  timers: [],

  load: () => {
    set({ timers: listRunningTimers() });
  },

  start: async (input) => {
    const now = nowMs();
    const timer: RunningTimer = {
      id: uuid(),
      presetId: input.presetId,
      icon: input.icon,
      color: input.color,
      durationSec: input.durationSec,
      endAt: now + input.durationSec * 1000,
      state: 'running',
      pausedRemainingSec: null,
      createdAt: now,
    };
    insertRunningTimer(timer);
    set({ timers: [...get().timers, timer] });

    await alarmService.schedule({
      timerId: timer.id,
      durationSec: timer.durationSec,
      endAt: timer.endAt,
      icon: timer.icon,
      color: timer.color,
    });
    await liveActivityService.start(liveParams(timer));
    await widgetService.reloadTimelines();
    return timer;
  },

  startFromPreset: (preset, source) =>
    get().start({
      presetId: preset.id,
      icon: preset.icon,
      color: preset.color,
      durationSec: preset.durationSec,
      source,
    }),

  pause: async (id) => {
    const timer = get().timers.find((t) => t.id === id);
    if (!timer || timer.state !== 'running') return;
    const remaining = remainingSecOf(timer);
    const patch = { state: 'paused' as const, pausedRemainingSec: remaining };
    updateRunningTimer(id, patch);
    const next = { ...timer, ...patch };
    set({ timers: get().timers.map((t) => (t.id === id ? next : t)) });

    // AlarmKit の pause を使う（cancel すると Live Activity が消えるため）。
    await alarmService.pause(id);
    await liveActivityService.update(liveParams(next));
    await widgetService.reloadTimelines();
  },

  resume: async (id) => {
    const timer = get().timers.find((t) => t.id === id);
    if (!timer || timer.state !== 'paused') return;
    const remaining = timer.pausedRemainingSec ?? 0;
    const endAt = nowMs() + remaining * 1000;
    const patch = {
      state: 'running' as const,
      endAt,
      pausedRemainingSec: null,
    };
    updateRunningTimer(id, patch);
    const next = { ...timer, ...patch };
    set({ timers: get().timers.map((t) => (t.id === id ? next : t)) });

    await alarmService.resume({
      timerId: next.id,
      durationSec: remaining,
      endAt,
      icon: next.icon,
      color: next.color,
    });
    await liveActivityService.update(liveParams(next));
    await widgetService.reloadTimelines();
  },

  cancel: async (id) => {
    const exists = get().timers.some((t) => t.id === id);
    if (!exists) return;
    deleteRunningTimer(id);
    set({ timers: get().timers.filter((t) => t.id !== id) });

    await alarmService.cancel(id);
    await liveActivityService.end(id);
    await widgetService.reloadTimelines();
  },

  dismiss: async (id) => {
    const exists = get().timers.some((t) => t.id === id);
    if (!exists) return;
    deleteRunningTimer(id);
    set({ timers: get().timers.filter((t) => t.id !== id) });
    await alarmService.cancel(id);
    await liveActivityService.end(id);
    await widgetService.reloadTimelines();
  },

  reconcile: () => {
    const now = nowMs();
    const expired = get().timers.filter(
      (t) => t.state === 'running' && remainingSecOf(t, now) <= 0,
    );
    if (expired.length === 0) return;
    for (const t of expired) {
      updateRunningTimer(t.id, { state: 'finished', pausedRemainingSec: null });
      void liveActivityService.end(t.id);
    }
    set({
      timers: get().timers.map((t) =>
        expired.some((e) => e.id === t.id) ? { ...t, state: 'finished' } : t,
      ),
    });
    haptics.finish();
    void widgetService.reloadTimelines();
  },

  importFromShared: () => {
    // ウィジェット/通知で終了されたぶんをドックから消す（明示IDのみ＝誤消し防止）。
    const removeSet = new Set(
      takeCancelledFromAppGroup().filter((id) => get().timers.some((t) => t.id === id)),
    );

    const entries = readRunningFromAppGroup();
    const current = get().timers;
    const byId = new Map(current.map((t) => [t.id, t]));
    const now = nowMs();
    const imported: RunningTimer[] = [];
    const updates: { id: string; patch: Partial<Omit<RunningTimer, 'id'>> }[] = [];

    for (const e of entries) {
      if (removeSet.has(e.id)) continue;
      const wantState: 'running' | 'paused' = e.state === 'paused' ? 'paused' : 'running';
      const existing = byId.get(e.id);
      if (existing) {
        // ウィジェット/通知側で一時停止/再開された状態を取り込む。
        if (existing.state !== 'finished' && existing.state !== wantState) {
          updates.push({
            id: e.id,
            patch: {
              state: wantState,
              endAt: e.endAt,
              pausedRemainingSec: wantState === 'paused' ? e.pausedRemainingSec : null,
            },
          });
        }
        continue;
      }
      if (e.state === 'finished') continue;
      if (e.state === 'running' && e.endAt <= now) continue;
      imported.push({
        id: e.id,
        presetId: null,
        icon: e.icon,
        color: e.color,
        durationSec: e.durationSec,
        endAt: e.endAt,
        state: wantState,
        pausedRemainingSec: wantState === 'paused' ? e.pausedRemainingSec : null,
        createdAt: now,
      });
    }

    if (removeSet.size === 0 && imported.length === 0 && updates.length === 0) return;

    for (const id of removeSet) deleteRunningTimer(id);
    for (const u of updates) updateRunningTimer(u.id, u.patch);
    for (const t of imported) insertRunningTimer(t);

    let next = current.filter((t) => !removeSet.has(t.id));
    if (updates.length > 0) {
      const patchById = new Map(updates.map((u) => [u.id, u.patch]));
      next = next.map((t) => {
        const patch = patchById.get(t.id);
        return patch ? { ...t, ...patch } : t;
      });
    }
    if (imported.length > 0) next = [...next, ...imported];
    set({ timers: next });
  },
}));
