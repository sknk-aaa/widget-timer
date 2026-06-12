import { create } from 'zustand';
import { purchaseService } from '../native/purchases';

interface ProState {
  isPro: boolean;
  load: () => Promise<void>;
  purchase: () => Promise<boolean>;
  restore: () => Promise<boolean>;
}

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  load: async () => {
    const isPro = await purchaseService.isPro();
    set({ isPro });
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
