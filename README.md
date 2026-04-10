# Playlist Notes

 - Annotate any Spotify playlist track-by-track and share a live read-only link with anyone.
 - Hosted at: https://playlist-notes-by-sj.vercel.app/
 - Project Demo: https://drive.google.com/drive/folders/17fFGO4OEoi8H1-H9XvVqhg2jaOJFmMp_?usp=sharing

### Disclaimer
Due to the current spotify api rules, the app works only if logged in by users approved by the host account. The playlist-share links can be accessed by anyone. To make a new playlist annotation, user needs to be approved.

---

## What it does

1. **Connect** your Spotify account (read-only OAuth)
2. **Paste** any public or private playlist URL
3. **Annotate** each track with notes — auto-saved as you type
4. **Share** the read-only link with anyone — they see your notes live with no login required

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| State | Context API |
| Database | Firebase Firestore |
| Auth | Spotify PKCE OAuth |
| Music data | Spotify Web API |
| Deployment | Vercel |

---

## Routes

| Path | View | Description |
|---|---|---|
| `/` | Home | Connect Spotify, paste playlist URL, create session |
| `/edit/:sessionId` | Editor | Add and edit notes per track, view share link |
| `/view/:sessionId` | Receiver | Read-only, live-updating via Firestore |

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/your-username/playlist-notes.git
cd playlist-notes
npm install
```

### 2. Create a Spotify app

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Under **Settings → Redirect URIs**, add:
   ```
   http://{your ipconfig}:5173/
   ```
4. Copy your **Client ID**

> Note: Only the Client ID is needed. The PKCE flow never uses the Client Secret.

### 3. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project and enable **Firestore Database** (start in test mode)
3. Register a **Web app** and copy the config values

### 4. Set environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
# Spotify — Client ID only, no secret needed (PKCE flow)
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id

# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Run

```bash
npm run dev
```

---

## Deployment (Vercel)

### 1. Push to GitHub and import into Vercel

Vercel auto-detects Vite — no build configuration needed beyond `vercel.json`.

### 2. Add environment variables

In **Vercel → Project Settings → Environment Variables**, add all variables from your `.env`. The `VITE_SPOTIFY_CLIENT_ID` is safe to expose publicly — it is a client identifier, not a secret.

### 3. Add your Vercel URL to Spotify

In your Spotify app under **Settings → Redirect URIs**, add:

```
https://your-app.vercel.app/
```

The trailing slash is required. Add `http://localhost:5173/` for local dev too.

### 4. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### 5. Disable Vercel Authentication

In **Vercel → Project → Settings → Deployment Protection**, turn off **Vercel Authentication** — otherwise share links will prompt receivers to log into Vercel before they can view anything.

---

## Project structure

```
playlist-notes/
├── src/
│   ├── components/
│   │   ├── PlaylistHeader.tsx   # Cover art, title, track count
│   │   ├── PlaylistView.tsx     # Search filter, progress pill, track list
│   │   └── TrackRow.tsx         # Track info + Spotify embed preview + note field
│   ├── context/
│   │   └── PlaylistContext.tsx  # Session state, optimistic updates, debounced saves
│   ├── pages/
│   │   ├── Home.tsx             # Spotify OAuth connect + playlist URL input
│   │   ├── EditorView.tsx       # /edit/:sessionId — sender view
│   │   ├── ReceiverView.tsx     # /view/:sessionId — read-only view
│   │   └── NotFound.tsx         # 404
│   ├── services/
│   │   ├── spotifyAuth.ts       # PKCE OAuth flow, token storage in localStorage
│   │   ├── spotify.ts           # Spotify API calls + pagination
│   │   └── firestore.ts         # Session CRUD + real-time subscription
│   ├── types.ts                 # Shared interfaces — Track, Session, Spotify API shapes
│   └── firebase.ts              # Firebase initialisation
├── firestore.rules              # Production Firestore security rules
├── vercel.json                  # SPA rewrite rules
└── .env.example                 # Environment variable template
```

---
