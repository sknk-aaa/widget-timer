import * as React from 'react';
import {
  View,
  Text,
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
import { PresetTileVisual } from '../src/ui/components/PresetTile';
import { PlusIcon, ChevronIcon } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

const PAGES = 4;

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
    // 初回オンボ完了時に通知（アラーム）許可を求める。設定からの再表示では求めない。
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
        <Page width={width}><HomeAddPage /></Page>
        <Page width={width}><LockAddPage /></Page>
        <Page width={width}><EditPage /></Page>
        <Page width={width}><StartPage /></Page>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xxl, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
        <Dots count={PAGES} active={page} />
        {page < PAGES - 1 ? (
          <Button title={s.onboarding.next} onPress={() => goTo(page + 1)} />
        ) : (
          <Button title={s.onboarding.start} onPress={() => void finish()} />
        )}
      </View>
    </View>
  );
}

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ width, paddingHorizontal: spacing.xxl, justifyContent: 'center' }}>{children}</View>;
}

function PageText({ title, body }: { title: string; body: string }) {
  const { c, spacing } = useTheme();
  return (
    <>
      <Text style={{ color: c.textPrimary, fontSize: 25, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 }}>
        {title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.lg, lineHeight: 23 }}>
        {body}
      </Text>
    </>
  );
}

function DashedAdd({ size }: { size: number }) {
  const { c } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: c.hairline,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PlusIcon color={c.textTertiary} size={size * 0.42} />
    </View>
  );
}

function HomeAddPage() {
  const { c, spacing } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 154,
          height: 154,
          borderRadius: 28,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
          marginBottom: spacing.xxxl,
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
          <PresetTileVisual icon="ramen" color="orange" size={46} glow={false} />
          <PresetTileVisual icon="bed" color="indigo" size={46} glow={false} />
          <PresetTileVisual icon="book" color="blue" size={46} glow={false} />
          <DashedAdd size={46} />
        </View>
      </View>
      <PageText title={s.onboarding.homeTitle} body={s.onboarding.homeBody} />
    </View>
  );
}

function LockAddPage() {
  const { spacing } = useTheme();
  const s = t();
  const chips = [
    { i: 'ramen', col: 'orange' },
    { i: 'bed', col: 'indigo' },
    { i: 'book', col: 'blue' },
  ];
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 210,
          borderRadius: 22,
          backgroundColor: '#1C1C1E',
          padding: spacing.md,
          marginBottom: spacing.xxxl,
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '800', marginBottom: 8, marginLeft: 4 }}>
          9:41
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {chips.map((chip) => (
            <View
              key={chip.i}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 7,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.14)',
              }}
            >
              <PresetTileVisual icon={chip.i} color={chip.col} size={26} glow={false} />
            </View>
          ))}
        </View>
      </View>
      <PageText title={s.onboarding.lockTitle} body={s.onboarding.lockBody} />
    </View>
  );
}

function EditPage() {
  const { c, spacing, radius } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xxxl }}>
        <PresetTileVisual icon="book" color="blue" size={56} />
        <View style={{ width: 224, backgroundColor: c.surface, borderRadius: radius.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '700' }}>{s.onboarding.editTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '800' }}>{s.board.fallbackName(2)}</Text>
              <ChevronIcon color={c.textTertiary} size={16} />
            </View>
          </View>
        </View>
      </View>
      <PageText title={s.onboarding.editTitle} body={s.onboarding.editBody} />
    </View>
  );
}

function StartPage() {
  const { spacing } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxxl }}>
        <PresetTileVisual icon="ramen" color="orange" size={60} />
        <PresetTileVisual icon="bed" color="indigo" size={60} />
        <PresetTileVisual icon="book" color="blue" size={60} />
      </View>
      <PageText title={s.onboarding.startTitle} body={s.onboarding.startBody} />
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
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
