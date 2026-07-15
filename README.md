# Cymor Video Generator

Text-to-video generator built by Cymor Tech Services, powered by the Magic Hour API.
Type a scene description, watch it "develop," download the finished clip.

Stack: Node.js + Express backend, single-file vanilla HTML/CSS/JS frontend. No build tools, no database — matches the rest of the Cymor stack and is fine for low-traffic use (a handful of renders a day).

---

## 1. Get your Magic Hour API key

1. Go to **https://magichour.ai/developer** and sign up (no credit card required).
2. Once logged in, find the **API Keys** section of your dashboard and click **Create API Key**.
3. Copy the key immediately — it's only shown once.
4. New accounts get free credits automatically, usable across all Magic Hour API endpoints (including text-to-video).

Full API docs, if you ever need them: **https://docs.magichour.ai**

---

## 2. Configure the project

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and paste in your key:

```
MAGIC_HOUR_API_KEY=your_real_key_here
MAGIC_HOUR_MODEL=kling-3.0
PORT=3000
```

`MAGIC_HOUR_MODEL` controls which video model renders your clips. `kling-3.0` is a solid quality default, but it costs more credits per render. If you want to stretch your free credits further, check **https://docs.magichour.ai/api-reference/video-projects/text-to-video** for the current list of supported model names and swap this value — no code changes needed.

---

## 3. Run it locally

```bash
npm install
npm start
```

Visit `http://localhost:3000`.

---

## 4. Deploy to Render

1. Push this folder to a GitHub repo.
2. In Render, create a **New Web Service** from that repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
4. Under **Environment > Environment Variables**, add:
   - `MAGIC_HOUR_API_KEY` → your key
   - `MAGIC_HOUR_MODEL` → `kling-3.0` (or whichever model you picked)
5. Deploy. Render assigns `PORT` automatically — the app already reads `process.env.PORT`, so you don't need to set it.

---

## How it works

- `POST /api/generate` — your server calls `POST https://api.magichour.ai/v1/text-to-video` with the prompt, aspect ratio, duration, and model. Magic Hour returns a project `id` right away and starts rendering in the background.
- The frontend polls `GET /api/status/:id` every 4 seconds, which proxies `GET https://api.magichour.ai/v1/video-projects/:id`. Status moves through `queued` → `rendering` → `complete` (or `error`).
- While waiting, the frontend shows a full-screen "developing" overlay (safelight-red darkroom theme) with a live timer and progress bar, so people stick around instead of bouncing.
- On `complete`, the video plays in a "ready" overlay with a download button. Magic Hour's download URLs expire after 24 hours, so tell users to save the file if they want to keep it.

Typical render time: roughly 5–6 minutes for a 5-second clip, longer for 10 seconds — this is Magic Hour's own estimate, not something this app controls.

## Notes

- No accounts, database, or auth — fine for a handful of daily users. If usage grows, add basic rate limiting and maybe swap the in-memory polling for Magic Hour's webhook option (documented at docs.magichour.ai) so you're not polling at all.
- Your `MAGIC_HOUR_API_KEY` never reaches the browser — all Magic Hour calls happen server-side in `server.js`.
