# 🤖 SocialPilot — Social Media Agent

An autonomous, AI-powered social media manager built with Next.js. The agent handles content generation, visual assets, intelligent scheduling, automated publishing, and engagement tracking across **Facebook** and **Instagram**.

**Live Demo:** [https://social-media-agent-nine.vercel.app](https://social-media-agent-nine.vercel.app)

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

```
src/
├── app/
│   ├── page.js                  # Dashboard with Published/Unpublished tabs
│   ├── compose/page.js          # AI post composer (4-step wizard)
│   ├── approve/page.js          # Approval queue with publish & reschedule
│   ├── calendar/page.js         # Calendar view of scheduled posts
│   ├── plan/page.js             # Monthly AI content planner
│   ├── settings/page.js         # OAuth connections & API key status
│   ├── edit/[id]/page.js        # Post editor
│   ├── privacy/page.js          # Privacy Policy (Meta compliance)
│   ├── data-deletion/page.js    # Data Deletion Instructions (Meta compliance)
│   └── api/
│       ├── auth/facebook/       # Facebook OAuth flow (init + callback)
│       ├── auth/instagram/      # Instagram OAuth flow (init + callback)
│       ├── generate/text/       # AI text generation endpoint
│       ├── generate/image/      # AI image generation endpoint
│       ├── content/             # CRUD for posts
│       ├── publish/             # Manual publish trigger
│       ├── plan/                # Monthly plan CRUD
│       ├── stats/               # Dashboard statistics
│       └── cron/                # Auto-publish & analytics sync
├── lib/
│   ├── ai/
│   │   ├── text-generator.js    # Groq SDK integration with token logging
│   │   └── image-generator.js   # Pollinations AI with negative prompts
│   ├── platforms/
│   │   ├── facebook.js          # Facebook Graph API (text + image posts)
│   │   └── instagram.js         # Instagram Graph API (container → publish)
│   ├── db.js                    # Hybrid SQLite/Postgres data adapter
│   └── n8n.js                   # n8n webhook client with smart fallbacks
└── components/
    ├── Sidebar.js               # Navigation with live connection status
    └── Toast.js                 # Toast notification system
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- [Groq API Key](https://console.groq.com/) (for AI text generation)
- [Facebook Developer App Credentials](https://developers.facebook.com/) (for OAuth & publishing)

### 1. Installation

```bash
git clone <your-repo-url>
cd social-media-agent
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

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

The included `vercel.json` configures two daily cron jobs:

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
2. Create a cron job pointing to `https://your-domain.vercel.app/api/cron`.
3. Set the frequency to every 15 minutes.

---

## ☁️ Deployment (Vercel + Neon)

1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Create a [Neon Postgres](https://neon.tech/) database and add the connection string as `DATABASE_URL` in Vercel Environment Variables.
4. Add all required API keys (`GROQ_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, etc.) in Vercel Environment Variables.
5. Set `N8N_ENABLED=false` in Vercel (n8n runs locally, not on Vercel's serverless infrastructure).
6. Set `NEXT_PUBLIC_APP_URL` to your production domain **without a trailing slash** (e.g. `https://social-media-agent-nine.vercel.app`).
7. Deploy!

### 🔐 Meta App Setup

1. Go to [Meta Developer Portal](https://developers.facebook.com/) → Create App → Add **Facebook Login for Business**.
2. Copy `App ID` and `App Secret` → add as Vercel env vars.
3. In the app's **Valid OAuth Redirect URIs**, add:
   ```
   https://YOUR_DOMAIN/api/auth/facebook/callback
   https://YOUR_DOMAIN/api/auth/instagram/callback
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
