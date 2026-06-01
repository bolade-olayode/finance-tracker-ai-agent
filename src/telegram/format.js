// src/telegram/format.js
// Pure formatting — turns computed figures into the mobile-optimized Telegram message.

const ng = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const trackIcon = (s) => ({ TRUE: '✅', AT_RISK: '⚠️', FALSE: '❌', UNKNOWN: '❔' }[s] || '');
const trackWord = (s) => ({ TRUE: 'ON TRACK', AT_RISK: 'AT RISK', FALSE: 'OFF TRACK', UNKNOWN: 'NO DATE SET' }[s] || s);

export function formatFortnightlyReport(c, { periodStart, periodEnd, advice = [] } = {}) {
  const lines = [];
  lines.push(`📊 *FORTNIGHTLY REPORT* (${periodStart} – ${periodEnd})`, '');

  lines.push('💰 *THE NUMBERS*');
  lines.push(`• Total Inflow: ${ng(c.totalInflow)}`);
  lines.push(`• Total Outflow: ${ng(c.totalOutflow)}`);
  lines.push(`• Net Real Spend: ${ng(c.netRealSpend)}`);
  lines.push(`• Savings Rate: ${c.savingsRate}%`);
  lines.push(`• Net Worth Change: ${c.netWorthDelta >= 0 ? '+' : ''}${ng(c.netWorthDelta)}`, '');

  lines.push('🐷 *SAVINGS PROGRESS*');
  for (const t of c.targets) {
    lines.push(`• ${t.nickname}: ${t.progressPct}% — ${trackWord(t.isOnTrack)} ${trackIcon(t.isOnTrack)}`);
  }
  lines.push(`• Interest earned this fortnight: ${ng(c.interestEarned)}`, '');

  lines.push('🔍 *LEAKS*');
  if (c.avoidableFees > 0) lines.push(`• ${ng(c.avoidableFees)} in avoidable bank fees (route via Opay)`);
  if (c.cashUnaccounted > 0) lines.push(`• ${ng(c.cashUnaccounted)} cash unaccounted for`);
  if (c.avoidableFees === 0 && c.cashUnaccounted === 0) lines.push('• No major leaks this fortnight 👍');
  lines.push('');

  if (advice.length) {
    lines.push('💡 *NEXT FORTNIGHT*');
    for (const a of advice) lines.push(`• ${a}`);
  }

  return lines.join('\n');
}

export function formatCycleASummary(r) {
  const a = r.aggregate;
  const lines = [
    '✅ *Daily run complete*',
    `• Processed: ${r.processed} txns  (Claude: ${r.aiCalls}, errors: ${r.errors})`,
    `• Net real spend: ${ng(a.net_real_spend)}`,
    `• Top category: ${a.top_category || '—'} (${ng(a.top_category_amount)})`,
  ];

  if (a.top_items && a.top_items.length > 0) {
    lines.push('• Top items: ' + a.top_items.map((i) => `${i.item} (${ng(i.amount)})`).join(', '));
  }

  lines.push(a.anomaly_flags ? `• Flags: ${a.anomaly_flags}` : '• No anomalies');
  return lines.join('\n');
}
