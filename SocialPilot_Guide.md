# 📚 SocialPilot — Comprehensive Architecture Guide

This document is the "Everything You Need To Know" guide for the SocialPilot project. It explains exactly how the codebase is structured, how the AI generates content, how publishing works, and how to maintain the project.

---

## 🏗️ 1. High-Level Architecture

SocialPilot is a Next.js 16 (App Router) application. It operates on a **3-tier architecture**:

1. **Frontend (React Client Components):** Beautiful UI with Glassmorphism, built with vanilla CSS. It interacts entirely via Next.js API routes.
2. **Backend (Next.js API Routes):** Serverless functions that handle OAuth, database queries, and AI generation.
3. **Database Layer (Hybrid SQLite/Postgres):** Uses `better-sqlite3` for local development (storing files in `data/` folder) and **Neon Postgres** for production.

### Key Workflows:
- **Generation:** User inputs a "Gist" -> Backend calls **Groq API (LLaMA)** for text and **Pollinations AI** for images -> Saves to DB as `draft`.
- **Approval:** User edits post -> Clicks "Approve" -> Status changes to `approved` with a scheduled time.
- **Publishing:** GitHub Actions triggers a Cron route every 15 minutes -> API pulls approved posts due now -> Calls Facebook/Instagram Graph APIs -> Status becomes `published`.

---

## 📂 2. Folder Structure Explained

```text
src/
├── app/                      # Next.js App Router (Pages and APIs)
│   ├── api/                  # Backend Endpoints
│   │   ├── auth/             # Facebook & Instagram OAuth logic
│   │   ├── content/          # CRUD operations for Posts
│   │   ├── cron/             # Auto-Publishing and Analytics syncing endpoints
│   │   ├── generate/         # Endpoints calling Groq/Pollinations
│   │   └── publish/          # The core engine that pushes data to Meta APIs
│   ├── (pages)...            # React pages (compose, approve, calendar, settings, etc)
├── components/               # Reusable React components (Sidebar, Toast)
├── lib/                      # Core backend utilities
│   ├── ai/                   # AI SDK wrappers (text-generator.js, image-generator.js)
│   ├── platforms/            # Meta Graph API wrappers (facebook.js, instagram.js)
│   └── db.js                 # The hybrid SQLite/Postgres database adapter
└── ...                       # Configs (package.json, next.config, .env.local)
```

---

## 🧠 3. The AI Engine

### Text Generation (`src/lib/ai/text-generator.js`)
We use the **Groq API**, which provides lightning-fast inference for open-source models. 
- **Primary Model:** `llama-3.3-70b-versatile`
- **Fallback Models:** `llama-3.1-8b-instant` and `mixtral-8x7b-32768`. If the primary model hits a rate limit, the system automatically tries the next one.
- **Platform Splitting:** When asked to write for "both" platforms, the AI includes `=== FACEBOOK ===` and `=== INSTAGRAM ===` headers. Our backend parses these out so the platforms get separate, tailored texts.

### Image Generation (`src/lib/ai/image-generator.js`)
We use **Pollinations AI**. It provides high-quality images via simple URL parameters.
- **Avoiding Text:** AI image generators naturally try to put text on "social media graphics". We use a strong negative prompt (`negative=text, font, letters, typography`) and avoid the word "graphic" in the positive prompt to force clean images.

---

## ⚙️ 4. The Publishing Pipeline

This is the most complex part of the app. It's located in `src/app/api/publish/route.js`.

**How a post gets to Facebook/Instagram:**
1. A post ID is sent to `/api/publish`.
2. The system fetches the user's `facebookToken` and `instagramToken` from the database.
3. The platform headers (`=== FACEBOOK ===`) are stripped so the raw text is clean.
4. **For Facebook:** It calls `https://graph.facebook.com/v19.0/{page_id}/photos` (if an image exists) or `/feed` (if text only).
5. **For Instagram:** Instagram publishing is a 2-step process. 
   - First, it creates a "Media Container" by sending the image URL to the API.
   - It polls the API until the container is processed by Meta.
   - Second, it triggers the "Publish" endpoint using that container ID.

---

## ⏰ 5. Auto-Publishing (The Cron System)

Because Vercel's free tier only allows "Daily" cron jobs, posts wouldn't publish at their exact scheduled times. 

**The Solution:**
We rely on **GitHub Actions** (`.github/workflows/auto-publish.yml`). 
1. Every 15 minutes, GitHub runs a tiny script that hits `https://your-domain.vercel.app/api/cron`.
2. The cron route checks the database for any `approved` posts where the scheduled time is ≤ the current time.
3. If it finds one, it loops through and triggers `/api/publish` for each.
4. (We also have a daily analytics cron that fetches live likes/comments).

---

## 🗄️ 6. Database Schema (`src/lib/db.js`)

The database automatically configures itself on boot. There are two main tables:

1. **`posts`**: Stores all generated content.
   - Key fields: `status` (draft, approved, published, failed), `platform`, `written_content`, `image_path`, `scheduled_date`, `scheduled_time`, `facebook_post_id`, `instagram_post_id`.
   - Analytics fields: `likes`, `comments`, `shares`, `impressions`.
2. **`platform_tokens`**: Stores OAuth data.
   - Stores long-lived access tokens from Meta and the associated Page IDs.

---

## 🔑 7. Setting Up Meta/Facebook Credentials

To make this app work, you must create an App in the **Meta Developer Portal**.

1. Create a "Business" app.
2. Add the **Facebook Login for Business** product.
3. Add these Redirect URIs:
   - `https://your-domain.vercel.app/api/auth/facebook/callback`
   - `https://your-domain.vercel.app/api/auth/instagram/callback`
4. Copy the App ID and Secret to Vercel environment variables.
5. In Meta Business Settings, go to your Business Portfolio -> Users -> Assign yourself "Full Control" of the App.

---

## 🐛 8. Troubleshooting / Common Issues

- **Images have garbled text on them:** The AI generation prompt might be using words like "poster" or "flyer". Try to use simpler visual descriptions without mentioning text.
- **"Unknown Error" when publishing:** Check your Vercel Logs. Usually, this means your Facebook Page Access Token expired, or your Instagram account isn't properly linked to your Facebook Page in Meta Business Suite.
- **Posts aren't auto-publishing:** Ensure your GitHub Actions workflow (`auto-publish.yml`) is enabled and running. Also verify `CRON_SECRET` matches between GitHub Secrets and Vercel Env Vars.
- **OAuth Callback failing on localhost:** Ensure `NEXT_PUBLIC_APP_URL` in `.env.local` is exactly `http://localhost:3000` with **no trailing slash**.
