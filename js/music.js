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
