import { natalChartRepository } from '../../repositories/natalChartRepository.js';
import { astrologyProviderClient } from '../../integrations/astrologyProviderClient.js';

export const natalChartService = {
  async upsertNatalChart({ userId, birthData }) {
    const calculated = await astrologyProviderClient.calculateNatalChart(birthData);
    return natalChartRepository.upsertByUserId(userId, {
      ...birthData,
      positions: calculated.positions,
      aspects: calculated.aspects,
      chart_summary: calculated.summary || null,
    });
  },
  getNatalChart: (userId) => natalChartRepository.findByUserId(userId),
  previewNatalChartCalculation: async (input) => astrologyProviderClient.calculateNatalChart(input),
};
