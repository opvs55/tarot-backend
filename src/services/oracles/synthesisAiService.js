import { geminiClient } from '../../integrations/geminiClient.js';
import { buildCentralOraclePrompt } from '../../prompts/centralOraclePrompt.js';

export const synthesisAiService = {
  async generateUnifiedReading({ inputsSnapshot, modulesSnapshot }) {
    const prompt = buildCentralOraclePrompt({ inputsSnapshot, modulesSnapshot });
    const completion = await geminiClient.generateText(prompt, { temperature: 0.4 });
    return {
      overview: completion.text,
      guidance: ['Manter foco', 'Respeitar limites energéticos'],
      energy_score: 77,
      tags: ['semanal', 'clareza', 'equilibrio'],
      model_meta: { model: completion.model },
    };
  },
};
