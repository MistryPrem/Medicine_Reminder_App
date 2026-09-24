# Zero-Cost Production Deployment Guide ($0/Month)

This guide documents the exact architecture and zero-cost steps to deploy the Elderly Medicine Reminder & Caregiver Notification System with zero monthly cloud bills.

---

## 1. Architecture Overview ($0 Total)

| Component | Free Platform | Tier / Limitations | Mitigation / Strategy |
| :--- | :--- | :--- | :--- |
| **Backend API** | [Render](https://render.com) or [Koyeb](https://koyeb.com) | Free web service (spins down after 15m inactivity) | External free cron ping via Cron-Job.org / UptimeRobot hitting `/api/v1/jobs/reconcile` every 10 min |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | M0 Sandbox Free Tier (512 MB storage, shared RAM) | `maxPoolSize: 10`, index optimizations, TTL index on tokens |
| **Web Frontend** | [Cloudflare Pages](https://pages.cloudflare.com) or [Vercel](https://vercel.com) | Unlimited bandwidth / Static Free Tier | SPA routing redirect rule (`/* /index.html 200`) |
| **Push Notifications** | [Firebase Cloud Messaging](https://firebase.google.com) | Free Spark Plan (unlimited push notifications) | FCM multicast dispatcher with server key and dead-token pruning |
| **Keep-Alive Cron** | [Cron-Job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com) | 100% Free monitoring / scheduled pings | Pings `/api/v1/jobs/reconcile` every 10 minutes |

---

## 2. Step 1: Database Setup (MongoDB Atlas Free M0)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared M0 Cluster** (Select AWS or GCP, closest region).
3. Under **Database Access**, create a user with `Read and write to any database` permissions (e.g. `medreminder_user`).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) to permit Render/Koyeb connections.
5. Copy your connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/med_reminder?retryWrites=true&w=majority
   ```

---

## 3. Step 2: Backend Deployment (Render Free Web Service)

1. Create a free account at [render.com](https://render.com).
2. Click **New +** -> **Web Service** and connect your GitHub repository: `https://github.com/MistryPrem/Medicine_Reminder_App.git`.
3. Configure settings:
   - **Name**: `medicine-reminder-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add the following **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_ACCESS_SECRET`: `<Generate with: openssl rand -base64 32>`
   - `JWT_REFRESH_SECRET`: `<Generate with: openssl rand -base64 32>`
   - `JWT_ACCESS_EXPIRY`: `15m`
   - `JWT_REFRESH_EXPIRY`: `7d`
   - `CLIENT_URL`: `https://<your-web-app>.pages.dev`
   - `FIREBASE_PROJECT_ID`: `<optional-fcm-project-id>`
   - `FIREBASE_CLIENT_EMAIL`: `<optional-fcm-service-account-email>`
   - `FIREBASE_PRIVATE_KEY`: `<optional-fcm-private-key>`
5. Click **Create Web Service**. Note the deployed URL (e.g., `https://medicine-reminder-api.onrender.com`).

---

## 4. Step 3: Web App Deployment (Cloudflare Pages)

1. Create a free account at [cloudflare.com](https://cloudflare.com) and navigate to **Workers & Pages** -> **Pages**.
2. Connect your GitHub repository: `MistryPrem/Medicine_Reminder_App`.
3. Set build configuration:
   - **Framework preset**: `Vite`
   - **Root directory**: `web`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://medicine-reminder-api.onrender.com/api/v1`
5. Create a `_redirects` file in `web/public/_redirects` (or Cloudflare SPA redirect):
   ```
   /*    /index.html   200
   ```
6. Deploy! Your caregiver dashboard is live at zero cost.

---

## 5. Step 4: Keep-Alive Cron Configuration (Cron-Job.org)

Because Render free tier instances spin down after 15 minutes of inactivity, prevent sleeping and ensure background dose reconciliation:

1. Register at [cron-job.org](https://cron-job.org) (100% Free).
2. Create a new cron job:
   - **Title**: `MedReminder Keep-Alive & Reconciliation`
   - **URL**: `https://medicine-reminder-api.onrender.com/api/v1/jobs/reconcile`
   - **Schedule**: Every `10 minutes` (`*/10 * * * *`)
   - **Request Method**: `GET`
3. Save. This ping keeps the backend active and runs reconciliation cycles automatically.

---

## 6. Step 5: Android Mobile App Build (React Native)

1. Update `mobile/src/services/api.ts` with your production API URL:
   ```typescript
   const DEFAULT_HOST = __DEV__
     ? (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')
     : 'https://medicine-reminder-api.onrender.com';
   ```
2. Build release APK for testing or senior device side-loading:
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```
3. The generated standalone APK is located at:
   `mobile/android/app/build/outputs/apk/release/app-release.apk`
