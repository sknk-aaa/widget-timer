# AGENTS.md — 今すぐタイマー / Tappri（widget-timer）

> 同dirの `CLAUDE.md` も同じ内容（併設）。共通ルールは `/home/aaa/project/AGENTS.md`、その上に本ファイルが乗る。

ウィジェットからワンタップ起動する **iOS 26+ 専用**の相対カウントダウンタイマー。英語名 **Tappri**（ストア表記「Tappri: Widget Timer」）／日本語名「今すぐタイマー」。**Expo(React Native) ＋ Drizzle/expo-sqlite ＋ Zustand**。

**二層構成**: ネイティブ（AlarmKit / WidgetKit / ActivityKit / StoreKit2）は `src/native/*` のインターフェース裏に隠し、**Expo Go ではモック、TestFlight では実装**に差し替える。`targets/widget/*` が WidgetKit 拡張、`modules/imasugu-native/*` がアプリ内 AlarmKit/StoreKit ブリッジ。

## 事業/マーケ方針

- このアプリは「作って終わり」ではなく、App Storeで公開し、ストア訴求・スクリーンショット・SNS/動画施策・レビュー獲得・ASO・価格/Pro導線まで改善して売上を作る前提のプロダクト。
- 日本向けではアプリ名「今すぐタイマー」を主役にする。英語名 Tappri は海外/補助文脈で使い、日本向けストア画像では前面に出しすぎない。
- 判断軸は「ウィジェットから即開始できる価値が初見で伝わるか」「日常タイマーとして信頼できるか」「iOSらしく安っぽく見えないか」「課金導線が押し売りに見えないか」。
- マーケ施策、ストア画像方針、SNS/動画台本、価格/アイコンAB案は `docs/MARKETING.md` に蓄積する。

## 固有の厳守事項

- **アイコンは絵文字禁止**。白グリフの画像アイコン（`src/ui/icons/registry.tsx` の react-native-svg）を使う。プリセットは「白アイコン＋背景色」で識別する（表示名は任意で付けられ、あればタイルにも出る）。
- **iOS 26+ / iPhone のみ / 日英2言語**（`src/i18n` で端末ロケール選択）。iOS 26 未満のフォールバックは作らない。
- **プライバシー: 全データ端末内・外部送信なし**。分析SDK等を入れない（Nutrition Label「データ収集なし」を維持）。課金は **StoreKit 2 直実装**（Pro ¥500 / Pro＋応援 ¥2000=Proも付与、の2製品。RevenueCat 不採用）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない。`src/native/*` のインターフェースを保ち、Expo Go モックと実機実装の両方を壊さない。
- DBスキーマ変更時は `src/db/schema.ts` と起動時DDL `src/db/migrate.ts` の**両方**を更新。
- 変更後は `npx tsc --noEmit` と（可能なら）`npx expo export --platform ios` で検証してから commit。

## 品質バー

- **App Store リリース級の品質**。UX はネット調査して作り込む（時間より品質を優先）。

## 識別子・配信（詳細は `docs/OPERATIONS.md`）

- bundle id: `com.sknk.imasugutimer`
- App Group: `group.com.sknk.imasugutimer`
- Apple Team ID: `3H2LBDNPMU`
- App Store ID: `6782746504`
- CI: `.github/workflows/ios.yml`（TestFlight, fastlane match）。`gp` で起動（共通 AGENTS.md §5）。

## ウィジェット/通知の設計指針（実装で確定した方針）

- ホーム/ロック画面ウィジェットは**起動ランチャー専用**（実行中カウント・操作ボタンは出さない）。WidgetKit のリロード遅延で状態の即時反映ができないため。複数ボード（欄）は構成可能ウィジェット（`AppIntentConfiguration` ＋ `SelectBoardIntent`）で出し分ける。
- **実行中の表示・操作は Live Activity とアプリ側に集約**（どちらも即時反映）。
- AlarmKit の Live Activity ボタン用 alarmID は `TimerMetadata.alarmID` に埋め込み、`context.attributes.metadata` から取得する（`context.state.alarmID` は使わない）。
- 通知をスワイプで消してもアラームは鳴る（AlarmKit/iOS の仕様。塞ぐAPI無し）。

## 現状

- **App Store 審査に初回提出済み（2026-06-27）。** 最新状態・残タスク・既知の問題は `docs/HANDOFF.md`。

## doc 索引

- `SPEC.md` … 製品要件（正）
- `docs/DESIGN.md` … 実装設計
- `docs/OPERATIONS.md` … 識別子・CI/CD・配信・プライバシー
- `docs/NATIVE.md` … Phase2 ネイティブ（AlarmKit/ウィジェット/Live Activity）のビルド・検証
- `docs/HANDOFF.md` … 現状・残タスク
- `docs/MARKETING.md` … ストア訴求・SNS・動画台本・ABテスト案
