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
    quickStart: 'タイマー',
    dragHint: 'タップで編集 ・ ドラッグで並べ替え（下＝ウィジェット表示）',
    edit: '編集',
    editDone: '完了',
    editExit: '編集を終了',
    settings: '設定',
    menu: 'メニュー',
  },

  preset: {
    newTitle: 'プリセットを作成',
    editTitle: 'プリセットを編集',
    duration: '時間',
    icon: 'アイコン',
    color: '色',
    sound: 'アラート音',
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
    support: '開発者を応援',
    supportThanks: '応援ありがとうございます！',
    replayTutorial: 'チュートリアルをもう一度見る',
    faq: 'よくある質問',
    about: 'アプリ情報',
    version: 'バージョン',
    contact: 'ご意見・ご要望',
    review: 'レビューして応援',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
  },

  faq: {
    title: 'よくある質問',
    items: [
      {
        q: 'マナーモードや集中モードでも鳴りますか？',
        a: 'はい。AlarmKit を使っているので、消音モードや集中モード中でも音と画面でお知らせします（通知の許可が必要です）。',
      },
      {
        q: 'ウィジェットの追加方法は？',
        a: 'ホーム画面の空いている所を長押し →「＋」→「今すぐタイマー」を選んで追加します。',
      },
      {
        q: 'プリセットをウィジェットに表示するには？',
        a: 'メイン画面で、そのプリセットを下の「ウィジェット表示」エリアにドラッグします。',
      },
      {
        q: '複数のタイマーを同時に使えますか？',
        a: 'はい。いくつでも同時に実行できます。',
      },
      {
        q: 'プリセットごとに音を変えられますか？',
        a: 'はい。プリセットの編集画面の「アラート音」で選べます。',
      },
      {
        q: 'Pro では何ができますか？',
        a: 'ウィジェットに表示できるプリセットの数が無制限になります。',
      },
      {
        q: 'データはどこに保存されますか？',
        a: 'すべて端末内に保存され、外部に送信されません（データ収集なし）。',
      },
      {
        q: '通知をスワイプで消すとどうなりますか？',
        a: 'アラーム自体は鳴ります（iOS の仕様）。止めるには通知の「終了」ボタンか、アプリ内から操作してください。',
      },
    ],
  },

  sounds: {
    default: '標準',
    xylophone: 'シロフォン',
    digital: 'デジタル',
    whale: 'クジラ',
  },

  pro: {
    title: 'Pro にアップグレード',
    headline: 'ウィジェットを、好きなだけ。',
    subtitle: 'よく使うタイマーを、全部ウィジェットに。',
    pillOnce: '買い切り',
    pillNoAds: '広告なし',
    pillNoData: 'データ収集なし',
    featureWidget: 'ウィジェット枠が無制限',
    featureWidgetSub: '無料の3枠を超えて、好きなだけプリセットをウィジェットに表示。',
    featureSupport: '個人開発を応援',
    featureSupportSub: 'あなたの購入が、今後のアップデートを支えます。',
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
