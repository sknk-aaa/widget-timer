type MonetizationMode = 'free_plus_pro' | 'paid_upfront';

export const MONETIZATION_MODE: MonetizationMode = 'paid_upfront';

export const IS_PAID_UPFRONT = MONETIZATION_MODE === 'paid_upfront';
