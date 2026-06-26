import * as React from 'react';
import { View, Text, Image, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '../src/store/pro';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { CheckIcon } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { PRIVACY_URL, TERMS_URL } from '../src/domain/links';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();
  const price = useProStore((st) => st.price);
  const isPro = useProStore((st) => st.isPro);
  const supportPrice = useProStore((st) => st.supportPrice);
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);

  const benefits = [
    { title: s.pro.featureWidget, sub: s.pro.featureWidgetSub },
    { title: s.pro.featureSupport, sub: s.pro.featureSupportSub },
  ];
  const pills = [s.pro.pillOnce, s.pro.pillNoAds, s.pro.pillNoData];

  const purchase = async () => {
    if (loading) return;
    setLoading(true);
    const result = await useProStore.getState().purchase();
    setLoading(false);
    if (result === 'purchased') {
      haptics.start();
      router.back();
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
    const r = await useProStore.getState().support();
    if (r === 'purchased') {
      haptics.start();
      Alert.alert(s.pro.title, s.settings.supportThanks);
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

        {/* ヒーロー */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.lg }}>
          <View
            style={{
              borderRadius: 24,
              marginBottom: spacing.lg,
              shadowColor: c.accent,
              shadowOpacity: 0.45,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            <Image
              source={require('../assets/icon.png')}
              style={{ width: 92, height: 92, borderRadius: 24 }}
            />
          </View>
          <Text
            style={{
              color: c.textPrimary,
              fontSize: 26,
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

        {/* 特典カード */}
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            gap: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          {benefits.map((b) => (
            <View key={b.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                <CheckIcon color="#FFFFFF" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '800' }}>{b.title}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 2, lineHeight: 18 }}>
                  {b.sub}
                </Text>
              </View>
            </View>
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
          </>
        )}

        {/* 応援（2つ目の選択肢） */}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={supportPrice ? `${s.settings.support} ${supportPrice}` : s.settings.support}
            variant="secondary"
            onPress={() => void support()}
          />
        </View>

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
