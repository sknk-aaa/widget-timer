import type { PurchaseService } from './types';
import { getMeta, setMeta } from '../db/repo';
import { hasNativeModules } from './env';
import { ImasuguNative } from '../../modules/imasugu-native';

export const PRO_PRODUCT_ID = 'com.sknk.imasugutimer.pro';
const PRO_KEY = 'pro_owned';

/** StoreKit 2 実装（TestFlight/本番）。 */
const storeKit: PurchaseService = {
  isPro: () => ImasuguNative!.isProPurchased(PRO_PRODUCT_ID),
  purchasePro: async () =>
    (await ImasuguNative!.purchaseProduct(PRO_PRODUCT_ID)) === 'purchased',
  restore: () => ImasuguNative!.restorePurchases(PRO_PRODUCT_ID),
};

/** Expo Go 用モック（meta フラグ）。 */
const mock: PurchaseService = {
  async isPro() {
    return getMeta(PRO_KEY) === '1';
  },
  async purchasePro() {
    setMeta(PRO_KEY, '1');
    return true;
  },
  async restore() {
    return getMeta(PRO_KEY) === '1';
  },
};

export const purchaseService: PurchaseService =
  hasNativeModules && ImasuguNative ? storeKit : mock;

/** ペイウォール表示用の価格（取得できなければ null）。 */
export async function getProPrice(): Promise<string | null> {
  if (!ImasuguNative) return null;
  const product = await ImasuguNative.getProduct(PRO_PRODUCT_ID);
  return product?.displayPrice ?? null;
}
