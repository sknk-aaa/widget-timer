# ネイティブ実装（Phase 2）— ビルド/検証手順

iOS ネイティブ機能（AlarmKit / ホームウィジェット / iOS18 Control / Live Activity）の実装と検証手順。**Expo Go では動かない**（モックのまま）。検証は prebuild → EAS/GitHub Actions → **TestFlight 実機**ループ。

## どこに何があるか

- `targets/widget/`（`@bacons/apple-targets`）= Widget 拡張（Swift）
  - `Controls.swift` … iOS18 ControlWidget（コントロールセンター/ロック画面）＋設定ピッカー
  - `Intents.swift` … `StartPresetTimerIntent`（`AppIntent`+`LiveActivityIntent`）＋ AlarmKit スケジューラ
  - `TimerLiveActivity.swift` … AlarmKit が自動管理する Live Activity の表示テンプレ
  - `Widgets.swift` … ホーム画面ウィジェット（待機状態）
  - `Shared.swift` … App Group 読取モデル / `TimerMetadata` / 色
  - `WidgetBundle.swift` … `@main`
- `modules/imasugu-native/`（ローカル Expo モジュール）= アプリ内 AlarmKit ＋ App Group ミラー
- JS 側: `src/native/alarm/{index,native,mock}.ts`、`src/native/shared.ts`、`src/native/widget.ts`。`hasNativeModules && ImasuguNative` で実機実装に切替。

## 仕組み（ワンタップ起動）

Control のボタン → `StartPresetTimerIntent`（`LiveActivityIntent` なのでアプリ非前面のままアプリプロセスで実行）→ `AlarmManager.schedule(.timer)` → **Live Activity は OS が自動生成**（`Activity.request` は呼ばない）。プリセットは App Group の読取モデルから取得。

## 前提（実機検証に必須）

1. Apple Developer Program 登録。
2. `app.config.ts` の `@bacons/apple-targets` の `appleTeamId`（現状 `XXXXXXXXXX`）を実 Team ID に置換。
3. Apple Developer ポータルで **App Group `group.com.sknk.imasugutimer`** を登録し、アプリ＋拡張の両 App ID に付与。
4. `NSAlarmKitUsageDescription` は設定済み（`app.config.ts`）。
5. TestFlight 用 GitHub Secrets（OPERATIONS.md）。Xcode 16+ / macOS 必須（`ios.yml` は `macos-26`）。

## ビルド

```
npx expo prebuild -p ios --clean
```

apple-targets が Widget 拡張ターゲットを生成する。以降は `v*` タグ push か手動で `ios.yml` → TestFlight。

## ⚠️ 先に実機で de-risk（最優先）

「Control → AlarmKit（アプリ非前面）→ Live Activity 自動生成」の組み合わせは **Apple 公式サンプルに無い**。本実装に依存する前に、物理 iOS 26 端末で次を確認すること:

- Control ボタン → アプリが前面化せずに AlarmKit のタイマーが鳴る／Live Activity が出る
- 権限未取得の初回挙動（→ 権限はオンボーディングで前面取得し、Control は許可済み前提にする設計）

## Mac/Xcode で詰める統合タスク（このリポでは未確定）

1. **`appleTeamId` を実値に**（app.config）。
2. **`TimerMetadata` の型共有**: `modules/imasugu-native` 側 `AppTimerMetadata` と拡張側 `TimerMetadata` は**同一型である必要**（Live Activity 一致のため）。共有 Swift ファイル化 or 同一定義を両ターゲット所属にして1つに統一する。現状は重複定義。
3. **App Intent のターゲット所属**: `StartPresetTimerIntent` をアプリ本体と拡張の**両ターゲット**に含める（`LiveActivityIntent` のバックグラウンド・アプリプロセス実行のため）。
4. **AlarmKit API 検証**: `AlarmManager.schedule` / `.timer` / `AlarmAttributes` / `AlarmButton` / `AlarmPresentation` の正確なシグネチャを iOS 26 SDK で確認・調整。
5. **Live Activity のカウントダウン**: `TimerLiveActivity.swift` の `CountdownText` は `AlarmPresentationState` から終了日時を取得して `Text(timerInterval:)` に差し替え（現在は仮表示）。
6. **App Group entitlement** をアプリ＋拡張の provisioning に反映（fastlane/match と整合）。

## 端末検証チェックリスト

- Control をコントロールセンター/ロック画面に追加 → プリセット選択 → タップでアプリ非前面のまま起動
- ホームウィジェット（small/medium）のボタンで起動、実行中は残り時間表示
- Live Activity（ロック画面/Dynamic Island）の残り時間・停止
- 複数同時、消音/集中モード貫通、再起動後の整合
- 権限拒否時の導線
