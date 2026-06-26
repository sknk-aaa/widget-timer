import type { ColorId } from './types';

export interface ColorDef {
  id: ColorId;
  /** チップ背景色（白アイコンが乗る前提。ライト/ダーク共通）。 */
  bg: string;
  /** 実行中ドック等で使う淡い面色（任意）。 */
  tint: string;
}

// 白アイコンが乗る前提で、各色は白に対して概ね 3:1 以上のコントラストを確保。
export const PALETTE: ColorDef[] = [
  { id: 'red', bg: '#E5484D', tint: '#E5484D22' },
  { id: 'orange', bg: '#EC6A09', tint: '#EC6A0922' },
  { id: 'amber', bg: '#BC7400', tint: '#BC740022' },
  { id: 'lime', bg: '#6FA80F', tint: '#6FA80F22' },
  { id: 'green', bg: '#1E9E66', tint: '#1E9E6622' },
  { id: 'teal', bg: '#0B8E8E', tint: '#0B8E8E22' },
  { id: 'cyan', bg: '#1593C0', tint: '#1593C022' },
  { id: 'blue', bg: '#3B82F6', tint: '#3B82F622' },
  { id: 'indigo', bg: '#6366F1', tint: '#6366F122' },
  { id: 'violet', bg: '#8B5CF6', tint: '#8B5CF622' },
  { id: 'fuchsia', bg: '#C92BCE', tint: '#C92BCE22' },
  { id: 'pink', bg: '#DB4F97', tint: '#DB4F9722' },
  { id: 'brown', bg: '#8A5A2B', tint: '#8A5A2B22' },
];

export const DEFAULT_COLOR_ID: ColorId = 'blue';

const byId = new Map(PALETTE.map((c) => [c.id, c]));

export function colorOf(id: ColorId): ColorDef {
  return byId.get(id) ?? PALETTE[0]!;
}
