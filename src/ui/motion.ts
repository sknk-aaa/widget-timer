import {
  Easing,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutDown,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

// reanimated 4 のデフォルト spring は重い（mass4/stiffness900/damping120）。
// iOS ネイティブ感に寄せたチューニング済みプリセット。
export const springs = {
  press: { mass: 0.5, stiffness: 220, damping: 18, reduceMotion: ReduceMotion.System },
  pop: { dampingRatio: 0.5, duration: 380, reduceMotion: ReduceMotion.System },
  gentle: { mass: 0.7, stiffness: 150, damping: 18, reduceMotion: ReduceMotion.System },
  snappy: { mass: 0.4, stiffness: 260, damping: 22, reduceMotion: ReduceMotion.System },
} as const;

export const timings = {
  pressIn: { duration: 90, easing: Easing.out(Easing.quad) },
  fast: { duration: 180, easing: Easing.out(Easing.cubic) },
  base: { duration: 240, easing: Easing.out(Easing.cubic) },
  sweep: { duration: 360, easing: Easing.inOut(Easing.cubic) },
} as const;

// リスト項目の出入り・並び替え
export const listLayout = LinearTransition.springify().damping(20).stiffness(190).mass(0.7);
export const enterItem = FadeInDown.springify().damping(18).stiffness(180).mass(0.8);
export const exitItem = FadeOutDown.duration(200);
export const fadeIn = FadeIn.duration(220);
export const fadeOut = FadeOut.duration(180);
