import { ja, type Strings } from './ja';

// v1 は日本語のみ。将来ロケール追加時はここで切り替える。
const strings: Strings = ja;

export function t(): Strings {
  return strings;
}

export type { Strings };
