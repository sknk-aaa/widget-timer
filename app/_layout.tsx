import * as React from 'react';
import { View, Text, AppState, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { bootstrap } from '../src/store/bootstrap';

// Dynamic Type は許可しつつ、レイアウト崩れ防止に上限を設ける。
interface ScalableText {
  defaultProps?: { maxFontSizeMultiplier?: number };
}
const TextWithDefaults = Text as unknown as ScalableText;
TextWithDefaults.defaultProps = { ...TextWithDefaults.defaultProps, maxFontSizeMultiplier: 1.6 };
import { useClock } from '../src/store/clock';
import { useTimersStore } from '../src/store/timers';
import { useSettingsStore } from '../src/store/settings';
import { useProStore } from '../src/store/pro';
import { darkPalette, lightPalette } from '../src/ui/theme';
import { nowMs } from '../src/domain/format';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState(false);
  const scheme = useColorScheme();
  const palette = scheme === 'light' ? lightPalette : darkPalette;

  React.useEffect(() => {
    bootstrap().then(
      () => setReady(true),
      () => setError(true),
    );
  }, []);

  // 1秒ごとのクロック更新＋満了タイマーの片付け
  React.useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      useClock.getState().set(nowMs());
      // 通知/ウィジェットからの停止・一時停止を素早く反映（体感ラグ低減）。
      useTimersStore.getState().importFromShared();
      useTimersStore.getState().reconcile();
    }, 1000);
    return () => clearInterval(id);
  }, [ready]);

  // フォアグラウンド復帰時に状態整合＋権限再確認
  React.useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        useClock.getState().set(nowMs());
        useTimersStore.getState().flushPendingCancel();
        useTimersStore.getState().importFromShared();
        useTimersStore.getState().reconcile();
        void useSettingsStore.getState().refreshPermission();
        // 外部での購入/承認（Ask to Buy 等）を反映。
        void useProStore.getState().refresh();
      } else {
        // バックグラウンドへ抜ける前に保留キャンセルを確定（鳴り残し防止）。
        useTimersStore.getState().flushPendingCancel();
      }
    });
    return () => sub.remove();
  }, [ready]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <Text style={{ color: palette.danger, fontSize: 14 }}>
          データベースの初期化に失敗しました
        </Text>
      </View>
    );
  }

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReducedMotionConfig mode={ReduceMotion.System} />
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="onboarding"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
          <Stack.Screen name="preset" options={{ presentation: 'modal' }} />
          <Stack.Screen name="quick" options={{ presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          <Stack.Screen name="faq" options={{ presentation: 'modal' }} />
          <Stack.Screen name="how" />
          <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          <Stack.Screen name="welcome-pro" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
