# Deployment Guide — Vercel (frontend) & Render (backend)

This repository contains a Next.js frontend (`frontend/`) and an Express backend (`backend/`). Below are concise, copy-paste steps to deploy the frontend to Vercel and the backend to Render.

Prerequisites
- A Git provider account (GitHub/GitLab/Bitbucket) and the repo pushed to a remote branch (e.g., `main`).
- Vercel account (for frontend)
- Render account (for backend)

Frontend — Vercel (recommended)
1. In Vercel, import your Git repository.
2. Set the root to the repository (auto-detects Next.js). If Vercel asks for a project path, set it to `frontend`.
3. In Project Settings → Environment Variables, add:
   - `NEXT_PUBLIC_API_URL` = `https://<your-backend-host>` (Render service URL)
4. Build & Output settings (Vercel usually fills automatically):
   - Build Command: `npm run build`
   - Install Command: `npm ci`
   - Output Directory: (leave empty for Next.js)
5. Deploy. Vercel will build and serve the app with the App Router.

Backend — Render
1. Create a new Web Service on Render.
2. Connect the same Git repository and select the `main` branch.
3. Set the Root Directory to `backend`.
4. Set the Build Command to: `npm ci`
5. Set the Start Command to: `npm start` (this runs `node index.js`)
6. Add environment variables in Render dashboard (same names used in `.env`):
   - `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_URL`, etc.

Notes & Best Practices
- Keep API base URL in `NEXT_PUBLIC_API_URL`. Set it to your Render backend URL in Vercel env vars.
- Make sure `backend/index.js` uses `process.env.PORT` (already supported).
- For production MongoDB, use a managed MongoDB Atlas URI.
- Protect secrets in the hosting provider's environment variable settings — do not commit `.env` files.

Troubleshooting
- If CORS errors occur, ensure backend allows the frontend origin, or keep `cors()` (currently allows all origins).
- If the frontend shows incorrect API URL, confirm `NEXT_PUBLIC_API_URL` in Vercel project settings and redeploy.

If you want, I can create a `vercel.json` with redirects/headers for the frontend. Tell me which features you'd like automated.

Keep Render service awake (optional)
1. Render can put free services to sleep after inactivity. To keep a backend service responsive, create a Render "Cron Job" that periodically pings the backend.
2. Add the ping script we included: `backend/tools/ping-backend.js`.
3. Create a new Cron Job on Render:
   - Connect the same Git repository and select the branch (e.g., `main`).
   - Command: `node backend/tools/ping-backend.js`
   - Schedule: `every 10 minutes` (or `every 15 minutes` depending on your needs).
   - Environment Variables: set `PING_URL` to `https://<your-backend>.onrender.com/` (or your backend URL).
   - Build/Runtime: Node 18+ is sufficient. The job runs the single script and exits.
4. The Cron Job will request the backend periodically and help avoid cold starts.

Note: this is a light-weight keep-alive ping for convenience. If your plan includes uptime guarantees, prefer the provider's paid plan instead of continuous pings.
