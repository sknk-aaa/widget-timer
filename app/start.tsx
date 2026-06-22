import * as React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePresetsStore } from '../src/store/presets';
import { useTimersStore } from '../src/store/timers';
import { useSettingsStore } from '../src/store/settings';
import { useTheme } from '../src/ui/theme';
import { haptics } from '../src/ui/haptics';

/**
 * ウィジェットのディープリンク `imasugutimer://start?preset=ID` の受け口。
 * 受け取ったプリセットをアプリ側で起動し（＝実行中ドックに出る／キャンセル可能）、メインへ戻す。
 */
export default function StartRoute() {
  const router = useRouter();
  const { c } = useTheme();
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  React.useEffect(() => {
    if (!useSettingsStore.getState().onboardingDone) {
      router.replace('/onboarding');
      return;
    }
    const p = preset
      ? usePresetsStore.getState().presets.find((x) => x.id === preset)
      : undefined;
    if (p) {
      haptics.start();
      void useTimersStore.getState().startFromPreset(p, 'widget');
    }
    router.replace('/');
    // 受け取り時に一度だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <View style={{ flex: 1, backgroundColor: c.bg }} />;
}
