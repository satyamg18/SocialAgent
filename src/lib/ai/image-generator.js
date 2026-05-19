function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTokenUsage(model, response) {
  const usage = response?.usageMetadata ?? response?.usage;
  if (!usage) {
    console.log(`[token-usage] ${model}: no usage metadata in response`);
    return;
  }
  const promptTokens = usage.promptTokenCount ?? usage.prompt_tokens ?? 'n/a';
  const candidateTokens = usage.candidatesTokenCount ?? usage.completion_tokens ?? 'n/a';
  const totalTokens = usage.totalTokenCount ?? usage.total_tokens ?? 'n/a';
  console.log(
    `[token-usage] model=${model}  prompt=${promptTokens}  output=${candidateTokens}  total=${totalTokens}`
  );
}

export async function generateImage(visualGist, style = 'modern') {
  const styleInstructions = {
    modern: 'modern minimalist design, vibrant colors, clean aesthetic, high quality, digital art',
    corporate: 'corporate, professional, polished, blue and neutral tones, high-end photography',
    creative: 'creative, bold artistic composition, eye-catching colors, surreal, highly detailed',
    minimal: 'ultra minimal, lots of white space, sophisticated, elegant, high resolution',
    warm: 'warm, inviting, human-centric, soft natural lighting, cinematic photography',
    tech: 'futuristic, cyberpunk, tech-forward, glowing accents, 8k, highly detailed',
  };

  // Clean up gist and formulate a strong descriptive prompt
  const cleanGist = visualGist.replace(/subject:/gi, '').trim();
  const enhancedPrompt = `${cleanGist}, ${styleInstructions[style] || styleInstructions.modern}, masterpiece, highly detailed, professional social media graphic`;
  
  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  // Add negative prompt to strongly discourage text, watermarks, and messy artifacts
  const negativePrompt = encodeURIComponent("text, words, letters, signature, watermark, messy, ugly, poorly drawn, abstract chaos, blurry, deformed");
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true&enhance=true&negative=${negativePrompt}`;

  console.log('[image-generator] Returning Pollinations URL — image renders on load');
  return {
    path: imageUrl,
    fullPath: null,
    filename: `post-${Date.now()}.png`,
    isDataUri: false,
    isMock: false
  };
}