let dialogueOpen = false;
let wanderers = [];
const WANDERER_ACTIVE_RADIUS = 20;
let lastWandererChunkKey = null;

function findNpcAt(x, y) {
  const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const f = getChunkFeatures(cx + dx, cy + dy);
      for (const n of f.npcs) if (n.x === x && n.y === y) return n;
    }
  }
  return wanderers.find(w => w.x === x && w.y === y) || null;
}

function visibleNpcs(startX, startY) {
  const list = [];
  const cx0 = Math.floor(startX / CHUNK_SIZE), cy0 = Math.floor(startY / CHUNK_SIZE);
  for (let dx = -1; dx <= 2; dx++) {
    for (let dy = -1; dy <= 2; dy++) {
      const f = getChunkFeatures(cx0 + dx, cy0 + dy);
      for (const n of f.npcs) list.push(n);
    }
  }
  for (const w of wanderers) list.push(w);
  return list;
}

function refreshWanderers() {
  const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
  const key = cx + ',' + cy;
  if (key === lastWandererChunkKey) return;
  lastWandererChunkKey = key;

  wanderers = wanderers.filter(w =>
    Math.abs(w.x - player.x) < WANDERER_ACTIVE_RADIUS && Math.abs(w.y - player.y) < WANDERER_ACTIVE_RADIUS
  );

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const f = getChunkFeatures(cx + dx, cy + dy);
      for (const w of f.wanderers.concat(f.boats)) {
        if (!wanderers.some(o => o.spawnX === w.x && o.spawnY === w.y)) {
          wanderers.push({
            x: w.x, y: w.y, spawnX: w.x, spawnY: w.y,
            domain: w.domain, sprite: w.sprite, line: w.line, heal: false,
            variantSeed: Math.floor(hash2D(w.x, w.y, 999) * 1000)
          });
        }
      }
    }
  }
}

function wandererCanEnter(w, tile) {
  if (w.domain === 'sea') return tile.sailable;
  return tile.walkable && tile.type !== 'cave';
}

function stepWanderers() {
  for (const w of wanderers) {
    if (Math.random() < 0.5) continue;
    const dx = pickOne([-1, 0, 1]), dy = pickOne([-1, 0, 1]);
    if (dx === 0 && dy === 0) continue;
    const nx = w.x + dx, ny = w.y + dy;
    if (nx === player.x && ny === player.y) continue;
    if (!wandererCanEnter(w, getTile(nx, ny))) continue;
    if (enemies.some(e => e.x === nx && e.y === ny)) continue;
    if (findNpcAt(nx, ny)) continue;
    w.x = nx; w.y = ny;
  }
}

function talkTo(npc) {
  let text = npc.line;
  if (npc.heal) {
    if (player.hp < player.maxHp) {
      player.hp = player.maxHp;
      text += '  [You feel fully rested. HP restored!]';
    } else {
      text += '  [You are already in perfect health.]';
    }
  }
  openDialogue(text);
}

function openDialogue(text) {
  dialogueOpen = true;
  document.getElementById('dialogue-text').textContent = text;
  document.getElementById('dialogue-box').style.display = 'block';
}

function closeDialogue() {
  dialogueOpen = false;
  document.getElementById('dialogue-box').style.display = 'none';
}
