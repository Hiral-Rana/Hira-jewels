HIrajewels — Monorepo
======================

Project HIrajewels is a small e‑commerce app with a Next.js + TypeScript frontend and an Express + MongoDB backend.

Quick links
- Frontend: frontend/
- Backend: backend/

Features
- Catalog, product pages, search and horizontal product sections
- Cart & wishlist persisted in localStorage (Zustand)
- Checkout flow (server-side order creation)
- Admin area for orders/products/custom orders
- Image caching, accessible UI primitives, and Tailwind styling

Tech stack
- Frontend: Next.js 13+, React 18+, TypeScript, Tailwind CSS
- Backend: Node.js + Express, Mongoose (MongoDB)
- Store: Zustand persisted to localStorage

No Docker
- This repo no longer contains Docker configuration. Deploy the frontend to Vercel and the backend to Render (or your chosen host).

Quick start (development)

Prerequisites
- Node 18+ and npm/yarn installed
- MongoDB connection available for backend (local or hosted)

Start backend
```
cd backend
npm install
# Set environment variables (see backend/README.md)
npm run dev
```

Start frontend
```
cd frontend
npm install
# Set environment variables (see frontend/README.md)
npm run dev
```

Environments & important files
- frontend/.env or Vercel environment variables: NEXT_PUBLIC_API_URL (backend base URL), other keys in frontend/lib/env.ts
- backend/.env or Render environment variables: MONGODB_URI, JWT_SECRET, STRIPE_* (if used), other keys in backend/index.js / backend/env helper
- Frontend app entry: frontend/app/
- Backend entry: backend/index.js

Keep-alive (Render)
- A small ping script exists at backend/tools/ping-backend.js to keep Render instances awake if used; this repo intentionally avoids Docker.

Contributing
- Fixes and features welcome. Create PRs against the main branch and include a short description of changes and local run instructions.

If you need help running the project locally or want the README to include more deployment examples (Vercel, Render), ask and I'll expand it.
