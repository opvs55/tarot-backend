import { unifiedReadingRepository } from '../../repositories/unifiedReadingRepository.js';

export const unifiedReadingService = {
  listByUser: (userId) => unifiedReadingRepository.listByUser(userId),
  getByIdForUser: (id, userId) => unifiedReadingRepository.findByIdForUser(id, userId),
};
