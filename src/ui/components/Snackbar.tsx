import * as React from 'react';
import { Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { haptics } from '../haptics';

interface Props {
  visible: boolean;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/** 下部に出る一時トースト（Undo 用）。常時マウントし visible で出し入れする。 */
export function Snackbar({ visible, message, actionLabel, onAction }: Props) {
  const { c, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const op = useSharedValue(0);
  const ty = useSharedValue(24);

  React.useEffect(() => {
    op.value = withTiming(visible ? 1 : 0, { duration: 180 });
    ty.value = withTiming(visible ? 0 : 24, { duration: 180 });
  }, [visible, op, ty]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      style={[
        {
          position: 'absolute',
          left: spacing.xl,
          right: spacing.xl,
          bottom: insets.bottom + 92,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.lg,
          backgroundColor: '#1C1C1E',
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        },
        style,
      ]}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={1}>
        {message}
      </Text>
      <Pressable
        onPress={() => {
          haptics.light();
          onAction();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>{actionLabel}</Text>
      </Pressable>
    </Animated.View>
  );
}
