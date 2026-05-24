import { SCALES, CHORDS, TUNINGS } from './music.js';

const KEYS = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
const LABEL_MODES = [
  ['notes','Notes'], ['intervals','Intervals'], ['degrees','Degrees'], ['none','None']
];
const STRING_COUNTS = [4, 5, 6, 7, 8];

function positionOptionsHTML() {
  let html = '';
  for (let i = 1; i <= 7; i++) {
    html += `<option value="pos${i}">Box ${i}</option>`;
  }
  return html;
}

const PATTERNS = [['all','All'], ['box','Box'], ['3nps','3 NPS']];

function options(pairs) {
  return pairs.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

function buildHTML() {
  const scaleOpts = Object.keys(SCALES).map(s => `<option value="scale:${s}">${s}</option>`).join('');
  const chordLabel = c => c === 'Major' ? 'Major Triad' : c === 'Minor' ? 'Minor Triad' : c;
  const chordOpts = Object.keys(CHORDS).map(c => `<option value="chord:${c}">${chordLabel(c)}</option>`).join('');
  const tuningOpts = Object.keys(TUNINGS).map(t => `<option value="${t}">${t}</option>`).join('');

  return `
    <div class="controls-row controls-row-primary">
      <div class="ctrl-group">
        <label for="ctrl-key">Key</label>
        <select id="ctrl-key">${KEYS.map(k => `<option value="${k}">${k}</option>`).join('')}</select>
      </div>
      <div class="ctrl-sep"></div>
      <div class="ctrl-group">
        <label for="ctrl-scale">Scale / Mode</label>
        <select id="ctrl-scale">
          <optgroup label="Scales">${scaleOpts}</optgroup>
          <optgroup label="Chords">${chordOpts}</optgroup>
        </select>
      </div>
      <div class="ctrl-sep"></div>
      <div class="ctrl-group">
        <label for="ctrl-tuning">Tuning</label>
        <select id="ctrl-tuning">${tuningOpts}</select>
      </div>
      <div class="ctrl-sep layout-single-only"></div>
      <div class="ctrl-group layout-single-only">
        <label for="ctrl-labels">Labels</label>
        <select id="ctrl-labels">${options(LABEL_MODES)}</select>
      </div>
      <div class="ctrl-sep layout-single-only"></div>
      <div class="ctrl-group layout-single-only">
        <label for="ctrl-pattern">Pattern</label>
        <select id="ctrl-pattern">${options(PATTERNS)}</select>
      </div>
      <div class="ctrl-sep layout-single-only"></div>
      <div class="ctrl-group layout-single-only">
        <label for="ctrl-position">Position</label>
        <select id="ctrl-position">${positionOptionsHTML()}</select>
      </div>
      <div class="ctrl-sep layout-single-only"></div>
      <div class="ctrl-group layout-single-only">
        <label for="ctrl-strings">Strings</label>
        <select id="ctrl-strings">${STRING_COUNTS.map(n => `<option value="${n}">${n}</option>`).join('')}</select>
      </div>
      <div class="ctrl-actions">
        <button id="btn-play">▶</button>
        <button id="btn-practice">Practice</button>
        <button id="btn-theme">☀/☾</button>
        <button id="btn-layout">⊞</button>
      </div>
    </div>
    <div class="controls-row controls-row-secondary layout-double-only">
      <div class="ctrl-group">
        <label for="ctrl-labels-2">Labels</label>
        <select id="ctrl-labels-2">${options(LABEL_MODES)}</select>
      </div>
      <div class="ctrl-sep"></div>
      <div class="ctrl-group">
        <label for="ctrl-pattern-2">Pattern</label>
        <select id="ctrl-pattern-2">${options(PATTERNS)}</select>
      </div>
      <div class="ctrl-sep"></div>
      <div class="ctrl-group">
        <label for="ctrl-position-2">Position</label>
        <select id="ctrl-position-2">${positionOptionsHTML()}</select>
      </div>
      <div class="ctrl-sep"></div>
      <div class="ctrl-group">
        <label for="ctrl-strings-2">Strings</label>
        <select id="ctrl-strings-2">${STRING_COUNTS.map(n => `<option value="${n}">${n}</option>`).join('')}</select>
      </div>
    </div>`;
}

let _setState;

export function init(setState) {
  _setState = setState;
  const bar = document.getElementById('controls-bar');
  bar.innerHTML = buildHTML();
  wireEvents();
}

function wireEvents() {
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('change', fn); };
  const btn = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };

  on('ctrl-key', e => _setState({ key: e.target.value }));
  on('ctrl-scale', e => {
    const [m, v] = e.target.value.split(':');
    _setState({ scale: v, mode: m === 'chord' ? 'chord' : 'scale' });
  });
  on('ctrl-tuning', e => _setState({ tuning: e.target.value }));
  on('ctrl-labels', e => _setState({ labelMode: e.target.value }));
  on('ctrl-labels-2', e => _setState({ labelMode: e.target.value }));
  on('ctrl-pattern', e => _setState({ pattern: e.target.value }));
  on('ctrl-pattern-2', e => _setState({ pattern: e.target.value }));
  on('ctrl-position', e => _setState({ position: e.target.value }));
  on('ctrl-position-2', e => _setState({ position: e.target.value }));
  on('ctrl-strings', e => _setState({ strings: parseInt(e.target.value, 10) }));
  on('ctrl-strings-2', e => _setState({ strings: parseInt(e.target.value, 10) }));

  btn('btn-theme', () => {
    const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
    _setState({ theme: current === 'dark' ? 'light' : 'dark' });
  });

  btn('btn-layout', () => {
    const bar = document.getElementById('controls-bar');
    const current = bar.dataset.layout ?? 'single';
    _setState({ layoutMode: current === 'single' ? 'double' : 'single' });
  });
}

function syncSelect(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

export function update(state) {
  const bar = document.getElementById('controls-bar');
  bar.dataset.layout = state.layoutMode;
  syncSelect('ctrl-key', state.key);
  syncSelect('ctrl-scale', `${state.mode === 'chord' ? 'chord' : 'scale'}:${state.scale}`);
  syncSelect('ctrl-tuning', state.tuning);
  syncSelect('ctrl-labels', state.labelMode);
  syncSelect('ctrl-labels-2', state.labelMode);
  syncSelect('ctrl-pattern', state.pattern);
  syncSelect('ctrl-pattern-2', state.pattern);
  syncSelect('ctrl-position', state.position);
  syncSelect('ctrl-position-2', state.position);
  syncSelect('ctrl-strings', state.strings);
  syncSelect('ctrl-strings-2', state.strings);
}
