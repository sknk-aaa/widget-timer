import { asc, eq } from 'drizzle-orm';
import { db } from './client';
import { presets, runningTimers, meta, launchHistory, boards, boardPresets } from './schema';
import type { Preset, Board, BoardPreset, RunningTimer, TimerSource } from '../domain/types';

// ---- presets ----

export function listPresets(): Preset[] {
  return db.select().from(presets).orderBy(asc(presets.sortOrder)).all();
}

export function insertPreset(p: Preset): void {
  db.insert(presets).values(p).run();
}

export function updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): void {
  db.update(presets).set(patch).where(eq(presets.id, id)).run();
}

export function deletePreset(id: string): void {
  db.transaction((tx) => {
    tx.delete(boardPresets).where(eq(boardPresets.presetId, id)).run();
    tx.delete(presets).where(eq(presets.id, id)).run();
  });
}

export function bulkUpsertPresets(items: Preset[]): void {
  db.transaction((tx) => {
    for (const p of items) {
      tx
        .insert(presets)
        .values(p)
        .onConflictDoUpdate({
          target: presets.id,
          set: {
            name: p.name,
            icon: p.icon,
            color: p.color,
            durationSec: p.durationSec,
            inWidget: p.inWidget,
            sortOrder: p.sortOrder,
            sound: p.sound,
          },
        })
        .run();
    }
  });
}

export function removePresetFromAllBoards(presetId: string): void {
  db.delete(boardPresets).where(eq(boardPresets.presetId, presetId)).run();
}

// ---- boards（ウィジェット欄） ----

export function listBoards(): Board[] {
  return db.select().from(boards).orderBy(asc(boards.sortOrder)).all();
}

export function insertBoard(b: Board): void {
  db.insert(boards).values(b).run();
}

export function updateBoard(id: string, patch: Partial<Omit<Board, 'id'>>): void {
  db.update(boards).set(patch).where(eq(boards.id, id)).run();
}

export function deleteBoard(id: string): void {
  db.transaction((tx) => {
    tx.delete(boardPresets).where(eq(boardPresets.boardId, id)).run();
    tx.delete(boards).where(eq(boards.id, id)).run();
  });
}

export function listBoardPresets(): BoardPreset[] {
  return db.select().from(boardPresets).orderBy(asc(boardPresets.sortOrder)).all();
}

/** 指定ボードの所属プリセットを、順序つきで丸ごと置き換える（追加/削除/並べ替えの共通経路）。 */
export function setBoardPresets(boardId: string, presetIds: string[]): void {
  db.transaction((tx) => {
    tx.delete(boardPresets).where(eq(boardPresets.boardId, boardId)).run();
    presetIds.forEach((presetId, i) => {
      tx.insert(boardPresets).values({ boardId, presetId, sortOrder: i }).run();
    });
  });
}

// ---- running timers ----

export function listRunningTimers(): RunningTimer[] {
  return db.select().from(runningTimers).all();
}

export function insertRunningTimer(t: RunningTimer): void {
  db.insert(runningTimers).values(t).run();
}

export function updateRunningTimer(
  id: string,
  patch: Partial<Omit<RunningTimer, 'id'>>,
): void {
  db.update(runningTimers).set(patch).where(eq(runningTimers.id, id)).run();
}

export function deleteRunningTimer(id: string): void {
  db.delete(runningTimers).where(eq(runningTimers.id, id)).run();
}

// ---- launch history ----

export function insertLaunchHistory(row: {
  presetId: string | null;
  durationSec: number;
  startedAt: number;
  source: TimerSource;
}): void {
  db.insert(launchHistory).values(row).run();
}

// ---- meta (key-value) ----

export function getMeta(key: string): string | null {
  const row = db.select().from(meta).where(eq(meta.key, key)).get();
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  db
    .insert(meta)
    .values({ key, value })
    .onConflictDoUpdate({ target: meta.key, set: { value } })
    .run();
}
