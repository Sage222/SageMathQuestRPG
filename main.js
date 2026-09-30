const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const startX = player.x - Math.floor(VIEW_COLS / 2);
  const startY = player.y - Math.floor(VIEW_ROWS / 2);

  for (let row = 0; row < VIEW_ROWS; row++) {
    for (let col = 0; col < VIEW_COLS; col++) {
      const wx = startX + col, wy = startY + row;
      const tile = getTile(wx, wy);
      const px = col * TILE, py = row * TILE;

      if (tile.type === 'castle') {
        if (tile.isCastleOrigin) {
          const seed = Math.floor(hash2D(wx, wy, 4242) * 1000);
          const sprite = pickVariant('castle', seed);
          if (sprite) {
            ctx.drawImage(sprite, px, py, TILE * 2, TILE * 2);
          } else {
            ctx.fillStyle = TILE_COLORS.castle;
            ctx.fillRect(px, py, TILE * 2, TILE * 2);
          }
        }
        continue;
      }

      const seed = Math.floor(hash2D(wx, wy, 4242) * 1000);
      const sprite = pickVariant(tile.type, seed);
      if (sprite) {
        ctx.drawImage(sprite, px, py, TILE, TILE);
      } else {
        ctx.fillStyle = TILE_COLORS[tile.type] || '#000';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
  }

  for (const npc of visibleNpcs(startX, startY)) {
    drawEntity(npc.x - startX, npc.y - startY, npc.sprite || 'npc', npc.variantSeed || 0);
  }
  for (const e of enemies) {
    drawEntity(e.x - startX, e.y - startY, e.sprite || 'enemy', e.variantSeed || 0);
  }
  drawEntity(Math.floor(VIEW_COLS / 2), Math.floor(VIEW_ROWS / 2), player.inBoat ? 'boat' : 'player', player.variantSeed || 0);

  updateHud();
}

function drawEntity(col, row, type, seed) {
  if (col < 0 || row < 0 || col >= VIEW_COLS || row >= VIEW_ROWS) return;
  const px = col * TILE, py = row * TILE;
  const sprite = pickVariant(type, seed);
  if (sprite) {
    ctx.drawImage(sprite, px, py, TILE, TILE);
  } else {
    ctx.fillStyle = SPRITE_FALLBACK[type] || '#ffffff';
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
  }
}

function updateHud() {
  document.getElementById('hud-hp').textContent = player.hp;
  document.getElementById('hud-maxhp').textContent = player.maxHp;
  document.getElementById('hud-xp').textContent = player.xp;
  document.getElementById('hud-gold').textContent = player.gold;
  document.getElementById('hud-steps').textContent = player.steps;
  document.getElementById('hud-slain').textContent = player.enemiesSlain;
  document.getElementById('hud-level').textContent = player.level;
  document.getElementById('hud-streak').textContent = player.correctStreak;
}

function onPlayerMoved() {
  refreshEnemies();
  stepEnemies();
  trySpawnRandomEncounter();
  refreshWanderers();
  stepWanderers();
  drawMinimap();
}

document.addEventListener('keydown', e => {
  if (!gameStarted) return;
  if (dialogueOpen) {
    if (e.key === 'Enter' || e.key === ' ') closeDialogue();
    return;
  }
  if (inBattle) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') tryMove(-1, 0);
  else if (e.key === 'ArrowRight' || e.key === 'd') tryMove(1, 0);
  else if (e.key === 'ArrowUp' || e.key === 'w') tryMove(0, -1);
  else if (e.key === 'ArrowDown' || e.key === 's') tryMove(0, 1);
});

refreshEnemies();
refreshWanderers();
drawMinimap();

function loop() {
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
