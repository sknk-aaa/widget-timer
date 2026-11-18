import { create } from 'zustand';
import { IS_ALL_FEATURES_UNLOCKED, IS_FREE_UNLIMITED, IS_PAID_UPFRONT } from '../domain/monetization';
import { purchaseService, getProPrice, getSupportPrice, purchaseSupport } from '../native/purchases';
import type { PurchaseResult } from '../native/types';

interface ProState {
  isPro: boolean;
  price: string | null;
  supportPrice: string | null;
  /** 起動時: 所有状態＋価格を取得。 */
  load: () => Promise<void>;
  /** ペイウォール用の価格だけ取得。起動表示はブロックしない。 */
  loadPrices: () => Promise<void>;
  /** フォアグラウンド復帰時など: 所有状態だけ再確認（外部購入/承認の反映）。 */
  refresh: () => Promise<void>;
  purchase: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  /** 「Pro＋応援」（非消耗型・Proも付与）。 */
  support: () => Promise<PurchaseResult>;
}

export const useProStore = create<ProState>((set, get) => ({
  isPro: IS_ALL_FEATURES_UNLOCKED,
  price: null,
  supportPrice: null,

  load: async () => {
    if (IS_ALL_FEATURES_UNLOCKED) {
      set({ isPro: true });
      await get().loadPrices();
      return;
    }
    const isPro = await purchaseService.isPro();
    set({ isPro });
    await get().loadPrices();
  },

  loadPrices: async () => {
    if (IS_FREE_UNLIMITED) {
      set({ price: null, supportPrice: null });
      return;
    }
    if (IS_PAID_UPFRONT) {
      const supportPrice = await getSupportPrice();
      set({ price: null, supportPrice });
      return;
    }
    const price = await getProPrice();
    const supportPrice = await getSupportPrice();
    set({ price, supportPrice });
  },

  refresh: async () => {
    if (IS_ALL_FEATURES_UNLOCKED) {
      set({ isPro: true });
      return;
    }
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
    set({ isPro: IS_ALL_FEATURES_UNLOCKED || ok });
    return ok;
  },

  support: async () => {
    const result = await purchaseSupport();
    if (result === 'purchased') set({ isPro: true });
    return result;
  },
}));
