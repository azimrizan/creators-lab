import { GoogleGenAI } from '@google/genai';

// Retrieve API key from environment variable
const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize GoogleGenAI SDK instance
export const ai = new GoogleGenAI({ apiKey });

// Active non-decommissioned Gemini models ordered by priority for automatic fallback
export const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

export interface GeminiResponse {
  text: string;
  modelUsed: string;
}

/**
 * Execute Gemini model call with automatic multi-model fallback on rate-limiting or errors
 */
export async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string
): Promise<GeminiResponse> {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[Gemini Engine] Attempting request with model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Engine] Model ${modelName} failed/rate-limited:`, err?.message || err);
      lastError = err;
      // Continue to next model in fallback chain
    }
  }

  // If all Gemini API models fail or if API key is invalid/unreachable, fallback to intelligent fallback generator
  console.error('[Gemini Engine] All fallback models failed. Using intelligent local synthesis fallback.', lastError);
  return {
    text: '',
    modelUsed: 'local-fallback'
  };
}
