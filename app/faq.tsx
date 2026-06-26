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
            <View style={{ flexDirection: 'row', gap: 9, marginBottom: 9 }}>
              <QaBadge letter="Q" color={c.accent} />
              <Text style={{ flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '800', lineHeight: 21 }}>
                {item.q}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 9 }}>
              <QaBadge letter="A" color={c.textTertiary} />
              <Text style={{ flex: 1, color: c.textSecondary, fontSize: 14, fontWeight: '500', lineHeight: 21 }}>
                {item.a}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function QaBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{letter}</Text>
    </View>
  );
}
