// lib/design.js - Shared design tokens and utilities

export const THEMES = {
  'dark-gold': {
    bg: '#0a0a0a', surface: '#0d0d0d', surfaceHover: '#111',
    border: '#1a1a1a', border2: '#222', border3: '#2a2a2a',
    accent: '#c8a84b', accentDim: '#8a6e30',
    text: '#e8e0d0', textMuted: '#888', textDim: '#555', textFaint: '#333',
    green: '#4caf82', greenBg: '#080d09', greenBorder: '#1a3d2a',
    red: '#e05a4e', redBg: '#0d0808', redBorder: '#3d1a1a',
    blue: '#4fc3f7', purple: '#ce93d8', gold: '#c8a84b',
  },
  'dark-blue': {
    bg: '#08080f', surface: '#0d0d18', surfaceHover: '#12121f',
    border: '#1a1a2a', border2: '#222238', border3: '#2a2a40',
    accent: '#4fc3f7', accentDim: '#2a7a9e',
    text: '#e0e8f4', textMuted: '#7888aa', textDim: '#445566', textFaint: '#2a3344',
    green: '#4caf82', greenBg: '#080d0f', greenBorder: '#1a3d30',
    red: '#e05a4e', redBg: '#0d0808', redBorder: '#3d1a1a',
    blue: '#4fc3f7', purple: '#ce93d8', gold: '#c8a84b',
  },
  'dark-green': {
    bg: '#080d08', surface: '#0d120d', surfaceHover: '#111811',
    border: '#1a221a', border2: '#222e22', border3: '#2a3a2a',
    accent: '#4caf82', accentDim: '#2a6e4e',
    text: '#e0f0e4', textMuted: '#789a80', textDim: '#445e48', textFaint: '#2a3e2e',
    green: '#4caf82', greenBg: '#080d09', greenBorder: '#1a3d2a',
    red: '#e05a4e', redBg: '#0d0808', redBorder: '#3d1a1a',
    blue: '#4fc3f7', purple: '#ce93d8', gold: '#c8a84b',
  },
  'minimal': {
    bg: '#111', surface: '#161616', surfaceHover: '#1c1c1c',
    border: '#222', border2: '#2a2a2a', border3: '#333',
    accent: '#fff', accentDim: '#aaa',
    text: '#e0e0e0', textMuted: '#777', textDim: '#444', textFaint: '#2a2a2a',
    green: '#4caf82', greenBg: '#080d09', greenBorder: '#1a3d2a',
    red: '#e05a4e', redBg: '#0d0808', redBorder: '#3d1a1a',
    blue: '#4fc3f7', purple: '#ce93d8', gold: '#c8a84b',
  },
}

export const FONT = "'Courier New', 'Courier', monospace"

export const STAGES = [
  { id: 'seasonal',        label: 'Stage 1', title: 'Seasonal Tendency',
    question: c => `For "${c}", based on the seasonal data provided, is there a current or upcoming seasonal tendency? Answer YES or NO and reference the actual avg return and win rate for this month.`,
    pass: 'YES', fail: 'No seasonal tendency. Wait for the next seasonal window.' },
  { id: 'major_market',    label: 'Stage 2', title: 'Major Market Analysis',
    question: c => `Based on the LIVE USDX and Treasury yield data, are macro markets trending to support a move in "${c}"? Answer YES or NO and cite the actual numbers.`,
    pass: 'YES', fail: 'Macro markets not supportive. Consider short-term trades only.' },
  { id: 'commodity_stock', label: 'Stage 3', title: 'Commodity Trending',
    question: c => `Based on the LIVE price data, is "${c}" currently trending? Reference 4w, 13w, 26w changes. Answer YES or NO and specify direction.`,
    pass: 'YES', fail: 'Market not trending. Wait.' },
  { id: 'intermarket',     label: 'Stage 4', title: 'Intermarket Analysis',
    question: c => `Based on LIVE data (USDX, rates, price trend, COT index), are intermarket signals suggesting net BUYING or net SELLING for "${c}"? State BUYING or SELLING.`,
    pass: null, fail: null },
  { id: 'cot',             label: 'Stage 5', title: 'COT Hedging Program',
    question: c => `The LIVE COT data shows exact commercial positions for "${c}" plus the COT Index (0=max bearish, 100=max bullish). State BUYING or SELLING and cite the net position and index value.`,
    pass: null, fail: null },
  { id: 'correlation',     label: 'Stage 6', title: 'Correlation Analysis',
    question: c => `Is the USDX currently WEAKENING in a way that supports commodity prices for "${c}"? Answer YES or NO and cite the actual USDX 13-week change.`,
    pass: 'YES', fail: 'Dollar correlation does not support. Wait.' },
  { id: 'commodity_filter',label: 'Stage 7', title: 'Commodity Filter',
    question: c => `Based on LIVE price data, is "${c}" rallying, breaking old highs, or rejecting old lows? Reference 52-week proximity. Answer YES or NO.`,
    pass: 'YES', fail: 'No price confirmation. Wait.' },
  { id: 'open_interest',   label: 'Stage 8', title: 'Open Interest Filter',
    question: c => `Has open interest for "${c}" dropped 10-15%+ indicating commercial short covering? Answer YES or NO with actual OI numbers.`,
    pass: 'YES', fail: 'Open interest filter not met. Wait.' },
  { id: 'top_down',        label: 'Stage 9', title: 'Top-Down Analysis',
    question: c => `Using ALL live data, does the complete picture confirm a high-probability setup for "${c}"? Answer YES or NO, summarize key points, state final direction: BUY or SELL.`,
    pass: 'YES', fail: 'Top-down does not confirm. Wait for full alignment.' },
]

export const COMMODITIES = [
  'Gold','Silver','Copper','Platinum','Palladium',
  'Crude Oil','Natural Gas','Gasoline','Heating Oil',
  'Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa',
  'Live Cattle','Lean Hogs','Rice','Oats','Lumber',
]

export const TICKER_MAP = {
  'gold':'GC=F','silver':'SI=F','copper':'HG=F','platinum':'PL=F','palladium':'PA=F',
  'crude oil':'CL=F','oil':'CL=F','natural gas':'NG=F','nat gas':'NG=F',
  'gasoline':'RB=F','heating oil':'HO=F',
  'corn':'ZC=F','wheat':'ZW=F','soybeans':'ZS=F','soybean':'ZS=F',
  'coffee':'KC=F','sugar':'SB=F','cotton':'CT=F','cocoa':'CC=F',
  'live cattle':'LE=F','cattle':'LE=F','lean hogs':'HE=F','hogs':'HE=F',
  'rice':'ZR=F','oats':'ZO=F','lumber':'LBR=F',
}

export const COT_MAP = {
  'gold':'GOLD','silver':'SILVER','copper':'COPPER','platinum':'PLATINUM','palladium':'PALLADIUM',
  'crude oil':'CRUDE OIL','oil':'CRUDE OIL','natural gas':'NATURAL GAS','nat gas':'NATURAL GAS',
  'gasoline':'GASOLINE','heating oil':'HEATING OIL',
  'corn':'CORN','wheat':'WHEAT','soybeans':'SOYBEANS','soybean':'SOYBEANS',
  'coffee':'COFFEE','sugar':'SUGAR','cotton':'COTTON','cocoa':'COCOA',
  'live cattle':'CATTLE','cattle':'CATTLE','lean hogs':'HOGS','hogs':'HOGS',
  'rice':'RICE','oats':'OATS','lumber':'LUMBER',
}

export const CONTRACT_SPECS = [
  { name:'Gold (GC)',       exchange:'COMEX', size:'100 troy oz',    tick:'$0.10 = $10',   margin:'~$8,000',  category:'Metals'   },
  { name:'Silver (SI)',     exchange:'COMEX', size:'5,000 troy oz',  tick:'$0.005 = $25',  margin:'~$7,000',  category:'Metals'   },
  { name:'Copper (HG)',     exchange:'COMEX', size:'25,000 lbs',     tick:'$0.0005 = $12.50',margin:'~$4,000',category:'Metals'   },
  { name:'Platinum (PL)',   exchange:'NYMEX', size:'50 troy oz',     tick:'$0.10 = $5',    margin:'~$2,500',  category:'Metals'   },
  { name:'Crude Oil (CL)',  exchange:'NYMEX', size:'1,000 barrels',  tick:'$0.01 = $10',   margin:'~$5,000',  category:'Energy'   },
  { name:'Nat Gas (NG)',    exchange:'NYMEX', size:'10,000 MMBtu',   tick:'$0.001 = $10',  margin:'~$2,000',  category:'Energy'   },
  { name:'Gasoline (RB)',   exchange:'NYMEX', size:'42,000 gal',     tick:'$0.0001 = $4.20',margin:'~$4,500', category:'Energy'   },
  { name:'Corn (ZC)',       exchange:'CBOT',  size:'5,000 bushels',  tick:'$0.0025 = $12.50',margin:'~$1,200',category:'Grains'   },
  { name:'Wheat (ZW)',      exchange:'CBOT',  size:'5,000 bushels',  tick:'$0.0025 = $12.50',margin:'~$1,500',category:'Grains'   },
  { name:'Soybeans (ZS)',   exchange:'CBOT',  size:'5,000 bushels',  tick:'$0.0025 = $12.50',margin:'~$2,000',category:'Grains'   },
  { name:'Coffee (KC)',     exchange:'ICE',   size:'37,500 lbs',     tick:'$0.0005 = $18.75',margin:'~$3,000',category:'Softs'    },
  { name:'Sugar #11 (SB)', exchange:'ICE',   size:'112,000 lbs',    tick:'$0.0001 = $11.20',margin:'~$1,500',category:'Softs'    },
  { name:'Cotton (CT)',     exchange:'ICE',   size:'50,000 lbs',     tick:'$0.0001 = $5',  margin:'~$2,000',  category:'Softs'    },
  { name:'Cocoa (CC)',      exchange:'ICE',   size:'10 metric tons', tick:'$1 = $10',      margin:'~$2,000',  category:'Softs'    },
  { name:'Live Cattle (LE)',exchange:'CME',   size:'40,000 lbs',     tick:'$0.00025 = $10',margin:'~$2,000',  category:'Livestock'},
  { name:'Lean Hogs (HE)', exchange:'CME',   size:'40,000 lbs',     tick:'$0.00025 = $10',margin:'~$1,500',  category:'Livestock'},
]

export function buildDataBlock(d) {
  if (!d) return ''
  const lines = ['=== LIVE MARKET DATA ===\n']
  if (d.price) {
    lines.push(`PRICE (${d.ticker}): ${d.price.latest} | 4w: ${d.price.pct4w}% | 13w: ${d.price.pct13w}% | 26w: ${d.price.pct26w}%`)
    lines.push(`  52w High: ${d.price.high52w} (${d.price.pctFrom52wHigh}% from high) | 52w Low: ${d.price.low52w}`)
    lines.push(`  Trending: ${d.price.trending ? 'YES' : 'NO'} — ${d.price.trendDirection}`)
    lines.push('')
  }
  if (d.usdx) {
    lines.push(`USDX: ${d.usdx.latest} | 4w: ${d.usdx.pct4w}% | 13w: ${d.usdx.pct13w}% | ${d.usdx.direction}`)
    lines.push(`  Bearish for USD (commodity tailwind): ${d.usdx.bearishForCommodities ? 'YES' : 'NO'}`)
    lines.push('')
  }
  if (d.rates) {
    lines.push(`10Y YIELD: ${d.rates.latest}% | 13w: ${d.rates.pct13w}% | ${d.rates.direction}`)
    lines.push('')
  }
  if (d.cot) {
    lines.push(`COT (${d.cot.reportDate}): Longs ${d.cot.commLong.toLocaleString()} | Shorts ${d.cot.commShort.toLocaleString()} | Net ${d.cot.netCommercial.toLocaleString()} → ${d.cot.commercialBias}`)
    lines.push(`  OI: ${d.cot.openInterest.toLocaleString()} | 1w change: ${d.cot.openInterestChange}% | OI dropped 10-15%+: ${d.cot.oiDropped15 ? 'YES' : 'NO'}`)
    lines.push('')
  }
  if (d.cotIndexData && !d.cotIndexData.error) {
    const ci = d.cotIndexData
    lines.push(`COT INDEX (3yr): ${ci.cotIndex}/100 — ${ci.interpretation}`)
    lines.push(`  Net: ${ci.currentNet?.toLocaleString()} | Range: ${ci.minNet?.toLocaleString()} to ${ci.maxNet?.toLocaleString()}`)
    lines.push('')
  }
  if (d.seasonalInfo && !d.seasonalInfo.error) {
    const s = d.seasonalInfo
    lines.push(`SEASONAL (${s.currentMonthName}, 15yr avg): ${s.currentBias?.avgReturn}% avg return | ${s.currentBias?.winRate}% win rate`)
    lines.push(`  Best months: ${s.bestMonths?.join(', ')} | Worst: ${s.worstMonths?.join(', ')}`)
    lines.push('')
  }
  lines.push('=== END LIVE DATA ===\n')
  return lines.join('\n')
}
