import * as React from 'react';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';

interface P {
  size?: number;
  color: string;
}

function wrap(node: (color: string) => React.ReactNode, sw = 1.9) {
  return function Glyph({ size = 22, color }: P) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          {node(color)}
        </G>
      </Svg>
    );
  };
}

export const ChartIcon = wrap(() => (
  <>
    <Line x1="4" y1="20" x2="20" y2="20" />
    <Rect x="5.5" y="11" width="3.2" height="6" rx="1" />
    <Rect x="10.4" y="7" width="3.2" height="10" rx="1" />
    <Rect x="15.3" y="13" width="3.2" height="4" rx="1" />
  </>
));

export const GearIcon = wrap(() => (
  <>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
  </>
));

export const PlusIcon = wrap(() => (
  <>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </>
), 2.4);

export const LockIcon = wrap((color) => (
  <>
    <Rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
    <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <Circle cx="12" cy="15" r="1.1" fill={color} stroke="none" />
  </>
));

export const CheckIcon = wrap(() => <Path d="M5 12.5l4.5 4.5L19 7" />, 2.3);

export const ChevronIcon = wrap(() => <Path d="M9 6l6 6-6 6" />);

export const StarIcon = wrap(() => (
  <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" />
));

export const BellGlyph = wrap(() => (
  <>
    <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.8H4.5z" />
    <Path d="M10 20a2 2 0 0 0 4 0" />
    <Line x1="12" y1="3" x2="12" y2="5" />
  </>
));

export const MenuIcon = wrap(() => (
  <>
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Line x1="4" y1="12" x2="20" y2="12" />
    <Line x1="4" y1="17" x2="20" y2="17" />
  </>
), 2.1);

export const ClockIcon = wrap(() => (
  <>
    <Circle cx="12" cy="12" r="8" />
    <Path d="M12 7.6V12l3 1.8" />
  </>
));

export const TagIcon = wrap(() => (
  <>
    <Path d="M4 4.5h7.4l8.1 8.1a1.9 1.9 0 0 1 0 2.7l-4.2 4.2a1.9 1.9 0 0 1-2.7 0L4.5 11.4V4.5z" />
    <Circle cx="8.2" cy="8.2" r="1.3" />
  </>
));

export const DropletIcon = wrap(() => (
  <Path d="M12 3.5c3.4 3.9 5.4 6.5 5.4 9.3a5.4 5.4 0 0 1-10.8 0C6.6 10 8.6 7.4 12 3.5z" />
));

export const ShapesIcon = wrap(() => (
  <>
    <Rect x="4" y="4.5" width="6.8" height="6.8" rx="1.6" />
    <Circle cx="16.6" cy="7.9" r="3.4" />
    <Path d="M8 20.2l-3.4-6h6.8z" />
  </>
));

// 設定メニュー用の小アイコン群（白グリフ＋カラー角丸に乗せる前提）。
export const ShareIcon = wrap(() => (
  <>
    <Path d="M12 4v9.5" />
    <Path d="M8.5 7.5L12 4l3.5 3.5" />
    <Path d="M6.5 11.5V18a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-6.5" />
  </>
));

export const GridIcon = wrap(() => (
  <>
    <Rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.6" />
    <Rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.6" />
    <Rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.6" />
    <Rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.6" />
  </>
));

export const HelpIcon = wrap((color) => (
  <>
    <Circle cx="12" cy="12" r="8.5" />
    <Path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.6-2.1 1.9-2.4 3.1" />
    <Circle cx="12" cy="16.6" r="0.9" fill={color} stroke="none" />
  </>
));

export const VibrationIcon = wrap(() => (
  <>
    <Rect x="8.5" y="4.5" width="7" height="15" rx="2" />
    <Path d="M5 9.5v5M19 9.5v5" />
  </>
));

export const InfoIcon = wrap((color) => (
  <>
    <Circle cx="12" cy="12" r="8.5" />
    <Path d="M12 11v5.2" />
    <Circle cx="12" cy="7.8" r="0.9" fill={color} stroke="none" />
  </>
));

export const ChatIcon = wrap(() => (
  <Path d="M5 7a1.8 1.8 0 0 1 1.8-1.8h10.4A1.8 1.8 0 0 1 19 7v6.4a1.8 1.8 0 0 1-1.8 1.8H10l-3.8 3.2v-3.2H6.8A1.8 1.8 0 0 1 5 13.4z" />
));

export const DocIcon = wrap(() => (
  <>
    <Path d="M7 4.8h6l4 4v10.4a.8.8 0 0 1-.8.8H7.8a.8.8 0 0 1-.8-.8z" />
    <Path d="M13 4.8V9h4" />
    <Path d="M9.5 12.5h5M9.5 15.5h5" />
  </>
));
