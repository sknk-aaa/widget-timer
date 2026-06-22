import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type {
  AlarmService,
  AlarmScheduleParams,
  PermissionStatus,
} from '../types';

function mapStatus(status: Notifications.PermissionStatus): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/**
 * Expo Go 用モック。expo-notifications でローカル通知を予約する。
 * 通知 identifier に timerId をそのまま使い、cancel を簡潔にする。
 * 注意: 消音/Focus 貫通・全画面アラートは Phase2 の AlarmKit 実装でのみ実現する。
 */
export const mockAlarmService: AlarmService = {
  capabilities: { nativePause: false, nativeAlarm: false },

  async getPermission() {
    const res = await Notifications.getPermissionsAsync();
    return mapStatus(res.status);
  },

  async requestPermission() {
    const res = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return mapStatus(res.status);
  },

  async schedule(params: AlarmScheduleParams) {
    await scheduleAlarmNotification(params);
  },

  async pause(timerId: string) {
    await Notifications.cancelScheduledNotificationAsync(timerId).catch(() => {});
  },

  async resume(params: AlarmScheduleParams) {
    await scheduleAlarmNotification(params);
  },

  async cancel(timerId: string) {
    await Notifications.cancelScheduledNotificationAsync(timerId).catch(() => {});
  },
};

async function scheduleAlarmNotification(params: AlarmScheduleParams) {
  await Notifications.scheduleNotificationAsync({
    identifier: params.timerId,
    content: {
      title: 'タイマー終了',
      body: '時間になりました',
      sound: true,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: params.endAt,
    },
  });
}
