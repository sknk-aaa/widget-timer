import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../src/ui/theme';
import { t } from '../src/i18n';

// チュートリアル動画。require() でバンドル（mp4 は metro の assetExts に追加済み）。
const SOURCES = {
  home: require('../assets/onboarding/how-home.mp4'),
  lock: require('../assets/onboarding/how-lock.mp4'),
  change: require('../assets/onboarding/how-whiget2.mp4'),
};
type VideoKey = keyof typeof SOURCES;

export default function HowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();
  const { video } = useLocalSearchParams<{ video?: string }>();
  const key: VideoKey = video === 'lock' || video === 'change' ? video : 'home';
  const title = key === 'lock' ? s.how.lock : key === 'change' ? s.how.change : s.how.home;

  const player = useVideoPlayer(SOURCES[key], (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }} accessibilityViewIsModal>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          height: 52,
        }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '800', flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel={s.common.close}>
          <Text style={{ color: c.textSecondary, fontSize: 16, fontWeight: '600' }}>{s.common.close}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        <VideoView
          style={{ flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' }}
          player={player}
          contentFit="contain"
          nativeControls={false}
        />
      </View>
    </View>
  );
}
