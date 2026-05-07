# n8n Workflows for Social Media Agent

## Workflow Files

| File | Webhook Path | What It Does |
|------|-------------|--------------|
| `generate-text.json` | `POST /webhook/generate-text` | AI text generation via Gemini (2.0-flash → 1.5-flash → mock fallback) |
| `generate-image.json` | `POST /webhook/generate-image` | Image generation via Imagen 3 → Imagen 3 Fast → mock placeholder |
| `generate-plan.json` | `POST /webhook/generate-plan` | Monthly content plan via Gemini with JSON parsing |
| `publish-post.json` | `POST /webhook/publish` | Multi-platform publish (LinkedIn + Instagram in parallel) |

## Quick Start

### 1. Start n8n

**Option A: Docker (Recommended)**
```bash
cd n8n
docker compose up -d
```

**Option B: npx (No Docker)**
```bash
npx -y n8n start
```

n8n will be available at **http://localhost:5678**

### 2. Set the GEMINI_API_KEY in n8n

1. Go to **Settings → Variables** in n8n
2. Add a variable: `GEMINI_API_KEY` = your Google AI Studio API key
3. This is used by the HTTP Request nodes to call the Gemini REST API

### 3. Import Workflows

**Import each file separately:**
1. In n8n, click **"Create Workflow"**
2. Click the **⋯ menu** → **"Import from File"**
3. Select a `.json` file from this `workflows/` folder
4. Repeat for each of the 4 workflow files

**Or import all at once** — open `all-workflows.json` and copy-paste each workflow object.

### 4. Activate Workflows

After importing, toggle each workflow **active** so the webhooks start listening.

## Architecture

```
Next.js App  →  n8n Webhook  →  Gemini/Imagen/LinkedIn/Instagram API
     ↓ (fallback if n8n is down)
  Direct API calls (same logic, coded in src/lib/)
```

The app's `src/lib/n8n.js` smart router checks if n8n is running:
- **n8n UP** → routes through n8n webhooks
- **n8n DOWN** → falls back to direct API calls in `src/lib/ai/` and `src/lib/platforms/`

## Customization

- **Change AI model**: Edit the `url` in the Gemini HTTP Request nodes
- **Change prompts**: Edit the `jsonBody` in the Gemini HTTP Request nodes
- **Add a new platform**: Fork `publish-post.json` and add a new branch
- **Adjust timeouts**: Edit the `options.timeout` in each HTTP Request node
