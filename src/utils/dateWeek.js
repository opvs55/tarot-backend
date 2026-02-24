import { AppError } from './appError.js';

const parseDate = (value) => new Date(`${value}T00:00:00.000Z`);

export const resolveWeekStart = (weekStartInput) => {
  const base = weekStartInput ? parseDate(weekStartInput) : new Date();
  if (Number.isNaN(base.getTime())) {
    throw new AppError('week_start inválido. Use YYYY-MM-DD.', { status: 400, code: 'VALIDATION_ERROR' });
  }
  const day = (base.getUTCDay() + 6) % 7;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - day);
  return monday.toISOString().slice(0, 10);
};

export const isIsoMonday = (dateString) => parseDate(dateString).getUTCDay() === 1;

export const toWeekRef = (weekStart) => {
  const monday = parseDate(weekStart);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};
