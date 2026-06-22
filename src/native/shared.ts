import { ImasuguNative } from '../../modules/imasugu-native';
import type { Preset, RunningTimer, TimerState } from '../domain/types';

/**
 * プリセットを App Group にミラーする（Control / ウィジェットが読む読み取りモデル）。
 * Expo Go / 非対応環境では no-op。
 */
export function mirrorPresetsToAppGroup(presets: Preset[]): void {
  if (!ImasuguNative) return;
  const model = presets.map((p) => ({
    id: p.id,
    icon: p.icon,
    color: p.color,
    durationSec: p.durationSec,
    inWidget: p.inWidget,
    sortOrder: p.sortOrder,
  }));
  ImasuguNative.setSharedPresets(JSON.stringify(model));
}

/**
 * 実行中タイマーを App Group にミラーする（ホームウィジェットのカウントダウン表示用）。
 */
export function mirrorRunningToAppGroup(timers: RunningTimer[]): void {
  if (!ImasuguNative) return;
  const model = timers.map((t) => ({
    id: t.id,
    endAt: t.endAt,
    icon: t.icon,
    color: t.color,
    state: t.state,
    durationSec: t.durationSec,
    pausedRemainingSec: t.pausedRemainingSec,
  }));
  ImasuguNative.setSharedRunning(JSON.stringify(model));
}

interface SharedRunningEntry {
  id: string;
  endAt: number;
  icon: string;
  color: string;
  state: TimerState;
  durationSec: number;
  pausedRemainingSec: number | null;
}

function isSharedRunningEntry(v: unknown): v is SharedRunningEntry {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.endAt === 'number' &&
    typeof o.icon === 'string' &&
    typeof o.color === 'string' &&
    typeof o.state === 'string' &&
    typeof o.durationSec === 'number'
  );
}

/**
 * App Group の実行中タイマー（ウィジェット/ロック画面から無音起動したぶんを含む）を読む。
 * Expo Go / 非対応環境では空配列。
 */
export function readRunningFromAppGroup(): SharedRunningEntry[] {
  if (!ImasuguNative) return [];
  const json = ImasuguNative.getSharedRunning();
  if (!json) return [];
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isSharedRunningEntry);
}
