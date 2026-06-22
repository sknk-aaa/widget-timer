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
    if (draggingRef.current) return;
    setHiddenIds(props.hidden.map((p) => p.id));
    setWidgetIds(props.widget.map((p) => p.id));
  }, [props.hidden, props.widget]);

  const hiddenSlots = hiddenIds.length + (editMode ? 1 : 0);
  const hiddenRows = Math.max(1, Math.ceil(hiddenSlots / cols));
  const widgetRows = Math.max(1, Math.ceil(widgetIds.length / cols));
  const hiddenAreaTop = LABEL_BLOCK;
  const widgetLabelTop = hiddenAreaTop + hiddenRows * CELL_H + 8;
  const widgetAreaTop = widgetLabelTop + LABEL_BLOCK;
  const totalHeight = widgetAreaTop + widgetRows * CELL_H + 8;

  const areaTopOf = (area: Area) => (area === 'hidden' ? hiddenAreaTop : widgetAreaTop);

  // ---- ハンドラを安定化するための ref（再レンダーでジェスチャを作り直さない）----
  const dataRef = React.useRef({ hiddenIds, widgetIds, cols, widgetLabelTop, hiddenAreaTop, widgetAreaTop });
  dataRef.current = { hiddenIds, widgetIds, cols, widgetLabelTop, hiddenAreaTop, widgetAreaTop };
  const cbRef = React.useRef(props);
  cbRef.current = props;
  const byIdRef = React.useRef(byId);
  byIdRef.current = byId;
  // ドラッグ中の作業配列（描画タイミングに依存せず即時更新）
  const workRef = React.useRef<{ hidden: string[]; widget: string[] }>({ hidden: [], widget: [] });

  const startLeft = useSharedValue(0);
  const startTop = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const handleBegin = React.useCallback((id: string) => {
    const d = dataRef.current;
    const hi = d.hiddenIds.indexOf(id);
    const area: Area = hi >= 0 ? 'hidden' : 'widget';
    const index = hi >= 0 ? hi : d.widgetIds.indexOf(id);
    const row = Math.floor(index / d.cols);
    const col = index % d.cols;
    startLeft.value = PAD + col * CELL_W;
    startTop.value = (area === 'hidden' ? d.hiddenAreaTop : d.widgetAreaTop) + row * CELL_H;
    dragX.value = 0;
    dragY.value = 0;
    dragScale.value = withSpring(1.08, springs.snappy);
    workRef.current = { hidden: [...d.hiddenIds], widget: [...d.widgetIds] };
    draggingRef.current = id;
    setDraggingId(id);
    cbRef.current.onDragActiveChange(true);
    haptics.pickup();
  }, []);

  const handleMove = React.useCallback((id: string, tx: number, ty: number) => {
    dragX.value = tx;
    dragY.value = ty;
    const d = dataRef.current;
    const w = workRef.current;
    const fx = startLeft.value + TILE_SIZE / 2 + tx;
    const fy = startTop.value + TILE_SIZE / 2 + ty;
    const targetArea: Area = fy < d.widgetLabelTop ? 'hidden' : 'widget';
    const fromHidden = w.hidden.includes(id);
    const srcArr = fromHidden ? w.hidden : w.widget;
    const fromIdx = srcArr.indexOf(id);
    if (fromIdx < 0) return;
    const sameArea = (targetArea === 'hidden') === fromHidden;
    const col = clamp(Math.round((fx - PAD) / CELL_W), 0, d.cols - 1);
    const areaTop = targetArea === 'hidden' ? d.hiddenAreaTop : d.widgetAreaTop;
    const row = Math.max(0, Math.floor((fy - areaTop) / CELL_H));
    let j = row * d.cols + col;

    if (sameArea) {
      j = clamp(j, 0, srcArr.length - 1);
      if (j === fromIdx) return;
      const arr = [...srcArr];
      arr.splice(fromIdx, 1);
      arr.splice(j, 0, id);
      if (fromHidden) w.hidden = arr;
      else w.widget = arr;
    } else {
      const dstArr = targetArea === 'hidden' ? w.hidden : w.widget;
      j = clamp(j, 0, dstArr.length);
      const src = [...srcArr];
      src.splice(fromIdx, 1);
      const dst = [...dstArr];
      dst.splice(j, 0, id);
      if (targetArea === 'hidden') {
        w.hidden = dst;
        w.widget = src;
      } else {
        w.widget = dst;
        w.hidden = src;
      }
    }
    setHiddenIds(w.hidden);
    setWidgetIds(w.widget);
    haptics.swap();
  }, []);

  const handleEnd = React.useCallback((id: string) => {
    if (draggingRef.current !== id) return; // ドラッグ未開始（タップ等）は無視
    draggingRef.current = null;
    dragScale.value = withSpring(1, springs.snappy);
    const w = workRef.current;
    const ok = cbRef.current.onArrange(w.hidden, w.widget);
    if (!ok) {
      setHiddenIds(cbRef.current.hidden.map((p) => p.id));
      setWidgetIds(cbRef.current.widget.map((p) => p.id));
    }
    setDraggingId(null);
    cbRef.current.onDragActiveChange(false);
  }, []);

  const handleTap = React.useCallback((id: string) => {
    const p = byIdRef.current.get(id);
    if (!p) return;
    if (cbRef.current.editMode) cbRef.current.onEdit(p);
    else cbRef.current.onLaunch(p);
  }, []);

  const handleDelete = React.useCallback((id: string) => {
    const p = byIdRef.current.get(id);
    if (p) cbRef.current.onDelete(p);
  }, []);

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

  const posOf = (id: string) => {
    const hi = hiddenIds.indexOf(id);
    const area: Area = hi >= 0 ? 'hidden' : 'widget';
    const index = hi >= 0 ? hi : widgetIds.indexOf(id);
    const row = Math.floor(index / cols);
    const col = index % cols;
    return { left: PAD + col * CELL_W, top: areaTopOf(area) + row * CELL_H, index };
  };

  const draggingPreset = draggingId ? byId.get(draggingId) : null;
  const addPos = { left: PAD + (hiddenIds.length % cols) * CELL_W, top: hiddenAreaTop + Math.floor(hiddenIds.length / cols) * CELL_H };

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

      {[...hiddenIds, ...widgetIds].map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        const pos = posOf(id);
        return (
          <PresetCell
            key={id}
            id={id}
            preset={p}
            index={pos.index}
            left={pos.left}
            top={pos.top}
            theme={theme}
            editMode={editMode}
            isDragging={id === draggingId}
            onBegin={handleBegin}
            onMove={handleMove}
            onEnd={handleEnd}
            onTap={handleTap}
            onDelete={handleDelete}
          />
        );
      })}

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
  id: string;
  preset: Preset;
  index: number;
  left: number;
  top: number;
  theme: Theme;
  editMode: boolean;
  isDragging: boolean;
  onBegin: (id: string) => void;
  onMove: (id: string, tx: number, ty: number) => void;
  onEnd: (id: string) => void;
  onTap: (id: string) => void;
  onDelete: (id: string) => void;
}

function jigglePhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 5;
  return (h - 2) * 18;
}

function PresetCell({
  id,
  preset,
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
      const phase = jigglePhase(id);
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
  }, [editMode, isDragging, reduced, id, jiggle]);

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
        .onStart(() => runOnJS(onBegin)(id))
        .onUpdate((e) => runOnJS(onMove)(id, e.translationX, e.translationY))
        .onFinalize(() => runOnJS(onEnd)(id)),
    [id, onBegin, onMove, onEnd],
  );

  const gesture = React.useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

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
          accessibilityHint={editMode ? 'タップで編集。長押しで移動' : 'タップで起動。長押しで並び替え'}
        >
          <PresetTileVisual icon={preset.icon} color={preset.color} glow={!isDragging} />
        </Animated.View>
      </GestureDetector>

      {editMode && !isDragging && (
        <Pressable
          onPress={() => onDelete(id)}
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
