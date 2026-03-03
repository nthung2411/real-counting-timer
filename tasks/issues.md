# Issue Registry

## ISSUE-001 — PWA White Screen on Desktop Launch

| Field       | Value |
|-------------|-------|
| **Status**  | Fixed |
| **Date**    | 2026-03-03 |
| **Severity**| High (app unusable from desktop shortcut) |

### Symptom
Opening the installed PWA from the desktop icon shows a completely white screen. The OS title bar correctly displays "Đồng Hồ Đếm Ngược" (manifest loaded), but the page content is blank.
Opening from the browser directly works fine.

### Root Cause
The service worker's `fetch` handler used `caches.match(event.request)` for all request types, including navigation requests (mode: `navigate`). When Chrome launches a PWA standalone:
1. It sends a navigation request to `start_url` (`/`)
2. `caches.match` on the full navigation request can silently return no match
3. If the local dev server (`npx serve .`) is not running, `fetch()` throws a network error
4. The `respondWith` promise rejects → browser renders a blank white page

### Fix (`sw.js`)
- Bumped `CACHE_NAME` from `timer-v3` → `timer-v4` to force SW re-installation
- Added explicit handling for navigation requests: always look up `/index.html` directly from cache, with a `.catch()` fallback so the app shell loads even if `fetch()` rejects

```js
if (event.request.mode === 'navigate') {
  event.respondWith(
    caches.match('/index.html')
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
  return;
}
```

### How to Apply
After deploying the updated `sw.js`:
1. Open the app in Chrome once (with server running)
2. The new SW will install and cache all assets under `timer-v4`
3. Close and reopen from the desktop shortcut — app loads correctly even offline
