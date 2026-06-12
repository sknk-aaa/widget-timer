import type { AlarmService } from '../types';
import { mockAlarmService } from './mock';
// Phase2: import { nativeAlarmService } from './native'; // AlarmKit ラッパ

/**
 * 現在の環境に応じた AlarmService を返す。
 * Phase1: 常にモック（expo-notifications）。
 * Phase2: hasNativeModules なら AlarmKit 実装に切り替える。
 */
export const alarmService: AlarmService = mockAlarmService;
