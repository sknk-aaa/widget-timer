import { ImasuguNative } from '../../modules/imasugu-native';
import type { Preset } from '../domain/types';

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
