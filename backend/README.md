# HIrajewels — Backend (Express + MongoDB)

This folder contains the Express backend and Mongoose models for the API.

Local development
```
cd backend
npm install
# Ensure MONGODB_URI and other env vars are set
npm run dev
```

Environment variables (examples)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — port to run the server (default 4000)

Deployment
- Recommended deployer: Render, Fly, or any Node host. This repo contains a small `tools/ping-backend.js` script used for keep-alive pings when needed; Docker is intentionally removed.

Key files
- `index.js` — server entry
- `models/` — Mongoose schemas
- `routes/` — API routes

If you'd like automated `systemd`, `pm2` or Render service configuration examples, I can add them.
