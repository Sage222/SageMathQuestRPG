const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const MINIMAP_SIZE = 120;
const MINIMAP_RADIUS = 60;

function drawMinimap() {
  minimapCtx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  const startX = player.x - MINIMAP_RADIUS;
  const startY = player.y - MINIMAP_RADIUS;

  for (let y = 0; y < MINIMAP_SIZE; y++) {
    for (let x = 0; x < MINIMAP_SIZE; x++) {
      const wx = startX + x, wy = startY + y;
      const tile = getTile(wx, wy);
      minimapCtx.fillStyle = TILE_COLORS[tile.type] || '#000';
      minimapCtx.fillRect(x, y, 1, 1);
    }
  }

  minimapCtx.fillStyle = '#ff3b3b';
  for (const e of enemies) {
    const mx = e.x - startX, my = e.y - startY;
    if (mx >= 0 && mx < MINIMAP_SIZE && my >= 0 && my < MINIMAP_SIZE) {
      minimapCtx.fillRect(mx - 1, my - 1, 3, 3);
    }
  }

  minimapCtx.fillStyle = '#8e44ad';
  for (const w of wanderers) {
    const mx = w.x - startX, my = w.y - startY;
    if (mx >= 0 && mx < MINIMAP_SIZE && my >= 0 && my < MINIMAP_SIZE) {
      minimapCtx.fillRect(mx - 1, my - 1, 2, 2);
    }
  }

  minimapCtx.fillStyle = '#f1c40f';
  minimapCtx.fillRect(MINIMAP_RADIUS - 1, MINIMAP_RADIUS - 1, 3, 3);
  minimapCtx.fillStyle = '#3498db';
  minimapCtx.fillRect(MINIMAP_RADIUS - 1, MINIMAP_RADIUS - 1, 2, 2);
}
