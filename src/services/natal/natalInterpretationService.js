import { astrologyProviderClient } from '../../integrations/astrologyProviderClient.js';

export const natalInterpretationService = {
  async getInterpretation(input) {
    return astrologyProviderClient.getNatalInterpretations(input);
  },
};
