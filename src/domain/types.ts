export type IconId = string;
export type ColorId = string;

export type TimerState = 'running' | 'paused' | 'finished';
export type TimerSource = 'app' | 'widget' | 'liveactivity' | 'quick';

export interface Preset {
  id: string;
  /** 任意の表示名（空文字＝名前なし）。アイコンの上に表示される。 */
  name: string;
  icon: IconId;
  color: ColorId;
  durationSec: number;
  inWidget: boolean;
  sortOrder: number;
  /** アラート音ID（'default' またはバンドル音名）。 */
  sound: string;
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
  /** アラート音ID（起動時点のスナップショット）。 */
  sound: string;
}

export const MAX_DURATION_SEC = 604800; // 7日
export const FREE_WIDGET_SLOTS = 3;

// アラート音ID。'default'=iPhone標準音、その他は assets/sounds/<id>.mp3。i18n の sounds と一致。
export const SOUND_IDS = ['default', 'xylophone', 'digital', 'whale'] as const;
export type SoundId = (typeof SOUND_IDS)[number];
