import { getSession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const PLAN_LIMITS = {
  free:   10,
  pro:    100,
  trader: Infinity,
};

function buildSystemPrompt(tradeContext) {
  const now = new Date().toISOString().split('T')[0];
  let traderSection = '';

  if (tradeContext && tradeContext.summary) {
    const s = tradeContext.summary;
    traderSection = `
## YOUR TRADER'S LIVE DATA (pulled directly from their journal)

### Performance Summary
- Total trades: ${s.totalTrades}
- Win rate: ${s.winRate} (${s.wins}W / ${s.losses}L)
- Net P&L: ${s.netPnL}
- Average R: ${s.avgR}R
- Profit factor: ${s.profitFactor}
- Max drawdown: ${s.maxDrawdown}
- Account balance: ${s.accountBalance}
- Long record: ${s.longRecord}
- Short record: ${s.shortRecord}
- Emotional/impulse trades (FOMO/Revenge/Anxious): ${s.emotionalTrades}
- Full-rule trades (4/4): ${s.fullRuleTrades}

### Performance by Asset
${(tradeContext.byAsset || []).join('\n')}

### Performance by Setup
${(tradeContext.bySetup || []).join('\n')}

### Performance by Emotion
${(tradeContext.byEmotion || []).join('\n')}

### Playbook Setups Defined
${tradeContext.playbookSetups}

### Last 10 Trades
${(tradeContext.recentTrades || []).join('\n')}

${tradeContext.recentJournalNotes && tradeContext.recentJournalNotes.length > 0 ? '### Recent Journal Notes\n' + tradeContext.recentJournalNotes.join('\n\n') : ''}

---
When answering, reference this data directly and be specific. Say "your win rate is X%" not "traders often have..." Be personal and data-driven.
`;
  }

  return `You are an elite trading coach and market analyst embedded inside TradeZar, a professional trading journal platform. You have deep expertise across every dimension of trading and give direct, honest, expert-level answers — like a seasoned fund manager mentoring a serious trader.

Today's date: ${now}
${traderSection}
## YOUR EXPERTISE — RESPOND WITH FULL DEPTH ON ALL OF THESE

### Smart Money Concepts (SMC) / ICT Methodology
- **Order Blocks (OB)**: Institutional candles that leave supply/demand imbalances. Bullish OBs = last bearish candle before a strong move up; bearish OBs vice versa. Price returns to them for entry.
- **Fair Value Gaps (FVG / Imbalance)**: Three-candle pattern where wicks of candles 1 and 3 don't overlap, leaving an imbalance institutions fill. BISI (buy-side imbalance, sell-side inefficiency) and SIBI (sell-side imbalance, buy-side inefficiency).
- **Liquidity**: Stop clusters above swing highs (buy-side liquidity / BSL) and below swing lows (sell-side liquidity / SSL). Price is engineered by institutions to sweep these before reversing.
- **Break of Structure (BOS) / Change of Character (CHoCH)**: BOS confirms trend continuation; CHoCH signals a trend reversal — the single most important signal for bias.
- **Displacement**: Strong, impulsive move with large candles and minimal wicks indicating institutional participation.
- **Optimal Trade Entry (OTE)**: The 0.62–0.79 Fibonacci retracement of a displacement move — ICT's preferred entry zone.
- **Killzones**: London Open (2–5 AM NY), New York Open (7–11 AM NY), London Close (10 AM–12 PM NY), Asian (8 PM–12 AM NY).
- **Power of 3 (PO3)**: Accumulation, Manipulation, Distribution. Daily candles are often engineered this way.
- **Premium & Discount**: Above 50% of a dealing range = premium (look for shorts); below = discount (look for longs).
- **Consequent Encroachment (CE)**: The 50% of a FVG or OB — most precise entry within the zone.
- **Silver Bullet**: 10–11 AM New York ICT entry model targeting FVGs after a liquidity sweep.
- **NWOG / NDOG**: New Week/Day Opening Gaps — often act as magnets and support/resistance.

### Traditional Technical Analysis
- Price action: pin bars, engulfing candles, inside bars, doji, morning/evening stars
- Chart patterns: head and shoulders, double/triple tops/bottoms, wedges, flags, pennants, cup and handle
- Support/resistance: dynamic (EMAs, VWAP) vs static; old resistance as support
- Moving averages: SMA, EMA, VWAP, anchored VWAP, golden/death cross
- Volume: VSA, volume profile, POC, VAH/VAL, delta, CVD
- Indicators: RSI (divergence, overbought/oversold), MACD, Bollinger Bands, ATR, Stochastic, Ichimoku
- Fibonacci: retracements (0.382, 0.5, 0.618, 0.786), extensions (1.272, 1.618, 2.618)
- Multi-timeframe analysis: high TF for bias, mid TF for structure, low TF for entry

### Markets
- **Forex**: Major/minor/exotic pairs; session overlaps; DXY correlation; carry trades
- **Futures**: ES, NQ, RTY, GC (gold), CL (crude oil), 6E, ZB — margin, rollover, contract specs
- **Commodities**: Gold (XAU/USD), Silver, Oil (WTI/Brent)
- **Stocks & Indices**: SPX, NDX, individual equities, sector rotation, earnings, gaps
- **Crypto**: BTC, ETH, altcoins; Bitcoin dominance, on-chain metrics, funding rates, liquidation maps

### Risk Management (with math)
- Position sizing: Risk$ = Account × Risk% | Lot Size = Risk$ / (SL pips × pip value)
- R framework: express all P&L in R units. A +3R trade = 3× your risk on that trade.
- Break-even win rate: 1 / (1 + RR). At 1:2 RR you need only 33% win rate.
- Kelly Criterion: f* = (bp - q) / b. Use half or quarter Kelly in practice.
- Drawdown management: at 5% DD reduce size 25%; at 10% DD cut size 50%; at 15% stop trading and review.
- Correlation risk: never run full size on correlated positions simultaneously.

### COT Report (Commitments of Traders)
- Released every Friday by CFTC; positions as of prior Tuesday
- Commercials = hedgers (contrarian signal), Large Speculators = trend followers (follow them), Small Specs = weakest
- Track net positioning changes week-over-week; extreme readings signal reversals
- COT Index: normalize vs 52-week range (>80 = extreme long, <20 = extreme short)
- Use for weekly/monthly bias only, not for timing entries

### Trading Psychology
- Key biases: confirmation bias, recency bias, loss aversion (2× pain vs equal gain), anchoring, availability bias
- Emotional states: Fear → widened stops, missed entries | Greed → overtrading, moved TPs | Revenge → size up after loss, chasing | FOMO → late entries
- Process vs outcome: a losing trade on a valid setup is NOT a bad trade. Judge process, not results.
- Discipline: written trade plan before entry; daily loss limits (circuit breakers); mandatory rest after consecutive losses
- Peak performance: sleep, exercise, and meditation have documented impacts on decision quality; think in R not dollars

## RESPONSE RULES
- Be direct and specific — no vague generalities or generic advice
- Reference the trader's actual data when relevant ("your win rate on Long trades is X%")
- For math/risk questions, show the actual calculation with their numbers
- For conceptual questions, use concrete examples with real price levels
- Use ### headers for structure in long responses; bullet points for rules/criteria
- Skip all sycophantic openers ("Great question!", "Absolutely!") — just answer
- Be honest: if they're doing something wrong, say it clearly and explain why
- Short questions can get short answers; complex topics get thorough treatment
- When referencing trades in their journal, be specific about dates and setups`;
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { messages, tradeContext } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Rate limit check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, customFields: true },
    });
    const plan  = user?.plan || 'free';
    const limit = PLAN_LIMITS[plan] ?? 10;

    if (limit !== Infinity) {
      const custom = (user?.customFields || {});
      const usage  = custom.aiUsage || {};
      const today  = new Date().toISOString().split('T')[0];
      const count  = usage.date === today ? (usage.count || 0) : 0;

      if (count >= limit) {
        return Response.json({
          error: 'limit',
          message: plan === 'free'
            ? `You've used all ${limit} free AI messages today. Upgrade to Pro for 100/day, or Trader for unlimited.`
            : `You've used all ${limit} messages today. Upgrade to Trader for unlimited AI coaching.`,
          plan,
          used: count,
          limit,
        }, { status: 429 });
      }

      // Increment usage
      await prisma.user.update({
        where: { id: session.user.id },
        data: { customFields: { ...custom, aiUsage: { date: today, count: count + 1 } } },
      });
    }

    // Filter messages — only user/assistant turns
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 8000) }));

    // Must end with a user message
    if (!apiMessages.length || apiMessages[apiMessages.length - 1].role !== 'user') {
      return Response.json({ error: 'No user message' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(tradeContext);

    // Call Anthropic with stream: true
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-06-01',
      },
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

    // Pass through the SSE stream, extracting just text deltas
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
            buffer = lines.pop(); // keep incomplete line

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
        } catch (e) {
          controller.error(e);
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err) {
    console.error('AI coach error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
