export async function GET() {
  // Major earnings that move index futures
  // Hardcoded with approximate quarterly dates, enriched with expected moves
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const year = now.getFullYear()

  // Approximate earnings months by quarter (these rotate every 3 months)
  // Q1 results: Apr-May | Q2: Jul-Aug | Q3: Oct-Nov | Q4: Jan-Feb
  const earningsMonths = [1, 4, 7, 10] // Feb, May, Aug, Nov (peak earnings months)

  const megaCaps = [
    { ticker: 'NVDA',  name: 'NVIDIA',            sector: 'Tech',     indexImpact: 'EXTREME', typicalMove: '±8%',  notes: 'AI bellwether — moves entire tech sector' },
    { ticker: 'AAPL',  name: 'Apple',             sector: 'Tech',     indexImpact: 'EXTREME', typicalMove: '±5%',  notes: 'Largest S&P component. NQ/ES major mover' },
    { ticker: 'MSFT',  name: 'Microsoft',         sector: 'Tech',     indexImpact: 'HIGH',    typicalMove: '±4%',  notes: 'Azure growth key. Cloud AI narrative' },
    { ticker: 'GOOGL', name: 'Alphabet',          sector: 'Tech',     indexImpact: 'HIGH',    typicalMove: '±5%',  notes: 'Ad revenue + AI search narrative' },
    { ticker: 'META',  name: 'Meta',              sector: 'Tech',     indexImpact: 'HIGH',    typicalMove: '±7%',  notes: 'Ad market health. AI capex closely watched' },
    { ticker: 'AMZN',  name: 'Amazon',            sector: 'Tech',     indexImpact: 'HIGH',    typicalMove: '±5%',  notes: 'AWS cloud + retail margin story' },
    { ticker: 'TSLA',  name: 'Tesla',             sector: 'Auto/Tech',indexImpact: 'HIGH',    typicalMove: '±9%',  notes: 'High beta, volatile. Margin focus' },
    { ticker: 'JPM',   name: 'JPMorgan',          sector: 'Finance',  indexImpact: 'HIGH',    typicalMove: '±3%',  notes: 'Kicks off bank earnings season' },
    { ticker: 'GS',    name: 'Goldman Sachs',     sector: 'Finance',  indexImpact: 'MEDIUM',  typicalMove: '±3%',  notes: 'Trading revenue, investment banking' },
    { ticker: 'BAC',   name: 'Bank of America',   sector: 'Finance',  indexImpact: 'MEDIUM',  typicalMove: '±3%',  notes: 'Rate sensitivity — NIM closely watched' },
    { ticker: 'SPY',   name: 'S&P 500 ETF',       sector: 'Index',    indexImpact: 'N/A',     typicalMove: '—',    notes: 'No earnings — reference benchmark' },
    { ticker: 'NFLX',  name: 'Netflix',           sector: 'Media',    indexImpact: 'MEDIUM',  typicalMove: '±8%',  notes: 'Subscriber growth + ad tier' },
    { ticker: 'AMD',   name: 'AMD',               sector: 'Tech',     indexImpact: 'HIGH',    typicalMove: '±8%',  notes: 'AI chip competition to NVDA' },
    { ticker: 'INTC',  name: 'Intel',             sector: 'Tech',     indexImpact: 'MEDIUM',  typicalMove: '±6%',  notes: 'Turnaround story, manufacturing' },
    { ticker: 'XOM',   name: 'ExxonMobil',        sector: 'Energy',   indexImpact: 'MEDIUM',  typicalMove: '±3%',  notes: 'Crude oil price sensitivity' },
    { ticker: 'V',     name: 'Visa',              sector: 'Finance',  indexImpact: 'MEDIUM',  typicalMove: '±3%',  notes: 'Consumer spending barometer' },
    { ticker: 'UNH',   name: 'UnitedHealth',      sector: 'Health',   indexImpact: 'HIGH',    typicalMove: '±5%',  notes: 'Largest health component, MLR focus' },
    { ticker: 'COST',  name: 'Costco',            sector: 'Retail',   indexImpact: 'MEDIUM',  typicalMove: '±4%',  notes: 'Consumer health and membership trends' },
  ]

  // Figure out next earnings window
  const upcomingMonth = earningsMonths.find(m => m >= now.getMonth()) ?? earningsMonths[0]
  const earningsYear = upcomingMonth < now.getMonth() ? year + 1 : year
  const weeksUntilEarnings = Math.ceil(((new Date(earningsYear, upcomingMonth, 15) - now) / (1000*60*60*24*7)))

  return Response.json({
    companies: megaCaps.filter(c => c.ticker !== 'SPY'),
    nextEarningsSeason: {
      month: new Date(earningsYear, upcomingMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      weeksAway: weeksUntilEarnings,
      note: 'Dates shown are approximate. Always verify exact dates with your broker or earnings calendar.',
    },
    tradingNotes: [
      'ES and NQ futures often move significantly the night of major earnings (after 4pm ET).',
      'Implied volatility (IV) typically crushes after earnings — be cautious with long options.',
      'NVDA, AAPL, and MSFT together represent over 20% of the S&P 500 — their moves are index moves.',
      'Bank earnings (JPM, GS, BAC) in week 1-2 of earnings season often set the tone.',
      'Sector contagion: strong NVDA earnings often lifts AMD, INTC, SMCI, and the whole SOX index.',
    ],
    updatedAt: new Date().toISOString(),
  })
}
