# Handoff

最終更新: 2026-07-06

## 現状

**App Store 公開済み。** 現在は公開後改善フェーズ。日英2言語（英語名 **TimerTiles** / ストア表記「TimerTiles: Widget Timer」、日本語名「今すぐタイマー」）。初回提出ビルド = GitHub Actions run `28249253876`（commit `8a67567`、提出時英語名はTappri）。初回リリースはユーザーが手動で実施済み。

2026-07-06 までの追加修正:
- **公開後の次バージョン申請用に `CFBundleShortVersionString` を `1.0.2` へ更新済み**。`1.0.1` はApp Store Connect上でpre-release trainが閉じており、新規ビルド提出が拒否されたため。commit `af724c0` で更新し、Widget extension の `CFBundleShortVersionString` / `CFBundleVersion` も Fastlane で親アプリと揃えるようにした。
- **直近の `gp`**: commit `e70c1d5` まで push 済み、GitHub Actions `ios.yml` run `28781810286` は実行中（2026-07-06 18:30 JST時点）。直前の run `28780403530` / `28778938474` は成功済み。
- **TikTokプロフィール用LPをGitHub Pages向けに追加・調整済み**。公開URLは `https://sknk-aaa.github.io/widget-timer/tiktok/`。TikTok内でApp Store直リンクが開けない場合の中継ページとして使う。ストアリンクは `docs/tiktok/index.html` の `APP_STORE_URL` 1箇所で管理。
- **ウィジェット追加画面の日本語名表示を修正済み**（`targets/widget/assets/{ja,en}.lproj/Localizable.strings` で `widget.displayName` / `widget.description` を管理）。ユーザー実機確認で、日本語端末のWidget追加画面が「今すぐタイマー」になることを確認済み。
- **プリセットドラッグ並び替えの途中キャンセル問題を修正済み**。最終形は「ドラッグ中に `setBoardIds` / `setMasterIds` で配列を入れ替えない。浮いているタイルだけ動かし、`onFinalize` で最終位置を計算して確定」。ユーザー確認で「治った」と報告あり。
- **英語名は TimerTiles に決定し、コード/docsの英語表示名を更新済み**。日本語名は「今すぐタイマー」のまま。App Store Connect 側の英語タイトル/キーワード/説明は公開前に手動同期する。
- **ホーム/ロック画面ウィジェット起動の高速化を実施済み**。ユーザー実機確認で、ホーム画面からの起動は早くなり、ロック画面ウィジェットからも通知欄/Live Activity表示が復旧し起動が早いことを確認済み。
- **ロック画面ウィジェット起動後のLive Activity表示ラグ対策**として、Widgetの `Button` からプリセットIDだけでなく秒数/アイコン/色/音を直接 `StartPresetTimerWidgetIntent` に渡し、タップ後のApp GroupプリセットJSON再読込と成功ログを削った。`TimerLiveActivity()` は通知欄表示に必要なためWidgetBundle登録を維持する。
- **リリース前の安定化**として、AlarmKit予約失敗時のアプリ内タイマー表示ロールバック、プリセット編集画面から削除した時のボード再読込、App Group JSON読込の防御、権限拒否バナー強化、Pro＋応援ボタンの二重タップ防止を追加。
- **初期プリセットと初期ウィジェット欄を調整済み**。新規インストール時の枠1は空。全てのプリセットは「カップ麺 3分 / 仮眠 20分 / 読書 1時間」。プリセットアイコンとウィジェット表示アイコンの対応も改善済み。
- **ウィジェット追加方法を動画から日本語スライドへ変更済み**。`assets/howto/home_1..4.png` / `lock_1..3.png` を使い、ホーム/ロック画面タブごとに横スワイプで手順を見せる。PNGは16-bitから8-bitへ軽量化し、表示時の黒い待ち時間を減らした。旧ホーム/ロック追加動画はこの画面では使わない。
- **設定画面 / Pro導線を改善済み**。FAQ入口はメニューから削除。設定メニュー順は「ウィジェットの追加方法 / レビューして応援 / ご意見ご要望はこちら / 友だちにすすめる / 操作時の振動」。`Proでもっと自由に` カードはこの操作リストの下、`購入を復元` の直上へ移動。Pro画面は無料/Pro比較と機能カードで違いが伝わる構成に変更。

実装済み（実機/TestFlight で確認済み）:
- **起動経路**: アプリ内タップ／ホーム・ロック画面ウィジェット（タップ→起動）。ロック画面はデバイス認証後に起動。
- **AlarmKit タイマー**: スケジュール／一時停止／再開／終了。消音・集中モードを貫通して鳴る。プリセットごとにアラート音を選択可。
- **複数ボード（欄）**: 「全てのプリセット」（マスター）＋複数ボードのライブラリ方式。マスターからボードへドラッグで追加（マスターは保持）、同一プリセットを複数ボードに置ける。各ホームウィジェットは構成可能（長押し→ウィジェットを編集→表示ボード選択）で別ボードを表示。無料=1ボード×3プリセット、Pro=ボード/プリセット無制限。
- **Live Activity（ロック画面/Dynamic Island）**: 残り時間＋終了/一時停止/再開。
- **オンボーディング刷新**: 白背景3ページ（1:ワンタップ起動＋ブランド、2:消音/集中でも鳴る、3:開始）＋ウィジェット追加方法の日本語スライド（ホーム/ロック画面タブ、横スワイプ）。オンボ最後には「あとからメニューでも確認できます」を表示。
- **課金（StoreKit2 直実装）**: Pro（¥500・非消耗）／Pro＋応援（¥2000・非消耗、Proも付与）。復元・保留(Ask to Buy)・失敗を区別。
- 設定（メニューにカラーアイコン）、レビュー導線、ご意見フォーム（Tally）、操作時の振動切替、Pro導線。
- DB(Drizzle+expo-sqlite,起動時DDL)・Zustand・ネイティブ抽象化（Expo Goモック／実機実装）・白アイコン・ダーク・触覚/モーション・i18n(ja/en)・CI/配信。

## 公開後 / アップデート申請中の残作業

- `ios.yml` run `28781810286` の完了確認。成功後、必要なら App Store Connect でアップデート申請を手動で進める。リジェクト時の典型対応は `docs/OPERATIONS.md` のリリース前チェックを参照。
- 公開後の初速を見る。TikTok/X告知、TikTokプロフィールLP、App Storeページ、レビュー導線の反応を確認する。
- App Store Connect 側の英語名/説明/キーワード/スクショ文言が **TimerTiles: Widget Timer** と最新訴求に同期済みか確認する。提出時旧名は Tappri。
- App Store キーワードの見直し候補を App Store Connect に反映するか判断する（候補は `docs/MARKETING.md` の ASO メモ）。
- 不具合報告、クラッシュ、レビュー、低評価理由を優先して拾い、必要なら小さな修正アップデートを早めに出す。
- ストア説明・SNS・スクショ内で **iOS 26以降対応** を明記する（iOS 26未満は基本インストール不可なので、期待値ズレ防止）。
- 任意改善: SPEC/DESIGN とコードの細部同期（随時）、実機フィードバック反映。

## Codex作業メモ

- Codex Desktop / VSCode / CLI 間の引き継ぎはこの `docs/HANDOFF.md` を入口にする。
- App Store スクリーンショット生成は Codex Desktop の `$imagegen` を使う。内蔵画像生成は `gpt-image-2`。
- VSCode 上のCodexでは `OPENAI_API_KEY` 未設定のため、API経由の `gpt-image-2` 生成はしない。
- スクショ素材は `assets/screenshot/*.PNG`。生成・合成したストア画像の出力先は `output/store/`。
- 日本向けストア画像ではアプリ名「今すぐタイマー」を前面に出す。英語名 TimerTiles は補助扱い。
- App Store 用画像は 1290x2796 PNG を基本にし、実機スクショのUIは過度に改変しない。
- ChatGPT等の画像生成だけで作ったストア画像は、文字・端末スクショ・アイコン細部がボケたり溶けたりしやすい。仕上げ版は実スクショ素材＋フォント描画で再構成するのが安全。
- 生成/加工中の画像素材が `assets/screenshot/framed-screenshots/` と `output/store/` にある。現時点では未コミットの作業素材扱い。
- マーケ施策の蓄積は `docs/MARKETING.md` に集約する。

## 決定事項（重要・実装で確定）

- **ウィジェットは起動ランチャー専用**（実行中カウント・操作ボタンは出さない）。理由: WidgetKit のタイムライン更新は予算制で遅延し即時反映できないため。実行中の表示・操作は Live Activity とアプリに集約。
- **複数ボードは構成可能ウィジェット（AppIntentConfiguration＋`BoardEntity`/`SelectBoardIntent`）で実現**。App Intents のメタデータ（typeDisplayRepresentation/title 等）は**コンパイル時定数の文字列リテラル必須**、`parameterSummary`（`Summary { \.$board }`）が無いと「ウィジェットを編集」に欄選択が出ない。
- **コントロール（iOS18 Control）は不採用**。ロック画面起動はウィジェットに一本化（iOS仕様でデバイス認証が必要）。
- **アプリ内の一時停止/再開は AlarmKit `pause`/`resume`**（cancel すると Live Activity が消えるため）。
- **App Group 上の UUID は小文字に正規化**（JS小文字 / Swift `uuidString` 大文字の不一致対策）。
- **`gp` ショートカット**: ユーザーが `gp` と打つと push＋`ios.yml`（TestFlight）起動。
- **プリセットドラッグの実装方針**: ドラッグ中に並び替え配列を更新しない。配列を更新するとセルの `layout` 移動で Gesture がキャンセルされる。移動中は浮遊タイルだけ追従し、`onFinalize` で `absoluteX/Y` 基準の最終位置から確定する。

## 既知の問題 / 制約（iOS仕様で対応不可を含む）

- **通知をスワイプで消してもアラームは鳴る**（AlarmKit/iOS の仕様。非表示化APIなし）。ユーザー合意済み。
- **iOS 26+ 専用**。`deploymentTarget=26.0` / ネイティブモジュールも iOS 26.0 のため、iOS 26未満は基本インストール対象外。ストア訴求では「iOS 26以降対応」を明記する。
- **ロック画面ウィジェットのタップ操作はデバイス認証が必要**（iOSのインタラクティブウィジェット仕様）。
- **ウィジェット自体の更新遅延**は WidgetKit 仕様（ランチャー専用化で「状態反映の遅延」は回避済み）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない（モック）。本物の挙動は TestFlight のみ。
- プリセットドラッグ並び替えは Expo Go でも確認可能。Widget追加画面の表示名ローカライズは TestFlight/実機ビルドで確認する。

## 未コミット / 作業ツリー注意

- `assets/android-icon-background.png` / `assets/android-icon-foreground.png` / `assets/android-icon-monochrome.png` が削除状態。今回の作業では触っていないため、扱いはユーザー確認が必要。
- `assets/screenshot/` と `output/` にストア画像・フレーム画像の未追跡ファイルあり。必要な成果物だけ選んで後で整理・コミットする。
