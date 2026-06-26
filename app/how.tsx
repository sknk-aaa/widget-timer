import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../src/ui/theme';
import { PhoneFrame } from '../src/ui/components/PhoneFrame';
import { ChevronIcon } from '../src/ui/icons/ui';
import { t, isJaLocale } from '../src/i18n';

// チュートリアル動画（ja/en をロケールで出し分け）。mp4 は metro の assetExts に追加済み。
const SOURCES = {
  home: { ja: require('../assets/onboarding/how-home.mp4'), en: require('../assets/onboarding/how-home-en.mp4') },
  lock: { ja: require('../assets/onboarding/how-lock.mp4'), en: require('../assets/onboarding/how-lock-en.mp4') },
  change: { ja: require('../assets/onboarding/how-whiget2.mp4'), en: require('../assets/onboarding/how-whiget2-en.mp4') },
};
type VideoKey = keyof typeof SOURCES;
const src = (k: VideoKey) => SOURCES[k][isJaLocale ? 'ja' : 'en'];

export default function HowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing } = useTheme();
  const s = t();
  const { video } = useLocalSearchParams<{ video?: string }>();

  // 'add' = ホーム＋ロックをまとめてタブ切替。それ以外は単一動画。
  const isAdd = video === 'add';
  const single: VideoKey = video === 'lock' ? 'lock' : video === 'change' ? 'change' : 'home';
  const [tab, setTab] = React.useState<'home' | 'lock'>('home');
  const key: VideoKey = isAdd ? tab : single;
  const title = isAdd ? s.how.add : key === 'lock' ? s.how.lock : key === 'change' ? s.how.change : s.how.home;

  const player = useVideoPlayer(src(isAdd ? 'home' : single), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    player.replace(src(key));
    player.play();
  }, [key, player]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, height: 52, gap: spacing.xs }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={s.common.close}
          style={{ transform: [{ rotate: '180deg' }] }}
        >
          <ChevronIcon color={c.textPrimary} size={26} />
        </Pressable>
        <Text style={{ color: c.textPrimary, fontSize: 17, fontWeight: '800', flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {isAdd && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
          <Segment label={s.how.homeTab} active={tab === 'home'} onPress={() => setTab('home')} />
          <Segment label={s.how.lockTab} active={tab === 'lock'} onPress={() => setTab('lock')} />
        </View>
      )}

      <View style={{ flex: 1, paddingVertical: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <PhoneFrame>
          <VideoView style={{ flex: 1 }} player={player} contentFit="cover" nativeControls={false} />
        </PhoneFrame>
      </View>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { c, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: active ? c.accent : c.surface,
        borderWidth: 1,
        borderColor: active ? c.accent : c.hairline,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: active ? '#FFFFFF' : c.textSecondary, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
