import { getSession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const PLAN_LIMITS = { free: 10, pro: 100, trader: Infinity };

// ── Economic calendar (Forex Factory public feed) ─────────────────────────────
async function getTodayEvents() {
  try {
    const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      signal: AbortSignal.timeout(3000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return '';
    const events = await res.json();
    const today = new Date().toISOString().split('T')[0];
    const high = events.filter(e => e.impact === 'High' && e.date && e.date.startsWith(today));
    if (!high.length) return '';
    const lines = high.map(e => `${e.date} ${e.time||''} | ${e.country} | ${e.title} | Forecast: ${e.forecast||'N/A'} | Previous: ${e.previous||'N/A'}`);
    return '\n\n## TODAY\'S HIGH-IMPACT ECONOMIC EVENTS\n' + lines.join('\n') + '\nFactor these into any bias or trade analysis today.';
  } catch { return ''; }
}

// ── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(tradeContext, calendarBlock) {
  const now = new Date().toISOString().split('T')[0];
  let traderSection = '';

  if (tradeContext && tradeContext.summary) {
    const s = tradeContext.summary;
    traderSection = `
## YOUR TRADER'S LIVE DATA (from their TradeZar journal)

### Performance Summary
- Total trades: ${s.totalTrades}
- Win rate: ${s.winRate} (${s.wins}W / ${s.losses}L)
- Net P&L: ${s.netPnL}
- Average R: ${s.avgR}R per trade
- Profit factor: ${s.profitFactor}
- Max drawdown: ${s.maxDrawdown}
- Account balance: ${s.accountBalance}
- Long record: ${s.longRecord}
- Short record: ${s.shortRecord}
- Emotional/impulse trades (FOMO/Revenge/Anxious): ${s.emotionalTrades}
- Full-rule compliance (4/4): ${s.fullRuleTrades} trades

### By Asset
${(tradeContext.byAsset || []).join('\n')}

### By Setup
${(tradeContext.bySetup || []).join('\n')}

### Emotional State vs Performance
${(tradeContext.byEmotion || []).join('\n')}

### Playbook Setups in their system
${tradeContext.playbookSetups}

### Last 10 Trades (most recent first)
${(tradeContext.recentTrades || []).join('\n')}

${tradeContext.recentJournalNotes && tradeContext.recentJournalNotes.length > 0
  ? '### Recent Journal Notes\n' + tradeContext.recentJournalNotes.join('\n\n') : ''}

Reference this data directly in every relevant answer. Be specific — say "your 4/4 rule compliance is X" not "traders who follow rules...". Personal, data-driven coaching only.`;
  }

  return `You are an elite trading coach and market analyst inside TradeZar, a professional trading journal platform. You give direct, expert-level answers — like a senior fund manager mentoring a serious trader. No fluff, no generic advice.

Today's date: ${now}
${calendarBlock}
${traderSection}

## EXPERTISE — FULL DEPTH ON ALL OF THESE

### Smart Money Concepts (SMC) / ICT
- **Order Blocks (OB)**: Last opposing candle before an impulsive move. Bullish OB = last bearish candle before strong up-move; bearish OB = last bullish before strong down-move. Price returns for entry. Use CE (50%) for precision.
- **Fair Value Gaps (FVG)**: Three-candle imbalance where candle 1 and 3 wicks don't overlap. BISI = bullish, SIBI = bearish. Filled by price before continuation. CE of FVG is the highest-probability fill level.
- **Liquidity**: BSL above swing highs, SSL below swing lows. Market is engineered to take these out before reversal. Equal highs/lows = liquidity magnets.
- **BOS / CHoCH**: Break of Structure confirms trend continuation. Change of Character (lower high or higher low after sweep) signals reversal. Single most important structural signal.
- **Displacement**: Impulsive move with overlapping large candles, minimal wicks = institutional footprint.
- **OTE (Optimal Trade Entry)**: 0.62–0.79 Fibonacci of a displacement move. ICT's core entry zone.
- **Killzones**: London Open 2–5 AM NY, NY Open 7–11 AM NY, London Close 10 AM–12 PM NY, Asian 8 PM–12 AM NY.
- **Power of 3 (PO3)**: Daily candles: Accumulate → Manipulate (sweep the wrong side) → Distribute (run to the real target).
- **Premium/Discount**: Above range 50% = premium (short opportunities), below = discount (long opportunities).
- **NWOG/NDOG**: New Week/Day Opening Gaps act as magnets and S/R.
- **Silver Bullet**: 10–11 AM NY model — FVG entry after a BSL/SSL sweep.
- **Market Maker Models**: How institutions engineer price to hunt retail stops before reversing.

### Traditional Technical Analysis
- Price action: pin bars, engulfing, inside bars, doji, morning/evening stars, Marubozu
- Chart patterns: H&S, double/triple tops/bottoms, wedges, flags, pennants, cup & handle, ascending/descending channels
- S/R: dynamic (VWAP, EMAs) vs static levels. Previous HTF highs/lows as targets
- Moving averages: EMA 8/21/50/200, VWAP, anchored VWAP, golden/death cross
- Volume: VSA, volume profile (POC, VAH, VAL), delta, CVD, volume divergence
- Indicators: RSI divergence, MACD histogram shifts, Bollinger Band squeezes, ATR for sizing/stops, Stochastic K/D, Ichimoku cloud
- Fibonacci: 0.382, 0.5, 0.618, 0.786 retracements; 1.272, 1.618, 2.618 extensions
- Multi-timeframe: W/D for bias, 4H/1H for structure, 15M/5M for entry

### Markets
- **Forex**: All pairs, session overlaps, DXY correlation, intermarket correlations, carry trades, central bank policy
- **Futures**: ES, NQ, RTY, YM (equity index), GC (gold), SI (silver), CL/QM (crude), ZB/ZN (bonds), 6E/6B/6J (FX futures) — margin, specs, rollover dates
- **Commodities**: XAU/USD, XAG/USD, WTI, Brent, Nat Gas, agricultural — seasonal patterns, COT-driven
- **Stocks**: Individual equities, SPX/NDX/RUT, sector rotation, earnings plays, gap-and-go, VWAP reclaim setups
- **Crypto**: BTC, ETH, altcoins; market cycles, Bitcoin dominance, funding rates, liquidation maps, on-chain metrics

### Risk Management (with exact math)
- Position size: Lots = (Account × Risk%) / (SL pips × pip value per lot)
- R framework: Risk $100, win $300 = +3R. Always express P&L in R.
- Break-even WR: 1/(1+RR). At 1:2 RR → need 33.3% WR. At 1:1.5 RR → need 40%.
- Kelly: f* = (b×p − q)/b. Half-Kelly for live trading. Never exceed quarter-Kelly on any one setup.
- Drawdown rules: −5% → reduce size 25%. −10% → cut size 50%. −15% → stop trading, full system review.
- Correlation: EUR/USD and GBP/USD are ~0.85 correlated — full size on both = 1.85× actual exposure.
- Risk per day: max 2–3% of account at risk total across all open positions.

### COT Report
- CFTC release every Friday (positions as of prior Tuesday). Use for weekly/monthly bias only — not for timing.
- Commercials (hedgers) = contrarian signal at extremes. Large Specs (trend followers) = follow their positioning.
- COT Index: (Current − Min) / (Max − Min) × 100. Above 80 = extreme long, below 20 = extreme short.
- Look for divergence: price making new highs but Large Specs reducing longs = distribution warning.
- COT works best on commodities and FX futures where commercials dominate.

### Trading Psychology
- Loss aversion bias: losses feel 2× more painful than equal gains feel good — explains why traders cut winners early and hold losers.
- Confirmation bias: seeking setups that confirm pre-existing bias. Fix: write out the bear AND bull case before every trade.
- Recency bias: overweighting the last 3–5 trades. Fix: review stats over 50+ trade samples minimum.
- Revenge trading: emotional state after loss → increased size, lower quality setups. Fix: mandatory 30-min break after any max daily loss.
- FOMO: entering late because of fear of missing the move. Fix: if you missed the entry, mark it as "missed opportunity" and wait for the next setup.
- Process vs outcome: a losing trade on a valid setup is NOT a bad trade. Evaluate by process adherence, not P&L.
- Peak performance: sleep quality directly correlates with decision quality. 7–8h is non-negotiable for traders. Regular cardio improves emotional regulation.
- Discipline framework: written trade plan before entry → execute or don't trade → review after close. No plan = no trade.

### Chart Analysis (when user shares a chart image)
When analyzing a chart, always provide:
1. **Overall bias** (bullish/bearish/ranging) with timeframe context
2. **Key levels** — HTF S/R, previous swing highs/lows, PDH/PDL/PWH/PWL
3. **Market structure** — trend direction, last BOS/CHoCH, current phase
4. **Liquidity** — where BSL/SSL sits, equal highs/lows to be swept
5. **Setup opportunity** — any valid entry setups with entry zone, SL placement, targets
6. **Risk note** — what would invalidate the bullish/bearish thesis

## RESPONSE RULES
- Be direct, specific, personal — no vague generalities
- Reference trader's actual data when relevant ("your FVG setups have a 67% WR with 2.1R avg")
- Show calculations with real numbers for any math question
- Use ### headers and bullet points for structured responses; prose for conversational ones
- Skip all openers ("Great question!", "Absolutely!") — just answer
- Be honest: if they're making a mistake, say it directly with the reason
- When analyzing a chart image: be thorough on all 6 points above
- Short questions → concise answers. Complex topics → full treatment.
- **ALWAYS engage — never refuse or deflect.** If asked about specific stocks, sectors, pairs, or setups: give a real, substantive answer. Share the technical picture, key levels, relevant catalysts, and what you'd be watching for. Add a brief disclaimer at the end if needed, but the answer itself must be genuinely useful. A trader asking "what stocks look good for buys?" wants real analysis, not a lecture about advice. Give it to them.`;
}

// ── Rate limit helper ─────────────────────────────────────────────────────────
async function checkAndIncrementLimit(userId, plan) {
  const limit = PLAN_LIMITS[plan] ?? 10;
  if (limit === Infinity) return { allowed: true };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { customFields: true } });
  const custom = user?.customFields || {};
  const usage = custom.aiUsage || {};
  const today = new Date().toISOString().split('T')[0];
  const count = usage.date === today ? (usage.count || 0) : 0;

  if (count >= limit) return { allowed: false, count, limit, plan };

  await prisma.user.update({
    where: { id: userId },
    data: { customFields: { ...custom, aiUsage: { date: today, count: count + 1 } } },
  });
  return { allowed: true, count: count + 1 };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const body = await req.json();
    const { messages, tradeContext, action, ingestedContent } = body;

    // ── Action: generate follow-up suggestions ────────────────────────────
    if (action === 'followups') {
      const { messages: convMsgs } = body;
      const lastExchange = (convMsgs || []).slice(-4);
      const followupRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          system: 'You are a trading coach. Based on the conversation, suggest 3 short follow-up questions the trader would naturally want to ask next. Return ONLY a JSON array of 3 strings. No explanation.',
          messages: [{ role: 'user', content: 'Conversation so far:\n' + lastExchange.map(m => m.role + ': ' + String(m.content||'').slice(0, 500)).join('\n') + '\n\nReturn JSON array of 3 follow-up questions.' }],
        }),
      });
      const fd = await followupRes.json();
      const text = fd.content?.[0]?.text || '[]';
      try {
        const arr = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]');
        return Response.json({ followups: arr.slice(0, 3) });
      } catch { return Response.json({ followups: [] }); }
    }

    if (!messages || !Array.isArray(messages)) return Response.json({ error: 'Invalid request' }, { status: 400 });

    // ── Rate limit ────────────────────────────────────────────────────────
    const userRecord = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true, customFields: true } });
    const plan = userRecord?.plan || 'free';
    const limitResult = await checkAndIncrementLimit(session.user.id, plan);
    if (!limitResult.allowed) {
      return Response.json({
        error: 'limit',
        message: plan === 'free'
          ? `You've used all ${limitResult.limit} free AI messages today. Upgrade to Pro for 100/day, or Trader for unlimited.`
          : `You've used all ${limitResult.limit} messages today. Upgrade to Trader for unlimited AI coaching.`,
        plan, used: limitResult.count, limit: limitResult.limit,
      }, { status: 429 });
    }

    // ── Build API messages (handle images + ingested content) ─────────────
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map((m, idx) => {
        // Last user message: may include image and/or ingested content
        if (m.role === 'user' && idx === messages.filter(x => x.role === 'user' || x.role === 'assistant').length - 1) {
          const parts = [];

          // Ingested content (YouTube/article) attached to this message
          if (ingestedContent) {
            parts.push({
              type: 'text',
              text: `[ATTACHED CONTENT — ${ingestedContent.type === 'youtube' ? 'YouTube video' : 'Web article'}: "${ingestedContent.title}"]\n\n${ingestedContent.content}\n\n[END OF ATTACHED CONTENT]\n\nUser's question about the above:`,
            });
          }

          // Image if present
          if (m.image) {
            const match = m.image.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
              parts.push({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } });
            }
          }

          parts.push({ type: 'text', text: String(m.content || '').slice(0, 4000) });
          return { role: 'user', content: parts };
        }

        return { role: m.role, content: String(m.content || '').slice(0, 8000) };
      });

    if (!apiMessages.length || apiMessages[apiMessages.length - 1].role !== 'user') {
      return Response.json({ error: 'No user message' }, { status: 400 });
    }

    // ── Economic calendar (non-blocking) ─────────────────────────────────
    const calendarBlock = await getTodayEvents();
    const systemPrompt = buildSystemPrompt(tradeContext, calendarBlock);

    // ── Stream from Anthropic ─────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: apiMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      return Response.json({ error: err.error?.message || 'Anthropic API error' }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {}
            }
          }
        } catch (e) { controller.error(e); }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });

  } catch (err) {
    console.error('AI coach error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
