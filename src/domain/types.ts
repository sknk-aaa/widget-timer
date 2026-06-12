export type IconId = string;
export type ColorId = string;

export type TimerState = 'running' | 'paused' | 'finished';
export type TimerSource = 'app' | 'widget' | 'liveactivity' | 'quick';

export interface Preset {
  id: string;
  icon: IconId;
  color: ColorId;
  durationSec: number;
  inWidget: boolean;
  sortOrder: number;
}

export interface RunningTimer {
  id: string;
  presetId: string | null;
  icon: IconId;
  color: ColorId;
  durationSec: number;
  /** 終了予定時刻（エポックミリ秒）。paused 時は無効。 */
  endAt: number;
  state: TimerState;
  /** paused 時のみ有効な残り秒数。 */
  pausedRemainingSec: number | null;
  createdAt: number;
}

export interface LaunchHistory {
  id: number;
  presetId: string | null;
  durationSec: number;
  startedAt: number;
  source: TimerSource;
}

export const MAX_DURATION_SEC = 604800; // 7日
export const FREE_WIDGET_SLOTS = 3;
