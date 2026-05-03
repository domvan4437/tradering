'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from './ThemeProvider'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  gold: 'var(--accent)',
  text: 'var(--text)',
  muted: 'var(--text-muted)',
  dim: 'var(--text-dim)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  greenBorder: 'var(--green-border)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  redBorder: 'var(--red-border)',
  yellow: 'var(--yellow)',
  blue: 'var(--blue)',
  purple: 'var(--purple)',
  shadow: 'var(--shadow)',
  shadowMd: 'var(--shadow-md)',
  radius: 'var(--radius)',
  font: 'var(--font)',
  mono: 'var(--font-mono)',
}

const NOTE_COLORS = ['none','#1a2a1a','#2a1a1a','#1a1a2a','#2a2a1a','#2a1a2a']
const NOTE_COLOR_LABELS = ['Default','Green','Red','Blue','Yellow','Purple']

function Label({ children, style }) { return <p style={{ fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',...style }}>{children}</p> }
function Card({ children, style }) { return <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'18px 22px',...style }}>{children}</div> }

// ─── Notes / Research Scratchpad ──────────────────────────────────────────────
export function NotesTab() {
  // ── All notes stored in localStorage (keyed by id) ──
  const NOTES_KEY = 'tr_notes_v2';

  function loadAllNotes() {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
  }
  function saveAllNotes(data) {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(data)); } catch {}
  }

  function makeNote(parentId = null, title = 'Untitled') {
    return {
      id: Date.now() + Math.random().toString(36).slice(2),
      title,
      content: '',
      tags: [],
      color: 'none',
      isPinned: false,
      parentId,
      childIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const [allNotes, setAllNotes] = useState({});
  const [pageStack, setPageStack] = useState([]); // stack of note ids — current page is last
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editColor, setEditColor] = useState('none');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const autoSaveRef = useRef(null);

  // Load on mount
  useEffect(() => {
    const saved = loadAllNotes();
    setAllNotes(saved);
  }, []);

  // Persist on change
  useEffect(() => {
    if (Object.keys(allNotes).length > 0) saveAllNotes(allNotes);
  }, [allNotes]);

  // Auto-save while editing
  useEffect(() => {
    if (!editingId) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      persistEdit(editingId, editTitle, editContent, editTags, editColor);
    }, 1000);
    return () => clearTimeout(autoSaveRef.current);
  }, [editTitle, editContent, editTags, editColor, editingId]);

  function persistEdit(id, title, content, tags, color) {
    const tagArr = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    setAllNotes(prev => ({
      ...prev,
      [id]: { ...prev[id], title, content, tags: tagArr, color, updatedAt: new Date().toISOString() }
    }));
  }

  // Current "folder" — root if pageStack empty, else last in stack
  const currentParentId = pageStack.length > 0 ? pageStack[pageStack.length - 1] : null;

  // Notes at current level
  const notesAtLevel = Object.values(allNotes).filter(n => n.parentId === currentParentId);

  // All tags at current level
  const allTags = [...new Set(notesAtLevel.flatMap(n => n.tags || []))];

  const filtered = notesAtLevel.filter(n => {
    const matchTag = !filter || (n.tags || []).includes(filter);
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  function newNote() {
    const note = makeNote(currentParentId, 'Untitled');
    setAllNotes(prev => {
      const next = { ...prev, [note.id]: note };
      // Add to parent's childIds if has parent
      if (currentParentId && next[currentParentId]) {
        next[currentParentId] = { ...next[currentParentId], childIds: [...(next[currentParentId].childIds || []), note.id] };
      }
      return next;
    });
    openEditor(note);
  }

  function openEditor(note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    setEditTags((note.tags || []).join(', '));
    setEditColor(note.color || 'none');
  }

  function closeEditor() {
    if (editingId) persistEdit(editingId, editTitle, editContent, editTags, editColor);
    setEditingId(null);
  }

  function openPage(noteId) {
    closeEditor();
    setPageStack(prev => [...prev, noteId]);
    setSearch('');
    setFilter('');
  }

  function goBack() {
    closeEditor();
    setPageStack(prev => prev.slice(0, -1));
    setSearch('');
    setFilter('');
  }

  function goToStackIndex(idx) {
    closeEditor();
    setPageStack(prev => prev.slice(0, idx + 1));
    setSearch('');
    setFilter('');
  }

  function goRoot() {
    closeEditor();
    setPageStack([]);
    setSearch('');
    setFilter('');
  }

  function deleteNote(id) {
    // Recursively delete note and all descendants
    function collectIds(noteId) {
      const note = allNotes[noteId];
      if (!note) return [noteId];
      return [noteId, ...(note.childIds || []).flatMap(collectIds)];
    }
    const toDelete = new Set(collectIds(id));
    setAllNotes(prev => {
      const next = { ...prev };
      toDelete.forEach(d => delete next[d]);
      // Remove from parent's childIds
      if (prev[id]?.parentId && next[prev[id].parentId]) {
        next[prev[id].parentId] = {
          ...next[prev[id].parentId],
          childIds: (next[prev[id].parentId].childIds || []).filter(c => c !== id)
        };
      }
      return next;
    });
    if (editingId === id) setEditingId(null);
  }

  function togglePin(note) {
    setAllNotes(prev => ({ ...prev, [note.id]: { ...prev[note.id], isPinned: !note.isPinned } }));
  }

  function addSubpage() {
    if (!editingId) return;
    persistEdit(editingId, editTitle, editContent, editTags, editColor);
    const sub = makeNote(editingId, 'Untitled Subpage');
    setAllNotes(prev => ({
      ...prev,
      [sub.id]: sub,
      [editingId]: { ...prev[editingId], childIds: [...(prev[editingId]?.childIds || []), sub.id] }
    }));
    openPage(editingId);
    setTimeout(() => openEditor(sub), 50);
  }

  // Breadcrumb trail
  const breadcrumbs = pageStack.map(id => allNotes[id]?.title || 'Untitled');

  // Count subpages for a note
  function subpageCount(id) {
    return (allNotes[id]?.childIds || []).filter(c => !!allNotes[c]).length;
  }

  const currentPageNote = currentParentId ? allNotes[currentParentId] : null;
  const wordCount = editContent.trim().split(/\s+/).filter(Boolean).length;

  // ── Editor view ──
  if (editingId && allNotes[editingId]) {
    const note = allNotes[editingId];
    const subpages = (note.childIds || []).map(id => allNotes[id]).filter(Boolean);
    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'calc(100vh - 180px)', fontFamily:'var(--font)' }}>
        {/* Toolbar */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)', marginBottom:16, flexWrap:'wrap' }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flex:1, flexWrap:'wrap', minWidth:0 }}>
            <button onClick={goRoot} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)', padding:'2px 4px' }}>📒 Notes</button>
            {pageStack.map((id, i) => (
              <div key={id} style={{display:"contents"}}>
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>/</span>
                <button onClick={() => goToStackIndex(i)} style={{ background:'none', border:'none', color: i === pageStack.length-1 ? 'var(--text)' : 'var(--text-muted)', fontSize:12, cursor:'pointer', fontFamily:'var(--font)', padding:'2px 4px', fontWeight: i === pageStack.length-1 ? 600 : 400 }}>
                  {allNotes[id]?.title || 'Untitled'}
                </button>
              </div>
            ))}
            {pageStack.length === 0 && (
              <>
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>/</span>
                <span style={{ fontSize:12, color:'var(--text)', fontWeight:600 }}>{editTitle || 'Untitled'}</span>
              </>
            )}
          </div>
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>{wordCount} words · auto-saving</span>
          {/* Color picker */}
          <div style={{ display:'flex', gap:3 }}>
            {['none','#1a1a2e','#0d2137','#1a2a0d','#2a1a0d','#1a0d2a'].map(col => (
              <button key={col} onClick={() => setEditColor(col)} style={{ width:14, height:14, borderRadius:3, background: col==='none' ? 'var(--border)' : col, border: editColor===col ? '2px solid var(--accent)' : '2px solid transparent', cursor:'pointer' }} />
            ))}
          </div>
          <button onClick={() => { closeEditor(); }} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'var(--font)', borderRadius:6 }}>← Back</button>
          <button onClick={() => { if(window.confirm('Delete this page and all its subpages? This cannot be undone.')) { deleteNote(editingId); closeEditor(); } }} style={{ background:'none', border:'1px solid var(--red)', color:'var(--red)', padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'var(--font)', borderRadius:6 }}>Delete</button>
        </div>

        {/* Title */}
        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
          style={{ background:'transparent', border:'none', fontSize:28, fontWeight:700, color:'var(--text)', outline:'none', fontFamily:'var(--font)', marginBottom:8, width:'100%' }}
          placeholder="Untitled" />

        {/* Tags */}
        <input value={editTags} onChange={e => setEditTags(e.target.value)}
          placeholder="Add tags: comma, separated"
          style={{ background:'transparent', border:'none', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', outline:'none', fontFamily:'var(--font)', marginBottom:16, padding:'4px 0', width:'100%' }} />

        {/* Content */}
        <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
          placeholder={"Write your notes here...\n\nTip: Use the '+ Add Subpage' button below to create nested pages inside this note."}
          style={{ flex:1, background: editColor !== 'none' ? editColor : 'transparent', border:'none', fontSize:14, color:'var(--text)', outline:'none', fontFamily:'var(--font)', resize:'none', lineHeight:1.8, minHeight:300, width:'100%', padding: editColor !== 'none' ? '16px' : '0', borderRadius: editColor !== 'none' ? 8 : 0 }} />

        {/* Subpages section */}
        <div style={{ marginTop:24, borderTop:'1px solid var(--border)', paddingTop:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Subpages {subpages.length > 0 && <span style={{ color:'var(--accent)' }}>({subpages.length})</span>}
            </div>
            <button onClick={addSubpage}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#4f46e5'; e.currentTarget.style.color='#4f46e5'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}>
              + Add Subpage
            </button>
          </div>
          {subpages.length === 0 ? (
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', padding:'12px 0', fontStyle:'italic' }}>
              No subpages yet. Click "+ Add Subpage" to create a nested page inside this note.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {subpages.map(sub => (
                <div key={sub.id}
                  onClick={() => { persistEdit(editingId, editTitle, editContent, editTags, editColor); openPage(editingId); setTimeout(() => openEditor(sub), 30); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <span style={{ fontSize:15 }}>📄</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sub.title || 'Untitled'}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:1 }}>
                      {subpageCount(sub.id) > 0 ? subpageCount(sub.id)+' subpage'+(subpageCount(sub.id)!==1?'s':'') + ' · ' : ''}
                      {new Date(sub.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ color:'var(--text-muted)', flexShrink:0 }}><polyline points='9 18 15 12 9 6'/></svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List / folder view ──
  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {/* Header + breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          {/* Breadcrumb */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', marginBottom:4 }}>
            <button onClick={goRoot} style={{ background:'none', border:'none', color: pageStack.length===0 ? 'var(--text)' : 'var(--text-muted)', fontSize:13, fontWeight: pageStack.length===0 ? 700 : 400, cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>📒 Notes</button>
            {pageStack.map((id, i) => (
              <div key={id} style={{display:"contents"}}>
                <span style={{ color:'var(--text-muted)', fontSize:13 }}>/</span>
                <button onClick={() => goToStackIndex(i)} style={{ background:'none', border:'none', color: i===pageStack.length-1 ? 'var(--text)' : 'var(--text-muted)', fontSize:13, fontWeight: i===pageStack.length-1 ? 700 : 400, cursor:'pointer', fontFamily:'var(--font)', padding:0 }}>
                  {allNotes[id]?.title || 'Untitled'}
                </button>
              </div>
            ))}
          </div>
          {currentPageNote && (
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
              {notesAtLevel.length} page{notesAtLevel.length!==1?'s':''} inside this note
            </div>
          )}
        </div>
        {pageStack.length > 0 && (
          <button onClick={goBack} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>← Back</button>
        )}
        <button onClick={newNote}
          style={{ padding:'7px 16px', borderRadius:8, border:'none', backgroundColor:'#4f46e5', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          + New {pageStack.length > 0 ? 'Subpage' : 'Page'}
        </button>
      </div>

      {/* Current page content preview if inside a page */}
      {currentPageNote && currentPageNote.content && (
        <div onClick={() => openEditor(currentPageNote)}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', marginBottom:16, cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>📝 Page Content</div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{currentPageNote.content}</div>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..."
          style={{ flex:1, minWidth:160, background:'var(--surface2)', border:'1px solid var(--border)', padding:'8px 12px', borderRadius:8, fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)' }} />
        {allTags.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            <button onClick={() => setFilter('')} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(filter===''?'#4f46e5':'var(--border)'), background: filter===''?'#4f46e5':'transparent', color: filter===''?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>All</button>
            {allTags.map(t => (
              <button key={t} onClick={() => setFilter(t===filter?'':t)} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(filter===t?'#4f46e5':'var(--border)'), background: filter===t?'#4f46e5':'transparent', color: filter===t?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📒</div>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
            {pageStack.length > 0 ? 'No subpages yet' : 'No notes yet'}
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
            {pageStack.length > 0 ? 'Add subpages to organize content inside this page.' : 'Create your first note to get started.'}
          </div>
          <button onClick={newNote} style={{ padding:'8px 20px', borderRadius:8, border:'none', backgroundColor:'#4f46e5', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New {pageStack.length > 0 ? 'Subpage' : 'Page'}
          </button>
        </div>
      )}

      {/* Pages grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
        {filtered.map(note => {
          const subs = subpageCount(note.id);
          return (
            <div key={note.id}
              style={{ background: note.color && note.color !== 'none' ? note.color : 'var(--surface)', border:'1px solid '+(note.isPinned?'#4f46e5':'var(--border)'), borderRadius:12, padding:'16px 18px', cursor:'pointer', minHeight:120, display:'flex', flexDirection:'column', gap:8, position:'relative', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#4f46e5'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=note.isPinned?'#4f46e5':'var(--border)'; e.currentTarget.style.transform='none'; }}>
              {/* Pin badge */}
              {note.isPinned && <span style={{ position:'absolute', top:10, right:10, fontSize:12 }}>📌</span>}
              {/* Open page on click */}
              <div onClick={() => openEditor(note)} style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6, paddingRight:20 }}>{note.title || 'Untitled'}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical' }}>
                  {note.content || <span style={{ fontStyle:'italic' }}>Empty page</span>}
                </div>
              </div>
              {/* Subpages indicator */}
              {subs > 0 && (
                <div onClick={() => openPage(note.id)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 8px', borderRadius:6, background:'rgba(79,70,229,0.1)', border:'1px solid rgba(79,70,229,0.2)', cursor:'pointer', width:'fit-content' }}>
                  <span style={{ fontSize:10 }}>📄</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'#4f46e5' }}>{subs} subpage{subs!==1?'s':''}</span>
                </div>
              )}
              {/* Tags */}
              {note.tags?.length > 0 && (
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {note.tags.map(t => <span key={t} style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', border:'1px solid var(--border)', padding:'1px 6px', borderRadius:4 }}>{t}</span>)}
                </div>
              )}
              {/* Footer */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{new Date(note.updatedAt).toLocaleDateString()}</span>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={e => { e.stopPropagation(); openPage(note.id); }}
                    title="Open subpages"
                    style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, padding:'2px 4px', borderRadius:4 }}
                    onMouseEnter={e => e.currentTarget.style.color='#4f46e5'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>⤵</button>
                  <button onClick={e => { e.stopPropagation(); togglePin(note); }}
                    style={{ background:'none', border:'none', color: note.isPinned?'#4f46e5':'var(--text-muted)', cursor:'pointer', fontSize:12, padding:'2px 4px' }}>📌</button>
                  <button onClick={e => { e.stopPropagation(); if(window.confirm('Delete "' + (note.title||'Untitled') + '" and all its subpages? This cannot be undone.')) deleteNote(note.id); }}
                    style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, padding:'2px 4px' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>×</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Review Tab ────────────────────────────────────────────────────────
export function WeeklyReviewTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ weekOf:'', whatWorked:'', whatDidnt:'', biggestLesson:'', nextWeekFocus:'', mentalState:'', rulesFollowed:'', totalTrades:'', pnl:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    fetch('/api/reviews').then(r=>r.json()).then(d=>{if(Array.isArray(d))setReviews(d);setLoading(false)})
  }, [])

  const getWeekStart = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day===0?-6:1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const openNew = () => {
    setEditing('new')
    setForm({ weekOf: getWeekStart(), whatWorked:'', whatDidnt:'', biggestLesson:'', nextWeekFocus:'', mentalState:'great', rulesFollowed:'', totalTrades:'', pnl:'' })
  }

  const openExisting = (review) => {
    setEditing(review.id)
    setForm({
      weekOf: review.weekOf?.split('T')[0]||'',
      whatWorked: review.whatWorked||'',
      whatDidnt: review.whatDidnt||'',
      biggestLesson: review.biggestLesson||'',
      nextWeekFocus: review.nextWeekFocus||'',
      mentalState: review.mentalState||'',
      rulesFollowed: review.rulesFollowed?.toString()||'',
      totalTrades: review.totalTrades?.toString()||'',
      pnl: review.pnl?.toString()||'',
    })
  }

  const save = async () => {
    const res = await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, id: editing!=='new'?editing:undefined})})
    const review = await res.json()
    setReviews(r=>{
      const exists = r.find(x=>x.id===review.id)
      return exists ? r.map(x=>x.id===review.id?review:x) : [review,...r]
    })
    setEditing(null)
  }


  const del = async (id) => {
    await fetch('/api/reviews',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setReviews(r=>r.filter(x=>x.id!==id))
  }

  const ta = { width:'100%',background:C.bg,border:`1px solid ${C.border2}`,padding:'10px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,resize:'vertical',minHeight:80,boxSizing:'border-box',lineHeight:1.7 }
  const inp = { width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box' }
  const mentalStates = ['great','good','neutral','off','poor']
  const mentalColor = { great:C.green, good:'#8bc34a', neutral:C.gold, off:'#ff8a65', poor:C.red }

  if (editing) return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <button onClick={()=>setEditing(null)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:2 }}>← REVIEWS</button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:20 }}>
        <div><Label>WEEK OF</Label><input type="date" value={form.weekOf} onChange={e=>set('weekOf',e.target.value)} style={inp} /></div>
        <div><Label>TOTAL TRADES</Label><input value={form.totalTrades} onChange={e=>set('totalTrades',e.target.value)} placeholder="0" style={inp} /></div>
        <div><Label>NET P&L ($)</Label><input value={form.pnl} onChange={e=>set('pnl',e.target.value)} placeholder="0.00" style={inp} /></div>
        <div><Label>RULES FOLLOWED (0-10)</Label><input value={form.rulesFollowed} onChange={e=>set('rulesFollowed',e.target.value)} placeholder="8" style={inp} /></div>
      </div>

      <div style={{ marginBottom:16 }}>
        <Label>MENTAL STATE THIS WEEK</Label>
        <div style={{ display:'flex',gap:8 }}>
          {mentalStates.map(s=><button key={s} onClick={()=>set('mentalState',s)} style={{ flex:1,background:form.mentalState===s?mentalColor[s]:C.border2,color:form.mentalState===s?'#0a0a0a':C.muted,border:'none',padding:'8px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font,textTransform:'uppercase' }}>{s}</button>)}
        </div>
      </div>

      {[['whatWorked','WHAT WORKED THIS WEEK?','Be specific — what setups, decisions, or behaviors led to good outcomes?'],
        ['whatDidnt','WHAT DIDN\'T WORK?','What mistakes did you make? What would you do differently?'],
        ['biggestLesson','BIGGEST LESSON','What is the single most important thing you learned or were reminded of?'],
        ['nextWeekFocus','FOCUS FOR NEXT WEEK','What is the one thing you will work on or watch closely next week?'],
      ].map(([key, label, placeholder])=>(
        <div key={key} style={{ marginBottom:16 }}>
          <Label>{label}</Label>
          <textarea value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} style={ta} />
        </div>
      ))}

      <div style={{ display:'flex',gap:10 }}>
        <button onClick={save} style={{ background:C.gold,color:C.surface,border:'none',padding:'12px 32px',fontSize:10,letterSpacing:3,cursor:'pointer',fontFamily:C.font }}>SAVE REVIEW</button>
        <button onClick={()=>setEditing(null)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'12px 20px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>CANCEL</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Weekly <span style={{ color:C.gold }}>Reviews</span></h2>
        <button onClick={openNew} style={{ marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>+ THIS WEEK</button>
      </div>

      {loading && <p style={{ color:C.muted,fontSize:13 }}>Loading reviews...</p>}
      {!loading && reviews.length===0 && (
        <Card>
          <p style={{ color:C.muted,fontSize:13,margin:'0 0 8px',textAlign:'center' }}>No reviews yet.</p>
          <p style={{ fontSize:12,color:C.dim,margin:0,textAlign:'center',lineHeight:1.7 }}>Weekly reviews are the single best habit for improving as a trader. The AI can auto-generate a draft based on your journal data.</p>
        </Card>
      )}
      <div style={{ display:'grid',gap:8 }}>
        {reviews.map(r=>{
          const mc = mentalColor[r.mentalState]||C.muted
          return (
            <div key={r.id} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'16px 20px',cursor:'pointer' }} onClick={()=>openExisting(r)}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:r.whatWorked?10:0,flexWrap:'wrap' }}>
                <span style={{ fontSize:14,color:C.text }}>Week of {new Date(r.weekOf).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                {r.mentalState && <span style={{ fontSize:10,color:mc,border:`1px solid ${mc}`,padding:'2px 8px',letterSpacing:1 }}>{r.mentalState.toUpperCase()}</span>}
                {r.pnl!=null && <span style={{ fontSize:12,color:r.pnl>=0?C.green:C.red,marginLeft:'auto' }}>{r.pnl>=0?'+':''}${r.pnl.toFixed(0)}</span>}
                {r.totalTrades && <span style={{ fontSize:11,color:C.muted }}>{r.totalTrades} trades</span>}
                {r.rulesFollowed!=null && <span style={{ fontSize:11,color:C.gold }}>{r.rulesFollowed}/10 rules</span>}
                <button onClick={e=>{e.stopPropagation();del(r.id)}} style={{ background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'3px 8px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>DEL</button>
              </div>
              {r.biggestLesson && <p style={{ fontSize:12,color:C.muted,margin:0,lineHeight:1.6 }}>💡 {r.biggestLesson}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── P&L Calendar Heatmap ──────────────────────────────────────────────────────
export function PnLCalendar({ screenings }) {
  // Build a map of date -> outcome
  const dateMap = {}
  ;(screenings||[]).forEach(s => {
    if (!s.outcome || !s.createdAt) return
    const date = new Date(s.createdAt).toISOString().split('T')[0]
    if (!dateMap[date]) dateMap[date] = { wins:0, losses:0 }
    if (s.outcome==='WIN') dateMap[date].wins++
    else if (s.outcome==='LOSS') dateMap[date].losses++
  })

  // Build last 52 weeks grid
  const weeks = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 364)
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  let current = new Date(startDate)
  while (current <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const data = dateMap[dateStr]
      week.push({ date: dateStr, data })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const cellColor = (data) => {
    if (!data) return C.border
    if (data.wins > 0 && data.losses === 0) return C.green
    if (data.losses > 0 && data.wins === 0) return C.red
    if (data.wins > 0 && data.losses > 0) return C.gold
    return C.border
  }

  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAY_LABELS = ['S','M','T','W','T','F','S']

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'flex',gap:2,marginBottom:4 }}>
        <div style={{ width:14,flexShrink:0 }} />
        {weeks.map((week,i)=>{
          const firstOfMonth = week.find(d=>d.date.endsWith('-01'))
          return <div key={i} style={{ width:10,flexShrink:0,fontSize:7,color:C.dim,overflow:'hidden' }}>{firstOfMonth?MONTH_LABELS[parseInt(firstOfMonth.date.split('-')[1])-1]:''}</div>
        })}
      </div>
      <div style={{ display:'flex',gap:2 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:1,marginRight:2 }}>
          {DAY_LABELS.map((d,i)=><div key={i} style={{ height:10,fontSize:7,color:C.dim,lineHeight:'10px' }}>{i%2===1?d:''}</div>)}
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'flex',flexDirection:'column',gap:1 }}>
            {week.map((day,di)=>(
              <div key={di} title={day.date+(day.data?`: ${day.data.wins}W ${day.data.losses}L`:'')} style={{ width:10,height:10,background:cellColor(day.data),opacity:day.data?1:0.3,cursor:'default',borderRadius:1 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:12,marginTop:8,fontSize:10,color:C.muted,alignItems:'center' }}>
        <span>Less</span>
        {[C.border,C.green,C.gold,C.red].map(c=><div key={c} style={{ width:10,height:10,background:c,borderRadius:1 }} />)}
        <span>More</span>
        <span style={{ marginLeft:8 }}>■ Green = all wins · ■ Gold = mixed · ■ Red = all losses</span>
      </div>
    </div>
  )
}

// ─── Themes / Settings ────────────────────────────────────────────────────────
export function ThemeSettings() {
  const { theme, set } = useTheme()
  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Appearance</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Choose how the platform looks and feels.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[
          { id: 'light', label: 'Light', desc: 'Clean white interface, great for daytime' },
          { id: 'dark', label: 'Dark', desc: 'Easy on the eyes in low-light environments' }
        ].map(t => (
          <div key={t.id} onClick={() => set(t.id)} style={{
            flex: 1, cursor: 'pointer',
            border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: theme === t.id ? '0 0 0 3px var(--accent-light)' : 'none',
          }}>
            <div style={{
              height: 96, padding: 16,
              background: t.id === 'light' ? '#f8f9fb' : '#0f1117',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.id === 'light' ? '#4A6FA5' : '#6b8fc4' }} />
                <div style={{ height: 6, width: 40, background: t.id === 'light' ? '#4A6FA5' : '#6b8fc4', borderRadius: 3 }} />
              </div>
              <div style={{ height: 5, width: '85%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
              <div style={{ height: 5, width: '70%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
              <div style={{ height: 5, width: '55%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
            </div>
            <div style={{
              padding: '12px 16px',
              background: t.id === 'light' ? '#ffffff' : '#1a1d27',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.id === 'light' ? '#111827' : '#f1f3f9', margin: 0 }}>{t.label}</p>
                <p style={{ fontSize: 11, color: t.id === 'light' ? '#6b7280' : '#8b92a8', margin: '2px 0 0' }}>{t.desc}</p>
              </div>
              {theme === t.id && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Your preference is saved automatically and persists across sessions.
        </p>
      </div>
    </div>
  )
}
