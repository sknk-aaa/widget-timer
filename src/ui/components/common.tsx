import * as React from 'react';
import { View, Text, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { t } from '../../i18n';

export function SheetHeader({
  title,
  onClose,
  right,
}: {
  title: string;
  onClose?: () => void;
  right?: React.ReactNode;
}) {
  const { c, spacing } = useTheme();
  const s = t();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing.lg,
      }}
    >
      <View style={{ width: 60 }}>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={s.common.close}>
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '600' }}>{s.common.close}</Text>
          </Pressable>
        )}
      </View>
      <Text accessibilityRole="header" style={{ color: c.textPrimary, fontSize: 17, fontWeight: '700' }}>
        {title}
      </Text>
      <View style={{ width: 60, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c, spacing } = useTheme();
  return (
    <Text
      style={{
        color: c.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
        marginBottom: spacing.sm,
      }}
    >
      {children}
    </Text>
  );
}

export function Banner({
  text,
  actionLabel,
  onAction,
  tone = 'warning',
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'warning' | 'info';
}) {
  const { c, radius, spacing } = useTheme();
  const accent = tone === 'warning' ? c.danger : c.accent;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: c.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: accent,
      }}
    >
      <Text style={{ flex: 1, color: c.textPrimary, fontSize: 13, fontWeight: '500' }}>{text}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, radius, spacing } = useTheme();
  return (
    <View
      style={[
        { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}
