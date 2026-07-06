import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/ui/theme';
import { PhoneFrame } from '../src/ui/components/PhoneFrame';
import { ChevronIcon } from '../src/ui/icons/ui';
import { t } from '../src/i18n';

const SLIDES = {
  home: [
    { text: 'ホーム画面を長押し\n左上の「編集」をタップ', image: require('../assets/howto/home_1.png') },
    { text: '「ウィジェットを追加」をタップ', image: require('../assets/howto/home_2.png') },
    { text: '「今すぐタイマー」で検索', image: require('../assets/howto/home_3.png') },
    { text: 'ウィジェット枠を選択して決定', image: require('../assets/howto/home_4.png') },
  ],
  lock: [
    { text: 'ロック画面を長押し\n下部の「カスタマイズ」をタップ', image: require('../assets/howto/lock_1.png') },
    { text: '「ウィジェットを追加」をタップ', image: require('../assets/howto/lock_2.png') },
    { text: '「今すぐタイマー」を選んで追加', image: require('../assets/howto/lock_3.png') },
  ],
};
type SlideTab = keyof typeof SLIDES;
type Slide = { text: string; image: ImageSourcePropType };
const ALL_SLIDES = [...SLIDES.home, ...SLIDES.lock] as readonly Slide[];

export default function HowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { c, spacing } = useTheme();
  const s = t();
  const { video } = useLocalSearchParams<{ video?: string }>();
  const scrollRef = React.useRef<ScrollView>(null);

  // 'add' = ホーム＋ロックをまとめてタブ切替。それ以外は単一タブで表示。
  const isAdd = video === 'add';
  const [tab, setTab] = React.useState<'home' | 'lock'>('home');
  const key: SlideTab = isAdd ? tab : video === 'lock' ? 'lock' : 'home';
  const title = isAdd ? s.how.add : key === 'lock' ? s.how.lock : s.how.home;
  const [index, setIndex] = React.useState(0);
  const slides = SLIDES[key] as readonly Slide[];

  React.useEffect(() => {
    for (const slide of ALL_SLIDES) {
      const source = Image.resolveAssetSource(slide.image);
      if (source?.uri) void Image.prefetch(source.uri);
    }
  }, []);

  React.useEffect(() => {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [key]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

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

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {slides.map((slide, i) => (
          <View key={`${key}-${i}`} style={{ width, flex: 1 }}>
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md }}>
              <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '900', lineHeight: 28, textAlign: 'center' }}>
                {slide.text}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
                {slides.map((_, dot) => (
                  <View
                    key={dot}
                    style={{
                      width: dot === index ? 22 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: dot === index ? c.accent : c.hairline,
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={{ flex: 1, paddingVertical: spacing.md, paddingBottom: insets.bottom + spacing.lg }}>
              <PhoneFrame screenBackground="#FFFFFF">
                <Image
                  source={slide.image}
                  fadeDuration={0}
                  style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#FFFFFF' }}
                  resizeMode="cover"
                />
              </PhoneFrame>
            </View>
          </View>
        ))}
      </ScrollView>
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
