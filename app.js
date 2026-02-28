// ── Constants ────────────────────────────────────────────────────────────────

const RING_RADIUS = 150; // must match SVG r attribute
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ── State ────────────────────────────────────────────────────────────────────

let state = {
  duration: 0,       // total seconds selected
  remaining: 0,      // seconds left
  isRunning: false,
  intervalId: null,
  speechEnabled: true,
};

// ── DOM refs ─────────────────────────────────────────────────────────────────

const presetBtns   = document.querySelectorAll('.preset-btn');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn     = document.getElementById('resetBtn');
const timeDisplay  = document.getElementById('timeDisplay');
const statusLabel  = document.getElementById('statusLabel');
const ringProgress = document.getElementById('ringProgress');
const announcementEl = document.getElementById('announcement');
const voiceCheckbox  = document.getElementById('voiceToggle');
const finishOverlay  = document.getElementById('finishOverlay');
const finishDismiss  = document.getElementById('finishDismiss');

// ── Speech ───────────────────────────────────────────────────────────────────

function speak(text) {
  if (!state.speechEnabled) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Show announcement banner
  showAnnouncement(text);

  window.speechSynthesis.speak(utterance);
}

function showAnnouncement(text) {
  announcementEl.textContent = `"${text}"`;
  announcementEl.classList.add('visible');
  clearTimeout(announcementEl._hideTimer);
  announcementEl._hideTimer = setTimeout(() => {
    announcementEl.classList.remove('visible');
  }, 4000);
}

// ── Announcement logic ────────────────────────────────────────────────────────
// Returns the Vietnamese announcement string, or null if nothing to say.

function getAnnouncement(prev, curr, total) {
  // Finished
  if (curr === 0) return 'Hết giờ!';

  const prevElapsed = total - prev;
  const currElapsed = total - curr;

  // Every 5-minute elapsed mark (must cross the mark between ticks)
  // e.g. at 5 min elapsed, 10 min elapsed, etc.
  for (let mark = 300; mark <= total; mark += 300) {
    if (prevElapsed < mark && currElapsed >= mark) {
      const minutesElapsed = Math.round(mark / 60);
      const minutesLeft = Math.round(curr / 60);
      if (minutesLeft > 0) {
        return `Đã qua ${minutesElapsed} phút, còn ${minutesLeft} phút`;
      }
    }
  }

  // Remaining ≤ 5 min (but > 60s): announce on each whole-minute mark
  if (curr <= 300 && curr > 60 && curr % 60 === 0) {
    return `Còn ${curr / 60} phút`;
  }

  // Remaining ≤ 60s: every second
  if (curr <= 60 && curr > 0) {
    if (curr === 60) return 'Còn 1 phút';
    return `Còn ${curr} giây`;
  }

  return null;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateRing(remaining, total) {
  if (total === 0) {
    ringProgress.style.strokeDashoffset = 0;
    return;
  }
  const fraction = remaining / total;
  const offset = CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
}

function updateColors(remaining) {
  const isWarning = remaining > 60 && remaining <= 300;
  const isDanger  = remaining <= 60 && remaining > 0;

  ringProgress.classList.toggle('warning', isWarning);
  ringProgress.classList.toggle('danger', isDanger);
  timeDisplay.classList.toggle('warning', isWarning);
  timeDisplay.classList.toggle('danger', isDanger);
}

function renderUI() {
  timeDisplay.textContent = formatTime(state.remaining);
  updateRing(state.remaining, state.duration);
  updateColors(state.remaining);

  if (!state.duration) {
    statusLabel.textContent = 'Chọn thời gian';
    startPauseBtn.disabled = true;
  } else if (state.isRunning) {
    statusLabel.textContent = 'Đang chạy';
    startPauseBtn.textContent = 'Tạm dừng';
    startPauseBtn.disabled = false;
  } else if (state.remaining === state.duration) {
    statusLabel.textContent = 'Sẵn sàng';
    startPauseBtn.textContent = 'Bắt đầu';
    startPauseBtn.disabled = false;
  } else {
    statusLabel.textContent = 'Tạm dừng';
    startPauseBtn.textContent = 'Tiếp tục';
    startPauseBtn.disabled = false;
  }
}

// ── Timer core ────────────────────────────────────────────────────────────────

function tick() {
  const prev = state.remaining;
  state.remaining = Math.max(0, state.remaining - 1);

  const text = getAnnouncement(prev, state.remaining, state.duration);
  if (text) speak(text);

  renderUI();

  if (state.remaining === 0) {
    stopTimer();
    showFinish();
  }
}

function startTimer() {
  if (!state.duration || state.remaining === 0) return;
  state.isRunning = true;
  state.intervalId = setInterval(tick, 1000);
  renderUI();
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
  renderUI();
}

function stopTimer() {
  state.isRunning = false;
  clearInterval(state.intervalId);
  state.intervalId = null;
}

function resetTimer() {
  stopTimer();
  state.remaining = state.duration;
  finishOverlay.classList.remove('visible');
  renderUI();
}

function showFinish() {
  finishOverlay.classList.add('visible');
}

// ── Event listeners ───────────────────────────────────────────────────────────

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.isRunning) stopTimer();

    const minutes = parseInt(btn.dataset.minutes, 10);
    state.duration = minutes * 60;
    state.remaining = state.duration;

    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    finishOverlay.classList.remove('visible');
    renderUI();
  });
});

startPauseBtn.addEventListener('click', () => {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

voiceCheckbox.addEventListener('change', () => {
  state.speechEnabled = voiceCheckbox.checked;
  if (!voiceCheckbox.checked) window.speechSynthesis.cancel();
});

finishDismiss.addEventListener('click', resetTimer);

// ── Init ──────────────────────────────────────────────────────────────────────

ringProgress.style.strokeDasharray = CIRCUMFERENCE;
ringProgress.style.strokeDashoffset = 0;
renderUI();

// Initialise voice on first interaction (iOS requires this)
document.addEventListener('click', () => {
  if ('speechSynthesis' in window) {
    const dummy = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(dummy);
    window.speechSynthesis.cancel();
  }
}, { once: true });
