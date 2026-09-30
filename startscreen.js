let gameStarted = false;
let mathGrade = 10;

const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('hud');
const minimapEl = document.getElementById('minimap');
const pressStart = document.getElementById('press-start');
const gradeButtons = document.querySelectorAll('.grade-btn');

gradeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    mathGrade = parseInt(btn.dataset.age, 10);
    gradeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

const defaultGradeBtn = document.querySelector('.grade-btn[data-age="10"]');
if (defaultGradeBtn) defaultGradeBtn.classList.add('selected');

function beginGame() {
  if (gameStarted) return;
  gameStarted = true;
  startScreen.style.display = 'none';
  hud.style.display = 'block';
  minimapEl.style.display = 'block';
  drawMinimap();
}

pressStart.addEventListener('click', beginGame);

document.addEventListener('keydown', e => {
  if (!gameStarted && (e.key === 'Enter' || e.key === ' ')) {
    beginGame();
  }
});
