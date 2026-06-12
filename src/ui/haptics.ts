import * as Haptics from 'expo-haptics';

// 設定で触覚をオフにできる。settings ストアが起動時/変更時に同期する。
let enabled = true;
export function setHapticsEnabled(v: boolean): void {
  enabled = v;
}

function impact(style: Haptics.ImpactFeedbackStyle) {
  if (!enabled) return;
  void Haptics.impactAsync(style);
}
function notify(type: Haptics.NotificationFeedbackType) {
  if (!enabled) return;
  void Haptics.notificationAsync(type);
}

export const haptics = {
  /** ダイヤルの目盛り・選択変更。 */
  tick: () => {
    if (enabled) void Haptics.selectionAsync();
  },
  /** タイマー開始（コミットされた成功操作）。 */
  start: () => notify(Haptics.NotificationFeedbackType.Success),
  /** タイマー終了（フォアグラウンド時）。 */
  finish: () => notify(Haptics.NotificationFeedbackType.Success),
  /** キャンセル・削除（取り除いた感触）。 */
  remove: () => impact(Haptics.ImpactFeedbackStyle.Rigid),
  /** 一時停止・再開。 */
  pauseResume: () => impact(Haptics.ImpactFeedbackStyle.Light),
  /** 主要ボタン。 */
  primary: () => impact(Haptics.ImpactFeedbackStyle.Medium),
  /** 軽いタップ・トグル。 */
  light: () => impact(Haptics.ImpactFeedbackStyle.Light),
  /** ドラッグ持ち上げ。 */
  pickup: () => impact(Haptics.ImpactFeedbackStyle.Medium),
  /** ドラッグ中の入れ替え。 */
  swap: () => impact(Haptics.ImpactFeedbackStyle.Light),
  /** 5目盛りごと等のランドマーク。 */
  landmark: () => impact(Haptics.ImpactFeedbackStyle.Light),
  warning: () => notify(Haptics.NotificationFeedbackType.Warning),
};
