import * as React from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useProStore } from '../src/store/pro';
import { useSettingsStore } from '../src/store/settings';
import { useTheme } from '../src/ui/theme';
import { SheetHeader, SectionLabel } from '../src/ui/components/common';
import { Button } from '../src/ui/components/Button';
import {
  CheckIcon,
  ChevronIcon,
  StarIcon,
  ShareIcon,
  GridIcon,
  VibrationIcon,
  InfoIcon,
  ChatIcon,
  DocIcon,
  LockIcon,
  ClockIcon,
} from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { PRIVACY_URL, TERMS_URL, CONTACT_URL, APP_STORE_URL } from '../src/domain/links';
import { openWriteReview } from '../src/native/review';
import { t } from '../src/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius, isDark } = useTheme();
  const s = t();

  const isPro = useProStore((st) => st.isPro);
  const hapticsEnabled = useSettingsStore((st) => st.hapticsEnabled);

  const restore = async () => {
    const ok = await useProStore.getState().restore();
    Alert.alert(ok ? s.pro.restored : s.pro.title, ok ? '' : s.pro.notRestored);
  };

  const share = () => {
    void Share.share({ message: s.settings.shareMessage, url: APP_STORE_URL }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityViewIsModal>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
      >
        <SheetHeader title={s.settings.title} onClose={() => router.back()} />

        {isPro && (
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            accessibilityLabel={s.pro.active}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: c.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
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
              <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '700' }}>{s.pro.active}</Text>
              {s.pro.activeSub.length > 0 && (
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '500' }}>{s.pro.activeSub}</Text>
              )}
            </View>
            <ChevronIcon color={c.textTertiary} size={18} />
          </Pressable>
        )}
        <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, marginBottom: spacing.xl }}>
          <Row
            first
            icon={<MenuIcon color="#FF6A1A"><GridIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.how.add}
            chevron
            onPress={() => router.push({ pathname: '/how', params: { video: 'add' } })}
          />
          <Row
            icon={<MenuIcon color="#BC7400"><StarIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.review}
            chevron
            onPress={() => void openWriteReview()}
          />
          <Row
            icon={<MenuIcon color="#1E9E66"><ChatIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.contact}
            chevron
            onPress={() => Linking.openURL(CONTACT_URL)}
          />
          <Row
            icon={<MenuIcon color="#3B82F6"><ShareIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.share}
            chevron
            onPress={share}
          />
          <SwitchRow
            icon={<MenuIcon color="#8B5CF6"><VibrationIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.haptics}
            value={hapticsEnabled}
            onValueChange={(v) => {
              useSettingsStore.getState().setHapticsEnabled(v);
              if (v) haptics.light();
            }}
          />
        </View>

        {!isPro && (
          <ProUpgradeCard
            onPress={() => router.push('/paywall')}
            isDark={isDark}
            title={s.pro.settingsTitle}
            subtitle={s.pro.settingsSub}
            widgetLabel={s.pro.settingsFeatureWidgets}
            presetLabel={s.pro.settingsFeaturePresets}
          />
        )}

        <View style={{ marginBottom: spacing.xl }}>
          <Button title={s.settings.restore} variant="secondary" onPress={restore} />
        </View>

        <SectionLabel>{s.settings.about}</SectionLabel>
        <View style={{ backgroundColor: c.surface, borderRadius: radius.lg }}>
          <Row
            first
            icon={<MenuIcon color="#8A8A8E"><InfoIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.version}
            value={Constants.expoConfig?.version ?? '1.0.0'}
          />
          <Row
            icon={<MenuIcon color="#6366F1"><LockIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.privacy}
            chevron
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <Row
            icon={<MenuIcon color="#8A8A8E"><DocIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.terms}
            chevron
            onPress={() => Linking.openURL(TERMS_URL)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ProUpgradeCard({
  onPress,
  isDark,
  title,
  subtitle,
  widgetLabel,
  presetLabel,
}: {
  onPress: () => void;
  isDark: boolean;
  title: string;
  subtitle: string;
  widgetLabel: string;
  presetLabel: string;
}) {
  const { c, spacing, radius } = useTheme();
  const accentWash = isDark ? 'rgba(255,106,26,0.14)' : 'rgba(255,106,26,0.10)';
  const iconSurface = isDark ? 'rgba(255,255,255,0.08)' : '#F5F1ED';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.hairline,
        padding: spacing.md,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 15,
          backgroundColor: iconSurface,
          borderWidth: 1,
          borderColor: c.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 29,
            height: 29,
            borderRadius: 10,
            backgroundColor: c.accent,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX: -4 }, { translateY: -3 }],
          }}
        >
          <GridIcon color="#FFFFFF" size={16} />
        </View>
        <View
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            width: 24,
            height: 24,
            borderRadius: 9,
            backgroundColor: c.bgElevated,
            borderWidth: 1,
            borderColor: c.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClockIcon color={c.accent} size={14} />
        </View>
      </View>

      <View style={{ flex: 1, gap: 7 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '800' }}>{title}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 17 }}>{subtitle}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <FeaturePill color={accentWash} text={widgetLabel} />
          <FeaturePill color={accentWash} text={presetLabel} />
        </View>
      </View>
      <ChevronIcon color={c.textTertiary} size={18} />
    </Pressable>
  );
}

function FeaturePill({ color, text }: { color: string; text: string }) {
  const { c, spacing, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: color,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.sm,
        paddingVertical: 5,
      }}
    >
      <Text style={{ color: c.textPrimary, fontSize: 11, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

function MenuIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  chevron,
  onPress,
  first,
  icon,
}: {
  label: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  first?: boolean;
  icon?: React.ReactNode;
}) {
  const { c, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        {icon}
        <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {value != null && (
          <Text style={{ color: c.textSecondary, fontSize: 15, fontVariant: ['tabular-nums'] }}>
            {value}
          </Text>
        )}
        {chevron && <ChevronIcon color={c.textTertiary} size={18} />}
      </View>
    </Pressable>
  );
}

function SwitchRow({
  label,
  value,
  onValueChange,
  icon,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  const { c, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: c.hairline,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        {icon}
        <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '500' }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} />
    </View>
  );
}
