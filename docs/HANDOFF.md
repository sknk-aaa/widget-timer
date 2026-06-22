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

1. **StoreKit 2 実購入（課金）**: ネイティブ実装は `modules/imasugu-native`（getProduct/purchase/restore/isProPurchased）にあり、JSは `src/native/purchases.ts`。**App Store Connect で買い切りIAP `com.sknk.imasugutimer.pro` を作成**して実機確認するのが残り。現状は未着手（ユーザー指示で保留）。
2. **App Store 申請準備**: スクショ、説明文、Privacy Nutrition Label（「データ収集なし」）、本番プライバシー/利用規約URL（`src/domain/links.ts`）。
3. 細かなUX微調整（実機フィードバック反映）。

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
- **StoreKit2 IAP 未作成**（ASC に `com.sknk.imasugutimer.pro` を作る必要）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない（モック）。本物の挙動は TestFlight でのみ。
