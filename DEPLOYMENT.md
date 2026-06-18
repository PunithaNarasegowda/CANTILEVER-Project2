# Deployment Guide

This guide walks you through deploying the Task Management app to production with real Firebase auth and MongoDB storage.

## Option 1: Local Testing with Demo Mode (Recommended First Step)

The app works out-of-the-box in **demo mode** with the current `.env`:
- In-memory task storage (data lost on server restart)
- Browser-local demo auth (stored in localStorage)

This is perfect for testing the UI and workflows before setting up real services.

**Current status:** Frontend at `http://localhost:5173`, Backend at `http://localhost:4000/api`.

---

## Option 2: Full Production Setup

### Step 1: Create a MongoDB Atlas Cluster (Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in.
3. Click **Create** → **Build a Database** → select **Free Tier** (M0).
4. Choose a region closest to you.
5. Create a database user:
   - Go to **Database Access**
   - Click **Add New Database User**
   - Username: `taskflow-user` (or your choice)
   - Password: Generate a strong password and copy it
   - Permissions: **Read and write to any database**
   - Click **Add User**
6. Allow network access:
   - Go to **Network Access**
   - Click **Add IP Address**
   - Select **Allow Access from Anywhere** (set to 0.0.0.0/0 for testing; restrict to your host IPs in production)
   - Click **Confirm**
7. Get the connection string:
   - Click **Databases** → your cluster → **Connect**
   - Choose **Drivers** → **Node.js**
   - Copy the connection string:
     ```
     mongodb+srv://taskflow-user:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and `taskflow` with your DB name.

### Step 2: Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Create a project**.
3. Name: `taskflow-app` (or your choice).
4. Enable Google Analytics (optional).
5. Wait for the project to be created.
6. Go to **Authentication** → **Sign-in method** → **Email/Password** → enable it.
7. Create a service account (for server):
   - Go to **Project Settings** (gear icon).
   - Click **Service Accounts** tab.
   - Click **Generate New Private Key**.
   - A JSON file downloads. Open it and copy:
     - `project_id`
     - `client_email`
     - `private_key` (entire key, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
8. Get client config (for frontend, optional for demo mode):
   - Go to **Project Settings** → **General**.
   - Under "Your apps" or "SDK setup and configuration", copy:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `appId`

### Step 3: Wire Environment Variables Locally

Update `.env` with your actual values:

```bash
MONGODB_URI=mongodb+srv://taskflow-user:<your-password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**Important:** When pasting the `FIREBASE_PRIVATE_KEY`, replace actual newlines with `\n` (two characters). Example:
```
-----BEGIN PRIVATE KEY-----
MIIEv...
-----END PRIVATE KEY-----
```
becomes:
```
"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

### Step 4: Test Locally

Restart the dev servers:
```bash
# Kill the current servers (Ctrl+C in the terminal)
# Then:
npm run dev
```

- Visit `http://localhost:5173` and sign up/login with Firebase.
- Create a task. Refresh the page — it should persist (stored in MongoDB).

---

## Deploy to Production (Vercel + Render)

### Deploy Backend to Render

1. Go to https://render.com
2. Sign up or log in with GitHub.
3. Click **New** → **Web Service**.
4. Connect your GitHub repository.
5. Configure:
   - **Name:** `taskflow-api`
   - **Root Directory:** `server`
   - **Build Command:** `npm install` (or leave blank; Render defaults to npm)
   - **Start Command:** `npm start`
   - **Plan:** Free (or Paid if you prefer)
6. Add environment variables (click **Add Environment Variable** for each):
   - `PORT`: `4000`
   - `MONGODB_URI`: (paste your MongoDB Atlas connection string)
   - `FIREBASE_PROJECT_ID`: (from Firebase service account)
   - `FIREBASE_CLIENT_EMAIL`: (from Firebase service account)
   - `FIREBASE_PRIVATE_KEY`: (paste the private key with `\n` escapes)
7. Click **Create Web Service**.
8. Wait for deployment (~2-3 min). Copy the **API URL** (e.g., `https://taskflow-api.onrender.com`).

### Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up or log in with GitHub.
3. Click **New Project** → select your repository.
4. Configure:
   - **Framework:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL`: `https://taskflow-api.onrender.com/api` (use your Render API URL)
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`: (from Firebase client config)
6. Click **Deploy**.
7. Wait for deployment (~1-2 min). Your app is live!

---

## Automated Deployments (GitHub Actions)

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that automates deployments on push to `main`. To enable it:

1. Go to your GitHub repository.
2. Click **Settings** → **Secrets and variables** → **Actions**.
3. Add secrets for Vercel:
   - `VERCEL_TOKEN`: Go to https://vercel.com/account/tokens, create a token, and paste it.
   - `VERCEL_ORG_ID`: From Vercel dashboard, go to **Settings** → copy your **Org ID**.
   - `VERCEL_PROJECT_ID`: From your Vercel project, **Settings** → copy **Project ID**.
4. Add secrets for Render (optional, to trigger automatic redeploys):
   - `RENDER_API_KEY`: https://dashboard.render.com/account/api-tokens
   - `RENDER_SERVICE_ID`: From Render, your service details page, copy the **Service ID**.
5. Push to `main` — the workflow will build and deploy automatically.

---

## Troubleshooting

**"Invalid credentials" on auth login**
- Verify Firebase is enabled on server and client config is correct.
- Check that the Firebase service account JSON was copied correctly.

**"MongoDB connection failed"**
- Verify the connection string is correct.
- Check that your IP is whitelisted in MongoDB Atlas Network Access.
- Ensure the database user password is URL-encoded (special chars like `@` become `%40`).

**Tasks not persisting**
- If using demo mode, data is in-memory and lost on restart.
- If using MongoDB, check logs on Render or local terminal for connection errors.

**Frontend can't reach API**
- Verify `VITE_API_BASE_URL` matches your backend URL.
- Check browser console for CORS errors.
- Ensure backend is running and `/api/health` returns `{ ok: true }`.

---

## Quick Checklist

- [ ] Create MongoDB Atlas cluster and copy connection string
- [ ] Create Firebase project and download service account JSON
- [ ] Update `.env` with credentials
- [ ] Test locally: `npm run dev`
- [ ] Create Render service for backend
- [ ] Create Vercel project for frontend
- [ ] Set environment variables on both platforms
- [ ] Deploy and test: sign up, create a task, refresh page
- [ ] (Optional) Set up GitHub Actions secrets for automated deploys

---

## Support

- MongoDB Atlas docs: https://docs.atlas.mongodb.com
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
