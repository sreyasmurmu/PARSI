/**
 * Santali Script Converter v2 — Background Service Worker
 */

importScripts('transliteration.js');

// ── Open sidebar when the toolbar icon is clicked ─────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ── Build context menus ───────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  _buildMenus();
  chrome.storage.sync.get('settings').then(d => {
    if (!d.settings) chrome.storage.sync.set({ settings: _defaults() });
  });
});
chrome.runtime.onStartup.addListener(_buildMenus);

function _buildMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id:'ssc-root',        title:'Santali Script Converter', contexts:['selection'] });
    chrome.contextMenus.create({ id:'ssc-to-olchiki',  title:'Convert to Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)', parentId:'ssc-root', contexts:['selection'] });
    chrome.contextMenus.create({ id:'ssc-to-latin',    title:'Convert to Santali (Latin)',       parentId:'ssc-root', contexts:['selection'] });
  });
}

// ── Context menu handler ─────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab?.id) return;
  const target = info.menuItemId === 'ssc-to-latin' ? 'latin' : 'olchiki';
  await _runConvert(info.selectionText, target, tab.id);
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  let text = '';
  try {
    const [{ result }] = await chrome.scripting.executeScript({ target:{ tabId:tab.id }, func:()=>window.getSelection().toString() });
    text = result?.trim() || '';
  } catch (_) {}
  if (!text) { _toast(tab.id, 'Highlight Santali text on the page first.', 'warning'); return; }
  const target = command === 'convert-to-latin' ? 'latin' : 'olchiki';
  await _runConvert(text, target, tab.id);
});

// ── Shared convert + copy + toast + history ───────────────────────────────────
async function _runConvert(text, target, tabId) {
  const { result, success, message } = convertText(text, target);
  if (!success) { _toast(tabId, message, 'error'); return; }
  const settings = await _getSettings();
  if (settings.autoClipboard) {
    chrome.tabs.sendMessage(tabId, { type:'SSC_COPY', text: result }).catch(()=>{});
  }
  _toast(tabId, `Converted to ${target === 'olchiki' ? 'Ol Chiki' : 'Latin'} — copied!`, 'success', settings.notificationDuration);
  await _pushHistory({ original: text, converted: result, direction: target, timestamp: Date.now() });
}

function _toast(tabId, message, variant='success', duration=3500) {
  chrome.tabs.sendMessage(tabId, { type:'SSC_TOAST', message, variant, duration }).catch(()=>{});
}

// ── History ───────────────────────────────────────────────────────────────────
async function _pushHistory(entry) {
  const { history = [] } = await chrome.storage.session.get('history').catch(()=>({ history:[] }));
  const next = [entry, ...history].slice(0, 15);
  await chrome.storage.session.set({ history: next }).catch(()=>{});
}

// ── Settings helpers ──────────────────────────────────────────────────────────
function _defaults() {
  return { autoClipboard:true, theme:'auto', notificationDuration:3500, lastUsedDir:'latin-olchiki' };
}
async function _getSettings() {
  const d = await chrome.storage.sync.get('settings');
  return { ..._defaults(), ...(d.settings || {}) };
}

// ── Message bus ───────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  switch (msg.type) {
    case 'SSC_GET_HISTORY':
      chrome.storage.session.get('history').then(d => reply({ history: d.history||[] })).catch(()=>reply({history:[]}));
      return true;
    case 'SSC_CLEAR_HISTORY':
      chrome.storage.session.remove('history').then(()=>reply({ok:true}));
      return true;
    case 'SSC_PUSH_HISTORY':
      _pushHistory(msg.entry).then(()=>reply({ok:true}));
      return true;
    case 'SSC_GET_SETTINGS':
      _getSettings().then(s=>reply({settings:s}));
      return true;
    case 'SSC_SAVE_SETTINGS':
      chrome.storage.sync.set({settings:msg.settings}).then(()=>reply({ok:true}));
      return true;
  }
});
