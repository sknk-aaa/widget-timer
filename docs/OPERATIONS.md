# 運用（今すぐタイマー）

## 固定値（識別子）

- bundle identifier:

```
com.sknk.imasugutimer
```

- App Group:

```
group.com.sknk.imasugutimer
```

- Expo slug: `widget-timer` / アプリ表示名: 今すぐタイマー
- GitHub: `sknk-aaa/widget-timer`
- 対応OS: iOS 26+（`app.config.ts` の deploymentTarget=26.0）

> 識別子は暫定。App Store Connect でのアプリ作成時に確定し、変える場合は `app.config.ts` と各ワークフローの `APP_IDENTIFIER` を更新する。

## 環境の使い分け

- **JS/UI**: `npx expo start` → Expo Go で確認（AlarmKit/ウィジェット/Live Activity/課金はモック動作）。
- **ネイティブ確認・配信**: `v*` タグ push か手動実行で GitHub Actions → TestFlight。

```
npx expo start
```

## CI/CD（GitHub Actions）

- `.github/workflows/ci.yml`: push/PR で typecheck＋iOS JSバンドル検証（無料・速い）。
- `.github/workflows/ios.yml`: `v*` タグ or 手動実行で prebuild→fastlane→TestFlight（`runs-on: macos-26`）。
- `.github/workflows/ios-certs.yml`: 証明書作成（初回1回だけ手動実行）。

汎用手順・ハマりどころ・Secrets の作り方は `~/.claude/docs/IOS_CICD_RECIPE.md` に集約。本リポでは `Gemfile` / `fastlane/{Appfile,Matchfile,Fastfile}` を配置済み。

### 必要な GitHub Secrets（TestFlight 配信時）

`APPLE_TEAM_ID` / `MATCH_GIT_URL` / `MATCH_PASSWORD` / `MATCH_GIT_BASIC_AUTHORIZATION` / `APP_STORE_CONNECT_API_KEY_ID` / `APP_STORE_CONNECT_API_ISSUER_ID` / `APP_STORE_CONNECT_API_KEY`

> これらが未設定のうちは `ios.yml` を実行しない（手動 or タグ運用にしてあるため自動では走らない）。

## プライバシー / 課金

- 全データ端末内（SQLite）。外部送信なし。Privacy Nutrition Label は「データ収集なし」で申告できる構成を維持する（**分析SDK等を入れない**）。
- 課金は StoreKit 2（買い切り非消耗型）を Phase2 で実装。RevenueCat 等は上記方針のため不採用。
- `NSAlarmKitUsageDescription` は `app.config.ts` の infoPlist に設定済み。

## 依存メモ

- `.npmrc` に `legacy-peer-deps=true`（Expo 系の peer 競合回避。EAS/CI も参照）。
- マイグレーションは drizzle-kit で生成（`drizzle/`）するが、適用は起動時の冪等DDL（`src/db/migrate.ts`）で行う。スキーマ変更時は両方を更新する。
