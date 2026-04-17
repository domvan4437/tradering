
/**
 * Competition Trade Validator
 * Checks all tournament rules before allowing a trade call to score
 */

export const TRADER_STYLES = {
  scalper:    { label: 'Scalper',        minHours: 0,    maxHours: 1,    description: 'Under 1 hour holds' },
  daytrader:  { label: 'Day Trader',     minHours: 1,    maxHours: 24,   description: 'Same-session trades' },
  swing:      { label: 'Swing Trader',   minHours: 48,   maxHours: 240,  description: '2–10 day holds' },
  position:   { label: 'Position Trader',minHours: 240,  maxHours: 1344, description: '2–8 week holds' },
  macro:      { label: 'Macro Trader',   minHours: 1344, maxHours: 99999,description: '2+ month holds' },
};

export const STYLE_DEFAULT_DURATION = {
  scalper:    { tournamentDays: 7,   label: '7-day sprint' },
  daytrader:  { tournamentDays: 14,  label: '14-day sprint' },
  swing:      { tournamentDays: 45,  label: '45-day competition' },
  position:   { tournamentDays: 90,  label: '90-day competition' },
  macro:      { tournamentDays: 180, label: '6-month competition' },
};

/**
 * Validate a trade call against tournament rules.
 * Returns { valid: boolean, reason: string | null }
 */
export function validateTradeCall(tradeCall, tournament) {
  const rules = [];

  // 1. Hold time check (only if trade is closed)
  if (tradeCall.closeTimestamp && tradeCall.entryTimestamp) {
    const holdMs = new Date(tradeCall.closeTimestamp) - new Date(tradeCall.entryTimestamp);
    const holdHours = holdMs / (1000 * 60 * 60);

    if (tournament.minHoldHours && holdHours < tournament.minHoldHours) {
      return {
        valid: false,
        reason: `Trade held only ${holdHours.toFixed(1)}h — minimum is ${tournament.minHoldHours}h for this competition.`
      };
    }
    if (tournament.maxHoldHours && holdHours > tournament.maxHoldHours) {
      return {
        valid: false,
        reason: `Trade held ${holdHours.toFixed(1)}h — maximum is ${tournament.maxHoldHours}h for this competition.`
      };
    }
  }

  // 2. Stop loss required
  if (tournament.requireStopLoss && !tradeCall.stopLoss) {
    return { valid: false, reason: 'This competition requires a stop loss on every trade.' };
  }

  // 3. Target required
  if (tournament.requireTarget && !tradeCall.takeProfit) {
    return { valid: false, reason: 'This competition requires a take profit target on every trade.' };
  }

  // 4. Minimum R:R check
  if (tournament.minRiskReward && tradeCall.riskReward) {
    if (tradeCall.riskReward < tournament.minRiskReward) {
      return {
        valid: false,
        reason: `R:R of ${tradeCall.riskReward.toFixed(2)} is below the ${tournament.minRiskReward} minimum for this competition.`
      };
    }
  }

  // 5. Max risk % check
  if (tournament.maxRiskPct && tradeCall.riskPct) {
    if (tradeCall.riskPct > tournament.maxRiskPct) {
      return {
        valid: false,
        reason: `Risk of ${tradeCall.riskPct}% exceeds the ${tournament.maxRiskPct}% maximum for this competition.`
      };
    }
  }

  // 6. Allowed assets check
  if (tournament.allowedAssets) {
    const allowed = JSON.parse(tournament.allowedAssets);
    if (allowed.length > 0 && !allowed.includes(tradeCall.commodity)) {
      return {
        valid: false,
        reason: `${tradeCall.commodity} is not an allowed asset in this competition. Allowed: ${allowed.join(', ')}`
      };
    }
  }

  return { valid: true, reason: null };
}

/**
 * Check weekly trade count for a user in a tournament.
 * Returns { allowed: boolean, count: number, max: number }
 */
export function checkWeeklyTradeLimit(existingCalls, tournament) {
  if (!tournament.maxTradesPerWeek) return { allowed: true, count: 0, max: null };

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCalls = existingCalls.filter(c =>
    new Date(c.createdAt) > oneWeekAgo && c.validationStatus !== 'disqualified'
  );

  return {
    allowed: thisWeekCalls.length < tournament.maxTradesPerWeek,
    count: thisWeekCalls.length,
    max: tournament.maxTradesPerWeek
  };
}

/**
 * Calculate R:R from entry, stop, target
 */
export function calculateRR(entry, stopLoss, takeProfit, direction) {
  if (!entry || !stopLoss || !takeProfit) return null;
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk === 0) return null;
  return parseFloat((reward / risk).toFixed(2));
}
