/**
 * Santali Script Converter — Transliteration Engine
 * Bidirectional conversion: Latin ↔ Ol Chiki (ᱚᱞ ᱪᱤᱠᱤ)
 *
 * Vowel key (validated against the script's own name "Ol Chiki" = ᱚᱞ ᱪᱤᱠᱤ):
 *   ᱚ = o   ᱟ = a   ᱤ = i   ᱩ = u   ᱮ = e   ᱳ = oo
 *
 * Consonants follow standard Santali Latin orthography.
 * Capital D / T denote retroflex ḍ / ṭ; 'ng', 'ny', 'ch', 'bb', 'rr' are digraphs.
 */

// ─── Ol Chiki → Latin ───────────────────────────────────────────────────────

const OLCHIKI_TO_LATIN = {
  // Vowels
  'ᱚ': 'o',   // OL A         — "Ol" in "Ol Chiki"
  'ᱟ': 'a',   // OL LAA       — open front/back a
  'ᱤ': 'i',   // OL AAY       — short front i
  'ᱩ': 'u',   // OL OL        — short back u
  'ᱮ': 'e',   // OL EDD       — mid front e
  'ᱳ': 'oo',  // OL OALL      — long/round o

  // Consonants
  'ᱛ': 't',   // OL AT        — dental t
  'ᱜ': 'g',   // OL AG
  'ᱝ': 'ng',  // OL ANG       — velar nasal ŋ
  'ᱞ': 'l',   // OL AL
  'ᱠ': 'k',   // OL AAK
  'ᱡ': 'j',   // OL AAJ
  'ᱢ': 'm',   // OL AAM
  'ᱣ': 'w',   // OL AALL      — labial approximant
  'ᱥ': 's',   // OL EEM
  'ᱦ': 'h',   // OL AAW
  'ᱧ': 'ny',  // OL AAN       — palatal nasal ñ
  'ᱨ': 'r',   // OL OR
  'ᱪ': 'c',   // OL EEB       — palatal affricate /tʃ/
  'ᱫ': 'd',   // OL EDO       — dental d
  'ᱬ': 'bb',  // OL OBB       — implosive b
  'ᱭ': 'y',   // OL OYY
  'ᱯ': 'p',   // OL OPP
  'ᱰ': 'D',   // OL ADD       — retroflex ḍ (capital D)
  'ᱱ': 'n',   // OL AND
  'ᱲ': 'rr',  // OL AALL      — retroflex ṛ
  'ᱴ': 'T',   // OL OTT       — retroflex ṭ (capital T)
  'ᱵ': 'b',   // OL OBB (b)   — regular b
  'ᱶ': 'v',   // OL OGG       — labiodental / ph / f
  'ᱷ': "'",   // OL OPHH      — aspiration/glottal marker

  // Diacritical marks
  'ᱸ': 'N',   // Nasalization mark
  'ᱹ': "'",   // Glottal/headmark
  'ᱺ': ':',   // Length/stress
  'ᱻ': '',    // Relax (silent)
  'ᱼ': '-',   // Syllable separator
  'ᱽ': "'",   // Ahad/end marker

  // Punctuation
  '᱾': ', ',  // Saaqin (pause/comma)
  '᱿': '. ',  // Double saaqin (full stop)

  // Digits → Arabic
  '᱐': '0', '᱑': '1', '᱒': '2', '᱓': '3', '᱔': '4',
  '᱕': '5', '᱖': '6', '᱗': '7', '᱘': '8', '᱙': '9',
};

// ─── Latin → Ol Chiki ───────────────────────────────────────────────────────
// Longer sequences are listed first so the greedy left-to-right matcher
// always picks the longest possible match.

const LATIN_TO_OLCHIKI = [
  // ── Digraphs (must precede single-char entries) ──────────────────────────
  ['ng',  'ᱝ'],   // velar nasal ŋ
  ['ny',  'ᱧ'],   // palatal nasal ñ
  ['ch',  'ᱪ'],   // palatal affricate
  ['bb',  'ᱬ'],   // implosive b
  ['rr',  'ᱲ'],   // retroflex ṛ
  ['oo',  'ᱳ'],   // long / round o
  ['kh',  'ᱠ'],   // aspirated k  → base k
  ['gh',  'ᱜ'],   // aspirated g  → base g
  ['jh',  'ᱡ'],   // aspirated j  → base j
  ['th',  'ᱛ'],   // aspirated t  → base t
  ['dh',  'ᱫ'],   // aspirated d  → base d
  ['ph',  'ᱶ'],   // ph / f sound → ᱶ
  ['bh',  'ᱵ'],   // aspirated b  → base b
  ['Th',  'ᱴ'],   // aspirated retroflex T → ᱴ
  ['Dh',  'ᱰ'],   // aspirated retroflex D → ᱰ

  // ── Single characters ─────────────────────────────────────────────────────
  ['a', 'ᱟ'],
  ['b', 'ᱵ'],
  ['c', 'ᱪ'],
  ['d', 'ᱫ'],
  ['D', 'ᱰ'],   // retroflex ḍ
  ['e', 'ᱮ'],
  ['g', 'ᱜ'],
  ['h', 'ᱦ'],
  ['i', 'ᱤ'],
  ['j', 'ᱡ'],
  ['k', 'ᱠ'],
  ['l', 'ᱞ'],
  ['m', 'ᱢ'],
  ['n', 'ᱱ'],
  ['o', 'ᱚ'],
  ['p', 'ᱯ'],
  ['r', 'ᱨ'],
  ['s', 'ᱥ'],
  ['t', 'ᱛ'],
  ['T', 'ᱴ'],   // retroflex ṭ
  ['u', 'ᱩ'],
  ['v', 'ᱶ'],
  ['w', 'ᱣ'],
  ['y', 'ᱭ'],
  ['f', 'ᱶ'],   // f ≈ ph / v in Santali

  // ── Diacritics ────────────────────────────────────────────────────────────
  ['~',  'ᱸ'],   // nasalization
  ["'",  'ᱹ'],   // glottal stop
];

// ─── Ol Chiki Unicode block: U+1C50–U+1C7F ──────────────────────────────────
const OC_START = 0x1C50;
const OC_END   = 0x1C7F;

function _isOlChiki(char) {
  const cp = char.codePointAt(0);
  return cp >= OC_START && cp <= OC_END;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Detect the predominant script of `text`.
 * @returns {'olchiki'|'latin'|'unknown'}
 */
function detectScript(text) {
  if (!text || !text.trim()) return 'unknown';
  let oc = 0, lat = 0;
  for (const ch of text) {
    if (_isOlChiki(ch)) oc++;
    else if (/[a-zA-Z]/.test(ch)) lat++;
  }
  if (oc === 0 && lat === 0) return 'unknown';
  return oc >= lat ? 'olchiki' : 'latin';
}

/**
 * Convert Ol Chiki → Latin.
 * Characters with no mapping are passed through unchanged.
 */
function olChikiToLatin(text) {
  let out = '';
  for (const ch of text) {
    out += Object.prototype.hasOwnProperty.call(OLCHIKI_TO_LATIN, ch)
      ? OLCHIKI_TO_LATIN[ch]
      : ch;
  }
  return out;
}

/**
 * Convert Latin → Ol Chiki.
 * Characters with no mapping (English words, numbers, URLs, symbols) are
 * passed through unchanged, preserving mixed-language content.
 */
function latinToOlChiki(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (const [lat, oc] of LATIN_TO_OLCHIKI) {
      if (text.startsWith(lat, i)) {
        out += oc;
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text[i++]; // pass through unchanged
    }
  }
  return out;
}

/**
 * Top-level conversion.
 * @param {string} text
 * @param {'latin'|'olchiki'} targetScript
 * @returns {{ result: string, sourceScript: string, success: boolean, message: string }}
 */
function convertText(text, targetScript) {
  if (!text || !text.trim()) {
    return { result: '', sourceScript: 'unknown', success: false, message: 'No text provided.' };
  }

  const sourceScript = detectScript(text);

  if (targetScript === 'latin') {
    if (sourceScript !== 'olchiki') {
      return { result: text, sourceScript, success: true, message: 'Text is already in Latin script.' };
    }
    return { result: olChikiToLatin(text), sourceScript, success: true, message: 'Converted to Latin.' };
  }

  if (targetScript === 'olchiki') {
    if (sourceScript === 'olchiki') {
      return { result: text, sourceScript, success: true, message: 'Text is already in Ol Chiki.' };
    }
    return { result: latinToOlChiki(text), sourceScript, success: true, message: 'Converted to Ol Chiki.' };
  }

  return { result: text, sourceScript, success: false, message: 'Unknown target script.' };
}

// ─── Export (works in both service worker via importScripts and popup via <script>) ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { detectScript, olChikiToLatin, latinToOlChiki, convertText };
}
