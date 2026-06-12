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
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSAlarmKitUsageDescription:
        'タイマー終了時に、消音モードや集中モード中でも確実にアラームを鳴らすために使用します。',
      ITSAppUsesNonExemptEncryption: false,
    },
    entitlements: {
      'com.apple.security.application-groups': [APP_GROUP],
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
    [
      'expo-notifications',
      {
        // Phase1: Expo Go モック用のローカル通知。Phase2 で AlarmKit に置換。
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
