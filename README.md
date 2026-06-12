# 今すぐタイマー

ウィジェットからワンタップで起動できる iOS 専用の相対カウントダウンタイマー。AlarmKit で消音・集中モード中でも確実に鳴らし、ホーム画面ウィジェットとロック画面 Live Activity から操作できる。買い切り Pro。

- **対応**: iOS 26+ / iPhone のみ / 日本語
- **技術**: Expo (React Native) + Drizzle/expo-sqlite + Zustand、ネイティブは AlarmKit / WidgetKit / ActivityKit / StoreKit 2

## 開発

```
npx expo start
```

Expo Go で JS UI を確認（ネイティブ機能はモック動作）。AlarmKit・ウィジェット・Live Activity・課金の実機確認は TestFlight。

## ドキュメント

- [SPEC.md](SPEC.md) — 製品要件（正）
- [docs/DESIGN.md](docs/DESIGN.md) — 実装設計（構成・データモデル・主要フロー）
- [docs/OPERATIONS.md](docs/OPERATIONS.md) — 識別子・CI/CD・配信・プライバシー
- [docs/HANDOFF.md](docs/HANDOFF.md) — 現状と残タスク
