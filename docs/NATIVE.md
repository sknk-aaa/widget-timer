# ネイティブ実装（Phase 2）— 構成と検証手順

iOS ネイティブ機能（AlarmKit / ホーム・ロック画面ウィジェット / Live Activity / StoreKit2）の構成と検証手順。**Expo Go では動かない**（モックのまま）。検証は prebuild → GitHub Actions → **TestFlight 実機**ループ。**現在この一式は TestFlight 実機で動作確認済み**。

## どこに何があるか

- `targets/widget/`（`@bacons/apple-targets`）= Widget 拡張（Swift）
  - `Intents.swift` … `StartPresetTimerIntent`（起動）＋ `Cancel/Pause/ResumeAlarmIntent`（Live Activity ボタン用, すべて `LiveActivityIntent`）＋ `AlarmScheduler`（schedule / App Group 実行中モデル / markPaused / markResumed / cleanupRunning）
  - `TimerLiveActivity.swift` … Live Activity（ロック画面/Dynamic Island）。残り時間カウントダウン＋終了/一時停止/再開ボタン
  - `Widgets.swift` … ホーム＋ロック画面ウィジェット。**いずれも起動ランチャー専用**（実行中表示なし）。ホーム=`Link`でアプリ起動、ロック=`Button(intent:)`で無音起動
  - `Shared.swift` … App Group 読取モデル / `TimerMetadata` / 色 / `iconToSymbol` / `durationLabel` / `UUID.lower`
  - `WidgetBundle.swift` … `@main`（`PresetWidget` ＋ `TimerLiveActivity`）
- `modules/imasugu-native/`（ローカル Expo モジュール）= アプリ内 AlarmKit（schedule/pause/resume/cancel）＋ StoreKit2 ＋ App Group ミラー/取得
- JS 側: `src/native/alarm/{index,native,mock}.ts`、`src/native/shared.ts`、`src/native/widget.ts`、`src/native/purchases.ts`。`hasNativeModules && ImasuguNative` で実機実装に切替。

## 仕組み

- **起動**: ホームウィジェット → `imasugutimer://?start=ID` でアプリを開き `app/index.tsx` が起動。ロックウィジェット → `StartPresetTimerIntent`（`LiveActivityIntent`）で無音起動（要デバイス認証）。アプリ内 → `alarmService.schedule`。すべて `AlarmManager.schedule(.timer)` に集約し、**Live Activity は OS が自動生成**（`Activity.request` は呼ばない）。
- **操作**: Live Activity の終了/一時停止/再開ボタンは `Cancel/Pause/ResumeAlarmIntent` → `AlarmManager.stop|cancel|pause|resume(id:)`。alarmID は `context.attributes.metadata.alarmID` から取得（`context.state.alarmID` は使わない）。
- **整合**: ウィジェット/通知での停止・一時停止・終了は App Group（`shared_running_v1` / `cancelled_ids_v1`）に反映し、アプリは `importFromShared`（1秒間隔＋復帰時）で取り込む。**App Group 上の UUID は必ず小文字**（JSは小文字、Swiftの`uuidString`は大文字なので `UUID.lower` で正規化）。

## ⚠️ 設計上の固定ルール

- **`TimerMetadata` は2ターゲットで完全一致**（`targets/widget/Shared.swift` と `modules/imasugu-native/ios/ImasuguNativeModule.swift`）。フィールド: `presetID? / icon / colorID / alarmID`。ActivityKit は型名＋構造で Live Activity を照合するため、ズレると一致しない。
- **App Intent はウィジェット拡張ターゲットに置く**（現状これで `LiveActivityIntent` がアプリプロセスで実行され、schedule/stop/pause が機能している）。
- **ウィジェットは起動ランチャー専用**（実行中表示・操作ボタンを足さない）。状態反映は Live Activity ＋アプリに集約する方針（WidgetKit のリロード遅延のため）。

## ビルド

```
npx expo prebuild -p ios --clean
```

apple-targets が Widget 拡張ターゲットを生成。以降は `gp`（push＋手動 `ios.yml`）か `v*` タグ push で TestFlight。`appleTeamId`（app.config）は `3H2LBDNPMU` 設定済み。App Group `group.com.sknk.imasugutimer` は Apple Developer ポータルでアプリ＋拡張に付与済み。

## 端末検証チェックリスト

- ホームウィジェット → タップでアプリ起動＆開始。ロックウィジェット → タップ（Face ID）→ 無音起動。
- Live Activity（ロック/Dynamic Island）の残り時間、終了/一時停止/再開ボタンが効く。
- 通知で一時停止/終了 → アプリ内ドックも追従（`importFromShared`）。
- アプリで一時停止 → 通知が消えず「一時停止中」、再開で同じ通知のまま続行。
- 消音/集中モード貫通、複数同時、再起動後の整合。
- （課金）StoreKit2: ASC に IAP 作成後、購入/復元。
