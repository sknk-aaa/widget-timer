import * as React from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
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
import type { Preset } from '../../domain/types';
import { useTheme, type Theme } from '../theme';

const PAD = 2;
const GAP = 16;
const CELL_W = TILE_SIZE + GAP;
const CELL_H = TILE_SIZE + 24 + GAP;
const LABEL_BLOCK = 40;

type Area = 'hidden' | 'widget';

interface Props {
  hidden: Preset[];
  widget: Preset[];
  editMode: boolean;
  hiddenLabel: string;
  widgetLabel: string;
  widgetCountLabel: string;
  onLaunch: (p: Preset) => void;
  onEdit: (p: Preset) => void;
  onDelete: (p: Preset) => void;
  onAdd: () => void;
  onArrange: (hiddenIds: string[], widgetIds: string[]) => boolean;
  onDragActiveChange: (active: boolean) => void;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function PresetBoard(props: Props) {
  const theme = useTheme();
  const { c } = theme;
  const { editMode } = props;
  const [width, setWidth] = React.useState(0);
  const cols = width > 0 ? Math.max(3, Math.floor((width - 2 * PAD + GAP) / CELL_W)) : 4;

  const [hiddenIds, setHiddenIds] = React.useState<string[]>(props.hidden.map((p) => p.id));
  const [widgetIds, setWidgetIds] = React.useState<string[]>(props.widget.map((p) => p.id));
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const draggingRef = React.useRef<string | null>(null);

  const byId = React.useMemo(() => {
    const m = new Map<string, Preset>();
    for (const p of props.hidden) m.set(p.id, p);
    for (const p of props.widget) m.set(p.id, p);
    return m;
  }, [props.hidden, props.widget]);

  React.useEffect(() => {
    if (draggingId) return;
    setHiddenIds(props.hidden.map((p) => p.id));
    setWidgetIds(props.widget.map((p) => p.id));
  }, [props.hidden, props.widget, draggingId]);

  // 編集モードでは追加タイル分を hidden 末尾に確保
  const hiddenSlots = hiddenIds.length + (editMode ? 1 : 0);
  const hiddenRows = Math.max(1, Math.ceil(hiddenSlots / cols));
  const widgetRows = Math.max(1, Math.ceil(widgetIds.length / cols));
  const hiddenAreaTop = LABEL_BLOCK;
  const widgetLabelTop = hiddenAreaTop + hiddenRows * CELL_H + 8;
  const widgetAreaTop = widgetLabelTop + LABEL_BLOCK;
  const totalHeight = widgetAreaTop + widgetRows * CELL_H + 8;

  const areaTopOf = (area: Area) => (area === 'hidden' ? hiddenAreaTop : widgetAreaTop);

  const cellPos = React.useCallback(
    (area: Area, index: number) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return { left: PAD + col * CELL_W, top: areaTopOf(area) + row * CELL_H };
    },
    [cols, hiddenAreaTop, widgetAreaTop],
  );

  const locate = React.useCallback(
    (id: string): { area: Area; index: number } => {
      const hi = hiddenIds.indexOf(id);
      if (hi >= 0) return { area: 'hidden', index: hi };
      return { area: 'widget', index: widgetIds.indexOf(id) };
    },
    [hiddenIds, widgetIds],
  );

  const startLeft = useSharedValue(0);
  const startTop = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const beginDrag = React.useCallback(
    (id: string) => {
      const loc = locate(id);
      const pos = cellPos(loc.area, loc.index);
      startLeft.value = pos.left;
      startTop.value = pos.top;
      dragX.value = 0;
      dragY.value = 0;
      dragScale.value = withSpring(1.08, springs.snappy);
      draggingRef.current = id;
      setDraggingId(id);
      props.onDragActiveChange(true);
      haptics.pickup();
    },
    [locate, cellPos, props],
  );

  const moveDuringDrag = React.useCallback(
    (id: string, tx: number, ty: number) => {
      const fx = startLeft.value + TILE_SIZE / 2 + tx;
      const fy = startTop.value + TILE_SIZE / 2 + ty;
      const targetArea: Area = fy < widgetLabelTop ? 'hidden' : 'widget';

      const fromHidden = hiddenIds.includes(id);
      const srcArr = fromHidden ? hiddenIds : widgetIds;
      const fromIdx = srcArr.indexOf(id);
      const sameArea = (targetArea === 'hidden') === fromHidden;

      const col = clamp(Math.round((fx - PAD) / CELL_W), 0, cols - 1);
      const row = Math.max(0, Math.floor((fy - areaTopOf(targetArea)) / CELL_H));
      let j = row * cols + col;

      if (sameArea) {
        // 表示中の並び（id を含む）と同じ index 空間で比較。掴んだ位置なら動かさない。
        j = clamp(j, 0, srcArr.length - 1);
        if (j === fromIdx) return;
        const arr = [...srcArr];
        arr.splice(fromIdx, 1);
        arr.splice(j, 0, id);
        if (fromHidden) setHiddenIds(arr);
        else setWidgetIds(arr);
      } else {
        const dstArr = targetArea === 'hidden' ? hiddenIds : widgetIds;
        j = clamp(j, 0, dstArr.length);
        const src = [...srcArr];
        src.splice(fromIdx, 1);
        const dst = [...dstArr];
        dst.splice(j, 0, id);
        if (targetArea === 'hidden') {
          setHiddenIds(dst);
          setWidgetIds(src);
        } else {
          setWidgetIds(dst);
          setHiddenIds(src);
        }
      }
      haptics.swap();
    },
    [hiddenIds, widgetIds, cols, widgetLabelTop, areaTopOf],
  );

  const endDrag = React.useCallback(() => {
    if (!draggingRef.current) return; // ドラッグ未開始（タップ等）では何もしない
    draggingRef.current = null;
    dragScale.value = withSpring(1, springs.snappy);
    const ok = props.onArrange(hiddenIds, widgetIds);
    if (!ok) {
      setHiddenIds(props.hidden.map((p) => p.id));
      setWidgetIds(props.widget.map((p) => p.id));
    }
    setDraggingId(null);
    props.onDragActiveChange(false);
  }, [props, hiddenIds, widgetIds]);

  const floatingStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startLeft.value,
    top: startTop.value,
    transform: [
      { translateX: dragX.value },
      { translateY: dragY.value },
      { scale: dragScale.value },
    ],
    zIndex: 1000,
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const renderTile = (id: string) => {
    const p = byId.get(id);
    if (!p) return null;
    const loc = locate(id);
    const pos = cellPos(loc.area, loc.index);
    const isDragging = id === draggingId;
    return (
      <PresetCell
        key={id}
        preset={p}
        index={loc.index}
        left={pos.left}
        top={pos.top}
        theme={theme}
        editMode={editMode}
        isDragging={isDragging}
        onBegin={() => beginDrag(id)}
        onMove={(tx, ty) => {
          dragX.value = tx;
          dragY.value = ty;
          moveDuringDrag(id, tx, ty);
        }}
        onEnd={endDrag}
        onTap={() => (editMode ? props.onEdit(p) : props.onLaunch(p))}
        onDelete={() => props.onDelete(p)}
      />
    );
  };

  const draggingPreset = draggingId ? byId.get(draggingId) : null;
  const addPos = cellPos('hidden', hiddenIds.length);

  return (
    <View onLayout={onLayout} style={{ height: totalHeight }}>
      <AreaLabel theme={theme} top={0} text={props.hiddenLabel} />
      <AreaLabel
        theme={theme}
        top={widgetLabelTop}
        text={props.widgetLabel}
        right={props.widgetCountLabel}
      />
      {widgetIds.length === 0 && <EmptyHint theme={theme} top={widgetAreaTop} />}

      {[...hiddenIds, ...widgetIds].map(renderTile)}

      {editMode && (
        <Pressable
          onPress={props.onAdd}
          accessibilityRole="button"
          accessibilityLabel="プリセットを追加"
          style={{
            position: 'absolute',
            left: addPos.left,
            top: addPos.top,
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
      )}

      {draggingPreset && (
        <Animated.View style={floatingStyle} pointerEvents="none">
          <PresetTileVisual icon={draggingPreset.icon} color={draggingPreset.color} />
        </Animated.View>
      )}
    </View>
  );
}

function AreaLabel({
  theme,
  top,
  text,
  right,
}: {
  theme: Theme;
  top: number;
  text: string;
  right?: string;
}) {
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
      <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>
        {text}
      </Text>
      {right != null && (
        <Text style={{ color: c.textTertiary, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {right}
        </Text>
      )}
    </View>
  );
}

function EmptyHint({ theme, top }: { theme: Theme; top: number }) {
  const { c } = theme;
  return (
    <View
      style={{
        position: 'absolute',
        top: top + 6,
        left: PAD,
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: c.hairline,
        borderStyle: 'dashed',
      }}
    />
  );
}

interface CellProps {
  preset: Preset;
  index: number;
  left: number;
  top: number;
  theme: Theme;
  editMode: boolean;
  isDragging: boolean;
  onBegin: () => void;
  onMove: (tx: number, ty: number) => void;
  onEnd: () => void;
  onTap: () => void;
  onDelete: () => void;
}

function PresetCell({
  preset,
  index,
  left,
  top,
  theme,
  editMode,
  isDragging,
  onBegin,
  onMove,
  onEnd,
  onTap,
  onDelete,
}: CellProps) {
  const { c } = theme;
  const pressScale = useSharedValue(1);
  const jiggle = useSharedValue(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (editMode && !isDragging && !reduced) {
      const phase = ((index % 5) - 2) * 18;
      jiggle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 130 + phase }),
          withTiming(-1, { duration: 130 + phase }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(jiggle);
      jiggle.value = withTiming(0, { duration: 100 });
    }
    return () => cancelAnimation(jiggle);
  }, [editMode, isDragging, reduced, index, jiggle]);

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
          if (success) runOnJS(onTap)();
        }),
    [onTap],
  );

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(220)
        .onStart(() => runOnJS(onBegin)())
        .onUpdate((e) => runOnJS(onMove)(e.translationX, e.translationY))
        .onFinalize(() => runOnJS(onEnd)()),
    [onBegin, onMove, onEnd],
  );

  // 通常モードでも長押しで並び替え可能（タップは起動、長押しはドラッグ）
  const gesture = Gesture.Exclusive(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { rotate: `${jiggle.value}deg` }],
  }));

  return (
    <Animated.View
      layout={listLayout}
      style={{
        position: 'absolute',
        left,
        top,
        width: TILE_SIZE,
        alignItems: 'center',
        opacity: isDragging ? 0.2 : 1,
      }}
    >
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={animStyle}
          accessibilityRole="button"
          accessibilityLabel={`${formatDurationShort(preset.durationSec)}のタイマー`}
          accessibilityHint={editMode ? 'タップで編集。長押しで移動' : 'タップで起動'}
        >
          <PresetTileVisual icon={preset.icon} color={preset.color} glow={!isDragging} />
        </Animated.View>
      </GestureDetector>

      {editMode && !isDragging && (
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="削除"
          style={{
            position: 'absolute',
            top: -6,
            left: -6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: c.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 11, height: 2.4, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
        </Pressable>
      )}

      <Text
        allowFontScaling={false}
        style={{
          marginTop: 7,
          color: c.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          fontVariant: ['tabular-nums'],
        }}
        numberOfLines={1}
      >
        {formatDurationShort(preset.durationSec)}
      </Text>
    </Animated.View>
  );
}
