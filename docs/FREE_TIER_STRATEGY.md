# $0 Free-Tier Deployment Strategy & Mitigations

This system is architected to run on genuine $0/month free-tier infrastructure while remaining robust, secure, and production-ready.

## Free Infrastructure Topology

| Tier / Role | Provider | Free Allowance | Inherent Limitation | System Mitigation |
|---|---|---|---|---|
| **API Backend** | Render / Koyeb | 750 free instance hrs/month | Spins down after 15m of inactivity | External cron heartbeat ping + Lazy reconciliation on startup/requests |
| **Database** | MongoDB Atlas M0 | 512 MB storage, 500 connections | 512 MB cap | Lean data design, capped audit logs, connection pool limit (10) |
| **Web Frontend** | Cloudflare Pages / Vercel | Unlimited bandwidth, 500 builds/mo | Static SPA hosting only | Pure React SPA with client-side routing & token refresh interceptor |
| **Push Notifications**| Firebase FCM | Unlimited push messages (Spark Plan)| Subject to Google daily quotas | Idempotent dispatch keys, dead token pruning on HTTP 404/410 |
| **Keep-Alive Cron** | Cron-Job.org / UptimeRobot | 50 checks at 5-minute intervals | None (Free forever) | External ping to `/health` and `/api/v1/jobs/reconcile` |
| **CI/CD** | GitHub Actions | 2,000 minutes/month | Concurrent build limits | Fast matrix caching of `node_modules` |

## Handling Backend Sleeping Instances (Triple-Shield)

```text
                  Shield 1: Free External Heartbeat
               (UptimeRobot / Cron-Job.org every 10 min)
                                  |
                                  v
                        [ Wakes / Keeps Alive ]
                                  |
                                  v
+--------------------------------------------------------------------+
| Backend Service (Render / Koyeb)                                   |
|                                                                    |
|  Shield 2: Startup & Request-Triggered Lazy Reconciliation         |
|  - When server wakes or /health /api/v1/doses/today is requested:  |
|    1. Query all doses where:                                       |
|       scheduledFor <= now AND status == 'scheduled'                |
|    2. Transition to 'reminder_sent' & dispatch alerts              |
|    3. Query all doses where:                                       |
|       overdueThresholdAt <= now AND status in                      |
|       ['scheduled', 'reminder_sent', 'snoozed']                    |
|    4. Transition to 'missed' & escalate to Caregiver               |
+--------------------------------------------------------------------+
                                  |
                                  v
                  Shield 3: Local Mobile Alarms
     - React Native schedules local device alarms directly in the OS
     - Prompts the senior even if the server is asleep and phone is offline
```
