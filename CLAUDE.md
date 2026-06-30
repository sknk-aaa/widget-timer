# 今すぐタイマー（AI向け）

ウィジェットからワンタップ起動する iOS 26+ 専用の相対カウントダウンタイマー。Expo(React Native)＋Drizzle/expo-sqlite＋Zustand。ネイティブ（AlarmKit/WidgetKit/ActivityKit/StoreKit2）は `src/native/*` のインターフェース裏に隠し、Expo Go ではモック、TestFlight では実装に差し替える二層構成。製品要件は SPEC.md、実装設計は docs/DESIGN.md。

## このアプリ固有の厳守事項

- **アイコンは絵文字禁止。** 白グリフの画像アイコン（`src/ui/icons/registry.tsx` の react-native-svg）を使う。プリセットは「白アイコン＋背景色」で識別する（表示名は任意で付けられ、あればタイルにも出る）。
- **iOS 26+ / iPhone のみ / 日英2言語**（`src/i18n` で端末ロケール選択）。iOS 26 未満のフォールバックは作らない。
- **プライバシー: 全データ端末内・外部送信なし。** 分析SDK等を入れない（Nutrition Label「データ収集なし」を維持）。課金は StoreKit 2 直実装（RevenueCat 不採用）。
- **Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない。** 触る場合は `src/native/*` のインターフェースを保ち、Expo Go 用モックと実機実装の両方を壊さないこと。
- 変更後は `npx tsc --noEmit` と（可能なら）`npx expo export --platform ios` で検証してから commit。
- DBスキーマ変更時は `src/db/schema.ts` と起動時DDL `src/db/migrate.ts` の両方を更新。

## doc 索引

- SPEC.md … 製品要件（正）
- docs/DESIGN.md … 実装設計
- docs/OPERATIONS.md … 識別子・CI/CD・配信・プライバシー
- docs/NATIVE.md … Phase2 ネイティブ（AlarmKit/ウィジェット/Control/Live Activity）のビルド・検証手順
- docs/HANDOFF.md … 現状・残タスク
- docs/MARKETING.md … ストア訴求・SNS・動画台本・ABテスト案
