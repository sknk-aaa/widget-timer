# Handoff

最終更新: 2026-06-22

## 現状

Phase 1（JSアプリ）＋ Phase 2（ネイティブ中核）まで実装し、**GitHub Actions → TestFlight 実機で動作確認済み**。AlarmKit タイマー、ホーム/ロック画面ウィジェット、Live Activity（通知）が実機で機能している。`tsc --noEmit` と `expo export --platform ios` はパス。

実装済み（実機で確認済み）:
- **起動経路**: アプリ内タップ／ホーム画面ウィジェット（タップ→アプリ起動して開始）／ロック画面ウィジェット（タップ→Face ID等の認証後に無音起動）。
- **AlarmKit タイマー**: スケジュール／一時停止／再開／終了。消音・集中モードを貫通して鳴る。
- **Live Activity（ロック画面/Dynamic Island）**: 残り時間カウントダウン＋終了/一時停止/再開ボタン。アプリ・通知・ウィジェットのどこから操作しても整合（ウィジェットへの反映のみ WidgetKit 遅延あり）。
- **ウィジェット（ホーム/ロック）= 起動ランチャー専用**（後述の決定事項参照）。
- メイン: プリセット2エリア（タップ即起動/長押し並び替え/編集ボタン）、実行中ドック、今すぐFAB、ホイールピッカー、オンボーディング、設定、ペイウォール。
- DB(Drizzle+expo-sqlite,起動時DDL)・Zustand・ネイティブ抽象化（Expo Goモック／実機実装の二層）・白アイコン・ダーク・触覚/モーション・アクセシビリティ・CI/配信。

## 次のセッションでやること（優先順）

1. **App Store Connect の外部設定（コードは完了済み）**:
   - **買い切りIAP `com.sknk.imasugutimer.pro` を作成**（非消耗型）。これが「配信可能」になるまでは `getProduct` が nil＝ペイウォールに価格が出ず購入も失敗（コードはエラーにせずグレースフルに処理する）。
   - **プライバシーポリシーを公開**: `legal/privacy.html` を GitHub Pages 等でホストし、URLが `src/domain/links.ts` の `PRIVACY_URL` と一致するか確認（不一致なら更新）。利用規約は Apple 標準EULAを使用（ホスト不要）。
   - 必要なら `CONTACT_URL`（既定: 開発者メール）を変更。
2. **App Store 申請準備**: スクショ・説明文・Privacy Nutrition Label（「データ収集なし」）。
3. 細かなUX微調整（実機フィードバック反映）。

### 課金（StoreKit2）実装状況 — 完了

- ネイティブ: `modules/imasugu-native`（getProduct / purchaseProduct / restorePurchases / isProPurchased ＋ **Transaction.updates リスナーで外部トランザクションを finish**）。
- JS: `src/native/purchases.ts`（購入結果を purchased/pending/cancelled/failed に正規化、価格取得はネットワーク例外でも落ちない）、`src/store/pro.ts`（load/refresh/purchase/restore）。
- UI: `app/paywall.tsx`（承認待ち/失敗/キャンセルを区別、復元中表示）、`app/settings.tsx`（Pro有効表示＋復元）、`app/preset.tsx`＋ドラッグで枠超過時にペイウォール。
- フォアグラウンド復帰で `useProStore.refresh()`（外部購入/Ask to Buy 承認を反映）。
- Expo Go ではモック（meta フラグ）で動作。実購入の確認は IAP 作成後の TestFlight/Sandbox。

## 決定事項（重要・実装で確定）

- **ウィジェット（ホーム/ロック）は起動ランチャー専用**。実行中カウント・操作ボタンは出さない。理由: WidgetKit のタイムライン更新は予算制で遅延し、外部操作の即時反映ができないため。**実行中の表示・操作は Live Activity（通知）とアプリに集約**（どちらも即時）。
- **コントロール（iOS18 Control）は削除**。理由: 1コントロール=1プリセット・モノクロで分かりにくい。ロック画面からの起動はウィジェットに一本化（ただしウィジェット操作は iOS 仕様で**デバイス認証が必要**＝Face IDのチラ見/パスコード）。認証ゼロのロック画面起動が必要になったら Control を再追加するしかない。
- **アプリ内の一時停止/再開は AlarmKit `pause`/`resume`**（旧: cancel→再スケジュール）。理由: cancel すると Live Activity が消えて再開時に作り直されるため。
- **Live Activity のボタンが使う alarmID は `TimerMetadata.alarmID`（メタデータ）から取得**。`context.state.alarmID` は実SDKで信頼できず使わない。
- **App Group 上の UUID は小文字に正規化**。JS(`crypto.randomUUID`)は小文字、Swift `uuidString` は大文字で、ID照合が一致しない不具合があったため全箇所小文字化。
- **`gp` デプロイショートカット**: ユーザーが `gp` と打つと push＋`ios.yml`（TestFlight）起動（`/project/AGENTS.md` §5）。

## 既知の問題 / 制約（iOS仕様で対応不可を含む）

- **通知をスワイプで消してもアラームは鳴る**（AlarmKit/iOS の仕様。非表示化APIも消去検知コールバックも無い）。ユーザー合意済み。
- **ロック画面ウィジェットのタップ操作はデバイス認証が必要**（iOS のインタラクティブウィジェット仕様）。認証なしは Control のみ。
- **ホーム/ロックのウィジェット自体の更新遅延**は WidgetKit 仕様（ランチャー専用化で「状態反映の遅延」問題自体は回避済み）。
- **StoreKit2 IAP 未作成**（ASC に `com.sknk.imasugutimer.pro` を作る必要。コードは実装済み）。
- **プライバシーポリシー未ホスト**（`legal/privacy.html` を公開して `PRIVACY_URL` と一致させる必要）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない（モック）。本物の挙動は TestFlight でのみ。
