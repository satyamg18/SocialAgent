# 🤖 SocialPilot — AI Social Media Automation Agent

An autonomous, AI-powered social media manager built with Next.js. The agent handles content generation, visual assets, intelligent scheduling, automated publishing, and engagement tracking across **Facebook** and **Instagram**.

**Live Demo:** [https://social-media-agent-nine.vercel.app](https://social-media-agent-nine.vercel.app)

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203-orange)
![Database](https://img.shields.io/badge/Database-Neon%20Postgres-blue)

---

## ✨ Features

- **AI Content Engine**: Generate platform-specific written content using **Groq** (LLaMA 3.3 70B) with automatic multi-model fallback (LLaMA 3.1 8B → Mixtral 8x7B).
- **AI Image Generation**: Create stunning social media visuals via **Pollinations AI** (Flux model) with negative-prompt support to prevent artifacts.
- **Smart Calendar & Planning**: Let the AI suggest an entire month's worth of content themes, goals, and targets tailored to your audience.
- **Automated Publishing Cron**: A background job that automatically publishes approved posts at their scheduled time via Vercel Cron.
- **n8n Orchestration & Direct API Fallbacks**: Uses `n8n` workflows for advanced publishing orchestration, seamlessly degrading to direct API calls if n8n is offline.
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
| **AI — Images** | [Pollinations AI](https://pollinations.ai/) (Flux model) |
| **Database (Local)** | `better-sqlite3` |
| **Database (Production)** | [Neon Postgres](https://neon.tech/) |
| **Platforms** | Facebook Graph API v19.0, Instagram Graph API v19.0 |
| **Automation** | n8n Webhooks & Vercel Cron |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.js                  # Dashboard with Published/Unpublished tabs
│   ├── compose/page.js          # AI post composer (4-step wizard)
│   ├── approve/page.js          # Approval queue with publish actions
│   ├── calendar/page.js         # Calendar view of scheduled posts
│   ├── plan/page.js             # Monthly AI content planner
│   ├── settings/page.js         # OAuth connections & API key status
│   ├── edit/[id]/page.js        # Post editor
│   └── api/
│       ├── auth/facebook/       # Facebook OAuth flow
│       ├── auth/instagram/      # Instagram OAuth flow
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

- Node.js v18+
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

# Application URL
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

For Vercel, add a `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/analytics",
      "schedule": "0 0 * * *"
    }
  ]
}
```

- `/api/cron` — Runs every 15 minutes, publishes approved posts whose scheduled time has passed.
- `/api/cron/analytics` — Runs daily, syncs likes/comments/impressions from Facebook & Instagram.

---

## ☁️ Deployment (Vercel + Neon)

1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Create a [Neon Postgres](https://neon.tech/) database and add the connection string as `DATABASE_URL` in Vercel Environment Variables.
4. Add all required API keys (`GROQ_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, etc.) in Vercel Environment Variables.
5. Set `N8N_ENABLED=false` in Vercel (n8n runs locally, not on Vercel's serverless infrastructure).
6. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://social-media-agent-nine.vercel.app`).
7. Deploy!

### 🔐 Security Note

OAuth tokens are stored persistently in the database (`platform_tokens` table) to allow background publishing without manual intervention. **Never commit your `.env.local` file or local `data/*.db` files to version control.**

---

## 📝 Content Workflow

```
1. Compose → Enter a brief idea/gist
2. AI generates platform-specific content (Facebook + Instagram)
3. AI generates a matching visual via Pollinations
4. Save as Draft or Submit for Approval
5. Review in Approval Queue → Approve & Publish
6. Cron auto-publishes scheduled approved posts
7. Analytics cron syncs engagement metrics back to dashboard
```

---

*Built with ❤️ for fully autonomous social media growth.*
