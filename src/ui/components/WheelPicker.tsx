import * as React from 'react';
import { View } from 'react-native';
import { decomposeDuration, composeDuration } from '../../domain/format';
import { MAX_DURATION_SEC } from '../../domain/types';
import { useTheme } from '../theme';
import { WheelColumn, WHEEL_HEIGHT, WHEEL_PAD, ITEM_H } from './WheelColumn';

type UnitKey = 'days' | 'hours' | 'minutes' | 'seconds';

const COLUMNS: { key: UnitKey; max: number; label: string }[] = [
  { key: 'days', max: 7, label: '日' },
  { key: 'hours', max: 23, label: '時' },
  { key: 'minutes', max: 59, label: '分' },
  { key: 'seconds', max: 59, label: '秒' },
];

interface Props {
  valueSec: number;
  onChange: (sec: number) => void;
  onActiveChange?: (active: boolean) => void;
}

function Band() {
  const { c, radius } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        top: WHEEL_PAD,
        height: ITEM_H,
        borderRadius: radius.md,
        backgroundColor: c.surfaceAlt,
      }}
    />
  );
}

export function WheelPicker({ valueSec, onChange, onActiveChange }: Props) {
  const { c } = useTheme();
  const parts = decomposeDuration(valueSec);

  const setUnit = (key: UnitKey, v: number) => {
    const next = { ...parts, [key]: v };
    let sec = composeDuration(next);
    if (sec > MAX_DURATION_SEC) sec = MAX_DURATION_SEC;
    onChange(sec);
  };

  return (
    <View style={{ height: WHEEL_HEIGHT, width: '100%' }}>
      <Band />
      <View style={{ flexDirection: 'row', flex: 1 }}>
        {COLUMNS.map((col) => (
          <WheelColumn
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

interface ClockProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  onActiveChange?: (active: boolean) => void;
}

/** 終了時刻（時:分）を選ぶホイール。 */
export function ClockWheel({ hour, minute, onChange, onActiveChange }: ClockProps) {
  const { c } = useTheme();
  return (
    <View style={{ height: WHEEL_HEIGHT, width: '100%' }}>
      <Band />
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <WheelColumn
          value={hour}
          max={23}
          label="時"
          colorPrimary={c.textPrimary}
          colorDim={c.textTertiary}
          colorLabel={c.textSecondary}
          onChange={(v) => onChange(v, minute)}
          onActiveChange={onActiveChange}
        />
        <WheelColumn
          value={minute}
          max={59}
          label="分"
          colorPrimary={c.textPrimary}
          colorDim={c.textTertiary}
          colorLabel={c.textSecondary}
          onChange={(v) => onChange(hour, v)}
          onActiveChange={onActiveChange}
        />
      </View>
    </View>
  );
}
