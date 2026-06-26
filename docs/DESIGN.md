# 実装設計（今すぐタイマー）

製品要件は [SPEC.md](../SPEC.md) が正。本書は**実装の設計**（構成・データモデル・主要フロー・技術判断）を扱う。

## 技術スタック

- Expo SDK 54 / React Native 0.81 / React 19（New Architecture）※Expo Go対応SDKに合わせて54を採用
- expo-router（ファイルベース。メイン1画面＋モーダル）
- 状態管理: Zustand / DB: Drizzle ORM + expo-sqlite
- アニメーション: react-native-reanimated 4（+ react-native-worklets）/ ジェスチャ: react-native-gesture-handler
- アイコン: react-native-svg による自作の白グリフ（絵文字は使わない）
- iOS 26+ 専用（AlarmKit 前提）。iPhone のみ。

## ディレクトリ

```
app/                 expo-router ルート（画面）
  _layout.tsx        プロバイダ / DB初期化 / 1秒クロック / モーダル定義
  index.tsx          メイン画面（全プリセット＋ボードタブ＋実行中ドック＋FAB）
  onboarding.tsx     初回オンボーディング（3ページ＋先頭にブランド）
  how.tsx            ウィジェット追加方法（動画・スマホフレーム・日英）
  preset.tsx / quick.tsx / settings.tsx / paywall.tsx / welcome-pro.tsx / faq.tsx
src/
  domain/            型・整形・色パレット・定数・UUID
  db/                schema / client / repo / migrate（起動時DDL）
  store/             zustand（presets, boards, timers, pro, settings, clock, bootstrap）
  native/            ネイティブ抽象化（alarm/widget/liveActivity/purchases）＋ env
  i18n/              ja/en（起動時の端末ロケールで選択）
  ui/                theme / motion / haptics / icons / components
```

## データモデル（SQLite）

- `presets`: id, name(任意・既定空), icon, color, duration_sec, sound, in_widget(bool), sort_order
- `running_timers`: id, preset_id?, icon, color, duration_sec, sound, end_at(epoch ms), state(running|paused|finished), paused_remaining_sec?, created_at
- `boards`: id, name(任意), sort_order ＝ ウィジェット欄。ホームに置ける1枚に対応
- `board_presets`: board_id, preset_id, sort_order ＝ ボード↔プリセットの多対多（順序つき。同一プリセットを複数ボードに置ける）
- `launch_history`: id, preset_id?, duration_sec, started_at, source(app|widget|liveactivity|quick)
- `meta`: key/value（onboarding_done, alert_sound, haptics_enabled, seeded 等）

プリセットは**任意の表示名**を持てる（既定は空。空ならアイコン＋色のみで識別、名前があればタイルにも表示）。アラート音はプリセットごとに選べる。実行中タイマーは起動時点の icon/color/duration/sound を**スナップショット**で保持し、元プリセットの削除・変更に影響されない。

**ボード（欄）モデル**: 「全てのプリセット」（マスター・常に全件）＋複数ボード。マスターからボードへドラッグで**追加**（マスターは保持＝`board_presets` に行追加）。各ホームウィジェットは構成可能ウィジェット（`SelectBoardIntent`／`BoardEntity`）で表示ボードを選ぶ。無料=1ボード×3プリセット（`FREE_BOARDS`/`FREE_PRESETS_PER_BOARD`）、Pro=ボード/プリセット無制限。

## 主要フロー

- **起動**: `timers.start()` → DB記録 → 履歴記録 → `alarmService.schedule` → `liveActivityService.start` → `widgetService.reloadTimelines`。
- **一時停止/再開**: ネイティブ一時停止APIが無い前提で「cancel → 残秒保持 → 再スケジュール」方式（SPEC 3.3）。
- **完了**: 1秒クロックの `reconcile()` が満了 running を `finished` に遷移（Live Activity終了＋成功ハプティクス）。ドックに「終了・タップで消去」を表示し、タップで `dismiss()`。
- **復元**: 起動時 `bootstrap()` が `end_at` と現在時刻から再計算（kill中の満了も整合）。
- **時刻表示**: `end_at` はエポックで保持し表示時にローカル変換。72時間級は「○日 HH:MM:SS」表示（`domain/format.ts`）。

## ネイティブ抽象化（Phase の肝）

`src/native/*` がインターフェースを定義し、Expo Go ではモック、TestFlight ビルドでは実ネイティブに差し替える。

- `env.hasNativeModules = iOS && !ExpoGo` で分岐。
- Phase1（Expo Go）: AlarmKit→expo-notifications、Widget/LiveActivity→no-op、StoreKit→meta フラグ。
- Phase2（TestFlight）: AlarmKit / WidgetKit / ActivityKit / StoreKit2 の実装を同インターフェースで注入。

これにより**JS UI は Expo Go で完全に動作確認でき**、ネイティブ依存は実機（TestFlight）で確認する分業が成立する。

## ダイヤル（中心インタラクション）

`ui/components/Dial.tsx`。累積回転方式（finger の角度差分を積分。12時シームを ±π で巻き戻し）で 0〜7日を扱う。単位タブ（日/時/分/秒）が1目盛り=1単位を切替、6°/目盛り、目盛りごとに選択ハプティクス。クイックチップ（1〜60分）と ±ステッパ（長押し加速）を併設。VoiceOver は `adjustable`（increment/decrement で1単位）。

## デザインシステム

- `ui/theme.ts`: ライト/ダークのセマンティックトークン。アクセントは「今」を表すオレンジ `#FF6A1A`。
- 署名要素: 白グリフ＋カラーグラデのスクワークル型タイル（色付きグロー影）。
- 白アイコンは色背景に対し概ね 3:1 以上のコントラストを確保（`domain/colors.ts`）。
- `ui/motion.ts` / `ui/haptics.ts`: iOS ネイティブ感に寄せた spring/timing と、HIG準拠の触覚マッピング（tick=selection、start/finish=success、remove=rigid 等）。Reduce Motion 準拠。
- アプリアイコン: ストップウォッチ（ダイヤルのモチーフと連動）。`assets/icon.png`。

## スコープ

製品スコープ・非対象は SPEC.md §1/§8 を参照。**分析画面はv1で不採用**（SPEC §3.9 は対象外に変更）。Pro 特典はボード/プリセットの無制限（`domain/types.ts` の `FREE_BOARDS`/`FREE_PRESETS_PER_BOARD`）。時間入力はホイールピッカー（`WheelPicker`/`ClockWheel`）。日英2言語（`src/i18n`）。
