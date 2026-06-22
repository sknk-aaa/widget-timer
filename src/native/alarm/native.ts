import { ImasuguNative } from '../../../modules/imasugu-native';
import type { AlarmService, AlarmScheduleParams, PermissionStatus } from '../types';

/**
 * 実機(TestFlight)用 AlarmService。ローカル Expo モジュール経由で AlarmKit を呼ぶ。
 * Live Activity は AlarmKit が自動生成するため、本サービスはスケジュール/キャンセルのみ。
 */
export const nativeAlarmService: AlarmService = {
  capabilities: { nativePause: true, nativeAlarm: true },

  async getPermission(): Promise<PermissionStatus> {
    if (!ImasuguNative) return 'undetermined';
    return ImasuguNative.getAuthorization();
  },

  async requestPermission(): Promise<PermissionStatus> {
    if (!ImasuguNative) return 'undetermined';
    return ImasuguNative.requestAuthorization();
  },

  async schedule(params: AlarmScheduleParams): Promise<void> {
    if (!ImasuguNative) return;
    await ImasuguNative.scheduleTimer(
      params.timerId,
      params.durationSec,
      params.icon,
      params.color,
      null,
    );
  },

  async pause(timerId: string): Promise<void> {
    if (!ImasuguNative) return;
    await ImasuguNative.pauseTimer(timerId);
  },

  async resume(params: AlarmScheduleParams): Promise<void> {
    if (!ImasuguNative) return;
    // AlarmKit は内部の残り時間で続行するため id のみで再開。
    await ImasuguNative.resumeTimer(params.timerId);
  },

  async cancel(timerId: string): Promise<void> {
    if (!ImasuguNative) return;
    await ImasuguNative.cancel(timerId);
  },
};
