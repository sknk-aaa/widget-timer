import type { WidgetService } from './types';
import { hasNativeModules } from './env';

/**
 * Phase1: no-op モック。
 * Phase2: WidgetKit の WidgetCenter.reloadAllTimelines() を呼ぶネイティブ実装に差し替える。
 */
export const widgetService: WidgetService = {
  async reloadTimelines() {
    if (!hasNativeModules) return;
    // Phase2: NativeWidgetModule.reloadTimelines()
  },
};
