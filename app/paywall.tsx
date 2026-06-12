import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '../src/store/pro';
import { useTheme } from '../src/ui/theme';
import { Button } from '../src/ui/components/Button';
import { CheckIcon, StarIcon } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { PRIVACY_URL, TERMS_URL } from '../src/domain/links';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();
  const [loading, setLoading] = React.useState(false);

  const features = [
    { title: s.pro.featureWidget, sub: s.pro.featureWidgetSub },
    { title: s.pro.featureAnalytics, sub: s.pro.featureAnalyticsSub },
    { title: s.pro.featureSupport, sub: s.pro.featureSupportSub },
  ];

  const purchase = async () => {
    setLoading(true);
    const ok = await useProStore.getState().purchase();
    setLoading(false);
    if (ok) {
      haptics.start();
      router.back();
    }
  };

  const restore = async () => {
    const ok = await useProStore.getState().restore();
    if (ok) {
      haptics.light();
      router.back();
    } else {
      Alert.alert(s.pro.title, s.pro.notRestored);
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

        <View style={{ alignItems: 'center', marginBottom: spacing.xxl, marginTop: spacing.lg }}>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 23,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: c.accent,
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              marginBottom: spacing.lg,
            }}
          >
            <StarIcon color="#FFFFFF" size={38} />
          </View>
          <Text style={{ color: c.textPrimary, fontSize: 25, fontWeight: '900', letterSpacing: 0.2 }}>
            {s.pro.title}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 5, textAlign: 'center' }}>
            {s.pro.subtitle}
          </Text>
        </View>

        <View style={{ gap: spacing.lg, marginBottom: spacing.xxl }}>
          {features.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckIcon color="#FFFFFF" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.textPrimary, fontSize: 16, fontWeight: '700' }}>{f.title}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 1 }}>
                  {f.sub}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md }}>
          {s.pro.oneTime}
        </Text>
        <Button title={s.pro.cta} onPress={purchase} loading={loading} />
        <Pressable
          onPress={restore}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={s.pro.restore}
          style={{ alignItems: 'center', marginTop: spacing.lg }}
        >
          <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '600' }}>{s.pro.restore}</Text>
        </Pressable>

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
