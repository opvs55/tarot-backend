import { geminiClient } from '../integrations/geminiClient.js';

export const generateUnifiedReading = async ({ userId, weekRef, modulesSnapshot }) => {
  const prompt = `Gere leitura unificada semanal para user ${userId} em ${weekRef}.`;
  const aiResult = await geminiClient.generateText({ prompt, context: modulesSnapshot });

  return {
    summary: aiResult.text,
    recommendations: ['Respire antes de decidir.', 'Reserve tempo para autocuidado.'],
    next_steps: ['Planeje a semana na segunda-feira', 'Revise metas na sexta-feira'],
    // TODO: substituir score/tags por modelo de classificação real.
    energy_score: 78,
    tags: ['foco', 'equilibrio', 'intencao'],
    model_meta: { model: aiResult.model, latency_ms: aiResult.latency_ms },
  };
};
