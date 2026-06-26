import { create } from 'zustand';
import { purchaseService, getProPrice, getSupportPrice, purchaseSupport } from '../native/purchases';
import type { PurchaseResult } from '../native/types';

interface ProState {
  isPro: boolean;
  price: string | null;
  supportPrice: string | null;
  /** 起動時: 所有状態＋価格を取得。 */
  load: () => Promise<void>;
  /** フォアグラウンド復帰時など: 所有状態だけ再確認（外部購入/承認の反映）。 */
  refresh: () => Promise<void>;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  /** 「Pro＋応援」（非消耗型・Proも付与）。 */
  support: () => Promise<PurchaseResult>;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  price: null,
  supportPrice: null,

  load: async () => {
    const isPro = await purchaseService.isPro();
    set({ isPro });
    const price = await getProPrice();
    const supportPrice = await getSupportPrice();
    set({ price, supportPrice });
  },

  refresh: async () => {
    const isPro = await purchaseService.isPro();
    set({ isPro });
  },

  purchase: async () => {
    const result = await purchaseService.purchasePro();
    if (result === 'purchased') set({ isPro: true });
    return result;
  },

  restore: async () => {
    const ok = await purchaseService.restore();
    set({ isPro: ok });
    return ok;
  },

  support: async () => {
    const result = await purchaseSupport();
    if (result === 'purchased') set({ isPro: true });
    return result;
  },
}));
