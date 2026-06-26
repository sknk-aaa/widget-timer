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
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../src/store/settings';
import { alarmService } from '../src/native/alarm';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

const PAGES = 3;

// オンボは常に白背景・明るい配色（ダークモードでも固定）。
const OB = {
  bg: '#FFFFFF',
  title: '#16161A',
  body: '#6B6B72',
  accent: '#FF6A1A',
  dotOff: '#E3E3E6',
  skip: '#9A9AA0',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { spacing } = useTheme();
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
    if (firstRun) {
      await alarmService.requestPermission();
      await useSettingsStore.getState().refreshPermission();
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: OB.bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.xl, height: 44, justifyContent: 'center' }}>
        {page < PAGES - 1 && (
          <Pressable onPress={() => void finish()} hitSlop={10} accessibilityRole="button" accessibilityLabel={s.onboarding.skip}>
            <Text style={{ color: OB.skip, fontSize: 15, fontWeight: '600' }}>{s.onboarding.skip}</Text>
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
        <Page width={width} spacing={spacing.xxl}>
          <Illustration source={require('../assets/onboarding/concept-rings.png')} />
          <PageText title={s.onboarding.ringsTitle} body={s.onboarding.ringsBody} />
        </Page>
        <Page width={width} spacing={spacing.xxl}>
          <Illustration source={require('../assets/onboarding/concept-onetap.png')} />
          <PageText title={s.onboarding.onetapTitle} body={s.onboarding.onetapBody} />
        </Page>
        <Page width={width} spacing={spacing.xxl}>
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
              onPress={() => router.push({ pathname: '/how', params: { video: 'add' } })}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={s.onboarding.seeHowTo}
              style={{ alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Text style={{ color: OB.accent, fontSize: 14, fontWeight: '700' }}>{s.onboarding.seeHowTo}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function Page({ width, spacing, children }: { width: number; spacing: number; children: React.ReactNode }) {
  return (
    <View style={{ width, paddingHorizontal: spacing, justifyContent: 'center', alignItems: 'center' }}>
      {children}
    </View>
  );
}

function Illustration({ source }: { source: number }) {
  return <Image source={source} style={{ width: 264, height: 264, marginBottom: 28 }} resizeMode="contain" />;
}

function PageText({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Text style={{ color: OB.title, fontSize: 25, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 }}>
        {title}
      </Text>
      <Text style={{ color: OB.body, fontSize: 15, textAlign: 'center', marginTop: 14, lineHeight: 23 }}>
        {body}
      </Text>
    </>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? OB.accent : OB.dotOff,
          }}
        />
      ))}
    </View>
  );
}
