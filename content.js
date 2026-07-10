/**
 * Santali Script Converter — Content Script
 * Injected into every page. Handles clipboard writes and toast notifications
 * on behalf of the background service worker (which has no DOM access).
 */

// Guard against double-injection
if (!window.__SSC_INJECTED__) {
  window.__SSC_INJECTED__ = true;

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    switch (msg.type) {

      case 'SSC_GET_SELECTION':
        reply({ text: window.getSelection().toString() });
        break;

      case 'SSC_COPY':
        _writeClipboard(msg.text).then(ok => reply({ ok }));
        return true; // keep channel open for async

      case 'SSC_TOAST':
        _showToast(msg.message, msg.variant || 'success', msg.duration || 3500);
        reply({ ok: true });
        break;
    }
  });
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

async function _writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    // Fallback: off-screen textarea + execCommand
    try {
      const el = Object.assign(document.createElement('textarea'), {
        value:    text,
        readOnly: true,
        style:    'position:fixed;left:-9999px;top:-9999px;opacity:0;',
      });
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      return true;
    } catch (__) {
      return false;
    }
  }
}

// ─── Toast notification ───────────────────────────────────────────────────────

function _showToast(message, variant, duration) {
  // Ensure animation keyframes exist only once
  if (!document.getElementById('__ssc_styles__')) {
    const s = document.createElement('style');
    s.id = '__ssc_styles__';
    s.textContent = `
      @keyframes __ssc_in__  { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
      @keyframes __ssc_out__ { from { transform:translateX(0);    opacity:1 } to { transform:translateX(110%); opacity:0 } }
    `;
    document.head.appendChild(s);
  }

  // Remove any existing toast
  document.getElementById('__ssc_toast__')?.remove();

  const palettes = {
    success: { bg: '#1B5E20', border: '#43A047', icon: '✓' },
    error:   { bg: '#B71C1C', border: '#E53935', icon: '✕' },
    warning: { bg: '#E65100', border: '#FF6D00', icon: '⚠' },
    info:    { bg: '#0D47A1', border: '#1976D2', icon: 'ℹ' },
  };
  const p = palettes[variant] || palettes.success;

  const toast = document.createElement('div');
  toast.id = '__ssc_toast__';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'right:20px',
    'z-index:2147483647',
    `background:${p.bg}`,
    `border-left:4px solid ${p.border}`,
    'color:#fff',
    'padding:11px 16px',
    'border-radius:8px',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    'font-size:13.5px',
    'font-weight:500',
    'line-height:1.4',
    'box-shadow:0 4px 16px rgba(0,0,0,.35)',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'max-width:300px',
    'word-break:break-word',
    'cursor:pointer',
    'animation:__ssc_in__ .28s cubic-bezier(.21,1.02,.73,1) forwards',
  ].join(';');

  toast.innerHTML = `<span style="font-size:16px;flex-shrink:0">${p.icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  const dismiss = () => {
    toast.style.animation = '__ssc_out__ .22s ease-in forwards';
    setTimeout(() => toast.remove(), 230);
  };

  toast.addEventListener('click', dismiss);
  setTimeout(dismiss, Math.max(duration || 3500, 1500));
}
