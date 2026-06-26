import {
  getMeta,
  setMeta,
  insertPreset,
  listPresets,
  listBoards,
  insertBoard,
  listBoardPresets,
  setBoardPresets,
} from '../db/repo';
import { runMigrations } from '../db/migrate';
import { uuid } from '../domain/uuid';
import type { Preset, Board } from '../domain/types';
import { usePresetsStore } from './presets';
import { useBoardsStore } from './boards';
import { useTimersStore } from './timers';
import { useProStore } from './pro';
import { useSettingsStore } from './settings';
import { mirrorPresetsToAppGroup, mirrorBoardsToAppGroup, mirrorRunningToAppGroup } from '../native/shared';
import { widgetService } from '../native/widget';
import { t } from '../i18n';

const SEEDED_KEY = 'seeded';
const BOARDS_SEEDED_KEY = 'boards_seeded';

const DEFAULT_PRESETS: Omit<Preset, 'id'>[] = [
  { name: '', icon: 'ramen', color: 'orange', durationSec: 180, inWidget: true, sortOrder: 0, sound: 'default' },
  { name: '', icon: 'bed', color: 'indigo', durationSec: 1200, inWidget: true, sortOrder: 1, sound: 'default' },
  { name: '', icon: 'book', color: 'blue', durationSec: 1500, inWidget: true, sortOrder: 2, sound: 'default' },
];

function seedDefaultsIfNeeded(): void {
  if (getMeta(SEEDED_KEY) === '1') return;
  for (const p of DEFAULT_PRESETS) {
    insertPreset({ ...p, id: uuid() });
  }
  setMeta(SEEDED_KEY, '1');
}

// ウィジェット欄（ボード）を初期化。デフォルト欄を1つ用意し、旧 inWidget プリセットを移行する。
function seedBoardsIfNeeded(): void {
  if (getMeta(BOARDS_SEEDED_KEY) === '1') return;
  let boards = listBoards();
  if (boards.length === 0) {
    const board: Board = { id: uuid(), name: '', sortOrder: 0 };
    insertBoard(board);
    boards = [board];
  }
  if (listBoardPresets().length === 0) {
    const widgetPresetIds = listPresets()
      .filter((p) => p.inWidget)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.id);
    if (widgetPresetIds.length > 0) {
      setBoardPresets(boards[0]!.id, widgetPresetIds);
    }
  }
  setMeta(BOARDS_SEEDED_KEY, '1');
}

/** アプリ起動時に DB を初期化し、ストアを読み込む。 */
export async function bootstrap(): Promise<void> {
  runMigrations();
  seedDefaultsIfNeeded();
  seedBoardsIfNeeded();
  useSettingsStore.getState().load();
  usePresetsStore.getState().load();
  useBoardsStore.getState().load();
  useTimersStore.getState().load();
  useTimersStore.getState().reconcile();
  // ウィジェット/ロック画面から無音起動したぶんを取り込む（ミラー前に行い消えないようにする）。
  useTimersStore.getState().importFromShared();
  await useProStore.getState().load();
  await useSettingsStore.getState().refreshPermission();

  // プリセット・ボード・実行中タイマーを App Group にミラー（ウィジェット用）。変更時も追従。
  const fallbackName = (n: number) => t().board.fallbackName(n);
  mirrorPresetsToAppGroup(usePresetsStore.getState().presets);
  {
    const b = useBoardsStore.getState();
    mirrorBoardsToAppGroup(b.boards, b.membership, fallbackName);
  }
  mirrorRunningToAppGroup(useTimersStore.getState().timers);
  void widgetService.reloadTimelines();
  usePresetsStore.subscribe((state) => {
    mirrorPresetsToAppGroup(state.presets);
    void widgetService.reloadTimelines();
  });
  useBoardsStore.subscribe((state) => {
    mirrorBoardsToAppGroup(state.boards, state.membership, fallbackName);
    void widgetService.reloadTimelines();
  });
  useTimersStore.subscribe((state) => {
    mirrorRunningToAppGroup(state.timers);
    void widgetService.reloadTimelines();
  });
}
