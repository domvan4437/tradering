const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// Add Connect Broker card before the closing of MonetizationTab
const OLD = `      <Card>
        <SH>Payout history</SH>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payouts yet. Earnings are paid out on the 1st of each month once you've connected a payout method and reached the $25 minimum threshold.</div>
      </Card>
    </div>
  )
}

// ─── SETTINGS`

const NEW = `      <Card>
        <SH>Payout history</SH>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payouts yet. Earnings are paid out on the 1st of each month once you've connected a payout method and reached the $25 minimum threshold.</div>
      </Card>

      <Card>
        <SH>Connect broker</SH>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Connect your broker to automatically import trades, verify your track record, and unlock the verified trader badge. Verified traders are featured in the Local Traders tab and can be discovered by prop firms.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { name: 'Interactive Brokers', status: 'Available' },
            { name: 'TD Ameritrade', status: 'Available' },
            { name: 'TradeStation', status: 'Available' },
            { name: 'Tradovate', status: 'Available' },
            { name: 'OANDA', status: 'Available' },
            { name: 'Alpaca', status: 'Available' },
          ].map(b => (
            <div key={b.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:7, border:'0.5px solid var(--border)', background:'var(--surface2)', fontSize:12 }}>
              <span style={{ fontWeight:500, color:'var(--text)' }}>{b.name}</span>
              <BtnS style={{ fontSize:10, padding:'3px 10px' }}>Connect</BtnS>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 10px', borderRadius: 6, background: 'rgba(75,68,200,0.06)', border: '0.5px solid rgba(75,68,200,0.15)' }}>
          🔒 TradeRing uses read-only access. We can never place or modify trades on your behalf.
        </div>
      </Card>
    </div>
  )
}

// ─── SETTINGS`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ Connect Broker section added to Monetization tab')
} else {
  console.log('⚠ Pattern not matched - trying alternate...')
  // Try with \r\n
  const OLD2 = OLD.replace(/\n/g, '\r\n')
  const NEW2 = NEW.replace(/\n/g, '\r\n')
  if (s.includes(OLD2)) {
    s = s.replace(OLD2, NEW2)
    console.log('✓ Connect Broker section added (CRLF)')
  } else {
    console.log('⚠ Still not matched')
  }
}

fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
