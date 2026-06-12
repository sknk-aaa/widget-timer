import * as React from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
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

interface Props {
  hidden: Preset[];
  widget: Preset[];
  editMode: boolean;
  hiddenLabel: string;
  widgetLabel: string;
  widgetCountLabel: string;
  onLaunch: (p: Preset) => void;
  onEdit: (p: Preset) => void;
  onEnterEdit: () => void;
  /** 並び替え結果を適用。枠超過などで拒否されたら false。 */
  onArrange: (hiddenIds: string[], widgetIds: string[]) => boolean;
}

type Area = 'hidden' | 'widget';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function PresetBoard(props: Props) {
  const theme = useTheme();
  const { c } = theme;
  const [width, setWidth] = React.useState(0);
  const cols = width > 0 ? Math.max(3, Math.floor((width - 2 * PAD + GAP) / CELL_W)) : 4;

  const [hiddenIds, setHiddenIds] = React.useState<string[]>(props.hidden.map((p) => p.id));
  const [widgetIds, setWidgetIds] = React.useState<string[]>(props.widget.map((p) => p.id));
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const byId = React.useMemo(() => {
    const m = new Map<string, Preset>();
    for (const p of props.hidden) m.set(p.id, p);
    for (const p of props.widget) m.set(p.id, p);
    return m;
  }, [props.hidden, props.widget]);

  // 親の状態と同期（ドラッグ中は触らない）
  React.useEffect(() => {
    if (draggingId) return;
    setHiddenIds(props.hidden.map((p) => p.id));
    setWidgetIds(props.widget.map((p) => p.id));
  }, [props.hidden, props.widget, draggingId]);

  const hiddenRows = Math.max(1, Math.ceil(hiddenIds.length / cols));
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

  // floating tile shared values
  const startLeft = useSharedValue(0);
  const startTop = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  const beginDrag = React.useCallback(
    (id: string) => {
      if (!props.editMode) props.onEnterEdit();
      const loc = locate(id);
      const pos = cellPos(loc.area, loc.index);
      startLeft.value = pos.left;
      startTop.value = pos.top;
      dragX.value = 0;
      dragY.value = 0;
      dragScale.value = withSpring(1.06, springs.snappy);
      setDraggingId(id);
      haptics.pickup();
    },
    [props, locate, cellPos],
  );

  const moveDuringDrag = React.useCallback(
    (id: string, tx: number, ty: number) => {
      const start = { left: startLeft.value, top: startTop.value };
      const fx = start.left + TILE_SIZE / 2 + tx;
      const fy = start.top + TILE_SIZE / 2 + ty;
      const targetArea: Area = fy < widgetLabelTop ? 'hidden' : 'widget';

      const curHidden = hiddenIds.filter((x) => x !== id);
      const curWidget = widgetIds.filter((x) => x !== id);
      const targetList = targetArea === 'hidden' ? curHidden : curWidget;

      const col = clamp(Math.round((fx - PAD) / CELL_W), 0, cols - 1);
      const row = Math.max(0, Math.floor((fy - areaTopOf(targetArea)) / CELL_H));
      const idx = clamp(row * cols + col, 0, targetList.length);

      const cur = locate(id);
      if (cur.area === targetArea && cur.index === idx) return;

      haptics.swap();
      if (targetArea === 'hidden') {
        const next = [...curHidden];
        next.splice(idx, 0, id);
        setHiddenIds(next);
        setWidgetIds(curWidget);
      } else {
        const next = [...curWidget];
        next.splice(idx, 0, id);
        setWidgetIds(next);
        setHiddenIds(curHidden);
      }
    },
    [hiddenIds, widgetIds, cols, widgetLabelTop, locate, areaTopOf],
  );

  const endDrag = React.useCallback(() => {
    dragScale.value = withSpring(1, springs.snappy);
    const ok = props.onArrange(hiddenIds, widgetIds);
    if (!ok) {
      setHiddenIds(props.hidden.map((p) => p.id));
      setWidgetIds(props.widget.map((p) => p.id));
    }
    setDraggingId(null);
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
      <DragTile
        key={id}
        preset={p}
        index={loc.index}
        left={pos.left}
        top={pos.top}
        theme={theme}
        editMode={props.editMode}
        isDragging={isDragging}
        onBegin={() => beginDrag(id)}
        onMove={(tx, ty) => {
          dragX.value = tx;
          dragY.value = ty;
          moveDuringDrag(id, tx, ty);
        }}
        onEnd={endDrag}
        setDX={(v) => (dragX.value = v)}
        setDY={(v) => (dragY.value = v)}
        onTap={() => (props.editMode ? props.onEdit(p) : props.onLaunch(p))}
      />
    );
  };

  const draggingPreset = draggingId ? byId.get(draggingId) : null;

  return (
    <View onLayout={onLayout} style={{ height: totalHeight }}>
      <AreaLabel theme={theme} top={0} text={props.hiddenLabel} />
      {hiddenIds.length === 0 && <EmptyHint theme={theme} top={hiddenAreaTop} />}

      <AreaLabel theme={theme} top={widgetLabelTop} text={props.widgetLabel} right={props.widgetCountLabel} />
      {widgetIds.length === 0 && <EmptyHint theme={theme} top={widgetAreaTop} />}

      {[...hiddenIds, ...widgetIds].map(renderTile)}

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

interface DragTileProps {
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
  setDX: (v: number) => void;
  setDY: (v: number) => void;
  onTap: () => void;
}

function DragTile({
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
}: DragTileProps) {
  const { c } = theme;
  const pressScale = useSharedValue(1);
  const jiggle = useSharedValue(0);
  const reduced = useReducedMotion();

  // iOS ホーム画面風の「ぷるぷる」: 編集モードかつドラッグ中でない時だけ
  React.useEffect(() => {
    if (editMode && !isDragging && !reduced) {
      const phase = ((index % 5) - 2) * 18;
      jiggle.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 130 + phase }),
          withTiming(-1.1, { duration: 130 + phase }),
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

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(220)
        .onStart(() => {
          runOnJS(onBegin)();
        })
        .onUpdate((e) => {
          runOnJS(onMove)(e.translationX, e.translationY);
        })
        .onEnd(() => {
          runOnJS(onEnd)();
        })
        .onFinalize(() => {}),
    [onBegin, onMove, onEnd],
  );

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
          accessibilityHint={editMode ? '編集します。長押しで移動' : 'タップで起動。長押しで編集モード'}
        >
          <PresetTileVisual icon={preset.icon} color={preset.color} glow={!isDragging} />
        </Animated.View>
      </GestureDetector>
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
