# Đồng Hồ Đếm Ngược

A Progressive Web App (PWA) countdown timer with Vietnamese voice announcements. Works offline and can be installed as an app icon on any device.

---

## Features

### Timer durations
- Quick-select presets: **5, 15, 30, 60 minutes**
- Custom duration: type any number of minutes in the input field and press **Enter** or tab away

### Voice announcements (Vietnamese)
| Trigger | Announcement |
|---------|-------------|
| Timer starts (fresh) | "Bắt đầu tính thời gian cho X phút" |
| Every 5 minutes elapsed | "Đã qua X phút, còn Y phút" |
| Remaining ≤ 5 min — each whole minute | "Còn X phút" |
| Remaining = 60 s | "Còn 1 phút" |
| Remaining ≤ 59 s — every second | "Còn X giây" |
| Timer finishes | "Hết giờ!" |

> Resuming from pause does **not** repeat the start announcement.
> Voice can be toggled on/off with the speaker button in the controls.

### Timer history
- Every started timer session is saved to **localStorage** (up to 50 entries).
- Open the history panel with the **clock icon** in the header:
  - **Desktop**: slides open as a left sidebar
  - **Mobile**: appears as a bottom-sheet modal
- Tap any history entry to load that duration and get ready to start.
- Use **"Xóa tất cả"** to clear the list.

### PWA / offline support
- Install as a home screen app on iOS and Android.
- Service worker caches all assets — the timer works fully offline after the first load.

---

## Running locally

Requires Node.js (for `npx`) or any static file server.

```bash
# Clone / navigate to the project
cd real-counting-timer

# Start a local server (downloads serve if needed)
npx serve .
```

Open `http://localhost:3000` in your browser.

> The service worker and PWA install prompt require **HTTPS** or **localhost**.
> `npx serve` on localhost satisfies this requirement.

---

## Installing on devices

| Platform | Steps |
|----------|-------|
| **Android Chrome** | Address bar → install icon (⊕) → "Add to Home Screen" |
| **iOS Safari** | Share sheet (□↑) → "Add to Home Screen" |
| **Desktop Chrome / Edge** | Address bar → install icon → "Install" |

---

## Running tests

```bash
npm install        # first time only
npm test           # run all 40 unit tests (vitest)
npm run test:watch # watch mode during development
```

Tests cover all pure logic in `timer-logic.js`:
- `getAnnouncement` — all announcement conditions, full timer simulations
- `formatTime` — MM:SS formatting
- `formatMinutes` — seconds-to-minutes conversion

---

## Project structure

```
real-counting-timer/
├── index.html          # App shell
├── style.css           # Dark theme, ring, history panel, responsive layout
├── app.js              # Timer state, speech, history, UI
├── timer-logic.js      # Pure functions (no DOM) — imported by app.js and tests
├── timer-logic.test.js # 40 unit tests (Vitest)
├── sw.js               # Service worker — cache-first offline strategy
├── manifest.json       # PWA manifest with SVG icons
└── package.json        # devDependencies: vitest
```

---

## Tech stack

- **Pure HTML / CSS / JS** — no framework, no build step
- **Web Speech API** (`SpeechSynthesisUtterance`, `lang='vi-VN'`)
- **Service Worker** + **Web App Manifest** for PWA installability
- **localStorage** for history persistence
- **Vitest** for unit testing

---

## Voice quality note

Vietnamese TTS quality depends on the operating system:
- **Android** and **macOS / iOS** include native `vi-VN` voices with good quality.
- **Windows**: install the Vietnamese language pack via *Settings → Time & Language → Language & region → Add a language* to get a native voice. Without it, the browser may fall back to an English voice.
