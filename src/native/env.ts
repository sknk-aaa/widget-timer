import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go 上で動作しているか（カスタムネイティブモジュールが使えない環境）。 */
export const isExpoGo = Constants.executionEnvironment === 'storeClient';

export const isIOS = Platform.OS === 'ios';

/**
 * AlarmKit / WidgetKit / ActivityKit / StoreKit のネイティブ実装が利用可能か。
 * Phase2 で dev-client / TestFlight ビルドに実装を入れたら true になる。
 * Expo Go では常に false（モックで動作）。
 */
export const hasNativeModules = isIOS && !isExpoGo;
