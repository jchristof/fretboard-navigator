import { getIntervalLabel } from './music.js';

let _setState, _state, score, total, drillType;

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
  if (drillType === 'scales') return;
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
    btn.addEventListener('click', e => checkAnswer(e.target.dataset.answer, correctAnswer));
  });

  total++;
  document.getElementById('practice-score').textContent = `${score} / ${total}`;
}

function checkAnswer(chosen, correct) {
  const isCorrect = chosen === correct;
  if (isCorrect) score++;

  document.getElementById('practice-score').textContent = `${score} / ${total}`;
  document.getElementById('practice-answers').querySelectorAll('.answer-btn').forEach(btn => {
    if (btn.dataset.answer === correct) btn.classList.add('answer-correct');
    else if (btn.dataset.answer === chosen && !isCorrect) btn.classList.add('answer-wrong');
    btn.disabled = true;
  });
}
