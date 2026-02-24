import { z } from 'zod';

export const upsertProfileSchema = z.object({
  full_name: z.string().min(2),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birth_city: z.string().optional(),
});
