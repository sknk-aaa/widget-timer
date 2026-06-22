import type { WidgetService } from './types';
import { hasNativeModules } from './env';
import { ImasuguNative } from '../../modules/imasugu-native';

/**
 * Phase1(Expo Go): no-op。
 * Phase2: WidgetCenter.reloadAllTimelines() を呼び、ウィジェットを更新する。
 */
export const widgetService: WidgetService = {
  async reloadTimelines() {
    if (!hasNativeModules || !ImasuguNative) return;
    ImasuguNative.reloadWidgets();
  },
};
