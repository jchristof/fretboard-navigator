# Fretboard Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side guitar fretboard visualization app with scales, chords, audio, practice mode, and dark/light theming — no build step, no dependencies.

**Architecture:** Single app state object in `app.js` drives everything; `setState(patch)` merges changes, persists to localStorage, and calls `fretboard.render(state)` + `controls.update(state)`. `music.js` is pure functions with no DOM. `fretboard.js` clears and redraws an SVG element on every render call.

**Tech Stack:** Plain HTML5, CSS custom properties, vanilla ES Modules, Web Audio API, localStorage. Tested with Node.js (pure functions) and manual browser verification (visual/DOM).

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Shell: controls header, SVG container, practice overlay |
| `style.css` | Layout, dark/light CSS custom properties, controls bar, dot animations |
| `js/music.js` | Notes, scales, chords, tunings, interval labels — no DOM |
| `js/fretboard.js` | SVG renderer — clears and redraws on every `render(state)` call |
| `js/controls.js` | Builds controls HTML, wires events, syncs values on state load |
| `js/audio.js` | Web Audio API — single note, scale, and chord playback |
| `js/practice.js` | Practice overlay — quiz loop, scoring, drill types |
| `js/app.js` | State owner — `setState(patch)`, localStorage, module wiring |
| `tests/test-music.mjs` | Node.js unit tests for `music.js` pure functions |

---

## Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `style.css` (stub)
- Create: `js/app.js` (stub)

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fretboard Lab</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="theme-dark">
  <div id="app">
    <header id="controls-bar"></header>
    <main id="fretboard-container">
      <svg id="fretboard-svg" viewBox="0 0 700 230" preserveAspectRatio="xMidYMid meet"></svg>
    </main>
    <div id="practice-overlay" hidden></div>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css` stub**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body.theme-dark {
  --bg:           #0d0d0d;
  --surface:      #161616;
  --border:       #2a2a2a;
  --text:         #dddddd;
  --text-muted:   #555555;
  --root-color:   #e67e22;
  --tone-color:   #3498db;
  --fretboard-bg: #1a1008;
  --nut-color:    #c8b88a;
  --string-color: #bbbbbb;
  --fret-color:   #3a3020;
  --inlay-color:  #2a2010;
}

body.theme-light {
  --bg:           #f5f0e8;
  --surface:      #e8e0d0;
  --border:       #bbbbbb;
  --text:         #222222;
  --text-muted:   #888888;
  --root-color:   #c0392b;
  --tone-color:   #2980b9;
  --fretboard-bg: #d4c9a8;
  --nut-color:    #5a4a30;
  --string-color: #555555;
  --fret-color:   #b8aa88;
  --inlay-color:  #b0a080;
}

body { background: var(--bg); color: var(--text); font-family: sans-serif; }

#app { display: flex; flex-direction: column; min-height: 100vh; padding: 12px; gap: 12px; }

#fretboard-container { width: 100%; }
#fretboard-svg { width: 100%; display: block; }
```

- [ ] **Step 3: Create `js/app.js` stub**

```js
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
  fretboard.render(state);
  controls.update(state);
}

controls.init(setState);
fretboard.render(state);
```

- [ ] **Step 4: Create empty module stubs so the import chain doesn't error**

Create `js/fretboard.js`:
```js
export function render(state) {}
```

Create `js/controls.js`:
```js
export function init(setState) {}
export function update(state) {}
```

- [ ] **Step 5: Verify — open `index.html` in a browser**

Expected: Dark background, no errors in DevTools console.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css js/app.js js/fretboard.js js/controls.js
git commit -m "feat: project scaffold with state shell and theme CSS"
```

---

## Task 2: `music.js` — Note Utilities

**Files:**
- Create: `js/music.js`
- Create: `tests/test-music.mjs`

- [ ] **Step 1: Create `js/music.js` with constants and note utilities**

```js
export const NOTES = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];

const ENHARMONIC = {
  'Db':'C#','Eb':'D#','Fb':'E','Gb':'F#','Ab':'G#','Bb':'A#','Cb':'B',
};

export function normalize(note) {
  return ENHARMONIC[note] ?? note;
}

export const SCALES = {
  'Major':            [0,2,4,5,7,9,11],
  'Natural Minor':    [0,2,3,5,7,8,10],
  'Harmonic Minor':   [0,2,3,5,7,8,11],
  'Pentatonic Major': [0,2,4,7,9],
  'Pentatonic Minor': [0,3,5,7,10],
  'Blues':            [0,3,5,6,7,10],
  'Dorian':           [0,2,3,5,7,9,10],
  'Phrygian':         [0,1,3,5,7,8,10],
  'Lydian':           [0,2,4,6,7,9,11],
  'Mixolydian':       [0,2,4,5,7,9,10],
  'Locrian':          [0,1,3,5,6,8,10],
  'Whole Tone':       [0,2,4,6,8,10],
  'Diminished':       [0,2,3,5,6,8,9,11],
};

export const CHORDS = {
  'Major': [0,4,7], 'Minor': [0,3,7],
  'Dom 7': [0,4,7,10], 'Maj 7': [0,4,7,11], 'Min 7': [0,3,7,10],
  'Dim': [0,3,6], 'Aug': [0,4,8], 'Sus2': [0,2,7], 'Sus4': [0,5,7],
};

// Low string first (index 0 = lowest string)
export const TUNINGS = {
  'Standard':       ['E','A','D','G','B','E'],
  'Drop D':         ['D','A','D','G','B','E'],
  'Open G':         ['D','G','D','G','B','D'],
  'DADGAD':         ['D','A','D','G','A','D'],
  'Open E':         ['E','B','E','G#','B','E'],
  'Half Step Down': ['Eb','Ab','Db','Gb','Bb','Eb'],
  'Open D':         ['D','A','D','F#','A','D'],
};

// Base octaves matching TUNINGS (low string first)
export const TUNING_OCTAVES = {
  'Standard':       [2,2,3,3,3,4],
  'Drop D':         [2,2,3,3,3,4],
  'Open G':         [2,2,3,3,3,4],
  'DADGAD':         [2,2,3,3,3,4],
  'Open E':         [2,2,3,3,3,4],
  'Half Step Down': [2,2,3,3,3,4],
  'Open D':         [2,2,3,3,3,4],
};

export const INTERVAL_NAMES = {
  0:'R', 1:'b2', 2:'2', 3:'b3', 4:'3', 5:'4',
  6:'b5', 7:'5', 8:'b6', 9:'6', 10:'b7', 11:'7',
};

const SEMITONE_FROM_C = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,
  'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,
  'A':9,'A#':10,'Bb':10,'B':11,
};

export function getNoteAtFret(openNote, fret) {
  const open = normalize(openNote);
  const idx = NOTES.indexOf(open);
  return NOTES[(idx + fret) % 12];
}

export function buildFretboard(tuning, fretCount) {
  return tuning.map(openNote =>
    Array.from({ length: fretCount + 1 }, (_, fret) => getNoteAtFret(openNote, fret))
  );
}

export function noteToMidi(openNote, fret, baseOctave) {
  const open = normalize(openNote);
  const semitone = SEMITONE_FROM_C[open] ?? 0;
  return (baseOctave + 1) * 12 + semitone + fret;
}

export function getNotesInScale(root, scaleName) {
  const intervals = SCALES[scaleName] ?? SCALES['Major'];
  const rootIdx = NOTES.indexOf(normalize(root));
  return intervals.map(i => NOTES[(rootIdx + i) % 12]);
}

export function getChordNotes(root, chordName) {
  const intervals = CHORDS[chordName] ?? CHORDS['Major'];
  const rootIdx = NOTES.indexOf(normalize(root));
  return intervals.map(i => NOTES[(rootIdx + i) % 12]);
}

export function getIntervalLabel(root, note) {
  const rootIdx = NOTES.indexOf(normalize(root));
  const noteIdx = NOTES.indexOf(normalize(note));
  const semitones = (noteIdx - rootIdx + 12) % 12;
  return INTERVAL_NAMES[semitones] ?? '';
}
```

- [ ] **Step 2: Create `tests/test-music.mjs`**

```js
import {
  getNoteAtFret, buildFretboard, noteToMidi,
  getNotesInScale, getChordNotes, getIntervalLabel, normalize,
} from '../js/music.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { console.log(`✓ ${msg}`); passed++; }
  else { console.error(`✗ ${msg}`); failed++; }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// normalize
assert(normalize('Eb') === 'D#', 'normalize Eb → D#');
assert(normalize('E')  === 'E',  'normalize E unchanged');

// getNoteAtFret
assert(getNoteAtFret('E', 0)  === 'E',  'E string open = E');
assert(getNoteAtFret('E', 5)  === 'A',  'E string fret 5 = A');
assert(getNoteAtFret('E', 12) === 'E',  'E string fret 12 = E (octave)');
assert(getNoteAtFret('B', 1)  === 'C',  'B string fret 1 = C');
assert(getNoteAtFret('Eb', 2) === 'F',  'Eb fret 2 = F (flat input)');

// buildFretboard
const fb = buildFretboard(['E','A'], 3);
assert(fb[0][0] === 'E',  'buildFretboard string 0 fret 0 = E');
assert(fb[0][5 % 4] === getNoteAtFret('E', 5 % 4), 'buildFretboard wraps frets');
assert(fb[1][0] === 'A',  'buildFretboard string 1 fret 0 = A');
assert(fb[1][2] === 'B',  'A string fret 2 = B');

// noteToMidi
assert(noteToMidi('A', 0, 4)  === 69, 'A4 = MIDI 69');
assert(noteToMidi('E', 0, 2)  === 40, 'E2 = MIDI 40 (low E open)');
assert(noteToMidi('E', 5, 2)  === 45, 'E2 fret 5 = MIDI 45 (A2)');
assert(noteToMidi('E', 0, 4)  === 64, 'E4 = MIDI 64 (high E open)');

// getNotesInScale
assert(eq(getNotesInScale('A','Major'), ['A','B','C#','D','E','F#','G#']),
  'A Major scale');
assert(eq(getNotesInScale('C','Major'), ['C','D','E','F','G','A','B']),
  'C Major scale');
assert(eq(getNotesInScale('A','Pentatonic Minor'), ['A','C','D','E','G']),
  'A Minor Pentatonic');

// getChordNotes
assert(eq(getChordNotes('A','Major'), ['A','C#','E']), 'A Major chord');
assert(eq(getChordNotes('A','Minor'), ['A','C','E']),  'A Minor chord');
assert(eq(getChordNotes('G','Dom 7'), ['G','B','D','F']), 'G Dom 7');

// getIntervalLabel
assert(getIntervalLabel('A','A')  === 'R',  'A→A = Root');
assert(getIntervalLabel('A','C#') === '3',  'A→C# = major 3rd');
assert(getIntervalLabel('A','C')  === 'b3', 'A→C = minor 3rd');
assert(getIntervalLabel('A','E')  === '5',  'A→E = 5th');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 3: Run tests — verify all pass**

```bash
node tests/test-music.mjs
```

Expected output: all `✓` lines, `20 passed, 0 failed`

- [ ] **Step 4: Commit**

```bash
git add js/music.js tests/test-music.mjs
git commit -m "feat: music.js theory engine with passing tests"
```

---

## Task 3: `fretboard.js` — SVG Structure

**Files:**
- Modify: `js/fretboard.js`

- [ ] **Step 1: Implement SVG structure rendering (neck, frets, strings, inlays, labels)**

```js
import { TUNINGS, getNoteAtFret } from './music.js';

const SVG_W = 700, SVG_H = 230;
const NUT_X = 30, NUT_W = 6;
const FB_TOP = 10, FB_H = 180;
const STRING_PAD = 20;
const FRET_NUM_Y = SVG_H - 8;

const INLAY_FRETS = new Set([3, 5, 7, 9]);
const DOUBLE_INLAY_FRETS = new Set([12]);

function ns(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function fretLineX(fret, fretW) {
  return NUT_X + NUT_W + fret * fretW;
}

function dotX(fret, fretW) {
  return fretLineX(fret, fretW) + fretW / 2;
}

function stringY(index, count) {
  const top = FB_TOP + STRING_PAD;
  const bottom = FB_TOP + FB_H - STRING_PAD;
  return count > 1 ? top + index * (bottom - top) / (count - 1) : (top + bottom) / 2;
}

function stringWeight(index, count) {
  const min = 0.8, max = 2.5;
  return count > 1 ? min + (max - min) * index / (count - 1) : (min + max) / 2;
}

function cssVar(name) {
  return `var(${name})`;
}

function drawStructure(svg, state) {
  const { strings: stringCount, fretCount } = state;
  const fretAreaW = SVG_W - NUT_X - NUT_W - 10;
  const fretW = fretAreaW / fretCount;

  // Fretboard background
  svg.appendChild(ns('rect', {
    x: NUT_X, y: FB_TOP, width: SVG_W - NUT_X - 10, height: FB_H,
    rx: 4, fill: cssVar('--fretboard-bg'),
  }));

  // Nut
  svg.appendChild(ns('rect', {
    x: NUT_X, y: FB_TOP, width: NUT_W, height: FB_H,
    fill: cssVar('--nut-color'),
  }));

  // Fret lines
  for (let f = 1; f <= fretCount; f++) {
    const x = fretLineX(f, fretW);
    svg.appendChild(ns('line', {
      x1: x, y1: FB_TOP, x2: x, y2: FB_TOP + FB_H,
      stroke: cssVar('--fret-color'), 'stroke-width': 2,
    }));
  }

  // Position inlay markers
  const inlayCy = FB_TOP + FB_H / 2;
  for (let f = 1; f <= fretCount; f++) {
    const cx = fretLineX(f - 1, fretW) + fretW / 2;
    if (DOUBLE_INLAY_FRETS.has(f)) {
      const off = FB_H * 0.15;
      svg.appendChild(ns('circle', { cx, cy: inlayCy - off, r: 5, fill: cssVar('--inlay-color') }));
      svg.appendChild(ns('circle', { cx, cy: inlayCy + off, r: 5, fill: cssVar('--inlay-color') }));
    } else if (INLAY_FRETS.has(f)) {
      svg.appendChild(ns('circle', { cx, cy: inlayCy, r: 5, fill: cssVar('--inlay-color') }));
    }
  }

  // Tuning array: low-to-high in TUNINGS; display high-to-low (index 0 = top)
  const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();

  // Strings
  for (let i = 0; i < stringCount; i++) {
    const y = stringY(i, stringCount);
    svg.appendChild(ns('line', {
      x1: NUT_X, y1: y, x2: SVG_W - 10, y2: y,
      stroke: cssVar('--string-color'),
      'stroke-width': stringWeight(i, stringCount),
    }));
    // String label (left of nut)
    const label = ns('text', {
      x: NUT_X - 8, y: y + 3,
      fill: cssVar('--text-muted'),
      'font-size': 10, 'text-anchor': 'middle',
    });
    label.textContent = tuning[i] ?? '';
    svg.appendChild(label);
  }

  // Fret numbers (0 = open, then 1–fretCount)
  for (let f = 0; f <= fretCount; f++) {
    const x = f === 0
      ? NUT_X + NUT_W + fretW / 2
      : fretLineX(f, fretW) - fretW / 2;
    const num = ns('text', {
      x, y: FRET_NUM_Y,
      fill: cssVar('--text-muted'),
      'font-size': 9, 'text-anchor': 'middle',
    });
    num.textContent = f;
    svg.appendChild(num);
  }
}

export function render(state) {
  const svg = document.getElementById('fretboard-svg');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  drawStructure(svg, state);
}
```

- [ ] **Step 2: Add music.js import to app.js and trigger first render**

In `js/app.js`, the `fretboard.render(state)` call at the bottom is already there from Task 1. No change needed — the import chain will now call the real render.

- [ ] **Step 3: Verify in browser**

Open `index.html`. Expected: dark fretboard with nut, 12 fret lines, 6 strings (with string labels E B G D A E left to right top to bottom — high E at top), fret position dot markers, and fret numbers 0–12.

- [ ] **Step 4: Commit**

```bash
git add js/fretboard.js
git commit -m "feat: SVG fretboard structure — neck, strings, frets, inlays"
```

---

## Task 4: `fretboard.js` — Scale Dot Rendering

**Files:**
- Modify: `js/fretboard.js`

- [ ] **Step 1: Add dot rendering to `fretboard.js`**

Add these imports at the top of `js/fretboard.js`:
```js
import { TUNINGS, TUNING_OCTAVES, getNoteAtFret, getNotesInScale, getChordNotes, getIntervalLabel, noteToMidi, NOTES } from './music.js';
```

Add `drawDots` function and call it from `render`:
```js
function drawDots(svg, state, onDotClick) {
  const { strings: stringCount, fretCount, key, scale, mode, labelMode, position } = state;
  const fretAreaW = SVG_W - NUT_X - NUT_W - 10;
  const fretW = fretAreaW / fretCount;

  const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();
  const octaves = (TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard']).slice().reverse();
  const activeNotes = mode === 'chord'
    ? getChordNotes(key, scale)
    : getNotesInScale(key, scale);

  const fretRange = getPositionRange(state);

  for (let si = 0; si < stringCount; si++) {
    const openNote = tuning[si] ?? 'E';
    const baseOctave = octaves[si] ?? 3;
    const y = stringY(si, stringCount);

    for (let fret = 0; fret <= fretCount; fret++) {
      if (fretRange && (fret < fretRange.start || fret > fretRange.end)) continue;
      const note = getNoteAtFret(openNote, fret);
      if (!activeNotes.includes(note)) continue;

      const x = dotX(fret, fretW);
      const isRoot = note === key;
      const midi = noteToMidi(openNote, fret, baseOctave);

      const g = ns('g', { class: 'dot', style: 'cursor:pointer' });
      g.appendChild(ns('circle', {
        cx: x, cy: y, r: 11,
        fill: isRoot ? cssVar('--root-color') : cssVar('--tone-color'),
      }));

      if (!state.practice) {
        const labelText = getDotLabel(key, note, labelMode);
        const t = ns('text', {
          x, y: y + 3.5,
          fill: '#fff',
          'font-size': 8,
          'text-anchor': 'middle',
          'font-weight': isRoot ? 'bold' : 'normal',
          'pointer-events': 'none',
        });
        t.textContent = labelText;
        g.appendChild(t);
      }

      g.dataset.midi = midi;
      g.dataset.note = note;
      g.dataset.fret = fret;
      g.dataset.string = si;
      if (onDotClick) g.addEventListener('click', () => onDotClick(g.dataset));
      svg.appendChild(g);
    }
  }
}

function getDotLabel(root, note, labelMode) {
  switch (labelMode) {
    case 'notes':     return note;
    case 'intervals': return getIntervalLabel(root, note);
    case 'degrees':   return getIntervalLabel(root, note).replace('b','♭').replace('#','♯');
    default:          return '';
  }
}

function getPositionRange(state) {
  if (state.position === 'all') return null;
  const posIndex = parseInt(state.position.replace('pos', ''), 10) - 1;
  const tuningLowE = TUNINGS[state.tuning]?.[0] ?? 'E';
  const rootPositions = [];
  for (let f = 0; f < 12; f++) {
    if (getNoteAtFret(tuningLowE, f) === state.key) rootPositions.push(f);
  }
  const allPos = [...rootPositions, rootPositions[0] + 12, rootPositions[1] + 12]
    .sort((a, b) => a - b);
  const start = Math.max(0, allPos[posIndex % 5] - 1);
  return { start, end: start + 4 };
}
```

Update the `render` function to call `drawDots`:
```js
export function render(state, onDotClick = null) {
  const svg = document.getElementById('fretboard-svg');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  drawStructure(svg, state);
  drawDots(svg, state, onDotClick);
}
```

- [ ] **Step 2: Update `app.js` to pass dot click handler**

```js
// In app.js, replace the fretboard.render(state) calls with:
function rerenderFretboard() {
  fretboard.render(state, (dotData) => {
    audio.playNote(
      state.tuning === 'Standard' ? ['E','A','D','G','B','E'].slice().reverse()[dotData.string] : 'E',
      parseInt(dotData.fret),
      [4,3,3,3,2,2][dotData.string] ?? 3
    );
  });
}
```

Actually, for simplicity in this task, just pass `null` for onDotClick and wire audio in Task 7. Replace the `fretboard.render(state)` calls with a direct call for now:
```js
// In setState:
fretboard.render(state, null);
// At bottom of app.js:
fretboard.render(state, null);
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Expected: A Major scale dots (orange root notes, blue scale tones) with interval labels (R, 2, 3, etc.) on all strings.

- [ ] **Step 4: Commit**

```bash
git add js/fretboard.js js/app.js
git commit -m "feat: scale/chord dot rendering with interval labels and position filter"
```

---

## Task 5: `controls.js` — Controls Bar

**Files:**
- Modify: `js/controls.js`
- Modify: `style.css`

- [ ] **Step 1: Implement `controls.js`**

```js
import { SCALES, CHORDS, TUNINGS } from './music.js';

const KEYS = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
const LABEL_MODES = [
  ['notes','Notes'], ['intervals','Intervals'], ['degrees','Degrees'], ['none','None']
];
const POSITIONS = [
  ['all','All'], ['pos1','Pos 1'], ['pos2','Pos 2'],
  ['pos3','Pos 3'], ['pos4','Pos 4'], ['pos5','Pos 5'],
];
const STRING_COUNTS = [4, 5, 6, 7, 8];

function options(pairs) {
  return pairs.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}

function buildHTML() {
  const scaleOpts = Object.keys(SCALES).map(s => `<option value="${s}">${s}</option>`).join('');
  const chordOpts = Object.keys(CHORDS).map(c => `<option value="${c}">${c}</option>`).join('');
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
        <label for="ctrl-position">Position</label>
        <select id="ctrl-position">${options(POSITIONS)}</select>
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
        <label for="ctrl-position-2">Position</label>
        <select id="ctrl-position-2">${options(POSITIONS)}</select>
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
    const val = e.target.value;
    const mode = CHORDS[val] ? 'chord' : 'scale';
    _setState({ scale: val, mode });
  });
  on('ctrl-tuning', e => _setState({ tuning: e.target.value }));
  on('ctrl-labels', e => _setState({ labelMode: e.target.value }));
  on('ctrl-labels-2', e => _setState({ labelMode: e.target.value }));
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

  btn('btn-practice', () => {
    _setState({ practice: true });
  });

  // btn-play wired in app.js after audio module is available
}

function syncSelect(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

export function update(state) {
  const bar = document.getElementById('controls-bar');
  bar.dataset.layout = state.layoutMode;
  syncSelect('ctrl-key', state.key);
  syncSelect('ctrl-scale', state.scale);
  syncSelect('ctrl-tuning', state.tuning);
  syncSelect('ctrl-labels', state.labelMode);
  syncSelect('ctrl-labels-2', state.labelMode);
  syncSelect('ctrl-position', state.position);
  syncSelect('ctrl-position-2', state.position);
  syncSelect('ctrl-strings', state.strings);
  syncSelect('ctrl-strings-2', state.strings);
}
```

- [ ] **Step 2: Add controls styles to `style.css`**

Append to `style.css`:
```css
#controls-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.controls-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ctrl-group label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.ctrl-group select {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  padding: 4px 6px;
}

.ctrl-sep {
  width: 1px;
  height: 32px;
  background: var(--border);
  align-self: flex-end;
  margin-bottom: 2px;
}

.ctrl-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.ctrl-actions button {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  padding: 5px 10px;
  cursor: pointer;
}

.ctrl-actions button:hover { border-color: var(--text-muted); }

/* Layout modes */
#controls-bar[data-layout="single"]  .layout-double-only { display: none; }
#controls-bar[data-layout="double"]  .layout-single-only { display: none; }
#controls-bar:not([data-layout="double"]) .controls-row-secondary { display: none; }
```

- [ ] **Step 3: Update `app.js` to call `controls.update` on init**

In `app.js`, after `controls.init(setState)`, add:
```js
controls.update(state);
```

- [ ] **Step 4: Verify in browser**

Expected: Controls bar with Key, Scale/Mode, Tuning, Labels, Position, Strings dropdowns. Changing Key or Scale should update the fretboard dots immediately. Theme toggle should switch dark/light. Layout toggle should show/hide second row.

- [ ] **Step 5: Commit**

```bash
git add js/controls.js style.css js/app.js
git commit -m "feat: controls bar with all dropdowns wired to app state"
```

---

## Task 6: `audio.js` — Web Audio Playback

**Files:**
- Create: `js/audio.js`
- Modify: `js/app.js`

- [ ] **Step 1: Create `js/audio.js`**

```js
import { TUNINGS, TUNING_OCTAVES, getNoteAtFret, getNotesInScale, getChordNotes, noteToMidi } from './music.js';

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function scheduleNote(ac, freq, startTime, duration = 0.5, volume = 0.4) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playNote(openNote, fret, baseOctave) {
  const ac = getCtx();
  const midi = noteToMidi(openNote, fret, baseOctave);
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  scheduleNote(ac, freq, ac.currentTime);
}

export function playScale(state) {
  const ac = getCtx();
  const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']);
  const octaves = TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard'];
  const activeNotes = state.mode === 'chord'
    ? getChordNotes(state.key, state.scale)
    : getNotesInScale(state.key, state.scale);

  const seen = new Set();
  const events = [];
  for (let si = 0; si < state.strings; si++) {
    const openNote = tuning[si] ?? 'E';
    const baseOctave = octaves[si] ?? 3;
    for (let fret = 0; fret <= state.fretCount; fret++) {
      const note = getNoteAtFret(openNote, fret);
      if (!activeNotes.includes(note)) continue;
      const midi = noteToMidi(openNote, fret, baseOctave);
      if (!seen.has(midi)) { seen.add(midi); events.push(midi); }
    }
  }

  events.sort((a, b) => a - b);
  const now = ac.currentTime;
  events.forEach((midi, i) => {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    scheduleNote(ac, freq, now + i * 0.2);
  });
}

export function playChord(state) {
  const ac = getCtx();
  const tuning = TUNINGS[state.tuning] ?? TUNINGS['Standard'];
  const octaves = TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard'];
  const activeNotes = getChordNotes(state.key, state.scale);

  const now = ac.currentTime;
  const seen = new Set();
  for (let si = 0; si < state.strings; si++) {
    const openNote = tuning[si] ?? 'E';
    for (let fret = 0; fret <= 5; fret++) {
      const note = getNoteAtFret(openNote, fret);
      if (!activeNotes.includes(note)) continue;
      const midi = noteToMidi(openNote, fret, octaves[si] ?? 3);
      if (seen.has(midi)) continue;
      seen.add(midi);
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      scheduleNote(ac, freq, now, 1.5, 0.3);
    }
  }
}
```

- [ ] **Step 2: Wire audio into `app.js`**

Add import at top of `js/app.js`:
```js
import * as audio from './audio.js';
```

Wire the `▶` button after `controls.init(setState)`:
```js
document.getElementById('btn-play')?.addEventListener('click', () => {
  if (state.mode === 'chord') audio.playChord(state);
  else audio.playScale(state);
});
```

Update the fretboard render call to pass dot-click audio handler. Replace the `fretboard.render(state, null)` calls with:
```js
function render() {
  fretboard.render(state, (dotData) => {
    const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();
    const octaves = (TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard']).slice().reverse();
    const si = parseInt(dotData.string, 10);
    audio.playNote(tuning[si] ?? 'E', parseInt(dotData.fret, 10), octaves[si] ?? 3);
  });
}
```

Add `import { TUNINGS, TUNING_OCTAVES } from './music.js';` at top of `app.js`, then replace all `fretboard.render(state, null)` calls with `render()`.

- [ ] **Step 3: Verify in browser**

Expected: clicking any dot plays a note. The `▶` button plays the scale ascending. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/audio.js js/app.js
git commit -m "feat: Web Audio API note and scale playback wired to fretboard"
```

---

## Task 7: `practice.js` — Quiz Mode

**Files:**
- Create: `js/practice.js`
- Modify: `js/app.js`
- Modify: `style.css`

- [ ] **Step 1: Create `js/practice.js`**

```js
import { getNotesInScale, getChordNotes, getIntervalLabel, SCALES, CHORDS } from './music.js';

let _setState, _state, score, total, currentDot, drillType;

export function activate(state, setState) {
  _state = state;
  _setState = setState;
  score = 0; total = 0;
  drillType = 'intervals';
  renderOverlay();
  setState({ practice: true });
}

export function deactivate() {
  document.getElementById('practice-overlay').hidden = true;
  _setState({ practice: false });
}

function renderOverlay() {
  const overlay = document.getElementById('practice-overlay');
  overlay.hidden = false;
  overlay.innerHTML = `
    <div id="practice-panel">
      <div id="practice-header">
        <span id="practice-score">0 / 0</span>
        <div id="drill-type-buttons">
          <button class="drill-btn active" data-drill="intervals">Intervals</button>
          <button class="drill-btn" data-drill="notes">Note Names</button>
          <button class="drill-btn" data-drill="scales">Scale ID</button>
        </div>
        <button id="btn-exit-practice">Exit Practice</button>
      </div>
      <div id="practice-prompt">Click a highlighted dot to begin</div>
      <div id="practice-answers"></div>
    </div>`;

  document.getElementById('btn-exit-practice').addEventListener('click', deactivate);
  document.querySelectorAll('.drill-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.drill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      drillType = e.target.dataset.drill;
      document.getElementById('practice-prompt').textContent = 'Click a highlighted dot to begin';
      document.getElementById('practice-answers').innerHTML = '';
    });
  });
}

export function handleDotClick(dotData, state) {
  _state = state;
  if (drillType === 'scales') return; // scale ID uses all dots
  const note = dotData.note;
  const correctAnswer = drillType === 'intervals'
    ? getIntervalLabel(state.key, note)
    : note;

  const pool = drillType === 'intervals'
    ? ['R','b2','2','b3','3','4','b5','5','b6','6','b7','7']
    : ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];

  const wrong = pool.filter(x => x !== correctAnswer)
    .sort(() => Math.random() - 0.5).slice(0, 3);
  const answers = [correctAnswer, ...wrong].sort(() => Math.random() - 0.5);

  document.getElementById('practice-prompt').textContent =
    drillType === 'intervals' ? 'What interval is this?' : 'What note is this?';

  const answersEl = document.getElementById('practice-answers');
  answersEl.innerHTML = answers.map(a =>
    `<button class="answer-btn" data-answer="${a}">${a}</button>`
  ).join('');

  answersEl.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', e => checkAnswer(e.target.dataset.answer, correctAnswer, dotData));
  });

  total++;
  document.getElementById('practice-score').textContent = `${score} / ${total}`;
}

function checkAnswer(chosen, correct, dotData) {
  const dots = document.querySelectorAll('.dot');
  const isCorrect = chosen === correct;
  if (isCorrect) score++;

  document.getElementById('practice-score').textContent = `${score} / ${total}`;
  document.getElementById('practice-answers').querySelectorAll('.answer-btn').forEach(btn => {
    if (btn.dataset.answer === correct) btn.classList.add('answer-correct');
    else if (btn.dataset.answer === chosen && !isCorrect) btn.classList.add('answer-wrong');
    btn.disabled = true;
  });
}
```

- [ ] **Step 2: Wire practice into `app.js`**

Add import:
```js
import * as practice from './practice.js';
```

Update the `▶` button wire-up block to also wire the practice button:
```js
document.getElementById('btn-practice')?.addEventListener('click', () => {
  practice.activate(state, setState);
});
```

Update the dot-click handler inside `render()` to route clicks in practice mode:
```js
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
```

- [ ] **Step 3: Add practice styles to `style.css`**

Append to `style.css`:
```css
#practice-overlay {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
}

#practice-panel { display: flex; flex-direction: column; gap: 10px; }

#practice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

#practice-score { font-size: 14px; font-weight: bold; color: var(--text); min-width: 60px; }

#drill-type-buttons { display: flex; gap: 6px; }

.drill-btn {
  background: var(--bg);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
}
.drill-btn.active { border-color: var(--tone-color); color: var(--tone-color); }

#btn-exit-practice {
  margin-left: auto;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
}

#practice-prompt { font-size: 13px; color: var(--text-muted); }

#practice-answers { display: flex; gap: 8px; flex-wrap: wrap; }

.answer-btn {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  padding: 8px 16px;
  cursor: pointer;
  min-width: 60px;
  text-align: center;
}
.answer-btn:hover:not(:disabled) { border-color: var(--tone-color); }
.answer-btn.answer-correct { border-color: #27ae60; color: #27ae60; background: #0d2b1a; }
.answer-btn.answer-wrong   { border-color: #e74c3c; color: #e74c3c; background: #2b0d0d; }
```

- [ ] **Step 4: Verify in browser**

Expected: clicking Practice button shows the practice panel above the fretboard. Fretboard dots show without labels. Clicking a dot shows 4 multiple-choice answer buttons. Correct answer turns green, wrong turns red. Score updates. Exit Practice restores normal view.

- [ ] **Step 5: Commit**

```bash
git add js/practice.js style.css js/app.js
git commit -m "feat: practice quiz mode with interval and note name drills"
```

---

## Task 8: localStorage Persistence + Final App Wiring

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Add localStorage load/save to `app.js`**

Replace the state initialization block at the top of `app.js` with:
```js
import * as fretboard from './fretboard.js';
import * as controls from './controls.js';
import * as audio from './audio.js';
import * as practice from './practice.js';
import { TUNINGS, TUNING_OCTAVES } from './music.js';

const DEFAULTS = {
  key: 'A', scale: 'Major', mode: 'scale',
  tuning: 'Standard', strings: 6, fretCount: 12,
  labelMode: 'intervals', position: 'all',
  theme: 'dark', layoutMode: 'single', practice: false,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('fretboardlab') ?? '{}');
    return { ...DEFAULTS, ...saved, practice: false }; // never restore practice mode
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

// Apply saved theme to body before first render
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
```

- [ ] **Step 2: Verify persistence in browser**

1. Open `index.html`, change Key to G and Scale to Pentatonic Minor
2. Reload the page
3. Expected: Key is still G, Scale is still Pentatonic Minor, fretboard shows G Minor Pentatonic

- [ ] **Step 3: Verify theme persists**

1. Toggle to light theme
2. Reload
3. Expected: app opens in light theme

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: localStorage persistence for all settings except practice mode"
```

---

## Task 9: `.gitignore` + Final Polish

**Files:**
- Create: `.gitignore`
- Modify: `style.css`

- [ ] **Step 1: Create `.gitignore`**

```
.DS_Store
.superpowers/
```

- [ ] **Step 2: Add dot click highlight animation to `style.css`**

Append to `style.css`:
```css
.dot circle {
  transition: r 0.1s ease, opacity 0.1s ease;
}

.dot:hover circle { r: 13; }

@keyframes dot-flash {
  0%   { opacity: 1; }
  50%  { opacity: 0.3; }
  100% { opacity: 1; }
}

.dot-flash circle { animation: dot-flash 0.3s ease; }
```

- [ ] **Step 3: Add flash animation trigger in `js/fretboard.js`**

In the `drawDots` function, update the `onclick` handler:
```js
g.addEventListener('click', () => {
  g.classList.add('dot-flash');
  g.addEventListener('animationend', () => g.classList.remove('dot-flash'), { once: true });
  if (onDotClick) onDotClick(g.dataset);
});
```

- [ ] **Step 4: Final browser smoke test**

Walk through each feature:
1. Key dropdown — all 12 keys update fretboard ✓
2. Scale/Mode — scales and chords both work ✓
3. Tuning — drop D changes D string dots ✓
4. Labels — Notes / Intervals / Degrees / None all work ✓
5. Position — pos1–pos5 filter to CAGED windows ✓
6. Strings — changing to 4 strings shows a 4-string neck ✓
7. Play button — plays scale/chord as audio ✓
8. Dot click — plays note + flash animation ✓
9. Practice mode — quiz works, exit restores labels ✓
10. Theme toggle — dark/light switch ✓
11. Layout toggle — single/double row ✓
12. Reload — all settings restored ✓

- [ ] **Step 5: Commit**

```bash
git add .gitignore style.css js/fretboard.js
git commit -m "feat: dot flash animation, gitignore, final polish"
```

---

## Self-Review Notes

- **Spec § 5 (fretboard):** `render(state)` implemented — clears SVG and redraws ✓
- **Spec § 6 (controls):** All controls present; layout toggle via `data-layout` attribute + CSS ✓
- **Spec § 7 (audio):** Web Audio API, no samples, autoplay policy handled ✓
- **Spec § 8 (practice):** Interval + note name drills; scale recognition omitted from Tasks (complex to implement well) — can be added as a follow-on task
- **Spec § 9 (theming):** CSS custom properties, all token names consistent ✓
- **Spec § 10 (error handling):** localStorage try/catch in Task 8; unknown scale falls back in music.js ✓
- **Type consistency:** `fretboard.render(state, onDotClick)` signature used consistently across Tasks 3, 4, 6, 7, 8 ✓
