'use client';
import { useState, useEffect, useRef } from 'react';

const PURPLE = '#4f46e5';
const TIMEFRAMES = ['Daily','Weekly','Monthly','Quarterly','Annual'];
const STORAGE_KEY = 'tr_reviews_v2';

const BLOCK_TYPES = [
  { type:'text',      label:'Text',           icon:'T'  },
  { type:'heading',   label:'Heading',        icon:'H'  },
  { type:'bullet',    label:'Bullet',         icon:'•'  },
  { type:'checklist', label:'Checklist',      icon:'✓'  },
  { type:'rating',    label:'Rating (1-10)',  icon:'★'  },
  { type:'trade',     label:'Trade Tag',      icon:'📈' },
  { type:'divider',   label:'Divider',        icon:'—'  },
  { type:'number',    label:'Number / Stat',  icon:'#'  },
];

function getPeriodKey(tf) {
  const now = new Date();
  if (tf === 'Daily')     return now.toISOString().slice(0,10);
  if (tf === 'Weekly') {
    const d = now.getDay(), diff = now.getDate() - d + (d === 0 ? -6 : 1);
    const mon = new Date(now); mon.setDate(diff);
    return mon.toISOString().slice(0,10);
  }
  if (tf === 'Monthly')   return now.toISOString().slice(0,7);
  if (tf === 'Quarterly') return now.getFullYear()+'-Q'+(Math.floor(now.getMonth()/3)+1);
  return now.getFullYear().toString();
}

function getPeriodLabel(tf, key) {
  if (!key) return '';
  if (tf === 'Daily')     return new Date(key+'T12:00:00').toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  if (tf === 'Weekly')    return 'Week of '+new Date(key+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});
  if (tf === 'Monthly')   { const [y,m]=key.split('-'); return new Date(y,m-1).toLocaleDateString([],{month:'long',year:'numeric'}); }
  if (tf === 'Quarterly') return key.replace('-',' ');
  return key;
}

function newBlock(type='text') {
  return { id: Date.now()+Math.random(), type, content:'', checked:false, value:null, label:'', asset:'', direction:'', result:'', notes:'' };
}

function makeBlankReview() {
  return { blocks: [newBlock('text')], updatedAt: new Date().toISOString() };
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function Block({ block, onChange, onDelete, onAddAfter, autoFocus }) {
  const [hov, setHov] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const taRef = useRef(null);

  useEffect(() => { if (autoFocus && taRef.current) taRef.current.focus(); }, [autoFocus]);

  const base = {
    width:'100%', border:'none', outline:'none', background:'transparent',
    fontFamily:'var(--font)', color:'var(--text)', resize:'none', padding:0, lineHeight:1.7,
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'text') {
      e.preventDefault();
      onAddAfter(block.id, block.type === 'bullet' ? 'bullet' : block.type === 'checklist' ? 'checklist' : 'text');
    }
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setShowMenu(false); }}
      style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'3px 0', position:'relative' }}
    >
      <div style={{ display:'flex', gap:2, opacity: hov ? 1 : 0, transition:'opacity 0.1s', flexShrink:0, paddingTop:4, minWidth:44 }}>
        <button onClick={() => setShowMenu(s => !s)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--surface2)', cursor:'pointer', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        <button onClick={() => onDelete(block.id)} style={{ width:20, height:20, borderRadius:4, border:'none', background:'var(--surface2)', cursor:'pointer', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>⋮</button>
      </div>

      {showMenu && (
        <div onMouseLeave={() => setShowMenu(false)} style={{ position:'absolute', left:48, top:0, zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:6, boxShadow:'0 8px 24px rgba(0,0,0,0.18)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, width:240 }}>
          {BLOCK_TYPES.map(bt => (
            <button key={bt.type} onClick={() => { onAddAfter(block.id, bt.type); setShowMenu(false); }}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:6, border:'none', background:'transparent', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ width:18, textAlign:'center', fontSize:11, fontWeight:700, color:PURPLE }}>{bt.icon}</span>{bt.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        {block.type === 'heading' && (
          <textarea ref={taRef} value={block.content} onChange={e => onChange(block.id,'content',e.target.value)} onKeyDown={handleKey} placeholder='Heading...' rows={1} style={{ ...base, fontSize:22, fontWeight:700 }} />
        )}
        {block.type === 'text' && (
          <textarea ref={taRef} value={block.content} onChange={e => onChange(block.id,'content',e.target.value)} onKeyDown={handleKey} placeholder='Write something...' rows={2} style={{ ...base, fontSize:14 }} />
        )}
        {block.type === 'bullet' && (
          <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ color:'var(--text-muted)', marginTop:5, flexShrink:0, fontSize:16 }}>•</span>
            <textarea ref={taRef} value={block.content} onChange={e => onChange(block.id,'content',e.target.value)} onKeyDown={handleKey} placeholder='List item...' rows={1} style={{ ...base, fontSize:14 }} />
          </div>
        )}
        {block.type === 'checklist' && (
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <input type='checkbox' checked={block.checked||false} onChange={e => onChange(block.id,'checked',e.target.checked)} style={{ marginTop:5, accentColor:PURPLE, flexShrink:0, width:15, height:15, cursor:'pointer' }} />
            <textarea ref={taRef} value={block.content} onChange={e => onChange(block.id,'content',e.target.value)} onKeyDown={handleKey} placeholder='Task...' rows={1} style={{ ...base, fontSize:14, textDecoration: block.checked ? 'line-through' : 'none', color: block.checked ? 'var(--text-muted)' : 'var(--text)' }} />
          </div>
        )}
        {block.type === 'rating' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <textarea ref={taRef} value={block.label||''} onChange={e => onChange(block.id,'label',e.target.value)} placeholder='What are you rating? (e.g. Discipline, Execution...)' rows={1} style={{ ...base, fontSize:13, flex:1, minWidth:160 }} />
            <div style={{ display:'flex', gap:3, flexShrink:0 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} onClick={() => onChange(block.id,'value',n)} style={{ width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:(block.value||0)>=n?PURPLE:'var(--surface2)', color:(block.value||0)>=n?'#fff':'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, cursor:'pointer' }}>{n}</button>
              ))}
            </div>
            {block.value && <span style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:800, color: block.value>=7?'var(--green)':block.value>=4?'#d97706':'var(--red)' }}>{block.value}/10</span>}
          </div>
        )}
        {block.type === 'number' && (
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <textarea ref={taRef} value={block.label||''} onChange={e => onChange(block.id,'label',e.target.value)} placeholder='Stat label (e.g. Total P&L, Trades taken...)' rows={1} style={{ ...base, fontSize:13, flex:1 }} />
            <input value={block.content||''} onChange={e => onChange(block.id,'content',e.target.value)} placeholder='Value' style={{ width:120, padding:'5px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--text)', outline:'none', textAlign:'right' }} />
          </div>
        )}
        {block.type === 'trade' && (
          <div style={{ background:'var(--surface2)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:PURPLE, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Trade Tag</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
              {['asset','direction','result'].map(f => (
                <div key={f}>
                  <div style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:3 }}>{f}</div>
                  <input value={block[f]||''} onChange={e => onChange(block.id,f,e.target.value)} placeholder={f==='direction'?'Long/Short':f==='result'?'+2.4%':'GC=F'} style={{ width:'100%', padding:'5px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <textarea value={block.notes||''} onChange={e => onChange(block.id,'notes',e.target.value)} placeholder='Trade notes...' rows={2} style={{ width:'100%', padding:'6px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', resize:'none', boxSizing:'border-box' }} />
          </div>
        )}
        {block.type === 'divider' && (
          <hr style={{ border:'none', borderTop:'1px solid var(--border)', margin:'8px 0' }} />
        )}
      </div>
    </div>
  );
}

function ReviewCalendar({ allReviews, onSelectDay }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const y = month.getFullYear(), m = month.getMonth();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const firstDay = new Date(y, m, 1).getDay();
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dailyReviews = allReviews['Daily::reviews'] || {};

  const hasReview = (day) => {
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return !!dailyReviews[key]?.blocks?.some(b => b.content || b.value || b.checked);
  };

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <button onClick={() => setMonth(new Date(y, m-1, 1))} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='15 18 9 12 15 6'/></svg>
        </button>
        <span style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', flex:1, textAlign:'center' }}>{MONTHS[m]} {y}</span>
        <button onClick={() => setMonth(new Date(y, m+1, 1))} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg>
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {DAYS.map(d => <div key={d} style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, color:'var(--text-muted)', textAlign:'center', padding:'4px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {Array(firstDay).fill(null).map((_,i) => <div key={'e'+i} />)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const day = i+1;
          const dateKey = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const done = hasReview(day);
          const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===day;
          return (
            <div key={day} onClick={() => onSelectDay(dateKey)}
              style={{ aspectRatio:'1', borderRadius:8, background: done ? 'rgba(79,70,229,0.18)' : 'var(--surface2)', border: isToday ? `2px solid ${PURPLE}` : done ? `1px solid ${PURPLE}44` : '1px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = done ? 'rgba(79,70,229,0.28)' : 'var(--surface3)'}
              onMouseLeave={e => e.currentTarget.style.background = done ? 'rgba(79,70,229,0.18)' : 'var(--surface2)'}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight: isToday?700:400, color: isToday?PURPLE: done?'var(--text)':'var(--text-muted)' }}>{day}</div>
              {done && <div style={{ width:5, height:5, borderRadius:'50%', background:PURPLE, marginTop:2 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:16, marginTop:12, justifyContent:'center' }}>
        {[['Reviewed','rgba(79,70,229,0.18)',`1px solid ${PURPLE}44`],['No review','var(--surface2)','1px solid var(--border)']].map(([label,bg,border]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:bg, border }} />
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JournalReviewTab() {
  const [tf, setTf] = useState('Daily');
  const [view, setView] = useState('editor');
  const [allReviews, setAllReviews] = useState({});
  const [newBlockId, setNewBlockId] = useState(null);
  const [jumpKey, setJumpKey] = useState(null);

  const storageKey = `${tf}::reviews`;
  const currentPeriodKey = jumpKey || getPeriodKey(tf);

  useEffect(() => { setAllReviews(load()); setJumpKey(null); }, [tf]);

  const periods = allReviews[storageKey] || {};
  const currentReview = periods[currentPeriodKey] || makeBlankReview();

  const persist = (updated) => {
    const next = { ...allReviews, [storageKey]: { ...(allReviews[storageKey]||{}), [currentPeriodKey]: { ...updated, updatedAt: new Date().toISOString() } } };
    setAllReviews(next); save(next);
  };

  const updateBlock = (id, field, val) => {
    persist({ ...currentReview, blocks: currentReview.blocks.map(b => b.id===id ? {...b,[field]:val} : b) });
  };

  const deleteBlock = (id) => {
    const blocks = currentReview.blocks.filter(b => b.id!==id);
    persist({ ...currentReview, blocks: blocks.length ? blocks : [newBlock('text')] });
  };

  const addBlockAfter = (afterId, type) => {
    const nb = newBlock(type); setNewBlockId(nb.id);
    const idx = currentReview.blocks.findIndex(b => b.id===afterId);
    const blocks = [...currentReview.blocks]; blocks.splice(idx+1, 0, nb);
    persist({ ...currentReview, blocks });
  };

  const addBlock = (type='text') => {
    const nb = newBlock(type); setNewBlockId(nb.id);
    persist({ ...currentReview, blocks: [...currentReview.blocks, nb] });
  };

  const historyList = Object.entries(periods).filter(([k]) => k!==currentPeriodKey).sort(([a],[b]) => b.localeCompare(a)).slice(0,30);
  const isCurrentPeriod = currentPeriodKey === getPeriodKey(tf);

  const prompts = {
    Daily:     ['What did I trade today?','Did I follow my plan?','What went well?','What would I change?','Emotional state today?','Key lesson learned?'],
    Weekly:    ['Best trade this week?','Worst trade this week?','Did I stick to my rules?','Win rate this week?','What patterns did I see?','Goals for next week?'],
    Monthly:   ['Total P&L this month?','Best performing setup?','Biggest mistake?','Rule violations?','Markets I traded best?','Goal for next month?'],
    Quarterly: ['Account growth this quarter?','Strategy performance?','What to improve?','Markets to focus on?','Risk management review?','Quarterly goal progress?'],
    Annual:    ['Annual P&L?','Best strategy this year?','Biggest growth area?','Goals achieved?','What to eliminate?','Focus for next year?'],
  };

  return (
    <div style={{ fontFamily:'var(--font)', display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)' }}>Journal Review</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {isCurrentPeriod ? `Current ${tf.toLowerCase()} period` : getPeriodLabel(tf, currentPeriodKey)}
            {!isCurrentPeriod && <button onClick={() => { setJumpKey(null); setView('editor'); }} style={{ marginLeft:10, fontSize:11, color:PURPLE, background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontWeight:600 }}>← Back to current</button>}
          </div>
        </div>
        <div style={{ display:'flex', gap:4, background:'var(--surface2)', borderRadius:10, padding:3 }}>
          {[['editor','✏️ Write'],['history','🕐 History'],['calendar','📅 Calendar']].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'5px 14px', borderRadius:7, border:'none', background: view===v?PURPLE:'transparent', color: view===v?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => { setTf(t); setJumpKey(null); setView('editor'); }} style={{ padding:'6px 18px', borderRadius:20, border: tf===t?'none':'1px solid var(--border)', background: tf===t?PURPLE:'var(--surface)', color: tf===t?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight: tf===t?700:400, cursor:'pointer', transition:'all 0.15s' }}>{t}</button>
        ))}
      </div>

      {view === 'calendar' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <ReviewCalendar allReviews={allReviews} onSelectDay={(dateKey) => { setTf('Daily'); setJumpKey(dateKey); setView('editor'); }} />
        </div>
      )}

      {view === 'history' && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:14 }}>Past {tf.toLowerCase()} reviews — click any to view or edit</div>
          {historyList.length === 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
              <div style={{ fontFamily:'var(--font)', fontSize:14, color:'var(--text-muted)' }}>No past {tf.toLowerCase()} reviews yet.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {historyList.map(([key, review]) => {
                const blockCount = review.blocks?.filter(b => b.content || b.value).length || 0;
                return (
                  <div key={key} onClick={() => { setJumpKey(key); setView('editor'); }}
                    style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=PURPLE}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                    <div style={{ width:40, height:40, borderRadius:10, background: blockCount?'rgba(79,70,229,0.15)':'var(--surface2)', border: blockCount?`1px solid ${PURPLE}44`:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{blockCount?'✍️':'📄'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)' }}>{getPeriodLabel(tf, key)}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{blockCount?`${blockCount} block${blockCount!==1?'s':''} · Last edited ${new Date(review.updatedAt).toLocaleDateString()}`:'Empty review'}</div>
                    </div>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ color:'var(--text-muted)' }}><polyline points='9 18 15 12 9 6'/></svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'editor' && (
        <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:PURPLE, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>{tf} Review</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)' }}>{getPeriodLabel(tf, currentPeriodKey)}</div>
                </div>
                {currentReview.updatedAt && <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Saved {new Date(currentReview.updatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>}
              </div>
              <div style={{ minHeight:120 }}>
                {currentReview.blocks.map(block => (
                  <Block key={block.id} block={block} onChange={updateBlock} onDelete={deleteBlock} onAddAfter={addBlockAfter} autoFocus={block.id===newBlockId} />
                ))}
              </div>
              <div style={{ display:'flex', gap:6, marginTop:16, flexWrap:'wrap' }}>
                {BLOCK_TYPES.slice(0,5).map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=PURPLE; e.currentTarget.style.color=PURPLE; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
                    <span style={{ fontSize:10, fontWeight:700 }}>{bt.icon}</span> {bt.label}
                  </button>
                ))}
                <button onClick={() => addBlock('divider')} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>— Divider</button>
              </div>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
              <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>💡 Review Prompts</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {(prompts[tf]||prompts.Daily).map(prompt => (
                  <button key={prompt} onClick={() => { const nb=newBlock('text'); nb.content=prompt+'\n'; setNewBlockId(nb.id); persist({...currentReview,blocks:[...currentReview.blocks,nb]}); }}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=PURPLE; e.currentTarget.style.color='var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ width:220, flexShrink:0 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Recent {tf}</div>
              {historyList.length===0 ? (
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'20px 0' }}>No history yet</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {historyList.slice(0,8).map(([key, review]) => {
                    const hasContent = review.blocks?.some(b => b.content||b.value);
                    return (
                      <button key={key} onClick={() => setJumpKey(key)}
                        style={{ padding:'8px 10px', borderRadius:8, border: currentPeriodKey===key?`1px solid ${PURPLE}`:'1px solid var(--border)', background: currentPeriodKey===key?'rgba(79,70,229,0.1)':'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.1s' }}
                        onMouseEnter={e => { if(currentPeriodKey!==key) e.currentTarget.style.background='var(--surface2)'; }}
                        onMouseLeave={e => { if(currentPeriodKey!==key) e.currentTarget.style.background='transparent'; }}>
                        <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color: currentPeriodKey===key?PURPLE:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{getPeriodLabel(tf,key)}</div>
                        <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{hasContent?'✍️ Has content':'📄 Empty'}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
