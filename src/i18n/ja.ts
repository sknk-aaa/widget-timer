// 日本語。型の基準（Strings = typeof ja）。en.ts は同一構造で実装する。
export const ja = {
  appName: '今すぐタイマー',

  common: {
    close: '閉じる',
    cancel: 'キャンセル',
    ok: 'OK',
    delete: '削除',
    undo: '元に戻す',
  },

  main: {
    areaHidden: 'その他のプリセット',
    areaWidget: 'ウィジェット表示',
    widgetSlots: (used: number, max: number | '∞') => `${used} / ${max}`,
    quickStart: '今すぐ',
    dragHint: 'タップで編集 ・ ドラッグで並べ替え（下＝ウィジェット表示）',
    edit: '編集',
    editDone: '完了',
    editExit: '編集を終了',
    settings: '設定',
  },

  preset: {
    newTitle: 'プリセットを作成',
    editTitle: 'プリセットを編集',
    duration: '時間',
    icon: 'アイコン',
    color: '色',
    showInWidget: 'ウィジェットに表示',
    save: '保存',
    delete: '削除',
    deleteConfirm: 'このプリセットを削除しますか？実行中のタイマーは継続します。',
  },

  board: {
    addPreset: 'プリセットを追加',
    timerOf: (dur: string) => `${dur}のタイマー`,
    editHint: 'タップで編集。長押しで移動',
    launchHint: 'タップで起動。長押しで並び替え',
  },

  quick: {
    title: '今すぐタイマー',
    start: 'スタート',
    byDuration: '時間で指定',
    byClock: '時刻で指定',
    clockSummary: (clock: string, remaining: string) => `${clock} まで ・ あと ${remaining}`,
  },

  wheel: {
    day: '日',
    hour: '時',
    minute: '分',
    second: '秒',
  },

  timer: {
    pause: '一時停止',
    resume: '再開',
    cancel: 'キャンセル',
    ends: '終了',
    finished: '終了',
    pausedNow: '一時停止中',
    finishedHint: '終了 ・ タップで消去',
    tapToClear: 'タップで消去',
    cancelled: 'タイマーを削除しました',
  },

  settings: {
    title: '設定',
    sound: 'アラート音',
    haptics: '触覚フィードバック',
    feedback: 'フィードバック',
    pro: 'Pro',
    purchase: 'Pro を購入',
    restore: '購入を復元',
    about: 'アプリ情報',
    version: 'バージョン',
    contact: 'ご意見・ご要望',
    review: 'レビューして応援',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
  },

  sounds: {
    default: '標準',
    bell: 'ベル',
    chime: 'チャイム',
    marimba: 'マリンバ',
  },

  pro: {
    title: 'Pro にアップグレード',
    subtitle: '買い切り・サブスクリプションではありません',
    featureWidget: 'ウィジェット枠を無制限に',
    featureWidgetSub: '下エリアに好きなだけプリセットを並べられます',
    featureSupport: '個人開発を応援',
    featureSupportSub: '今後のアップデートを支えます',
    cta: '購入する',
    oneTime: '一度のお支払いでずっと使えます',
    restore: '購入を復元',
    restoring: '復元中…',
    restored: 'Pro を復元しました',
    notRestored: '復元できる購入が見つかりませんでした',
    purchased: 'Pro にアップグレードしました',
    pending: '購入の承認待ちです。承認されると自動で有効になります。',
    purchaseFailed: '購入を完了できませんでした。時間をおいて再度お試しください。',
    active: 'Pro 有効',
    activeSub: 'ご購入ありがとうございます',
    widgetLimit: '無料ではウィジェット枠は3つまでです。Pro で無制限になります。',
  },

  onboarding: {
    next: '次へ',
    start: 'はじめる',
    skip: 'スキップ',
    page1Title: 'ウィジェットからワンタップ',
    page1Body: 'よく使う時間をプリセットにして、ホーム画面のウィジェットから一瞬で起動。',
    page2Title: '時間になったら、確実に',
    page2Body: '許可すると、消音モードや集中モード中でも、終了を音と画面でお知らせします。アプリを閉じていても大丈夫です。',
    page2Cta: '通知を許可',
    page2Later: 'あとで',
    page3Title: 'ウィジェットを追加',
    page3Body: 'ホーム画面を長押し →「＋」→「今すぐタイマー」を選ぶと、ワンタップで起動できます。',
  },

  alarm: {
    permissionDenied: 'アラームを鳴らせません',
    permissionDeniedBody: '通知が許可されていないため、タイマー終了時に音が鳴りません。',
    openSettings: '設定を開く',
  },

  duration: {
    short: (d: number, h: number, m: number, s: number): string => {
      const parts: string[] = [];
      if (d > 0) parts.push(`${d}日`);
      if (h > 0) parts.push(`${h}時間`);
      if (m > 0) parts.push(`${m}分`);
      if (s > 0 && d === 0 && h === 0) parts.push(`${s}秒`);
      return parts.length ? parts.join('') : '0秒';
    },
    remainingDayPrefix: (days: number) => `${days}日 `,
  },
};

export type Strings = typeof ja;
