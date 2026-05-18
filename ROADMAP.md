# Social Media Agent — Product Roadmap

This document outlines the major development phases of the Social Media Agent.

## Phase 1: Social Media Authentication ✅

- [x] **Facebook OAuth Flow** — `/api/auth/facebook` + `/api/auth/facebook/callback`
- [x] **Instagram (Meta) OAuth Flow** — `/api/auth/instagram` + callback
- [x] Securely store `access_token` and `user_id` in `platform_tokens` table
- [x] Settings UI with live connection status indicators

## Phase 2: Auto-Publishing Engine ✅

- [x] **Cron Scheduler** (`/api/cron`) — Runs every 15 minutes
- [x] Publishes `approved` posts whose scheduled time has passed
- [x] Updates status to `published` or `failed`
- [x] Compatible with Vercel Cron

## Phase 3: Production Database Migration ✅

- [x] Hybrid data layer (`src/lib/db.js`) — SQLite local, Postgres production
- [x] Connected to **Neon Postgres** via `DATABASE_URL`
- [x] Automatic table creation and migration

## Phase 4: Engagement Analytics ✅

- [x] **Analytics Sync Job** (`/api/cron/analytics`) — Daily
- [x] Fetches Likes, Comments, Shares, Impressions from Facebook & Instagram APIs
- [x] Dashboard displays engagement stats

## Phase 5: AI Migration — Gemini → Groq + Pollinations ✅

- [x] Replaced Google Gemini SDK with **Groq SDK** (LLaMA 3.3 70B)
- [x] 3-model fallback chain: `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `mixtral-8x7b-32768`
- [x] Replaced Google Imagen with **Pollinations AI** (Flux model)
- [x] Added negative prompts to prevent text/watermark artifacts in images
- [x] Added token usage logging for debugging API consumption
- [x] Removed all `@google/genai` SDK dependencies from AI generators

## Phase 6: Dashboard Enhancements ✅

- [x] Published / Unpublished tab filtering on dashboard
- [x] Posts sorted by creation date descending
- [x] Post cards show "View" for published, "Edit" for drafts
