
'use client';
import { useEffect, useState } from 'react';

const ASSETS = [
  { sym: 'GC=F',     label: 'Gold'     },
  { sym: 'CL=F',     label: 'Crude'    },
  { sym: 'SI=F',     label: 'Silver'   },
  { sym: 'ES=F',     label: 'S&P 500'  },
  { sym: 'NQ=F',     label: 'Nasdaq'   },
  { sym: 'EURUSD=X', label: 'EUR/USD'  },
  { sym: 'GBPUSD=X', label: 'GBP/USD'  },
  { sym: 'ZW=F',     label: 'Wheat'    },
  { sym: 'NG=F',     label: 'Nat Gas'  },
  { sym: 'ZC=F',     label: 'Corn'     },
  { sym: 'HG=F',     label: 'Copper'   },
  { sym: 'ZS=F',     label: 'Soybeans' },
];

const formatPrice = (p) => {
  if (!p) return '—';
  if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)    return p.toFixed(2);
  return p.toFixed(4);
};

export default function TickerStrip() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const syms = ASSETS.map(a => a.sym).join(',');
        const res  = await fetch(`/api/prices?symbols=${syms}`);
        const data = await res.json();
        setPrices(data || {});
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const items = ASSETS.map(a => {
    const d = prices[a.sym];
    return { label: a.label, sym: a.sym, price: d?.price ?? null, change: d?.changePct ?? null };
  });

  const looped = [...items, ...items];

  return (
    <div className="tk-wrap">
      <div className="tk-track">
        {looped.map((item, i) => {
          const up = (item.change || 0) >= 0;
          return (
            <div key={i} className="tk-item">
              <span className="tk-name">{item.label}</span>
              <span className="tk-price">{formatPrice(item.price)}</span>
              {item.change != null && (
                <span className={"tk-change " + (up ? "tk-up" : "tk-dn")}>
                  {up ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                </span>
              )}
              <span className="tk-div">·</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
