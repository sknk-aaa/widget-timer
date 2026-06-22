import { ImasuguNative } from '../../modules/imasugu-native';
import type { Preset, RunningTimer } from '../domain/types';

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
