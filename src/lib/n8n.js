// n8n Webhook Client with automatic fallback to direct API calls
// If n8n is running → routes through n8n workflows
// If n8n is down → falls back to direct Groq/Pollinations/Facebook/Instagram calls

const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook';
const N8N_ENABLED = process.env.N8N_ENABLED !== 'false'; // enabled by default
const N8N_TIMEOUT = 120000; // 2 minutes — AI generation can be slow

/**
 * Check if n8n is reachable
 */
async function isN8nAvailable() {
  if (!N8N_ENABLED) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${N8N_WEBHOOK_BASE.replace('/webhook', '')}/healthz`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Generic function to trigger an n8n webhook
 */
async function triggerWebhook(path, data) {
  const url = `${N8N_WEBHOOK_BASE}/${path}`;
  console.log(`[n8n] Triggering webhook: ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`n8n webhook failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// ============================================================
// TEXT GENERATION
// ============================================================

/**
 * Build the prompt that gets sent to n8n / Gemini
 */
function buildTextPrompt(gist, platform = 'both', tone = 'professional') {
  const platformInstructions = {
    facebook: 'Write this as a Facebook post. Engaging, conversational, with line breaks for readability. 1-2 hashtags at the end.',
    instagram: 'Write this as an Instagram caption. Visual, exciting, emoji-rich. 5-7 hashtags at the end.',
    both: 'Write TWO versions — one for Facebook and one for Instagram. Clearly label each with "=== FACEBOOK ===" and "=== INSTAGRAM ===" headers. Adapt the tone and format for each platform.',
  };

  const toneMap = {
    professional: 'Keep a professional but approachable tone.',
    casual: 'Keep it casual and friendly, like talking to peers.',
    inspirational: 'Make it inspirational and motivating without being cheesy.',
    educational: 'Make it informative and educational, sharing genuine insights.',
    storytelling: 'Frame it as a short story or narrative with a clear takeaway.',
  };

  return `${platformInstructions[platform] || platformInstructions.both}

Tone: ${toneMap[tone] || toneMap.professional}

Here is the gist/idea for the post:
"""
${gist}
"""

Write the social media post now. Remember to sound human, authentic, and engaging — not robotic or generic.`;
}

export async function generateTextViaN8n(gist, platform = 'both', tone = 'professional') {
  const prompt = buildTextPrompt(gist, platform, tone);

  const result = await triggerWebhook('generate-text', {
    prompt,
    gist,
    platform,
    tone,
  });

  // n8n returns { content: { facebook, instagram, raw } }
  return result.content || result;
}

// ============================================================
// IMAGE GENERATION
// ============================================================

function getStyleInstruction(style = 'modern') {
  const styles = {
    modern: 'Modern, clean, minimalist design with vibrant colors. Professional social media graphic.',
    corporate: 'Corporate, polished, trustworthy. Blue and neutral tones. Executive-level design.',
    creative: 'Creative, bold, artistic. Unique composition with eye-catching colors and shapes.',
    minimal: 'Ultra-minimal, lots of white space, elegant typography focus. Sophisticated and refined.',
    warm: 'Warm, inviting, human-centric. Soft colors, natural lighting feel. Community-oriented.',
    tech: 'Futuristic, tech-forward. Dark backgrounds with glowing accents, geometric patterns.',
  };
  return styles[style] || styles.modern;
}

export async function generateImageViaN8n(visualGist, style = 'modern') {
  const result = await triggerWebhook('generate-image', {
    visualGist,
    style,
    styleInstruction: getStyleInstruction(style),
  });

  // n8n returns { image: { path, filename, isDataUri, isMock } }
  return result.image || result;
}

// ============================================================
// PLAN GENERATION
// ============================================================

function buildPlanPrompt(month, year, theme, goals, targetAudience) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];

  return `You are a social media strategist. Create a detailed monthly content plan.

Month: ${monthName} ${year}
Theme: ${theme || 'General brand awareness and engagement'}
Goals: ${goals || 'Increase engagement and followers'}
Target Audience: ${targetAudience || 'Professionals and industry peers'}

Create a content calendar with 12-16 posts spread across the month (3-4 per week).

For each post, provide:
1. Suggested date (day of month)
2. Platform (facebook, instagram, or both)
3. Post title (catchy, brief)
4. Written content gist (2-3 sentences describing what to write about)
5. Visual content gist (1-2 sentences describing the ideal image/graphic)

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown code fences:
[
  {
    "day": 2,
    "platform": "both",
    "title": "Example Title",
    "written_gist": "Description...",
    "visual_gist": "Description..."
  }
]

Make posts diverse — mix educational, behind-the-scenes, tips, achievements, and engagement posts.`;
}

export async function generatePlanViaN8n(month, year, theme, goals, targetAudience) {
  const prompt = buildPlanPrompt(month, year, theme, goals, targetAudience);

  const result = await triggerWebhook('generate-plan', {
    prompt,
    month,
    year,
    theme,
    goals,
    targetAudience,
  });

  return result.suggestions || result;
}

// ============================================================
// PUBLISH
// ============================================================

export async function publishViaN8n(postData) {
  const result = await triggerWebhook('publish', postData);
  return result;
}

// ============================================================
// SMART ROUTER — tries n8n first, falls back to direct calls
// ============================================================

export async function smartGenText(gist, platform, tone) {
  if (await isN8nAvailable()) {
    try {
      console.log('[n8n] Routing text generation through n8n');
      return await generateTextViaN8n(gist, platform, tone);
    } catch (err) {
      console.warn('[n8n] Text generation failed, falling back to direct:', err.message);
    }
  }
  // Fallback to direct API
  console.log('[direct] Using Groq API for text generation');
  const { generateWrittenContent } = await import('@/lib/ai/text-generator');
  return await generateWrittenContent(gist, platform, tone);
}

export async function smartGenImage(visualGist, style) {
  if (await isN8nAvailable()) {
    try {
      console.log('[n8n] Routing image generation through n8n');
      return await generateImageViaN8n(visualGist, style);
    } catch (err) {
      console.warn('[n8n] Image generation failed, falling back to direct:', err.message);
    }
  }
  console.log('[direct] Using Pollinations API for image generation');
  const { generateImage } = await import('@/lib/ai/image-generator');
  return await generateImage(visualGist, style);
}

export async function smartGenPlan(month, year, theme, goals, targetAudience) {
  if (await isN8nAvailable()) {
    try {
      console.log('[n8n] Routing plan generation through n8n');
      return await generatePlanViaN8n(month, year, theme, goals, targetAudience);
    } catch (err) {
      console.warn('[n8n] Plan generation failed, falling back to direct:', err.message);
    }
  }
  console.log('[direct] Using Groq API for plan generation');
  const { generatePlanSuggestion } = await import('@/lib/ai/text-generator');
  return await generatePlanSuggestion(month, year, theme, goals, targetAudience);
}

export async function smartPublish(postData) {
  if (await isN8nAvailable()) {
    try {
      console.log('[n8n] Routing publish through n8n');
      return await publishViaN8n(postData);
    } catch (err) {
      console.warn('[n8n] Publish failed, falling back to direct:', err.message);
    }
  }
  // Fallback returns error — publish requires platform-specific code
  console.log('[direct] n8n unavailable for publish — falling back to direct API');
  return { fallbackToDirect: true };
}
