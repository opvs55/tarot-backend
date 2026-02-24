import { profileRepository } from '../../repositories/profileRepository.js';

export const profileService = {
  upsert: (userId, payload) => profileRepository.upsertByUserId(userId, payload),
  getMe: (userId) => profileRepository.findByUserId(userId),
};
