import type { AlarmService } from '../types';
import { hasNativeModules } from '../env';
import { mockAlarmService } from './mock';
import { nativeAlarmService } from './native';
import { ImasuguNative } from '../../../modules/imasugu-native';

/**
 * 現在の環境に応じた AlarmService を返す。
 * - TestFlight 等でネイティブモジュールが利用可能: AlarmKit 実装。
 * - Expo Go / 非対応: expo-notifications モック。
 */
export const alarmService: AlarmService =
  hasNativeModules && ImasuguNative ? nativeAlarmService : mockAlarmService;
