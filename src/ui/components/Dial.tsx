import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import {
  decomposeDuration,
  formatRemaining,
} from '../../domain/format';
import { MAX_DURATION_SEC } from '../../domain/types';
import { useTheme } from '../theme';
import { haptics } from '../haptics';

type UnitKey = 'days' | 'hours' | 'minutes' | 'seconds';

const UNITS: { key: UnitKey; label: string; step: number }[] = [
  { key: 'days', label: '日', step: 86400 },
  { key: 'hours', label: '時', step: 3600 },
  { key: 'minutes', label: '分', step: 60 },
  { key: 'seconds', label: '秒', step: 1 },
];

const QUICK_MIN = [1, 3, 5, 10, 15, 30, 45, 60];
const TICKS = 60;
const STEP_ANGLE = (2 * Math.PI) / TICKS;

function clamp(n: number): number {
  return Math.max(0, Math.min(MAX_DURATION_SEC, n));
}

interface Props {
  valueSec: number;
  onChange: (sec: number) => void;
  size?: number;
  /** ダイヤル操作中フラグ。親の ScrollView を一時停止させ競合を防ぐのに使う。 */
  onActiveChange?: (active: boolean) => void;
}

export function Dial({ valueSec, onChange, size = 268, onActiveChange }: Props) {
  const { c, radius } = useTheme();
  const [active, setActive] = React.useState<UnitKey>('minutes');
  const unit = UNITS.find((u) => u.key === active)!;
  const parts = decomposeDuration(valueSec);

  // gesture が参照する最新値（worklet からは触らない）
  const valueRef = React.useRef(valueSec);
  valueRef.current = valueSec;
  const baselineRef = React.useRef(valueSec);
  const stepRef = React.useRef(unit.step);
  stepRef.current = unit.step;

  const cx = size / 2;
  const cy = size / 2;
  const ringR = size / 2 - 22;
  const tickOuter = ringR;
  const tickInner = ringR - 13;

  const setValue = React.useCallback(
    (next: number) => {
      const v = clamp(next);
      if (v !== valueRef.current) {
        valueRef.current = v;
        onChange(v);
        haptics.tick();
      }
    },
    [onChange],
  );

  const beginDrag = React.useCallback(() => {
    baselineRef.current = valueRef.current;
    haptics.tick();
  }, []);

  const applyStep = React.useCallback((stepDelta: number) => {
    setValue(baselineRef.current + stepDelta * stepRef.current);
  }, [setValue]);

  const notifyActive = React.useCallback(
    (a: boolean) => onActiveChange?.(a),
    [onActiveChange],
  );

  // worklet 間で持続させるため shared value を使う
  const prevAngle = useSharedValue(0);
  const accAngle = useSharedValue(0);
  const lastStep = useSharedValue(0);

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => {
          'worklet';
          prevAngle.value = Math.atan2(e.y - cy, e.x - cx);
          accAngle.value = 0;
          lastStep.value = 0;
          runOnJS(beginDrag)();
          runOnJS(notifyActive)(true);
        })
        .onUpdate((e) => {
          'worklet';
          const ang = Math.atan2(e.y - cy, e.x - cx);
          let d = ang - prevAngle.value;
          if (d > Math.PI) d -= 2 * Math.PI;
          if (d < -Math.PI) d += 2 * Math.PI;
          accAngle.value += d;
          prevAngle.value = ang;
          const stepDelta = Math.round(accAngle.value / STEP_ANGLE);
          if (stepDelta !== lastStep.value) {
            lastStep.value = stepDelta;
            runOnJS(applyStep)(stepDelta);
          }
        })
        .onFinalize(() => {
          'worklet';
          runOnJS(notifyActive)(false);
        }),
    [cx, cy, beginDrag, applyStep, notifyActive, prevAngle, accAngle, lastStep],
  );

  // 現在の回転内での位置（クロック様にラップ）
  const within = unit.step > 0 ? (valueSec / unit.step) % TICKS : 0;
  const activeCount = Math.round(within < 0 ? within + TICKS : within);
  const thumbAngle = (activeCount / TICKS) * 2 * Math.PI - Math.PI / 2;
  const thumbX = cx + ringR * Math.cos(thumbAngle);
  const thumbY = cy + ringR * Math.sin(thumbAngle);

  const ticks = [];
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * 2 * Math.PI - Math.PI / 2;
    const on = i < activeCount;
    ticks.push(
      <Line
        key={i}
        x1={cx + tickOuter * Math.cos(a)}
        y1={cy + tickOuter * Math.sin(a)}
        x2={cx + tickInner * Math.cos(a)}
        y2={cy + tickInner * Math.sin(a)}
        stroke={on ? c.accent : c.hairline}
        strokeWidth={on ? 3 : 2}
        strokeLinecap="round"
      />,
    );
  }

  const stepUnit = (dir: 1 | -1) => {
    setValue(valueRef.current + dir * unit.step);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      {/* クイックプリセット */}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 18 }}
      >
        {QUICK_MIN.map((m) => {
          const on = valueSec === m * 60;
          return (
            <Pressable
              key={m}
              onPress={() => {
                haptics.light();
                setValue(m * 60);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${m}分`}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: radius.pill,
                backgroundColor: on ? c.accent : c.surfaceAlt,
              }}
            >
              <Text
                style={{
                  color: on ? '#FFFFFF' : c.textSecondary,
                  fontSize: 13,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {m}分
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="タイマーの時間"
        accessibilityValue={{ text: valueSec > 0 ? formatRemaining(valueSec) : '0秒' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') stepUnit(1);
          else if (e.nativeEvent.actionName === 'decrement') stepUnit(-1);
        }}
      >
        <GestureDetector gesture={pan}>
          <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
              <Circle cx={cx} cy={cy} r={ringR - 24} fill="none" stroke={c.hairline} strokeWidth={1} />
              {ticks}
              <Circle cx={thumbX} cy={thumbY} r={12} fill={c.accent} />
              <Circle cx={thumbX} cy={thumbY} r={5.5} fill="#FFFFFF" />
            </Svg>
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              pointerEvents="none"
            >
              <Text
                allowFontScaling={false}
                style={{
                  color: c.textPrimary,
                  fontSize: 42,
                  fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                  letterSpacing: 1,
                }}
              >
                {formatRemaining(valueSec)}
              </Text>
              <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                ダイヤルを回す
              </Text>
            </View>
          </View>
        </GestureDetector>
      </View>

      {/* − ・ 単位タブ ・ + */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
        <StepButton label="−" onStep={() => stepUnit(-1)} color={c.textPrimary} bg={c.surfaceAlt} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {UNITS.map((u) => {
            const on = u.key === active;
            return (
              <Pressable
                key={u.key}
                onPress={() => {
                  setActive(u.key);
                  haptics.light();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${u.label}単位で調整`}
                style={{
                  minWidth: 52,
                  paddingVertical: 7,
                  paddingHorizontal: 8,
                  borderRadius: radius.md,
                  backgroundColor: on ? c.accent : c.surfaceAlt,
                  alignItems: 'center',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    color: on ? '#FFFFFF' : c.textPrimary,
                    fontSize: 19,
                    fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {parts[u.key]}
                </Text>
                <Text
                  style={{
                    color: on ? 'rgba(255,255,255,0.85)' : c.textSecondary,
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 1,
                  }}
                >
                  {u.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <StepButton label="＋" onStep={() => stepUnit(1)} color={c.textPrimary} bg={c.surfaceAlt} />
      </View>
    </View>
  );
}

function StepButton({
  label,
  onStep,
  color,
  bg,
}: {
  label: string;
  onStep: () => void;
  color: string;
  bg: string;
}) {
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const accel = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    if (accel.current) clearTimeout(accel.current);
    timer.current = null;
    accel.current = null;
  };

  React.useEffect(() => clear, []);

  return (
    <Pressable
      onPressIn={() => {
        onStep();
        // 長押しで自動リピート（途中から加速）
        accel.current = setTimeout(() => {
          timer.current = setInterval(onStep, 80);
        }, 380);
      }}
      onPressOut={clear}
      accessibilityRole="button"
      accessibilityLabel={label === '−' ? '減らす' : '増やす'}
      hitSlop={8}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text allowFontScaling={false} style={{ color, fontSize: 24, fontWeight: '700', marginTop: -2 }}>
        {label}
      </Text>
    </Pressable>
  );
}
