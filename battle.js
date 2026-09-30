let inBattle = false;
let battleEnemyRef = null;
let battleEnemyHp, battleEnemyMaxHp, currentAnswer, currentSpread, timeLimit, timerHandle, timeLeft;
let battleEnemyName = 'the monster';

const battleOverlay = document.getElementById('battle-overlay');
const narrationEl = document.getElementById('narration');
const questionEl = document.getElementById('question');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const timerFill = document.getElementById('timer-fill');
const enemyHpFill = document.getElementById('hp-enemy-fill');
const playerHpFill = document.getElementById('hp-player-fill');

const MONSTER_NAMES = [
  'a slimy Goblin', 'a grumpy Troll', 'a sneaky Imp', 'a fierce Wolf',
  'a spooky Ghost', 'a clumsy Ogre', 'a cranky Skeleton', 'a wobbly Slime'
];
const SEA_NAMES = [
  'a hungry Sea Serpent', 'a grumpy Kraken', 'a slippery Eel Beast', 'a splashy Sharkling'
];

const ATTACK_LINES = [
  '{e} snarls and lunges straight at you!',
  '{e} charges up for a big attack!',
  '{e} raises its claws high, ready to strike!',
  '{e} lets out a battle cry and stomps closer!',
  '{e} grins and prepares a sneaky move!',
  '{e} shakes the ground as it stomps forward!',
];

const CORRECT_LINES = [
  'Your math blast hits {e} right on the nose! It yelps!',
  '{e} trips over its own feet dodging your answer!',
  'BOOM! Your correct answer sends {e} flying backward!',
  '{e} looks very confused as numbers swirl around its head!',
  'Nice work! {e} does a wobbly dance of pain!',
  'Your number-power singes {e}\'s eyebrows clean off!',
];

const WRONG_LINES = [
  'Oops! {e} swats you while you were still counting on your fingers!',
  '{e} sneaks in a cheeky whack while you hesitate!',
  'You slip on a banana peel dropped by {e}! Ouch!',
  '{e} laughs and bonks you right on the head!',
  'Your answer fizzles out, and {e} takes a free shot!',
];

const TIMEOUT_LINES = [
  'Time\'s up! {e} sneaks past your guard while you were thinking!',
  'You took too long, and {e} lands a sneaky hit!',
  '{e} yawns, then hits you anyway while you were still working it out!',
];

function pickLine(lines, enemyName) {
  const line = lines[Math.floor(Math.random() * lines.length)];
  return line.replace('{e}', enemyName);
}

function startBattle(enemyRef) {
  inBattle = true;
  battleEnemyRef = enemyRef;
  if (enemyRef.guardian) {
    battleEnemyHp = 45;
    battleEnemyMaxHp = 45;
    battleEnemyName = 'the Cave Guardian';
  } else {
    battleEnemyHp = 30;
    battleEnemyMaxHp = 30;
    battleEnemyName = pickOne(enemyRef.domain === 'sea' ? SEA_NAMES : MONSTER_NAMES);
  }
  battleOverlay.style.display = 'flex';
  updateBattleBars();
  nextQuestion();
}

function updateBattleBars() {
  enemyHpFill.style.width = Math.max(0, (battleEnemyHp / battleEnemyMaxHp) * 100) + '%';
  playerHpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
}

// Level raises the effective grade by one tier every 2 levels (max Age 14 tier).
function getEffectiveGrade() {
  const bump = Math.floor((player.level - 1) / 2);
  return Math.min(14, mathGrade + bump);
}

function genGrade10() {
  const type = pickOne(['add', 'sub', 'mul']);
  if (type === 'add') {
    const a = randInt(10, 50), b = randInt(10, 40);
    return { text: `${a} + ${b} = ?`, answer: a + b, spread: 10 };
  }
  if (type === 'sub') {
    const a = randInt(20, 60), b = randInt(5, a - 1);
    return { text: `${a} - ${b} = ?`, answer: a - b, spread: 10 };
  }
  const a = randInt(2, 10), b = randInt(2, 10);
  return { text: `${a} x ${b} = ?`, answer: a * b, spread: 10 };
}

function genGrade11() {
  const type = pickOne(['add', 'sub', 'mul', 'div']);
  if (type === 'add') {
    const a = randInt(50, 200), b = randInt(20, 150);
    return { text: `${a} + ${b} = ?`, answer: a + b, spread: 15 };
  }
  if (type === 'sub') {
    const a = randInt(100, 300), b = randInt(20, a - 1);
    return { text: `${a} - ${b} = ?`, answer: a - b, spread: 15 };
  }
  if (type === 'mul') {
    const a = randInt(2, 12), b = randInt(2, 12);
    return { text: `${a} x ${b} = ?`, answer: a * b, spread: 12 };
  }
  const b = randInt(2, 12), q = randInt(2, 12), a = b * q;
  return { text: `${a} \u00F7 ${b} = ?`, answer: q, spread: 6 };
}

function genGrade12() {
  const type = pickOne(['mul2', 'div', 'square', 'addsub']);
  if (type === 'mul2') {
    const a = randInt(11, 20), b = randInt(2, 9);
    return { text: `${a} x ${b} = ?`, answer: a * b, spread: 20 };
  }
  if (type === 'div') {
    const divisor = randInt(2, 12), quotient = randInt(5, 20), dividend = divisor * quotient;
    return { text: `${dividend} \u00F7 ${divisor} = ?`, answer: quotient, spread: 8 };
  }
  if (type === 'square') {
    const n = randInt(2, 12);
    return { text: `${n} squared = ?`, answer: n * n, spread: 20 };
  }
  const a = randInt(100, 500), b = randInt(50, 300);
  const isAdd = Math.random() < 0.5;
  return isAdd
    ? { text: `${a} + ${b} = ?`, answer: a + b, spread: 25 }
    : { text: `${a} - ${b} = ?`, answer: a - b, spread: 25 };
}

function genGrade13() {
  const type = pickOne(['order', 'percent', 'equation']);
  if (type === 'order') {
    const a = randInt(2, 10), b = randInt(2, 10), c = randInt(2, 10);
    return { text: `${a} + ${b} x ${c} = ?`, answer: a + b * c, spread: 15 };
  }
  if (type === 'percent') {
    const p = pickOne([10, 20, 25, 50, 75]);
    const base = randInt(2, 20) * 4;
    return { text: `${p}% of ${base} = ?`, answer: (p / 100) * base, spread: 10 };
  }
  const x = randInt(2, 20), b = randInt(1, 20);
  return { text: `x + ${b} = ${x + b}, what is x?`, answer: x, spread: 6 };
}

function genGrade14() {
  const type = pickOne(['twostep', 'exponent', 'negative']);
  if (type === 'twostep') {
    const x = randInt(2, 15), a = randInt(2, 5), b = randInt(1, 20);
    return { text: `${a}x + ${b} = ${a * x + b}, what is x?`, answer: x, spread: 6 };
  }
  if (type === 'exponent') {
    const base = randInt(2, 5), exp = randInt(2, 3);
    return { text: `${base} to the power of ${exp} = ?`, answer: Math.pow(base, exp), spread: 15 };
  }
  const a = randInt(-20, -1), b = randInt(1, 20);
  return { text: `${a} + ${b} = ?`, answer: a + b, spread: 12 };
}

function generateQuestion() {
  switch (getEffectiveGrade()) {
    case 11: return genGrade11();
    case 12: return genGrade12();
    case 13: return genGrade13();
    case 14: return genGrade14();
    default: return genGrade10();
  }
}

function nextQuestion() {
  clearInterval(timerHandle);
  feedbackEl.textContent = '';
  narrationEl.textContent = pickLine(ATTACK_LINES, battleEnemyName);

  const q = generateQuestion();
  currentAnswer = q.answer;
  currentSpread = q.spread || 10;
  questionEl.textContent = q.text;

  const choices = new Set([q.answer]);
  let guardCount = 0;
  while (choices.size < 5 && guardCount < 50) {
    const offset = randInt(-currentSpread, currentSpread);
    const wrong = q.answer + (offset === 0 ? Math.ceil(currentSpread / 3) : offset);
    if (wrong !== q.answer) choices.add(wrong);
    guardCount++;
  }
  const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
  choicesEl.innerHTML = '';
  shuffled.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = val;
    btn.onclick = () => submitAnswer(val);
    choicesEl.appendChild(btn);
  });

  timeLimit = 8;
  timeLeft = timeLimit;
  timerFill.style.width = '100%';
  timerHandle = setInterval(() => {
    timeLeft -= 0.1;
    timerFill.style.width = Math.max(0, (timeLeft / timeLimit) * 100) + '%';
    if (timeLeft <= 0) {
      clearInterval(timerHandle);
      submitAnswer(null);
    }
  }, 100);
}

function submitAnswer(value) {
  clearInterval(timerHandle);
  const correct = value === currentAnswer;
  const fast = timeLeft > timeLimit * 0.5;
  let leveledUp = false;

  if (correct) {
    const damage = fast ? 12 : 7;
    battleEnemyHp -= damage;
    player.correctStreak++;
    const line = pickLine(CORRECT_LINES, battleEnemyName);
    feedbackEl.textContent = `${fast ? 'Critical hit' : 'Hit'} for ${damage}! ${line}`;

    if (player.correctStreak >= 10) {
      player.level++;
      player.correctStreak = 0;
      player.maxHp += 4;
      player.hp = player.maxHp;
      leveledUp = true;
    }
  } else {
    const damage = 4;
    player.hp -= damage;
    player.correctStreak = 0;
    const line = value === null
      ? pickLine(TIMEOUT_LINES, battleEnemyName)
      : pickLine(WRONG_LINES, battleEnemyName);
    feedbackEl.textContent = `You take ${damage} damage. ${line}`;
  }
  updateBattleBars();

  if (leveledUp) {
    narrationEl.textContent = `LEVEL UP! You are now Level ${player.level}! Max HP increased and the riddles get tougher!`;
  }

  if (battleEnemyHp <= 0) endBattle(true);
  else if (player.hp <= 0) endBattle(false);
  else setTimeout(nextQuestion, leveledUp ? 3200 : 2600);
}

function endBattle(won) {
  battleOverlay.style.display = 'none';
  if (won) {
    enemies = enemies.filter(e => e !== battleEnemyRef);
    player.enemiesSlain++;
    const xpGain = randInt(10, 20);
    let goldGain = randInt(5, 15);
    let lootText = '';
    if (battleEnemyRef && battleEnemyRef.guardian) {
      const bonus = randInt(30, 60);
      goldGain += bonus;
      clearedCaves.add(battleEnemyRef.caveKey);
      lootText = ' (cave treasure!)';
    }
    player.xp += xpGain;
    player.gold += goldGain;
    document.getElementById('loot-text').textContent = `+${xpGain} XP, +${goldGain} Gold${lootText}`;
    document.getElementById('victory-banner').style.display = 'flex';
    setTimeout(() => {
      document.getElementById('victory-banner').style.display = 'none';
      inBattle = false;
      drawMinimap();
    }, 1800);
  } else {
    document.getElementById('game-over').style.display = 'flex';
  }
}

function restartGame() {
  player.hp = player.maxHp;
  player.x = SPAWN_X;
  player.y = SPAWN_Y;
  player.inBoat = false;
  document.getElementById('game-over').style.display = 'none';
  inBattle = false;
  refreshEnemies();
  drawMinimap();
}
