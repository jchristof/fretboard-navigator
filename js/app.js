import * as fretboard from './fretboard.js';
import * as controls from './controls.js';
import * as audio from './audio.js';
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

let state = { ...DEFAULTS };

export function getState() { return state; }

export function setState(patch) {
  Object.assign(state, patch);
  if (patch.theme !== undefined) document.body.className = `theme-${state.theme}`;
  render();
  controls.update(state);
}

function render() {
  fretboard.render(state, (dotData) => {
    const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();
    const octaves = (TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard']).slice().reverse();
    const si = parseInt(dotData.string, 10);
    audio.playNote(tuning[si] ?? 'E', parseInt(dotData.fret, 10), octaves[si] ?? 3);
  });
}

controls.init(setState);
controls.update(state);

document.getElementById('btn-play')?.addEventListener('click', () => {
  if (state.mode === 'chord') audio.playChord(state);
  else audio.playScale(state);
});

render();
