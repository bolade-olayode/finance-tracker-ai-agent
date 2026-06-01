// src/cycles/cycleB.js
// Fortnightly optimization. All figures computed by the engine; Claude only writes the
// 2-3 action steps from those figures. Produces the Telegram message text.

import { computeFortnightly } from '../engine/compute.js';
import { formatFortnightlyReport } from '../telegram/format.js';

export async function runCycleB({ dataSource, periodStart, periodEnd, adviser } = {}) {
  const end = periodEnd || new Date().toISOString().slice(0, 10);
  const start = periodStart || new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);

  const dailyRows = await dataSource.getDailyAggregates(start, end);
  const targets = await dataSource.getTargets();
  const computed = computeFortnightly(dailyRows, targets, new Date(end));

  // Claude turns the numbers into advice — it never recomputes them.
  let advice = [];
  if (adviser) {
    try { advice = await adviser(computed, { periodStart: start, periodEnd: end }); }
    catch { advice = ['(advice unavailable — figures are still accurate)']; }
  }

  const text = formatFortnightlyReport(computed, { periodStart: start, periodEnd: end, advice });

  await dataSource.appendFortnightlyReport({
    report_id: `RPT-${end.replace(/-/g, '')}`,
    period_start: start, period_end: end,
    total_inflow: computed.totalInflow, total_outflow: computed.totalOutflow,
    net_real_spend: computed.netRealSpend, savings_rate: computed.savingsRate,
    net_worth_delta: computed.netWorthDelta, full_report_text: text,
  });

  return { computed, text };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { createMockDataSource } = await import('../sheets/dataSource.js');
  const r = await runCycleB({ dataSource: createMockDataSource() });
  console.log(r.text);
}
