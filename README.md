# 🤖 Social Media Agent

An autonomous, AI-powered social media manager built with Next.js 15. The agent handles content generation, visual assets, intelligent scheduling, automated publishing, and engagement tracking across LinkedIn and Instagram.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)
![Database](https://img.shields.io/badge/Database-Hybrid_SQLite/Postgres-blue)

---

## ✨ Features

- **AI Content Engine**: Automatically generate platform-specific written content and image prompts based on brief ideas using Google's Gemini and Imagen 3 APIs.
- **Smart Calendar & Planning**: Let the AI suggest an entire month's worth of content themes, goals, and targets tailored to your audience.
- **Automated Publishing Cron**: A highly resilient publishing engine that automatically checks your database for approved posts and publishes them on schedule.
- **n8n Orchestration & Direct API Fallbacks**: Uses `n8n` workflows for advanced publishing orchestration, seamlessly degrading to direct local API integration if the automation engine goes offline.
- **OAuth 2.0 Security**: Standard, secure OAuth integration to publish on behalf of actual LinkedIn Profiles and Instagram Business Accounts safely.
- **Live Engagement Analytics**: A background sync job that pulls real-world `Likes`, `Comments`, and `Impressions` back into your unified dashboard.
- **Hybrid Data Layer**: Uses lightweight `better-sqlite3` for fast local development, but automatically adapts to use PostgreSQL (`pg`) when deployed to the cloud (e.g. Vercel Postgres).

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend**: React Server Components, Client Hooks, Vanilla CSS with Glassmorphism UI
- **Database Layer**: `better-sqlite3` (Local) / `pg` (Production Cloud) via custom Async Adapter
- **AI Models**: Google Gemini 1.5 (Text/Planning), Google Imagen 3 (Images)
- **Automation**: n8n Webhooks & Vercel Cron

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- [Google Gemini API Key](https://aistudio.google.com/) (For content generation)
- [LinkedIn Developer API Credentials](https://developer.linkedin.com/) (For posting via OAuth)
- [Meta/Facebook App Credentials](https://developers.facebook.com/) (For Instagram posting via OAuth)

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <your-repo-url>
cd social-media-agent
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Your `.env.local` should look like this:

```env
# Application Base
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google AI credentials
GEMINI_API_KEY=your_gemini_api_key_here

# LinkedIn OAuth credentials
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Instagram/Meta OAuth credentials
INSTAGRAM_APP_ID=your_meta_app_id
INSTAGRAM_APP_SECRET=your_meta_app_secret

# n8n Automation Engine (Optional: disable to use direct local APIs)
N8N_ENABLED=true
N8N_WEBHOOK_BASE=http://localhost:5678/webhook

# Security for Automated Publishing Endpoints
CRON_SECRET=your_super_secret_cron_key

# Database (Leave empty for local SQLite. Provide a Postgres URL for production)
# DATABASE_URL=postgres://user:password@host/database
```

### 3. Start Development Server

Run the unified development script, which gracefully starts both the Next.js server and local n8n instance:

```bash
npm run dev:all
```

Navigate to [http://localhost:3000](http://localhost:3000) to view your dashboard!

---

## ⚙️ Cron Jobs & Automation Setup

The agent relies on background tasks to publish scheduled content and sync engagement analytics. 

If deploying to Vercel, simply set up a `vercel.json` file like this:

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

* Ensure your `CRON_SECRET` environment variable matches in Vercel to protect the endpoints.
* **Local Testing**: You can manually trigger these endpoints locally via browser: `http://localhost:3000/api/cron?authorization=Bearer%20your_secret`

---

## ☁️ Deployment

This project is built to be deployed seamlessly on Vercel without data loss.

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Attach a **Vercel Postgres** database to your project (which automatically populates the `DATABASE_URL` environment variable).
4. Add all required API keys and OAuth secrets in the Vercel Environment Variables settings.
5. Deploy!

### 🔐 Security Note

OAuth tokens are stored persistently in the database (`platform_tokens` table) to allow background publishing without manual intervention. **Never commit your local `social-agent.db` file or your `.env.local` to version control.**

---
*Built with ❤️ for fully autonomous social media growth.*
