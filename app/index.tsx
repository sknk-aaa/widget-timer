import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePresetsStore } from '../src/store/presets';
import { useBoardsStore, boardLabel } from '../src/store/boards';
import { useTimersStore } from '../src/store/timers';
import { useProStore } from '../src/store/pro';
import { useSettingsStore } from '../src/store/settings';
import { FREE_PRESETS_PER_BOARD, type Preset, type Board } from '../src/domain/types';
import { useTheme } from '../src/ui/theme';
import { PresetBoard } from '../src/ui/components/PresetBoard';
import { RunningTimerRow } from '../src/ui/components/RunningTimerRow';
import { Snackbar } from '../src/ui/components/Snackbar';
import { PressableScale } from '../src/ui/components/PressableScale';
import { Banner } from '../src/ui/components/common';
import { MenuIcon, PlusIcon } from '../src/ui/icons/ui';
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
  const boards = useBoardsStore((st) => st.boards);
  const currentBoardId = useBoardsStore((st) => st.currentBoardId);
  const membership = useBoardsStore((st) => st.membership);
  const timers = useTimersStore((st) => st.timers);
  const pendingCancel = useTimersStore((st) => st.pendingCancel);
  const isPro = useProStore((st) => st.isPro);

  const [editMode, setEditMode] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  // ホームウィジェットのディープリンク（imasugutimer://?start=ID）の受け口。
  // 別画面を作らずメイン画面のまま起動するので、画面遷移も戻る履歴も発生しない。
  const params = useLocalSearchParams<{ start?: string }>();
  React.useEffect(() => {
    const id = params.start;
    if (!id) return;
    if (!useSettingsStore.getState().onboardingDone) return;
    const p = usePresetsStore.getState().presets.find((x) => x.id === id);
    if (p) {
      haptics.start();
      void useTimersStore.getState().startFromPreset(p, 'widget');
    }
    router.setParams({ start: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.start]);

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  const boardPresetIds = currentBoardId ? (membership[currentBoardId] ?? []) : [];
  const boardMax: number | '∞' = isPro ? '∞' : FREE_PRESETS_PER_BOARD;

  const launch = async (p: Preset) => {
    haptics.start();
    await useTimersStore.getState().startFromPreset(p, 'app');
  };

  const onSetBoard = (ids: string[]): boolean => {
    if (!currentBoardId) return false;
    const ok = useBoardsStore.getState().setBoardOrder(currentBoardId, ids);
    if (!ok) router.push('/paywall');
    return ok;
  };

  const onRemoveFromBoard = (presetId: string) => {
    if (!currentBoardId) return;
    haptics.remove();
    useBoardsStore.getState().removeFromBoard(currentBoardId, presetId);
  };

  const onAddBoard = () => {
    const b = useBoardsStore.getState().createBoard();
    if (!b) {
      router.push('/paywall');
      return;
    }
    haptics.light();
  };

  const onEditBoard = (board: Board) => {
    const idx = boards.findIndex((x) => x.id === board.id);
    const label = boardLabel(board, idx, s.board.fallbackName);
    const buttons: Parameters<typeof Alert.alert>[2] = [
      {
        text: s.board.rename,
        onPress: () => {
          Alert.prompt(
            s.board.renameTitle,
            undefined,
            (text) => useBoardsStore.getState().renameBoard(board.id, (text ?? '').slice(0, 16)),
            'plain-text',
            board.name,
          );
        },
      },
    ];
    if (boards.length > 1) {
      buttons.push({
        text: s.board.remove,
        style: 'destructive',
        onPress: () => {
          haptics.remove();
          useBoardsStore.getState().removeBoard(board.id);
        },
      });
    }
    buttons.push({ text: s.common.cancel, style: 'cancel' });
    Alert.alert(label, undefined, buttons);
  };

  const onDeleteBoard = (board: Board) => {
    if (boards.length <= 1) return;
    const idx = boards.findIndex((x) => x.id === board.id);
    const label = boardLabel(board, idx, s.board.fallbackName);
    Alert.alert(label, s.board.removeConfirm, [
      { text: s.common.cancel, style: 'cancel' },
      {
        text: s.board.remove,
        style: 'destructive',
        onPress: () => {
          haptics.remove();
          useBoardsStore.getState().removeBoard(board.id);
        },
      },
    ]);
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
          useBoardsStore.getState().load();
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
            accessibilityLabel={s.main.editExit}
          >
            <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>{s.main.editDone}</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl }}>
            <Pressable
              onPress={() => {
                setEditMode(true);
                haptics.light();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={s.main.edit}
            >
              <Text style={{ color: c.accent, fontSize: 16, fontWeight: '700' }}>{s.main.edit}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={s.main.menu}
            >
              <MenuIcon color={c.textPrimary} size={24} />
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
          boards={boards}
          currentBoardId={currentBoardId}
          boardName={(b, i) => boardLabel(b, i, s.board.fallbackName)}
          allPresets={presets}
          boardPresetIds={boardPresetIds}
          boardCountLabel={s.board.onWidgetCount(boardPresetIds.length, boardMax)}
          editMode={editMode}
          onSelectBoard={(id) => useBoardsStore.getState().setCurrent(id)}
          onAddBoard={onAddBoard}
          onEditBoard={onEditBoard}
          onDeleteBoard={onDeleteBoard}
          onLaunch={launch}
          onEdit={(p) => {
            haptics.light();
            router.push({ pathname: '/preset', params: { id: p.id } });
          }}
          onDeletePreset={onDeletePreset}
          onRemoveFromBoard={onRemoveFromBoard}
          onAddPreset={onAddPreset}
          onSetBoard={onSetBoard}
          onReorderAll={(ids) => usePresetsStore.getState().reorder(ids)}
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

      <Snackbar
        visible={!!pendingCancel}
        message={s.timer.cancelled}
        actionLabel={s.common.undo}
        onAction={() => useTimersStore.getState().undoCancel()}
      />
    </View>
  );
}
