'use client';
import React, { useState, useRef, useEffect } from 'react';

const PURPLE = '#4B44C8';

function lsGet(key, fb) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fb; } catch { return fb; }
}
function pnlNum(v) { return parseFloat(String(v || '').replace(/[^0-9.\-]/g, '')) || 0; }

function gatherTraderContext() {
  try {
    const trades = lsGet('tr_journal_v3', []);
    const jTree = lsGet('tr_journal_v3_jtree', {});
    const setups = lsGet('tr_journal_v3_setups2', []);
    const accounts = lsGet('tr_port_accounts_v3', []);
    const total = trades.length;
    const wins = trades.filter(t => pnlNum(t.pnl) > 0);
    const losses = trades.filter(t => pnlNum(t.pnl) < 0);
    const winRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;
    const netPnl = trades.reduce((s, t) => s + pnlNum(t.pnl), 0);
    const avgR = total > 0 ? (trades.reduce((s, t) => s + (parseFloat(t.r) || 0), 0) / total).toFixed(2) : '0';
    const grossWin = wins.reduce((s, t) => s + pnlNum(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + pnlNum(t.pnl), 0));
    const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length > 0 ? 'inf' : '0';
    let peak = 0, dd = 0, cum = 0;
    [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(t => {
      cum += pnlNum(t.pnl); if (cum > peak) peak = cum; if (peak - cum > dd) dd = peak - cum;
    });
    const byAsset = {}, bySetup = {}, byEmotion = {}, byDir = { Long: { w: 0, t: 0 }, Short: { w: 0, t: 0 } };
    trades.forEach(t => {
      if (t.asset) { if (!byAsset[t.asset]) byAsset[t.asset] = { w: 0, t: 0, pnl: 0 }; byAsset[t.asset].t++; byAsset[t.asset].pnl += pnlNum(t.pnl); if (pnlNum(t.pnl) > 0) byAsset[t.asset].w++; }
      if (t.setup) { if (!bySetup[t.setup]) bySetup[t.setup] = { w: 0, t: 0, pnl: 0 }; bySetup[t.setup].t++; bySetup[t.setup].pnl += pnlNum(t.pnl); if (pnlNum(t.pnl) > 0) bySetup[t.setup].w++; }
      if (t.emotion) { if (!byEmotion[t.emotion]) byEmotion[t.emotion] = { w: 0, t: 0, pnl: 0 }; byEmotion[t.emotion].t++; byEmotion[t.emotion].pnl += pnlNum(t.pnl); if (pnlNum(t.pnl) > 0) byEmotion[t.emotion].w++; }
      if (t.direction === 'Long' || t.direction === 'Short') { byDir[t.direction].t++; if (pnlNum(t.pnl) > 0) byDir[t.direction].w++; }
    });
    const fa = (o, n) => Object.entries(o).sort((a, b) => b[1].t - a[1].t).slice(0, n).map(([k, d]) => k + ': ' + Math.round(d.w / d.t * 100) + '% WR, ' + d.t + ' trades, $' + d.pnl.toFixed(0) + ' P&L');
    const fe = o => Object.entries(o).sort((a, b) => b[1].t - a[1].t).map(([k, d]) => k + ': ' + Math.round(d.w / d.t * 100) + '% WR, ' + d.t + ' trades');
    const recent = [...trades].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10)
      .map(t => (t.date || '?') + ' | ' + (t.asset || '?') + ' ' + (t.direction || '') + ' | Setup:' + (t.setup || 'none') + ' | P&L:' + (t.pnl || '?') + ' | R:' + (t.r || '?') + ' | Emotion:' + (t.emotion || 'none'));
    const accountTotal = accounts.reduce((s, a) => s + (typeof a.cash === 'number' ? a.cash : parseFloat(a.cash) || 0), 0);
    const entries = jTree.entries || {};
    const recentNotes = (jTree.items || []).filter(i => i.type === 'entry').sort((a, b) => (b.order || 0) - (a.order || 0)).slice(0, 5)
      .map(i => { const e = entries[i.id]; if (!e) return null; const txt = (e.blocks || []).map(b => b.text || b.content || '').filter(Boolean).join(' ').slice(0, 300); return txt ? '[' + i.name + ']: ' + txt : null; }).filter(Boolean);
    return {
      summary: { totalTrades: total, winRate: winRate + '%', wins: wins.length, losses: losses.length, netPnL: '$' + netPnl.toFixed(0), avgR, profitFactor: pf, maxDrawdown: '$' + dd.toFixed(0), accountBalance: accountTotal > 0 ? '$' + accountTotal.toFixed(0) : 'not set', longRecord: byDir.Long.w + 'W/' + (byDir.Long.t - byDir.Long.w) + 'L (' + (byDir.Long.t > 0 ? Math.round(byDir.Long.w / byDir.Long.t * 100) : 0) + '% WR)', shortRecord: byDir.Short.w + 'W/' + (byDir.Short.t - byDir.Short.w) + 'L (' + (byDir.Short.t > 0 ? Math.round(byDir.Short.w / byDir.Short.t * 100) : 0) + '% WR)', emotionalTrades: trades.filter(t => ['FOMO', 'Revenge', 'Anxious'].includes(t.emotion)).length, fullRuleTrades: trades.filter(t => t.rules === '4/4').length },
      byAsset: fa(byAsset, 8).length ? fa(byAsset, 8) : ['No assets logged'],
      bySetup: fa(bySetup, 6).length ? fa(bySetup, 6) : ['No setups tagged'],
      byEmotion: fe(byEmotion).length ? fe(byEmotion) : ['No emotions tagged'],
      recentTrades: recent.length ? recent : ['No trades logged'],
      playbookSetups: setups.length ? setups.map(s => s.name).join(', ') : 'None',
      recentJournalNotes: recentNotes,
    };
  } catch { return null; }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function fmt(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return React.createElement('strong', { key: i }, p.slice(2, -2));
    if (p.startsWith('*') && p.endsWith('*')) return React.createElement('em', { key: i, style: { fontStyle: 'italic' } }, p.slice(1, -1));
    if (p.startsWith('`') && p.endsWith('`')) return React.createElement('code', { key: i, style: { background: 'rgba(0,0,0,0.15)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 12 } }, p.slice(1, -1));
    return p;
  });
}
function Markdown({ text }) {
  if (!text) return null;
  return React.createElement('div', { style: { fontSize: 13.5 } },
    ...text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return React.createElement('div', { key: i, style: { fontWeight: 700, fontSize: 13, marginTop: 10, marginBottom: 3, color: PURPLE } }, fmt(line.slice(4)));
      if (line.startsWith('## ')) return React.createElement('div', { key: i, style: { fontWeight: 700, fontSize: 14, marginTop: 12, marginBottom: 4 } }, fmt(line.slice(3)));
      if (line.startsWith('# ')) return React.createElement('div', { key: i, style: { fontWeight: 700, fontSize: 15, marginTop: 14, marginBottom: 5 } }, fmt(line.slice(2)));
      if (line.startsWith('- ') || line.startsWith('• ')) return React.createElement('div', { key: i, style: { display: 'flex', gap: 7, margin: '2px 0', alignItems: 'flex-start' } }, React.createElement('span', { style: { color: PURPLE, flexShrink: 0, marginTop: 1, fontSize: 12 } }, '•'), React.createElement('span', null, fmt(line.slice(2))));
      const nl = line.match(/^(\d+)\.\s(.*)/);
      if (nl) return React.createElement('div', { key: i, style: { display: 'flex', gap: 7, margin: '2px 0', alignItems: 'flex-start' } }, React.createElement('span', { style: { color: PURPLE, flexShrink: 0, fontWeight: 600, minWidth: 18, fontSize: 12 } }, nl[1] + '.'), React.createElement('span', null, fmt(nl[2])));
      if (line === '---' || line === '***') return React.createElement('div', { key: i, style: { height: 1, background: 'var(--border)', margin: '8px 0' } });
      if (line === '') return React.createElement('div', { key: i, style: { height: 5 } });
      return React.createElement('div', { key: i, style: { margin: '1px 0', lineHeight: 1.65 } }, fmt(line));
    })
  );
}
function Dots() {
  return React.createElement('div', { style: { display: 'flex', gap: 4, padding: '6px 0', alignItems: 'center' } },
    ...[0, 1, 2].map(i => React.createElement('div', { key: i, style: { width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', animation: 'tz-bounce 1.2s ease-in-out infinite', animationDelay: i * 0.18 + 's' } }))
  );
}

// ── Drawing Canvas ────────────────────────────────────────────────────────────
function DrawingCanvas({ src, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const isDownRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ff3333');
  const [lineWidth, setLineWidth] = useState(3);
  const [snapshots, setSnapshots] = useState([]);
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(500);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      const maxW = Math.min(860, window.innerWidth - 60);
      const maxH = window.innerHeight - 230;
      const ratio = Math.min(maxW / (img.naturalWidth || 800), maxH / (img.naturalHeight || 500), 1);
      setCanvasW(Math.round((img.naturalWidth || 800) * ratio));
      setCanvasH(Math.round((img.naturalHeight || 500) * ratio));
      imgRef.current = img;
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(imgRef.current, 0, 0, canvasW, canvasH);
  }, [canvasW, canvasH]);

  function getXY(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasW / rect.width),
      y: (e.clientY - rect.top) * (canvasH / rect.height),
    };
  }

  function onDown(e) {
    e.preventDefault();
    const pt = getXY(e);
    isDownRef.current = true;
    startRef.current = pt;
    const ctx = canvasRef.current.getContext('2d');
    setSnapshots(prev => [...prev.slice(-29), ctx.getImageData(0, 0, canvasW, canvasH)]);
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 5 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    if (tool === 'pen' || tool === 'eraser') { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); }
  }

  function onMove(e) {
    if (!isDownRef.current) return;
    e.preventDefault();
    const pt = getXY(e);
    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pt.x, pt.y); ctx.stroke();
    } else {
      if (snapshots.length) ctx.putImageData(snapshots[snapshots.length - 1], 0, 0);
      const s = startRef.current;
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      if (tool === 'rect') {
        ctx.strokeRect(s.x, s.y, pt.x - s.x, pt.y - s.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pt.x - s.x) / 2 || 1;
        const ry = Math.abs(pt.y - s.y) / 2 || 1;
        ctx.ellipse(s.x + (pt.x - s.x) / 2, s.y + (pt.y - s.y) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'arrow') {
        const hlen = Math.max(lineWidth * 5, 14);
        const angle = Math.atan2(pt.y - s.y, pt.x - s.x);
        ctx.moveTo(s.x, s.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - hlen * Math.cos(angle - Math.PI / 6), pt.y - hlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - hlen * Math.cos(angle + Math.PI / 6), pt.y - hlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  }

  function onUp() {
    isDownRef.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.closePath();
  }

  function undo() {
    if (!snapshots.length) return;
    canvasRef.current.getContext('2d').putImageData(snapshots[snapshots.length - 1], 0, 0);
    setSnapshots(p => p.slice(0, -1));
  }

  function clear() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, canvasW, canvasH);
    setSnapshots([]);
  }

  const COLORS = ['#ff3333', '#ff9900', '#ffff00', '#33cc66', '#3399ff', '#cc44ff', '#ffffff', '#111111'];
  const TOOLS = [
    { id: 'pen', icon: '✏', title: 'Pen — freehand draw' },
    { id: 'arrow', icon: '↗', title: 'Arrow' },
    { id: 'rect', icon: '▭', title: 'Rectangle' },
    { id: 'circle', icon: '○', title: 'Ellipse' },
    { id: 'eraser', icon: '⌫', title: 'Eraser' },
  ];

  return React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 } },
    // Toolbar
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--surface)', borderRadius: 12, flexWrap: 'wrap', maxWidth: '95vw', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
      ...TOOLS.map(t =>
        React.createElement('button', { key: t.id, onClick: () => setTool(t.id), title: t.title, style: { width: 34, height: 34, borderRadius: 7, border: '0.5px solid ' + (tool === t.id ? PURPLE : 'var(--border)'), background: tool === t.id ? 'rgba(75,68,200,0.15)' : 'var(--surface2)', cursor: 'pointer', fontSize: 15, color: tool === t.id ? PURPLE : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 } }, t.icon)
      ),
      React.createElement('div', { style: { width: 1, height: 26, background: 'var(--border)', margin: '0 3px' } }),
      ...COLORS.map(c =>
        React.createElement('div', { key: c, onClick: () => { setColor(c); if (tool === 'eraser') setTool('pen'); }, style: { width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2.5px solid ' + PURPLE : '1.5px solid rgba(128,128,128,0.35)', flexShrink: 0, boxSizing: 'border-box' } })
      ),
      React.createElement('div', { style: { width: 1, height: 26, background: 'var(--border)', margin: '0 3px' } }),
      React.createElement('input', { type: 'range', min: 1, max: 14, value: lineWidth, onChange: e => setLineWidth(+e.target.value), style: { width: 64, cursor: 'pointer' } }),
      React.createElement('div', { style: { width: Math.max(lineWidth * 2, 6), height: Math.max(lineWidth * 2, 6), borderRadius: '50%', background: tool === 'eraser' ? '#888' : color, border: '1px solid rgba(128,128,128,0.35)', flexShrink: 0 } }),
      React.createElement('div', { style: { width: 1, height: 26, background: 'var(--border)', margin: '0 3px' } }),
      React.createElement('button', { onClick: undo, disabled: !snapshots.length, style: { padding: '4px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--surface2)', cursor: snapshots.length ? 'pointer' : 'not-allowed', fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font)', opacity: snapshots.length ? 1 : 0.4 } }, 'Undo'),
      React.createElement('button', { onClick: clear, style: { padding: '4px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 11, color: 'var(--text)', fontFamily: 'var(--font)' } }, 'Clear')
    ),
    // Canvas
    React.createElement('canvas', {
      ref: canvasRef, width: canvasW, height: canvasH,
      onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp,
      style: { display: 'block', borderRadius: 8, cursor: tool === 'eraser' ? 'cell' : 'crosshair', border: '1px solid rgba(255,255,255,0.12)', maxWidth: '92vw', maxHeight: '60vh', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }
    }),
    // Actions
    React.createElement('div', { style: { display: 'flex', gap: 10, alignItems: 'center' } },
      React.createElement('div', { style: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginRight: 4 } }, 'Draw on the chart, then send to AI Coach'),
      React.createElement('button', { onClick: onCancel, style: { padding: '8px 22px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' } }, 'Cancel'),
      React.createElement('button', { onClick: () => onDone(canvasRef.current.toDataURL('image/png')), style: { padding: '8px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4B44C8,#7c3aed)', color: '#fff', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer' } }, 'Use Annotated Image')
    )
  );
}

// ── AI annotation renderer ────────────────────────────────────────────────────
async function drawAnnotationsOnImage(imgSrc, annotations) {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const W = img.naturalWidth || 800;
      const H = img.naturalHeight || 500;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);

      const sc = Math.min(W, H) / 480;
      const lw = Math.max(sc * 2.8, 2);
      const fs = Math.max(Math.round(sc * 12.5), 11);
      const placed = []; // label collision tracking

      // Rounded rect helper (cross-browser safe)
      function fillRoundRect(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.fill();
      }

      function drawLabel(text, anchorX, anchorY, color) {
        ctx.save();
        ctx.font = 'bold ' + fs + 'px -apple-system, system-ui, Arial, sans-serif';
        const tw = ctx.measureText(text).width;
        const padX = sc * 8, padY = sc * 5;
        const bw = tw + padX * 2, bh = fs + padY * 2;

        // Initial position: above-left of anchor
        let lx = anchorX, ly = anchorY - bh - sc * 6;

        // Clamp to image bounds
        if (lx + bw > W - 4) lx = W - bw - 4;
        if (lx < 2) lx = 2;
        if (ly < 2) ly = anchorY + sc * 6;
        if (ly + bh > H - 2) ly = anchorY - bh - sc * 6;

        // Collision: push down until clear (max 4 attempts)
        for (let t = 0; t < 4; t++) {
          const hit = placed.some(r => lx < r.x + r.w + 2 && lx + bw > r.x - 2 && ly < r.y + r.h + 2 && ly + bh > r.y - 2);
          if (!hit) break;
          ly += bh + sc * 4;
          if (ly + bh > H - 2) { ly = Math.max(2, anchorY - bh * (t + 2) - sc * 6); break; }
        }
        placed.push({ x: lx, y: ly, w: bw, h: bh });

        // Drop shadow
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = sc * 8;
        ctx.shadowOffsetX = sc; ctx.shadowOffsetY = sc;

        // Dark pill background
        ctx.fillStyle = 'rgba(8,8,12,0.88)';
        fillRoundRect(lx, ly, bw, bh, bh / 2);

        // Colored left accent
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.fillStyle = color;
        fillRoundRect(lx, ly, sc * 4, bh, sc * 2);

        // Label text
        ctx.fillStyle = '#fff';
        ctx.fillText(text, lx + padX + sc * 3, ly + fs + padY * 0.6);
        ctx.restore();
      }

      function setShadow() {
        ctx.shadowColor = 'rgba(0,0,0,0.75)';
        ctx.shadowBlur = lw * 3.5;
      }
      function clrShadow() {
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      }

      function filledArrow(x, y, angle, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        setShadow();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size * Math.cos(angle - Math.PI / 7), y - size * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(x - size * 0.45 * Math.cos(angle), y - size * 0.45 * Math.sin(angle));
        ctx.lineTo(x - size * Math.cos(angle + Math.PI / 7), y - size * Math.sin(angle + Math.PI / 7));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
      }

      annotations.forEach(ann => {
        const c = /^#[0-9a-fA-F]{6}$/.test(ann.color) ? ann.color : '#ff3333';
        ctx.strokeStyle = c; ctx.fillStyle = c;
        ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.globalAlpha = 1; ctx.setLineDash([]);
        clrShadow();

        if (ann.type === 'arrow') {
          const x1 = ann.x1 * W, y1 = ann.y1 * H, x2 = ann.x2 * W, y2 = ann.y2 * H;
          const headSz = Math.max(lw * 5.5, sc * 14);
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const x2s = x2 - headSz * 0.55 * Math.cos(angle);
          const y2s = y2 - headSz * 0.55 * Math.sin(angle);
          setShadow();
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2s, y2s); ctx.stroke();
          clrShadow();
          filledArrow(x2, y2, angle, headSz, c);
          if (ann.label) drawLabel(ann.label, x2, y2, c);

        } else if (ann.type === 'rect') {
          const rx = ann.x * W, ry = ann.y * H, rw = ann.w * W, rh = ann.h * H;
          // Zone fill with subtle gradient
          const grad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
          grad.addColorStop(0, hexToRgba(c, 0.28));
          grad.addColorStop(1, hexToRgba(c, 0.08));
          ctx.fillStyle = grad;
          ctx.fillRect(rx, ry, rw, rh);
          // Top/bottom borders
          setShadow();
          ctx.strokeStyle = c; ctx.lineWidth = lw;
          ctx.strokeRect(rx, ry, rw, rh);
          clrShadow();
          // Thicker top border accent
          ctx.lineWidth = lw * 2;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.stroke();
          ctx.lineWidth = lw;
          if (ann.label) drawLabel(ann.label, rx + rw * 0.15, ry, c);

        } else if (ann.type === 'hline') {
          ctx.setLineDash([sc * 12, sc * 6]);
          setShadow();
          ctx.lineWidth = lw * 1.2;
          ctx.beginPath(); ctx.moveTo(W * 0.01, ann.y * H); ctx.lineTo(W * 0.86, ann.y * H); ctx.stroke();
          clrShadow(); ctx.setLineDash([]); ctx.lineWidth = lw;
          // Tiny tick at start
          ctx.beginPath(); ctx.moveTo(W * 0.01, ann.y * H - lw * 2); ctx.lineTo(W * 0.01, ann.y * H + lw * 2); ctx.stroke();
          if (ann.label) drawLabel(ann.label, W * 0.03, ann.y * H, c);

        } else if (ann.type === 'vline') {
          ctx.setLineDash([sc * 12, sc * 6]);
          setShadow();
          ctx.lineWidth = lw * 1.2;
          ctx.beginPath(); ctx.moveTo(ann.x * W, H * 0.04); ctx.lineTo(ann.x * W, H * 0.92); ctx.stroke();
          clrShadow(); ctx.setLineDash([]); ctx.lineWidth = lw;
          if (ann.label) drawLabel(ann.label, ann.x * W, H * 0.1, c);

        } else if (ann.type === 'circle') {
          const cx = ann.cx * W, cy = ann.cy * H;
          const rx2 = (ann.r || 0.04) * W, ry2 = (ann.r || 0.04) * H;
          // Fill
          ctx.fillStyle = hexToRgba(c, 0.2);
          ctx.beginPath(); ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2); ctx.fill();
          // Stroke (glow effect via double draw)
          setShadow();
          ctx.strokeStyle = c; ctx.lineWidth = lw * 2;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2); ctx.stroke();
          clrShadow();
          ctx.lineWidth = lw;
          ctx.strokeStyle = c;
          ctx.beginPath(); ctx.ellipse(cx, cy, rx2, ry2, 0, 0, Math.PI * 2); ctx.stroke();
          if (ann.label) drawLabel(ann.label, cx, cy - ry2, c);

        } else if (ann.type === 'text') {
          drawLabel(ann.text || ann.label || '', ann.x * W, ann.y * H, c);
        }
      });

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = imgSrc;
  });
}

function stripAnnotations(text) {
  let r = text.replace(/\s*\[ANNOTATIONS\][\s\S]*?\[\/ANNOTATIONS\]\s*/g, '').trim();
  const partial = r.indexOf('[ANNOTATIONS]');
  if (partial !== -1) r = r.slice(0, partial).trim();
  return r;
}

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_CATS = [
  { label: 'My Stats', prompts: ['What are my strongest and weakest setups?', 'Break down my emotional trading patterns', 'Which asset am I most profitable on?', 'Review my last 10 trades and find patterns'] },
  { label: 'Concepts', prompts: ['Explain liquidity sweeps with a real example', 'What are orderblocks and how do I trade them?', 'Explain fair value gaps (FVGs)', 'How do I read the COT report?'] },
  { label: 'Risk', prompts: ['Help me size my next trade risking 1% of my account', 'What is a good risk:reward for my trading style?', 'How do I calculate max drawdown risk?', 'When should I reduce size after losses?'] },
  { label: 'Psychology', prompts: ['How do I stop revenge trading?', 'I keep moving my stop loss — how do I fix this?', 'How do I build unshakeable discipline?', 'I just had 3 losses in a row — what now?'] },
];

const WELCOME = '**Welcome. I\'m your TradeZar AI Coach.**\n\nI have full access to your trade journal, performance stats, playbook, and notes. Ask me anything.\n\n- **Analyze your data** — win rates, setups, emotional patterns\n- **Live decision help** — "should I take this trade?" with your actual stats\n- **Chart analysis** — paste a screenshot and I\'ll break it down\n- **Risk & sizing** — position sizing, R:R, drawdown management\n- **Explain any concept** — liquidity, price action, support & resistance, trend analysis, Wyckoff, COT, risk management, market structure, momentum, volume\n- **YouTube & articles** — paste the 🔗 button below to load any video or article and I\'ll break it down for you\n\nWhat do you want to work on?';

// ── Main component ────────────────────────────────────────────────────────────
export default function FloatingAICoach() {
  const [open, setOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState(0);
  const [pulse, setPulse] = useState(true);
  const [pendingImg, setPendingImg] = useState(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [showIngest, setShowIngest] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestedContent, setIngestedContent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [convId, setConvId] = useState(null);
  const [histLoading, setHistLoading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [hovConvId, setHovConvId] = useState(null);

  const convIdRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const recognRef = useRef(null);
  const sendRef = useRef(null);

  useEffect(() => { convIdRef.current = convId; }, [convId]);
  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 100); setPulse(false); } if (open && showSidebar) loadHistory(); }, [open, showSidebar]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  // External trigger (from trade rows, journal AI review, etc.)
  useEffect(() => {
    const handler = e => { setOpen(true); if (e.detail?.message) setTimeout(() => sendRef.current?.(e.detail.message, null, null), 200); };
    window.addEventListener('ai-coach-open', handler);
    return () => window.removeEventListener('ai-coach-open', handler);
  }, []);

  // Paste image
  useEffect(() => {
    const handler = e => {
      if (!open) return;
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      if (!item) return;
      readImageFile(item.getAsFile());
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [open]);

  function readImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPendingImg({ b64: ev.target.result, preview: ev.target.result, name: file.name || 'chart.png' });
    reader.readAsDataURL(file);
  }

  function toggleRecording() {
    if (recording) { recognRef.current?.stop(); setRecording(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported. Try Chrome.'); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = 'en-US';
    r.onresult = e => setInput(Array.from(e.results).map(r => r[0].transcript).join(''));
    r.onend = () => setRecording(false);
    r.start(); recognRef.current = r; setRecording(true);
  }

  async function ingestUrl_fn() {
    const val = ingestUrl.trim();
    if (!val) return;
    // If it's a URL, try to fetch it. Otherwise treat as raw pasted text/transcript.
    const isUrl = /^https?:\/\//.test(val);
    if (!isUrl) {
      // Raw text paste — use directly as context
      setIngestedContent({ type: 'text', title: 'Pasted content', content: val });
      setIngestUrl(''); setShowIngest(false);
      return;
    }
    setIngestLoading(true);
    try {
      const res = await fetch('/api/ai-coach/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: val }) });
      const data = await res.json();
      if (!res.ok || data.error) {
        // URL failed — ask user to paste transcript text instead
        setIngestUrl('');
        const isYT = /youtube|youtu\.be/.test(val);
        const hint = isYT
          ? 'YouTube blocked automatic transcript fetch. On YouTube, click the three dots ··· under the video → Show transcript → copy it and paste it here.'
          : 'Could not load that URL. Try copying the page text and pasting it here instead.';
        // Insert hint as placeholder so user knows what to do
        setIngestUrl(hint.startsWith('YouTube') ? '' : '');
        alert(hint);
        return;
      }
      setIngestedContent(data); setIngestUrl(''); setShowIngest(false);
    } catch (e) { alert('Network error. Paste the transcript text directly instead.'); } finally { setIngestLoading(false); }
  }

  async function loadHistory() {
    setHistLoading(true);
    try { const r = await fetch('/api/ai-coach/history'); const d = await r.json(); setConversations(d.conversations || []); } catch {} finally { setHistLoading(false); }
  }

  // Always auto-saves — accepts final msgs array to avoid stale state
  async function saveConversation(msgsOverride) {
    const src = msgsOverride || messages;
    const saveable = src.filter(m => m.role === 'user' || m.role === 'assistant');
    if (saveable.length < 2) return;
    const title = src.find(m => m.role === 'user')?.content?.slice(0, 60) || 'Conversation';
    const cid = convIdRef.current;
    try {
      const res = await fetch('/api/ai-coach/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: cid || undefined, messages: saveable, title }) });
      const d = await res.json();
      if (d.conversationId) {
        const newId = d.conversationId;
        convIdRef.current = newId;
        setConvId(newId);
        // Optimistic update of sidebar list
        setConversations(prev => {
          const entry = { id: newId, title, updatedAt: new Date().toISOString(), messages: saveable };
          const idx = prev.findIndex(c => c.id === newId);
          return idx >= 0 ? [entry, ...prev.filter(c => c.id !== newId)] : [entry, ...prev];
        });
      }
    } catch {}
  }

  function loadConversation(conv) {
    setMessages(conv.messages.map(m => ({ role: m.role, content: m.content })));
    convIdRef.current = conv.id;
    setConvId(conv.id);
    setFollowUps([]);
  }

  async function deleteConversation(id) {
    await fetch('/api/ai-coach/history?id=' + id, { method: 'DELETE' });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (convIdRef.current === id) { convIdRef.current = null; setConvId(null); }
  }

  async function renameConversation(id, val) {
    const title = val.trim() || 'Untitled';
    await fetch('/api/ai-coach/history', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title }) });
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    setRenamingId(null);
  }

  async function generateFollowUps(msgs) {
    try {
      const r = await fetch('/api/ai-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'followups', messages: msgs }) });
      const d = await r.json();
      if (d.followups?.length) setFollowUps(d.followups);
    } catch {}
  }

  function morningBriefing() {
    const ctx = gatherTraderContext();
    const msg = ctx?.summary
      ? 'Give me a complete morning session briefing for today. Include: (1) a review of my recent performance trends based on my stats, (2) key things to focus on based on my weak areas, (3) risk management reminders given my drawdown and emotional trade history, (4) any mental/process notes for today\'s session. Be specific and direct — use my actual numbers.'
      : 'Give me a comprehensive morning trading session briefing. Cover: pre-session mindset, key levels to watch, risk management protocol, and a framework for staying disciplined throughout the day.';
    send(msg);
  }

  async function send(text, imgOverride, ingestOverride) {
    const content = (text || input).trim();
    if (!content && !imgOverride && !pendingImg) return;
    if (busy) return;
    const img = imgOverride !== undefined ? imgOverride : pendingImg;
    let ingested = ingestOverride !== undefined ? ingestOverride : ingestedContent;

    // Auto-detect URLs — ingest them transparently before sending
    if (!ingested) {
      const urlMatch = content.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const detectedUrl = urlMatch[0];
        // Show the user's message first so chat feels responsive
        setMessages(prev => [...prev, { role: 'user', content: content }]);
        setInput('');
        setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
        setBusy(true);
        setIngestLoading(true);
        let ingestErr = null;
        try {
          const ingestRes = await fetch('/api/ai-coach/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: detectedUrl }),
          });
          const ingestData = await ingestRes.json();
          if (ingestRes.ok && !ingestData.error) {
            ingested = ingestData;
          } else {
            ingestErr = ingestData.error || 'Could not load that link.';
          }
        } catch (e) {
          ingestErr = 'Network error loading the link.';
        }
        setIngestLoading(false);
        if (ingestErr) {
          // Ingest failed — show a helpful message, don't send to AI
          const isYT = /youtube\.com|youtu\.be/.test(detectedUrl);
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: isYT
                ? 'YouTube blocks automatic transcript fetching from servers. Use the 🔗 button below to load content — paste the video URL there, click Load, and if it still fails, open the video on YouTube, click the three dots ··· → Show transcript, copy it, then paste the transcript text into that same box and click Load.'
                : 'Could not automatically load that page. Use the 🔗 button below — paste the URL or copy the page text directly into the box and click Load.',
              streaming: false,
            };
            return next;
          });
          setBusy(false);
          return;
        }
        // Ingest succeeded — continue with the rest of send() but skip re-adding the user message
        setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: 'assistant', content: '', streaming: true }; return next; });
        setPendingImg(null); setIngestedContent(null); setFollowUps([]);
        const tradeContext2 = gatherTraderContext();
        const history2 = [...messages, { role: 'user', content, image: null }].map(m => ({ role: m.role, content: m.content, image: m.image || null }));
        try {
          const res2 = await fetch('/api/ai-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history2, tradeContext: tradeContext2, ingestedContent: ingested }) });
          if (res2.status === 429) {
            const d2 = await res2.json();
            setMessages(prev => { const next=[...prev]; next[next.length-1]={role:'assistant',content:d2.message||'Daily limit reached.',isLimit:true,plan:d2.plan}; return next; });
            setBusy(false); return;
          }
          if (!res2.ok || !res2.body) {
            const d2 = await res2.json().catch(()=>({}));
            setMessages(prev => { const next=[...prev]; next[next.length-1]={role:'assistant',content:d2.error||'Something went wrong.'}; return next; });
            setBusy(false); return;
          }
          const reader2 = res2.body.getReader();
          const decoder2 = new TextDecoder();
          let full2 = '';
          while (true) {
            const { done, value } = await reader2.read();
            if (done) break;
            full2 += decoder2.decode(value, { stream: true });
            const snap2 = stripAnnotations(full2);
            setMessages(prev => { const next=[...prev]; next[next.length-1]={role:'assistant',content:snap2,streaming:true}; return next; });
          }
          const clean2 = stripAnnotations(full2);
          setMessages(prev => { const next=[...prev]; next[next.length-1]={role:'assistant',content:clean2,streaming:false}; return next; });
          const finalMsgs2 = [...history2, { role:'assistant', content:clean2 }];
          generateFollowUps(finalMsgs2);
          saveConversation(finalMsgs2);
        } catch {
          setMessages(prev => { const next=[...prev]; next[next.length-1]={role:'assistant',content:'Connection error. Please try again.'}; return next; });
        }
        setBusy(false);
        return; // done — skip the normal send flow below
      }
    }

    const userMsg = { role: 'user', content: content || '[Analyzing chart image]', image: img?.b64 || null };
    setMessages(prev => [...prev, userMsg]);
    setInput(''); setPendingImg(null); setIngestedContent(null); setFollowUps([]); setBusy(true);
    const tradeContext = gatherTraderContext();
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content, image: m.image || null }));
    try {
      const res = await fetch('/api/ai-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, tradeContext, ingestedContent: ingested || null }) });
      if (res.status === 429) {
        const d = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: d.message || 'Daily limit reached.', isLimit: true, plan: d.plan }]);
        setBusy(false); return;
      }
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { role: 'assistant', content: d.error || 'Something went wrong.' }]);
        setBusy(false); return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const snap = stripAnnotations(full);
        setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: 'assistant', content: snap, streaming: true }; return next; });
      }
      // Parse AI annotations from full response and render onto the image
      const cleanFull = stripAnnotations(full);
      let annotatedImg = null;
      const annotMatch = full.match(/\[ANNOTATIONS\]([\s\S]*?)\[\/ANNOTATIONS\]/);
      if (annotMatch) {
        try {
          const annotData = JSON.parse(annotMatch[1].trim());
          const lastUserImg = [...history].reverse().find(m => m.image)?.image;
          if (lastUserImg && annotData.annotations?.length) {
            annotatedImg = await drawAnnotationsOnImage(lastUserImg, annotData.annotations);
          }
        } catch {}
      }
      setMessages(prev => { const next = [...prev]; next[next.length - 1] = { role: 'assistant', content: cleanFull, streaming: false, annotatedImg }; return next; });
      const finalMsgs = [...history, { role: 'assistant', content: cleanFull }];
      generateFollowUps(finalMsgs);
      saveConversation(finalMsgs); // auto-save every exchange
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    }
    setBusy(false);
  }

  // Always keep ref pointing to latest send (avoids stale closures in effects)
  sendRef.current = send;

  function clearChat() {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    convIdRef.current = null; setConvId(null); setFollowUps([]); setPendingImg(null); setIngestedContent(null);
  }

  function groupConvs(convs) {
    const now = new Date();
    const groups = [{ label: 'Today', items: [] }, { label: 'Yesterday', items: [] }, { label: 'This Week', items: [] }, { label: 'Older', items: [] }];
    convs.forEach(c => {
      const diff = Math.floor((now - new Date(c.updatedAt)) / 86400000);
      if (diff === 0) groups[0].items.push(c);
      else if (diff === 1) groups[1].items.push(c);
      else if (diff <= 7) groups[2].items.push(c);
      else groups[3].items.push(c);
    });
    return groups.filter(g => g.items.length);
  }

  const isWelcome = messages.length <= 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return React.createElement(React.Fragment, null,

    // Floating button
    React.createElement('button', {
      onClick: () => setOpen(s => !s), title: 'AI Coach',
      style: { position: 'fixed', bottom: 26, right: 26, zIndex: 500, width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#4B44C8,#7c3aed)', border: 'none', boxShadow: '0 4px 20px rgba(75,68,200,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.2s', color: '#fff', animation: pulse ? 'tz-pulse 2.4s ease-in-out infinite' : 'none' },
      onMouseEnter: e => { e.currentTarget.style.transform = 'scale(1.1)'; },
      onMouseLeave: e => { e.currentTarget.style.transform = 'scale(1)'; },
    }, open ? '✕' : '✦'),

    // Drawing canvas overlay
    drawOpen && pendingImg && React.createElement(DrawingCanvas, {
      src: pendingImg.b64,
      onDone: dataUrl => { setPendingImg({ b64: dataUrl, preview: dataUrl, name: 'annotated.png' }); setDrawOpen(false); },
      onCancel: () => setDrawOpen(false),
    }),

    // Chat panel
    open && React.createElement('div', {
      style: { position: 'fixed', bottom: 90, right: 26, zIndex: 499, width: showSidebar ? 740 : 540, height: 700, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)', animation: 'tz-up 0.2s ease-out', transition: 'width 0.2s ease', overflow: 'hidden' }
    },

      // Header (full width)
      React.createElement('div', { style: { padding: '10px 14px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, borderRadius: '16px 16px 0 0', background: 'linear-gradient(135deg,rgba(75,68,200,0.08),rgba(124,58,237,0.06))' } },
        React.createElement('div', { style: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4B44C8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, color: '#fff' } }, '✦'),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 700, color: 'var(--text)' } }, 'AI Coach'),
          React.createElement('div', { style: { fontSize: 10, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3 } },
            React.createElement('div', { style: { width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' } }),
            'Live journal access · calendar aware'
          )
        ),
        React.createElement('button', {
          onClick: morningBriefing, title: 'Morning briefing',
          style: { background: 'none', border: '0.5px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font)', padding: '3px 8px', transition: 'all 0.1s', whiteSpace: 'nowrap' },
          onMouseEnter: e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = PURPLE; },
          onMouseLeave: e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }
        }, '☀ Briefing'),
        // Chat history toggle
        React.createElement('button', {
          onClick: () => { const next = !showSidebar; setShowSidebar(next); if (next) loadHistory(); },
          title: 'Chat history',
          style: { background: showSidebar ? 'rgba(75,68,200,0.1)' : 'none', border: '0.5px solid ' + (showSidebar ? PURPLE : 'var(--border)'), borderRadius: 6, cursor: 'pointer', color: showSidebar ? PURPLE : 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font)', padding: '3px 8px', transition: 'all 0.1s' }
        }, '⟳ Chats'),
        // New chat
        React.createElement('button', {
          onClick: clearChat,
          style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font)', padding: '3px 8px', borderRadius: 5, transition: 'all 0.1s' },
          onMouseEnter: e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; },
          onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }
        }, '+ New')
      ),

      // Body: sidebar + chat column
      React.createElement('div', { style: { display: 'flex', flex: 1, overflow: 'hidden' } },

        // ── History sidebar
        showSidebar && React.createElement('div', { style: { width: 200, flexShrink: 0, borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--surface)' } },
          histLoading
            ? React.createElement('div', { style: { textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 11 } }, 'Loading...')
            : conversations.length === 0
              ? React.createElement('div', { style: { padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 } },
                  React.createElement('div', { style: { fontSize: 26, marginBottom: 8, opacity: 0.3 } }, '⟳'),
                  'No conversations yet.',
                  React.createElement('div', { style: { marginTop: 4, fontSize: 10 } }, 'Start chatting — they auto-save.')
                )
              : React.createElement('div', { style: { padding: '6px 6px' } },
                  ...groupConvs(conversations).map(group =>
                    React.createElement('div', { key: group.label },
                      React.createElement('div', { style: { fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 3px' } }, group.label),
                      ...group.items.map(c =>
                        React.createElement('div', {
                          key: c.id,
                          onClick: () => loadConversation(c),
                          onMouseEnter: () => setHovConvId(c.id),
                          onMouseLeave: () => setHovConvId(null),
                          style: { padding: '6px 8px', borderRadius: 7, cursor: 'pointer', background: convId === c.id ? 'rgba(75,68,200,0.1)' : hovConvId === c.id ? 'var(--surface2)' : 'transparent', border: '0.5px solid ' + (convId === c.id ? 'rgba(75,68,200,0.3)' : 'transparent'), marginBottom: 2, transition: 'all 0.1s' }
                        },
                          renamingId === c.id
                            ? React.createElement('input', {
                                autoFocus: true, value: renameVal,
                                onChange: e => setRenameVal(e.target.value),
                                onKeyDown: e => { if (e.key === 'Enter') renameConversation(c.id, renameVal); if (e.key === 'Escape') setRenamingId(null); },
                                onBlur: () => renameConversation(c.id, renameVal),
                                onClick: e => e.stopPropagation(),
                                style: { width: '100%', fontSize: 11, padding: '2px 4px', borderRadius: 4, border: '0.5px solid ' + PURPLE, background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }
                              })
                            : React.createElement('div', { style: { fontSize: 11, color: 'var(--text)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, c.title || 'Conversation'),
                          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 } },
                            React.createElement('div', { style: { fontSize: 9, color: 'var(--text-muted)', flex: 1 } }, new Date(c.updatedAt).toLocaleDateString()),
                            (hovConvId === c.id || renamingId === c.id || convId === c.id) && React.createElement(React.Fragment, null,
                              React.createElement('button', {
                                onClick: e => { e.stopPropagation(); setRenamingId(c.id); setRenameVal(c.title || ''); },
                                title: 'Rename',
                                style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: '1px 3px', lineHeight: 1, borderRadius: 3 },
                                onMouseEnter: e => { e.currentTarget.style.color = PURPLE; },
                                onMouseLeave: e => { e.currentTarget.style.color = 'var(--text-muted)'; }
                              }, '✏'),
                              React.createElement('button', {
                                onClick: e => { e.stopPropagation(); deleteConversation(c.id); },
                                title: 'Delete',
                                style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '1px 3px', lineHeight: 1, borderRadius: 3 },
                                onMouseEnter: e => { e.currentTarget.style.color = 'var(--red)'; },
                                onMouseLeave: e => { e.currentTarget.style.color = 'var(--text-muted)'; }
                              }, '×')
                            )
                          )
                        )
                      )
                    )
                  )
                )
        ),

        // ── Chat column
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 } },

          // Messages
          React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 } },
            ...messages.map((m, i) =>
              React.createElement('div', { key: i, style: { display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' } },
                m.role === 'assistant' && React.createElement('div', { style: { width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4B44C8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginRight: 6, marginTop: 2, color: '#fff' } }, '✦'),
                React.createElement('div', { style: { maxWidth: '85%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px', background: m.role === 'user' ? 'linear-gradient(135deg,#4B44C8,#7c3aed)' : m.isLimit ? 'rgba(245,158,11,0.08)' : 'var(--surface2)', color: m.role === 'user' ? '#fff' : m.isLimit ? '#f59e0b' : 'var(--text)', border: m.isLimit ? '0.5px solid rgba(245,158,11,0.3)' : 'none', fontSize: 13.5, lineHeight: 1.65 } },
                  m.role === 'user' && m.image && React.createElement('img', { src: m.image, alt: 'chart', style: { display: 'block', maxWidth: '100%', borderRadius: 6, marginBottom: 6, maxHeight: 120, objectFit: 'cover' } }),
                  m.role === 'user' ? React.createElement('span', null, m.content) : React.createElement(Markdown, { text: m.content }),
                  m.annotatedImg && React.createElement('div', { style: { marginTop: 8 } },
                    React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 } }, '✦ AI Annotated Chart'),
                    React.createElement('img', { src: m.annotatedImg, alt: 'AI annotated chart', style: { display: 'block', maxWidth: '100%', borderRadius: 7, border: '0.5px solid var(--border)' } })
                  ),
                  m.streaming && React.createElement('span', { style: { display: 'inline-block', width: 8, height: 14, background: PURPLE, borderRadius: 1, marginLeft: 2, animation: 'tz-blink 0.8s step-end infinite', verticalAlign: 'text-bottom' } }),
                  m.isLimit && React.createElement('button', { onClick: () => { window.location.href = '/api/stripe/checkout?plan=pro'; }, style: { display: 'block', marginTop: 8, padding: '5px 14px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#fff', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, cursor: 'pointer' } }, 'Upgrade to Pro →')
                )
              )
            ),
            busy && !messages[messages.length - 1]?.streaming && React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
              React.createElement('div', { style: { width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#4B44C8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, color: '#fff' } }, '✦'),
              React.createElement('div', { style: { background: 'var(--surface2)', borderRadius: '3px 14px 14px 14px', padding: '6px 12px' } }, React.createElement(Dots))
            ),
            React.createElement('div', { ref: bottomRef })
          ),

          // Quick prompts removed

          // Follow-up suggestions
          followUps.length > 0 && React.createElement('div', { style: { padding: '0 12px 8px', flexShrink: 0 } },
            React.createElement('div', { style: { fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Follow-up'),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 3 } },
              ...followUps.map(q => React.createElement('button', { key: q, onClick: () => send(q), style: { padding: '5px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s', lineHeight: 1.4 }, onMouseEnter: e => { e.currentTarget.style.borderColor = PURPLE; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'rgba(75,68,200,0.04)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface2)'; } }, q))
            )
          ),

          // Ingested content chip
          ingestedContent && React.createElement('div', { style: { padding: '0 12px 6px', flexShrink: 0 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 7, background: 'rgba(75,68,200,0.08)', border: '0.5px solid rgba(75,68,200,0.25)' } },
              React.createElement('span', { style: { fontSize: 12 } }, '📎'),
              React.createElement('span', { style: { fontSize: 11, color: PURPLE, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, (ingestedContent.type === 'youtube' ? '▶ ' : '🔗 ') + (ingestedContent.title || 'Content loaded')),
              React.createElement('button', { onClick: () => setIngestedContent(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: 14, padding: '0 2px' } }, '×')
            )
          ),

          // Pending image preview + annotate button
          pendingImg && React.createElement('div', { style: { padding: '0 12px 6px', flexShrink: 0 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement('img', { src: pendingImg.preview, alt: 'chart preview', style: { height: 56, borderRadius: 6, border: '0.5px solid var(--border)', objectFit: 'cover' } }),
                React.createElement('button', { onClick: () => setPendingImg(null), style: { position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 } }, '×')
              ),
              React.createElement('button', {
                onClick: () => setDrawOpen(true),
                style: { padding: '5px 11px', borderRadius: 7, border: '0.5px solid ' + PURPLE, background: 'rgba(75,68,200,0.08)', color: PURPLE, fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s' },
                onMouseEnter: e => { e.currentTarget.style.background = 'rgba(75,68,200,0.18)'; },
                onMouseLeave: e => { e.currentTarget.style.background = 'rgba(75,68,200,0.08)'; }
              }, '✏ Annotate')
            )
          ),

          // URL ingest input
          showIngest && React.createElement('div', { style: { padding: '0 12px 6px', flexShrink: 0, display: 'flex', gap: 5 } },
            React.createElement('textarea', { value: ingestUrl, onChange: e => setIngestUrl(e.target.value), onKeyDown: e => { if (e.key === 'Escape') setShowIngest(false); }, placeholder: 'Paste a URL — or paste a YouTube transcript / article text directly', rows: 3, style: { flex: 1, padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--border)', background: 'var(--surface2)', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', outline: 'none', resize: 'vertical', lineHeight: 1.5 }, onFocus: e => { e.target.style.borderColor = PURPLE; }, onBlur: e => { e.target.style.borderColor = 'var(--border)'; } }),
            React.createElement('button', { onClick: ingestUrl_fn, disabled: ingestLoading || !ingestUrl.trim(), style: { padding: '7px 12px', borderRadius: 7, border: 'none', background: PURPLE, color: '#fff', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: ingestLoading || !ingestUrl.trim() ? 0.5 : 1, alignSelf: 'flex-start' } }, ingestLoading ? '…' : 'Load')
          ),

          // Input row
          React.createElement('div', { style: { padding: '8px 10px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-end' } },
            React.createElement('button', { onClick: () => fileRef.current?.click(), title: 'Attach chart (or paste)', style: { width: 34, height: 34, borderRadius: 8, border: '0.5px solid ' + (pendingImg ? PURPLE : 'var(--border)'), background: pendingImg ? 'rgba(75,68,200,0.1)' : 'transparent', cursor: 'pointer', color: pendingImg ? PURPLE : 'var(--text-muted)', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' } }, '📷'),
            React.createElement('input', { ref: fileRef, type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: e => readImageFile(e.target.files[0]) }),
            React.createElement('button', { onClick: () => setShowIngest(s => !s), title: 'Ingest YouTube/article URL', style: { width: 34, height: 34, borderRadius: 8, border: '0.5px solid ' + (showIngest ? PURPLE : 'var(--border)'), background: showIngest ? 'rgba(75,68,200,0.1)' : 'transparent', cursor: 'pointer', color: showIngest ? PURPLE : 'var(--text-muted)', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' } }, '🔗'),
            React.createElement('button', { onClick: toggleRecording, title: recording ? 'Stop recording' : 'Voice input', style: { width: 34, height: 34, borderRadius: 8, border: '0.5px solid ' + (recording ? 'var(--red)' : 'var(--border)'), background: recording ? 'rgba(220,38,38,0.1)' : 'transparent', cursor: 'pointer', color: recording ? 'var(--red)' : 'var(--text-muted)', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s', animation: recording ? 'tz-pulse-red 1s ease-in-out infinite' : 'none' } }, '🎤'),
            React.createElement('textarea', {
              ref: inputRef, value: input,
              onChange: e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; },
              onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } },
              placeholder: recording ? 'Listening…' : 'Ask your AI coach… (Shift+Enter = newline)',
              rows: 1,
              style: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: recording ? 'rgba(220,38,38,0.05)' : 'var(--surface2)', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'none', lineHeight: 1.5, transition: 'border-color 0.15s', overflow: 'hidden' },
              onFocus: e => { e.target.style.borderColor = PURPLE; },
              onBlur: e => { e.target.style.borderColor = 'var(--border)'; }
            }),
            React.createElement('button', {
              onClick: () => send(), disabled: busy || (!input.trim() && !pendingImg),
              style: { width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0, background: busy || (!input.trim() && !pendingImg) ? 'var(--surface2)' : 'linear-gradient(135deg,#4B44C8,#7c3aed)', color: busy || (!input.trim() && !pendingImg) ? 'var(--text-muted)' : '#fff', cursor: busy || (!input.trim() && !pendingImg) ? 'not-allowed' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
            }, '↑')
          )
        )
      )
    ),

    // Disclaimer
    React.createElement('div', { style: { textAlign: 'center', padding: '3px 12px 6px', flexShrink: 0 } },
      React.createElement('span', { style: { fontFamily: 'var(--font)', fontSize: 9.5, color: 'var(--text-muted)', opacity: 0.55, lineHeight: 1.4 } }, '⚠ Educational analysis only — not financial advice. Verify all data before trading.')
    ),

    // Styles
    React.createElement('style', null,
      '@keyframes tz-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}' +
      '@keyframes tz-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes tz-pulse{0%,100%{box-shadow:0 4px 20px rgba(75,68,200,0.45)}50%{box-shadow:0 4px 32px rgba(75,68,200,0.75)}}' +
      '@keyframes tz-pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}' +
      '@keyframes tz-blink{0%,100%{opacity:1}50%{opacity:0}}'
    )
  );
}
