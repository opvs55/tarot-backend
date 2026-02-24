import { z } from 'zod';
import { weekSchema } from './commonSchemas.js';

export const centralOracleSchema = weekSchema.extend({
  auto_generate_missing: z.boolean().optional().default(true),
  modules: z.array(z.string()).optional(),
  focus_area: z.string().optional(),
});

export const weekOnlySchema = weekSchema;
