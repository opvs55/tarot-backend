import { natalChartRepository } from '../../repositories/natalChartRepository.js';

export const natalSnapshotService = {
  async generate({ userId, weekStart, weekRef }) {
    const natal = await natalChartRepository.findByUserId(userId);
    return {
      week_start: weekStart,
      week_ref: weekRef,
      based_on_chart: !!natal,
      summary: `Snapshot astral semanal (${weekRef}).`,
      // TODO: enriquecer com cálculos astrais reais + interpretação contextual.
    };
  },
};
