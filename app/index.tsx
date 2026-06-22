import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePresetsStore, selectHidden, selectWidget } from '../src/store/presets';
import { useTimersStore } from '../src/store/timers';
import { useProStore } from '../src/store/pro';
import { useSettingsStore } from '../src/store/settings';
import { FREE_WIDGET_SLOTS, type Preset } from '../src/domain/types';
import { useTheme } from '../src/ui/theme';
import { PresetBoard } from '../src/ui/components/PresetBoard';
import { RunningTimerRow } from '../src/ui/components/RunningTimerRow';
import { PressableScale } from '../src/ui/components/PressableScale';
import { Banner } from '../src/ui/components/common';
import { GearIcon, PlusIcon } from '../src/ui/icons/ui';
import { haptics } from '../src/ui/haptics';
import { enterItem, exitItem, listLayout } from '../src/ui/motion';
import { openAppSettings } from '../src/native/settings';
import { t } from '../src/i18n';

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { c, spacing } = useTheme();
  const s = t();

  const onboardingDone = useSettingsStore((st) => st.onboardingDone);
  const alarmPermission = useSettingsStore((st) => st.alarmPermission);
  const presets = usePresetsStore((st) => st.presets);
  const applyArrangement = usePresetsStore((st) => st.applyArrangement);
  const timers = useTimersStore((st) => st.timers);
  const isPro = useProStore((st) => st.isPro);

  const [editMode, setEditMode] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  const hidden = selectHidden(presets);
  const widget = selectWidget(presets);
  const widgetMax = isPro ? '∞' : FREE_WIDGET_SLOTS;

  const launch = async (p: Preset) => {
    haptics.start();
    await useTimersStore.getState().startFromPreset(p, 'app');
  };

  const onArrange = (hiddenIds: string[], widgetIds: string[]): boolean => {
    const ok = applyArrangement(hiddenIds, widgetIds);
    if (!ok) {
      router.push('/paywall');
    }
    return ok;
  };

  const onDeletePreset = (p: Preset) => {
    Alert.alert(s.preset.delete, s.preset.deleteConfirm, [
      { text: s.common.cancel, style: 'cancel' },
      {
        text: s.preset.delete,
        style: 'destructive',
        onPress: () => {
          haptics.remove();
          usePresetsStore.getState().remove(p.id);
        },
      },
    ]);
  };

  const onAddPreset = () => {
    haptics.light();
    router.push('/preset');
  };

  const sortedTimers = [...timers].sort((a, b) => {
    const ra = a.state === 'paused' ? (a.pausedRemainingSec ?? 0) * 1000 : a.endAt;
    const rb = b.state === 'paused' ? (b.pausedRemainingSec ?? 0) * 1000 : b.endAt;
    return ra - rb;
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          height: 52,
        }}
      >
        <Text style={{ color: c.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 0.2 }}>
          {s.appName}
        </Text>
        {editMode ? (
          <Pressable
            onPress={() => {
              setEditMode(false);
              haptics.light();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="編集を終了"
          >
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>完了</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="設定"
            >
              <GearIcon color={c.textPrimary} size={23} />
            </Pressable>
            <Pressable
              onPress={() => {
                setEditMode(true);
                haptics.light();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="編集"
            >
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>編集</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        scrollEnabled={!dragActive}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {alarmPermission !== 'granted' && (
          <View style={{ marginBottom: spacing.lg }}>
            <Banner
              text={s.alarm.permissionDeniedBody}
              actionLabel={s.alarm.openSettings}
              onAction={openAppSettings}
            />
          </View>
        )}

        <PresetBoard
          hidden={hidden}
          widget={widget}
          editMode={editMode}
          hiddenLabel={s.main.areaHidden}
          widgetLabel={s.main.areaWidget}
          widgetCountLabel={s.main.widgetSlots(widget.length, widgetMax)}
          onLaunch={launch}
          onEdit={(p) => {
            haptics.light();
            router.push({ pathname: '/preset', params: { id: p.id } });
          }}
          onDelete={onDeletePreset}
          onAdd={onAddPreset}
          onArrange={onArrange}
          onDragActiveChange={setDragActive}
        />

        {editMode && (
          <Text
            style={{
              color: c.textTertiary,
              fontSize: 12,
              fontWeight: '600',
              textAlign: 'center',
              marginTop: spacing.xs,
            }}
          >
            {s.main.dragHint}
          </Text>
        )}

        {sortedTimers.length > 0 && (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            {sortedTimers.map((timer) => (
              <Animated.View
                key={timer.id}
                entering={enterItem}
                exiting={exitItem}
                layout={listLayout}
              >
                <RunningTimerRow
                  timer={timer}
                  onPause={() => useTimersStore.getState().pause(timer.id)}
                  onResume={() => useTimersStore.getState().resume(timer.id)}
                  onCancel={() => {
                    haptics.remove();
                    void useTimersStore.getState().cancel(timer.id);
                  }}
                  onDismiss={() => useTimersStore.getState().dismiss(timer.id)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {!editMode && (
        <PressableScale
          onPress={() => router.push('/quick')}
          haptic={haptics.primary}
          accessibilityRole="button"
          accessibilityLabel={s.quick.title}
          style={{
            position: 'absolute',
            right: spacing.xl,
            bottom: insets.bottom + spacing.xl,
            height: 60,
            paddingHorizontal: spacing.xxl,
            borderRadius: 30,
            backgroundColor: c.accent,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            shadowColor: c.accent,
            shadowOpacity: 0.5,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <PlusIcon color="#FFFFFF" size={22} />
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>
            {s.main.quickStart}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}
