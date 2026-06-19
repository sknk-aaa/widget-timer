import { asc, eq } from 'drizzle-orm';
import { db } from './client';
import { presets, runningTimers, meta } from './schema';
import type { Preset, RunningTimer } from '../domain/types';

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
  db.delete(presets).where(eq(presets.id, id)).run();
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
            icon: p.icon,
            color: p.color,
            durationSec: p.durationSec,
            inWidget: p.inWidget,
            sortOrder: p.sortOrder,
          },
        })
        .run();
    }
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
