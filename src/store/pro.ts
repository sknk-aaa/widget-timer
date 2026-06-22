import { create } from 'zustand';
import { purchaseService, getProPrice } from '../native/purchases';

interface ProState {
  isPro: boolean;
  price: string | null;
  load: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  price: null,
  load: async () => {
    const isPro = await purchaseService.isPro();
    set({ isPro });
    const price = await getProPrice();
    set({ price });
  },
  purchase: async () => {
    const ok = await purchaseService.purchasePro();
    if (ok) set({ isPro: true });
    return ok;
  },
  restore: async () => {
    const ok = await purchaseService.restore();
    set({ isPro: ok });
    return ok;
  },
}));
