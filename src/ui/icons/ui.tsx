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
