# Social Media Agent — Product Roadmap

This document outlines the remaining major features required to turn the Social Media Agent into a fully autonomous, production-ready product.

## Phase 1: Social Media Authentication (Completed ✅)
Without real authentication, the agent cannot publish content to actual social media accounts. We need to implement standard OAuth 2.0 flows.

- [x] **LinkedIn OAuth Flow**
  - Implement `/api/auth/linkedin` (Redirect to LinkedIn consent screen)
  - Implement `/api/auth/linkedin/callback` (Exchange code for token, fetch user profile)
  - Securely store the `access_token` and `user_id` in the `platform_tokens` database table.
  - Update Settings UI to trigger the flow and display the authenticated user.
- [x] **Instagram (Meta) OAuth Flow**
  - Implement `/api/auth/instagram` (Redirect to Facebook login)
  - Implement `/api/auth/instagram/callback` (Exchange code, fetch IG Business Account ID)
  - Securely store the `access_token` and `user_id` in the database.
  - Update Settings UI to trigger the flow and display the connected account.

## Phase 2: The Auto-Publishing Engine (Completed ✅)
Currently, content is scheduled in the database but lacks a trigger to actually publish it at the designated time.

- [x] **Cron Scheduler**
  - Create a Next.js `/api/cron` route designed to run every 15 minutes.
  - Query the database for `status = 'approved'` where `scheduled_date` and `scheduled_time` are in the past.
  - Trigger the `smartPublish` function for those posts.
  - Update the database status to `published` or `failed`.
  - Ensure compatibility with Vercel Cron or a similar cloud scheduler.

## Phase 3: Production Database Migration (Completed ✅)
The app currently uses `better-sqlite3`. While excellent for local development, Vercel's ephemeral filesystem will wipe an SQLite file on every deployment.

- [x] **Cloud Database Integration**
  - Migrate the data layer (`src/lib/db.js`) to support a cloud database.
  - Setup **Vercel Postgres** (or Supabase/Neon).
  - Use an ORM like Prisma or Drizzle for type-safe database migrations.
  - Ensure a seamless environment variable switch (e.g., `DATABASE_URL` instead of a local `.db` file path).

## Phase 4: Engagement Analytics (Completed ✅)
Close the feedback loop by bringing real-world metrics back into the dashboard.

- [x] **Analytics Sync Job**
  - Create a daily background job to query the LinkedIn and Instagram APIs for published posts.
  - Fetch Likes, Comments, Shares, and Impressions.
- [x] **Dashboard Visualization**
  - Update `src/app/page.js` to display engagement graphs and top-performing posts instead of just internal draft/approval stats.
