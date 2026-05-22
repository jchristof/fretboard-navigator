import * as fretboard from './fretboard.js';
import * as controls from './controls.js';
import * as audio from './audio.js';
import * as practice from './practice.js';
import { TUNINGS, TUNING_OCTAVES } from './music.js';

const DEFAULTS = {
  key:        'A',
  scale:      'Major',
  mode:       'scale',
  tuning:     'Standard',
  strings:    6,
  fretCount:  12,
  labelMode:  'intervals',
  position:   'all',
  theme:      'dark',
  layoutMode: 'single',
  practice:   false,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('fretboardlab') ?? '{}');
    return { ...DEFAULTS, ...saved, practice: false };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveState(s) {
  try { localStorage.setItem('fretboardlab', JSON.stringify(s)); } catch {}
}

let state = loadState();

export function getState() { return state; }

export function setState(patch) {
  Object.assign(state, patch);
  if (patch.theme !== undefined) document.body.className = `theme-${state.theme}`;
  saveState(state);
  render();
  controls.update(state);
}

function render() {
  fretboard.render(state, (dotData) => {
    if (state.practice) {
      practice.handleDotClick(dotData, state);
    } else {
      const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();
      const octaves = (TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard']).slice().reverse();
      const si = parseInt(dotData.string, 10);
      audio.playNote(tuning[si] ?? 'E', parseInt(dotData.fret, 10), octaves[si] ?? 3);
    }
  });
}

document.body.className = `theme-${state.theme}`;

controls.init(setState);
controls.update(state);

document.getElementById('btn-play')?.addEventListener('click', () => {
  if (state.mode === 'chord') audio.playChord(state);
  else audio.playScale(state);
});

document.getElementById('btn-practice')?.addEventListener('click', () => {
  practice.activate(state, setState);
});

render();
