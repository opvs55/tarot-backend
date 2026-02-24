import { z } from 'zod';

export const upsertNatalSchema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  birth_city: z.string().min(2),
  birth_country: z.string().optional(),
  birth_timezone: z.string().optional(),
});
