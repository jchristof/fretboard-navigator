import {
  NOTES, SCALES, CHORDS, TUNINGS, TUNING_OCTAVES,
  getNoteAtFret, getNotesInScale, getChordNotes, getIntervalLabel, noteToMidi,
  normalize,
} from './music.js';

const SVG_W = 700, SVG_H = 230;
const NUT_X = 36, NUT_W = 6;
const OPEN_X = 18;
const FB_TOP = 10, FB_H = 180;
const STRING_PAD = 20;
const FRET_NUM_Y = SVG_H - 8;

const INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAY_FRETS = new Set([12, 24]);

function ns(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function fretLineX(fret, fretW) {
  return NUT_X + NUT_W + fret * fretW;
}

function dotX(fret, fretW) {
  if (fret === 0) return OPEN_X;
  return fretLineX(fret, fretW) - fretW / 2;
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

  svg.appendChild(ns('rect', {
    x: NUT_X, y: FB_TOP, width: SVG_W - NUT_X - 10, height: FB_H,
    rx: 4, fill: cssVar('--fretboard-bg'),
  }));

  svg.appendChild(ns('rect', {
    x: NUT_X, y: FB_TOP, width: NUT_W, height: FB_H,
    fill: cssVar('--nut-color'),
  }));

  for (let f = 1; f <= fretCount; f++) {
    const x = fretLineX(f, fretW);
    svg.appendChild(ns('line', {
      x1: x, y1: FB_TOP, x2: x, y2: FB_TOP + FB_H,
      stroke: cssVar('--fret-color'), 'stroke-width': 2,
    }));
  }

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

  const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();

  for (let i = 0; i < stringCount; i++) {
    const y = stringY(i, stringCount);
    svg.appendChild(ns('line', {
      x1: NUT_X, y1: y, x2: SVG_W - 10, y2: y,
      stroke: cssVar('--string-color'),
      'stroke-width': stringWeight(i, stringCount),
    }));
    const label = ns('text', {
      x: OPEN_X, y: y + 3,
      fill: cssVar('--text-muted'),
      'font-size': 10, 'text-anchor': 'middle',
    });
    label.textContent = tuning[i] ?? '';
    svg.appendChild(label);
  }

  for (let f = 0; f <= fretCount; f++) {
    const x = f === 0
      ? OPEN_X
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

function drawDots(svg, state, onDotClick) {
  const { strings: stringCount, fretCount, key, scale, mode, labelMode } = state;
  const fretAreaW = SVG_W - NUT_X - NUT_W - 10;
  const fretW = fretAreaW / fretCount;

  const tuning = (TUNINGS[state.tuning] ?? TUNINGS['Standard']).slice().reverse();
  const octaves = (TUNING_OCTAVES[state.tuning] ?? TUNING_OCTAVES['Standard']).slice().reverse();
  const activeNotes = mode === 'chord'
    ? getChordNotes(key, scale)
    : getNotesInScale(key, scale);

  let stringDots;
  if (state.pattern === '3nps') {
    stringDots = compute3NPSDots(state, activeNotes, tuning, octaves);
  } else if (state.pattern === 'box') {
    const fretRange = getPositionRange(state);
    stringDots = computeWindowDots(state, activeNotes, tuning, octaves, fretRange);
    if (fretRange) applyBoxDedup(stringDots);
  } else {
    stringDots = computeWindowDots(state, activeNotes, tuning, octaves, null);
  }

  for (const dots of stringDots) {
    for (const d of dots) {
      const x = dotX(d.fret, fretW);
      const isRoot = d.note === key;

      const g = ns('g', { class: 'dot', style: 'cursor:pointer' });
      g.appendChild(ns('circle', {
        cx: x, cy: d.y, r: 11,
        fill: isRoot ? cssVar('--root-color') : cssVar('--tone-color'),
      }));

      if (!state.practice) {
        const labelText = getDotLabel(key, d.note, labelMode);
        const t = ns('text', {
          x, y: d.y + 3.5,
          fill: '#fff',
          'font-size': 8,
          'text-anchor': 'middle',
          'font-weight': isRoot ? 'bold' : 'normal',
          'pointer-events': 'none',
        });
        t.textContent = labelText;
        g.appendChild(t);
      }

      g.dataset.midi = d.midi;
      g.dataset.note = d.note;
      g.dataset.fret = d.fret;
      g.dataset.string = d.si;
      g.addEventListener('click', () => {
        g.classList.add('dot-flash');
        g.addEventListener('animationend', () => g.classList.remove('dot-flash'), { once: true });
        if (onDotClick) onDotClick(g.dataset);
      });
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

function getPositionAnchor(state) {
  const posStr = state.position ?? '';
  const posIndex = parseInt(posStr.replace('pos', ''), 10) - 1;
  if (Number.isNaN(posIndex) || posIndex < 0) return null;

  const intervals = state.mode === 'chord'
    ? (CHORDS[state.scale] ?? CHORDS['Major'])
    : (SCALES[state.scale] ?? SCALES['Major']);

  const degreeIdx = posIndex % intervals.length;
  const cycleNum  = Math.floor(posIndex / intervals.length);

  const tuningLowestStr = TUNINGS[state.tuning]?.[0] ?? 'E';
  const rootIdx = NOTES.indexOf(normalize(state.key));
  const degreeNote = NOTES[(rootIdx + intervals[degreeIdx]) % 12];

  let found = 0;
  for (let f = 0; f <= state.fretCount; f++) {
    if (getNoteAtFret(tuningLowestStr, f) === degreeNote) {
      if (found === cycleNum) return f;
      found++;
    }
  }
  return null;
}

function getPositionRange(state) {
  const anchor = getPositionAnchor(state);
  if (anchor === null) return null;
  return { start: anchor, end: Math.min(state.fretCount, anchor + 4) };
}

function computeWindowDots(state, activeNotes, tuning, octaves, fretRange) {
  const stringDots = [];
  for (let si = 0; si < state.strings; si++) {
    const openNote = tuning[si] ?? 'E';
    const baseOctave = octaves[si] ?? 3;
    const y = stringY(si, state.strings);
    const dots = [];
    for (let fret = 0; fret <= state.fretCount; fret++) {
      if (fretRange && (fret < fretRange.start || fret > fretRange.end)) continue;
      const note = getNoteAtFret(openNote, fret);
      if (!activeNotes.includes(note)) continue;
      const midi = noteToMidi(openNote, fret, baseOctave);
      dots.push({ fret, note, midi, si, y });
    }
    stringDots.push(dots);
  }
  return stringDots;
}

function applyBoxDedup(stringDots) {
  for (let si = 1; si < stringDots.length; si++) {
    const lower = stringDots[si];
    const upper = stringDots[si - 1];
    if (!lower.length || !upper.length) continue;
    if (lower[lower.length - 1].midi === upper[0].midi) lower.pop();
  }
}

// 3-notes-per-string: anchor on the position's degree on the lowest string,
// then each subsequent (higher-pitch) string takes the next 3 ascending scale
// tones strictly above the previous string's last note.
function compute3NPSDots(state, activeNotes, tuning, octaves) {
  const anchor = getPositionAnchor(state);
  const stringCount = state.strings;
  const empty = Array.from({ length: stringCount }, () => []);
  if (anchor === null) return empty;

  const lowSi = stringCount - 1;
  const lowOpen = tuning[lowSi] ?? 'E';
  const lowBaseOct = octaves[lowSi] ?? 2;
  let minMidi = noteToMidi(lowOpen, anchor, lowBaseOct);

  const stringDots = Array.from({ length: stringCount }, () => []);
  for (let si = stringCount - 1; si >= 0; si--) {
    const openNote = tuning[si] ?? 'E';
    const baseOct = octaves[si] ?? 3;
    const y = stringY(si, stringCount);
    const picked = [];
    for (let fret = 0; fret <= state.fretCount && picked.length < 3; fret++) {
      const note = getNoteAtFret(openNote, fret);
      if (!activeNotes.includes(note)) continue;
      const midi = noteToMidi(openNote, fret, baseOct);
      if (midi < minMidi) continue;
      picked.push({ fret, note, midi, si, y });
    }
    stringDots[si] = picked;
    if (picked.length > 0) minMidi = picked[picked.length - 1].midi + 1;
  }
  return stringDots;
}

export function render(state, onDotClick = null) {
  const svg = document.getElementById('fretboard-svg');
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  drawStructure(svg, state);
  drawDots(svg, state, onDotClick);
}
