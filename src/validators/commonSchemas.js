import { z } from 'zod';
import { AppError } from '../utils/appError.js';

export const weekSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  force_regenerate: z.boolean().optional().default(false),
});

export const parseSchema = (schema, data) => {
  const parsed = schema.safeParse(data ?? {});
  if (!parsed.success) {
    throw new AppError('Payload inválido.', {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  return parsed.data;
};
