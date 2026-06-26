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
import { PlusIcon, BellGlyph } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

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

  const finish = () => {
    useSettingsStore.getState().completeOnboarding();
    // 設定からの再表示は戻る、初回（スタックなし）はメインへ。
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const requestPermission = async () => {
    await alarmService.requestPermission();
    await useSettingsStore.getState().refreshPermission();
    haptics.start();
    goTo(2);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.xl, height: 44, justifyContent: 'center' }}>
        {page < 2 && (
          <Pressable onPress={finish} hitSlop={10} accessibilityRole="button" accessibilityLabel={s.onboarding.skip}>
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
          <ConceptPage />
        </Page>
        <Page width={width}>
          <PermissionPage />
        </Page>
        <Page width={width}>
          <WidgetPage />
        </Page>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xxl, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
        <Dots count={3} active={page} />
        {page === 0 && <Button title={s.onboarding.next} onPress={() => goTo(1)} />}
        {page === 1 && (
          <>
            <Button title={s.onboarding.page2Cta} onPress={requestPermission} />
            <Pressable
              onPress={() => goTo(2)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={s.onboarding.page2Later}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600' }}>{s.onboarding.page2Later}</Text>
            </Pressable>
          </>
        )}
        {page === 2 && <Button title={s.onboarding.start} onPress={finish} />}
      </View>
    </View>
  );
}

function Page({ width, children }: { width: number; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ width, paddingHorizontal: spacing.xxl, justifyContent: 'center' }}>{children}</View>
  );
}

function ConceptPage() {
  const { c, spacing } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxxl }}>
        <PresetTileVisual icon="ramen" color="orange" size={64} />
        <PresetTileVisual icon="bed" color="indigo" size={64} />
        <PresetTileVisual icon="book" color="blue" size={64} />
      </View>
      <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 }}>
        {s.onboarding.page1Title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.lg, lineHeight: 23 }}>
        {s.onboarding.page1Body}
      </Text>
    </View>
  );
}

function PermissionPage() {
  const { c, spacing } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 30,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xxxl,
          shadowColor: c.accent,
          shadowOpacity: 0.4,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        }}
      >
        <BellGlyph color="#FFFFFF" size={48} />
      </View>
      <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
        {s.onboarding.page2Title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.lg, lineHeight: 23 }}>
        {s.onboarding.page2Body}
      </Text>
    </View>
  );
}

function WidgetPage() {
  const { c, spacing } = useTheme();
  const s = t();
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 28,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xxxl,
          padding: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
          <PresetTileVisual icon="ramen" color="orange" size={44} glow={false} />
          <PresetTileVisual icon="bed" color="indigo" size={44} glow={false} />
          <PresetTileVisual icon="book" color="blue" size={44} glow={false} />
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: c.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlusIcon color={c.textTertiary} size={20} />
          </View>
        </View>
      </View>
      <Text style={{ color: c.textPrimary, fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
        {s.onboarding.page3Title}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.lg, lineHeight: 23 }}>
        {s.onboarding.page3Body}
      </Text>
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
