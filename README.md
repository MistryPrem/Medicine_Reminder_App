# Elderly Medicine Reminder & Caregiver Notification System

A production-quality, accessible medication scheduling, dose monitoring, and escalation platform designed for elderly users and their caregivers. Architected to run at **$0/month on free-tier infrastructure**.

---

## Language & File Extension Rules (Strict)

- **Backend**: Node.js & Express in **JavaScript (`.js` files only)**. No TypeScript in backend.
- **Web App**: React SPA in **TypeScript (`.tsx` for components/pages, `.ts` for utilities/types/services)**.
- **Mobile App**: React Native CLI in **TypeScript (`.tsx` for screens/components, `.ts` for utilities/types/services)**.

---

## Directory Structure

```text
e:/Medicine_Reminder/
├── .github/workflows/        # Automated CI workflows (GitHub Actions)
├── backend/                  # Node.js + Express API (JavaScript .js only)
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── .eslintrc.json
│   └── package.json
├── web/                      # React Web App (TypeScript .tsx / .ts)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── mobile/                   # React Native CLI (TypeScript .tsx / .ts)
│   ├── src/
│   ├── App.tsx
│   ├── index.js
│   ├── package.json
│   └── tsconfig.json
├── docs/                     # Architecture, Free-Tier, and API Documentation
│   └── FREE_TIER_STRATEGY.md
├── .gitignore
├── package.json
└── README.md
```

---

## Free-Tier Deployment Targets ($0/month)

- **Backend API**: Render Free Web Service / Koyeb Eco Free Tier
- **Database**: MongoDB Atlas M0 Shared Cluster (Free 512 MB)
- **Web Application**: Cloudflare Pages / Vercel Hobby
- **Push Notifications**: Firebase Cloud Messaging (Spark Plan - Free)
- **CI/CD**: GitHub Actions (Free 2,000 min/month)
- **External Heartbeat**: Cron-Job.org / UptimeRobot (Free keep-alive pings)

---

## Quickstart

### 1. Backend Setup
```bash
cd backend
npm install
npm run lint
npm start
```
Verify health check at: `http://localhost:5000/health`

### 2. React Web Setup
```bash
cd web
npm install
npm run type-check
npm run dev
```
Access client at: `http://localhost:5173`
