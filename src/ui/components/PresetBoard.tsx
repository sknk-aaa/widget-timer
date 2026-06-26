import * as React from 'react';
import { View, Text, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  cancelAnimation,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import { PresetTileVisual, TILE_SIZE } from './PresetTile';
import { PlusIcon } from '../icons/ui';
import { formatDurationShort } from '../../domain/format';
import { springs, listLayout } from '../motion';
import { haptics } from '../haptics';
import type { Preset, Board } from '../../domain/types';
import { useTheme, type Theme } from '../theme';
import { t } from '../../i18n';

const PAD = 2;
const GAP = 16;
const CELL_W = TILE_SIZE + GAP;
const BASE_CELL_H = TILE_SIZE + 24 + GAP;
const LABEL_BLOCK = 40;

type Zone = 'board' | 'master';

interface Props {
  boards: Board[];
  currentBoardId: string | null;
  boardName: (board: Board, index: number) => string;
  allPresets: Preset[];
  boardPresetIds: string[];
  boardCountLabel: string;
  editMode: boolean;
  onSelectBoard: (id: string) => void;
  onAddBoard: () => void;
  onEditBoard: (board: Board) => void;
  onLaunch: (p: Preset) => void;
  onEdit: (p: Preset) => void;
  onDeletePreset: (p: Preset) => void;
  onRemoveFromBoard: (presetId: string) => void;
  onAddPreset: () => void;
  /** ボードの所属を順序つきで確定（並べ替え/追加/削除）。無料上限超過なら false。 */
  onSetBoard: (presetIds: string[]) => boolean;
  onDragActiveChange: (active: boolean) => void;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function PresetBoard(props: Props) {
  const theme = useTheme();
  const { c } = theme;
  const { editMode } = props;
  const s = t();

  const [width, setWidth] = React.useState(0);
  const cols = width > 0 ? Math.max(3, Math.floor((width - 2 * PAD + GAP) / CELL_W)) : 4;

  const masterIds = React.useMemo(() => props.allPresets.map((p) => p.id), [props.allPresets]);
  const byId = React.useMemo(() => {
    const m = new Map<string, Preset>();
    for (const p of props.allPresets) m.set(p.id, p);
    return m;
  }, [props.allPresets]);

  const anyNamed = props.allPresets.some((p) => p.name.trim().length > 0);
  const nameBand = anyNamed ? 18 : 0;
  const cellH = BASE_CELL_H + nameBand;

  const [boardIds, setBoardIds] = React.useState<string[]>(props.boardPresetIds);
  const [draggingKey, setDraggingKey] = React.useState<string | null>(null);
  const draggingRef = React.useRef<{ zone: Zone; id: string } | null>(null);
  const startBoardRef = React.useRef<string[]>([]);
  const workBoardRef = React.useRef<string[]>([]);
  // boardIds の最新値をジェスチャ内から参照するための ref。
  const boardIdsRef = React.useRef(boardIds);
  boardIdsRef.current = boardIds;

  React.useEffect(() => {
    if (draggingRef.current) return;
    setBoardIds(props.boardPresetIds);
  }, [props.boardPresetIds, props.currentBoardId]);

  const boardRows = Math.max(1, Math.ceil(boardIds.length / cols));
  const boardLabelTop = 0;
  const boardAreaTop = LABEL_BLOCK;
  const masterLabelTop = boardAreaTop + boardRows * cellH + 8;
  const masterAreaTop = masterLabelTop + LABEL_BLOCK;
  const masterSlots = masterIds.length + 1;
  const masterRows = Math.max(1, Math.ceil(masterSlots / cols));
  const totalHeight = masterAreaTop + masterRows * cellH + 8;

  const dataRef = React.useRef({ cols, cellH, nameBand, boardAreaTop, masterLabelTop });
  dataRef.current = { cols, cellH, nameBand, boardAreaTop, masterLabelTop };
  const cbRef = React.useRef(props);
  cbRef.current = props;

  const startLeft = useSharedValue(0);
  const startTop = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const slotTop = (zone: Zone, index: number): number => {
    const d = dataRef.current;
    const row = Math.floor(index / d.cols);
    return (zone === 'board' ? d.boardAreaTop : masterAreaTop) + row * d.cellH + d.nameBand;
  };
  const slotLeft = (index: number): number => PAD + (index % dataRef.current.cols) * CELL_W;

  const handleBegin = React.useCallback((zone: Zone, id: string) => {
    const board = zone === 'board' ? boardIdsRef.current : masterIds;
    const index = board.indexOf(id);
    if (index < 0) return;
    startLeft.value = slotLeft(index);
    startTop.value = slotTop(zone, index);
    dragX.value = 0;
    dragY.value = 0;
    dragScale.value = withSpring(1.08, springs.snappy);
    startBoardRef.current = [...boardIdsRef.current];
    workBoardRef.current = [...boardIdsRef.current];
    draggingRef.current = { zone, id };
    setDraggingKey(`${zone}:${id}`);
    cbRef.current.onDragActiveChange(true);
    haptics.pickup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterIds]);

  const indexAt = (fx: number, fy: number, areaTop: number, len: number): number => {
    const d = dataRef.current;
    const col = clamp(Math.round((fx - PAD) / CELL_W), 0, d.cols - 1);
    const row = Math.max(0, Math.floor((fy - areaTop) / d.cellH));
    return clamp(row * d.cols + col, 0, len);
  };

  const handleMove = React.useCallback((tx: number, ty: number) => {
    const drag = draggingRef.current;
    if (!drag) return;
    dragX.value = tx;
    dragY.value = ty;
    const d = dataRef.current;
    const fx = startLeft.value + TILE_SIZE / 2 + tx;
    const fy = startTop.value + TILE_SIZE / 2 + ty;
    const target: Zone = fy < d.masterLabelTop ? 'board' : 'master';
    const start = startBoardRef.current;
    let next = start;

    if (drag.zone === 'board') {
      if (target === 'board') {
        const without = start.filter((x) => x !== drag.id);
        const j = indexAt(fx, fy, d.boardAreaTop, without.length);
        next = [...without.slice(0, j), drag.id, ...without.slice(j)];
      } else {
        next = start.filter((x) => x !== drag.id); // 取り除きプレビュー
      }
    } else {
      // master 由来：ボード上なら追加プレビュー（既存メンバーは何もしない）
      if (target === 'board' && !start.includes(drag.id)) {
        const j = indexAt(fx, fy, d.boardAreaTop, start.length);
        next = [...start.slice(0, j), drag.id, ...start.slice(j)];
      } else {
        next = start;
      }
    }
    const cur = workBoardRef.current;
    if (next.length !== cur.length || next.some((v, i) => v !== cur[i])) {
      workBoardRef.current = next;
      setBoardIds(next);
      haptics.swap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = React.useCallback(() => {
    const drag = draggingRef.current;
    if (!drag) return;
    draggingRef.current = null;
    dragScale.value = withSpring(1, springs.snappy);
    const work = workBoardRef.current;
    const start = startBoardRef.current;
    const changed = work.length !== start.length || work.some((v, i) => v !== start[i]);
    if (changed) {
      const ok = cbRef.current.onSetBoard(work);
      if (!ok) setBoardIds(cbRef.current.boardPresetIds);
    } else {
      setBoardIds(start);
    }
    setDraggingKey(null);
    cbRef.current.onDragActiveChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = React.useCallback((id: string) => {
    const p = cbRef.current.allPresets.find((x) => x.id === id);
    if (!p) return;
    if (cbRef.current.editMode) cbRef.current.onEdit(p);
    else cbRef.current.onLaunch(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startLeft.value,
    top: startTop.value,
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }, { scale: dragScale.value }],
    zIndex: 1000,
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const draggingPreset = draggingRef.current ? byId.get(draggingRef.current.id) : null;
  const masterAddIndex = masterIds.length;
  const addLeft = PAD + (masterAddIndex % cols) * CELL_W;
  const addTop = masterAreaTop + Math.floor(masterAddIndex / cols) * cellH + nameBand;

  const renderCell = (zone: Zone, id: string, index: number) => {
    const p = byId.get(id);
    if (!p) return null;
    const key = `${zone}:${id}`;
    return (
      <PresetCell
        key={key}
        cellKey={key}
        zone={zone}
        preset={p}
        left={slotLeft(index)}
        top={(zone === 'board' ? boardAreaTop : masterAreaTop) + Math.floor(index / cols) * cellH}
        nameBand={nameBand}
        theme={theme}
        editMode={editMode}
        isDragging={key === draggingKey}
        onBegin={handleBegin}
        onMove={handleMove}
        onEnd={handleEnd}
        onTap={handleTap}
        onDelete={() => cbRef.current.onDeletePreset(p)}
        onRemoveFromBoard={() => cbRef.current.onRemoveFromBoard(id)}
      />
    );
  };

  return (
    <View>
      <BoardTabs
        boards={props.boards}
        currentBoardId={props.currentBoardId}
        boardName={props.boardName}
        theme={theme}
        onSelect={props.onSelectBoard}
        onAdd={props.onAddBoard}
        onEditBoard={props.onEditBoard}
      />

      <View onLayout={onLayout} style={{ height: totalHeight }}>
        {/* ボード（ウィジェット欄）をカード化 */}
        <View
          style={{
            position: 'absolute',
            left: -10,
            right: -10,
            top: boardLabelTop - 2,
            height: LABEL_BLOCK + boardRows * cellH + 12,
            borderRadius: 22,
            backgroundColor: c.surface,
            borderWidth: 1,
            borderColor: c.hairline,
          }}
        />

        <AreaLabel theme={theme} top={boardLabelTop} text={s.main.areaWidget} right={props.boardCountLabel} />
        <AreaLabel theme={theme} top={masterLabelTop} text={s.board.allPresets} />
        {boardIds.length === 0 && <EmptyHint theme={theme} top={boardAreaTop + nameBand} text={s.board.emptyHint} />}

        {boardIds.map((id, i) => renderCell('board', id, i))}
        {masterIds.map((id, i) => renderCell('master', id, i))}

        <Pressable
          onPress={props.onAddPreset}
          accessibilityRole="button"
          accessibilityLabel={s.board.addPreset}
          style={{
            position: 'absolute',
            left: addLeft,
            top: addTop,
            width: TILE_SIZE,
            height: TILE_SIZE,
            borderRadius: 22,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: c.textTertiary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusIcon color={c.textSecondary} size={26} />
        </Pressable>

        {draggingPreset && (
          <Animated.View style={floatingStyle} pointerEvents="none">
            <PresetTileVisual icon={draggingPreset.icon} color={draggingPreset.color} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function BoardTabs({
  boards,
  currentBoardId,
  boardName,
  theme,
  onSelect,
  onAdd,
  onEditBoard,
}: {
  boards: Board[];
  currentBoardId: string | null;
  boardName: (board: Board, index: number) => string;
  theme: Theme;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEditBoard: (board: Board) => void;
}) {
  const { c, spacing, radius } = theme;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.lg }}
    >
      {boards.map((b, i) => {
        const active = b.id === currentBoardId;
        return (
          <Pressable
            key={b.id}
            onPress={() => onSelect(b.id)}
            onLongPress={() => onEditBoard(b)}
            delayLongPress={300}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: active ? c.accent : c.surface,
              borderWidth: 1,
              borderColor: active ? c.accent : c.hairline,
            }}
          >
            <Text style={{ color: active ? '#FFFFFF' : c.textSecondary, fontSize: 14, fontWeight: '700' }}>
              {boardName(b, i)}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={t().board.add}
        style={{
          width: 38,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.hairline,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlusIcon color={c.textSecondary} size={18} />
      </Pressable>
    </ScrollView>
  );
}

function AreaLabel({ theme, top, text, right }: { theme: Theme; top: number; text: string; right?: string }) {
  const { c } = theme;
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: LABEL_BLOCK,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>{text}</Text>
      {right != null && (
        <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {right}
        </Text>
      )}
    </View>
  );
}

function EmptyHint({ theme, top, text }: { theme: Theme; top: number; text: string }) {
  const { c } = theme;
  return (
    <View style={{ position: 'absolute', top: top + 6, left: PAD, right: PAD, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: c.hairline,
          borderStyle: 'dashed',
        }}
      />
      <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '600', flex: 1 }}>{text}</Text>
    </View>
  );
}

interface CellProps {
  cellKey: string;
  zone: Zone;
  preset: Preset;
  left: number;
  top: number;
  nameBand: number;
  theme: Theme;
  editMode: boolean;
  isDragging: boolean;
  onBegin: (zone: Zone, id: string) => void;
  onMove: (tx: number, ty: number) => void;
  onEnd: () => void;
  onTap: (id: string) => void;
  onDelete: () => void;
  onRemoveFromBoard: () => void;
}

function jigglePhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 5;
  return (h - 2) * 18;
}

function PresetCell({
  cellKey,
  zone,
  preset,
  left,
  top,
  nameBand,
  theme,
  editMode,
  isDragging,
  onBegin,
  onMove,
  onEnd,
  onTap,
  onDelete,
  onRemoveFromBoard,
}: CellProps) {
  const { c } = theme;
  const pressScale = useSharedValue(1);
  const jiggle = useSharedValue(0);
  const reduced = useReducedMotion();
  const id = preset.id;

  React.useEffect(() => {
    if (editMode && !isDragging && !reduced) {
      const phase = jigglePhase(cellKey);
      jiggle.value = withRepeat(
        withSequence(withTiming(1, { duration: 130 + phase }), withTiming(-1, { duration: 130 + phase })),
        -1,
        true,
      );
    } else {
      cancelAnimation(jiggle);
      jiggle.value = withTiming(0, { duration: 100 });
    }
    return () => cancelAnimation(jiggle);
  }, [editMode, isDragging, reduced, cellKey, jiggle]);

  const tap = React.useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(260)
        .onBegin(() => {
          pressScale.value = withTiming(0.93, { duration: 90 });
        })
        .onFinalize(() => {
          pressScale.value = withSpring(1, springs.pop);
        })
        .onEnd((_e, success) => {
          if (success) runOnJS(onTap)(id);
        }),
    [id, onTap],
  );

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(220)
        .onStart(() => runOnJS(onBegin)(zone, id))
        .onUpdate((e) => runOnJS(onMove)(e.translationX, e.translationY))
        .onFinalize(() => runOnJS(onEnd)()),
    [id, zone, onBegin, onMove, onEnd],
  );

  const gesture = React.useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { rotate: `${jiggle.value}deg` }],
  }));

  return (
    <Animated.View
      layout={listLayout}
      style={{ position: 'absolute', left, top, width: TILE_SIZE, alignItems: 'center', opacity: isDragging ? 0.2 : 1 }}
    >
      {nameBand > 0 && (
        <View style={{ height: nameBand, width: TILE_SIZE, justifyContent: 'center' }}>
          {preset.name.trim().length > 0 && (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ color: c.textPrimary, fontSize: 11.5, fontWeight: '700', textAlign: 'center' }}
            >
              {preset.name.trim()}
            </Text>
          )}
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={animStyle}
          accessibilityRole="button"
          accessibilityLabel={
            preset.name.trim().length > 0
              ? `${preset.name.trim()} ${formatDurationShort(preset.durationSec)}`
              : t().board.timerOf(formatDurationShort(preset.durationSec))
          }
          accessibilityHint={editMode ? t().board.editHint : t().board.launchHint}
        >
          <PresetTileVisual icon={preset.icon} color={preset.color} glow={!isDragging} />
        </Animated.View>
      </GestureDetector>

      {editMode && !isDragging && (
        <Pressable
          onPress={zone === 'master' ? onDelete : onRemoveFromBoard}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={zone === 'master' ? t().common.delete : t().board.remove}
          style={{
            position: 'absolute',
            top: nameBand - 6,
            left: -6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: zone === 'master' ? c.danger : c.textTertiary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 11, height: 2.4, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
        </Pressable>
      )}

      <Text
        allowFontScaling={false}
        style={{ marginTop: 7, color: c.textSecondary, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
      >
        {formatDurationShort(preset.durationSec)}
      </Text>
    </Animated.View>
  );
}
