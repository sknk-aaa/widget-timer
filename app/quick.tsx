import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimersStore } from '../src/store/timers';
import { useTheme } from '../src/ui/theme';
import { WheelPicker, ClockWheel } from '../src/ui/components/WheelPicker';
import { PressableScale } from '../src/ui/components/PressableScale';
import { SheetHeader } from '../src/ui/components/common';
import { haptics } from '../src/ui/haptics';
import { formatRemaining, secondsUntilClock } from '../src/domain/format';
import { t } from '../src/i18n';

const QUICK_ICON = 'timer';
const QUICK_COLOR = 'orange';

type Mode = 'duration' | 'clock';

export default function QuickScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();

  const [mode, setMode] = React.useState<Mode>('duration');
  const [durationSec, setDurationSec] = React.useState(300);
  const [clock, setClock] = React.useState(() => {
    const d = new Date();
    return { h: d.getHours(), m: d.getMinutes() };
  });

  const effectiveSec =
    mode === 'duration' ? durationSec : secondsUntilClock(clock.h, clock.m);

  const onStart = async () => {
    if (effectiveSec <= 0) return;
    haptics.start();
    await useTimersStore.getState().start({
      presetId: null,
      icon: QUICK_ICON,
      color: QUICK_COLOR,
      durationSec: effectiveSec,
      source: 'quick',
    });
    router.back();
  };

  const p2 = (n: number) => n.toString().padStart(2, '0');

  return (
    <View style={{ flex: 1, backgroundColor: c.bgElevated }} accessibilityViewIsModal>
      <View style={{ flex: 1, padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        <SheetHeader title={s.quick.title} onClose={() => router.back()} />

        {/* モード切替 */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: c.surfaceAlt,
            borderRadius: radius.md,
            padding: 3,
            marginBottom: spacing.lg,
          }}
        >
          {(['duration', 'clock'] as Mode[]).map((mid) => (
            <Pressable
              key={mid}
              onPress={() => {
                setMode(mid);
                haptics.light();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === mid }}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: mode === mid ? c.surface : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: mode === mid ? c.textPrimary : c.textSecondary,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {mid === 'duration' ? s.quick.byDuration : s.quick.byClock}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          {mode === 'duration' ? (
            <WheelPicker valueSec={durationSec} onChange={setDurationSec} />
          ) : (
            <View>
              <ClockWheel
                hour={clock.h}
                minute={clock.m}
                onChange={(h, m) => setClock({ h, m })}
              />
              <Text
                style={{
                  textAlign: 'center',
                  color: c.textSecondary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginTop: spacing.lg,
                }}
              >
                {p2(clock.h)}:{p2(clock.m)} まで ・ あと {formatRemaining(effectiveSec)}
              </Text>
            </View>
          )}
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
              backgroundColor: effectiveSec > 0 ? c.accent : c.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: effectiveSec > 0 ? '#FFFFFF' : c.textTertiary,
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
