import type { PurchaseService } from './types';
import { getMeta, setMeta } from '../db/repo';

const PRO_KEY = 'pro_owned';

/**
 * Phase1: meta テーブルに Pro 所有フラグを保存するモック（Expo Go で課金フローを試せる）。
 * Phase2: StoreKit 2（買い切り非消耗型）の実装に差し替える。
 */
export const purchaseService: PurchaseService = {
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
