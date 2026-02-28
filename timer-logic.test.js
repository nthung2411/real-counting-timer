import { describe, it, expect } from 'vitest';
import { getAnnouncement, formatTime, formatMinutes } from './timer-logic.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Simulate a full timer run and collect every non-null announcement. */
function collectAnnouncements(totalSeconds) {
  const results = [];
  for (let remaining = totalSeconds; remaining >= 0; remaining--) {
    const prev = remaining + 1 === totalSeconds + 1 ? totalSeconds : remaining + 1;
    if (remaining === totalSeconds) continue; // first "tick" hasn't happened yet
    const text = getAnnouncement(remaining + 1, remaining, totalSeconds);
    if (text !== null) results.push({ at: remaining, text });
  }
  return results;
}

// ── formatTime ────────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats zero', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats single-digit seconds', () => {
    expect(formatTime(9)).toBe('00:09');
  });

  it('formats exactly one minute', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats five minutes', () => {
    expect(formatTime(300)).toBe('05:00');
  });

  it('formats sixty minutes', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('pads both fields to two digits', () => {
    expect(formatTime(599)).toBe('09:59');
  });
});

// ── getAnnouncement — finished ────────────────────────────────────────────────

describe('getAnnouncement — finished', () => {
  it('returns "Hết giờ!" when curr is 0', () => {
    expect(getAnnouncement(1, 0, 300)).toBe('Hết giờ!');
    expect(getAnnouncement(1, 0, 900)).toBe('Hết giờ!');
    expect(getAnnouncement(1, 0, 3600)).toBe('Hết giờ!');
  });
});

// ── getAnnouncement — 5-minute elapsed marks ──────────────────────────────────

describe('getAnnouncement — every 5 minutes elapsed', () => {
  it('fires at exactly 5 min elapsed on a 60-min timer', () => {
    // elapsed crosses 300: prev=3301 (elapsed=299), curr=3300 (elapsed=300)
    expect(getAnnouncement(3301, 3300, 3600)).toBe('Đã qua 5 phút, còn 55 phút');
  });

  it('fires at 10 min elapsed on a 60-min timer', () => {
    expect(getAnnouncement(3001, 3000, 3600)).toBe('Đã qua 10 phút, còn 50 phút');
  });

  it('fires at 30 min elapsed on a 60-min timer', () => {
    expect(getAnnouncement(1801, 1800, 3600)).toBe('Đã qua 30 phút, còn 30 phút');
  });

  it('fires at 55 min elapsed on a 60-min timer (remaining = 5 min)', () => {
    // The elapsed loop fires before the ≤5-min remaining check
    expect(getAnnouncement(301, 300, 3600)).toBe('Đã qua 55 phút, còn 5 phút');
  });

  it('fires at 5 min elapsed on a 15-min timer', () => {
    expect(getAnnouncement(601, 600, 900)).toBe('Đã qua 5 phút, còn 10 phút');
  });

  it('fires at 10 min elapsed on a 15-min timer (remaining = 5 min)', () => {
    expect(getAnnouncement(301, 300, 900)).toBe('Đã qua 10 phút, còn 5 phút');
  });

  it('fires at 5 min elapsed on a 30-min timer', () => {
    expect(getAnnouncement(1501, 1500, 1800)).toBe('Đã qua 5 phút, còn 25 phút');
  });

  it('does NOT fire mid-interval (no mark crossed)', () => {
    expect(getAnnouncement(3400, 3399, 3600)).toBeNull();
    expect(getAnnouncement(2000, 1999, 3600)).toBeNull();
  });

  it('does NOT fire for a 5-min timer (total=300) because remaining hits 0 first', () => {
    // At remaining=1→0: returns "Hết giờ!" not a 5-min elapsed message
    expect(getAnnouncement(1, 0, 300)).toBe('Hết giờ!');
    // No tick ever crosses an elapsed mark
    const announcements = collectAnnouncements(300);
    const elapsedMsgs = announcements.filter(a => a.text.startsWith('Đã qua'));
    expect(elapsedMsgs).toHaveLength(0);
  });
});

// ── getAnnouncement — ≤5 min remaining, per-minute ───────────────────────────

describe('getAnnouncement — ≤5 min remaining per-minute warnings', () => {
  it('announces "Còn 4 phút" at remaining=240', () => {
    expect(getAnnouncement(241, 240, 300)).toBe('Còn 4 phút');
  });

  it('announces "Còn 3 phút" at remaining=180', () => {
    expect(getAnnouncement(181, 180, 300)).toBe('Còn 3 phút');
  });

  it('announces "Còn 2 phút" at remaining=120', () => {
    expect(getAnnouncement(121, 120, 300)).toBe('Còn 2 phút');
  });

  it('does NOT fire at a non-minute-boundary second', () => {
    expect(getAnnouncement(242, 241, 300)).toBeNull();
    expect(getAnnouncement(200, 199, 300)).toBeNull();
  });

  it('does NOT fire on the very first tick of a 5-min timer (300→299)', () => {
    // First tick: prev=300, curr=299. 299 % 60 !== 0, so no announcement.
    expect(getAnnouncement(300, 299, 300)).toBeNull();
  });
});

// ── getAnnouncement — ≤60s countdown ─────────────────────────────────────────

describe('getAnnouncement — ≤60s countdown', () => {
  it('announces "Còn 1 phút" at remaining=60', () => {
    expect(getAnnouncement(61, 60, 3600)).toBe('Còn 1 phút');
  });

  it('announces "59" at remaining=59', () => {
    expect(getAnnouncement(60, 59, 3600)).toBe('59');
  });

  it('announces "30" at remaining=30', () => {
    expect(getAnnouncement(31, 30, 3600)).toBe('30');
  });

  it('announces "1" at remaining=1', () => {
    expect(getAnnouncement(2, 1, 3600)).toBe('1');
  });

  it('fires every second from 59 down to 1 as plain numbers', () => {
    for (let s = 59; s >= 1; s--) {
      const text = getAnnouncement(s + 1, s, 3600);
      expect(text).toBe(String(s));
    }
  });
});

// ── getAnnouncement — null cases ──────────────────────────────────────────────

describe('getAnnouncement — no announcement (returns null)', () => {
  it('returns null mid-timer with no special condition', () => {
    expect(getAnnouncement(500, 499, 3600)).toBeNull();
    expect(getAnnouncement(1200, 1199, 3600)).toBeNull();
    expect(getAnnouncement(2700, 2699, 3600)).toBeNull();
  });

  it('returns null just before a 5-min elapsed mark', () => {
    // One second before 5-min elapsed (elapsed=299→300 hasn't crossed yet from 300 side)
    expect(getAnnouncement(3302, 3301, 3600)).toBeNull();
  });

  it('returns null at remaining=301 (> 5 min, not a minute mark)', () => {
    expect(getAnnouncement(302, 301, 3600)).toBeNull();
  });
});

// ── getAnnouncement — full simulation spot-checks ─────────────────────────────

describe('getAnnouncement — full timer simulation', () => {
  it('60-min timer fires exactly at expected times', () => {
    const all = collectAnnouncements(3600);
    const texts = all.map(a => a.text);

    // 5-min elapsed marks
    expect(texts).toContain('Đã qua 5 phút, còn 55 phút');
    expect(texts).toContain('Đã qua 10 phút, còn 50 phút');
    expect(texts).toContain('Đã qua 55 phút, còn 5 phút');

    // ≤5 min remaining per-minute (4, 3, 2 — the 5-min mark is covered by elapsed)
    expect(texts).toContain('Còn 4 phút');
    expect(texts).toContain('Còn 3 phút');
    expect(texts).toContain('Còn 2 phút');

    // 60s countdown
    expect(texts).toContain('Còn 1 phút');
    expect(texts).toContain('59');
    expect(texts).toContain('1');
    expect(texts).toContain('Hết giờ!');
  });

  it('15-min timer has correct announcement count and content', () => {
    const all = collectAnnouncements(900);
    const texts = all.map(a => a.text);

    expect(texts).toContain('Đã qua 5 phút, còn 10 phút');
    expect(texts).toContain('Đã qua 10 phút, còn 5 phút'); // covers the 5-min remaining mark
    expect(texts).toContain('Còn 4 phút');
    expect(texts).toContain('Còn 3 phút');
    expect(texts).toContain('Còn 2 phút');
    expect(texts).toContain('Còn 1 phút');
    expect(texts).toContain('Hết giờ!');

    // "Còn 5 phút" should NOT appear as a separate announcement since the
    // elapsed-mark message already covered it
    const standalone5 = all.filter(a => a.text === 'Còn 5 phút');
    expect(standalone5).toHaveLength(0);
  });

  it('5-min timer only gets per-minute warnings + countdown + finish', () => {
    const all = collectAnnouncements(300);
    const texts = all.map(a => a.text);

    expect(texts).not.toContain('Đã qua 5 phút, còn 0 phút'); // guarded by minutesLeft > 0
    expect(texts).toContain('Còn 4 phút');
    expect(texts).toContain('Còn 3 phút');
    expect(texts).toContain('Còn 2 phút');
    expect(texts).toContain('Còn 1 phút');
    expect(texts).toContain('59');
    expect(texts).toContain('Hết giờ!');
  });

  it('each 60s countdown second appears exactly once in a 60-min run', () => {
    const all = collectAnnouncements(3600);
    for (let s = 59; s >= 1; s--) {
      const matches = all.filter(a => a.text === String(s));
      expect(matches).toHaveLength(1);
    }
  });

  it('no announcement fires twice at the same remaining value in a 60-min run', () => {
    const all = collectAnnouncements(3600);
    const byRemaining = new Map();
    for (const { at, text } of all) {
      expect(byRemaining.has(at)).toBe(false);
      byRemaining.set(at, text);
    }
  });
});

// ── formatMinutes ─────────────────────────────────────────────────────────────

describe('formatMinutes', () => {
  it('converts 300s to 5', () => {
    expect(formatMinutes(300)).toBe(5);
  });

  it('converts 900s to 15', () => {
    expect(formatMinutes(900)).toBe(15);
  });

  it('converts 1800s to 30', () => {
    expect(formatMinutes(1800)).toBe(30);
  });

  it('converts 3600s to 60', () => {
    expect(formatMinutes(3600)).toBe(60);
  });

  it('rounds non-exact value (1500s → 25)', () => {
    expect(formatMinutes(1500)).toBe(25);
  });
});
