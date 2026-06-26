import * as React from 'react';
import { View, Text, ScrollView, Alert, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { usePresetsStore } from '../src/store/presets';
import { SOUND_IDS } from '../src/domain/types';
import { DEFAULT_COLOR_ID } from '../src/domain/colors';
import { DEFAULT_ICON_ID } from '../src/ui/icons/registry';
import { useTheme } from '../src/ui/theme';
import { WheelPicker } from '../src/ui/components/WheelPicker';
import { ColorPicker, IconPicker } from '../src/ui/components/Pickers';
import { Button } from '../src/ui/components/Button';
import { PresetTileVisual } from '../src/ui/components/PresetTile';
import { SheetHeader, SectionLabel } from '../src/ui/components/common';
import { TagIcon, ClockIcon, DropletIcon, ShapesIcon, BellGlyph } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { t } from '../src/i18n';

export default function PresetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
  const s = t();

  const params = useLocalSearchParams<{ id?: string }>();
  const presets = usePresetsStore((st) => st.presets);
  const existing = params.id ? presets.find((p) => p.id === params.id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = React.useState(existing?.name ?? '');
  const [durationSec, setDurationSec] = React.useState(existing?.durationSec ?? 300);
  const [icon, setIcon] = React.useState(existing?.icon ?? DEFAULT_ICON_ID);
  const [color, setColor] = React.useState(existing?.color ?? DEFAULT_COLOR_ID);
  const [sound, setSound] = React.useState(existing?.sound ?? 'default');
  const [dialActive, setDialActive] = React.useState(false);

  // 音プレビュー（'default' は iPhone 標準音なので試聴対象外）。
  const pXylophone = useAudioPlayer(require('../assets/sounds/xylophone.mp3'));
  const pDigital = useAudioPlayer(require('../assets/sounds/digital.mp3'));
  const pWhale = useAudioPlayer(require('../assets/sounds/whale.mp3'));
  const previewById: Record<string, ReturnType<typeof useAudioPlayer> | null> = {
    default: null,
    xylophone: pXylophone,
    digital: pDigital,
    whale: pWhale,
  };

  const onPickSound = (id: string) => {
    setSound(id);
    haptics.light();
    [pXylophone, pDigital, pWhale].forEach((p) => p.pause());
    const p = previewById[id];
    if (p) {
      p.seekTo(0);
      p.play();
    }
  };

  const close = () => router.back();

  const onSave = () => {
    if (durationSec <= 0) return;
    if (isEdit && existing) {
      usePresetsStore.getState().update(existing.id, { name: name.trim(), durationSec, icon, color, sound });
    } else {
      usePresetsStore.getState().create({ name: name.trim(), durationSec, icon, color, sound });
    }
    close();
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert(s.preset.delete, s.preset.deleteConfirm, [
      { text: s.common.cancel, style: 'cancel' },
      {
        text: s.preset.delete,
        style: 'destructive',
        onPress: () => {
          usePresetsStore.getState().remove(existing.id);
          close();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgElevated }} accessibilityViewIsModal>
      <ScrollView
        scrollEnabled={!dialActive}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SheetHeader
          title={isEdit ? s.preset.editTitle : s.preset.newTitle}
          onClose={close}
          right={
            <Pressable
              onPress={onSave}
              hitSlop={10}
              disabled={durationSec <= 0}
              accessibilityRole="button"
              accessibilityLabel={s.preset.save}
              accessibilityState={{ disabled: durationSec <= 0 }}
            >
              <Text
                style={{
                  color: durationSec <= 0 ? c.textTertiary : c.accent,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                {s.preset.save}
              </Text>
            </Pressable>
          }
        />

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          {name.trim().length > 0 && (
            <Text
              numberOfLines={1}
              style={{ color: c.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8, maxWidth: 220 }}
            >
              {name.trim()}
            </Text>
          )}
          <PresetTileVisual icon={icon} color={color} size={68} />
        </View>

        <View style={{ marginBottom: spacing.xxxl }}>
          <SectionLabel icon={<TagIcon color={c.textSecondary} size={15} />}>
            {s.preset.name}
          </SectionLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={s.preset.namePlaceholder}
            placeholderTextColor={c.textTertiary}
            maxLength={20}
            returnKeyType="done"
            style={{
              backgroundColor: c.surface,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              color: c.textPrimary,
              fontSize: 16,
              fontWeight: '600',
            }}
          />
        </View>

        <View style={{ marginBottom: spacing.xxxl }}>
          <SectionLabel icon={<ClockIcon color={c.textSecondary} size={15} />}>
            {s.preset.duration}
          </SectionLabel>
          <WheelPicker valueSec={durationSec} onChange={setDurationSec} onActiveChange={setDialActive} />
        </View>

        <View style={{ marginBottom: spacing.xxxl }}>
          <SectionLabel icon={<DropletIcon color={c.textSecondary} size={15} />}>
            {s.preset.color}
          </SectionLabel>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        <View style={{ marginBottom: spacing.xxxl }}>
          <SectionLabel icon={<ShapesIcon color={c.textSecondary} size={15} />}>
            {s.preset.icon}
          </SectionLabel>
          <IconPicker value={icon} color={color} onChange={setIcon} />
        </View>

        <View style={{ marginBottom: spacing.xxxl }}>
          <SectionLabel icon={<BellGlyph color={c.textSecondary} size={15} />}>
            {s.preset.sound}
          </SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {SOUND_IDS.map((id) => {
              const selected = sound === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => onPickSound(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={s.sounds[id]}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.md,
                    backgroundColor: selected ? c.accent : c.surface,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? '#FFFFFF' : c.textPrimary,
                      fontSize: 14,
                      fontWeight: '700',
                    }}
                  >
                    {s.sounds[id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isEdit && (
          <Button title={s.preset.delete} variant="ghost" onPress={onDelete} />
        )}
      </ScrollView>
    </View>
  );
}
