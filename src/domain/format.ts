/** 残り秒数を「○日 HH:MM:SS」「H:MM:SS」「MM:SS」形式に整形する。 */
export function formatRemaining(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const p2 = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}日 ${p2(hours)}:${p2(minutes)}:${p2(seconds)}`;
  }
  if (hours > 0) {
    return `${hours}:${p2(minutes)}:${p2(seconds)}`;
  }
  return `${p2(minutes)}:${p2(seconds)}`;
}

/** プリセットボタン等で使う、短い長さ表記（例: 3分 / 1時間30分 / 2日）。 */
export function formatDurationShort(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}日`);
  if (hours > 0) parts.push(`${hours}時間`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (seconds > 0 && days === 0 && hours === 0) parts.push(`${seconds}秒`);
  if (parts.length === 0) return '0秒';
  return parts.join('');
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
