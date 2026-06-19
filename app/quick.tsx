import * as React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimersStore } from '../src/store/timers';
import { useTheme } from '../src/ui/theme';
import { WheelPicker } from '../src/ui/components/WheelPicker';
import { PressableScale } from '../src/ui/components/PressableScale';
import { SheetHeader } from '../src/ui/components/common';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

const QUICK_ICON = 'timer';
const QUICK_COLOR = 'orange';

export default function QuickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();
  const [durationSec, setDurationSec] = React.useState(300);

  const onStart = async () => {
    if (durationSec <= 0) return;
    haptics.start();
    await useTimersStore.getState().start({
      presetId: null,
      icon: QUICK_ICON,
      color: QUICK_COLOR,
      durationSec,
      source: 'quick',
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgElevated }} accessibilityViewIsModal>
      <View style={{ flex: 1, padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        <SheetHeader title={s.quick.title} onClose={() => router.back()} />

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <WheelPicker valueSec={durationSec} onChange={setDurationSec} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <PressableScale
            onPress={() => router.back()}
            haptic={haptics.light}
            accessibilityRole="button"
            accessibilityLabel={s.common.cancel}
            style={{
              flex: 1,
              height: 56,
              borderRadius: radius.lg,
              backgroundColor: c.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '700' }}>{s.common.cancel}</Text>
          </PressableScale>
          <PressableScale
            onPress={onStart}
            haptic={haptics.primary}
            accessibilityRole="button"
            accessibilityLabel={s.quick.start}
            style={{
              flex: 1,
              height: 56,
              borderRadius: radius.lg,
              backgroundColor: durationSec > 0 ? c.accent : c.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: durationSec > 0 ? '#FFFFFF' : c.textTertiary,
                fontSize: 17,
                fontWeight: '800',
              }}
            >
              {s.quick.start}
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
