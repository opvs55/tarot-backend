import { env } from '../config/env.js';

export const astrologyProviderClient = {
  async calculateNatalChart(input) {
    // TODO: integrar AstroAPI/AstrologyAPI real de acordo com ASTROLOGY_PROVIDER.
    return { provider: env.astrologyProvider, positions: {}, aspects: [], input };
  },
  async renderNatalChartSvg(input) {
    // TODO: renderização real/proxy para fornecedor.
    return `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='240'><text x='10' y='30'>Natal Chart Preview</text></svg>`;
  },
  async getNatalInterpretations(input) {
    return { summary: 'Interpretação stub.', input };
  },
  async healthCheck() {
    return { ok: true, provider: env.astrologyProvider };
  },
};
