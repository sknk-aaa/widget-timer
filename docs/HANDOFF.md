# Handoff

最終更新: 2026-06-12

## 現状

Phase 1（Expo Go で動く JS アプリ一式）完成。`tsc --noEmit` と `expo export --platform ios` はパス。実機（Expo Go・SDK54）で UI 確認できる状態。ネイティブ中核（AlarmKit/ウィジェット/Live Activity/StoreKit）はモック。

実装済み:
- メイン: プリセット上下2エリア。**タップ=即起動／長押し=並び替え**、右上「編集」ボタンで編集モード（タップ=編集・削除バッジ・＋追加・ドラッグ）。実行中ドック（進捗リング・一時停止/再開/キャンセル・完了演出）。今すぐFAB。
- 時間入力は**ホイールピッカー**（日/時/分/秒）。今すぐは「時間で指定／時刻で指定」の2モード。
- プリセット作成/編集・設定・ペイウォール・オンボーディング。
- DB(Drizzle+expo-sqlite,起動時DDL)・Zustand・ネイティブ抽象化（Expo Goモック）・白アイコン32種・アプリアイコン・ダーク対応・触覚/モーション・アクセシビリティ・CI/配信ひな形。

## 次のセッションでやること（優先順）

1. **今回の再設計をExpo Goで実機確認・微調整**（ユーザー検証中）。特に長押し並び替えの操作感、ホイールのスナップ、時刻指定モード。
2. **Phase 2（要・実機/TestFlight）**: AlarmKit本実装・ホーム画面ウィジェット・Live Activity・App Groups共有を `src/native/*` のインターフェース裏に注入。SPEC §7の実機検証もここ。
3. **Phase 3**: StoreKit 2 実購入（現在は meta フラグのモック）、価格表示、本番のプライバシー/利用規約URL（`src/domain/links.ts`）。
4. 配信準備: Apple Developer登録・bundle id確定・GitHub Secrets（OPERATIONS.md参照）。

## 今セッションでの決定事項

- **Expo SDK を 56→54 に固定**（理由: App Store の Expo Go が SDK 56 未対応で実機UI確認ができなかった）。
- **`expo-dev-client` を削除**（理由: 入っていると `expo start` が開発ビルドモードになり Expo Go で開けない。Phase2で再追加）。
- **WSL2 は tunnel 必須**（`npm start`=`--tunnel --go`、`@expo/ngrok` 導入）。「Tunnel ready」後にQRが有効。同一アカウントで同時トンネルは `session closed` になる。
- **時間入力をダイヤル→ホイールピッカーに変更**（理由: iOS標準で精密・馴染みがある。Dial.tsx は削除）。
- **メインは編集ボタン方式＋長押し並び替えを併存**（理由: 起動の即時性を保ちつつ編集導線を明示）。
- **分析モードを削除**（理由: v1の価値が薄く、Proは「ウィジェット枠 無制限」で成立。SPEC §3.9 は対象外に変更）。

## 既知の問題

- ドラッグ並び替えの操作感は実機で最終確認中（「掴んだ瞬間に隣とズレる」不具合は修正済み。同一index空間で比較・掴んだスロットなら不動）。
- Expo Go では AlarmKit/ウィジェット/Live Activity/課金は動かない（モック）。本物の挙動は TestFlight でのみ。
- 識別子・Apple アカウント・Secrets は未設定。
