import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { decomposeDuration, composeDuration } from '../../domain/format';
import { MAX_DURATION_SEC } from '../../domain/types';
import { useTheme } from '../theme';
import { haptics } from '../haptics';

const ITEM_H = 44;
const VISIBLE = 5;
const HEIGHT = ITEM_H * VISIBLE;
const PAD = (HEIGHT - ITEM_H) / 2;

type UnitKey = 'days' | 'hours' | 'minutes' | 'seconds';

const COLUMNS: { key: UnitKey; max: number; label: string; step: number }[] = [
  { key: 'days', max: 7, label: '日', step: 86400 },
  { key: 'hours', max: 23, label: '時', step: 3600 },
  { key: 'minutes', max: 59, label: '分', step: 60 },
  { key: 'seconds', max: 59, label: '秒', step: 1 },
];

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

interface Props {
  valueSec: number;
  onChange: (sec: number) => void;
  /** ホイール操作中。親 ScrollView を止めるのに使う。 */
  onActiveChange?: (active: boolean) => void;
}

export function WheelPicker({ valueSec, onChange, onActiveChange }: Props) {
  const { c, radius } = useTheme();
  const parts = decomposeDuration(valueSec);

  const setUnit = (key: UnitKey, v: number) => {
    const next = { ...parts, [key]: v };
    let sec = composeDuration(next);
    if (sec > MAX_DURATION_SEC) sec = MAX_DURATION_SEC;
    onChange(sec);
  };

  return (
    <View style={{ height: HEIGHT, width: '100%' }}>
      {/* 中央の選択バンド */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 8,
          right: 8,
          top: PAD,
          height: ITEM_H,
          borderRadius: radius.md,
          backgroundColor: c.surfaceAlt,
        }}
      />
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            value={parts[col.key]}
            max={col.max}
            label={col.label}
            colorPrimary={c.textPrimary}
            colorDim={c.textTertiary}
            colorLabel={c.textSecondary}
            onChange={(v) => setUnit(col.key, v)}
            onActiveChange={onActiveChange}
          />
        ))}
      </View>
    </View>
  );
}

interface ColumnProps {
  value: number;
  max: number;
  label: string;
  colorPrimary: string;
  colorDim: string;
  colorLabel: string;
  onChange: (v: number) => void;
  onActiveChange?: (active: boolean) => void;
}

function Column({
  value,
  max,
  label,
  colorPrimary,
  colorDim,
  colorLabel,
  onChange,
  onActiveChange,
}: ColumnProps) {
  const ref = React.useRef<ScrollView>(null);
  const last = React.useRef(value);

  React.useEffect(() => {
    ref.current?.scrollTo({ y: value * ITEM_H, animated: false });
    last.current = value;
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      ref.current?.scrollTo({ y: value * ITEM_H, animated: true });
    }
  }, [value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), 0, max);
    if (idx !== last.current) {
      last.current = idx;
      haptics.tick();
    }
  };

  const finalize = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), 0, max);
    last.current = idx;
    onActiveChange?.(false);
    onChange(idx);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => onActiveChange?.(true)}
        onMomentumScrollEnd={finalize}
        onScrollEndDrag={finalize}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {Array.from({ length: max + 1 }, (_, n) => (
          <View key={n} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              allowFontScaling={false}
              style={{
                color: n === value ? colorPrimary : colorDim,
                fontSize: 24,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
                marginRight: 18,
              }}
            >
              {n}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: PAD,
          height: ITEM_H,
          right: '20%',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colorLabel, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      </View>
    </View>
  );
}
