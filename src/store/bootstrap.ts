import { getMeta, setMeta, insertPreset } from '../db/repo';
import { runMigrations } from '../db/migrate';
import { uuid } from '../domain/uuid';
import type { Preset } from '../domain/types';
import { usePresetsStore } from './presets';
import { useTimersStore } from './timers';
import { useProStore } from './pro';
import { useSettingsStore } from './settings';
import { mirrorPresetsToAppGroup, mirrorRunningToAppGroup } from '../native/shared';
import { widgetService } from '../native/widget';

const SEEDED_KEY = 'seeded';

const DEFAULT_PRESETS: Omit<Preset, 'id'>[] = [
  { icon: 'ramen', color: 'orange', durationSec: 180, inWidget: true, sortOrder: 0, sound: 'default' },
  { icon: 'bed', color: 'indigo', durationSec: 1200, inWidget: true, sortOrder: 1, sound: 'default' },
  { icon: 'book', color: 'blue', durationSec: 1500, inWidget: true, sortOrder: 2, sound: 'default' },
];

function seedDefaultsIfNeeded(): void {
  if (getMeta(SEEDED_KEY) === '1') return;
  for (const p of DEFAULT_PRESETS) {
    insertPreset({ ...p, id: uuid() });
  }
  setMeta(SEEDED_KEY, '1');
}

/** アプリ起動時に DB を初期化し、ストアを読み込む。 */
export async function bootstrap(): Promise<void> {
  runMigrations();
  seedDefaultsIfNeeded();
  useSettingsStore.getState().load();
  usePresetsStore.getState().load();
  useTimersStore.getState().load();
  useTimersStore.getState().reconcile();
  // ウィジェット/ロック画面から無音起動したぶんを取り込む（ミラー前に行い消えないようにする）。
  useTimersStore.getState().importFromShared();
  await useProStore.getState().load();
  await useSettingsStore.getState().refreshPermission();

  // プリセット・実行中タイマーを App Group にミラー（Control/ウィジェット用）。変更時も追従。
  mirrorPresetsToAppGroup(usePresetsStore.getState().presets);
  mirrorRunningToAppGroup(useTimersStore.getState().timers);
  void widgetService.reloadTimelines();
  usePresetsStore.subscribe((state) => {
    mirrorPresetsToAppGroup(state.presets);
    void widgetService.reloadTimelines();
  });
  useTimersStore.subscribe((state) => {
    mirrorRunningToAppGroup(state.timers);
    void widgetService.reloadTimelines();
  });
}
