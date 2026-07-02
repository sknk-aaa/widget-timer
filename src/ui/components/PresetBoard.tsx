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

type Colors = Theme['c'];

const PAD = 2;
const GAP = 16;
const CELL_W = TILE_SIZE + GAP;
const BASE_CELL_H = TILE_SIZE + 24 + GAP;
const LABEL_BLOCK = 40;

type Zone = 'board' | 'master';
type DropTarget = Zone | 'between';

interface BoardLayout {
  cols: number;
  cellH: number;
  nameBand: number;
  boardAreaTop: number;
  masterAreaTop: number;
  masterLabelTop: number;
}

interface DragResult {
  target: DropTarget;
  nextMaster: string[];
  nextBoard: string[];
}

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
  onDeleteBoard: (board: Board) => void;
  onLaunch: (p: Preset) => void;
  onEdit: (p: Preset) => void;
  onDeletePreset: (p: Preset) => void;
  onRemoveFromBoard: (presetId: string) => void;
  onAddPreset: () => void;
  /** ボードの所属を順序つきで確定（並べ替え/追加/削除）。無料上限超過なら false。 */
  onSetBoard: (presetIds: string[]) => boolean;
  /** 「全てのプリセット」の並び順を確定。 */
  onReorderAll: (presetIds: string[]) => void;
  onDragActiveChange: (active: boolean) => void;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function sameArr(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function moveTo(arr: string[], id: string, j: number): string[] {
  const without = arr.filter((x) => x !== id);
  const k = clamp(j, 0, without.length);
  return [...without.slice(0, k), id, ...without.slice(k)];
}

export function PresetBoard(props: Props) {
  const theme = useTheme();
  const { c } = theme;
  const { editMode } = props;
  const s = t();

  const [width, setWidth] = React.useState(0);
  const cols = width > 0 ? Math.max(3, Math.floor((width - 2 * PAD + GAP) / CELL_W)) : 4;

  const byId = React.useMemo(() => {
    const m = new Map<string, Preset>();
    for (const p of props.allPresets) m.set(p.id, p);
    return m;
  }, [props.allPresets]);
  const byIdRef = React.useRef(byId);
  byIdRef.current = byId;

  const anyNamed = props.allPresets.some((p) => p.name.trim().length > 0);
  const nameBand = anyNamed ? 18 : 0;
  const cellH = BASE_CELL_H + nameBand;

  const [masterIds, setMasterIds] = React.useState<string[]>(() => props.allPresets.map((p) => p.id));
  const [boardIds, setBoardIds] = React.useState<string[]>(props.boardPresetIds);
  const [draggingKey, setDraggingKey] = React.useState<string | null>(null);

  const draggingRef = React.useRef<{ zone: Zone; id: string } | null>(null);
  const hasMovedRef = React.useRef(false);
  const startMasterRef = React.useRef<string[]>([]);
  const startBoardRef = React.useRef<string[]>([]);
  const workMasterRef = React.useRef<string[]>([]);
  const workBoardRef = React.useRef<string[]>([]);
  const dragLayoutRef = React.useRef<BoardLayout | null>(null);
  const masterIdsRef = React.useRef(masterIds);
  masterIdsRef.current = masterIds;
  const boardIdsRef = React.useRef(boardIds);
  boardIdsRef.current = boardIds;

  React.useEffect(() => {
    if (draggingRef.current) return;
    setMasterIds(props.allPresets.map((p) => p.id));
  }, [props.allPresets]);
  React.useEffect(() => {
    if (draggingRef.current) return;
    setBoardIds(props.boardPresetIds);
  }, [props.boardPresetIds, props.currentBoardId]);

  const boardRows = Math.max(1, Math.ceil(boardIds.length / cols));
  const boardLabelTop = 0;
  const boardAreaTop = LABEL_BLOCK;
  const masterLabelTop = boardAreaTop + boardRows * cellH + 8;
  const masterAreaTop = masterLabelTop + LABEL_BLOCK;
  const masterRows = Math.max(1, Math.ceil((masterIds.length + 1) / cols));
  const totalHeight = masterAreaTop + masterRows * cellH + 8;

  const layoutRef = React.useRef<BoardLayout>({ cols, cellH, nameBand, boardAreaTop, masterAreaTop, masterLabelTop });
  layoutRef.current = { cols, cellH, nameBand, boardAreaTop, masterAreaTop, masterLabelTop };
  const cbRef = React.useRef(props);
  cbRef.current = props;

  const startLeft = useSharedValue(0);
  const startTop = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const slotLeft = (index: number, cols_: number) => PAD + (index % cols_) * CELL_W;
  const slotTop = (zone: Zone, index: number, d: BoardLayout = layoutRef.current) => {
    const top = (zone === 'board' ? d.boardAreaTop : d.masterAreaTop) + Math.floor(index / d.cols) * d.cellH;
    return top + d.nameBand;
  };

  const targetAt = (fy: number, d: BoardLayout): DropTarget => {
    if (fy < d.masterLabelTop) return 'board';
    if (fy >= d.masterAreaTop) return 'master';
    return 'between';
  };

  const indexAt = (zone: Zone, fx: number, fy: number, len: number): number => {
    const d = dragLayoutRef.current ?? layoutRef.current;
    const areaTop = zone === 'board' ? d.boardAreaTop : d.masterAreaTop;
    // fx,fy はドラッグ中タイルの中心。タイルの基準位置(左上)に戻してスロットを求める＝
    // 半セル分動かして初めて隣と入れ替わる（触れた瞬間の誤入れ替えを防ぐ）。
    const col = clamp(Math.round((fx - TILE_SIZE / 2 - PAD) / CELL_W), 0, d.cols - 1);
    const row = Math.max(0, Math.round((fy - TILE_SIZE / 2 - d.nameBand - areaTop) / d.cellH));
    return clamp(row * d.cols + col, 0, len);
  };

  const onBegin = React.useCallback((zone: Zone, id: string) => {
    if (draggingRef.current) return; // 2本目の同時ドラッグは無視（状態混線防止）
    const list = zone === 'board' ? boardIdsRef.current : masterIdsRef.current;
    const index = list.indexOf(id);
    if (index < 0) return;
    const dragLayout = { ...layoutRef.current };
    dragLayoutRef.current = dragLayout;
    startLeft.value = slotLeft(index, dragLayout.cols);
    startTop.value = slotTop(zone, index, dragLayout);
    dragX.value = 0;
    dragY.value = 0;
    dragScale.value = withSpring(1.08, springs.snappy);
    startMasterRef.current = [...masterIdsRef.current];
    startBoardRef.current = [...boardIdsRef.current];
    workMasterRef.current = startMasterRef.current;
    workBoardRef.current = startBoardRef.current;
    hasMovedRef.current = false;
    draggingRef.current = { zone, id };
    setDraggingKey(`${zone}:${id}`);
    cbRef.current.onDragActiveChange(true);
    haptics.pickup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeDragResult = React.useCallback((tx: number, ty: number): DragResult | null => {
    const drag = draggingRef.current;
    if (!drag) return null;
    const d = dragLayoutRef.current ?? layoutRef.current;
    const fx = startLeft.value + TILE_SIZE / 2 + tx;
    const fy = startTop.value + TILE_SIZE / 2 + ty;
    const target = targetAt(fy, d);
    const startMaster = startMasterRef.current;
    const startBoard = startBoardRef.current;
    let nextMaster = startMaster;
    let nextBoard = startBoard;

    if (drag.zone === 'board') {
      if (target === 'board') {
        nextBoard = moveTo(startBoard, drag.id, indexAt('board', fx, fy, startBoard.length - 1));
      }
      // 欄から外す確定は onEnd で行う。ドラッグ中はセルを消さない
      // （アクティブな Pan を持つセルが unmount すると onEnd が発火せず固まるため）。
    } else if (target === 'master') {
      nextMaster = moveTo(startMaster, drag.id, indexAt('master', fx, fy, startMaster.length - 1));
    } else if (target === 'board' && !startBoard.includes(drag.id)) {
      const j = indexAt('board', fx, fy, startBoard.length);
      nextBoard = [...startBoard.slice(0, j), drag.id, ...startBoard.slice(j)]; // 欄へ追加プレビュー
    }

    return { target, nextMaster, nextBoard };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMove = React.useCallback((tx: number, ty: number) => {
    const drag = draggingRef.current;
    if (!drag) return;
    dragX.value = tx;
    dragY.value = ty;
    // デッドゾーン: 持ち上げ直後の微小な揺れでは並べ替え/欄移動をしない。
    if (!hasMovedRef.current) {
      if (Math.abs(tx) < 12 && Math.abs(ty) < 12) return;
      hasMovedRef.current = true;
    }
    const result = computeDragResult(tx, ty);
    if (!result) return;

    let changed = false;
    if (!sameArr(result.nextBoard, workBoardRef.current)) {
      workBoardRef.current = result.nextBoard;
      setBoardIds(result.nextBoard);
      changed = true;
    }
    if (!sameArr(result.nextMaster, workMasterRef.current)) {
      workMasterRef.current = result.nextMaster;
      setMasterIds(result.nextMaster);
      changed = true;
    }
    if (changed) haptics.swap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeDragResult]);

  const onEnd = React.useCallback((tx: number, ty: number, success: boolean) => {
    const drag = draggingRef.current;
    if (!drag) return;
    dragScale.value = withSpring(1, springs.snappy);
    const startBoard = startBoardRef.current;
    const startMaster = startMasterRef.current;
    const result = success ? computeDragResult(tx, ty) : null;
    const target = result?.target ?? 'between';
    const nextBoard = result?.nextBoard ?? startBoard;
    const nextMaster = result?.nextMaster ?? startMaster;
    let handled = false;

    if (drag.zone === 'board') {
      if (target === 'master') {
        // 欄から外す（確定はここで）
        const next = startBoard.filter((x) => x !== drag.id);
        const ok = cbRef.current.onSetBoard(next);
        setBoardIds(ok ? next : cbRef.current.boardPresetIds);
        handled = true;
      } else if (target === 'board') {
        if (!sameArr(nextBoard, startBoard)) {
          const ok = cbRef.current.onSetBoard(nextBoard);
          if (!ok) setBoardIds(cbRef.current.boardPresetIds);
          handled = true;
        }
      }
    } else {
      if (target === 'board' && !startBoard.includes(drag.id) && nextBoard.includes(drag.id)) {
        // 全てのプリセット → 欄へ追加
        const ok = cbRef.current.onSetBoard(nextBoard);
        if (!ok) setBoardIds(cbRef.current.boardPresetIds);
        handled = true;
      } else if (target === 'master' && !sameArr(nextMaster, startMaster)) {
        cbRef.current.onReorderAll(nextMaster);
        handled = true;
      }
    }

    if (!handled) {
      setBoardIds(startBoard);
      setMasterIds(startMaster);
    }
    draggingRef.current = null;
    dragLayoutRef.current = null;
    setDraggingKey(null);
    cbRef.current.onDragActiveChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeDragResult]);

  const onTap = React.useCallback((id: string) => {
    const p = byIdRef.current.get(id);
    if (!p) return;
    if (cbRef.current.editMode) cbRef.current.onEdit(p);
    else cbRef.current.onLaunch(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDeleteId = React.useCallback((id: string) => {
    const p = byIdRef.current.get(id);
    if (p) cbRef.current.onDeletePreset(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRemoveId = React.useCallback((id: string) => {
    cbRef.current.onRemoveFromBoard(id);
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

  const draggingId = draggingKey ? draggingKey.slice(draggingKey.indexOf(':') + 1) : null;
  const draggingPreset = draggingId ? byId.get(draggingId) : null;
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
        zone={zone}
        preset={p}
        left={slotLeft(index, cols)}
        top={(zone === 'board' ? boardAreaTop : masterAreaTop) + Math.floor(index / cols) * cellH}
        nameBand={nameBand}
        c={c}
        editMode={editMode}
        isDragging={key === draggingKey}
        onBegin={onBegin}
        onMove={onMove}
        onEnd={onEnd}
        onTap={onTap}
        onDelete={onDeleteId}
        onRemoveFromBoard={onRemoveId}
      />
    );
  };

  return (
    <View>
      <BoardTabs
        boards={props.boards}
        currentBoardId={props.currentBoardId}
        boardName={props.boardName}
        editMode={editMode}
        theme={theme}
        onSelect={props.onSelectBoard}
        onAdd={props.onAddBoard}
        onEditBoard={props.onEditBoard}
        onDeleteBoard={props.onDeleteBoard}
      />

      <View onLayout={onLayout} style={{ height: totalHeight }}>
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
  editMode,
  theme,
  onSelect,
  onAdd,
  onEditBoard,
  onDeleteBoard,
}: {
  boards: Board[];
  currentBoardId: string | null;
  boardName: (board: Board, index: number) => string;
  editMode: boolean;
  theme: Theme;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (board: Board) => void;
}) {
  const { c, spacing, radius } = theme;
  const canDelete = editMode && boards.length > 1;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.lg, paddingTop: canDelete ? 12 : spacing.sm }}
    >
      {boards.map((b, i) => {
        const active = b.id === currentBoardId;
        return (
          <View key={b.id}>
            <Pressable
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
            {canDelete && (
              <Pressable
                onPress={() => onDeleteBoard(b)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t().board.remove}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: c.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 10, height: 2.2, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
              </Pressable>
            )}
          </View>
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
  zone: Zone;
  preset: Preset;
  left: number;
  top: number;
  nameBand: number;
  c: Colors;
  editMode: boolean;
  isDragging: boolean;
  onBegin: (zone: Zone, id: string) => void;
  onMove: (tx: number, ty: number) => void;
  onEnd: (tx: number, ty: number, success: boolean) => void;
  onTap: (id: string) => void;
  onDelete: (id: string) => void;
  onRemoveFromBoard: (id: string) => void;
}

function jigglePhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 5;
  return (h - 2) * 18;
}

const PresetCell = React.memo(function PresetCell({
  zone,
  preset,
  left,
  top,
  nameBand,
  c,
  editMode,
  isDragging,
  onBegin,
  onMove,
  onEnd,
  onTap,
  onDelete,
  onRemoveFromBoard,
}: CellProps) {
  const pressScale = useSharedValue(1);
  const jiggle = useSharedValue(0);
  const reduced = useReducedMotion();
  const id = preset.id;
  const cellKey = `${zone}:${id}`;

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
        .onFinalize((e, success) => runOnJS(onEnd)(e.translationX, e.translationY, success)),
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
          onPress={() => (zone === 'master' ? onDelete(id) : onRemoveFromBoard(id))}
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
});
