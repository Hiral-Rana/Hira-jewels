# HIrajewels — Frontend (Next.js)

This folder contains the Next.js + TypeScript frontend.

Local development
```
cd frontend
npm install
npm run dev
```

Environment variables (examples)
- `NEXT_PUBLIC_API_URL` — base URL of the backend API (e.g. https://api.example.com or http://localhost:4000)

Build & deploy
```
npm run build
npm run start
```

Deploy notes
- Recommended: deploy to Vercel. Make sure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables.
- No Docker required.

Key paths
- `app/` — Next.js app routes and pages
- `components/` — shared UI components
- `lib/` — helpers, env helpers, store

If you want me to add more detailed Vercel deployment steps or environment examples, tell me which provider you plan to use.
