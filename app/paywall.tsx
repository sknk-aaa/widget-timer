import * as React from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '../src/store/pro';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { CheckIcon, ClockIcon, GridIcon, StarIcon } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { PRIVACY_URL, TERMS_URL } from '../src/domain/links';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius, isDark } = useTheme();
  const s = t();
  const price = useProStore((st) => st.price);
  const isPro = useProStore((st) => st.isPro);
  const supportPrice = useProStore((st) => st.supportPrice);
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [supporting, setSupporting] = React.useState(false);

  const benefits = [
    { title: s.pro.featureBoards, sub: s.pro.featureBoardsSub, icon: 'grid' as const },
    { title: s.pro.featurePresets, sub: s.pro.featurePresetsSub, icon: 'clock' as const },
    { title: s.pro.featureOneTime, sub: s.pro.featureOneTimeSub, icon: 'star' as const },
  ];
  const pills = [s.pro.pillOnce, s.pro.pillNoAds, s.pro.pillNoData];

  React.useEffect(() => {
    if (!price || !supportPrice) void useProStore.getState().loadPrices();
  }, [price, supportPrice]);

  const purchase = async () => {
    if (loading || supporting) return;
    setLoading(true);
    const result = await useProStore.getState().purchase();
    setLoading(false);
    if (result === 'purchased') {
      haptics.start();
      // 購入直後に「複数ウィジェットの使い方」モーダルを表示（ペイウォールを置き換え）。
      router.replace('/welcome-pro');
    } else if (result === 'pending') {
      Alert.alert(s.pro.title, s.pro.pending);
    } else if (result === 'failed') {
      Alert.alert(s.pro.title, s.pro.purchaseFailed);
    }
  };

  const restore = async () => {
    if (restoring) return;
    setRestoring(true);
    const ok = await useProStore.getState().restore();
    setRestoring(false);
    if (ok) {
      haptics.light();
      router.back();
    } else {
      Alert.alert(s.pro.title, s.pro.notRestored);
    }
  };

  const support = async () => {
    if (loading || supporting) return;
    setSupporting(true);
    const r = await useProStore.getState().support().finally(() => setSupporting(false));
    if (r === 'purchased') {
      haptics.start();
      // 「Pro＋応援」は Pro を付与するので、購入後は使い方モーダルへ。
      router.replace('/welcome-pro');
    } else if (r === 'pending') {
      Alert.alert(s.pro.title, s.pro.pending);
    } else if (r === 'failed') {
      Alert.alert(s.pro.title, s.pro.purchaseFailed);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityViewIsModal>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.xxxl,
          paddingBottom: insets.bottom + spacing.lg,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={s.common.close}
          style={{ position: 'absolute', top: spacing.lg, right: spacing.xl, zIndex: 1 }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 16, fontWeight: '600' }}>{s.common.close}</Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.lg }}>
          <View
            style={{
              borderRadius: 22,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: c.hairline,
              shadowColor: c.accent,
              shadowOpacity: isDark ? 0.25 : 0.16,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 74, height: 74, borderRadius: 22 }}
            />
          </View>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(255,106,26,0.16)' : 'rgba(255,106,26,0.10)',
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              marginBottom: spacing.sm,
            }}
          >
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '900' }}>{s.pro.title}</Text>
          </View>
          <Text
            style={{
              color: c.textPrimary,
              fontSize: 25,
              fontWeight: '900',
              letterSpacing: 0.2,
              textAlign: 'center',
            }}
          >
            {s.pro.headline}
          </Text>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 14,
              fontWeight: '600',
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {s.pro.subtitle}
          </Text>
        </View>

        <ComparePanel
          freeTitle={s.pro.compareFree}
          freeSub={s.pro.compareFreeSub}
          proTitle={s.pro.comparePro}
          proSub={s.pro.compareProSub}
        />

        <View
          style={{
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          {benefits.map((b) => (
            <FeatureCard key={b.title} title={b.title} sub={b.sub} icon={b.icon} />
          ))}
        </View>

        {/* 信頼ピル */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {pills.map((p) => (
            <View
              key={p}
              style={{
                backgroundColor: c.surfaceAlt,
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700' }}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: spacing.lg }} />

        {/* 購入 / Pro有効 */}
        {isPro ? (
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={{ color: c.accent, fontSize: 17, fontWeight: '900' }}>{s.pro.active}</Text>
            {s.pro.activeSub.length > 0 && (
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                {s.pro.activeSub}
              </Text>
            )}
          </View>
        ) : (
          <>
            {price && (
              <Text style={{ color: c.textPrimary, fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 2 }}>
                {price}
              </Text>
            )}
            <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: spacing.md }}>
              {s.pro.oneTime}
            </Text>
            <Button title={s.pro.cta} onPress={purchase} loading={loading} />
            <Pressable
              onPress={restore}
              disabled={restoring}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={s.pro.restore}
              accessibilityState={{ busy: restoring }}
              style={{ alignItems: 'center', marginTop: spacing.md, opacity: restoring ? 0.5 : 1 }}
            >
              <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600' }}>
                {restoring ? s.pro.restoring : s.pro.restore}
              </Text>
            </Pressable>

            {/* 「Pro＋応援」= もう一つの選択肢（Proも付与）。Pro取得後は非表示。 */}
            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={supporting ? s.pro.supportLoading : supportPrice ? `${s.settings.support} ${supportPrice}` : s.settings.support}
                variant="secondary"
                onPress={() => void support()}
                loading={supporting}
              />
            </View>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.lg }}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '600' }}>{s.settings.privacy}</Text>
          </Pressable>
          <Text style={{ color: c.textTertiary, fontSize: 12 }}>・</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '600' }}>{s.settings.terms}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ComparePanel({
  freeTitle,
  freeSub,
  proTitle,
  proSub,
}: {
  freeTitle: string;
  freeSub: string;
  proTitle: string;
  proSub: string;
}) {
  const { c, spacing, radius, isDark } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
      }}
    >
      <CompareCell title={freeTitle} sub={freeSub} muted />
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(255,106,26,0.16)' : 'rgba(255,106,26,0.10)',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,106,26,0.28)' : 'rgba(255,106,26,0.22)',
          padding: spacing.md,
          gap: spacing.xs,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <CheckIcon color={c.accent} size={16} />
          <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '900' }}>{proTitle}</Text>
        </View>
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700', lineHeight: 17 }}>{proSub}</Text>
      </View>
    </View>
  );
}

function CompareCell({ title, sub, muted }: { title: string; sub: string; muted?: boolean }) {
  const { c, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.hairline,
        padding: spacing.md,
        gap: spacing.xs,
        opacity: muted ? 0.82 : 1,
      }}
    >
      <Text style={{ color: c.textPrimary, fontSize: 14, fontWeight: '900' }}>{title}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700', lineHeight: 17 }}>{sub}</Text>
    </View>
  );
}

function FeatureCard({ title, sub, icon }: { title: string; sub: string; icon: 'grid' | 'clock' | 'star' }) {
  const { c, spacing, radius, isDark } = useTheme();
  const Icon = icon === 'grid' ? GridIcon : icon === 'clock' ? ClockIcon : StarIcon;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.hairline,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: isDark ? 'rgba(255,106,26,0.18)' : 'rgba(255,106,26,0.11)',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <Icon color={c.accent} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 3, lineHeight: 18 }}>
          {sub}
        </Text>
      </View>
    </View>
  );
}
