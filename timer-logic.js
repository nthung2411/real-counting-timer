// Pure functions — no DOM or browser API dependencies.
// Imported by app.js and tested by timer-logic.test.js.

import { STRINGS } from './i18n.js';

/**
 * Returns an announcement string for the given tick transition,
 * or null if no announcement should be made.
 *
 * @param {number} prev  - remaining seconds BEFORE this tick
 * @param {number} curr  - remaining seconds AFTER this tick
 * @param {number} total - total duration in seconds
 * @param {'vi'|'en'} [lang='vi'] - language for announcement text
 * @returns {string|null}
 */
export function getAnnouncement(prev, curr, total, lang = 'vi') {
  const s = STRINGS[lang];

  // Finished
  if (curr === 0) return s.announceFinish;

  const prevElapsed = total - prev;
  const currElapsed = total - curr;

  // Every 5-minute elapsed mark (fires when the tick crosses the boundary)
  for (let mark = 300; mark <= total; mark += 300) {
    if (prevElapsed < mark && currElapsed >= mark) {
      const minutesElapsed = Math.round(mark / 60);
      const minutesLeft = Math.round(curr / 60);
      if (minutesLeft > 0) {
        return s.announceElapsed(minutesElapsed, minutesLeft);
      }
    }
  }

  // Remaining ≤ 5 min (but > 60s): announce on each whole-minute mark
  if (curr <= 300 && curr > 60 && curr % 60 === 0) {
    return s.announceMinLeft(curr / 60);
  }

  // Remaining ≤ 60s: every second — just the number for the countdown
  if (curr <= 60 && curr > 0) {
    if (curr === 60) return s.announce1MinLeft;
    return String(curr); // numbers are language-independent
  }

  return null;
}

/**
 * Formats seconds into MM:SS string.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Returns the duration in whole minutes (rounded).
 * Used for start announcements and history display labels.
 * @param {number} seconds
 * @returns {number}
 */
export function formatMinutes(seconds) {
  return Math.round(seconds / 60);
}
