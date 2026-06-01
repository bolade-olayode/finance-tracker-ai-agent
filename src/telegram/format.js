// src/telegram/format.js
// Pure formatting — turns computed figures into the mobile-optimized Telegram message.

const ng = (n) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s) => String(s || '').replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

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
    lines.push(`• ${esc(t.nickname)}: ${t.progressPct}% — ${trackWord(t.isOnTrack)} ${trackIcon(t.isOnTrack)}`);
  }
  lines.push(`• Interest earned this fortnight: ${ng(c.interestEarned)}`);
  const focus = [...c.targets].filter((t) => t.progressPct < 100).sort((a, b) => b.progressPct - a.progressPct)[0];
  if (focus) lines.push(`🎯 Focus: *${esc(focus.nickname)}* (${focus.progressPct}%) — closest to done, pour into this one`);
  lines.push('');

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
  const net = (a.real_inflow ?? 0) - (a.net_real_spend ?? 0);
  const lines = [
    '✅ *Daily run complete*',
    `• Processed: ${r.processed} txns  (Claude: ${r.aiCalls}, errors: ${r.errors})`,
    `• In: ${ng(a.real_inflow)}   Out: ${ng(a.net_real_spend)}`,
    `• Net today: ${net >= 0 ? '+' : ''}${ng(net)}`,
    `• Top spend: ${esc(a.top_category) || '—'} (${ng(a.top_category_amount)})`,
  ];

  if (a.top_items && a.top_items.length > 0) {
    lines.push('• Top items: ' + a.top_items.map((i) => `${esc(i.item)} (${ng(i.amount)})`).join(', '));
  }

  lines.push(a.anomaly_flags ? `• Flags: ${esc(a.anomaly_flags)}` : '• No anomalies');
  return lines.join('\n');
}
