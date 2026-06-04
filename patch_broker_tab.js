const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// 1. Add broker tab to ACCOUNT_TABS after monetization
s = s.replace(
  `  { key: 'monetization', label: 'Monetization',          icon: 'ti-currency-dollar' },\n  { key: 'settings',     label: 'Settings',              icon: 'ti-settings' },`,
  `  { key: 'monetization', label: 'Monetization',          icon: 'ti-currency-dollar' },\n  { key: 'broker',       label: 'Connect Broker',        icon: 'ti-building-bank' },\n  { key: 'settings',     label: 'Settings',              icon: 'ti-settings' },`
)
console.log('✓ Connect Broker tab added to sidebar')

// 2. Add BrokerTab render in content area
s = s.replace(
  `iveTab === 'monetization' && <MonetizationTab />}\n        {activeTab === 'settin`,
  `iveTab === 'monetization' && <MonetizationTab />}\n        {activeTab === 'broker' && <BrokerTab />}\n        {activeTab === 'settin`
)
console.log('✓ BrokerTab render added')

// 3. Add BrokerTab component before MonetizationTab
const BROKER_TAB = `// ─── BROKER TAB ───────────────────────────────────────────────
function BrokerTab() {
  const [connected, setConnected] = React.useState(null)
  const brokers = [
    { name: 'Interactive Brokers', desc: 'Stocks, futures, forex, options' },
    { name: 'TD Ameritrade',       desc: 'Stocks, ETFs, options, futures' },
    { name: 'TradeStation',        desc: 'Futures, stocks, options' },
    { name: 'Tradovate',           desc: 'Futures and options on futures' },
    { name: 'OANDA',               desc: 'Forex and CFDs' },
    { name: 'Alpaca',              desc: 'Stocks and crypto' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <SH>Connected broker</SH>
        {connected ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, background:'rgba(22,163,74,0.08)', border:'0.5px solid rgba(22,163,74,0.2)' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>{connected}</div>
              <div style={{ fontSize:11, color:'#16a34a' }}>✓ Connected · Read-only access</div>
            </div>
            <BtnS style={{ fontSize:11 }} onClick={() => setConnected(null)}>Disconnect</BtnS>
          </div>
        ) : (
          <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(220,38,38,0.05)', border:'0.5px solid rgba(220,38,38,0.15)', fontSize:12, color:'#dc2626', marginBottom:4 }}>
            No broker connected. Connect one to auto-import trades and verify your track record.
          </div>
        )}
      </Card>

      <Card>
        <SH>Available brokers</SH>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {brokers.map(b => (
            <div key={b.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, border:'0.5px solid var(--border)', background:'var(--surface2)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:1 }}>{b.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{b.desc}</div>
              </div>
              <BtnP style={{ fontSize:11, padding:'5px 14px' }} onClick={() => setConnected(b.name)}>Connect</BtnP>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SH>What broker sync does</SH>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { icon:'ti-download', text:'Auto-imports all your trades directly from your broker' },
            { icon:'ti-shield-check', text:'Verifies your track record with a trusted badge on your profile' },
            { icon:'ti-map-pin', text:'Featured in the Local Traders tab as a verified trader' },
            { icon:'ti-building', text:'Discoverable by prop firms looking for funded trader candidates' },
            { icon:'ti-lock', text:'Read-only access only — we can never place or modify trades' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:12, color:'var(--text-muted)' }}>
              <i className={\`ti \${item.icon}\`} style={{ fontSize:14, color:'#4B44C8', marginTop:1, flexShrink:0 }} aria-hidden="true" />
              {item.text}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

`

const INSERT_BEFORE = `// ─── MONETIZATION`
if (s.includes(INSERT_BEFORE)) {
  s = s.replace(INSERT_BEFORE, BROKER_TAB + INSERT_BEFORE)
  console.log('✓ BrokerTab component added')
} else {
  // Try inserting before MonetizationTab function
  s = s.replace('function MonetizationTab()', BROKER_TAB + 'function MonetizationTab()')
  console.log('✓ BrokerTab component added (alternate)')
}

fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
