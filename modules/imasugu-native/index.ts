import { requireOptionalNativeModule } from 'expo-modules-core';

export interface ImasuguNativeModule {
  /** App Group にプリセットJSONをミラー（Control/ウィジェットが読む）。 */
  setSharedPresets(json: string): void;
  runningAlarmIds(): string[];
  reloadWidgets(): void;
  getAuthorization(): Promise<'granted' | 'denied' | 'undetermined'>;
  requestAuthorization(): Promise<'granted' | 'denied' | 'undetermined'>;
  scheduleTimer(
    timerId: string,
    durationSec: number,
    icon: string,
    colorID: string,
    presetId: string | null,
  ): Promise<void>;
  cancel(timerId: string): Promise<void>;
  stopAll(): Promise<void>;
  getProduct(
    productId: string,
  ): Promise<{ id: string; displayPrice: string; displayName: string; description: string } | null>;
  purchaseProduct(
    productId: string,
  ): Promise<'purchased' | 'cancelled' | 'pending' | 'unverified' | 'unavailable' | 'unknown'>;
  restorePurchases(productId: string): Promise<boolean>;
  isProPurchased(productId: string): Promise<boolean>;
}

// Expo Go や非対応環境では null（ネイティブ未リンク）。呼び出し側で必ずガードする。
export const ImasuguNative =
  requireOptionalNativeModule<ImasuguNativeModule>('ImasuguNative');
