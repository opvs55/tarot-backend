import { numerologyRepository } from '../../repositories/numerologyRepository.js';

export const numerologyBaseService = {
  async generate({ userId, payload }) {
    const readingPayload = {
      life_path: 7,
      destiny_number: 3,
      // TODO: cálculo real numerológico com dados de perfil.
    };
    return numerologyRepository.upsertBaseReading(userId, { input_payload: payload, reading_payload: readingPayload });
  },
};
