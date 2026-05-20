# 🤖 SocialAgent - Social Media Agent

An autonomous, AI-powered social media manager built with Next.js. The agent handles content generation, visual assets, intelligent scheduling, automated publishing, and engagement tracking across **Facebook** and **Instagram**.

**Live Demo:** [https://socialagent18.vercel.app](https://socialagent18.vercel.app)

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-orange)
![Database](https://img.shields.io/badge/Database-Neon%20Postgres-blue)

---

## ✨ Features

- **AI Content Engine**: Generate platform-specific written content using **Groq** (LLaMA 3.3 70B) with automatic multi-model fallback (LLaMA 3.1 8B → Mixtral 8x7B).
- **AI Image Generation**: Create stunning social media visuals via **Pollinations AI** with prompt enhancement and negative-prompt support.
- **Smart Calendar & Planning**: Let the AI suggest an entire month's worth of content themes, goals, and targets tailored to your audience.
- **Automated Publishing**: Background cron job auto-publishes approved posts at their scheduled time. Works with Vercel Cron (daily) or external services like [cron-job.org](https://cron-job.org/) for higher frequency.
- **Platform-Aware Publishing**: When posting to "both" platforms, the AI writes separate Facebook and Instagram versions. The publish engine automatically splits them so each platform gets its own tailored content.
- **OAuth 2.0 Security**: Secure OAuth integration to publish on behalf of actual Facebook Pages and Instagram Business Accounts.
- **Live Engagement Analytics**: A background sync job that pulls real-world Likes, Comments, and Impressions back into your unified dashboard.
- **Hybrid Data Layer**: Uses lightweight `better-sqlite3` for fast local development, and **Neon Postgres** in production via `DATABASE_URL`.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend** | React 19, Client Components, Vanilla CSS with Glassmorphism UI |
| **AI — Text** | [Groq](https://console.groq.com/) (LLaMA 3.3 70B / 3.1 8B / Mixtral) |
| **AI — Images** | [Pollinations AI](https://pollinations.ai/) (with prompt enhancement) |
| **Database (Local)** | `better-sqlite3` |
| **Database (Production)** | [Neon Postgres](https://neon.tech/) |
| **Platforms** | Facebook Graph API v19.0, Instagram Graph API v19.0 |
| **Automation** | Vercel Cron / External Cron Services |

---

## 📁 Project Structure

Below is the directory tree of the key source files. Click on any file or folder to navigate directly to it:

- [src/](./src/)
  - [app/](./src/app/) — Next.js App Router (Pages and APIs)
    - [api/](./src/app/api/) — Backend API Endpoints
      - [auth/](./src/app/api/auth/) — OAuth & Authentication
        - [disconnect/route.js](./src/app/api/auth/disconnect/route.js) — Disconnect Facebook/Instagram token
        - [facebook/route.js](./src/app/api/auth/facebook/route.js) — Facebook OAuth login & callback handler
        - [instagram/route.js](./src/app/api/auth/instagram/route.js) — Instagram OAuth login & callback handler
      - [content/route.js](./src/app/api/content/route.js) — CRUD endpoint for managing posts
      - [cron/route.js](./src/app/api/cron/route.js) — Auto-publishing & analytics background sync cron
      - [generate/](./src/app/api/generate/) — AI Generation Endpoints
        - [image/route.js](./src/app/api/generate/image/route.js) — Pollinations AI image creation
        - [text/route.js](./src/app/api/generate/text/route.js) — Groq LLaMA text generation
      - [plan/route.js](./src/app/api/plan/route.js) — CRUD endpoint for monthly plans
      - [publish/route.js](./src/app/api/publish/route.js) — Direct post publishing engine (Facebook & Instagram)
      - [stats/route.js](./src/app/api/stats/route.js) — Analytics & performance statistics
    - [approve/page.js](./src/app/approve/page.js) — Post approval queue & scheduler dashboard
    - [calendar/page.js](./src/app/calendar/page.js) — Visual interactive posts calendar
    - [compose/page.js](./src/app/compose/page.js) — AI-assisted post composer (4-step wizard)
    - [data-deletion/page.js](./src/app/data-deletion/page.js) — Meta compliance user data deletion callback instructions
    - [edit/\[id\]/page.js](./src/app/edit/%5Bid%5D/page.js) — Post editor page
    - [plan/page.js](./src/app/plan/page.js) — Monthly content ideas & theme planner
    - [privacy/page.js](./src/app/privacy/page.js) — Public Privacy Policy page for Meta app review compliance
    - [settings/page.js](./src/app/settings/page.js) — API configurations, keys & OAuth connection dashboard
    - [page.js](./src/app/page.js) — Main dashboard with active tabs for published & scheduled posts
  - [components/](./src/components/) — Shared UI Components
    - [Sidebar.js](./src/components/Sidebar.js) — Left-side global navigation bar with connection status
    - [Toast.js](./src/components/Toast.js) — Global toast notification bubble system
  - [lib/](./src/lib/) — Backend Core Helpers & Utilities
    - [ai/](./src/lib/ai/) — AI Engines
      - [image-generator.js](./src/lib/ai/image-generator.js) — Pollinations AI controller with negative prompts
      - [text-generator.js](./src/lib/ai/text-generator.js) — Groq SDK client with automated models fallback
    - [platforms/](./src/lib/platforms/) — Meta APIs Integration
      - [facebook.js](./src/lib/platforms/facebook.js) — Facebook Graph SDK wrapper for pages posting
      - [instagram.js](./src/lib/platforms/instagram.js) — Instagram Business API wrapper for photo containers & publishing
    - [db.js](./src/lib/db.js) — Multi-tier hybrid database interface (better-sqlite3 + pg)
    - [n8n.js](./src/lib/n8n.js) — n8n workflows webhook integration helper
- [package.json](./package.json) — Node.js package manifests, dependencies & run scripts
- [vercel.json](./vercel.json) — Vercel production hosting & cron schedules setup configuration
- [next.config.mjs](./next.config.mjs) — Next.js configuration rules
- [.env.local](./.env.local) — Local development environment variables configuration template

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- [Groq API Key](https://console.groq.com/) (for AI text generation)
- [Facebook Developer App Credentials](https://developers.facebook.com/) (for OAuth & publishing)

### 1. Installation

```bash
git clone <your-repo-url>
cd socialagent
npm install
```

### 2. Environment Configuration

Create a [.env.local](file:///C:/Users/satya/OneDrive%20-%20Shiv%20Nadar%20Institution%20of%20Eminence/project/socialagent/.env.local) file in the project root:

```env
# AI — Text Generation (Required)
GROQ_API_KEY=your_groq_api_key_here

# Application URL (NO trailing slash!)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Facebook OAuth (Required for publishing)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram/Meta OAuth (same Meta app credentials)
INSTAGRAM_APP_ID=your_meta_app_id
INSTAGRAM_APP_SECRET=your_meta_app_secret

# n8n Automation Engine (Optional — set to false to use direct APIs)
N8N_ENABLED=false
N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# Security for Cron Endpoints (Optional)
CRON_SECRET=your_super_secret_cron_key

# Database (Leave empty for local SQLite, or provide Neon/Vercel Postgres URL)
# DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### 3. Start Development Server

```bash
# Next.js only (recommended for most development)
npm run dev

# Next.js + n8n together (if using n8n workflows)
npm run dev:all
```

Navigate to [http://localhost:3000](http://localhost:3000) to view your dashboard.

---

## ⚙️ Cron Jobs & Automation

The agent relies on background tasks to publish scheduled content and sync engagement analytics.

### Vercel Cron (Hobby Tier — Daily)

The included [vercel.json](file:///C:/Users/satya/OneDrive%20-%20Shiv%20Nadar%20Institution%20of%20Eminence/project/socialagent/vercel.json) configures two daily cron jobs:

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 0 * * *" },
    { "path": "/api/cron/analytics", "schedule": "0 6 * * *" }
  ]
}
```

- `/api/cron` — Runs daily at midnight UTC, publishes approved posts whose scheduled time has passed.
- `/api/cron/analytics` — Runs daily at 6 AM UTC, syncs likes/comments/impressions from Facebook & Instagram.

### Higher Frequency (Recommended)

Vercel Hobby only allows daily crons. For more frequent auto-publishing (e.g., every 15 minutes):

1. Sign up at [cron-job.org](https://cron-job.org/) (free).
2. Create a cron job pointing to `https://socialagent18.vercel.app/api/cron`.
3. Set the frequency to every 15 minutes.

---

## ☁️ Deployment (Vercel + Neon)

1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Create a [Neon Postgres](https://neon.tech/) database and add the connection string as `DATABASE_URL` in Vercel Environment Variables.
4. Add all required API keys (`GROQ_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, etc.) in Vercel Environment Variables.
5. Set `N8N_ENABLED=false` in Vercel (n8n runs locally, not on Vercel's serverless infrastructure).
6. Set `NEXT_PUBLIC_APP_URL` to your production domain **without a trailing slash** (e.g. `https://socialagent18.vercel.app`).
7. Deploy!

### 🔐 Meta App Setup

1. Go to [Meta Developer Portal](https://developers.facebook.com/) → Create App → Add **Facebook Login for Business**.
2. Copy `App ID` and `App Secret` → add as Vercel env vars.
3. In the app's **Valid OAuth Redirect URIs**, add:
   ```
   https://socialagent18.vercel.app/api/auth/facebook/callback
   https://socialagent18.vercel.app/api/auth/instagram/callback
   ```
4. If the app is owned by a **Business Portfolio**, go to [Business Settings](https://business.facebook.com/settings) → Users → People → assign yourself **Full Control** of the app under **Accounts → Apps**.
5. For Instagram publishing, your Instagram account must be a **Business or Creator account** linked to your Facebook Page in [Meta Business Suite](https://business.facebook.com/).

### 🔐 Security Note

OAuth tokens are stored persistently in the database (`platform_tokens` table) to allow background publishing without manual intervention. **Never commit your `.env.local` file or local `data/*.db` files to version control.**

---

## 📝 Content Workflow

```
1. Compose → Enter a brief idea/gist
2. AI generates platform-specific content (Facebook + Instagram)
3. AI generates a matching visual via Pollinations
4. Save as Draft or Submit for Approval
5. Review in Approval Queue → Approve, Reschedule, or Publish Now
6. Cron auto-publishes scheduled approved posts
7. Analytics cron syncs engagement metrics back to dashboard
```

---

*Built with ❤️ for fully autonomous social media growth.*
