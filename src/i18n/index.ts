import { getLocales } from 'expo-localization';
import { ja, type Strings } from './ja';
import { en } from './en';

// 端末のロケールで言語を決定（日本語=ja、それ以外=en）。
// iOS の「アプリごとの言語」設定（CFBundleLocalizations: ja/en）も getLocales が反映する。
function pickStrings(): Strings {
  try {
    const code = getLocales()?.[0]?.languageCode;
    return code === 'ja' ? ja : en;
  } catch {
    return en;
  }
}

const strings: Strings = pickStrings();

/** 端末ロケールが日本語か（動画など言語別アセットの出し分けに使う）。 */
export const isJaLocale: boolean = (() => {
  try {
    return getLocales()?.[0]?.languageCode === 'ja';
  } catch {
    return false;
  }
})();

export function t(): Strings {
  return strings;
}

export type { Strings };
