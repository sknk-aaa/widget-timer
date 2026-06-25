import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useReducedMotion,
  cancelAnimation,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { IconGlyph } from '../icons/registry';
import { colorOf } from '../../domain/colors';
import { formatRemaining, formatEndClock, remainingSecOf } from '../../domain/format';
import type { RunningTimer } from '../../domain/types';
import { useClock } from '../../store/clock';
import { useTheme } from '../theme';
import { haptics } from '../haptics';
import { CheckIcon } from '../icons/ui';
import { t } from '../../i18n';

interface Props {
  timer: RunningTimer;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

const BOX = 56;
const INSET = 2;
const RW = BOX - INSET * 2; // 52
const RR = 16; // 角丸半径
const PERIM = 2 * (RW + RW) - 8 * RR + 2 * Math.PI * RR; // 角丸矩形の周長

export function RunningTimerRow({ timer, onPause, onResume, onCancel, onDismiss }: Props) {
  const { c, radius, spacing } = useTheme();
  const now = useClock((s) => s.now);
  const reduced = useReducedMotion();
  const def = colorOf(timer.color);
  const remaining = remainingSecOf(timer, now);
  const paused = timer.state === 'paused';
  const finished = timer.state === 'finished';
  const s = t();

  const frac = finished
    ? 1
    : timer.durationSec > 0
      ? Math.max(0, Math.min(1, remaining / timer.durationSec))
      : 0;

  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (finished && !reduced) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 520 }), withTiming(1, { duration: 520 })),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
    return () => cancelAnimation(pulse);
  }, [finished, reduced, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const label = `${formatRemaining(remaining)} ${
    finished ? s.timer.finished : paused ? s.timer.pausedNow : `${s.timer.ends} ${formatEndClock(timer.endAt, now)}`
  }`;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: finished ? def.tint : c.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.md,
        borderWidth: finished ? 1 : 0,
        borderColor: finished ? def.bg : 'transparent',
      }}
    >
      <Animated.View style={[{ width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
        <Svg width={BOX} height={BOX} style={{ position: 'absolute' }}>
          <Rect
            x={INSET}
            y={INSET}
            width={RW}
            height={RW}
            rx={RR}
            ry={RR}
            stroke={c.hairline}
            strokeWidth={3}
            fill="none"
          />
          <Rect
            x={INSET}
            y={INSET}
            width={RW}
            height={RW}
            rx={RR}
            ry={RR}
            stroke={def.bg}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={PERIM}
            strokeDashoffset={PERIM * (1 - frac)}
          />
        </Svg>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: def.bg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: paused ? 0.6 : 1,
          }}
        >
          <IconGlyph id={timer.icon} size={22} color="#FFFFFF" />
        </View>
      </Animated.View>

      <View style={{ flex: 1 }}>
        <Text
          allowFontScaling={false}
          style={{
            color: finished ? def.bg : paused ? c.textSecondary : c.textPrimary,
            fontSize: 26,
            fontWeight: '800',
            fontVariant: ['tabular-nums'],
            letterSpacing: 0.5,
          }}
        >
          {finished ? '0:00' : formatRemaining(remaining)}
        </Text>
        <Text style={{ color: finished ? def.bg : c.textTertiary, fontSize: 12, fontWeight: '700', marginTop: 1 }}>
          {finished
            ? s.timer.finishedHint
            : paused
              ? s.timer.pausedNow
              : `${s.timer.ends} ${formatEndClock(timer.endAt, now)}`}
        </Text>
      </View>

      {finished ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: def.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon color="#FFFFFF" size={22} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <RoundButton
            onPress={paused ? onResume : onPause}
            bg={c.surfaceAlt}
            label={paused ? s.timer.resume : s.timer.pause}
          >
            {paused ? <PlayGlyph color={c.textPrimary} /> : <PauseGlyph color={c.textPrimary} />}
          </RoundButton>
          <RoundButton onPress={onCancel} bg={c.surfaceAlt} label={s.timer.cancel}>
            <CloseGlyph color={c.danger} />
          </RoundButton>
        </View>
      )}
    </View>
  );

  if (finished) {
    return (
      <Pressable
        onPress={() => {
          haptics.light();
          onDismiss();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${s.timer.tapToClear}`}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

function RoundButton({
  children,
  onPress,
  bg,
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  bg: string;
  label: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic={haptics.pauseResume}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View>{children}</View>
    </PressableScale>
  );
}

function PauseGlyph({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      <View style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: color }} />
      <View style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

function PlayGlyph({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: 7,
        borderBottomWidth: 7,
        borderLeftWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
        marginLeft: 3,
      }}
    />
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: 16,
          height: 2.4,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 16,
          height: 2.4,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}
