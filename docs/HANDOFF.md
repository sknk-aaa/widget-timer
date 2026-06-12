# 現状・残タスク（今すぐタイマー）

最終更新: 2026-06-12

## 現状（Phase 1 完了）

Expo Go で動作する JS アプリ一式が完成。`tsc --noEmit` と `expo export --platform ios`（JSバンドル）はパス。

実装済み:

- メイン画面（プリセット上/下2エリア、長押し編集モード＝ぷるぷる＋ドラッグでエリア移動／並べ替え、下エリア3枠の無料制限→ペイウォール）
- 実行中ドック（進捗リング、残り時間ライブ、一時停止/再開/キャンセル、完了演出＝終了表示＋タップ消去）
- ダイヤル（累積回転・単位タブ・クイックチップ・±ステッパ・触覚ティック・VoiceOver adjustable）をプリセット編集と今すぐタイマーで共有
- プリセット作成/編集（時間・白アイコン・背景色・ウィジェット表示トグル・削除・ライブプレビュー）
- オンボーディング（コンセプト→通知許可プライミング→ウィジェット案内）
- 設定（アラート音・触覚トグル・Pro/復元・アプリ情報）
- 分析（Proロック＋プレビュー、週/月/累計、起動回数・合計時間・プリセット別）
- ペイウォール（買い切り明記・特典・復元・プライバシー/利用規約リンク）
- DB（Drizzle+expo-sqlite、起動時DDL、デフォルト3プリセット投入）
- ネイティブ抽象化＋Expo Go モック（通知/フラグ）
- アプリアイコン＋スプラッシュ、ダーク/ライト、アクセシビリティ、Reduce Motion
- CI（typecheck＋バンドル）/ TestFlight ワークフロー / fastlane 一式

## 残タスク

### Phase 2（要実機・TestFlight）— ネイティブ
- `expo-apple-targets` or 既存パッケージ評価（`react-native-nitro-ios-alarm-kit` / `expo-alarm-kit`）→ `src/native/alarm` に実装注入
- AlarmKit カウントダウン（消音/Focus貫通・全画面アラート）、一時停止APIの有無を実機検証（SPEC §7）
- WidgetKit 拡張（待機=プリセットボタン／実行中=`Text(timerInterval:)`、App Intent でアプリを開かず起動）
- ActivityKit Live Activity（ロック画面/Dynamic Island、`Text(timerInterval:)`、一時停止は静的Textに切替）
- App Group 経由でウィジェット/Live Activity と最小状態を共有
- `src/native/widget.ts` / `liveActivity.ts` の no-op を実装に置換

### Phase 3 — 課金・最終化
- StoreKit 2（買い切り非消耗型）を `src/native/purchases.ts` に実装（現在は meta フラグのモック）
- 価格表示・本番プライバシー/利用規約URL（`src/domain/links.ts`）・問い合わせ先

## 既知の制約・注意

- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は**動かない**（モック）。実機確認は TestFlight。
- ドラッグの落下先判定はドロップ時にスロット計算する簡易方式。実機での操作感は要確認、必要なら調整。
- アラート音の選択は値の保持のみ（実発音は Phase2 の AlarmKit）。
- 識別子・Apple アカウント・Secrets は未設定。配信前に OPERATIONS.md 参照で用意。
