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
