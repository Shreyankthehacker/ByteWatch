# ByteWatch — Frontend

A React + Vite frontend for the ByteWatch video streaming platform, built to talk
directly to an existing Spring Boot backend at `http://localhost:8080`. No mock
backend, no mock data — every video, auth, and playback request goes to the real API.

## Getting started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Make sure your Spring Boot backend is
running on `http://localhost:8080` and that CORS allows `http://localhost:5173`.

Configure the backend origin in `.env`:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Architecture

```
src/
├── main.jsx              Entry point — wraps App in BrowserRouter + AuthProvider
├── App.jsx                Route table
├── components/
│   ├── Navbar.jsx          Top nav, reflects auth state
│   ├── VideoCard.jsx       Shared card for public/my videos grids
│   ├── HLSPlayer.jsx       hls.js player — attaches JWT to every request
│   ├── ProtectedRoute.jsx  Redirects unauthenticated users to /login
│   ├── Loading.jsx         Spinner + card skeletons
│   └── ErrorMessage.jsx    Reusable error state with retry
├── pages/                  One file per route (see App.jsx)
├── services/
│   ├── api.js              Shared axios instance + auth header interceptor
│   ├── authService.js      login/register/logout/token helpers
│   └── videoService.js     ALL video + HLS endpoint strings live here
├── context/
│   └── AuthContext.jsx     App-wide auth state (user, token, login, logout)
└── utils/
    ├── jwt.js               Decode JWT payload / check expiration (no signature verification)
    └── errors.js             Turns axios errors into friendly messages
```

### Why authenticated HLS needs hls.js

The backend requires `Authorization: Bearer <token>` on the master playlist,
quality playlists, *and* every `.ts` segment. A plain `<video src="...">` cannot
attach custom headers, so `HLSPlayer.jsx` always loads streams through `hls.js`
using `xhrSetup`, which runs on every request hls.js makes:

```js
const hls = new Hls({
  xhrSetup: (xhr) => {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  },
});
hls.loadSource(videoService.getMasterPlaylistUrl(videoId));
hls.attachMedia(video);
```

Safari's native HLS support has no equivalent hook, so on Safari the player
shows an explicit message rather than silently failing to authenticate.

### Adjusting to the real backend

Endpoint paths were assumed based on the brief and may not match the backend
exactly. Every endpoint string lives in one of two files:

- `src/services/authService.js` — `/auth/login`, `/auth/register`
- `src/services/videoService.js` — all `/api/videos/...` and HLS paths

Change the constants at the top of those files; nothing else in the app
hardcodes a URL.

### Auth flow

- JWT is stored in `localStorage` under the `token` key.
- `api.js` attaches `Authorization: Bearer <token>` to every request except
  `/auth/login` and `/auth/register`.
- A `401` response from any endpoint (including HLS requests) clears the
  token and — for video playback — redirects to `/login`, then back to the
  video after a successful login (`ProtectedRoute` and `HLSPlayer` both pass
  `state.from`).
- `/watch/:videoId` is intentionally public at the route level (public videos
  should be watchable without an account); the player itself shows a clear
  "login required" state if the backend rejects the HLS request.

## Extending

The service/context split is meant to make new features (likes, comments,
watch history, playlists, subscriptions, live streaming) additive: add a new
service file or new functions to `videoService.js`, a new page, and a route —
no changes needed to the auth or player internals.
