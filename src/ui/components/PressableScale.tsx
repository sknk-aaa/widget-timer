import * as React from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { springs, timings } from '../motion';
import { haptics } from '../haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  /** 押下時に鳴らす触覚。null で無効。デフォルトは軽いタップ。 */
  haptic?: (() => void) | null;
}

export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  haptic = haptics.light,
  onPressIn,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, timings.pressIn);
        onPressIn?.(e);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.pop);
      }}
      onPress={(e) => {
        haptic?.();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
