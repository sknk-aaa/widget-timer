import { t } from '../i18n';

/** 残り秒数を「○日 HH:MM:SS」「H:MM:SS」「MM:SS」形式に整形する（日表記はロケール対応）。 */
export function formatRemaining(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const p2 = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${t().duration.remainingDayPrefix(days)}${p2(hours)}:${p2(minutes)}:${p2(seconds)}`;
  }
  if (hours > 0) {
    return `${hours}:${p2(minutes)}:${p2(seconds)}`;
  }
  return `${p2(minutes)}:${p2(seconds)}`;
}

/** プリセットボタン等で使う、短い長さ表記（例: 3分 / 1時間30分 / 2日 / 3 min）。 */
export function formatDurationShort(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return t().duration.short(days, hours, minutes, seconds);
}

/** 終了予定時刻（エポックms）を「HH:MM」または日付付きで返す。 */
export function formatEndClock(endAtMs: number, now: number = nowMs()): string {
  const d = new Date(endAtMs);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const sameDay = new Date(now).toDateString() === d.toDateString();
  if (sameDay) return `${hh}:${mm}`;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day} ${hh}:${mm}`;
}

/** dial 用に「日・時・分・秒」へ分解する。 */
export function decomposeDuration(totalSec: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const sec = Math.max(0, Math.floor(totalSec));
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

export function composeDuration(d: {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}): number {
  return (
    (d.days ?? 0) * 86400 +
    (d.hours ?? 0) * 3600 +
    (d.minutes ?? 0) * 60 +
    (d.seconds ?? 0)
  );
}

/** Date.now() の単一窓口。テスト時の差し替えを容易にする。 */
export function nowMs(): number {
  return Date.now();
}

/** 指定の時刻（時:分）までの秒数。過ぎていれば翌日扱い。 */
export function secondsUntilClock(hour: number, minute: number, now: number = nowMs()): number {
  const d = new Date(now);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0);
  let diff = Math.round((target.getTime() - now) / 1000);
  if (diff <= 0) diff += 86400;
  return diff;
}

/** RunningTimer の現在残り秒数を計算する。 */
export function remainingSecOf(
  timer: { state: string; endAt: number; pausedRemainingSec: number | null },
  now: number = nowMs(),
): number {
  if (timer.state === 'paused') {
    return Math.max(0, timer.pausedRemainingSec ?? 0);
  }
  return Math.max(0, Math.round((timer.endAt - now) / 1000));
}
