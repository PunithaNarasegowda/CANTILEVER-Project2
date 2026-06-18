# 02 Task Management

Full-stack task management app with a motion-heavy interface inspired by the attached reference.

## Features

- User registration, login, and logout
- Create, read, update, and delete tasks
- Task filtering and sorting
- Responsive layout for mobile and desktop
- React frontend with curated motion and layered glass surfaces
- Express backend with MongoDB support and Firebase auth verification
- Demo fallback mode when Firebase or MongoDB credentials are not configured

## Stack

- Frontend: React, Vite, Framer Motion
- Backend: Node.js, Express.js
- Auth: Firebase Auth on the client, Firebase Admin on the server when configured
- Database: MongoDB with Mongoose, plus in-memory fallback for demo mode

## Setup

1. Copy `.env.example` to `.env` and fill in the Firebase and MongoDB values you want to use.
2. Install dependencies with `npm install` from the project root.
3. Start both apps with `npm run dev`.

## Deployment

1. Copy `.env.example` to `.env` and fill in the Firebase and MongoDB values you want to use.
2. Install dependencies with `npm install` from the project root.
3. Start both apps with `npm run dev`.

### CI / Hosting

This repo includes Dockerfiles for both `client` and `server` and a GitHub Actions workflow template at `.github/workflows/deploy.yml`.

Basics to deploy:

- Frontend: Vercel or Netlify (use the `client` folder when importing the repo). On Vercel set `VITE_API_BASE_URL` to your API domain and any `VITE_FIREBASE_*` vars.
- Backend: Render, Railway, Fly.io (use `server` service). Add `MONGODB_URI` and Firebase admin secrets as environment variables.

GitHub Actions
- The provided workflow builds Docker images and pushes them to GitHub Container Registry, deploys the frontend to Vercel (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets), and triggers a Render deploy if `RENDER_API_KEY` and `RENDER_SERVICE_ID` are set.

Secrets to configure in your repository settings for automatic deploys:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for frontend)
- `RENDER_API_KEY`, `RENDER_SERVICE_ID` (for backend deploy trigger)

If you prefer manual deploys, you can build the client and push static `dist/` to any static host and run the server on any Node host with the environment variables configured.

## Demo mode

If Firebase or MongoDB are left blank, the app still runs using local demo auth and in-memory task storage so you can preview the UI immediately.

## Project structure

- `client/` React app and UI
- `server/` Express API and storage layer

## API

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`