import {
  TUNINGS, TUNING_OCTAVES,
  getNoteAtFret, getNotesInScale, getChordNotes, noteToMidi,
} from './music.js';

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
