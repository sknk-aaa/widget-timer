import * as React from 'react';
import { Text, View, ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { haptics } from '../haptics';
import { useTheme } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: Props) {
  const { c, radius, spacing } = useTheme();

  const bg =
    variant === 'primary'
      ? c.accent
      : variant === 'danger'
        ? c.danger
        : variant === 'secondary'
          ? c.surfaceAlt
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'ghost'
        ? c.accent
        : c.textPrimary;

  return (
    <PressableScale
      disabled={disabled || loading}
      haptic={variant === 'primary' || variant === 'danger' ? haptics.primary : haptics.light}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={[
        {
          minHeight: 52,
          borderRadius: radius.md,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          opacity: disabled ? 0.4 : 1,
          paddingHorizontal: spacing.xl,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {icon}
          <Text style={{ color: fg, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
