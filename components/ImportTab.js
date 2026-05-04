'use client';
import { useState, useRef } from 'react';
import JSZip from 'jszip';

const PURPLE = '#4f46e5';
const NOTES_KEY = 'tr_notes_v2';

// ── Note factory (matches RichTools.js makeNote structure) ────
function makeNote(parentId = null, title = 'Untitled', content = '') {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  return {
    id,
    title: title || 'Untitled',
    content: content || '',
    tags: [],
    color: 'none',
    isPinned: false,
    parentId,
    childIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Storage helpers ───────────────────────────────────────────
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
}
function saveNotes(data) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(data)); } catch {}
}

// ── Parsers ───────────────────────────────────────────────────

// Generic markdown → note content (strips frontmatter)
function parseMarkdown(text) {
  if (!text) return '';
  // Remove YAML frontmatter
  text = text.replace(/^---[\s\S]*?---\n?/, '');
  // Remove Notion-style metadata lines
  text = text.replace(/^(Created|Updated|Tags|Status|Date|Author|Type):.+\n/gim, '');
  return text.trim();
}

// Extract title from markdown (first # heading or first line)
function extractTitle(text, fallback = 'Untitled') {
  if (!text) return fallback;
  const h1 = text.match(/^#\s+(.+)/m);
  if (h1) return h1[1].trim().slice(0, 120);
  const firstLine = text.split('\n').find(l => l.trim().length > 0);
  if (firstLine) return firstLine.trim().replace(/^#+\s*/, '').slice(0, 120);
  return fallback;
}

// ── NOTION parser ─────────────────────────────────────────────
// Notion exports as ZIP with markdown files in folders
async function parseNotion(file) {
  // If it's a plain markdown file, handle directly
  if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
    const text = await file.text();
    const note = makeNote(null, extractTitle(text, file.name.replace(/\.md$/, '')), parseMarkdown(text));
    return { [note.id]: note };
  }

  const zip = await JSZip.loadAsync(file);
  const notes = {};
  const folderToNoteId = {};

  // First pass: create parent notes for folders
  const entries = Object.entries(zip.files).sort(([a], [b]) => a.localeCompare(b));
  
  // Group by folder structure
  const mdFiles = entries.filter(([name]) => name.endsWith('.md') || name.endsWith('.markdown'));
  
  for (const [filePath, zipEntry] of mdFiles) {
    if (zipEntry.dir) continue;
    const text = await zipEntry.async('string');
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1].replace(/\.md$/, '').replace(/\.markdown$/, '');
    const folderPath = parts.slice(0, -1).join('/');
    
    // Find or create parent note for folder
    let parentId = null;
    if (folderPath) {
      if (!folderToNoteId[folderPath]) {
        const folderName = parts[parts.length - 2] || folderPath;
        const folderNote = makeNote(null, folderName.replace(/ [a-f0-9]{32}$/i, '').trim(), '');
        notes[folderNote.id] = folderNote;
        folderToNoteId[folderPath] = folderNote.id;
      }
      parentId = folderToNoteId[folderPath];
    }
    
    const title = extractTitle(text, fileName.replace(/ [a-f0-9]{32}$/i, '').trim());
    const content = parseMarkdown(text);
    const note = makeNote(parentId, title, content);
    notes[note.id] = note;
    
    if (parentId && notes[parentId]) {
      notes[parentId].childIds.push(note.id);
    }
  }

  return notes;
}

// ── EVERNOTE parser (.enex XML) ───────────────────────────────
async function parseEvernote(file) {
  const text = await file.text();
  const notes = {};
  
  // Parse ENEX XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const noteEls = xml.querySelectorAll('note');
  
  // Create a root folder for Evernote import
  const root = makeNote(null, 'Evernote Import', '');
  notes[root.id] = root;
  
  noteEls.forEach(noteEl => {
    const title = noteEl.querySelector('title')?.textContent || 'Untitled';
    const contentEl = noteEl.querySelector('content');
    const created = noteEl.querySelector('created')?.textContent;
    
    // Convert ENML to plain text
    let content = '';
    if (contentEl?.textContent) {
      const enml = contentEl.textContent;
      // Strip ENML tags, keep text
      const div = document.createElement('div');
      div.innerHTML = enml
        .replace(/<br[^>]*>/gi, '\n')
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<p[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      content = div.textContent || div.innerText || '';
      content = content.replace(/\n{3,}/g, '\n\n').trim();
    }
    
    // Extract tags
    const tags = Array.from(noteEl.querySelectorAll('tag')).map(t => t.textContent).filter(Boolean);
    
    const note = makeNote(root.id, title, content);
    note.tags = tags.slice(0, 5);
    if (created) note.createdAt = new Date(created.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')).toISOString();
    
    notes[note.id] = note;
    root.childIds.push(note.id);
  });
  
  return notes;
}

// ── BEAR parser (.bear2bk or markdown files) ──────────────────
async function parseBear(file) {
  const notes = {};
  const root = makeNote(null, 'Bear Import', '');
  notes[root.id] = root;
  
  // Bear exports as individual markdown files or a bundle
  if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    const text = await file.text();
    // Bear uses #tags in content
    const tags = (text.match(/#[\w/]+/g) || []).map(t => t.replace('#', '')).slice(0, 5);
    const title = extractTitle(text, file.name.replace(/\.md$/, ''));
    const content = parseMarkdown(text);
    const note = makeNote(root.id, title, content);
    note.tags = tags;
    notes[note.id] = note;
    root.childIds.push(note.id);
  }
  
  return notes;
}

// ── OBSIDIAN parser (ZIP of markdown vault) ───────────────────
async function parseObsidian(file) {
  // Obsidian is just markdown files — same as Notion ZIP but simpler
  return parseNotion(file); // reuse ZIP parser
}

// ── APPLE NOTES (exported as HTML or text) ────────────────────
async function parseAppleNotes(file) {
  const text = await file.text();
  const notes = {};
  const root = makeNote(null, 'Apple Notes Import', '');
  notes[root.id] = root;
  
  let content = text;
  if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
    const div = document.createElement('div');
    div.innerHTML = text;
    content = div.innerText || div.textContent || text;
  }
  
  // Try to split by note separators (Apple Notes HTML has individual notes)
  const noteBlocks = content.split(/\n---+\n|\f/).filter(b => b.trim().length > 50);
  
  if (noteBlocks.length > 1) {
    noteBlocks.forEach(block => {
      const title = extractTitle(block, 'Note');
      const note = makeNote(root.id, title, block.trim());
      notes[note.id] = note;
      root.childIds.push(note.id);
    });
  } else {
    const title = extractTitle(content, file.name.replace(/\.(html?|txt)$/, ''));
    const note = makeNote(root.id, title, content.trim());
    notes[note.id] = note;
    root.childIds.push(note.id);
  }
  
  return notes;
}

// ── GOOGLE DOCS / KEEP parser ─────────────────────────────────
async function parseGoogleDocs(file) {
  const notes = {};
  const root = makeNote(null, 'Google Docs Import', '');
  notes[root.id] = root;
  
  let content = '';
  if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
    const text = await file.text();
    const div = document.createElement('div');
    div.innerHTML = text;
    // Preserve some structure
    content = div.innerText || div.textContent || '';
  } else {
    content = await file.text();
  }
  
  const title = extractTitle(content, file.name.replace(/\.(html?|txt|docx?)$/, ''));
  const note = makeNote(root.id, title, content.trim());
  notes[note.id] = note;
  root.childIds.push(note.id);
  
  return notes;
}

// ── TRADINGVIEW watchlist (CSV) ───────────────────────────────
async function parseTradingView(file) {
  const text = await file.text();
  const lines = text.trim().split('\n').filter(l => l.trim());
  const notes = {};
  const root = makeNote(null, 'TradingView Watchlist', '');
  
  const symbols = lines
    .map(l => l.split(',')[0].trim().replace(/"/g, ''))
    .filter(s => s && !s.toLowerCase().includes('symbol') && s.length < 20);
  
  root.content = '# TradingView Watchlist\n\nImported ' + symbols.length + ' symbols:\n\n' + symbols.map(s => '- ' + s).join('\n');
  root.tags = ['tradingview', 'watchlist'];
  notes[root.id] = root;
  return notes;
}

// ── FOREX FACTORY notes (manual export or copy-paste) ─────────
async function parseForexFactory(file) {
  const text = await file.text();
  const notes = {};
  const root = makeNote(null, 'Forex Factory Notes', text.trim());
  root.tags = ['forex-factory', 'news'];
  notes[root.id] = root;
  return notes;
}

// ── PLAIN MARKDOWN / TEXT ─────────────────────────────────────
async function parsePlainMarkdown(file) {
  const text = await file.text();
  const notes = {};
  const title = extractTitle(text, file.name.replace(/\.(md|txt|markdown)$/, ''));
  const note = makeNote(null, title, parseMarkdown(text));
  notes[note.id] = note;
  return notes;
}

// ── DOCX (Word documents) ─────────────────────────────────────
async function parseDocx(file) {
  const notes = {};
  const root = makeNote(null, file.name.replace(/\.docx?$/i, ''), '');
  notes[root.id] = root;
  try {
    const mammoth = (typeof require !== 'undefined') ? require('mammoth') : null;
    if (mammoth) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      root.content = result.value || '';
      root.title = extractTitle(root.content, file.name.replace(/\.docx?$/i, ''));
    } else {
      root.content = '[Word document imported — content extraction requires mammoth package]';
    }
  } catch {
    root.content = '[Could not parse Word document — try exporting as HTML or plain text instead]';
  }
  return notes;
}

// ── ROAM RESEARCH (JSON export) ───────────────────────────────
async function parseRoam(file) {
  const text = await file.text();
  const notes = {};
  
  try {
    const data = JSON.parse(text);
    const root = makeNote(null, 'Roam Research Import', '');
    notes[root.id] = root;
    
    const pages = Array.isArray(data) ? data : [data];
    pages.forEach(page => {
      const title = page.title || 'Untitled';
      const blocks = (page.children || []).map(b => b.string || '').filter(Boolean);
      const content = blocks.join('\n');
      const note = makeNote(root.id, title, content);
      notes[note.id] = note;
      root.childIds.push(note.id);
    });
  } catch {
    const note = makeNote(null, 'Roam Import', text);
    notes[note.id] = note;
  }
  
  return notes;
}

// ── LOGSEQ (markdown with outlines) ──────────────────────────
async function parseLogseq(file) {
  const text = await file.text();
  // Logseq uses indented bullet points
  const content = text.replace(/^\s*-\s+/gm, '• ');
  const title = extractTitle(text, file.name.replace(/\.md$/, ''));
  const notes = {};
  const note = makeNote(null, title, parseMarkdown(content));
  notes[note.id] = note;
  return notes;
}

// ── ONENOTE (exported as .docx or HTML) ──────────────────────
async function parseOneNote(file) {
  if (file.name.endsWith('.docx')) return parseDocx(file);
  return parseGoogleDocs(file); // HTML fallback
}

// ── SIMPLENOTE (JSON export) ──────────────────────────────────
async function parseSimpleNote(file) {
  const text = await file.text();
  const notes = {};
  
  try {
    const data = JSON.parse(text);
    const root = makeNote(null, 'Simplenote Import', '');
    notes[root.id] = root;
    
    const items = data.activeNotes || data.notes || (Array.isArray(data) ? data : []);
    items.forEach(item => {
      const content = item.content || item.text || '';
      const title = extractTitle(content, 'Note');
      const tags = item.tags || [];
      const note = makeNote(root.id, title, content);
      note.tags = tags.slice(0, 5);
      if (item.creationDate) note.createdAt = new Date(item.creationDate * 1000).toISOString();
      notes[note.id] = note;
      root.childIds.push(note.id);
    });
  } catch {
    const note = makeNote(null, 'Simplenote Import', text);
    notes[note.id] = note;
  }
  
  return notes;
}

// ── JOPLIN (markdown with metadata) ──────────────────────────
async function parseJoplin(file) {
  const text = await file.text();
  // Joplin markdown has id/parent_id metadata at bottom
  const content = text.replace(/\nid: [\w]+\n.*$/s, '').trim();
  const title = extractTitle(content, file.name.replace(/\.md$/, ''));
  const notes = {};
  const note = makeNote(null, title, parseMarkdown(content));
  notes[note.id] = note;
  return notes;
}

// ── PLATFORM DEFINITIONS ──────────────────────────────────────
const PLATFORMS = [
  {
    id: 'notion',
    name: 'Notion',
    logo: 'N',
    lb: '#000',
    lc: '#fff',
    desc: 'Import your entire Notion workspace including all pages and subpages.',
    guide: 'Notion → Settings → Export content → Markdown & CSV → Download ZIP',
    steps: [
      'Open Notion and click Settings & Members (top left)',
      'Go to Settings → Export content',
      'Select Markdown & CSV as the format',
      'Click Export and wait for the ZIP to download',
      'Drop the ZIP file here — your full page hierarchy will be preserved',
    ],
    tip: 'Export from the workspace level (not a single page) to get everything at once.',
    accepts: '.zip,.md,.markdown',
    category: 'Notes',
    parser: parseNotion,
    popular: true,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    logo: '⬡',
    lb: '#7c3aed',
    lc: '#fff',
    desc: 'Import your entire Obsidian vault with full folder structure.',
    guide: 'Select your vault folder → Compress to ZIP → Drop here',
    steps: [
      'Find your Obsidian vault folder on your computer',
      'On Windows: right-click the folder → Send to → Compressed (zipped) folder',
      'On Mac: right-click the folder → Compress',
      'Drop the ZIP file here — all your notes and folders will be imported',
    ],
    tip: 'Your vault is usually in Documents/Obsidian or wherever you set it up initially.',
    accepts: '.zip,.md,.markdown',
    category: 'Notes',
    parser: parseObsidian,
    popular: true,
  },
  {
    id: 'evernote',
    name: 'Evernote',
    logo: 'E',
    lb: '#00a82d',
    lc: '#fff',
    desc: 'Import Evernote notebooks with tags and creation dates preserved.',
    guide: 'Evernote → File → Export Notes → Export as ENEX',
    steps: [
      'Open Evernote desktop app (web version does not support export)',
      'Select the notes or notebook you want to export',
      'Go to File → Export Notes (or right-click → Export)',
      'Choose Export as ENEX file (.enex)',
      'Drop the .enex file here',
    ],
    tip: 'Export one notebook at a time for best results. Tags and creation dates are preserved.',
    accepts: '.enex',
    category: 'Notes',
    parser: parseEvernote,
    popular: true,
  },
  {
    id: 'apple-notes',
    name: 'Apple Notes',
    logo: '🍎',
    lb: '#f5f5f7',
    lc: '#1d1d1f',
    desc: 'Import Apple Notes exported as text files.',
    guide: 'Notes → Select notes → Share → Export',
    steps: [
      'Open the Notes app on your Mac',
      'Select the notes you want to export (Cmd+A for all)',
      'Go to File → Export as PDF, or share and choose a text format',
      'Alternatively: select a note → Edit → Select All → Copy → paste into a .txt file',
      'Drop the text or HTML file here',
    ],
    tip: 'Apple Notes has limited export options. For bulk export, try the Exporter app from the Mac App Store (free).',
    accepts: '.html,.htm,.txt',
    category: 'Notes',
    parser: parseAppleNotes,
    popular: true,
  },
  {
    id: 'google-docs',
    name: 'Google Docs / Keep',
    logo: 'G',
    lb: '#4285f4',
    lc: '#fff',
    desc: 'Import Google Docs or Keep notes as plain text or HTML.',
    guide: 'Google Docs → File → Download → Plain Text or Web Page',
    steps: [
      'Open your Google Doc',
      'Go to File → Download',
      'Choose Plain Text (.txt) for simple notes, or Web Page (.html) for formatted content',
      'For Google Keep: open keep.google.com → select notes → More options → Export',
      'Drop the downloaded file here',
    ],
    tip: 'For multiple Google Docs, use Google Takeout (takeout.google.com) to export all Docs at once as a ZIP.',
    accepts: '.html,.htm,.txt,.md',
    category: 'Notes',
    parser: parseGoogleDocs,
    popular: true,
  },
  {
    id: 'onenote',
    name: 'Microsoft OneNote',
    logo: 'O',
    lb: '#7719aa',
    lc: '#fff',
    desc: 'Import OneNote sections exported as Word documents.',
    guide: 'OneNote → File → Export → Section → Word (.docx)',
    steps: [
      'Open OneNote desktop app',
      'Go to File → Export',
      'Select the section or page you want to export',
      'Choose Word Document (.docx) as the format',
      'Click Export and save the file',
      'Drop the .docx file here',
    ],
    tip: 'Export section by section for best results. OneNote web does not support export.',
    accepts: '.docx,.html,.htm',
    category: 'Notes',
    parser: parseOneNote,
  },
  {
    id: 'bear',
    name: 'Bear',
    logo: '🐻',
    lb: '#c9513a',
    lc: '#fff',
    desc: 'Import Bear notes with tags preserved.',
    guide: 'Bear → Note menu → Export → Markdown',
    steps: [
      'Open Bear on your Mac or iPhone',
      'Select the note(s) you want to export',
      'Click the share/export button (top right)',
      'Choose Export → Markdown',
      'Save the .md file and drop it here',
    ],
    tip: 'Bear Pro lets you export multiple notes at once. Tags written as #hashtags in the content will be imported.',
    accepts: '.md,.txt',
    category: 'Notes',
    parser: parseBear,
  },
  {
    id: 'roam',
    name: 'Roam Research',
    logo: 'R',
    lb: '#1a1a2e',
    lc: '#8b9cf4',
    desc: 'Import your entire Roam graph via JSON export.',
    guide: 'Roam → ... menu → Export All → JSON',
    steps: [
      'Open your Roam Research graph',
      'Click the ... menu in the top right corner',
      'Select Export All',
      'Choose JSON as the format',
      'Download and drop the JSON file here',
    ],
    tip: 'JSON export preserves the most data. All your pages and blocks will be imported as notes.',
    accepts: '.json',
    category: 'Notes',
    parser: parseRoam,
  },
  {
    id: 'logseq',
    name: 'Logseq',
    logo: 'L',
    lb: '#085b6f',
    lc: '#fff',
    desc: 'Import Logseq pages as markdown notes.',
    guide: 'Logseq → ... → Export graph → Standard Markdown',
    steps: [
      'Open Logseq',
      'Click the ... (three dots) menu in the top right',
      'Select Export graph',
      'Choose Export as standard Markdown',
      'Drop the exported markdown files or ZIP here',
    ],
    tip: 'Logseq stores files locally — you can also just navigate to your graph folder and ZIP the pages/ directory directly.',
    accepts: '.md,.zip',
    category: 'Notes',
    parser: parseLogseq,
  },
  {
    id: 'simplenote',
    name: 'Simplenote',
    logo: 'S',
    lb: '#3360cc',
    lc: '#fff',
    desc: 'Import all Simplenote notes with tags via JSON export.',
    guide: 'Simplenote → Settings → Tools → Export Notes',
    steps: [
      'Go to app.simplenote.com in your browser',
      'Click your account icon → Settings',
      'Go to the Tools tab',
      'Click Export Notes — this downloads a JSON file',
      'Drop the JSON file here',
    ],
    tip: 'All your notes, tags, and dates will be imported. The JSON export includes everything.',
    accepts: '.json',
    category: 'Notes',
    parser: parseSimpleNote,
  },
  {
    id: 'joplin',
    name: 'Joplin',
    logo: 'J',
    lb: '#2b2b2b',
    lc: '#68b5fb',
    desc: 'Import Joplin notes exported as markdown.',
    guide: 'Joplin → File → Export All → MD - Markdown',
    steps: [
      'Open Joplin desktop app',
      'Go to File → Export All',
      'Select MD - Markdown as the format',
      'Choose a destination folder and export',
      'ZIP the exported folder and drop it here, or drop individual .md files',
    ],
    tip: 'Joplin can also export as JEX (Joplin Export) but Markdown gives the best compatibility.',
    accepts: '.md,.zip',
    category: 'Notes',
    parser: parseJoplin,
  },
  {
    id: 'word',
    name: 'Microsoft Word',
    logo: 'W',
    lb: '#2b579a',
    lc: '#fff',
    desc: 'Import Word documents (.docx) directly as notes.',
    guide: 'Save your Word document as .docx and drop it here',
    steps: [
      'Make sure your document is saved as .docx (not .doc)',
      'In Word: File → Save As → Word Document (.docx)',
      'Drop the .docx file here — text content will be extracted',
    ],
    tip: 'Complex formatting (tables, images) will be simplified to plain text. For best results, use documents with mostly text content.',
    accepts: '.docx,.doc',
    category: 'Documents',
    parser: parseDocx,
  },
  {
    id: 'markdown',
    name: 'Any Markdown File',
    logo: 'MD',
    lb: '#083fa1',
    lc: '#fff',
    desc: 'Import any .md or .txt file from any app or source.',
    guide: 'Drop any markdown or text file here',
    steps: [
      'Find your markdown (.md) or text (.txt) file',
      'Drop it directly here — no preparation needed',
      'Works with exports from any app that supports markdown',
    ],
    tip: 'This works as a universal fallback for any app not listed here. If your app exports markdown, this will work.',
    accepts: '.md,.markdown,.txt',
    category: 'Universal',
    parser: parsePlainMarkdown,
    popular: true,
  },
  {
    id: 'tradingview',
    name: 'TradingView Watchlist',
    logo: 'TV',
    lb: '#2962ff',
    lc: '#fff',
    desc: 'Import your TradingView watchlist symbols as a note.',
    guide: 'TradingView → Watchlist → ... → Export list',
    steps: [
      'Open TradingView and go to your Watchlist',
      'Click the ... (three dots) menu on the watchlist',
      'Select Export list',
      'Drop the CSV file here — all your symbols will be saved as a note',
    ],
    tip: 'Your watchlist symbols will be saved as a formatted note you can reference and edit.',
    accepts: '.csv,.txt',
    category: 'Trading',
    parser: parseTradingView,
  },
  {
    id: 'forexfactory',
    name: 'Forex Factory Notes',
    logo: 'FF',
    lb: '#cc3300',
    lc: '#fff',
    desc: 'Import your Forex Factory analysis and notes as a text file.',
    guide: 'Copy your FF analysis → paste into a .txt file → drop here',
    steps: [
      'Go to your Forex Factory thread, analysis, or notes',
      'Select and copy all your content (Ctrl+A, Ctrl+C)',
      'Paste into a text file (Notepad on Windows, TextEdit on Mac)',
      'Save as a .txt file',
      'Drop it here',
    ],
    tip: 'Forex Factory does not have a built-in export. Copy-paste is the most reliable method.',
    accepts: '.txt,.md',
    category: 'Trading',
    parser: parseForexFactory,
  },
];

const CATEGORIES = ['All', 'Notes', 'Documents', 'Trading', 'Universal'];

// ── Main Component ────────────────────────────────────────────
export default function ImportTab() {
  const [catFilter, setCatFilter] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  const filtered = PLATFORMS.filter(p => {
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFile = async (file) => {
    if (!selectedPlatform) {
      // Auto-detect platform from file extension
      const ext = file.name.split('.').pop().toLowerCase();
      const auto = PLATFORMS.find(p => p.accepts.includes('.'+ext));
      if (auto) setSelectedPlatform(auto);
      else { setError('Could not detect platform. Please select one manually.'); return; }
    }
    
    setImporting(true);
    setError('');
    setResult(null);
    
    try {
      const platform = selectedPlatform || PLATFORMS.find(p => p.accepts.includes('.'+file.name.split('.').pop().toLowerCase()));
      const importedNotes = await platform.parser(file);
      const count = Object.keys(importedNotes).length;
      
      if (count === 0) {
        setError('No notes found in this file. Make sure you exported correctly.');
        setImporting(false);
        return;
      }
      
      // Merge with existing notes
      const existing = loadNotes();
      const merged = { ...existing, ...importedNotes };
      saveNotes(merged);
      
      setResult({
        count,
        platform: platform.name,
        rootNotes: Object.values(importedNotes).filter(n => !n.parentId).length,
        subNotes: Object.values(importedNotes).filter(n => n.parentId).length,
      });
    } catch(e) {
      setError('Import failed: ' + e.message + '. Try a different export format.');
    }
    
    setImporting(false);
  };

  const inp = { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontFamily:'var(--font)', fontSize:13, padding:'9px 12px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' };

  return (
    <div style={{ fontFamily:'var(--font)', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Tools</div>
        <h2 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Import Your Data</h2>
        <p style={{ fontSize:13, color:'var(--text-muted)', margin:0, lineHeight:1.6 }}>
          Bring your notes, research, and watchlists from any platform into TradeRing in seconds. Your data stays yours.
        </p>
      </div>

      {/* Success result */}
      {result && (
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'16px 20px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--green)', marginBottom:6 }}>
            ✅ Import complete — {result.count} items imported from {result.platform}
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>
            {result.rootNotes} top-level pages · {result.subNotes} subpages · All available in your Notes tab
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setResult(null); setSelectedPlatform(null); }}
              style={{ padding:'7px 16px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              Import More
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'journal' }))}
              style={{ padding:'7px 16px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              View in Notes →
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

        {/* Left — platform selector */}
        <div>
          {/* Search + filter */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search platforms..."
              style={{ ...inp, flex:1, minWidth:140 }} onFocus={e=>e.target.style.borderColor=PURPLE} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={()=>setCatFilter(cat)}
                style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(catFilter===cat?PURPLE:'var(--border)'), background:catFilter===cat?PURPLE:'transparent', color:catFilter===cat?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Popular section */}
          {catFilter === 'All' && !search && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Popular</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {PLATFORMS.filter(p=>p.popular).map(p => (
                  <button key={p.id} onClick={()=>setSelectedPlatform(p)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, border:'1px solid '+(selectedPlatform?.id===p.id?PURPLE:'var(--border)'), background:selectedPlatform?.id===p.id?'rgba(79,70,229,0.08)':'var(--surface)', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=PURPLE}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=selectedPlatform?.id===p.id?PURPLE:'var(--border)'}>
                    <div style={{ width:24, height:24, borderRadius:6, background:p.lb, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:p.lc, flexShrink:0 }}>{p.logo}</div>
                    <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:selectedPlatform?.id===p.id?PURPLE:'var(--text)', whiteSpace:'nowrap' }}>{p.name}</span>
                    {selectedPlatform?.id===p.id && <span style={{ fontSize:12, color:PURPLE }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All platforms grid */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
            {catFilter === 'All' && !search ? 'All Platforms' : 'Results'} ({filtered.length})
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={()=>setSelectedPlatform(selectedPlatform?.id===p.id?null:p)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, border:'1px solid '+(selectedPlatform?.id===p.id?PURPLE:'var(--border)'), background:selectedPlatform?.id===p.id?'rgba(79,70,229,0.08)':'var(--surface)', cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={e=>{ if(selectedPlatform?.id!==p.id) e.currentTarget.style.borderColor=PURPLE; }}
                onMouseLeave={e=>{ if(selectedPlatform?.id!==p.id) e.currentTarget.style.borderColor='var(--border)'; }}>
                <div style={{ width:36, height:36, borderRadius:8, background:p.lb, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:p.lc, flexShrink:0 }}>{p.logo}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:selectedPlatform?.id===p.id?PURPLE:'var(--text)', marginBottom:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{p.category}</div>
                </div>
                {selectedPlatform?.id===p.id && <span style={{ fontSize:14, color:PURPLE, flexShrink:0 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Right — import panel */}
        <div style={{ position:'sticky', top:20 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px', marginBottom:12 }}>
            {selectedPlatform ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:selectedPlatform.lb, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:selectedPlatform.lc, flexShrink:0 }}>{selectedPlatform.logo}</div>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)' }}>{selectedPlatform.name}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{selectedPlatform.category}</div>
                  </div>
                </div>

                <div style={{ background:'var(--surface2)', borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                    📋 How to export from {selectedPlatform.name}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {selectedPlatform.steps.map((step, i) => (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', background:'#4f46e5', color:'#fff', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</div>
                        <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  {selectedPlatform.tip && (
                    <div style={{ marginTop:10, padding:'8px 10px', background:'rgba(79,70,229,0.06)', borderRadius:6, border:'1px solid rgba(79,70,229,0.15)', fontFamily:'var(--font)', fontSize:11, color:'#4f46e5', lineHeight:1.6 }}>
                      💡 {selectedPlatform.tip}
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
                  onClick={()=>fileInputRef.current?.click()}
                  style={{ border:'2px dashed '+(dragOver?PURPLE:'var(--border)'), borderRadius:12, padding:'32px 20px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(79,70,229,0.05)':'transparent', transition:'all 0.15s', marginBottom:12 }}>
                  {importing ? (
                    <>
                      <div style={{ fontSize:28, marginBottom:8 }}>⏳</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>Importing...</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Drop your file here</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>or click to browse</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', background:'var(--surface2)', padding:'3px 10px', borderRadius:20, display:'inline-block' }}>
                        Accepts: {selectedPlatform.accepts}
                      </div>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept={selectedPlatform.accepts} style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); }}/>
                </div>

                {error && (
                  <div style={{ padding:'10px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, fontSize:12, color:'var(--red)', lineHeight:1.5 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button onClick={()=>setSelectedPlatform(null)}
                  style={{ width:'100%', marginTop:10, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, cursor:'pointer' }}>
                  ← Choose Different Platform
                </button>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 10px' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📥</div>
                <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Select a platform</div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>Choose where your notes are coming from and we'll walk you through the import.</div>
              </div>
            )}
          </div>

          {/* What gets imported */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>What gets imported</div>
            {[
              { icon:'📄', text:'All pages and subpages with full hierarchy preserved' },
              { icon:'🏷️', text:'Tags carried over where supported' },
              { icon:'📅', text:'Original creation dates preserved' },
              { icon:'🔒', text:'Import is local — nothing leaves your device' },
            ].map((item,i) => (
              <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 0', borderBottom:i<3?'1px solid var(--border)':'none' }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', lineHeight:1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
