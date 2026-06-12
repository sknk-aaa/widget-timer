export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AlarmScheduleParams {
  timerId: string;
  durationSec: number;
  /** 終了予定時刻（エポックms）。 */
  endAt: number;
  icon: string;
  color: string;
}

export interface AlarmCapabilities {
  /** ネイティブの一時停止APIを持つか（無ければ cancel→reschedule 方式）。 */
  nativePause: boolean;
  /** AlarmKit による確実なアラート（消音/Focus貫通・全画面）を持つか。 */
  nativeAlarm: boolean;
}

/**
 * タイマー終了アラートの抽象。
 * Phase2: AlarmKit 実装 / Phase1: expo-notifications によるモック。
 */
export interface AlarmService {
  readonly capabilities: AlarmCapabilities;
  getPermission(): Promise<PermissionStatus>;
  requestPermission(): Promise<PermissionStatus>;
  schedule(params: AlarmScheduleParams): Promise<void>;
  cancel(timerId: string): Promise<void>;
}

/** ホーム画面ウィジェットのタイムライン制御。 */
export interface WidgetService {
  reloadTimelines(): Promise<void>;
}

export interface LiveActivityParams {
  timerId: string;
  endAt: number;
  icon: string;
  color: string;
  paused: boolean;
  pausedRemainingSec: number | null;
}

/** Live Activity（ロック画面 / Dynamic Island）制御。 */
export interface LiveActivityService {
  start(params: LiveActivityParams): Promise<void>;
  update(params: LiveActivityParams): Promise<void>;
  end(timerId: string): Promise<void>;
}

export interface PurchaseService {
  /** Pro 所有状態を返す。 */
  isPro(): Promise<boolean>;
  /** Pro を購入する。成功で true。 */
  purchasePro(): Promise<boolean>;
  /** 購入を復元する。Pro を所有していれば true。 */
  restore(): Promise<boolean>;
}
