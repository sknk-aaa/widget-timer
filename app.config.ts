import type { ExpoConfig, ConfigContext } from 'expo/config';

const BUNDLE_ID = 'com.sknk.imasugutimer';
const APP_GROUP = 'group.com.sknk.imasugutimer';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '今すぐタイマー',
  slug: 'widget-timer',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'imasugutimer',
  userInterfaceStyle: 'automatic',
  // ロケール別のInfo.plist（ホーム画面のアプリ名・権限文言）。日本語以外は英語にフォールバック。
  locales: {
    en: {
      CFBundleDisplayName: 'Tappri',
      NSAlarmKitUsageDescription:
        'Used to reliably sound the alarm when a timer ends, even in Silent or Focus mode.',
    },
    ja: {
      CFBundleDisplayName: '今すぐタイマー',
      NSAlarmKitUsageDescription:
        'タイマー終了時に、消音モードや集中モード中でも確実にアラームを鳴らすために使用します。',
    },
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // 非ja/enデバイスの既定（開発リージョン）を英語に。
      CFBundleDevelopmentRegion: 'en',
      CFBundleLocalizations: ['en', 'ja'],
      NSAlarmKitUsageDescription:
        'Used to reliably sound the alarm when a timer ends, even in Silent or Focus mode.',
      ITSAppUsesNonExemptEncryption: false,
      // カスタム Live Activity（AlarmKit の AlarmAttributes 表示）を使うため必須。
      NSSupportsLiveActivities: true,
    },
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
    },
    // Required Reason API: App Group の UserDefaults を読み書き（C56D.1）。標準用 CA92.1 も併記。
    // データ収集・トラッキングは無し（既定の NSPrivacyTracking=false / 収集タイプ空 を維持）。
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['C56D.1', 'CA92.1'],
        },
      ],
    },
  },
  extra: {
    appGroup: APP_GROUP,
    bundleId: BUNDLE_ID,
    router: {},
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-localization',
    'expo-video',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F4F4F6',
        image: './assets/splash-icon.png',
        imageWidth: 200,
        dark: {
          backgroundColor: '#0B0B0F',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '26.0',
        },
      },
    ],
    // expo-notifications の config プラグインは付けない（aps-environment を付与してしまうため）。
    // 本アプリはリモートプッシュ未使用。Expo Go のローカル通知モックはパッケージのみで動く。
    // Phase2: Widget拡張（Control / ホームウィジェット / Live Activity / App Intents）
    [
      '@bacons/apple-targets',
      {
        appleTeamId: '3H2LBDNPMU',
      },
    ],
    // アラート音(.wav)をアプリ本体ターゲットにバンドル
    './plugins/withAlarmSounds',
    // 最後に実行して aps-environment を除去する（expo-notifications が自動付与するため）
    './plugins/withoutApsEnvironment',
  ],
  experiments: {
    typedRoutes: true,
  },
});
