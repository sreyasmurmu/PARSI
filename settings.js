/**
 * Santali Script Converter — Settings Page
 * No API key needed. All translation is done locally via built-in dictionary.
 */
const DEFAULTS = { autoClipboard:true, theme:'auto', notificationDuration:3500, lastUsedDir:'latin-olchiki' };
const DUR_STEPS = [1500,2000,2500,3000,3500,4000,5000,6000];
let _durIdx=4, _settings={...DEFAULTS};

document.addEventListener('DOMContentLoaded', async () => {
  _settings = await _load();
  _applyTheme(_settings.theme);
  _populateUI(_settings);
  _wire();
});

async function _load() {
  try { const r=await chrome.runtime.sendMessage({type:'SSC_GET_SETTINGS'}); return {...DEFAULTS,...(r?.settings||{})}; }
  catch(_){ return {...DEFAULTS}; }
}

function _populateUI(s) {
  document.getElementById('auto-clip').checked  = s.autoClipboard!==false;
  document.getElementById('theme-select').value = s.theme||'auto';
  _durIdx = DUR_STEPS.indexOf(s.notificationDuration||3500);
  if (_durIdx===-1) _durIdx=4;
  _renderDur();
}

function _applyTheme(t) {
  const el=document.documentElement;
  if(t==='dark'){ el.dataset.theme='dark'; return; }
  if(t==='light'){ el.dataset.theme='light'; return; }
  delete el.dataset.theme;
}

function _renderDur() {
  document.getElementById('dur-val').textContent=(DUR_STEPS[_durIdx]/1000).toFixed(1)+'s';
  document.getElementById('dur-minus').disabled=(_durIdx===0);
  document.getElementById('dur-plus').disabled=(_durIdx===DUR_STEPS.length-1);
}

function _wire() {
  document.getElementById('theme-select').addEventListener('change', e=>_applyTheme(e.target.value));
  document.getElementById('dur-minus').addEventListener('click', ()=>{ if(_durIdx>0){_durIdx--;_renderDur();} });
  document.getElementById('dur-plus').addEventListener('click',  ()=>{ if(_durIdx<DUR_STEPS.length-1){_durIdx++;_renderDur();} });
  document.getElementById('configure-shortcuts-btn').addEventListener('click', ()=>chrome.tabs.create({url:'chrome://extensions/shortcuts'}));
  document.getElementById('reset-btn').addEventListener('click', async ()=>{
    if(!confirm('Reset all settings to defaults?')) return;
    _settings={...DEFAULTS}; _populateUI(_settings); _applyTheme(_settings.theme);
    await chrome.runtime.sendMessage({type:'SSC_SAVE_SETTINGS',settings:_settings});
    _flash();
  });
  document.getElementById('save-btn').addEventListener('click', async ()=>{
    _settings={
      ..._settings,
      autoClipboard: document.getElementById('auto-clip').checked,
      theme:         document.getElementById('theme-select').value,
      notificationDuration: DUR_STEPS[_durIdx],
    };
    _applyTheme(_settings.theme);
    await chrome.runtime.sendMessage({type:'SSC_SAVE_SETTINGS',settings:_settings});
    _flash();
  });
}

function _flash() {
  const el=document.getElementById('save-confirm'); el.hidden=false;
  setTimeout(()=>{ el.hidden=true; },2500);
}
