import type { LiveActivityService, LiveActivityParams } from './types';
import { hasNativeModules } from './env';

/**
 * Phase1: no-op モック。
 * Phase2: ActivityKit でロック画面 / Dynamic Island の Live Activity を制御する実装に差し替える。
 */
export const liveActivityService: LiveActivityService = {
  async start(_params: LiveActivityParams) {
    if (!hasNativeModules) return;
    // Phase2: ActivityKit start
  },
  async update(_params: LiveActivityParams) {
    if (!hasNativeModules) return;
    // Phase2: ActivityKit update
  },
  async end(_timerId: string) {
    if (!hasNativeModules) return;
    // Phase2: ActivityKit end
  },
};
