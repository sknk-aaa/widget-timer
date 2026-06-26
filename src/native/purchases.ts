import type { PurchaseService, PurchaseResult } from './types';
import { getMeta, setMeta } from '../db/repo';
import { hasNativeModules } from './env';
import { ImasuguNative } from '../../modules/imasugu-native';

export const PRO_PRODUCT_ID = 'com.sknk.imasugutimer.pro';
// 「Pro＋応援」（非消耗型）。これを所有していても Pro を有効にする。
export const SUPPORT_PRODUCT_ID = 'com.sknk.imasugutimer.support';
const PRO_KEY = 'pro_owned';

function mapPurchase(
  status: 'purchased' | 'cancelled' | 'pending' | 'unverified' | 'unavailable' | 'unknown',
): PurchaseResult {
  if (status === 'purchased') return 'purchased';
  if (status === 'pending') return 'pending';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}

/** StoreKit 2 実装（TestFlight/本番）。例外は failed/false に丸める（システム境界）。 */
const storeKit: PurchaseService = {
  async isPro() {
    try {
      // Pro 本体、または「Pro＋応援」のどちらかを所有していれば Pro。
      if (await ImasuguNative!.isProPurchased(PRO_PRODUCT_ID)) return true;
      return await ImasuguNative!.isProPurchased(SUPPORT_PRODUCT_ID);
    } catch {
      return false;
    }
  },
  async purchasePro() {
    try {
      return mapPurchase(await ImasuguNative!.purchaseProduct(PRO_PRODUCT_ID));
    } catch {
      return 'failed';
    }
  },
  async restore() {
    try {
      // restorePurchases が AppStore.sync するので、続けて応援側も確認。
      if (await ImasuguNative!.restorePurchases(PRO_PRODUCT_ID)) return true;
      return await ImasuguNative!.isProPurchased(SUPPORT_PRODUCT_ID);
    } catch {
      return false;
    }
  },
};

/** Expo Go 用モック（meta フラグ）。 */
const mock: PurchaseService = {
  async isPro() {
    return getMeta(PRO_KEY) === '1';
  },
  async purchasePro() {
    setMeta(PRO_KEY, '1');
    return 'purchased';
  },
  async restore() {
    return getMeta(PRO_KEY) === '1';
  },
};

export const purchaseService: PurchaseService =
  hasNativeModules && ImasuguNative ? storeKit : mock;

/** ペイウォール表示用の価格（取得できなければ null。ネットワーク不通でも落とさない）。 */
export async function getProPrice(): Promise<string | null> {
  if (!ImasuguNative) return null;
  try {
    const product = await ImasuguNative.getProduct(PRO_PRODUCT_ID);
    return product?.displayPrice ?? null;
  } catch {
    return null;
  }
}

/** 「Pro＋応援」（非消耗型・Pro付与）を購入。Expo Go ではモックで purchased。 */
export async function purchaseSupport(): Promise<PurchaseResult> {
  if (!ImasuguNative) return 'purchased';
  try {
    return mapPurchase(await ImasuguNative.purchaseProduct(SUPPORT_PRODUCT_ID));
  } catch {
    return 'failed';
  }
}

/** 応援の表示価格（取得できなければ null）。 */
export async function getSupportPrice(): Promise<string | null> {
  if (!ImasuguNative) return null;
  try {
    const product = await ImasuguNative.getProduct(SUPPORT_PRODUCT_ID);
    return product?.displayPrice ?? null;
  } catch {
    return null;
  }
}
