import { create } from 'zustand';
import { nowMs } from '../domain/format';

interface ClockState {
  now: number;
  set: (now: number) => void;
}

/** 1秒ごとに更新される共有クロック。残り時間表示はこれを参照して再計算する。 */
export const useClock = create<ClockState>((set) => ({
  now: nowMs(),
  set: (now) => set({ now }),
}));
