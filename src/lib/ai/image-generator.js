import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateImage(visualGist, style = 'modern') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to .env.local');
  }

  const ai = new GoogleGenAI({ apiKey });

  const styleInstructions = {
    modern: 'Modern, clean, minimalist design with vibrant colors. Professional social media graphic.',
    corporate: 'Corporate, polished, trustworthy. Blue and neutral tones. Executive-level design.',
    creative: 'Creative, bold, artistic. Unique composition with eye-catching colors and shapes.',
    minimal: 'Ultra-minimal, lots of white space, elegant typography focus. Sophisticated and refined.',
    warm: 'Warm, inviting, human-centric. Soft colors, natural lighting feel. Community-oriented.',
    tech: 'Futuristic, tech-forward. Dark backgrounds with glowing accents, geometric patterns.',
  };

  const enhancedPrompt = `Create a high-quality social media graphic. ${styleInstructions[style] || styleInstructions.modern}

Subject: ${visualGist}

The image should be professional, visually striking, and suitable for LinkedIn and Instagram. No text in the image.`;

  // Method 1: Try Imagen API (purpose-built for image generation)
  try {
    console.log('Trying Imagen 3 for image generation...');
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      return saveImage(imageBytes);
    }
  } catch (error) {
    console.log('Imagen 3 failed:', error?.message?.substring(0, 100) || 'unknown error');
  }

  // Method 2: Try Imagen 3 fast
  try {
    console.log('Trying Imagen 3 Fast...');
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-fast-generate-001',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      return saveImage(imageBytes);
    }
  } catch (error) {
    console.log('Imagen 3 Fast failed:', error?.message?.substring(0, 100) || 'unknown error');
  }

  // Method 3: Try Gemini with image output
  const geminiModels = ['gemini-2.0-flash-exp', 'gemini-2.0-flash'];
  for (const model of geminiModels) {
    try {
      console.log(`Trying ${model} for image generation...`);
      const response = await ai.models.generateContent({
        model,
        contents: enhancedPrompt,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          return saveImage(part.inlineData.data);
        }
      }
      console.log(`${model} returned no image data`);
    } catch (error) {
      console.log(`${model} failed:`, error?.message?.substring(0, 100) || 'unknown');
    }
  }

  console.warn('Image generation unavailable due to API rate limits. Returning mock placeholder image.');
  
  // Return a beautiful abstract placeholder image so the app still works visually
  return {
    path: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop`,
    fullPath: null,
    filename: `mock-placeholder.jpg`,
    isDataUri: false,
    isMock: true
  };
}

function saveImage(base64Data) {
  // On Vercel, we can't write to filesystem — return data URI instead
  const isVercel = process.env.VERCEL === '1';

  if (isVercel) {
    // Return as data URI that can be displayed directly in <img src>
    return {
      path: `data:image/png;base64,${base64Data}`,
      fullPath: null,
      filename: `post-${Date.now()}.png`,
      isDataUri: true,
    };
  }

  // Local: save to filesystem
  const generatedDir = path.join(process.cwd(), 'public', 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const filename = `post-${Date.now()}.png`;
  const filepath = path.join(generatedDir, filename);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, buffer);

  return {
    path: `/generated/${filename}`,
    fullPath: filepath,
    filename,
  };
}
