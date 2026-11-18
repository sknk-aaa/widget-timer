type MonetizationMode = 'free_plus_pro' | 'free_unlimited' | 'paid_upfront';

export const MONETIZATION_MODE: MonetizationMode = 'free_unlimited';

const isMode = (mode: MonetizationMode) => MONETIZATION_MODE === mode;

export const IS_PAID_UPFRONT = isMode('paid_upfront');
export const IS_FREE_UNLIMITED = isMode('free_unlimited');
export const IS_ALL_FEATURES_UNLOCKED = !isMode('free_plus_pro');
