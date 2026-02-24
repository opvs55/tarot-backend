import { astrologyProviderClient } from '../../integrations/astrologyProviderClient.js';

export const natalRenderingService = {
  getNatalChartSvg: async (input) => astrologyProviderClient.renderNatalChartSvg(input),
  renderPreviewSvg: async (input) => astrologyProviderClient.renderNatalChartSvg(input),
};
