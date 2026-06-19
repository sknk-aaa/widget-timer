import * as React from 'react';
import {
  View,
  Text,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { haptics } from '../haptics';

export const ITEM_H = 44;
export const VISIBLE = 5;
export const WHEEL_HEIGHT = ITEM_H * VISIBLE;
export const WHEEL_PAD = (WHEEL_HEIGHT - ITEM_H) / 2;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

interface Props {
  value: number;
  max: number;
  label: string;
  colorPrimary: string;
  colorDim: string;
  colorLabel: string;
  onChange: (v: number) => void;
  onActiveChange?: (active: boolean) => void;
}

/** スナップする縦ホイール1列。選択バンドは親が描画する前提。 */
export function WheelColumn({
  value,
  max,
  label,
  colorPrimary,
  colorDim,
  colorLabel,
  onChange,
  onActiveChange,
}: Props) {
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
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
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
          top: WHEEL_PAD,
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
