/**
 * Parsi — Sidebar Logic
 * Latin ↔ Ol Chiki: local engine (offline)
 * English ↔ Santali: Google Translate (requires internet)
 */

const DIRS = {
  'latin-olchiki':   { inputLabel:'Santali (Latin)',  outputLabel:'Ol Chiki',        placeholder:'Type or paste Santali Latin text…', actionLabel:'Convert to Ol Chiki',   },
  'olchiki-latin':   { inputLabel:'Ol Chiki',          outputLabel:'Santali (Latin)', placeholder:'Type or paste Ol Chiki (ᱚᱞ) text…',  actionLabel:'Convert to Latin',      },
  'english-olchiki': { inputLabel:'English',           outputLabel:'Ol Chiki',        placeholder:'Type or paste English text here…',   actionLabel:'Translate to Ol Chiki', },
  'english-latin':   { inputLabel:'English',           outputLabel:'Santali (Latin)', placeholder:'Type or paste English text here…',   actionLabel:'Translate to Santali',  },
  'olchiki-english': { inputLabel:'Ol Chiki',          outputLabel:'English',         placeholder:'Type or paste Ol Chiki (ᱚᱞ) text…',  actionLabel:'Translate to English',  },
  'latin-english':   { inputLabel:'Santali (Latin)',   outputLabel:'English',         placeholder:'Type or paste Santali Latin text…',  actionLabel:'Translate to English',  },
};

let _dir         = 'latin-olchiki';
let _lastResult  = '';
let _lastAlso    = '';
let _historyOpen = false;
let _settings    = {};

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  _settings = await _fetchSettings();
  _applyTheme(_settings.theme);
  _dir = _settings.lastUsedDir || 'latin-olchiki';
  _activateDir(_dir, false);
  await _pullSelectedText();
  _wireDirCards();
  _wireInput();
  _wireOutput();
  _wireHistory();
  _wireTranscribedPanel();
  _wireSwap();
  document.getElementById('settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());
});

function _applyTheme(t) {
  const el = document.documentElement;
  if (t==='dark')  { el.dataset.theme='dark';  return; }
  if (t==='light') { el.dataset.theme='light'; return; }
  delete el.dataset.theme;
}

// ─── Direction cards ──────────────────────────────────────────────────────────
function _wireDirCards() {
  document.querySelectorAll('.dir-card').forEach(card => {
    card.addEventListener('click', () => _activateDir(card.dataset.dir, true));
    card.addEventListener('keydown', e => {
      if (e.key==='Enter'||e.key===' ') { e.preventDefault(); _activateDir(card.dataset.dir, true); }
      if (e.key==='ArrowRight'||e.key==='ArrowDown') { e.preventDefault(); _focusNextCard(card,  1); }
      if (e.key==='ArrowLeft' ||e.key==='ArrowUp')   { e.preventDefault(); _focusNextCard(card, -1); }
    });
  });
}

function _focusNextCard(cur, delta) {
  const cards = [...document.querySelectorAll('.dir-card')];
  cards[(cards.indexOf(cur) + delta + cards.length) % cards.length]?.focus();
}

function _activateDir(key, save) {
  if (!DIRS[key]) return;
  _dir = key;
  const cfg = DIRS[key];
  document.querySelectorAll('.dir-card').forEach(c => {
    const on = c.dataset.dir === key;
    c.setAttribute('aria-checked', String(on));
    c.tabIndex = on ? 0 : -1;
  });
  document.getElementById('input-lang-label').textContent  = cfg.inputLabel;
  document.getElementById('output-lang-label').textContent = cfg.outputLabel;
  document.getElementById('text-input').placeholder        = cfg.placeholder;
  document.getElementById('action-label').textContent      = cfg.actionLabel;
  _clearOutput();
  if (save) {
    _settings.lastUsedDir = key;
    _saveSettings(_settings);
    _pullSelectedText();
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────
function _wireInput() {
  const ta = document.getElementById('text-input');
  const ct = document.getElementById('char-count');
  ta.addEventListener('input', () => {
    ct.textContent = `${ta.value.length} / 2000`;
    ct.classList.toggle('warn', ta.value.length > 1800);
  });
  document.getElementById('use-sel-btn').addEventListener('click', _pullSelectedText);
  document.getElementById('action-btn').addEventListener('click', () => _doAction());
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='Enter') { e.preventDefault(); _doAction(); }
  });
}

async function _pullSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab?.id) return;
    const [{ result }] = await chrome.scripting.executeScript({ target:{ tabId:tab.id }, func:()=>window.getSelection().toString() });
    const text = (result||'').trim();
    if (text) {
      document.getElementById('text-input').value = text;
      document.getElementById('char-count').textContent = `${text.length} / 2000`;
    }
  } catch (_) {}
}

// ─── Main action (async so all branches can await) ────────────────────────────
async function _doAction() {
  const text = document.getElementById('text-input').value.trim();
  if (!text) { document.getElementById('text-input').focus(); return; }
  _clearOutput();
  switch (_dir) {
    case 'latin-olchiki':   _doConvert(text, 'olchiki');         break;
    case 'olchiki-latin':   _doConvert(text, 'latin');            break;
    case 'english-olchiki': await _doEnglish(text, 'olchiki');   break;
    case 'english-latin':   await _doEnglish(text, 'latin');      break;
    case 'olchiki-english': await _doToEnglish(text, 'olchiki'); break;
    case 'latin-english':   await _doToEnglish(text, 'latin');    break;
  }
}

// ─── Local script conversion (offline) ───────────────────────────────────────
function _doConvert(text, target) {
  const { result, success, message } = convertText(text, target);
  if (!success) { _showError(message); return; }
  _lastResult = result;
  _lastAlso   = '';
  _showResult(result, '', false);
  _hideTranscribedPanel();
  if (_settings.autoClipboard !== false) _copyText(result);
  _pushHistory(text, result, target);
}

// ─── Google Translate helper ──────────────────────────────────────────────────
async function _googleTranslate(text, sourceLang, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return data[0].map(seg => seg[0]).join('');
}

// ─── English → Santali Latin or Ol Chiki (Google Translate) ──────────────────
async function _doEnglish(text, target) {
  _v('loading-row', true);
  document.getElementById('action-btn').disabled = true;

  try {
    // Google Translate: English → Santali (returns Santali Latin, language code 'sat')
    const googleResult = _cleanGoogleResult(await _googleTranslate(text, 'en', 'sat'));

   // Google always returns Ol Chiki for Santali — convert back to Latin if needed
    const primary = target === 'olchiki' ? googleResult : olChikiToLatin(googleResult);
    const also    = target === 'olchiki' ? olChikiToLatin(googleResult) : googleResult;

    _lastResult = primary;
    _lastAlso   = also;
    _showResult(primary, also, true);
    _hideTranscribedPanel();
    if (_settings.autoClipboard !== false) _copyText(primary);
    _pushHistory(text, primary, target);

  } catch (_err) {
    _showError('Translation failed — check your internet connection.');
  } finally {
    _v('loading-row', false);
    document.getElementById('action-btn').disabled = false;
  }
}

// ─── Ol Chiki or Santali Latin → English (Google Translate) ──────────────────
async function _doToEnglish(text, sourceScript) {
  _v('loading-row', true);
  document.getElementById('action-btn').disabled = true;

  try {
    // Convert Ol Chiki to Latin first if needed
    const latin = sourceScript === 'olchiki' ? olChikiToLatin(text) : text;

    // Google Translate: Santali Latin → English (language code 'sat')
    const english = _cleanGoogleResult(await _googleTranslate(latin, 'sat', 'en'));

    _lastResult = english;
    _lastAlso   = '';
    _showResult(english, '', false);
    _hideTranscribedPanel();
    if (_settings.autoClipboard !== false) _copyText(english);
    _pushHistory(text, english, 'english');

  } catch (_err) {
    _showError('Translation failed — check your internet connection.');
  } finally {
    _v('loading-row', false);
    document.getElementById('action-btn').disabled = false;
  }
}

// ─── Result display ───────────────────────────────────────────────────────────
function _showResult(primary, also, showAlso) {
  document.getElementById('output-text').textContent = primary;
  _v('output-section', true);
  _v('error-row', false);
  _v('also-row', showAlso && !!also);
  if (showAlso && also) {
    document.getElementById('also-label').textContent = _dir==='english-olchiki' ? 'Also as Santali Latin' : 'Also as Ol Chiki';
    document.getElementById('also-text').textContent  = also.length > 160 ? also.slice(0,160)+'…' : also;
  }
  document.getElementById('output-section').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function _showError(msg) {
  _v('output-section', true);
  _v('error-row', true);
  document.getElementById('error-msg').textContent = msg;
  document.getElementById('output-text').textContent = '';
  _v('also-row', false);
}

function _clearOutput() {
  _v('output-section', false);
  _v('error-row', false);
  _v('also-row', false);
  document.getElementById('output-text').textContent = '';
  _hideTranscribedPanel();
}

// ─── Transcribed panel (kept but always hidden — dictionary no longer used) ───
function _wireTranscribedPanel() {
  const toggle = document.getElementById('transcribed-toggle');
  toggle.addEventListener('click', () => {
    const body    = document.getElementById('transcribed-body');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    body.hidden   = expanded;
  });
}

function _hideTranscribedPanel() {
  document.getElementById('transcribed-panel').style.display = 'none';
}

// ─── Output buttons ───────────────────────────────────────────────────────────
function _wireOutput() {
  document.getElementById('copy-btn').addEventListener('click', () => { if(_lastResult) _copyText(_lastResult,'copy-btn'); });
  document.getElementById('copy-also-btn').addEventListener('click', () => { if(_lastAlso) _copyText(_lastAlso,'copy-also-btn'); });
  document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('text-input').value = '';
    document.getElementById('char-count').textContent = '0 / 2000';
    _clearOutput();
    _lastResult = '';
    _lastAlso   = '';
    document.getElementById('text-input').focus();
  });
  document.getElementById('speak-btn').addEventListener('click', () => {
  if (!_lastResult) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(_lastResult);
  // Use Santali language code where possible, fall back to Hindi which shares sounds
  utter.lang = _dir.includes('english') && _dir.startsWith('olchiki') || _dir === 'latin-english' ? 'en' : 'hi';
  window.speechSynthesis.speak(utter);
});
// Font size control
let _fontSize = 15;
const outputText = document.getElementById('output-text');
document.getElementById('font-increase').addEventListener('click', () => {
  _fontSize = Math.min(_fontSize + 2, 28);
  outputText.style.fontSize = _fontSize + 'px';
});
document.getElementById('font-decrease').addEventListener('click', () => {
  _fontSize = Math.max(_fontSize - 2, 10);
  outputText.style.fontSize = _fontSize + 'px';
});
}

async function _copyText(text, btnId) {
  try {
    await navigator.clipboard.writeText(text);
    if (btnId) _flashBtn(btnId);
  } catch (_) {}
}

function _flashBtn(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2.5 8l3.5 3.5 7.5-7" stroke-linecap="round" stroke-linejoin="round"/></svg>Copied!`;
  btn.style.color = 'var(--success)';
  setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 1500);
}

// ─── History ──────────────────────────────────────────────────────────────────
function _wireHistory() {
  const toggle = document.getElementById('history-toggle');
  toggle.addEventListener('click', async () => {
    _historyOpen = !_historyOpen;
    toggle.setAttribute('aria-expanded', String(_historyOpen));
    document.getElementById('history-panel').hidden = !_historyOpen;
    if (_historyOpen) await _renderHistory();
  });
  document.getElementById('clear-history-btn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type:'SSC_CLEAR_HISTORY' });
    await _renderHistory();
  });
}

async function _pushHistory(original, converted, direction) {
  await chrome.runtime.sendMessage({ type:'SSC_PUSH_HISTORY', entry:{ original, converted, direction, timestamp:Date.now() } });
  if (_historyOpen) await _renderHistory();
}

async function _renderHistory() {
  const { history=[] } = await chrome.runtime.sendMessage({ type:'SSC_GET_HISTORY' });
  const list  = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  list.innerHTML = '';
  if (!history.length) { empty.style.display='block'; return; }
  empty.style.display = 'none';
  for (const h of history) {
    const li = document.createElement('li');
    li.className = 'history-item'; li.tabIndex = 0;
    li.setAttribute('role','button'); li.title = 'Click to copy';
    const arrow = h.direction==='olchiki' ? '→ ᱚᱞ' : h.direction==='english' ? '→ EN' : '→ Aa';
    li.innerHTML = `<div class="hi-row"><span class="hi-orig">${_esc(_trunc(h.original,24))}</span><span class="hi-arrow">${arrow}</span><span class="hi-conv">${_esc(_trunc(h.converted,30))}</span></div><div class="hi-time">${_ago(h.timestamp)}</div>`;
    li.addEventListener('click', () => _copyText(h.converted));
    li.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); _copyText(h.converted); }});
    list.appendChild(li);
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function _fetchSettings() {
  try { const r = await chrome.runtime.sendMessage({type:'SSC_GET_SETTINGS'}); return r?.settings || {}; }
  catch (_) { return {}; }
}
function _saveSettings(s) { chrome.runtime.sendMessage({type:'SSC_SAVE_SETTINGS', settings:s}); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _v(id, show) { const el=document.getElementById(id); if(el) el.style.display=show?'':'none'; }
function _trunc(s, n) { return s.length>n ? s.slice(0,n)+'…' : s; }
function _esc(s)      { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _ago(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if (s<60)  return 'just now';
  const m = Math.floor(s/60); if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}
function _cleanGoogleResult(text) {
  return text
    .replace(/\s+/g, ' ')        // collapse multiple spaces/boxes into one
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
    .trim();
}   



function _wireSwap() {
  document.getElementById('swap-btn').addEventListener('click', () => {
    if (!_lastResult) return;

    // Flip the text
    const currentInput = document.getElementById('text-input').value;
    document.getElementById('text-input').value = _lastResult;
    document.getElementById('char-count').textContent = `${_lastResult.length} / 2000`;

    // Flip the direction
    const opposite = {
      'latin-olchiki':   'olchiki-latin',
      'olchiki-latin':   'latin-olchiki',
      'english-olchiki': 'olchiki-english',
      'english-latin':   'latin-english',
      'olchiki-english': 'english-olchiki',
      'latin-english':   'english-latin',
    };

    const newDir = opposite[_dir];
    if (newDir) _activateDir(newDir, true);

    // Set last result to old input so swap can be undone
    _lastResult = currentInput;
    _clearOutput();
  });
}