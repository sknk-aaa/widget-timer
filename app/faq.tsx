import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/ui/theme';
import { SheetHeader } from '../src/ui/components/common';
import { t } from '../src/i18n';

export default function FaqScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityViewIsModal>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SheetHeader title={s.faq.title} onClose={() => router.back()} />
        {s.faq.items.map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: c.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 6 }}>
              {item.q}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '500', lineHeight: 21 }}>
              {item.a}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
