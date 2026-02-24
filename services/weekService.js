import { AppError } from '../shared/http/AppError.js';
import { ERROR_CODES } from '../shared/http/errorCodes.js';

const toDateOnly = (date) => new Date(`${date}T00:00:00.000Z`);

export const getIsoWeekInfo = (weekStartInput) => {
  const now = new Date();
  const base = weekStartInput ? toDateOnly(weekStartInput) : now;

  if (Number.isNaN(base.getTime())) {
    throw new AppError('week_start inválido. Use YYYY-MM-DD.', {
      status: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: [{ field: 'week_start', message: 'Formato inválido.' }],
    });
  }

  const day = (base.getUTCDay() + 6) % 7;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - day);
  const weekStart = monday.toISOString().slice(0, 10);

  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  const weekRef = `${thursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

  return { weekStart, weekRef };
};
