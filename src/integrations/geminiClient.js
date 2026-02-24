import { env } from '../config/env.js';

export const geminiClient = {
  async generateText(prompt, options = {}) {
    // TODO: plugar SDK real Gemini usando env.geminiApiKey.
    return { text: `Stub Gemini :: ${prompt.slice(0, 180)}`, model: 'gemini-stub', options };
  },
  async healthCheck() {
    return { ok: !!env.geminiApiKey || true, provider: 'stub' };
  },
};
