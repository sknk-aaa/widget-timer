import * as React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
} from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
}

type IconComponent = (props: IconProps) => React.JSX.Element;

function make(
  draw: (color: string, sw: number) => React.ReactNode,
  sw = 1.9,
): IconComponent {
  return function Icon({ size = 24, color = '#FFFFFF' }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {draw(color, sw)}
        </G>
      </Svg>
    );
  };
}

const ramen = make((c) => (
  <>
    <Path d="M4 11h16a8 8 0 0 1-16 0z" />
    <Line x1="3" y1="11" x2="21" y2="11" />
    <Path d="M9 4c-.6.9.6 1.6 0 2.6" />
    <Path d="M13 3.4c-.6.9.6 1.6 0 2.6" />
    <Path d="M17 13.5l3-1.5" />
  </>
));

const pot = make((c) => (
  <>
    <Rect x="4.5" y="9.5" width="15" height="9" rx="2" />
    <Line x1="3" y1="9.5" x2="21" y2="9.5" />
    <Line x1="3" y1="7.4" x2="5" y2="9.4" />
    <Line x1="21" y1="7.4" x2="19" y2="9.4" />
    <Line x1="12" y1="5.6" x2="12" y2="7.2" />
  </>
));

const egg = make((c) => (
  <>
    <Path d="M12 3.5c-3 0-5.2 5-5.2 9.2a5.2 5.2 0 0 0 10.4 0C17.2 8.5 15 3.5 12 3.5z" />
    <Circle cx="12" cy="13" r="2.6" fill={c} stroke="none" />
  </>
));

const coffee = make((c) => (
  <>
    <Path d="M5.5 8.5h10v4.2a5 5 0 0 1-10 0z" />
    <Path d="M15.5 9.4a2.8 2.8 0 0 1 0 5" />
    <Line x1="5" y1="19.5" x2="16" y2="19.5" />
    <Path d="M8 3.4c-.5.8.5 1.4 0 2.2" />
    <Path d="M11.5 3.4c-.5.8.5 1.4 0 2.2" />
  </>
));

const tea = make((c) => (
  <>
    <Path d="M5.5 9h9v3.8a4.5 4.5 0 0 1-9 0z" />
    <Path d="M14.5 9.8a2.6 2.6 0 0 1 0 4.6" />
    <Line x1="5" y1="19.5" x2="15" y2="19.5" />
    <Path d="M10 9V6" />
    <Rect x="8.6" y="3.6" width="2.8" height="2.4" rx="0.5" />
  </>
));

const kettle = make((c) => (
  <>
    <Path d="M5 11.5a5 5 0 0 1 10 0v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 16.5z" />
    <Path d="M15 12l4-2.5" />
    <Path d="M8 7.5a2 2 0 0 1 4 0" />
    <Line x1="6.5" y1="18" x2="6.5" y2="20" />
    <Line x1="13.5" y1="18" x2="13.5" y2="20" />
  </>
));

const toast = make((c) => (
  <>
    <Path d="M5 10.5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v7.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    <Line x1="8.5" y1="13.5" x2="15.5" y2="13.5" />
  </>
));

const rice = make((c) => (
  <>
    <Path d="M4 13h16a8 8 0 0 1-16 0z" />
    <Path d="M6 13a6 6 0 0 1 12 0" />
    <Line x1="3" y1="13" x2="21" y2="13" />
    <Line x1="14" y1="4" x2="20" y2="9" />
    <Line x1="17" y1="4" x2="20" y2="11" />
  </>
));

const bed = make((c) => (
  <>
    <Path d="M3 18v-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5" />
    <Line x1="3" y1="14.5" x2="21" y2="14.5" />
    <Path d="M6 10V8a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 11 8v2" />
    <Line x1="3" y1="18" x2="3" y2="20" />
    <Line x1="21" y1="18" x2="21" y2="20" />
  </>
));

const moon = make((c) => (
  <Path d="M20 14.5A8 8 0 1 1 9.5 4 6.3 6.3 0 0 0 20 14.5z" />
));

const nap = make((c) => (
  <>
    <Path d="M5 9h5l-5 5h5" />
    <Path d="M13 5h4l-4 4h4" />
  </>
));

const alarm = make((c) => (
  <>
    <Circle cx="12" cy="13.5" r="6.5" />
    <Path d="M5.5 5.5 3 8" />
    <Path d="M18.5 5.5 21 8" />
    <Path d="M12 10.5v3.2l2 1.3" />
  </>
));

const book = make((c) => (
  <>
    <Path d="M12 6.5C10 5 6 5 3.5 6.2V18C6 16.8 10 16.8 12 18.2" />
    <Path d="M12 6.5C14 5 18 5 20.5 6.2V18C18 16.8 14 16.8 12 18.2" />
    <Line x1="12" y1="6.5" x2="12" y2="18.2" />
  </>
));

const pencil = make((c) => (
  <>
    <Path d="M5 19l1.2-4.2L15 6l3 3-8.8 8.8z" />
    <Line x1="13.5" y1="7.5" x2="16.5" y2="10.5" />
    <Line x1="5" y1="19" x2="9.2" y2="17.8" />
  </>
));

const laptop = make((c) => (
  <>
    <Rect x="5" y="5" width="14" height="9.5" rx="1.4" />
    <Path d="M2.5 18h19l-1-2.2H3.5z" />
  </>
));

const hourglass = make((c) => (
  <>
    <Line x1="7" y1="4" x2="17" y2="4" />
    <Line x1="7" y1="20" x2="17" y2="20" />
    <Path d="M8 4c0 4 4 4 4 8s-4 4-4 8" />
    <Path d="M16 4c0 4-4 4-4 8s4 4 4 8" />
  </>
));

const briefcase = make((c) => (
  <>
    <Rect x="3" y="8" width="18" height="11" rx="2.2" />
    <Path d="M9 8V6.4A2 2 0 0 1 11 4.4h2a2 2 0 0 1 2 2V8" />
    <Line x1="3" y1="12.5" x2="21" y2="12.5" />
    <Line x1="12" y1="12" x2="12" y2="14" />
  </>
));

const dumbbell = make((c) => (
  <>
    <Line x1="3" y1="9.5" x2="3" y2="14.5" />
    <Line x1="6" y1="7.5" x2="6" y2="16.5" />
    <Line x1="18" y1="7.5" x2="18" y2="16.5" />
    <Line x1="21" y1="9.5" x2="21" y2="14.5" />
    <Line x1="6" y1="12" x2="18" y2="12" />
  </>
));

const run = make((c) => (
  <>
    <Circle cx="15" cy="5.5" r="1.8" />
    <Path d="M13.5 9l-3 2 1.5 3-2 4" />
    <Path d="M11.5 14l3.5.5 2 3" />
    <Path d="M10.5 11l-3 .5-2-1.5" />
  </>
));

const yoga = make((c) => (
  <>
    <Circle cx="12" cy="5.5" r="1.8" />
    <Path d="M12 8v4" />
    <Path d="M12 12l-5.5 2.5M12 12l5.5 2.5" />
    <Path d="M7 18c1.5-2 8.5-2 10 0" />
  </>
));

const bike = make((c) => (
  <>
    <Circle cx="6" cy="16" r="3.4" />
    <Circle cx="18" cy="16" r="3.4" />
    <Path d="M6 16l4-7h5" />
    <Path d="M10 9l4.5 7" />
    <Line x1="9" y1="6.5" x2="12" y2="6.5" />
    <Line x1="15" y1="9" x2="16.5" y2="6.5" />
  </>
));

const washer = make((c) => (
  <>
    <Rect x="4.5" y="3" width="15" height="18" rx="2.2" />
    <Circle cx="12" cy="13" r="4.6" />
    <Circle cx="12" cy="13" r="1.6" />
    <Line x1="7" y1="6" x2="9" y2="6" />
    <Line x1="15.5" y1="6" x2="16.5" y2="6" />
  </>
));

const broom = make((c) => (
  <>
    <Line x1="19" y1="4" x2="11" y2="12" />
    <Path d="M11 12l-6 4 4 4 6-4z" />
    <Path d="M7.5 14.5l3 3M10 13l3 3" />
  </>
));

const dishes = make((c) => (
  <>
    <Circle cx="9" cy="12.5" r="6.3" />
    <Circle cx="9" cy="12.5" r="2.6" />
    <Line x1="17.5" y1="5.5" x2="17.5" y2="13" />
    <Path d="M16 5.5v3.5M19 5.5v3.5M16 9h3" />
  </>
));

const plant = make((c) => (
  <>
    <Path d="M8 14h8l-1 6H9z" />
    <Path d="M12 14c0-3-2-5-5-5 0 3 2 5 5 5z" />
    <Path d="M12 14c0-4 2.5-6 6-6 0 4-2.5 6-6 6z" />
    <Line x1="12" y1="11" x2="12" y2="14" />
  </>
));

const bath = make((c) => (
  <>
    <Path d="M3.5 12.5h17v2.5a3.5 3.5 0 0 1-3.5 3.5h-10A3.5 3.5 0 0 1 3.5 15z" />
    <Path d="M6 12.5V6.5A2 2 0 0 1 8 4.5a2 2 0 0 1 2 2" />
    <Line x1="6" y1="18.5" x2="6" y2="20.5" />
    <Line x1="18" y1="18.5" x2="18" y2="20.5" />
  </>
));

const pill = make((c) => (
  <>
    <Path d="M8.4 15.6l7.2-7.2a3.6 3.6 0 0 0-5.1-5.1L3.3 10.5a3.6 3.6 0 0 0 5.1 5.1z" />
    <Line x1="7" y1="7" x2="12" y2="12" />
  </>
));

const dog = make((c) => (
  <>
    <Path d="M7 7l-2-2v5" />
    <Path d="M17 7l2-2v5" />
    <Path d="M5 10v4a7 7 0 0 0 14 0v-4" />
    <Circle cx="9.5" cy="12.5" r="0.8" fill={c} stroke="none" />
    <Circle cx="14.5" cy="12.5" r="0.8" fill={c} stroke="none" />
    <Path d="M10.5 16h3l-1.5 1.5z" fill={c} stroke="none" />
  </>
));

const car = make((c) => (
  <>
    <Path d="M3 14l2-5.2A2.5 2.5 0 0 1 7.3 7h9.4a2.5 2.5 0 0 1 2.3 1.8L21 14" />
    <Path d="M3 14h18v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <Circle cx="7" cy="18" r="1.6" />
    <Circle cx="17" cy="18" r="1.6" />
  </>
));

const music = make((c) => (
  <>
    <Path d="M9 17V6l9-1.8V15" />
    <Circle cx="6.5" cy="17" r="2.4" fill={c} stroke="none" />
    <Circle cx="15.5" cy="15" r="2.4" fill={c} stroke="none" />
  </>
));

const bell = make((c) => (
  <>
    <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.8H4.5z" />
    <Path d="M10 20a2 2 0 0 0 4 0" />
    <Line x1="12" y1="3" x2="12" y2="5" />
  </>
));

const timer = make((c) => (
  <>
    <Circle cx="12" cy="13.5" r="7.5" />
    <Line x1="9.5" y1="3" x2="14.5" y2="3" />
    <Line x1="12" y1="3" x2="12" y2="6" />
    <Path d="M12 13.5V9" />
  </>
));

export const ICONS: Record<string, IconComponent> = {
  ramen,
  pot,
  egg,
  coffee,
  tea,
  kettle,
  toast,
  rice,
  bed,
  moon,
  nap,
  alarm,
  book,
  pencil,
  laptop,
  hourglass,
  briefcase,
  dumbbell,
  run,
  yoga,
  bike,
  washer,
  broom,
  dishes,
  plant,
  bath,
  pill,
  dog,
  car,
  music,
  bell,
  timer,
};

export const ICON_CATEGORIES: { key: string; label: string; ids: string[] }[] = [
  { key: 'cooking', label: '料理', ids: ['ramen', 'pot', 'egg', 'coffee', 'tea', 'kettle', 'toast', 'rice'] },
  { key: 'sleep', label: '睡眠', ids: ['bed', 'moon', 'nap', 'alarm'] },
  { key: 'work', label: '勉強・仕事', ids: ['book', 'pencil', 'laptop', 'hourglass', 'briefcase'] },
  { key: 'exercise', label: '運動', ids: ['dumbbell', 'run', 'yoga', 'bike'] },
  { key: 'chores', label: '家事', ids: ['washer', 'broom', 'dishes', 'plant'] },
  { key: 'life', label: '生活', ids: ['bath', 'pill', 'dog', 'car', 'music', 'bell', 'timer'] },
];

export const ICON_IDS: string[] = ICON_CATEGORIES.flatMap((c) => c.ids);

export const DEFAULT_ICON_ID = 'timer';

export function IconGlyph({
  id,
  size = 24,
  color = '#FFFFFF',
}: {
  id: string;
  size?: number;
  color?: string;
}): React.JSX.Element {
  const Comp = ICONS[id] ?? ICONS[DEFAULT_ICON_ID]!;
  return <Comp size={size} color={color} />;
}
