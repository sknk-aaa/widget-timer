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
  /** 旧モデルの名残（ウィジェット表示フラグ）。新モデルでは board_presets で管理するため未使用。 */
  inWidget: boolean;
  sortOrder: number;
  /** アラート音ID（'default' またはバンドル音名）。 */
  sound: string;
}

/** ウィジェット欄（ホームに置ける1枚＝1ボード）。プリセットを多対多で持つ。 */
export interface Board {
  id: string;
  name: string;
  sortOrder: number;
}

/** ボードに属するプリセット（順序つき・多対多）。 */
export interface BoardPreset {
  boardId: string;
  presetId: string;
  sortOrder: number;
}

/** 無料プラン上限：ウィジェット欄1つ・1欄あたりプリセット3つ。Pro で無制限。 */
export const FREE_BOARDS = 1;
export const FREE_PRESETS_PER_BOARD = 3;

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

// アラート音ID。'default'=iPhone標準音、その他は assets/sounds/<id>.mp3。i18n の sounds と一致。
export const SOUND_IDS = ['default', 'xylophone', 'digital', 'whale'] as const;
export type SoundId = (typeof SOUND_IDS)[number];
