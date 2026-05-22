import * as fretboard from './fretboard.js';
import * as controls from './controls.js';

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
  if (patch.theme) document.body.className = `theme-${state.theme}`;
  fretboard.render(state, null);
  controls.update(state);
}

controls.init(setState);
controls.update(state);
fretboard.render(state, null);
