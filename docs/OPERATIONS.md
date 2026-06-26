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

- Widget 拡張 bundle id:

```
com.sknk.imasugutimer.widget
```

- 課金プロダクトID（買い切り・非消耗型）— Pro:

```
com.sknk.imasugutimer.pro
```

- 課金プロダクトID（買い切り・非消耗型）— Pro＋応援（Proも付与）:

```
com.sknk.imasugutimer.support
```

- App Store ID（`src/domain/links.ts` の `APP_STORE_ID`）:

```
6782746504
```

- Expo slug: `widget-timer`
- アプリ表示名: 今すぐタイマー（日本語）/ Tappri（英語・ホーム画面の `CFBundleDisplayName`）
- ストア表記（英語タイトル）: Tappri: Widget Timer
- GitHub: `sknk-aaa/widget-timer`
- 対応OS: iOS 26+（`app.config.ts` の deploymentTarget=26.0）

> 識別子は確定済み（App Store Connect でアプリ作成済み）。変える場合は `app.config.ts` と各ワークフローの設定を更新する。

## 環境の使い分け

- **JS/UI**: Expo Go で確認（AlarmKit/ウィジェット/Live Activity/課金はモック動作）。
- **ネイティブ確認・配信**: `v*` タグ push か手動実行で GitHub Actions → TestFlight。

```
npm start
```

### Expo Go 接続の要点（WSL2）

- **SDK は 54 に固定**（App Store の Expo Go が SDK 56 未対応のため）。`expo install --fix` で揃える。
- `npm start` = `expo start --tunnel --go`。WSL2 は NAT(`172.x`)で LAN が届かないため **tunnel 必須**（`@expo/ngrok` 同梱）。**「Tunnel ready」表示後**に QR が有効化される（出る前は localhost で QR 不可）。iPhone はカメラアプリで読む。
- `expo-dev-client` は Phase1 では入れない（入れると `expo start` が開発ビルドモードになり Expo Go で開けない）。Phase2 のネイティブ実装時に追加。
- `session closed`（ngrok）が出たら、**同一 Expo アカウントで同時に2つトンネルを張っていないか**確認（`pkill -f ngrok` 後に再実行）。
- LAN 直結したい場合は Windows 11 のミラーモード（`.wslconfig` に `networkingMode=mirrored`）＋ `npm run start:local`。

## CI/CD（GitHub Actions）

- `.github/workflows/ci.yml`: push/PR で typecheck＋iOS JSバンドル検証（無料・速い）。
- `.github/workflows/ios.yml`: `v*` タグ or 手動実行で prebuild→fastlane→TestFlight（`runs-on: macos-26`）。
- `.github/workflows/ios-certs.yml`: 証明書作成（初回1回だけ手動実行）。

### `gp` デプロイショートカット

ユーザーが `gp` と打ったら、エージェントが `git push` → `gh workflow run ios.yml --ref main` → 実行URL返却を行う（`/project/AGENTS.md` §5）。`gh` は `sknk-aaa` 認証済み。通常の「push はユーザー」原則の唯一の例外。

汎用手順・ハマりどころ・Secrets の作り方は `~/.claude/docs/IOS_CICD_RECIPE.md` に集約。本リポでは `Gemfile` / `fastlane/{Appfile,Matchfile,Fastfile}` を配置済み。

### 必要な GitHub Secrets（TestFlight 配信時）

`APPLE_TEAM_ID` / `MATCH_GIT_URL` / `MATCH_PASSWORD` / `MATCH_GIT_BASIC_AUTHORIZATION` / `APP_STORE_CONNECT_API_KEY_ID` / `APP_STORE_CONNECT_API_ISSUER_ID` / `APP_STORE_CONNECT_API_KEY`

> これらが未設定のうちは `ios.yml` を実行しない（手動 or タグ運用にしてあるため自動では走らない）。

## App Store Connect 側の準備

1. アプリを作成（bundle id 一致）。✅ 済
2. **App Group** `group.com.sknk.imasugutimer` を作成し、アプリ＋Widget拡張の両 App ID に付与。Widget の App ID `com.sknk.imasugutimer.widget` も登録。✅ 済
3. **買い切りIAP**（非消耗型）2件を作成。✅ 済
   - `com.sknk.imasugutimer.pro`（¥500）
   - `com.sknk.imasugutimer.support`（¥2000・所有で Pro も付与）
   - 初回提出時は両IAPをバージョン（1.0.0）の「App内課金」に**添付して本体と同時審査**する。
4. `certs` レーンは app と widget 両方のプロビジョニングを match に作成・保存する（`fastlane ios certs` を1回）。✅ 済
5. `appleTeamId`（app.config）= `3H2LBDNPMU`、`WIDGET_TARGET`（Fastfile）= `ImasuguWidget`。✅ 設定済

## プライバシー / 課金

- 全データ端末内（SQLite）。外部送信なし。Privacy Nutrition Label は「データ収集なし」で申告できる構成を維持する（**分析SDK等を入れない**）。
- 課金は StoreKit 2（買い切り非消耗型）を直実装済み。RevenueCat 等は上記方針のため不採用。Pro／Pro＋応援の2製品、isPro は両製品所有のいずれかで成立。
- `NSAlarmKitUsageDescription` は `app.config.ts` の infoPlist に設定済み。
- **プライバシーマニフェスト**: Required Reason API（App Group の UserDefaults, 理由 `C56D.1`/`CA92.1`）を申告。本体は `app.config.ts` の `ios.privacyManifests`、Widget拡張は `targets/widget/PrivacyInfo.xcprivacy`（apple-targets の同期フォルダで取込）。トラッキング・データ収集なし。
- **Live Activity**: `NSSupportsLiveActivities=true` を本体 infoPlist に設定（AlarmKit の `AlarmAttributes` 表示に必須）。

### ストア表記（ASC）

- サポートURL: `https://tally.so/r/rjgJYL`（Tally フォーム）／プライバシーポリシー: `https://sknk-aaa.github.io/widget-timer/privacy.html`／利用規約: Apple 標準EULA。
- カテゴリ: ユーティリティ（プライマリ）/ 仕事効率化（セカンダリ）。
- 名称/サブタイトル/キーワード/説明（日英）は提出時に設定済み。英語キーワードはタイトル「Tappri: Widget Timer」に widget/timer を含むため両語を除外して構成。

### 法的URL（`src/domain/links.ts`）

- **利用規約**: Apple 標準 EULA（`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`）。ホスト不要。
- **プライバシーポリシー**: 本文は `docs/privacy.html`。**GitHub Pages（main / `/docs`）で公開**。公開URL = `https://sknk-aaa.github.io/widget-timer/privacy.html`（`PRIVACY_URL` と一致）。
  - Pages 設定: Settings → Pages → Source = `main` / `/docs`（設定済み）。`docs/.nojekyll` で静的配信。
  - push 後、Pages の再ビルドが終われば URL が有効化される（数十秒〜数分）。
- **問い合わせ**: `CONTACT_URL`（既定: 開発者メール）。変更可。

### リリース前チェック（外部設定）

1. 買い切りIAP（`.pro` ¥500 / `.support` ¥2000）を作成し、バージョンに添付して本体と同時審査。✅ 済
2. プライバシーポリシーは公開済み（`docs/privacy.html` → Pages /docs、`PRIVACY_URL` 一致）。
3. ペイウォールの規約/プライバシーリンクが実機で開けることを確認（審査要件）。
4. **App Store ID を設定**: ASC でアプリ作成後に割り当てられる数字IDを `src/domain/links.ts` の `APP_STORE_ID` に設定（未設定だと設定内「レビューして応援」がApp Storeを開けない）。
5. 「ご意見・ご要望」は Tally フォーム（`CONTACT_URL`）に接続済み。

### レビュー導線

- **自動レビュー依頼**: Apple純正 `requestReview`（`expo-store-review`）。タイマー完了が**3回**到達で1回だけ（`src/native/review.ts` の `REVIEW_THRESHOLD`）。Apple側で年3回上限の自動制御。
- **手動**: 設定「レビューして応援」→ App Store のレビュー作成画面（`REVIEW_URL` = `…?action=write-review`）。`APP_STORE_ID` 設定が前提。

## 依存メモ

- `.npmrc` に `legacy-peer-deps=true`（Expo 系の peer 競合回避。EAS/CI も参照）。
- マイグレーションは drizzle-kit で生成（`drizzle/`）するが、適用は起動時の冪等DDL（`src/db/migrate.ts`）で行う。スキーマ変更時は両方を更新する。
