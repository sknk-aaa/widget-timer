import * as React from 'react';
import { View } from 'react-native';
import { decomposeDuration, composeDuration } from '../../domain/format';
import { MAX_DURATION_SEC } from '../../domain/types';
import { useTheme } from '../theme';
import { t, type Strings } from '../../i18n';
import { WheelColumn, WHEEL_HEIGHT, WHEEL_PAD, ITEM_H } from './WheelColumn';

type UnitKey = 'days' | 'hours' | 'minutes' | 'seconds';

const COLUMNS: { key: UnitKey; max: number; unit: keyof Strings['wheel'] }[] = [
  { key: 'days', max: 7, unit: 'day' },
  { key: 'hours', max: 23, unit: 'hour' },
  { key: 'minutes', max: 59, unit: 'minute' },
  { key: 'seconds', max: 59, unit: 'second' },
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
  const s = t();
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
            label={s.wheel[col.unit]}
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
  const s = t();
  return (
    <View style={{ height: WHEEL_HEIGHT, width: '100%' }}>
      <Band />
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <WheelColumn
          value={hour}
          max={23}
          label={s.wheel.hour}
          colorPrimary={c.textPrimary}
          colorDim={c.textTertiary}
          colorLabel={c.textSecondary}
          onChange={(v) => onChange(v, minute)}
          onActiveChange={onActiveChange}
        />
        <WheelColumn
          value={minute}
          max={59}
          label={s.wheel.minute}
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
