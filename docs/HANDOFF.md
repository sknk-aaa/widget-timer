# Handoff

最終更新: 2026-06-30

## 現状

**App Store 審査に初回提出済み（2026-06-27）。** 日英2言語（英語名 **Tappri** / ストア表記「Tappri: Widget Timer」、日本語名「今すぐタイマー」）。提出ビルド = GitHub Actions run `28249253876`（commit `8a67567`）。`tsc --noEmit` と `expo export --platform ios` はパス。

実装済み（実機/TestFlight で確認済み）:
- **起動経路**: アプリ内タップ／ホーム・ロック画面ウィジェット（タップ→起動）。ロック画面はデバイス認証後に起動。
- **AlarmKit タイマー**: スケジュール／一時停止／再開／終了。消音・集中モードを貫通して鳴る。プリセットごとにアラート音を選択可。
- **複数ボード（欄）**: 「全てのプリセット」（マスター）＋複数ボードのライブラリ方式。マスターからボードへドラッグで追加（マスターは保持）、同一プリセットを複数ボードに置ける。各ホームウィジェットは構成可能（長押し→ウィジェットを編集→表示ボード選択）で別ボードを表示。無料=1ボード×3プリセット、Pro=ボード/プリセット無制限。
- **Live Activity（ロック画面/Dynamic Island）**: 残り時間＋終了/一時停止/再開。
- **オンボーディング刷新**: 白背景3ページ（1:ワンタップ起動＋ブランド、2:消音/集中でも鳴る、3:開始）＋ウィジェット追加方法の動画（ページ＋スマホフレーム、日英動画）。
- **課金（StoreKit2 直実装）**: Pro（¥500・非消耗）／Pro＋応援（¥2000・非消耗、Proも付与）。復元・保留(Ask to Buy)・失敗を区別。
- 設定（メニューにカラーアイコン）、FAQ、レビュー導線、ご意見フォーム（Tally）。
- DB(Drizzle+expo-sqlite,起動時DDL)・Zustand・ネイティブ抽象化（Expo Goモック／実機実装）・白アイコン・ダーク・触覚/モーション・i18n(ja/en)・CI/配信。

## 提出後の残作業

- **未ビルドのコミット `53832dc`**（権限文言「通知」→「アラーム」）は次アップデートのビルドに含める。
- 審査結果待ち。リジェクト時の典型対応は `docs/OPERATIONS.md` のリリース前チェックを参照。
- 審査通過後は自動リリースせず、TikTok/Xの告知準備と合わせて手動リリースする。
- 任意改善: SPEC/DESIGN とコードの細部同期（随時）、実機フィードバック反映。

## Codex作業メモ

- Codex Desktop / VSCode / CLI 間の引き継ぎはこの `docs/HANDOFF.md` を入口にする。
- App Store スクリーンショット生成は Codex Desktop の `$imagegen` を使う。内蔵画像生成は `gpt-image-2`。
- VSCode 上のCodexでは `OPENAI_API_KEY` 未設定のため、API経由の `gpt-image-2` 生成はしない。
- スクショ素材は `assets/screenshot/*.PNG`。生成・合成したストア画像の出力先は `output/store/`。
- 日本向けストア画像ではアプリ名「今すぐタイマー」を前面に出す。英語名 Tappri は補助扱い。
- App Store 用画像は 1290x2796 PNG を基本にし、実機スクショのUIは過度に改変しない。
- マーケ施策の蓄積は `docs/MARKETING.md` に集約する。

## 決定事項（重要・実装で確定）

- **ウィジェットは起動ランチャー専用**（実行中カウント・操作ボタンは出さない）。理由: WidgetKit のタイムライン更新は予算制で遅延し即時反映できないため。実行中の表示・操作は Live Activity とアプリに集約。
- **複数ボードは構成可能ウィジェット（AppIntentConfiguration＋`BoardEntity`/`SelectBoardIntent`）で実現**。App Intents のメタデータ（typeDisplayRepresentation/title 等）は**コンパイル時定数の文字列リテラル必須**、`parameterSummary`（`Summary { \.$board }`）が無いと「ウィジェットを編集」に欄選択が出ない。
- **コントロール（iOS18 Control）は不採用**。ロック画面起動はウィジェットに一本化（iOS仕様でデバイス認証が必要）。
- **アプリ内の一時停止/再開は AlarmKit `pause`/`resume`**（cancel すると Live Activity が消えるため）。
- **App Group 上の UUID は小文字に正規化**（JS小文字 / Swift `uuidString` 大文字の不一致対策）。
- **`gp` ショートカット**: ユーザーが `gp` と打つと push＋`ios.yml`（TestFlight）起動。

## 既知の問題 / 制約（iOS仕様で対応不可を含む）

- **通知をスワイプで消してもアラームは鳴る**（AlarmKit/iOS の仕様。非表示化APIなし）。ユーザー合意済み。
- **ロック画面ウィジェットのタップ操作はデバイス認証が必要**（iOSのインタラクティブウィジェット仕様）。
- **ウィジェット自体の更新遅延**は WidgetKit 仕様（ランチャー専用化で「状態反映の遅延」は回避済み）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない（モック）。本物の挙動は TestFlight のみ。
