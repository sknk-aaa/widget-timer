import * as StoreReview from 'expo-store-review';
import { Linking } from 'react-native';
import { getMeta, setMeta } from '../db/repo';
import { REVIEW_URL } from '../domain/links';

const COUNT_KEY = 'review_completion_count';
const ASKED_KEY = 'review_asked';

// タイマー完了（鳴って終了）= 満足度が高い瞬間。この回数に達したら1回だけ依頼。
const REVIEW_THRESHOLD = 3;

/** タイマー完了数を加算し、現在値を返す（同期・DB）。 */
export function bumpCompletionCount(delta: number): number {
  if (delta <= 0) return Number(getMeta(COUNT_KEY) ?? '0');
  const count = Number(getMeta(COUNT_KEY) ?? '0') + delta;
  setMeta(COUNT_KEY, String(count));
  return count;
}

/**
 * 満足度の高い瞬間（完了が閾値到達）に、Apple純正のレビュー依頼を1回だけ出す。
 * Expo Go / 非対応環境では isAvailableAsync が false になり何もしない。
 */
export async function maybeAskReview(count: number): Promise<void> {
  if (getMeta(ASKED_KEY) === '1') return;
  if (count < REVIEW_THRESHOLD) return;
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    setMeta(ASKED_KEY, '1');
    await StoreReview.requestReview();
  } catch {
    // レビュー依頼は失敗しても無視（必須機能ではない）。
  }
}

/** 設定の「レビューして応援」: App Store のレビュー作成画面（文章を書ける）を開く。 */
export async function openWriteReview(): Promise<void> {
  await Linking.openURL(REVIEW_URL).catch(() => {});
}
