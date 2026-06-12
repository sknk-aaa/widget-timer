import * as React from 'react';
import { Text, View, Platform } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { PressableScale } from './PressableScale';
import { haptics } from '../haptics';
import { IconGlyph } from '../icons/registry';
import { colorOf } from '../../domain/colors';
import { formatDurationShort } from '../../domain/format';
import { useTheme } from '../theme';

export const TILE_SIZE = 72;

interface VisualProps {
  icon: string;
  color: string;
  size?: number;
  glow?: boolean;
}

/** 白グリフ＋カラーグラデのスクワークル本体（ジェスチャなし）。 */
export function PresetTileVisual({ icon, color, size = TILE_SIZE, glow = true }: VisualProps) {
  const def = colorOf(color);
  const r = Math.round(size * 0.3);
  const gid = `g-${color}-${size}`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        ...(glow
          ? {
              shadowColor: def.bg,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              ...(Platform.OS === 'android' ? { elevation: 6 } : null),
            }
          : null),
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={def.bg} stopOpacity="1" />
            <Stop offset="1" stopColor={def.bg} stopOpacity="0.82" />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={r} ry={r} fill={`url(#${gid})`} />
        <Rect
          x={1}
          y={1}
          width={size - 2}
          height={size - 2}
          rx={r - 1}
          ry={r - 1}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
        />
      </Svg>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <IconGlyph id={icon} size={size * 0.46} color="#FFFFFF" />
      </View>
    </View>
  );
}

interface Props {
  icon: string;
  color: string;
  durationSec: number;
  size?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  showDuration?: boolean;
  dimmed?: boolean;
}

/** タップで起動するプリセットタイル。 */
export function PresetTile({
  icon,
  color,
  durationSec,
  size = TILE_SIZE,
  onPress,
  onLongPress,
  showDuration = true,
  dimmed,
}: Props) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', width: size, opacity: dimmed ? 0.5 : 1 }}>
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={220}
        haptic={haptics.primary}
        scaleTo={0.94}
      >
        <PresetTileVisual icon={icon} color={color} size={size} />
      </PressableScale>
      {showDuration && (
        <Text
          style={{
            marginTop: 7,
            color: c.textSecondary,
            fontSize: 12,
            fontWeight: '600',
            fontVariant: ['tabular-nums'],
          }}
          numberOfLines={1}
        >
          {formatDurationShort(durationSec)}
        </Text>
      )}
    </View>
  );
}
