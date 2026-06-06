
/**
 * TradeZar Screener Engine
 * Evaluates a set of signals against live market data
 * Returns a score 0-100 and pass/fail per signal
 */

/**
 * Evaluate a single signal against a data value
 */
export function evaluateSignal(signal, dataValue) {
  if (dataValue === null || dataValue === undefined) {
    return { passed: false, score: 0, reason: 'No data available' };
  }

  const v = parseFloat(dataValue);
  const a = parseFloat(signal.valueA);
  const b = signal.valueB !== null ? parseFloat(signal.valueB) : null;

  let passed = false;

  switch (signal.operator) {
    case 'gt':           passed = v > a;  break;
    case 'gte':          passed = v >= a; break;
    case 'lt':           passed = v < a;  break;
    case 'lte':          passed = v <= a; break;
    case 'equals':       passed = Math.abs(v - a) < 0.0001; break;
    case 'between':      passed = b !== null && v >= a && v <= b; break;
    case 'crosses_above':passed = v >= a; break; // simplified — true cross needs history
    case 'crosses_below':passed = v <= a; break;
    default:             passed = false;
  }

  return {
    passed,
    score: passed ? signal.weight * 20 : 0, // each weight unit = 20 pts base
    dataValue: v,
    reason: passed
      ? `${signal.metric} ${signal.operator} ${a}${signal.unit ? ' ' + signal.unit : ''}: ✓ (${v})`
      : `${signal.metric} ${signal.operator} ${a}${signal.unit ? ' ' + signal.unit : ''}: ✗ (${v})`,
  };
}

/**
 * Run all signals for a template against a data object
 * dataObj: { price, changePercent, cot, seasonal, rsi, ... }
 * Returns { score, passed, results[], failedRequired }
 */
export function runTemplate(template, signals, dataObj) {
  const results = [];
  let totalWeight = 0;
  let earnedWeight = 0;
  let failedRequired = false;

  for (const signal of signals) {
    // Get the data value for this signal's metric
    const dataValue = resolveMetric(signal.metric, signal.dataSource, dataObj);
    const eval_ = evaluateSignal(signal, dataValue);

    if (signal.isRequired && !eval_.passed) {
      failedRequired = true;
    }

    totalWeight += signal.weight;
    if (eval_.passed) earnedWeight += signal.weight;

    results.push({
      signalId: signal.id,
      metric: signal.metric,
      dataSource: signal.dataSource,
      ...eval_,
      weight: signal.weight,
      isRequired: signal.isRequired,
      notes: signal.notes,
    });
  }

  const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  const score = Math.round(rawScore);
  const passed = !failedRequired && score >= (template.minScore || 60);

  return { score, passed, failedRequired, results };
}

/**
 * Resolve a metric name to a value from the data object
 * Traders type their metric names freely — we do fuzzy matching
 */
function resolveMetric(metric, dataSource, dataObj) {
  const m = metric.toLowerCase().trim();

  // Price signals
  if (dataSource === 'price' || m.includes('price')) {
    if (m.includes('change') || m.includes('pct') || m.includes('%')) return dataObj.changePercent;
    if (m.includes('52') && m.includes('high')) return dataObj.pct52wHigh;
    if (m.includes('52') && m.includes('low'))  return dataObj.pct52wLow;
    if (m.includes('atr')) return dataObj.atr;
    return dataObj.price;
  }

  // COT signals
  if (dataSource === 'cot' || m.includes('cot')) {
    if (m.includes('commercial') && m.includes('percentile')) return dataObj.cotCommercialPct;
    if (m.includes('commercial') && m.includes('net'))        return dataObj.cotCommercialNet;
    if (m.includes('spec') && m.includes('percentile'))       return dataObj.cotSpecPct;
    if (m.includes('spec') && m.includes('net'))              return dataObj.cotSpecNet;
    if (m.includes('index') || m.includes('score'))           return dataObj.cotIndex;
    if (m.includes('change') || m.includes('week'))          return dataObj.cotWeekChange;
    return dataObj.cotIndex;
  }

  // Seasonal signals
  if (dataSource === 'seasonal' || m.includes('seasonal')) {
    if (m.includes('win') || m.includes('rate'))   return dataObj.seasonalWinRate;
    if (m.includes('score') || m.includes('bias')) return dataObj.seasonalScore;
    if (m.includes('streak'))                       return dataObj.seasonalStreak;
    return dataObj.seasonalScore;
  }

  // Technical signals
  if (dataSource === 'technical' || m.includes('rsi')) {
    if (m.includes('rsi'))  return dataObj.rsi;
    if (m.includes('macd')) return dataObj.macd;
    if (m.includes('volume') || m.includes('vol')) return dataObj.volumeRatio;
    if (m.includes('bb') || m.includes('bollinger')) return dataObj.bbPosition;
    return null;
  }

  // Custom / free-form — try to match against any key
  const keys = Object.keys(dataObj);
  for (const key of keys) {
    if (key.toLowerCase().includes(m) || m.includes(key.toLowerCase())) {
      return dataObj[key];
    }
  }

  return null;
}
