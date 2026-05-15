const fs = require("fs");
const content = "'use client'
import React, { useState, useEffect } from 'react'

const INDICES = [
  { label: 'S&P 500',     symbol: 'ES=F'  },
  { label: 'Nasdaq 100',  symbol: 'NQ=F'  },
  { label: 'Dow Jones',   symbol: 'YM=F'  },
  { label: 'Russell 2000',symbol: 'RTY=F' },
  { label: 'VIX',         symbol: '^VIX'  },
]

const SECTOR_GROUPS = [
  { name: 'Technology', etf: 'XLK', etfPct: +2.1, pill: { bg: '#eeedfe', color: '#3C3489' }, stocks: [
    { symbol: 'NVDA',  name: 'NVIDIA',        cap: '$2.8T' },
    { symbol: 'AAPL',  name: 'Apple',          cap: '$3.1T' },
    { symbol: 'MSFT',  name: 'Microsoft',      cap: '$3.0T' },
    { symbol: 'GOOGL', name: 'Alphabet',       cap: '$2.4T' },
    { symbol: 'META',  name: 'Meta Platforms', cap: '$1.6T' },
    { symbol: 'AVGO',  name: 'Broadcom',       cap: '$820B' },
    { symbol: 'AMD',   name: 'AMD',            cap: '$289B' },
    { symbol: 'INTC',  name: 'Intel',          cap: '$137B' },
    { symbol: 'CRM',   name: 'Salesforce',     cap: '$302B' },
    { symbol: 'ORCL',  name: 'Oracle',         cap: '$388B' },
  ]},
  { name: 'Financials', etf: 'XLF', etfPct: +0.8, pill: { bg: '#e1f5ee', color: '#085041' }, stocks: [
    { symbol: 'JPM',  name: 'JPMorgan Chase',  cap: '$714B' },
    { symbol: 'V',    name: 'Visa',            cap: '$688B' },
    { symbol: 'MA',   name: 'Mastercard',      cap: '$458B' },
    { symbol: 'BAC',  name: 'Bank of America', cap: '$348B' },
    { symbol: 'GS',   name: 'Goldman Sachs',   cap: '$162B' },
    { symbol: 'WFC',  name: 'Wells Fargo',     cap: '$208B' },
    { symbol: 'MS',   name: 'Morgan Stanley',  cap: '$148B' },
    { symbol: 'BLK',  name: 'BlackRock',       cap: '$122B' },
  ]},
  { name: 'Healthcare', etf: 'XLV', etfPct: +0.6, pill: { bg: '#fcebeb', color: '#791F1F' }, stocks: [
    { symbol: 'LLY',  name: 'Eli Lilly',         cap: '$771B' },
    { symbol: 'UNH',  name: 'UnitedHealth',       cap: '$480B' },
    { symbol: 'JNJ',  name: 'Johnson & Johnson',  cap: '$383B' },
    { symbol: 'ABBV', name: 'AbbVie',             cap: '$333B' },
    { symbol: 'MRK',  name: 'Merck',              cap: '$325B' },
    { symbol: 'PFE',  name: 'Pfizer',             cap: '$161B' },
    { symbol: 'TMO',  name: 'Thermo Fisher',      cap: '$212B' },
  ]},
  { name: 'Consumer', etf: 'XLY', etfPct: -0.3, pill: { bg: '#faeeda', color: '#633806' }, stocks: [
    { symbol: 'AMZN', name: 'Amazon',      cap: '$2.8T' },
    { symbol: 'TSLA', name: 'Tesla',       cap: '$1.4T' },
    { symbol: 'WMT',  name: 'Walmart',     cap: '$778B' },
    { symbol: 'COST', name: 'Costco',      cap: '$396B' },
    { symbol: 'HD',   name: 'Home Depot',  cap: '$385B' },
    { symbol: 'PG',   name: 'P&G',         cap: '$397B' },
    { symbol: 'NFLX', name: 'Netflix',     cap: '$269B' },
    { symbol: 'NKE',  name: 'Nike',        cap: '$133B' },
    { symbol: 'MCD',  name: \"McDonald's\",  cap: '$212B' },
  ]},
  { name: 'Energy', etf: 'XLE', etfPct: +1.4, pill: { bg: '#eaf3de', color: '#27500A' }, stocks: [
    { symbol: 'XOM', name: 'ExxonMobil',    cap: '$450B' },
    { symbol: 'CVX', name: 'Chevron',       cap: '$288B' },
    { symbol: 'COP', name: 'ConocoPhillips',cap: '$139B' },
    { symbol: 'SLB', name: 'Schlumberger',  cap: '$63B'  },
    { symbol: 'EOG', name: 'EOG Resources', cap: '$71B'  },
  ]},
  { name: 'Industrials', etf: 'XLI', etfPct: +1.2, pill: { bg: '#f1efe8', color: '#444441' }, stocks: [
    { symbol: 'CAT', name: 'Caterpillar', cap: '$195B' },
    { symbol: 'BA',  name: 'Boeing',      cap: '$122B' },
    { symbol: 'HON', name: 'Honeywell',   cap: '$138B' },
    { symbol: 'UPS', name: 'UPS',         cap: '$122B' },
    { symbol: 'RTX', name: 'RTX Corp',    cap: '$155B' },
    { symbol: 'DE',  name: 'Deere & Co',  cap: '$112B' },
  ]},
]

const EARNINGS_DATA = {
  GOOGL: { date: 'Apr 29', time: 'AC', urgency: 'week',     estEps: '$1.84', estRev: '$89.1B',  expMove: '\u00b16.2%',  lastQtr: { label: 'Beat +9%',  type: 'beat'   }, note: 'Cloud and YouTube revenue key. Last 4 qtrs: beat, beat, beat, miss.' },
  META:  { date: 'Apr 30', time: 'AC', urgency: 'week',     estEps: '$4.68', estRev: '$36.2B',  expMove: '\u00b18.4%',  lastQtr: { label: 'Beat +12%', type: 'beat'   }, note: 'AI ad revenue and cost discipline key. Beat 5 of last 6 quarters.' },
  MSFT:  { date: 'Apr 30', time: 'AC', urgency: 'week',     estEps: '$3.22', estRev: '$68.4B',  expMove: '\u00b15.1%',  lastQtr: { label: 'Beat +7%',  type: 'beat'   }, note: 'Azure cloud growth % is the key number. Consensus expects 28% growth.' },
  AAPL:  { date: 'May 1',  time: 'AC', urgency: 'month',    estEps: '$1.61', estRev: '$94.2B',  expMove: '\u00b14.3%',  lastQtr: { label: 'In-line',   type: 'inline' }, note: 'iPhone 16 cycle and China sales key. Services revenue expected $24.1B.' },
  AMZN:  { date: 'May 1',  time: 'AC', urgency: 'month',    estEps: '$1.36', estRev: '$142.5B', expMove: '\u00b17.1%',  lastQtr: { label: 'Beat +14%', type: 'beat'   }, note: 'AWS cloud growth and operating margin key. Beat last 6 quarters straight.' },
  NVDA:  { date: 'May 28', time: 'AC', urgency: 'month',    estEps: '$0.89', estRev: '$24.6B',  expMove: '\u00b19.8%',  lastQtr: { label: 'Beat +18%', type: 'beat'   }, note: 'Blackwell GPU demand is the only number that matters.' },
  JPM:   { date: 'Apr 11', time: 'BO', urgency: 'reported', estEps: '$4.61', actEps: '$5.07',   surprise: { label: 'Beat +10%', type: 'beat' }, reaction: '+4.8%', reactionUp: true,  note: 'Record Q1 revenue. Net interest income beat on strong loan growth.' },
  TSLA:  { date: 'Apr 22', time: 'AC', urgency: 'reported', estEps: '$0.62', actEps: '$0.45',   surprise: { label: 'Miss -27%', type: 'miss' }, reaction: '-8.2%', reactionUp: false, note: 'Gross margin compressed to 17.4%. Deliveries down 9% YoY.' },
  WFC:   { date: 'Apr 11', time: 'BO', urgency: 'reported', estEps: '$1.23', actEps: '$1.39',   surprise: { label: 'Beat +13%', type: 'beat' }, reaction: '+2.1%', reactionUp: true,  note: 'Net interest income held up better than feared. Loan losses in line.' },
}

const SEARCH_MOCK = {
  SHOP: { name: 'Shopify',   price: '$74.22',  pct: +2.1, date: 'May 8',  time: 'BO', urgency: 'month', estEps: '$0.21', estRev: '$2.33B', expMove: '\u00b111.2%', lastQtr: { label: 'Beat +16%', type: 'beat' }, note: 'GMV growth and merchant count key.' },
  ROKU: { name: 'Roku',      price: '$62.14',  pct: -1.2, date: 'May 2',  time: 'AC', urgency: 'month', estEps: '-$0.22',estRev: '$880M',  expMove: '\u00b112.4%', lastQtr: { label: 'Beat +8%',  type: 'beat' }, note: 'Active account growth and ARPU are the key metrics.' },
  SNOW: { name: 'Snowflake', price: '$148.33', pct: +3.4, date: 'May 21', time: 'AC', urgency: 'month', estEps: '$0.16', estRev: '$850M',  expMove: '\u00b114.1%', lastQtr: { label: 'Miss -4%',  type: 'miss' }, note: 'Product revenue growth rate key.' },
  PLTR: { name: 'Palantir',  price: '$24.88',  pct: +1.8, date: 'May 5',  time: 'AC', urgency: 'month', estEps: '$0.08', estRev: '$612M',  expMove: '\u00b19.2%',  lastQtr: { label: 'Beat +22%', type: 'beat' }, note: 'US commercial growth and AIP adoption key.' },
}

const SECTORS_LIST = [
  { name: 'Technology',    symbol: 'XLK'  },
  { name: 'Energy',        symbol: 'XLE'  },
  { name: 'Financials',    symbol: 'XLF'  },
  { name: 'Healthcare',    symbol: 'XLV'  },
  { name: 'Consumer Disc', symbol: 'XLY'  },
  { name: 'Industrials',   symbol: 'XLI'  },
  { name: 'Materials',     symbol: 'XLB'  },
  { name: 'Utilities',     symbol: 'XLU'  },
  { name: 'Real Estate',   symbol: 'XLRE' },
  { name: 'Comm Services', symbol: 'XLC'  },
  { name: 'Cons Staples',  symbol: 'XLP'  },
]

const KEY_LEVELS = [
  { name: 'S&P 500 (ES)',    support: '5,100', resistance: '5,500', pivot: '5,300', note: 'Watch 200-day MA near 5,200' },
  { name: 'Nasdaq 100 (NQ)', support: '17,500', resistance: '19,500', pivot: '18,500', note: 'Tech earnings driving volatility' },
  { name: 'Dow Jones (YM)',  support: '38,500', resistance: '41,000', pivot: '39,750', note: 'Financials sector key driver' },
  { name: 'Russell 2000',    support: '1,900', resistance: '2,100', pivot: '2,000', note: 'Rate-sensitive \u2014 watch Fed signals' },
]

function usePrices(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/prices?symbols=${symbols.join(',')}`)
      .then(r => r.json())
      .then(d => { setPrices(d || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [symbols.join(',')])
  return { prices, loading }
}

const TH = { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '5px 8px', borderBottom: '0.5px solid var(--border)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }
const TD = { fontSize: 12, padding: '5px 8px', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' }

function EarnBadge({ type, label }) {
  const map = { beat: { bg: 'rgba(22,163,74,0.1)', color: '#15803d' }, miss: { bg: 'rgba(220,38,38,0.09)', color: '#991b1b' }, inline: { bg: 'rgba(186,117,23,0.1)', color: '#633806' } }
  const st = map[type] || map.inline
  return <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: st.bg, color: st.color }}>{label}</span>
}

function EarnRow({ data }) {
  const isRep = data.urgency === 'reported'
  return (
    <tr>
      <td colSpan={7} style={{ padding: '10px 16px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
          {isRep ? 'Reported ' : 'Reports '}{data.date} \u00b7 {data.time}
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 6 }}>
          {!isRep ? (
            <>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</div><div style={{ fontSize: 12, fontWeight: 500 }}>{data.estEps}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est Revenue</div><div style={{ fontSize: 12, fontWeight: 500 }}>{data.estRev}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expected move</div><div style={{ fontSize: 12, fontWeight: 500, color: '#4B44C8' }}>{data.expMove}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last quarter</div><div style={{ marginTop: 2 }}><EarnBadge type={data.lastQtr.type} label={data.lastQtr.label} /></div></div>
            </>
          ) : (
            <>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</div><div style={{ fontSize: 12, fontWeight: 500 }}>{data.estEps}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actual EPS</div><div style={{ fontSize: 12, fontWeight: 500, color: data.reactionUp ? 'var(--green)' : 'var(--red)' }}>{data.actEps}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Surprise</div><div style={{ marginTop: 2 }}><EarnBadge type={data.surprise.type} label={data.surprise.label} /></div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock reaction</div><div style={{ fontSize: 12, fontWeight: 500, color: data.reactionUp ? 'var(--green)' : 'var(--red)' }}>{data.reactionUp ? '\u25b2' : '\u25bc'} {data.reaction}</div></div>
            </>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{data.note}</div>
      </td>
    </tr>
  )
}

function EarningsPanel({ watchlist, onAddWatchlist }) {
  const [query, setQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [notFound, setNotFound] = useState(false)

  function handleSearch() {
    const q = query.trim().toUpperCase()
    if (!q) return
    if (EARNINGS_DATA[q]) { setSearchResult({ sym: q, data: EARNINGS_DATA[q] }); setNotFound(false) }
    else if (SEARCH_MOCK[q]) { setSearchResult({ sym: q, data: SEARCH_MOCK[q] }); setNotFound(false) }
    else { setSearchResult(null); setNotFound(true) }
  }

  const weekItems     = Object.entries(EARNINGS_DATA).filter(([, d]) => d.urgency === 'week')
  const monthItems    = Object.entries(EARNINGS_DATA).filter(([, d]) => d.urgency === 'month')
  const reportedItems = Object.entries(EARNINGS_DATA).filter(([, d]) => d.urgency === 'reported')

  function SHdr({ label, color }) {
    return <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}><span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{label}</span></div>
  }

  function EItem({ sym, data, isSearch }) {
    const isRep = data.urgency === 'reported'
    const dateColor = data.urgency === 'week' ? '#791F1F' : data.urgency === 'month' ? '#3C3489' : 'var(--text-muted)'
    const dateBg    = data.urgency === 'week' ? 'rgba(220,38,38,0.09)' : data.urgency === 'month' ? 'rgba(75,68,200,0.1)' : 'var(--surface2)'
    return (
      <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)', background: isSearch ? 'rgba(75,68,200,0.03)' : 'transparent', borderLeft: isSearch ? '2px solid #4B44C8' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{sym}</span>
          {data.name && <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{data.name}</span>}
          {!data.name && <span style={{ flex: 1 }} />}
          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: dateBg, color: dateColor, whiteSpace: 'nowrap' }}>{data.date} \u00b7 {data.time}</span>
          {isSearch && <button onClick={() => onAddWatchlist(sym)} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, border: '0.5px solid #4B44C8', background: 'transparent', color: '#4B44C8', cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>+ Watchlist</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          {!isRep ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</span><span style={{ fontSize: 11, fontWeight: 500 }}>{data.estEps}</span></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est Rev</span><span style={{ fontSize: 11, fontWeight: 500 }}>{data.estRev}</span></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exp move</span><span style={{ fontSize: 11, fontWeight: 500, color: '#4B44C8' }}>{data.expMove}</span></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last qtr</span><EarnBadge type={data.lastQtr.type} label={data.lastQtr.label} /></div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</span><span style={{ fontSize: 11, fontWeight: 500 }}>{data.estEps}</span></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actual EPS</span><span style={{ fontSize: 11, fontWeight: 500, color: data.reactionUp ? 'var(--green)' : 'var(--red)' }}>{data.actEps}</span></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Surprise</span><EarnBadge type={data.surprise.type} label={data.surprise.label} /></div>
              <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}><span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reaction</span><span style={{ fontSize: 11, fontWeight: 500, color: data.reactionUp ? 'var(--green)' : 'var(--red)' }}>{data.reactionUp ? '\u25b2' : '\u25bc'} {data.reaction}</span></div>
            </>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{data.note}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', height: '100%' }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--border)', background: 'var(--surface2)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Earnings intelligence</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
          Beat rate: <span style={{ color: 'var(--green)', fontWeight: 500 }}>74%</span> \u00b7 Avg surprise: <span style={{ color: 'var(--green)', fontWeight: 500 }}>+8.2%</span> \u00b7 142 remaining
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none' }}>\u2315</span>
            <input value={query} onChange={e => { setQuery(e.target.value); setNotFound(false) }} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder=\"Any ticker \u2014 SHOP, SNOW...\" style={{ width: '100%', height: 26, padding: '0 7px 0 22px', border: '0.5px solid var(--border2)', borderRadius: 5, background: 'var(--surface)', fontSize: 10, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)', boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleSearch} style={{ height: 26, padding: '0 9px', background: '#4B44C8', color: '#fff', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>Look up</button>
        </div>
        {notFound && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>No data found for \"{query.toUpperCase()}\"</div>}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {searchResult && <EItem sym={searchResult.sym} data={searchResult.data} isSearch />}
        <SHdr label=\"Reporting this week\" color=\"#791F1F\" />
        {weekItems.map(([sym, data]) => <EItem key={sym} sym={sym} data={data} />)}
        <SHdr label=\"Next 30 days\" color=\"#3C3489\" />
        {monthItems.map(([sym, data]) => <EItem key={sym} sym={sym} data={data} />)}
        <SHdr label=\"Recently reported\" color=\"var(--text-muted)\" />
        {reportedItems.map(([sym, data]) => <EItem key={sym} sym={sym} data={data} />)}
      </div>
    </div>
  )
}

export function StocksOverviewTab() {
  const allSyms = SECTOR_GROUPS.flatMap(g => g.stocks.map(s => s.symbol))
  const { prices: idxPrices, loading: idxLoading } = usePrices(INDICES.map(i => i.symbol))
  const { prices: stockPrices, loading: stockLoading } = usePrices(allSyms)
  const [watchlist, setWatchlist] = useState(['NVDA', 'AAPL', 'META', 'AMZN', 'TSLA', 'JPM'])
  const [selected, setSelected] = useState(null)

  function toggleWl(sym) {
    setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym])
  }

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 12 }}>
        {INDICES.map(idx => {
          const d = idxPrices[idx.symbol]
          const up = (d?.changePct || 0) >= 0
          return (
            <div key={idx.symbol} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{idxLoading ? '\u2014' : d?.price ? d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '\u2014'}</div>
              <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '\u2014'}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 168px)', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 46, ...TH }}>Sym</th>
                <th style={TH}>Company</th>
                <th style={{ width: 72, ...TH, textAlign: 'center' }}>Price</th>
                <th style={{ width: 58, ...TH, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 48, ...TH, textAlign: 'center' }}>Cap</th>
                <th style={{ width: 32, ...TH }}></th>
                <th style={{ width: 190, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 12 }}>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_GROUPS.map(group => (
                <React.Fragment key={group.name}>
                  <tr>
                    <td colSpan={7} style={{ padding: '5px 8px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: group.pill.bg, color: group.pill.color, marginRight: 6 }}>{group.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>{group.etf}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, color: group.etfPct >= 0 ? 'var(--green)' : 'var(--red)' }}>{group.etfPct >= 0 ? '+' : ''}{group.etfPct.toFixed(1)}%</span>
                    </td>
                  </tr>
                  {group.stocks.map(stock => {
                    const d = stockPrices[stock.symbol]
                    const up = (d?.changePct || 0) >= 0
                    const inWl = watchlist.includes(stock.symbol)
                    const isOpen = selected === stock.symbol
                    return (
                      <React.Fragment key={stock.symbol}>
                        <tr
                          style={{ cursor: 'pointer', background: isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                          onClick={() => setSelected(isOpen ? null : stock.symbol)}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                        >
                          <td style={TD}><span style={{ fontWeight: 500, fontSize: 12 }}>{stock.symbol}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)', fontSize: 11 }}>{stock.name}</td>
                          <td style={{ ...TD, fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center' }}>{stockLoading ? '\u2014' : d?.price ? `$${d.price.toFixed(2)}` : '\u2014'}</td>
                          <td style={{ ...TD, fontSize: 11, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)', textAlign: 'center' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '\u2014'}</td>
                          <td style={{ ...TD, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{stock.cap}</td>
                          <td style={{ ...TD, padding: '4px 4px', textAlign: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggleWl(stock.symbol) }} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${inWl ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: inWl ? 'rgba(75,68,200,0.1)' : 'transparent', color: inWl ? '#3C3489' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1.6 }}>
                              {inWl ? '\u2713' : '+'}
                            </button>
                          </td>
                          <td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 12px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{stock.symbol}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stock.name}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <span style={{ fontSize: 9, color: isOpen ? '#4B44C8' : 'var(--text-muted)' }}>{isOpen ? '\u25b2' : '\u25bc'}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>\u2014</span>
                            )}
                          </td>
                        </tr>
                        {isOpen && EARNINGS_DATA[stock.symbol] && (
                          <EarnRow data={EARNINGS_DATA[stock.symbol]} />
                        )}
                        {isOpen && !EARNINGS_DATA[stock.symbol] && (
                          <tr>
                            <td colSpan={7} style={{ padding: '10px 16px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                              <div style={{ display: 'flex', gap: 24 }}>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</div><div style={{ fontSize: 13, fontWeight: 500 }}>{d?.price ? `$${d.price.toFixed(2)}` : '\u2014'}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Day change</div><div style={{ fontSize: 13, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '\u2014'}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mkt Cap</div><div style={{ fontSize: 13, fontWeight: 500 }}>{stock.cap}</div></div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>No earnings data on file for this stock.</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ height: '100%' }}>
          <EarningsPanel watchlist={watchlist} onAddWatchlist={sym => setWatchlist(w => [...new Set([...w, sym])])} />
        </div>
      </div>
    </div>
  )
}

export function StocksSectorsTab() {
  const { prices, loading } = usePrices(SECTORS_LIST.map(s => s.symbol))
  const sorted = [...SECTORS_LIST].map(s => ({ ...s, pct: prices[s.symbol]?.changePct || 0 })).sort((a, b) => b.pct - a.pct)
  const max = Math.max(...sorted.map(s => Math.abs(s.pct)), 0.1)
  return (
    <div>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Sector ETF performance today. Watch for rotation out of laggards into leaders as a sign of market health or risk-off sentiment.</p>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {sorted.map(s => {
          const up = s.pct >= 0
          const d = prices[s.symbol]
          return (
            <div key={s.symbol} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 140, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.symbol}</div>
              </div>
              <div style={{ flex: 1, height: 8, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(Math.abs(s.pct) / max) * 100}%`, background: up ? 'var(--green)' : 'var(--red)', borderRadius: 4 }} />
              </div>
              <div style={{ width: 80, textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>{loading ? '\u2014' : d ? `${up ? '+' : ''}${s.pct.toFixed(2)}%` : '\u2014'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{d?.price?.toFixed(2) || '\u2014'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StocksEarningsTab() {
  return (
    <div style={{ fontFamily: 'var(--font)', height: 'calc(100vh - 140px)' }}>
      <EarningsPanel watchlist={[]} onAddWatchlist={() => {}} />
    </div>
  )
}

export function StocksKeyLevelsTab() {
  return (
    <div>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Key technical levels for major indices. Support = where buyers step in. Resistance = where sellers dominate.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {KEY_LEVELS.map(item => (
          <div key={item.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{item.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Support</div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{item.support}</div></div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pivot</div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{item.pivot}</div></div>
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Resistance</div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{item.resistance}</div></div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 4 }}>{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
";
fs.writeFileSync("components/StocksSection.js", content, "utf8");
console.log("Written:", content.split("
").length, "lines");
