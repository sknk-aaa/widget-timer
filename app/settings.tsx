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
  HelpIcon,
  VibrationIcon,
  InfoIcon,
  ChatIcon,
  DocIcon,
  LockIcon,
} from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { PRIVACY_URL, TERMS_URL, CONTACT_URL, APP_STORE_URL } from '../src/domain/links';
import { openWriteReview } from '../src/native/review';
import { t } from '../src/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { c, spacing, radius } = useTheme();
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

        {!isPro && (
          <Pressable
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            accessibilityLabel={s.pro.title}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: c.accent,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <StarIcon color="#FFFFFF" size={22} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
                {s.pro.title}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>
                {s.pro.subtitle}
              </Text>
            </View>
            <ChevronIcon color="#FFFFFF" size={20} />
          </Pressable>
        )}

        <SectionLabel>{s.settings.feedback}</SectionLabel>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <MenuIcon color="#8B5CF6">
              <VibrationIcon color="#FFFFFF" size={16} />
            </MenuIcon>
            <Text style={{ color: c.textPrimary, fontSize: 15, fontWeight: '500' }}>{s.settings.haptics}</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(v) => {
              useSettingsStore.getState().setHapticsEnabled(v);
              if (v) haptics.light();
            }}
            accessibilityLabel={s.settings.haptics}
          />
        </View>

        <SectionLabel>{s.settings.pro}</SectionLabel>
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
        <View style={{ marginBottom: spacing.md }}>
          <Button title={s.settings.restore} variant="secondary" onPress={restore} />
        </View>
        <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, marginBottom: spacing.xl }}>
          <Row
            first
            icon={<MenuIcon color="#BC7400"><StarIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.review}
            chevron
            onPress={() => void openWriteReview()}
          />
          <Row
            icon={<MenuIcon color="#3B82F6"><ShareIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.share}
            chevron
            onPress={share}
          />
          <Row
            icon={<MenuIcon color="#FF6A1A"><GridIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.how.add}
            chevron
            onPress={() => router.push({ pathname: '/how', params: { video: 'add' } })}
          />
          <Row
            icon={<MenuIcon color="#0B8E8E"><HelpIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.faq}
            chevron
            onPress={() => router.push('/faq')}
          />
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
            icon={<MenuIcon color="#1E9E66"><ChatIcon color="#FFFFFF" size={16} /></MenuIcon>}
            label={s.settings.contact}
            chevron
            onPress={() => Linking.openURL(CONTACT_URL)}
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
