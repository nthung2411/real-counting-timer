import { getAnnouncement, formatTime, formatMinutes } from './timer-logic.js';
import { STRINGS } from './i18n.js';

// ── Constants ────────────────────────────────────────────────────────────────

const RING_RADIUS = 150; // must match SVG r attribute
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ── State ────────────────────────────────────────────────────────────────────

let state = {
  duration: 0,          // total seconds selected
  remaining: 0,         // seconds left
  isRunning: false,
  intervalId: null,
  speechEnabled: true,
  isFreshStart: false,  // true when a duration is freshly selected/reset
  lang: localStorage.getItem('timerLang') || 'vi',
};

/** Returns the current language's string table. */
function t() { return STRINGS[state.lang]; }

// ── DOM refs ─────────────────────────────────────────────────────────────────

const presetBtns        = document.querySelectorAll('.preset-btn');
const startPauseBtn     = document.getElementById('startPauseBtn');
const resetBtn          = document.getElementById('resetBtn');
const timeDisplay       = document.getElementById('timeDisplay');
const statusLabel       = document.getElementById('statusLabel');
const ringProgress      = document.getElementById('ringProgress');
const announcementEl    = document.getElementById('announcement');
const voiceCheckbox     = document.getElementById('voiceToggle');
const finishOverlay     = document.getElementById('finishOverlay');
const finishDismiss     = document.getElementById('finishDismiss');
const customMinutesInput = document.getElementById('customMinutes');
const customInputWrapper = document.querySelector('.custom-input-wrapper');
const historyToggleBtn  = document.getElementById('historyToggleBtn');
const historyPanel      = document.getElementById('historyPanel');
const historyCloseBtn   = document.getElementById('historyCloseBtn');
const historyBackdrop   = document.getElementById('historyBackdrop');
const historyList       = document.getElementById('historyList');
const historyClearBtn   = document.getElementById('historyClearBtn');
const langToggleBtn     = document.getElementById('langToggle');

// ── Speech ───────────────────────────────────────────────────────────────────

let cachedVoice = null;

function findVoice() {
  const lang = t().speechLang;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === lang) ||
    voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
    null
  );
}

function initVoice() {
  cachedVoice = findVoice();
  const warning = document.getElementById('voiceWarning');
  if (warning) warning.hidden = cachedVoice !== null;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', initVoice);
  initVoice(); // works synchronously on Firefox; async on Chrome
}

function speak(text) {
  if (!state.speechEnabled) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = t().speechLang;
  if (cachedVoice) utterance.voice = cachedVoice;
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

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

// ── UI helpers ────────────────────────────────────────────────────────────────

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
    statusLabel.textContent = t().statusSelect;
    startPauseBtn.textContent = t().btnStart;
    startPauseBtn.disabled = true;
  } else if (state.isRunning) {
    statusLabel.textContent = t().statusRunning;
    startPauseBtn.textContent = t().btnPause;
    startPauseBtn.disabled = false;
  } else if (state.remaining === state.duration) {
    statusLabel.textContent = t().statusReady;
    startPauseBtn.textContent = t().btnStart;
    startPauseBtn.disabled = false;
  } else {
    statusLabel.textContent = t().statusPaused;
    startPauseBtn.textContent = t().btnResume;
    startPauseBtn.disabled = false;
  }
}

// ── Language switching ────────────────────────────────────────────────────────

function applyLang(lang) {
  state.lang = lang;
  localStorage.setItem('timerLang', lang);
  document.documentElement.lang = lang;
  document.title = t().title;

  // Toggle button shows the opposite language code
  langToggleBtn.textContent = lang === 'vi' ? 'EN' : 'VI';

  // Header
  document.querySelector('h1').textContent = t().title;

  // History panel
  historyPanel.setAttribute('aria-label', t().historyAriaLabel);
  document.querySelector('.history-title').textContent = t().historyTitle;
  historyCloseBtn.setAttribute('aria-label', t().historyCloseLabel);
  historyList.setAttribute('aria-label', t().historyListAriaLabel);
  historyClearBtn.textContent = t().historyClear;

  // History toggle icon button
  historyToggleBtn.setAttribute('aria-label', t().historyToggleLabel);
  historyToggleBtn.setAttribute('title', t().historyToggleLabel);

  // Presets
  document.querySelector('.presets').setAttribute('aria-label', t().presetsAriaLabel);
  presetBtns.forEach(btn => {
    btn.textContent = `${btn.dataset.minutes} ${t().unitMin}`;
  });

  // Custom input
  customMinutesInput.placeholder = t().customPlaceholder;
  customMinutesInput.setAttribute('aria-label', t().customAriaLabel);
  document.querySelector('.custom-input-unit').textContent = t().unitMin;

  // Controls
  resetBtn.setAttribute('aria-label', t().resetLabel);
  resetBtn.setAttribute('title', t().resetLabel);
  document.querySelector('.voice-label').textContent = t().voiceLabel;

  // Voice warning (innerHTML because it may contain <strong>)
  document.getElementById('voiceWarning').innerHTML = t().voiceWarning;

  // Finish overlay
  document.querySelector('.finish-text').textContent = t().finishTitle;
  document.querySelector('.finish-sub').textContent = t().finishSub;
  finishDismiss.textContent = t().finishDismiss;
  finishOverlay.setAttribute('aria-label', t().finishAriaLabel);

  // Re-init voice for the new speech language
  initVoice();

  // Refresh dynamic UI
  renderUI();
  renderHistory();
}

langToggleBtn.addEventListener('click', () => {
  applyLang(state.lang === 'vi' ? 'en' : 'vi');
});

// ── History ───────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'timerHistory';
const HISTORY_MAX = 50;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function addHistoryEntry(duration) {
  const entry = { id: Date.now(), duration, startedAt: new Date().toISOString() };
  const entries = [entry, ...loadHistory()].slice(0, HISTORY_MAX);
  saveHistory(entries);
  renderHistory();
}

function clearHistory() {
  saveHistory([]);
  renderHistory();
}

function renderHistory() {
  const entries = loadHistory();
  if (entries.length === 0) {
    historyList.innerHTML = `<li class="history-empty">${t().historyEmpty}</li>`;
    return;
  }
  historyList.innerHTML = entries.map(e => {
    const mins = formatMinutes(e.duration);
    const d = new Date(e.startedAt);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `<li class="history-item" role="option"
              data-id="${e.id}" data-duration="${e.duration}"
              tabindex="0" aria-label="${mins} ${t().unitMin}, ${dd}/${mm} ${hh}:${mi}">
      <span class="history-duration">${mins} ${t().unitMin}</span>
      <span class="history-date">${dd}/${mm} ${hh}:${mi}</span>
    </li>`;
  }).join('');
}

// ── History panel ─────────────────────────────────────────────────────────────

function openHistory() {
  renderHistory();
  historyPanel.removeAttribute('hidden');
}

function closeHistory() {
  historyPanel.setAttribute('hidden', '');
}

function applyDuration(durationSeconds) {
  if (state.isRunning) stopTimer();
  state.duration = durationSeconds;
  state.remaining = durationSeconds;
  state.isFreshStart = true;

  presetBtns.forEach(b => b.classList.remove('active'));
  customMinutesInput.value = '';
  customInputWrapper.classList.remove('active');
  finishOverlay.classList.remove('visible');

  // Highlight a matching preset if one exists
  presetBtns.forEach(b => {
    if (parseInt(b.dataset.minutes, 10) * 60 === durationSeconds) {
      b.classList.add('active');
    }
  });

  renderUI();
}

historyToggleBtn.addEventListener('click', () => {
  if (historyPanel.hasAttribute('hidden')) {
    openHistory();
  } else {
    closeHistory();
  }
});

historyCloseBtn.addEventListener('click', closeHistory);
historyBackdrop.addEventListener('click', closeHistory);

historyClearBtn.addEventListener('click', clearHistory);

historyList.addEventListener('click', e => {
  const item = e.target.closest('.history-item');
  if (!item) return;
  const duration = parseInt(item.dataset.duration, 10);
  if (!duration) return;
  applyDuration(duration);
  closeHistory();
});

historyList.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const duration = parseInt(item.dataset.duration, 10);
    if (!duration) return;
    applyDuration(duration);
    closeHistory();
  }
});

// ── Custom input ──────────────────────────────────────────────────────────────

function applyCustomMinutes() {
  const raw = parseInt(customMinutesInput.value, 10);
  if (!raw || raw < 1) return;

  if (state.isRunning) stopTimer();
  state.duration = raw * 60;
  state.remaining = state.duration;
  state.isFreshStart = true;

  presetBtns.forEach(b => b.classList.remove('active'));
  customInputWrapper.classList.add('active');
  finishOverlay.classList.remove('visible');
  renderUI();
}

customMinutesInput.addEventListener('change', applyCustomMinutes);

customMinutesInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') applyCustomMinutes();
});

customMinutesInput.addEventListener('focus', () => {
  presetBtns.forEach(b => b.classList.remove('active'));
  customInputWrapper.classList.remove('active');
});

// ── Timer core ────────────────────────────────────────────────────────────────

function tick() {
  const prev = state.remaining;
  state.remaining = Math.max(0, state.remaining - 1);

  const text = getAnnouncement(prev, state.remaining, state.duration, state.lang);
  if (text) speak(text);

  renderUI();

  if (state.remaining === 0) {
    stopTimer();
    showFinish();
  }
}

function startTimer() {
  if (!state.duration || state.remaining === 0) return;

  if (state.isFreshStart) {
    speak(t().announceStart(formatMinutes(state.duration)));
    addHistoryEntry(state.duration);
    state.isFreshStart = false;
  }

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
  state.isFreshStart = state.duration > 0;
  finishOverlay.classList.remove('visible');
  renderUI();
}

function showFinish() {
  finishOverlay.classList.add('visible');
}

// ── Event listeners ───────────────────────────────────────────────────────────

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes, 10);
    applyDuration(minutes * 60);
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
applyLang(state.lang); // sets all UI strings, calls renderUI + renderHistory

// Initialise voice on first interaction (iOS requires this)
document.addEventListener('click', () => {
  if ('speechSynthesis' in window) {
    const dummy = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(dummy);
    window.speechSynthesis.cancel();
  }
}, { once: true });
