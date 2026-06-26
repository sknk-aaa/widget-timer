import { create } from 'zustand';
import { getMeta, setMeta } from '../db/repo';
import { alarmService } from '../native/alarm';
import { setHapticsEnabled } from '../ui/haptics';
import type { PermissionStatus } from '../native/types';

const ONBOARDING_KEY = 'onboarding_done';
const HAPTICS_KEY = 'haptics_enabled';

interface SettingsState {
  onboardingDone: boolean;
  hapticsEnabled: boolean;
  alarmPermission: PermissionStatus;
  load: () => void;
  completeOnboarding: () => void;
  setHapticsEnabled: (v: boolean) => void;
  refreshPermission: () => Promise<PermissionStatus>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  onboardingDone: false,
  hapticsEnabled: true,
  alarmPermission: 'undetermined',
  load: () => {
    const haptics = getMeta(HAPTICS_KEY) !== '0';
    setHapticsEnabled(haptics);
    set({
      onboardingDone: getMeta(ONBOARDING_KEY) === '1',
      hapticsEnabled: haptics,
    });
  },
  completeOnboarding: () => {
    setMeta(ONBOARDING_KEY, '1');
    set({ onboardingDone: true });
  },
  setHapticsEnabled: (v) => {
    setMeta(HAPTICS_KEY, v ? '1' : '0');
    setHapticsEnabled(v);
    set({ hapticsEnabled: v });
  },
  refreshPermission: async () => {
    const status = await alarmService.getPermission();
    set({ alarmPermission: status });
    return status;
  },
}));
