import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || getMonday();
    const to   = searchParams.get('to')   || getFriday();

    const key = process.env.FINNHUB_API_KEY;
    if (!key) return NextResponse.json({ events: [] });

    const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${key}`;
    const res  = await fetch(url, { cache: "no-store" }); // cache 15 min
    if (!res.ok) throw new Error('Finnhub error ' + res.status);

    const data = await res.json();
    const raw  = data.economicCalendar || [];

    // Normalize to our app format
    const events = raw.map(e => ({
      time:     e.time ? e.time.slice(11, 16) : 'All Day',
      country:  e.country || 'US',
      flag:     countryFlag(e.country),
      impact:   mapImpact(e.impact, e.event),
      name:     e.event || '',
      sub:      (e.unit || '') + (e.country ? ' · ' + e.country : ''),
      market:   mapMarket(e.country, e.event),
      prev:     e.prev != null ? String(e.prev) + (e.unit||'') : null,
      fore:     e.estimate != null ? String(e.estimate) + (e.unit||'') : null,
      actual:   e.actual != null ? String(e.actual) + (e.unit||'') : null,
      actualUp: e.actual != null && e.estimate != null ? e.actual >= e.estimate : null,
      date:     e.time ? e.time.slice(0, 10) : from,
    })).filter(e => e.name);

    return NextResponse.json({ events });
  } catch (err) {
    console.error('Finnhub calendar error:', err.message);
    return NextResponse.json({ events: [] });
  }
}

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getFriday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 4;
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function countryFlag(code) {
  const flags = {
    US:'🇺🇸', EU:'🇪🇺', GB:'🇬🇧', DE:'🇩🇪', FR:'🇫🇷', JP:'🇯🇵',
    CA:'🇨🇦', AU:'🇦🇺', NZ:'🇳🇿', CH:'🇨🇭', CN:'🇨🇳', ES:'🇪🇸',
    IT:'🇮🇹', SE:'🇸🇪', NO:'🇳🇴', MX:'🇲🇽', BR:'🇧🇷', IN:'🇮🇳',
    KR:'🇰🇷', ZA:'🇿🇦', SG:'🇸🇬', HK:'🇭🇰',
  };
  return flags[code] || '🌐';
}

function mapImpact(n, eventName) {
  const e = (eventName || '').toLowerCase();
  const high = ['gdp','non-farm','nfp','cpi','inflation rate','interest rate decision','fed ','ecb ','boe ','fomc','unemployment rate','pce','eia crude','eia natural gas','retail sales','payroll'];
  const med  = ['pmi','ppi','trade balance','consumer confidence','housing','durable goods','jobless claims','manufacturing pmi','services pmi','ism ','business confidence','industrial production'];
  if (high.some(w => e.includes(w))) return 'high';
  if (med.some(w => e.includes(w))) return 'medium';
  return 'low';
}
function mapMarket(country, event) {
  const e = (event || '').toLowerCase();
  if (e.includes('crude') || e.includes('eia') || e.includes('oil')) return 'Commodities';
  if (e.includes('gas') || e.includes('energy')) return 'Commodities';
  if (e.includes('cot') || e.includes('commitment') || e.includes('bond') || e.includes('treasury')) return 'Futures';
  if (e.includes('stock') || e.includes('earning') || e.includes('equity')) return 'Stocks';
  if (e.includes('bitcoin') || e.includes('crypto')) return 'Crypto';
  return 'Forex';
}