// TODO: integrar SDK real do Gemini com prompt engineering e políticas de segurança.
export const geminiClient = {
  async generateText({ prompt, context }) {
    return {
      text: `Stub Gemini: ${prompt}. Contexto: ${JSON.stringify(context).slice(0, 300)}`,
      model: 'gemini-stub-v1',
      latency_ms: 5,
    };
  },
};
