# Fretboard Lab — Design Spec
**Date:** 2026-05-22  
**Stack:** Plain HTML / CSS / ES Modules (no build step)  
**Scope:** Full client-side app with localStorage persistence

---

## 1. Overview

A guitar practice web app that visualizes scales, modes, chords, and interval patterns on an interactive SVG fretboard. Modeled after Jon Bjork's Fretboard Lab. Runs entirely in the browser — no server, no build toolchain.

---

## 2. File Structure

```
fretboardlab/
├── index.html          # Shell: layout markup, controls bar, SVG container
├── style.css           # Layout, CSS custom properties for theming
├── js/
│   ├── music.js        # Pure theory — no DOM (notes, scales, chords, intervals)
│   ├── fretboard.js    # SVG renderer — draws neck, strings, fret dots
│   ├── controls.js     # UI wiring — dropdowns, toggles, keyboard shortcuts
│   ├── audio.js        # Web Audio API — note, scale, chord playback
│   ├── practice.js     # Quiz/practice overlay mode
│   └── app.js          # Entry point — imports all modules, owns app state
└── docs/
    └── superpowers/specs/
        └── 2026-05-22-fretboardlab-design.md
```

`index.html` loads `app.js` as `<script type="module">`. No bundler required.

---

## 3. App State

A single plain object owned by `app.js`. Every control change updates state and triggers a re-render.

```js
const state = {
  key:        'A',           // root note
  scale:      'Major',       // scale or chord name
  mode:       'scale',       // 'scale' | 'chord'
  tuning:     'Standard',    // named tuning key or 'Custom'
  strings:    6,             // number of strings (default 6, supports n)
  fretCount:  12,            // number of frets to display
  labelMode:  'intervals',   // 'notes' | 'intervals' | 'degrees' | 'none'
  position:   'all',         // 'all' | 'pos1'–'pos5' (CAGED positions)
  theme:      'dark',        // 'dark' | 'light'
  layoutMode: 'single',      // 'single' | 'double' (controls bar layout)
  practice:   false,         // practice mode active
};
```

**Persistence:** On every state change, `localStorage.setItem('fretboardlab', JSON.stringify(state))`. On load, merge saved state with defaults so new keys added in future versions always fall back gracefully.

Practice mode (`state.practice`) is intentionally not persisted — always starts fresh.

---

## 4. Music Theory (`music.js`)

Pure functions, no DOM, no side effects.

### Notes
```js
const NOTES = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
```
All enharmonic handling (F# = Gb) resolved here.

### Scales & Modes
Interval arrays (semitone offsets from root):
```js
const SCALES = {
  'Major':              [0,2,4,5,7,9,11],
  'Natural Minor':      [0,2,3,5,7,8,10],
  'Harmonic Minor':     [0,2,3,5,7,8,11],
  'Pentatonic Major':   [0,2,4,7,9],
  'Pentatonic Minor':   [0,3,5,7,10],
  'Blues':              [0,3,5,6,7,10],
  'Dorian':             [0,2,3,5,7,9,10],
  'Phrygian':           [0,1,3,5,7,8,10],
  'Lydian':             [0,2,4,6,7,9,11],
  'Mixolydian':         [0,2,4,5,7,9,10],
  'Locrian':            [0,1,3,5,6,8,10],
  'Whole Tone':         [0,2,4,6,8,10],
  'Diminished':         [0,2,3,5,6,8,9,11],
};
```

### Chords
Same interval-array pattern:
```js
const CHORDS = {
  'Major':   [0,4,7],
  'Minor':   [0,3,7],
  'Dom 7':   [0,4,7,10],
  'Maj 7':   [0,4,7,11],
  'Min 7':   [0,3,7,10],
  'Dim':     [0,3,6],
  'Aug':     [0,4,8],
  'Sus2':    [0,2,7],
  'Sus4':    [0,5,7],
};
```

### Tunings
```js
const TUNINGS = {
  'Standard':        ['E','A','D','G','B','E'],
  'Drop D':          ['D','A','D','G','B','E'],
  'Open G':          ['D','G','D','G','B','D'],
  'DADGAD':          ['D','A','D','G','A','D'],
  'Open E':          ['E','B','E','G#','B','E'],
  'Half Step Down':  ['Eb','Ab','Db','Gb','Bb','Eb'],
  'Open D':          ['D','A','D','F#','A','D'],
};
```
Custom tuning: user-editable array stored directly in state. Changing tuning recomputes the entire fretboard.

### Key Functions
- `getNotesInScale(root, scaleName)` → `string[]` — notes in the scale
- `getChordNotes(root, chordName)` → `string[]` — notes in the chord
- `getNoteAtFret(openNote, fret)` → `string` — note name at position
- `getIntervalLabel(root, note)` → `string` — e.g. `'R'`, `'b3'`, `'5'`
- `buildFretboard(tuning, fretCount)` → `string[][]` — `[string][fret]` 2D array of note names
- `noteToMidi(note, octave)` → `number` — MIDI number for audio playback

---

## 5. Fretboard SVG Renderer (`fretboard.js`)

### Layout
- SVG with `viewBox="0 0 700 230"` and `width: 100%` — fully responsive
- Fretboard rect from nut to last fret
- **String order:** High E at top → Low E at bottom
- **String spacing:** Equal divisions — `(fretboardHeight - padding*2) / (stringCount - 1)`
- **String weight:** Interpolated from 0.8px (string index 0, high E) to 2.5px (string index n-1, low E) — works for any string count
- **Fret spacing:** Equal — `(fretboardWidth - nutWidth) / fretCount`
- **Nut:** Thick rect at left edge, cream/bone color
- **Position inlays:** Dots at frets 3, 5, 7, 9; double dot at 12 — rendered behind strings

### Dots
Each active note renders as `<circle>` + `<text>` centered inside:
- **Root:** Orange (`--root-color`)
- **Scale/chord tones:** Blue (`--tone-color`)
- **Label content:** Controlled by `state.labelMode` — note name, interval, degree, or empty circle

### Interactivity
- Each dot group has `onclick` → `audio.playNote(note, octave)` + brief CSS highlight animation
- Dot click in practice mode → fires quiz answer evaluation instead

### `render(state)` API
Single function — `fretboard.render(state)` — clears and redraws the entire SVG from current state. Called on every state change.

---

## 6. Controls Bar (`controls.js`)

Sits above the fretboard. Layout controlled by `state.layoutMode`.

### Single Row (default)
All controls in one horizontal strip with dividers:
`Key | Scale/Mode | Tuning | Labels | Position | Strings` + `Practice` and `☀/☾` buttons at right.

### Two Row
- Row 1 (primary): Key, Scale/Mode, Tuning + theme toggle
- Row 2 (secondary): Labels, Position, Strings + Practice button

### Layout toggle
A small icon button (⊞) in the controls bar switches `layoutMode` between `'single'` and `'double'`.

### Controls
| Control | Type | Options |
|---|---|---|
| Key | `<select>` | All 12 chromatic notes (A–G#) |
| Scale/Mode | `<select>` | Scales group + Chords group (grouped `<optgroup>`s) — selecting a chord name automatically sets `state.mode = 'chord'`; selecting a scale sets `state.mode = 'scale'` |
| Tuning | `<select>` | Named tunings + Custom |
| Labels | `<select>` | Notes, Intervals, Degrees, None |
| Position | `<select>` | All, Position 1–5 (CAGED) |
| Strings | `<select>` | 4, 5, 6, 7, 8 |
| Practice | `<button>` | Toggles practice mode |
| Theme | `<button>` | Toggles dark/light |
| Layout | `<button>` | Toggles single/double row |

All controls fire `app.setState(patch)` which merges the change, persists to localStorage, and calls `fretboard.render(state)`.

---

## 7. Audio (`audio.js`)

Uses **Web Audio API** — no external libraries, no audio files.

- `AudioContext` created on first user interaction (satisfies browser autoplay policy)
- **Single note:** `OscillatorNode` (sine) + `GainNode` — attack 5ms, decay 300ms, release to silence
- **Frequency:** `440 * Math.pow(2, (midi - 69) / 12)`
- **Scale playback:** Notes played sequentially, 200ms apart, ascending
- **Chord playback:** All notes played simultaneously with same envelope
- **Octave awareness:** Derived from string + fret position via `music.noteToMidi(note, octave)`

---

## 8. Practice Mode (`practice.js`)

Activated by the Practice button — overlays on existing fretboard, no page navigation.

**On activate:**
- `state.practice = true` → `fretboard.js` renders dots as unlabeled circles
- Drill type selector appears (Interval, Note Name, Scale Recognition)
- Score counter shown in controls bar: `X / Y correct`

**Quiz loop:**
1. Random dot on fretboard pulses/highlights
2. Four answer buttons appear (multiple choice) — one correct, three plausible wrong answers
3. User selects answer:
   - Correct → dot flashes green, score increments, next dot after 800ms
   - Wrong → dot flashes red, correct answer highlighted, next dot after 1200ms
4. Loop continues until user exits

**Drill types:**
- **Interval drill:** Identify interval label (R, 2, b3, 4, 5, b6, 7…)
- **Note name drill:** Identify note name (A, C#, Gb…)
- **Scale recognition:** All dots for a random scale are shown as unlabeled circles; user names the scale from four choices

**On deactivate:** Labels restored, score resets, normal interaction resumes.

---

## 9. Theming

CSS custom properties on `<body>`:

```css
body.theme-dark {
  --bg:             #0d0d0d;
  --surface:        #161616;
  --border:         #2a2a2a;
  --fretboard-bg:   #1a1008;
  --nut-color:      #c8b88a;
  --string-color:   #bbbbbb;
  --fret-color:     #3a3020;
  --root-color:     #e67e22;
  --tone-color:     #3498db;
  --text:           #dddddd;
  --text-muted:     #555555;
}

body.theme-light {
  --bg:             #f5f0e8;
  --surface:        #e8e0d0;
  --border:         #bbbbbb;
  --fretboard-bg:   #d4c9a8;
  --nut-color:      #5a4a30;
  --string-color:   #555555;
  --fret-color:     #b8aa88;
  --root-color:     #c0392b;
  --tone-color:     #2980b9;
  --text:           #222222;
  --text-muted:     #888888;
}
```

Theme toggle swaps the class on `<body>` and saves to localStorage.

---

## 10. Error Handling & Edge Cases

- **Custom tuning with fewer/more strings than `state.strings`:** Tuning array length always matches `state.strings`; mismatches padded with `'E'` or truncated on the fly
- **Unknown scale/chord name:** Falls back to Major scale silently
- **localStorage unavailable:** App works without persistence; no crash
- **AudioContext blocked:** Note playback silently skipped if context can't start; no error shown

---

## 11. Success Criteria

- Fretboard renders correctly for any key + scale/chord combination
- Changing tuning immediately updates all note positions on the fretboard
- All 8 features (fretboard, scales, chords, intervals, tuning, positions, practice, audio) functional
- Both themes render cleanly; toggle persists across sessions
- App loads and runs with zero network requests beyond the initial HTML/CSS/JS files
- No external dependencies
