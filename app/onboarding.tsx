import * as React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../src/store/settings';
import { alarmService } from '../src/native/alarm';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

const PAGES = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { c, spacing } = useTheme();
  const s = t();
  const [page, setPage] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const goTo = (p: number) => scrollRef.current?.scrollTo({ x: p * width, animated: true });

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) {
      setPage(p);
      haptics.light();
    }
  };

  const finish = async () => {
    const firstRun = !useSettingsStore.getState().onboardingDone;
    useSettingsStore.getState().completeOnboarding();
    // 初回オンボ完了時に通知（アラーム）許可を求める。
    if (firstRun) {
      await alarmService.requestPermission();
      await useSettingsStore.getState().refreshPermission();
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.xl, height: 44, justifyContent: 'center' }}>
        {page < PAGES - 1 && (
          <Pressable onPress={() => void finish()} hitSlop={10} accessibilityRole="button" accessibilityLabel={s.onboarding.skip}>
            <Text style={{ color: c.textSecondary, fontSize: 15, fontWeight: '600' }}>{s.onboarding.skip}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        <Page width={width}>
          <Illustration source={require('../assets/onboarding/concept-rings.png')} />
          <PageText title={s.onboarding.ringsTitle} body={s.onboarding.ringsBody} />
        </Page>
        <Page width={width}>
          <Illustration source={require('../assets/onboarding/concept-onetap.png')} />
          <PageText title={s.onboarding.onetapTitle} body={s.onboarding.onetapBody} />
        </Page>
        <Page width={width}>
          <Illustration source={require('../assets/onboarding/concept-ready.png')} />
          <PageText title={s.onboarding.readyTitle} body={s.onboarding.readyBody} />
        </Page>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xxl, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        <Dots count={PAGES} active={page} />
        {page < PAGES - 1 ? (
          <Button title={s.onboarding.next} onPress={() => goTo(page + 1)} />
        ) : (
          <>
            <Button title={s.onboarding.start} onPress={() => void finish()} />
            <Pressable
              onPress={() => router.push({ pathname: '/how', params: { video: 'home' } })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={s.onboarding.seeHowTo}
              style={{ alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600' }}>{s.onboarding.seeHowTo}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ width, paddingHorizontal: spacing.xxl, justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </View>
  );
}

function Illustration({ source }: { source: number }) {
  const { spacing } = useTheme();
  return <Image source={source} style={{ width: 248, height: 248, marginBottom: spacing.xxl }} resizeMode="contain" />;
}

function PageText({ title, body }: { title: string; body: string }) {
  const { c, spacing } = useTheme();
  return (
    <>
      <Text style={{ color: c.textPrimary, fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 }}>
        {title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.lg, lineHeight: 23 }}>
        {body}
      </Text>
    </>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? c.accent : c.hairline,
          }}
        />
      ))}
    </View>
  );
}
