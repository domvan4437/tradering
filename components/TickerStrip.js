
'use client';
import { useEffect, useState, useRef } from 'react';

const ASSETS = [
  { sym: 'GC=F',     label: 'Gold',      short: 'GC'  },
  { sym: 'CL=F',     label: 'Crude Oil', short: 'CL'  },
  { sym: 'SI=F',     label: 'Silver',    short: 'SI'  },
  { sym: 'ES=F',     label: 'S&P 500',   short: 'ES'  },
  { sym: 'NQ=F',     label: 'Nasdaq',    short: 'NQ'  },
  { sym: 'EURUSD=X', label: 'EUR/USD',   short: 'EUR' },
  { sym: 'GBPUSD=X', label: 'GBP/USD',   short: 'GBP' },
  { sym: 'ZW=F',     label: 'Wheat',     short: 'ZW'  },
  { sym: 'NG=F',     label: 'Nat Gas',   short: 'NG'  },
  { sym: 'ZC=F',     label: 'Corn',      short: 'ZC'  },
  { sym: 'HG=F',     label: 'Copper',    short: 'HG'  },
  { sym: 'ZS=F',     label: 'Soybeans',  short: 'ZS'  },
];

// Deterministic fake sparkline points based on symbol string
// so they don't change on re-render but look different per asset
function getSparkPoints(sym, up) {
  const seed = sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pts = [];
  let y = 20;
  for (let i = 0; i < 8; i++) {
    const rand = ((seed * (i + 7) * 31337) % 100) / 100;
    y = Math.max(4, Math.min(28, y + (rand - 0.5) * 14));
    pts.push(`${i * 18},${y}`);
  }
  // Bias the last point up or down to match direction
  pts[pts.length - 1] = `126,${up ? 6 : 26}`;
  return pts.join(' ');
}

function MiniChart({ sym, up }) {
  const pts = getSparkPoints(sym, up);
  const color = up ? '#00e87a' : '#ff3355';
  return (
    <svg
      width="36"
      height="20"
      viewBox="0 0 126 32"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function TickerItem({ asset, price, change }) {
  const up = (change || 0) >= 0;
  const priceStr = price
    ? price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    : '—';
  const changeStr = change != null
    ? `${up ? '+' : ''}${change.toFixed(2)}%`
    : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 28px 0 0',
      flexShrink: 0,
      borderRight: '1px solid rgba(0,212,255,0.08)',
      marginRight: 28,
    }}>
      {/* Mini chart */}
      <MiniChart sym={asset.sym} up={up} />

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '0.04em',
          }}>
            {asset.short}
          </span>
          {changeStr && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: up ? 'var(--green)' : 'var(--red)',
              fontWeight: 500,
            }}>
              {changeStr}
            </span>
          )}
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
        }}>
          {priceStr}
        </span>
      </div>
    </div>
  );
}

export default function TickerStrip() {
  const [prices, setPrices] = useState({});
  const trackRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (data.prices) setPrices(data.prices);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const items = ASSETS.map(a => ({
    asset: a,
    price: prices[a.sym]?.price,
    change: prices[a.sym]?.changePercent,
  }));

  // Three copies for seamless loop at any screen width
  const allItems = [...items, ...items, ...items];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
        .ticker-track {
          display: flex;
          align-items: center;
          height: 100%;
          animation: ticker-scroll 40s linear infinite;
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 54,
        left: 0,
        right: 0,
        height: 54,
        background: 'var(--bg1)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        zIndex: 199,
      }}>
        <div
          ref={trackRef}
          className="ticker-track"
        >
          {allItems.map((item, i) => (
            <TickerItem
              key={i}
              asset={item.asset}
              price={item.price}
              change={item.change}
            />
          ))}
        </div>
      </div>
    </>
  );
}
