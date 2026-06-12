import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ICON_CATEGORIES, IconGlyph } from '../icons/registry';
import { PALETTE, colorOf } from '../../domain/colors';
import { useTheme } from '../theme';

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { c, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {PALETTE.map((p) => {
        const on = p.id === value;
        return (
          <Pressable
            key={p.id}
            onPress={() => {
              onChange(p.id);
              void Haptics.selectionAsync();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: p.bg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: on ? 3 : 0,
              borderColor: c.bg,
              ...(on
                ? {
                    shadowColor: p.bg,
                    shadowOpacity: 0.6,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : null),
            }}
          >
            {on && (
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  position: 'absolute',
                  borderWidth: 2,
                  borderColor: p.bg,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (id: string) => void;
}) {
  const { c, radius, spacing } = useTheme();
  const def = colorOf(color);
  return (
    <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
      {ICON_CATEGORIES.map((cat) => (
        <View key={cat.key} style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 12,
              fontWeight: '700',
              marginBottom: spacing.sm,
              letterSpacing: 0.4,
            }}
          >
            {cat.label}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {cat.ids.map((id) => {
              const on = id === value;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    onChange(id);
                    void Haptics.selectionAsync();
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: radius.md,
                    backgroundColor: on ? def.bg : c.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconGlyph id={id} size={26} color={on ? '#FFFFFF' : c.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
