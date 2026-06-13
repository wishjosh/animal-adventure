// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  지형 계산 및 블록 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function vn(x, z) {
  const h = n => { let v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = h(ix + iz * 57), b = h(ix + 1 + iz * 57), c = h(ix + (iz + 1) * 57), d = h(ix + 1 + (iz + 1) * 57);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

const BiomeSystem = {
  getBiomeWeights(x, z) {
    let weights = {};
    let totalWeight = 0;

    for (const [key, biome] of Object.entries(BIOME_CONFIG)) {
      const dist = Math.hypot(x - biome.centerX, z - biome.centerZ);
      let weight = 0;
      if (dist < biome.radius) {
        weight = 1.0;
      } else if (dist < biome.radius + 15) {
        weight = 1.0 - ((dist - biome.radius) / 15);
      }

      if (weight > 0) {
        weights[key] = weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      weights['ocean'] = 1.0;
      totalWeight = 1.0;
    }

    for (const key in weights) weights[key] /= totalWeight;
    return weights;
  },

  getDominantBiome(x, z) {
    const weights = this.getBiomeWeights(x, z);
    let maxW = 0, dominant = 'green_village';
    for (const k in weights) {
      if (weights[k] > maxW) { maxW = weights[k]; dominant = k; }
    }
    return BIOME_CONFIG[dominant] || BIOME_CONFIG['green_village'];
  }
};

function getH(wx, wz) {
  const nx = wx * 0.03, nz = wz * 0.03;
  const weights = BiomeSystem.getBiomeWeights(wx, wz);

  let finalH = 0;

  for (const [bKey, weight] of Object.entries(weights)) {
    // 바이옴 밖 기본 지형: 구릉지(33) — 수면(30) 위에 항상 위치
    let bH = 33, bRough = 0.2;

    if (bKey !== 'ocean') {
      const conf = BIOME_CONFIG[bKey];
      bH = conf.baseHeight;
      bRough = conf.roughness;
    }

    let noise = vn(nx + bKey.length, nz + bKey.length);
    if (bKey === 'green_village') noise = vn(wx * 0.012 + 100, wz * 0.012 + 100);

    // 산악 기여 축소: 18→7, 완만한 구릉지 형성
    let hills = Math.pow(vn(nx * 0.5 + 100, nz * 0.5 + 100), 2.0) * (vn(nx * 2.0, nz * 2.0) * 7.0) * bRough;

    let localH = bH + (noise * 4.0) + hills;
    finalH += localH * weight;
  }

  // 강줄기 깎기: 넓은 하폭(×2.0) + 중앙 깊은 수로(carve² × 7 + carve × 2)
  // 중심부 최대 깎기 9블록 → 바닥 ~24, 수면(30) 대비 수심 약 6블록
  const riverNoise = Math.abs(vn(nx * 0.6 + 50, nz * 0.6 + 50) * 2 - 1);
  const riverCarve = Math.max(0, 1.0 - riverNoise * 2.0);
  if (riverCarve > 0) finalH -= (riverCarve * riverCarve * 7.0 + riverCarve * 2.0);

  if (finalH > 50.0) finalH = 50.0 + Math.sqrt(finalH - 50.0) * 1.5;
  return Math.min(GH, Math.max(5, Math.round(finalH)));
}

function terrainType(wx, y, wz, sh) {
  const dominant = BiomeSystem.getDominantBiome(wx, wz);
  const underwater = sh < dominant.waterLevel;

  if (sh - y === 0) {
    if (underwater) return dominant.surface === 'r_sub' ? 'r_sub' : 'r_sand';
    if (sh >= 44) return 't_rock';
    return dominant.surface;
  }
  if (underwater) return sh - y <= 3 ? 'r_sub' : 'stone';
  return sh - y <= 4 ? dominant.subsurface : 'stone';
}

function colColor(wx, wz, h) {
  const dominant = BiomeSystem.getDominantBiome(wx, wz);
  if (h < dominant.waterLevel) return 0x1565c0;
  if (h >= 44) return 0x9a8878;
  return ITEM_DB[dominant.surface]?.hex || 0x6aaa5a;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  청크 시스템
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ck = (cx, cz) => `${cx},${cz}`;
const w2c = (wx, wz) => [Math.floor(wx / CHUNK), Math.floor(wz / CHUNK)];
const isActive = (wx, wz) => chunkState[ck(...w2c(wx, wz))] === 'active';

function spawnAnimalsInChunk(cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const wx = x0 + Math.floor(Math.random() * CHUNK), wz = z0 + Math.floor(Math.random() * CHUNK);
    const sh = getH(wx, wz);
    const dominant = BiomeSystem.getDominantBiome(wx, wz);
    if (sh < dominant.waterLevel - 1) { if (Math.random() < 0.6) placeAnimal(wx, sh + 0.5, wz, 'fish'); }
    // 육지 동물 무작위 생성 중단 (페이즈 3 지정 동물에 집중)
  }
}

function bldActive(cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let lx = 0; lx < CHUNK; lx++) for (let lz = 0; lz < CHUNK; lz++) {
    const wx = x0 + lx, wz = z0 + lz, sh = getH(wx, wz);

    const minH = Math.min(getH(wx - 1, wz), getH(wx + 1, wz), getH(wx, wz - 1), getH(wx, wz + 1));
    const visibleStartY = Math.min(sh, minH);

    for (let y = 0; y <= sh; y++) {
      const k = bk(wx, y, wz);
      if (!deletedBlocks.has(k)) {
        const type = terrainType(wx, y, wz, sh);
        gridData[k] = type;
        if (y >= visibleStartY) {
          if (!meshByKey[k]) {
            const mesh = buildMesh(type, wx, y, wz);
            if (mesh) { meshByKey[k] = mesh; scene.add(mesh); }
          }
        }
      }
    }
  }
  spawnVegetationInChunk(cx, cz);
}

function placeDecorativeBlock(x, y, z, type) {
  if (y < 0 || y >= GH) return;
  const k = bk(x, y, z);
  if (gridData[k] || deletedBlocks.has(k)) return;
  gridData[k] = type;
  const mesh = buildMesh(type, x, y, z);
  if (mesh) {
    meshByKey[k] = mesh;
    scene.add(mesh);
  }
}

function pickVegetationType(biomeId, wx, wz, sh, surfaceType) {
  if (surfaceType === 't_rock' || sh >= 44) return null;
  const biome = BiomeSystem.getDominantBiome(wx, wz);
  const nearWater = Math.abs(sh - biome.waterLevel) <= 2;
  const r = stableRand(wx, wz, 91);

  if (biomeId === 'green_village') {
    if (r < 0.018) return 'deco_tree_oak';
    if (r < 0.052) return 'deco_shrub';
    if (r < 0.105) return 'deco_wildflower';
    if (r < 0.205) return 'deco_grass_tuft';
    return null;
  }

  if (biomeId === 'diversity_forest') {
    if (r < 0.038) return stableRand(wx, wz, 92) < 0.55 ? 'deco_tree_pine' : 'deco_tree_oak';
    if (r < 0.105) return 'deco_shrub';
    if (r < 0.155) return 'deco_wildflower';
    if (r < 0.265) return 'deco_grass_tuft';
    return null;
  }

  if (biomeId === 'river_source') {
    if (nearWater && r < 0.055) return 'deco_reed';
    if (nearWater && r < 0.082) return 'deco_tree_willow';
    if (r < 0.12) return 'deco_grass_tuft';
    if (r < 0.145) return 'deco_wildflower';
    return null;
  }

  if (biomeId === 'coastal_shore') {
    if (nearWater && r < 0.07) return 'deco_reed';
    if (r < 0.15) return 'deco_dry_grass';
    if (r < 0.18) return 'deco_shrub';
    return null;
  }

  if (biomeId === 'connection_plains') {
    if (r < 0.08) return 'deco_dry_grass';
    if (r < 0.115) return 'deco_grass_tuft';
    if (r < 0.13) return 'deco_shrub';
    return null;
  }

  if (biomeId === 'urban_border') {
    if (r < 0.022) return 'deco_street_tree';
    if (r < 0.06) return 'deco_shrub';
    if (r < 0.11) return 'deco_dry_grass';
    return null;
  }

  if (biomeId === 'green_heart') {
    if (r < 0.045) return stableRand(wx, wz, 93) < 0.45 ? 'deco_tree_pine' : 'deco_tree_oak';
    if (r < 0.115) return 'deco_shrub';
    if (r < 0.18) return 'deco_wildflower';
    if (r < 0.25) return 'deco_grass_tuft';
    return null;
  }

  return null;
}

function spawnVegetationInChunk(cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let lx = 0; lx < CHUNK; lx++) {
    for (let lz = 0; lz < CHUNK; lz++) {
      const wx = x0 + lx, wz = z0 + lz;
      const sh = getH(wx, wz);
      const biome = BiomeSystem.getDominantBiome(wx, wz);
      if (!biome || sh < biome.waterLevel) continue;

      const slope = Math.max(
        Math.abs(getH(wx - 1, wz) - sh),
        Math.abs(getH(wx + 1, wz) - sh),
        Math.abs(getH(wx, wz - 1) - sh),
        Math.abs(getH(wx, wz + 1) - sh)
      );
      if (slope > 2) continue;

      const surfaceType = terrainType(wx, sh, wz, sh);
      const decoType = pickVegetationType(biome.id, wx, wz, sh, surfaceType);
      if (!decoType) continue;

      const y = sh + 1;
      if (gridData[bk(wx, y, wz)]) continue;
      placeDecorativeBlock(wx, y, wz, decoType);
    }
  }
}

function bldPreview(cx, cz) {
  const k = ck(cx, cz); if (chunkGroups[k]) scene.remove(chunkGroups[k]);
  const g = new THREE.Group(), x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let lx = 0; lx < CHUNK; lx++) for (let lz = 0; lz < CHUNK; lz++) {
    const wx = x0 + lx, wz = z0 + lz, sh = getH(wx, wz);
    const dominant = BiomeSystem.getDominantBiome(wx, wz);
    const visH = sh < dominant.waterLevel ? Math.ceil(dominant.waterLevel) : sh;
    const col = colColor(wx, wz, sh);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: col, transparent: true, opacity: 0.15 }));
    mesh.position.set(wx, visH + 0.5, wz);
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    ));
    mesh.userData = { isPreview: true, cx, cz }; g.add(mesh);
  }
  scene.add(g); chunkGroups[k] = g;
}

function disposeChunkGroup(group) {
  group.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  });
}

function rmVisible(cx, cz) {
  const k = ck(cx, cz);
  if (chunkGroups[k]) {
    scene.remove(chunkGroups[k]);
    disposeChunkGroup(chunkGroups[k]);
    delete chunkGroups[k];
  }
}

function activateChunk(cx, cz, isInit = false, options = {}) {
  if (chunkState[ck(cx, cz)] === 'active') return false;
  rmVisible(cx, cz); chunkState[ck(cx, cz)] = 'active'; bldActive(cx, cz);
  if (!isInit && options.spawn !== false) spawnAnimalsInChunk(cx, cz);
  if (options.expandPreview !== false) {
    const viewRadius = (typeof isTouchLayout === 'function' && isTouchLayout()) ? 3 : 4;
    for (let dx = -viewRadius; dx <= viewRadius; dx++) for (let dz = -viewRadius; dz <= viewRadius; dz++) {
      if (dx === 0 && dz === 0) continue;
      const nx = cx + dx, nz = cz + dz, nk = ck(nx, nz);
      if (!chunkState[nk] || chunkState[nk] === 'hidden') { chunkState[nk] = 'visible'; bldPreview(nx, nz); }
    }
  }
  if (options.refreshMap !== false) updateMapOverlay();
  return true;
}

let lastCenterCx = null;
let lastCenterCz = null;
const chunkOffsetCache = {};

function getChunkLoadProfile() {
  const touchLayout = typeof isTouchLayout === 'function' && isTouchLayout();
  const flyingFast = typeof creativeFlight !== 'undefined' && creativeFlight;
  if (touchLayout || flyingFast) {
    return { active: 2, visible: 5, preview: 6, unload: 8, previewBudget: 28 };
  }
  return { active: 3, visible: 8, preview: 10, unload: 14, previewBudget: Number.POSITIVE_INFINITY };
}

function getChunkOffsets(radius) {
  if (chunkOffsetCache[radius]) return chunkOffsetCache[radius];
  const offsets = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      offsets.push([dx, dz]);
    }
  }
  offsets.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]));
  chunkOffsetCache[radius] = offsets;
  return offsets;
}

function updateVisibleChunks(orbitTarget) {
  if (!orbitTarget) return;
  const centerCx = Math.floor(orbitTarget.x / CHUNK);
  const centerCz = Math.floor(orbitTarget.z / CHUNK);

  if (lastCenterCx === centerCx && lastCenterCz === centerCz) return;
  lastCenterCx = centerCx;
  lastCenterCz = centerCz;

  const loadProfile = getChunkLoadProfile();
  const R_ACTIVE = loadProfile.active;  // 플레이어 주변 청크는 자동으로 실제 탐험 영역이 된다
  const R        = loadProfile.visible; // 활성+프리뷰 표시 반경
  const R_PREV   = loadProfile.preview; // 프리뷰 자동 생성 반경
  const R_UNLOAD = loadProfile.unload;  // 이 거리 밖 프리뷰는 메모리 해제
  let previewBudget = loadProfile.previewBudget;
  let mapDirty = false;

  // ── 현재 위치 주변은 터치 없이 자동 활성화 ──
  for (const [dx, dz] of getChunkOffsets(R_ACTIVE)) {
    const nx = centerCx + dx, nz = centerCz + dz;
    if (chunkState[ck(nx, nz)] !== 'active') {
      if (activateChunk(nx, nz, false, { expandPreview: false, refreshMap: false })) mapDirty = true;
    }
  }

  // ── 미탐험 영역 자동 프리뷰 생성 ──
  for (const [dx, dz] of getChunkOffsets(R_PREV)) {
    const nx = centerCx + dx, nz = centerCz + dz, nk = ck(nx, nz);
    if (!chunkState[nk] || chunkState[nk] === 'hidden') {
      if (previewBudget <= 0) continue;
      previewBudget--;
      chunkState[nk] = 'visible';
      bldPreview(nx, nz);
      mapDirty = true;
    }
  }

  // ── 활성 블록 표시/숨김 ──
  for (const [k, mesh] of Object.entries(meshByKey)) {
    const [x, , z] = k.split(',').map(Number);
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    if (Math.abs(cx - centerCx) <= R && Math.abs(cz - centerCz) <= R) {
      if (!mesh.parent) scene.add(mesh);
    } else {
      if (mesh.parent) scene.remove(mesh);
    }
  }

  // ── 프리뷰 청크 표시/숨김 및 원거리 해제 ──
  for (const [k, group] of Object.entries(chunkGroups)) {
    const [cx, cz] = k.split(',').map(Number);
    const distX = Math.abs(cx - centerCx), distZ = Math.abs(cz - centerCz);
    if (distX <= R && distZ <= R) {
      if (!group.parent) scene.add(group);
    } else if (distX > R_UNLOAD || distZ > R_UNLOAD) {
      if (group.parent) scene.remove(group);
      disposeChunkGroup(group);
      delete chunkGroups[k];
      chunkState[k] = 'hidden';
      mapDirty = true;
    } else {
      if (group.parent) scene.remove(group);
    }
  }

  if (mapDirty) updateMapOverlay();
}

function initOldTree() {
  if (OldTree.group) scene.remove(OldTree.group);
  const g = new THREE.Group();
  const tx = 8, tz = 8, ty = getTopY(tx, tz);
  g.position.set(tx, ty, tz);
  const M = (hex) => new THREE.MeshLambertMaterial({ color: hex });
  const trunkMat = M(0x5C3D1A);
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), trunkMat);
    mesh.position.y = i + 0.5; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { isOldTree: true }; g.add(mesh);
  }
  OldTree.branches = []; OldTree.leaves = []; OldTree.fruits = [];
  const branchDirs = [{ y: 2.2, r: 0 }, { y: 2.5, r: Math.PI / 2 }, { y: 2.8, r: Math.PI }, { y: 2.4, r: -Math.PI / 2 }, { y: 3.0, r: Math.PI / 4 }];
  branchDirs.forEach(dir => {
    const bg = new THREE.Group(); bg.position.set(0, dir.y, 0); bg.rotation.y = dir.r;
    const branch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1.2), trunkMat);
    branch.position.z = 0.6; branch.castShadow = true; branch.userData = { isOldTree: true };
    bg.add(branch); OldTree.branches.push(bg);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), M(0x888888));
    leaf.position.z = 1.2; leaf.castShadow = true; leaf.userData = { isOldTree: true };
    bg.add(leaf); OldTree.leaves.push(leaf);
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), M(0xff0000));
    fruit.position.set(0, -0.6, 1.2); fruit.visible = false;
    bg.add(fruit); OldTree.fruits.push(fruit);
    g.add(bg);
  });
  [{ x: 0, y: 3.5, z: 0 }, { x: 0.5, y: 3.2, z: 0.5 }, { x: -0.5, y: 3.2, z: -0.5 }].forEach(pos => {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), M(0x888888));
    leaf.position.set(pos.x, pos.y, pos.z); leaf.castShadow = true; leaf.userData = { isOldTree: true };
    g.add(leaf); OldTree.leaves.push(leaf);
  });
  OldTree.group = g; scene.add(g); OldTree.updateVisual();
}

function initWorld() {
  activateChunk(0, 0, true); activateChunk(1, 0, true);
  activateChunk(0, 1, true); activateChunk(1, 1, true);
  initOldTree();
  ClueSystem.init();
  ToxicPlantSystem.init();
  LeafSystem.init();
  initInventoryUI(); applyCurrentTool();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  블록 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bk = (x, y, z) => `${x},${y},${z}`;
function getTopY(x, z) {
  for (let y = GH; y >= 0; y--) {
    const type = gridData[bk(x, y, z)];
    if (type && !isDecorativeType(type)) return y + 1;
  }
  return 0;
}

function getBlockData(rawType) {
  if (!rawType) return null;
  if (ITEM_DB[rawType]) return ITEM_DB[rawType];
  if (TERRAIN_BLOCKS[rawType]) return TERRAIN_BLOCKS[rawType];
  const baseType = rawType.split('_')[0];
  return ITEM_DB[baseType] || TERRAIN_BLOCKS[baseType];
}

const spriteCache = {};
function createEmojiSprite(emoji) {
  if (spriteCache[emoji]) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteCache[emoji] }));
    sprite.scale.set(1.2, 1.2, 1);
    return sprite;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(16, 16, 96, 96, 20);
  } else {
    ctx.rect(16, 16, 96, 96);
  }
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.font = '72px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  spriteCache[emoji] = texture;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
  sprite.scale.set(1.2, 1.2, 1);
  return sprite;
}

function stableRand(x, z, salt = 0) {
  const v = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function isDecorativeType(rawType) {
  return !!rawType && rawType.startsWith('deco_');
}

function markDecorative(obj) {
  obj.userData = { ...(obj.userData || {}), isDecorative: true };
  obj.traverse?.(child => {
    child.userData = { ...(child.userData || {}), isDecorative: true };
    if (child.isMesh || child.isSprite) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return obj;
}

function buildDecorMesh(rawType, x, y, z, def) {
  const M = hex => new THREE.MeshLambertMaterial({ color: hex });
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const addBox = (w, h, d, px, py, pz, hex) => {
    const mesh = new THREE.Mesh(B(w, h, d), M(hex));
    mesh.position.set(px, py, pz);
    g.add(mesh);
    return mesh;
  };

  if (rawType === 'deco_grass_tuft' || rawType === 'deco_dry_grass') {
    const color = rawType === 'deco_dry_grass' ? 0xb8a15a : 0x5fae47;
    const count = rawType === 'deco_dry_grass' ? 4 : 5;
    for (let i = 0; i < count; i++) {
      const blade = addBox(0.08, 0.42 + stableRand(x, z, i) * 0.22, 0.08,
        (stableRand(x, z, i + 10) - 0.5) * 0.55,
        0.2,
        (stableRand(x, z, i + 20) - 0.5) * 0.55,
        color);
      blade.rotation.z = (stableRand(x, z, i + 30) - 0.5) * 0.55;
    }
    return markDecorative(g);
  }

  if (rawType === 'deco_wildflower') {
    addBox(0.06, 0.42, 0.06, 0, 0.2, 0, 0x4f9c3f);
    const bloomColors = [0xf2d36b, 0xffffff, 0xf08bb3, 0xcaa6ff];
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      M(bloomColors[Math.floor(stableRand(x, z, 41) * bloomColors.length)])
    );
    bloom.position.set(0, 0.48, 0);
    g.add(bloom);
    return markDecorative(g);
  }

  if (rawType === 'deco_reed') {
    for (let i = 0; i < 4; i++) {
      const px = (stableRand(x, z, i + 50) - 0.5) * 0.55;
      const pz = (stableRand(x, z, i + 60) - 0.5) * 0.55;
      const h = 0.8 + stableRand(x, z, i + 70) * 0.55;
      addBox(0.06, h, 0.06, px, h / 2, pz, 0x6b7a34);
      addBox(0.12, 0.34, 0.12, px, h + 0.08, pz, 0x9a7b3f);
    }
    return markDecorative(g);
  }

  if (rawType === 'deco_shrub') {
    addBox(0.75, 0.45, 0.75, 0, 0.22, 0, 0x2f7d32);
    addBox(0.52, 0.36, 0.52, -0.18, 0.48, 0.16, 0x3b8d3b);
    addBox(0.48, 0.34, 0.48, 0.2, 0.48, -0.14, 0x276f2d);
    return markDecorative(g);
  }

  if (rawType === 'deco_tree_oak' || rawType === 'deco_street_tree') {
    const canopy = rawType === 'deco_street_tree' ? 0x3f8f46 : 0x2f7d32;
    const trunkH = rawType === 'deco_street_tree' ? 1.5 : 1.8;
    addBox(0.28, trunkH, 0.28, 0, trunkH / 2, 0, 0x6a4728);
    addBox(1.15, 0.9, 1.15, 0, trunkH + 0.32, 0, canopy);
    addBox(0.85, 0.7, 0.85, -0.38, trunkH + 0.12, 0.12, 0x4f9c3f);
    addBox(0.85, 0.7, 0.85, 0.34, trunkH + 0.08, -0.18, 0x2f7d32);
    return markDecorative(g);
  }

  if (rawType === 'deco_tree_pine') {
    addBox(0.24, 1.9, 0.24, 0, 0.95, 0, 0x5c3a1f);
    addBox(1.15, 0.7, 1.15, 0, 1.15, 0, 0x1f5f37);
    addBox(0.92, 0.64, 0.92, 0, 1.65, 0, 0x266d40);
    addBox(0.62, 0.56, 0.62, 0, 2.08, 0, 0x2b7c48);
    return markDecorative(g);
  }

  if (rawType === 'deco_tree_willow') {
    addBox(0.25, 1.65, 0.25, 0, 0.82, 0, 0x6a4728);
    addBox(1.0, 0.55, 1.0, 0, 1.55, 0, 0x3c8f4b);
    [[-0.42, 0], [0.42, 0], [0, -0.42], [0, 0.42]].forEach(([px, pz], i) => {
      addBox(0.18, 1.05, 0.18, px, 1.0 - i * 0.04, pz, 0x58a85e);
    });
    return markDecorative(g);
  }

  const sprite = createEmojiSprite(def.icon || '🌿');
  sprite.position.set(x, y + 0.6, z);
  return markDecorative(sprite);
}

function buildMesh(rawType, x, y, z) {
  const def = getBlockData(rawType);
  if (!def) return null;

  if (def.category === 'decor' || isDecorativeType(rawType)) {
    return buildDecorMesh(rawType, x, y, z, def);
  }

  // 코너 울타리: 두 패널이 직각으로 교차하는 십자형 메시
  if (rawType.startsWith('fence_c')) {
    const mat = new THREE.MeshLambertMaterial({ color: def.hex });
    const g = new THREE.Group();
    g.position.set(x, y + 0.5, z);
    g.userData = { isBlock: true, bx: x, by: y, bz: z };
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14 });
    // N-S 방향 패널
    const geoA = new THREE.BoxGeometry(1, 1, 0.2);
    const panelA = new THREE.Mesh(geoA, mat);
    panelA.castShadow = panelA.receiveShadow = true;
    panelA.userData = { isBlock: true, bx: x, by: y, bz: z };
    panelA.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoA), edgeMat.clone()));
    g.add(panelA);
    // E-W 방향 패널
    const geoB = new THREE.BoxGeometry(0.2, 1, 1);
    const panelB = new THREE.Mesh(geoB, mat.clone());
    panelB.castShadow = panelB.receiveShadow = true;
    panelB.userData = { isBlock: true, bx: x, by: y, bz: z };
    panelB.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoB), edgeMat.clone()));
    g.add(panelB);
    return g;
  }

  // 관목: 녹색 덤불 모양 (짧고 둥근 덩어리)
  if (rawType === 'bush') {
    const mat = new THREE.MeshLambertMaterial({ color: def.hex });
    const g = new THREE.Group();
    g.position.set(x, y + 0.5, z);
    g.userData = { isBlock: true, bx: x, by: y, bz: z };
    const geoMain = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    const main = new THREE.Mesh(geoMain, mat);
    main.userData = { isBlock: true, bx: x, by: y, bz: z };
    main.castShadow = main.receiveShadow = true;
    main.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoMain), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14 })));
    g.add(main);
    const geoTop = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a5c1a });
    const top = new THREE.Mesh(geoTop, darkMat);
    top.position.y = 0.5;
    top.userData = { isBlock: true, bx: x, by: y, bz: z };
    top.castShadow = true;
    g.add(top);
    return g;
  }

  let type = rawType, rot = 0;
  if (rawType.startsWith('fence_')) { type = 'fence'; rot = parseInt(rawType.split('_')[1]); }
  const mat = def.transparent ? new THREE.MeshLambertMaterial({ color: def.hex, transparent: true, opacity: def.opacity }) : new THREE.MeshLambertMaterial({ color: def.hex });

  if (def.category === 'plant' || def.category === 'seed' || def.category === 'resource') {
    let emoji = def.icon || '🌱';
    if (rawType === 'seed_tomato' || rawType.startsWith('plant_tomato')) emoji = '🍅';
    else if (rawType === 'seed_basil' || rawType.startsWith('plant_basil')) emoji = '🌿';
    else if (rawType === 'seed_clover' || rawType.startsWith('plant_clover')) emoji = '🍀';
    else if (rawType === 'seed_sunflower' || rawType.startsWith('plant_sunflower')) emoji = '🌻';
    else if (rawType === 'fallen_leaf') emoji = '🍂';
    else if (rawType === 'toxic_plant') emoji = '🥀';
    else if (rawType === 'sprout') emoji = '🌱';
    else if (rawType === 'seed_pine') emoji = '🌲';

    const sprite = createEmojiSprite(emoji);
    sprite.position.set(x, y + 0.8, z);
    sprite.userData = { isBlock: true, bx: x, by: y, bz: z };
    return sprite;
  }

  let geo, py = y + 0.5;
  if (type === 'grass' || type === 'straw') {
    geo = new THREE.BoxGeometry(1, 0.2, 1); py = y + 0.1;
  } else if (type === 'fence') {
    geo = new THREE.BoxGeometry(1, 1, 0.2);
  } else {
    geo = new THREE.BoxGeometry(1, 1, 1);
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, py, z);
  if (type === 'fence') mesh.rotation.y = rot * (Math.PI / 2);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData = { isBlock: true, bx: x, by: y, bz: z };
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.14 })));
  return mesh;
}

function _place(x, y, z, type) {
  if (y < 0 || y >= GH) return;
  const k = bk(x, y, z);
  if (gridData[k]) { if (meshByKey[k]) scene.remove(meshByKey[k]); delete meshByKey[k]; delete gridData[k]; }
  gridData[k] = type; const mesh = buildMesh(type, x, y, z); if (mesh) { meshByKey[k] = mesh; scene.add(mesh); }
  deletedBlocks.delete(k);
  // ── 수호대 조건 리스너 훅 ──
  if (typeof onBlockPlaced === 'function') onBlockPlaced(type, x, y, z);
}

// 해당 좌표의 울타리를 인접 상황에 맞게 직선/코너로 업데이트
function _refreshFenceCorner(x, y, z) {
  const cur = gridData[bk(x, y, z)];
  if (!cur || !cur.startsWith('fence')) return;
  const hasN = gridData[bk(x, y, z-1)]?.startsWith('fence');
  const hasS = gridData[bk(x, y, z+1)]?.startsWith('fence');
  const hasE = gridData[bk(x+1, y, z)]?.startsWith('fence');
  const hasW = gridData[bk(x-1, y, z)]?.startsWith('fence');
  const isCorner = (hasN || hasS) && (hasE || hasW);
  const newType = isCorner ? 'fence_c0' : cur;
  if (newType === cur) return;
  const k = bk(x, y, z);
  if (meshByKey[k]) { scene.remove(meshByKey[k]); delete meshByKey[k]; }
  gridData[k] = newType;
  const mesh = buildMesh(newType, x, y, z);
  if (mesh) { meshByKey[k] = mesh; scene.add(mesh); }
}

function placeBlock(x, y, z, type) {
  if (!isActive(x, z)) { toast('⚠️ 희미한 지역을 먼저 탐험해주세요!'); return; }
  let finalType = type;
  if (type === 'fence') {
    const hasN = gridData[bk(x, y, z-1)]?.startsWith('fence');
    const hasS = gridData[bk(x, y, z+1)]?.startsWith('fence');
    const hasE = gridData[bk(x+1, y, z)]?.startsWith('fence');
    const hasW = gridData[bk(x-1, y, z)]?.startsWith('fence');
    finalType = (hasN || hasS) && (hasE || hasW) ? 'fence_c0' : 'fence_' + currentRotation;
  }
  _place(x, y, z, finalType);
  // 인접 울타리도 코너 여부 재검사
  if (type === 'fence') {
    _refreshFenceCorner(x, y-1, z); _refreshFenceCorner(x, y+1, z);
    _refreshFenceCorner(x-1, y, z); _refreshFenceCorner(x+1, y, z);
    _refreshFenceCorner(x, y, z-1); _refreshFenceCorner(x, y, z+1);
  }
  QuestManager.check();
}

function removeBlock(x, y, z) {
  const k = bk(x, y, z); if (!gridData[k]) return;
  const removedType = gridData[k]; // ← 추가: 제거 전 타입 저장
  const effectColor = getBlockEffectColor(removedType);
  if (typeof clearBlockCrackEffect === 'function') clearBlockCrackEffect(k);
  playBlockBreakEffect(x, y, z, effectColor);
  if (meshByKey[k]) { scene.remove(meshByKey[k]); delete meshByKey[k]; }
  delete gridData[k];
  deletedBlocks.add(k);

  const neighbors = [
    [x, y - 1, z], [x, y + 1, z],
    [x - 1, y, z], [x + 1, y, z],
    [x, y, z - 1], [x, y, z + 1]
  ];
  for (const [nx, ny, nz] of neighbors) {
    const nk = bk(nx, ny, nz);
    if (gridData[nk] && !meshByKey[nk]) {
      const type = gridData[nk];
      const mesh = buildMesh(type, nx, ny, nz);
      if (mesh) { meshByKey[nk] = mesh; scene.add(mesh); }
    }
  }

  QuestManager.check();
  // ── 레벨 2 조건 훅 ──────────────────────────────────
  if (typeof onBlockRemoved === 'function') onBlockRemoved(removedType, x, y, z);
}

function _remove(x, y, z) {
  removeBlock(x, y, z);
}

function getBlockEffectColor(rawType, fallback = 0xffffff) {
  const def = getBlockData(rawType);
  if (def?.hex !== undefined) return def.hex;
  if (def?.color && typeof def.color === 'string' && def.color.startsWith('#')) {
    const parsed = parseInt(def.color.slice(1), 16);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

let blockCrackEffect = null;

function disposeEffectObject(obj) {
  obj.traverse?.(child => {
    if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(mat => {
        if (mat && typeof mat.dispose === 'function') mat.dispose();
      });
    }
  });
}

function clearBlockCrackEffect(key = null) {
  if (!blockCrackEffect) return;
  if (key && blockCrackEffect.key !== key) return;
  scene.remove(blockCrackEffect.group);
  disposeEffectObject(blockCrackEffect.group);
  blockCrackEffect = null;
}

function _crackRand(seed) {
  let v = Math.sin(seed) * 10000;
  return v - Math.floor(v);
}

function showBlockCrackEffect(x, y, z, stage = 1) {
  if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;
  const key = bk(x, y, z);
  clearBlockCrackEffect();

  const clampedStage = Math.max(1, Math.min(5, stage));
  const positions = [];
  const lineCount = 7 + clampedStage * 5;
  const faces = [
    ['z', 1], ['z', -1],
    ['x', 1], ['x', -1],
    ['y', 1]
  ];

  for (let i = 0; i < lineCount; i++) {
    const seed = (x * 197.1) + (y * 281.7) + (z * 311.3) + (i * 17.7) + clampedStage * 43.1;
    const [axis, sign] = faces[Math.floor(_crackRand(seed) * faces.length)];
    const a = (_crackRand(seed + 1) - 0.5) * 0.78;
    const b = (_crackRand(seed + 2) - 0.5) * 0.78;
    const angle = _crackRand(seed + 3) * Math.PI * 2;
    const len = 0.12 + clampedStage * 0.035 + _crackRand(seed + 4) * 0.13;
    const da = Math.cos(angle) * len;
    const db = Math.sin(angle) * len;
    const facePos = 0.512 * sign;

    if (axis === 'z') {
      positions.push(a, b, facePos, a + da, b + db, facePos);
    } else if (axis === 'x') {
      positions.push(facePos, a, b, facePos, a + da, b + db);
    } else {
      positions.push(a, facePos, b, a + da, facePos, b + db);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.28 + clampedStage * 0.11,
    depthTest: true
  });
  const lines = new THREE.LineSegments(geometry, material);
  const group = new THREE.Group();
  group.position.set(x, y + 0.5, z);
  group.scale.setScalar(1.01 + clampedStage * 0.01);
  group.add(lines);
  scene.add(group);
  blockCrackEffect = { key, group };
}

function playBlockBreakEffect(x, y, z, color = 0xffffff) {
  if (typeof THREE === 'undefined' || typeof scene === 'undefined') return;

  const particles = [];
  const geo = new THREE.BoxGeometry(0.13, 0.13, 0.13);
  for (let i = 0; i < 16; i++) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const particle = new THREE.Mesh(geo, mat);
    const size = 0.65 + Math.random() * 0.8;
    particle.scale.setScalar(size);
    particle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    particle.position.set(x + (Math.random() - 0.5) * 0.72, y + 0.45 + Math.random() * 0.48, z + (Math.random() - 0.5) * 0.72);
    particle.userData.velocity = {
      x: (Math.random() - 0.5) * 0.1,
      y: 0.09 + Math.random() * 0.1,
      z: (Math.random() - 0.5) * 0.1,
      rx: (Math.random() - 0.5) * 0.14,
      ry: (Math.random() - 0.5) * 0.14
    };
    scene.add(particle);
    particles.push(particle);
  }

  let frame = 0;
  const timer = setInterval(() => {
    frame++;
    particles.forEach(particle => {
      particle.position.x += particle.userData.velocity.x;
      particle.position.y += particle.userData.velocity.y;
      particle.position.z += particle.userData.velocity.z;
      particle.rotation.x += particle.userData.velocity.rx;
      particle.rotation.y += particle.userData.velocity.ry;
      particle.userData.velocity.y -= 0.01;
      particle.material.opacity = Math.max(0, particle.material.opacity - 0.045);
    });
    if (frame >= 22) {
      clearInterval(timer);
      particles.forEach(particle => {
        scene.remove(particle);
        if (particle.material && typeof particle.material.dispose === 'function') particle.material.dispose();
      });
      if (typeof geo.dispose === 'function') geo.dispose();
    }
  }, 30);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  동물 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildAnimal(type, isInjured) {
  const g = new THREE.Group();
  const M = hex => new THREE.MeshLambertMaterial({ color: hex });
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const woolColor = isInjured ? 0x999999 : 0xe8e8e8;

  if (type === 'sheep') {
    const b = new THREE.Mesh(B(.75, .55, .55), M(woolColor)); b.position.y = .45; g.add(b);
    const hd = new THREE.Mesh(B(.38, .35, .38), M(0xcccccc)); hd.position.set(.44, .65, 0); g.add(hd);
    [[-.22, -.18], [.22, -.18], [-.22, .18], [.22, .18]].forEach(([lx, lz]) => { const l = new THREE.Mesh(B(.14, .28, .14), M(0xaaaaaa)); l.position.set(lx, .14, lz); g.add(l); });
    [[-.08], [.08]].forEach(([ez]) => { const e = new THREE.Mesh(B(.07, .07, .07), M(0x111111)); e.position.set(.6, .68, ez); g.add(e); });

  } else if (type === 'fish') {
    const b = new THREE.Mesh(B(.6, .35, .28), M(0xff6b35)); b.position.y = .5; g.add(b);
    const t = new THREE.Mesh(B(.24, .3, .12), M(0xff4500)); t.position.set(-.38, .5, 0); g.add(t);
    const f = new THREE.Mesh(B(.18, .18, .06), M(0xff8c00)); f.position.set(.05, .68, 0); g.add(f);
    const e = new THREE.Mesh(B(.09, .09, .09), M(0x111111)); e.position.set(.28, .56, .15); g.add(e);

  } else if (type === 'horse') {
    const b = new THREE.Mesh(B(1.0, 0.6, 0.5), M(0x8B4513)); b.position.y = .5; g.add(b);
    const hd = new THREE.Mesh(B(0.4, 0.4, 0.35), M(0x8B4513)); hd.position.set(.6, .8, 0); g.add(hd);
    [[-.35, -.15], [.35, -.15], [-.35, .15], [.35, .15]].forEach(([lx, lz]) => { const l = new THREE.Mesh(B(.15, .5, .15), M(0x5C2E00)); l.position.set(lx, .25, lz); g.add(l); });
    const mane = new THREE.Mesh(B(.3, .1, .1), M(0x111111)); mane.position.set(.4, 1.0, 0); g.add(mane);
    const tail = new THREE.Mesh(B(.1, .4, .1), M(0x111111)); tail.position.set(-.55, .5, 0); tail.rotation.z = 0.2; g.add(tail);

  } else if (type === 'goat') {
    const b = new THREE.Mesh(B(0.7, 0.5, 0.45), M(0xEEEEEE)); b.position.y = .4; g.add(b);
    const hd = new THREE.Mesh(B(0.3, 0.3, 0.3), M(0xEEEEEE)); hd.position.set(.4, .65, 0); g.add(hd);
    [[-.2, -.15], [.2, -.15], [-.2, .15], [.2, .15]].forEach(([lx, lz]) => { const l = new THREE.Mesh(B(.12, .4, .12), M(0xAAAAAA)); l.position.set(lx, .2, lz); g.add(l); });
    [[.08], [-.08]].forEach(([ez]) => { const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), M(0xAAAAAA)); horn.position.set(.4, .85, ez); g.add(horn); });
    const beard = new THREE.Mesh(B(.05, .15, .1), M(0xEEEEEE)); beard.position.set(.5, .45, 0); g.add(beard);

  } else if (type === 'bee') {
    // 꿀벌: 황색 몸통 + 검은 줄무늬 + 반투명 날개
    const body = new THREE.Mesh(B(.38, .22, .22), M(0xFFD000)); body.position.set(0, .42, 0); g.add(body);
    [-.06, .06].forEach(x => { const s = new THREE.Mesh(B(.09, .24, .24), M(0x111111)); s.position.set(x, .42, 0); g.add(s); });
    [-.1, .1].forEach(z => { const w = new THREE.Mesh(B(.26, .03, .26), new THREE.MeshLambertMaterial({ color: 0xCCEEFF, transparent: true, opacity: .65 })); w.position.set(0, .56, z); w.rotation.x = z > 0 ? -.3 : .3; g.add(w); });
    [-.08, .08].forEach(z => { const ant = new THREE.Mesh(B(.04, .18, .04), M(0x111111)); ant.position.set(.14, .6, z); g.add(ant); });
    const beye = new THREE.Mesh(B(.06, .06, .06), M(0x111111)); beye.position.set(.19, .44, 0); g.add(beye);

  } else if (type === 'swallow') {
    // 제비: 진청 몸통 + 흰 배 + 갈래꼬리
    const body = new THREE.Mesh(B(.45, .2, .24), M(0x1A237E)); body.position.set(0, .45, 0); g.add(body);
    const belly = new THREE.Mesh(B(.3, .16, .22), M(0xFFF8E7)); belly.position.set(.04, .4, 0); g.add(belly);
    const head = new THREE.Mesh(B(.22, .2, .2), M(0x1A237E)); head.position.set(.28, .58, 0); g.add(head);
    const beak = new THREE.Mesh(B(.12, .06, .06), M(0xFF6F00)); beak.position.set(.43, .58, 0); g.add(beak);
    [-.12, .12].forEach(z => { const w = new THREE.Mesh(B(.38, .04, .2), M(0x0D2080)); w.position.set(-.04, .5, z); w.rotation.z = -.2; g.add(w); });
    [-.14, .14].forEach(z => { const t = new THREE.Mesh(B(.2, .04, .07), M(0x1A237E)); t.position.set(-.3, .38, z); t.rotation.z = .3; g.add(t); });

  } else if (type === 'bullfrog') {
    // 황소개구리: 올리브 넓적 몸통 + 볼록 눈
    const body = new THREE.Mesh(B(.65, .28, .6), M(0x3D6B22)); body.position.set(0, .22, 0); g.add(body);
    const head = new THREE.Mesh(B(.52, .18, .5), M(0x3D6B22)); head.position.set(.16, .38, 0); g.add(head);
    [-.17, .17].forEach(z => {
      const eye = new THREE.Mesh(B(.16, .17, .16), M(0x5A9E38)); eye.position.set(.18, .5, z); g.add(eye);
      const pupil = new THREE.Mesh(B(.1, .12, .06), M(0x111111)); pupil.position.set(.27, .5, z); g.add(pupil);
    });
    [[-1, -.25], [1, -.25], [-1, .25], [1, .25]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.16, .08, .22), M(0x2A4A15)); leg.position.set(sx * .2, .08, sz); g.add(leg);
    });

  } else if (type === 'toad') {
    // 두꺼비: 갈색 소형 + 혹 + 볼록 눈
    const body = new THREE.Mesh(B(.5, .24, .46), M(0x6B5C22)); body.position.set(0, .18, 0); g.add(body);
    const head = new THREE.Mesh(B(.38, .16, .36), M(0x6B5C22)); head.position.set(.13, .33, 0); g.add(head);
    [-.14, .14].forEach(z => { const eye = new THREE.Mesh(B(.13, .15, .13), M(0x8FA84A)); eye.position.set(.16, .44, z); g.add(eye); });
    [[-.1, 0], [.1, .06], [0, -.12]].forEach(([bx, bz]) => { const bump = new THREE.Mesh(B(.1, .08, .1), M(0x5A4D1A)); bump.position.set(bx, .3, bz); g.add(bump); });
    [[-1, -.18], [1, -.18], [-1, .18], [1, .18]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.13, .07, .16), M(0x4D4010)); leg.position.set(sx * .15, .07, sz * .5); g.add(leg);
    });

  } else if (type === 'otter') {
    // 수달: 긴 갈색 몸통 + 납작 꼬리 + 크림 배
    const body = new THREE.Mesh(B(.82, .26, .32), M(0x4A2E0D)); body.position.set(0, .33, 0); g.add(body);
    const belly = new THREE.Mesh(B(.55, .22, .28), M(0xD4AC6E)); belly.position.set(0, .32, 0); g.add(belly);
    const head = new THREE.Mesh(B(.32, .28, .3), M(0x4A2E0D)); head.position.set(.48, .46, 0); g.add(head);
    const snout = new THREE.Mesh(B(.14, .14, .18), M(0x7A5A3A)); snout.position.set(.64, .42, 0); g.add(snout);
    const tail = new THREE.Mesh(B(.35, .1, .2), M(0x3B2409)); tail.position.set(-.56, .24, 0); tail.rotation.z = -.2; g.add(tail);
    [[-1, -.12], [1, -.12], [-1, .12], [1, .12]].forEach(([sx, sz]) => {
      const paw = new THREE.Mesh(B(.14, .08, .18), M(0x3B2409)); paw.position.set(sx * .28, .12, sz); g.add(paw);
    });
    [-.1, .1].forEach(z => { const eye = new THREE.Mesh(B(.07, .07, .07), M(0x111111)); eye.position.set(.56, .52, z); g.add(eye); });

  } else if (type === 'bat') {
    // 황금박쥐: 진갈색 소형 + 큰 날개 + 뾰족 귀
    const body = new THREE.Mesh(B(.3, .28, .26), M(0x2D1A0D)); body.position.set(0, .45, 0); g.add(body);
    const head = new THREE.Mesh(B(.22, .2, .2), M(0x2D1A0D)); head.position.set(.14, .62, 0); g.add(head);
    [-.08, .08].forEach(z => { const ear = new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 4), M(0x2D1A0D)); ear.position.set(.1, .8, z); g.add(ear); });
    [-.24, .24].forEach(z => { const wing = new THREE.Mesh(B(.5, .04, .38), M(0x1A0D05)); wing.position.set(-.1, .5, z); wing.rotation.z = z > 0 ? -.15 : .15; g.add(wing); });
    [-.08, .08].forEach(z => { const eye = new THREE.Mesh(B(.06, .06, .06), M(0xFF2222)); eye.position.set(.22, .64, z); g.add(eye); });

  } else if (type === 'fox') {
    // 붉은여우: 주황 몸통 + 크림 배 + 뾰족 귀 + 흰 꼬리 끝
    const body = new THREE.Mesh(B(.68, .42, .4), M(0xCC4400)); body.position.set(0, .4, 0); g.add(body);
    const belly = new THREE.Mesh(B(.5, .38, .32), M(0xFFE4C4)); belly.position.set(.04, .38, 0); g.add(belly);
    const head = new THREE.Mesh(B(.38, .34, .36), M(0xCC4400)); head.position.set(.46, .7, 0); g.add(head);
    const snout = new THREE.Mesh(B(.2, .2, .24), M(0xCC4400)); snout.position.set(.64, .65, 0); g.add(snout);
    [-.14, .14].forEach(z => {
      const ear = new THREE.Mesh(B(.1, .22, .08), M(0xCC4400)); ear.position.set(.4, .96, z); g.add(ear);
      const earIn = new THREE.Mesh(B(.06, .14, .04), M(0xFF8888)); earIn.position.set(.4, .97, z); g.add(earIn);
    });
    const tail = new THREE.Mesh(B(.2, .4, .28), M(0xCC4400)); tail.position.set(-.48, .5, 0); tail.rotation.z = .25; g.add(tail);
    const tailTip = new THREE.Mesh(B(.14, .18, .22), M(0xFFFFFF)); tailTip.position.set(-.56, .32, 0); g.add(tailTip);
    [[-1, -.14], [1, -.14], [-1, .14], [1, .14]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.12, .38, .12), M(0x8B2200)); leg.position.set(sx * .22, .2, sz); g.add(leg);
    });
    [-.1, .1].forEach(z => { const eye = new THREE.Mesh(B(.08, .08, .08), M(0xFFAA00)); eye.position.set(.64, .73, z); g.add(eye); });

  } else if (type === 'eagle') {
    // 독수리: 진갈색 큰 몸통 + 펼친 날개 + 노란 갈고리 부리
    const body = new THREE.Mesh(B(.62, .4, .48), M(0x2C1810)); body.position.set(0, .44, 0); g.add(body);
    const head = new THREE.Mesh(B(.28, .28, .26), M(0x2C1810)); head.position.set(.38, .76, 0); g.add(head);
    const beak = new THREE.Mesh(B(.16, .1, .08), M(0xFFAA00)); beak.position.set(.54, .73, 0); beak.rotation.z = -.3; g.add(beak);
    [-.28, .28].forEach(z => { const wing = new THREE.Mesh(B(.6, .06, .3), M(0x2C1810)); wing.position.set(0, .5, z); wing.rotation.z = -.15; g.add(wing); });
    const tail = new THREE.Mesh(B(.24, .05, .4), M(0x1A0F08)); tail.position.set(-.38, .36, 0); g.add(tail);
    [-.1, .1].forEach(z => { const leg = new THREE.Mesh(B(.1, .28, .1), M(0xFFAA00)); leg.position.set(0, .2, z); g.add(leg); });
    [-.1, .1].forEach(z => { const eye = new THREE.Mesh(B(.08, .08, .08), M(0xFFCC44)); eye.position.set(.47, .8, z); g.add(eye); });

  } else if (type === 'deer') {
    // 노루: 황갈색 날씬한 몸 + 긴 다리 + 작은 뿔 + 흰 엉덩이
    const body = new THREE.Mesh(B(.65, .48, .42), M(0xC9874A)); body.position.set(0, .5, 0); g.add(body);
    const neck = new THREE.Mesh(B(.2, .34, .22), M(0xC9874A)); neck.position.set(.28, .8, 0); g.add(neck);
    const head = new THREE.Mesh(B(.3, .27, .25), M(0xC9874A)); head.position.set(.38, 1.05, 0); g.add(head);
    const snout = new THREE.Mesh(B(.18, .17, .16), M(0xB87842)); snout.position.set(.52, 1.0, 0); g.add(snout);
    const rump = new THREE.Mesh(B(.14, .18, .24), M(0xFFFFFF)); rump.position.set(-.34, .6, 0); g.add(rump);
    [[-1, -.14], [1, -.14], [-1, .14], [1, .14]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.12, .48, .12), M(0x8B5E3C)); leg.position.set(sx * .22, .25, sz); g.add(leg);
    });
    [-.08, .08].forEach(z => { const eye = new THREE.Mesh(B(.07, .07, .07), M(0x111111)); eye.position.set(.53, 1.08, z); g.add(eye); });
    [-.07, .07].forEach(z => {
      const ant = new THREE.Mesh(B(.05, .22, .05), M(0x8B5E3C)); ant.position.set(.32, 1.24, z); g.add(ant);
      const branch = new THREE.Mesh(B(.05, .14, .05), M(0x8B5E3C)); branch.position.set(.25, 1.3, z); branch.rotation.z = .5; g.add(branch);
    });

  } else if (type === 'dog') {
    // 들개: 회갈색 중형견
    const body = new THREE.Mesh(B(.65, .4, .42), M(0x7B6F5A)); body.position.set(0, .4, 0); g.add(body);
    const head = new THREE.Mesh(B(.34, .34, .32), M(0x7B6F5A)); head.position.set(.46, .7, 0); g.add(head);
    const snout = new THREE.Mesh(B(.2, .2, .22), M(0x9A8870)); snout.position.set(.63, .65, 0); g.add(snout);
    [-.12, .12].forEach(z => { const ear = new THREE.Mesh(B(.12, .18, .08), M(0x5A4E3A)); ear.position.set(.36, .92, z); ear.rotation.z = z > 0 ? .2 : -.2; g.add(ear); });
    const tail = new THREE.Mesh(B(.1, .04, .32), M(0x7B6F5A)); tail.position.set(-.36, .55, 0); tail.rotation.z = .3; g.add(tail);
    [[-1, -.14], [1, -.14], [-1, .14], [1, .14]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.13, .36, .13), M(0x5A4E3A)); leg.position.set(sx * .22, .2, sz); g.add(leg);
    });
    [-.09, .09].forEach(z => { const eye = new THREE.Mesh(B(.08, .08, .08), M(0x332200)); eye.position.set(.63, .73, z); g.add(eye); });

  } else if (type === 'crane') {
    // 두루미: 흰 큰 몸통 + 긴 목 + 긴 다리 + 빨간 왕관
    const body = new THREE.Mesh(B(.5, .46, .42), M(0xF5F5F5)); body.position.set(0, .68, 0); g.add(body);
    const neck = new THREE.Mesh(B(.13, .52, .13), M(0xF5F5F5)); neck.position.set(.2, 1.05, 0); g.add(neck);
    const head = new THREE.Mesh(B(.2, .18, .18), M(0xF5F5F5)); head.position.set(.22, 1.4, 0); g.add(head);
    const crown = new THREE.Mesh(B(.14, .1, .12), M(0xFF2222)); crown.position.set(.2, 1.54, 0); g.add(crown);
    const beak = new THREE.Mesh(B(.24, .06, .06), M(0x556655)); beak.position.set(.36, 1.4, 0); g.add(beak);
    [-.2, .2].forEach(z => { const wingTip = new THREE.Mesh(B(.18, .04, .38), M(0x111111)); wingTip.position.set(-.12, .78, z); g.add(wingTip); });
    [-.1, .1].forEach(z => { const leg = new THREE.Mesh(B(.07, .65, .07), M(0x8B1A1A)); leg.position.set(0, .3, z); g.add(leg); });
    [-.08, .08].forEach(z => { const eye = new THREE.Mesh(B(.07, .07, .07), M(0x111111)); eye.position.set(.32, 1.43, z); g.add(eye); });

  } else if (type === 'salmon') {
    // 연어: 은분홍 대형 어류 + 반점
    const body = new THREE.Mesh(B(.75, .38, .32), M(0xC8A0A0)); body.position.set(0, .5, 0); g.add(body);
    const head = new THREE.Mesh(B(.3, .34, .28), M(0xAA8888)); head.position.set(.46, .5, 0); g.add(head);
    const tail = new THREE.Mesh(B(.28, .34, .14), M(0xBB9090)); tail.position.set(-.5, .5, 0); g.add(tail);
    const dorsal = new THREE.Mesh(B(.22, .22, .06), M(0xAA8888)); dorsal.position.set(.05, .72, 0); g.add(dorsal);
    [[-.1, .14], [.12, .14]].forEach(([bx, bz]) => { const spot = new THREE.Mesh(B(.1, .1, .06), M(0x882222)); spot.position.set(bx, .56, bz); g.add(spot); });
    const seye = new THREE.Mesh(B(.09, .09, .09), M(0x111111)); seye.position.set(.58, .55, .15); g.add(seye);

  } else if (type === 'raccoon') {
    // 너구리: 회색 + 검은 눈 마스크 + 줄무늬 꼬리
    const body = new THREE.Mesh(B(.56, .4, .46), M(0x9E9E9E)); body.position.set(0, .38, 0); g.add(body);
    const head = new THREE.Mesh(B(.34, .3, .32), M(0xBBBBBB)); head.position.set(.4, .66, 0); g.add(head);
    [-.1, .1].forEach(z => { const mask = new THREE.Mesh(B(.16, .14, .06), M(0x2C2C2C)); mask.position.set(.55, .68, z); g.add(mask); });
    const snout = new THREE.Mesh(B(.14, .14, .22), M(0xDDDDDD)); snout.position.set(.56, .63, 0); g.add(snout);
    [-.12, .12].forEach(z => { const ear = new THREE.Mesh(B(.12, .16, .08), M(0xBBBBBB)); ear.position.set(.32, .88, z); g.add(ear); });
    const rtail = new THREE.Mesh(B(.12, .04, .35), M(0x9E9E9E)); rtail.position.set(-.32, .42, 0); rtail.rotation.z = .35; g.add(rtail);
    [.04, -.04].forEach(dy => { const stripe = new THREE.Mesh(B(.14, .05, .16), M(0x333333)); stripe.position.set(-.32, .42 + dy, 0); stripe.rotation.z = .35; g.add(stripe); });
    [[-1, -.14], [1, -.14], [-1, .14], [1, .14]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.12, .3, .12), M(0x777777)); leg.position.set(sx * .2, .18, sz); g.add(leg);
    });
    [-.09, .09].forEach(z => { const eye = new THREE.Mesh(B(.08, .08, .08), M(0x111111)); eye.position.set(.56, .7, z); g.add(eye); });

  } else if (type === 'kestrel') {
    // 황조롱이: 주황갈색 날개 + 회색 머리 + 갈고리 부리
    const body = new THREE.Mesh(B(.42, .28, .32), M(0xBF6030)); body.position.set(0, .43, 0); g.add(body);
    const head = new THREE.Mesh(B(.22, .22, .2), M(0x8090A0)); head.position.set(.3, .64, 0); g.add(head);
    const beak = new THREE.Mesh(B(.1, .08, .07), M(0xFFDD00)); beak.position.set(.42, .65, 0); beak.rotation.z = -.2; g.add(beak);
    [-.16, .16].forEach(z => { const wing = new THREE.Mesh(B(.46, .04, .22), M(0xBF6030)); wing.position.set(0, .46, z); wing.rotation.z = -.1; g.add(wing); });
    [-.1, .1].forEach(z => { const tip = new THREE.Mesh(B(.14, .04, .14), M(0x222222)); tip.position.set(.05, .42, z > 0 ? .2 : -.2); g.add(tip); });
    const ktail = new THREE.Mesh(B(.18, .04, .28), M(0xBF6030)); ktail.position.set(-.3, .38, 0); g.add(ktail);
    [-.08, .08].forEach(z => { const eye = new THREE.Mesh(B(.07, .07, .07), M(0x111111)); eye.position.set(.4, .67, z); g.add(eye); });

  } else if (type === 'bear') {
    // 반달가슴곰: 대형 검은 몸통 + 흰 초승달 가슴 + 갈색 코
    const body = new THREE.Mesh(B(.85, .58, .7), M(0x111111)); body.position.set(0, .48, 0); g.add(body);
    const chest = new THREE.Mesh(B(.5, .2, .14), M(0xFFFFFF)); chest.position.set(.1, .7, 0); g.add(chest);
    const head = new THREE.Mesh(B(.5, .44, .48), M(0x111111)); head.position.set(.42, .92, 0); g.add(head);
    const snout = new THREE.Mesh(B(.28, .22, .28), M(0x5C3D2E)); snout.position.set(.62, .86, 0); g.add(snout);
    [-.18, .18].forEach(z => { const ear = new THREE.Mesh(B(.18, .18, .1), M(0x111111)); ear.position.set(.3, 1.22, z); g.add(ear); });
    [[-1, -.18], [1, -.18], [-1, .18], [1, .18]].forEach(([sx, sz]) => {
      const leg = new THREE.Mesh(B(.2, .38, .2), M(0x111111)); leg.position.set(sx * .28, .2, sz); g.add(leg);
    });
    [-.1, .1].forEach(z => { const eye = new THREE.Mesh(B(.1, .1, .1), M(0x331100)); eye.position.set(.58, .98, z); g.add(eye); });

  } else if (type === 'sparrow') {
    // 참새: 작은 갈색 새
    const body = new THREE.Mesh(B(.35, .18, .22), M(0xA0722A)); body.position.set(0, .42, 0); g.add(body);
    const head = new THREE.Mesh(B(.2, .18, .18), M(0x8B6914)); head.position.set(.22, .54, 0); g.add(head);
    const beak = new THREE.Mesh(B(.1, .05, .05), M(0xDDAA00)); beak.position.set(.34, .56, 0); g.add(beak);
    [-.1, .1].forEach(z => { const wing = new THREE.Mesh(B(.3, .04, .18), M(0x8B6914)); wing.position.set(-.04, .45, z); wing.rotation.z = -.1; g.add(wing); });
    const spwtail = new THREE.Mesh(B(.18, .03, .18), M(0x8B6914)); spwtail.position.set(-.2, .38, 0); g.add(spwtail);
    [-.06, .06].forEach(z => { const eye = new THREE.Mesh(B(.06, .06, .06), M(0x111111)); eye.position.set(.32, .56, z); g.add(eye); });
  } else if (type === 'officer_city') {
    // 시청 공무원 박 주임: 정장 입은 인간형 3D 모델링
    const body = new THREE.Mesh(B(.46, .7, .38), M(0x334455)); body.position.y = .35; g.add(body);
    const head = new THREE.Mesh(B(.32, .32, .32), M(0xffd1a9)); head.position.set(0, .88, 0); g.add(head);
    const glasses = new THREE.Mesh(B(.35, .06, .04), M(0x111111)); glasses.position.set(.18, .9, 0); g.add(glasses);
    const hair = new THREE.Mesh(B(.34, .1, .34), M(0x222222)); hair.position.set(0, 1.02, 0); g.add(hair);
    const bag = new THREE.Mesh(B(.1, .28, .36), M(0x5c4033)); bag.position.set(-.28, .35, .15); g.add(bag);
    [[-.12, -.08], [.12, -.08]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(B(.14, .4, .14), M(0x222222)); leg.position.set(lx, .0, lz); g.add(leg);
    });
  } else if (type === 'owner_park') {
    // 펜션 주인 박씨: 펜션 사장님 3D 모델링
    const body = new THREE.Mesh(B(.5, .7, .4), M(0x2244aa)); body.position.y = .35; g.add(body);
    const head = new THREE.Mesh(B(.35, .35, .35), M(0xffd1a9)); head.position.set(0, .88, 0); g.add(head);
    const hatBase = new THREE.Mesh(B(.52, .03, .52), M(0xddaa55)); hatBase.position.set(0, 1.06, 0); g.add(hatBase);
    const hatCrown = new THREE.Mesh(B(.28, .14, .28), M(0xddaa55)); hatCrown.position.set(0, 1.15, 0); g.add(hatCrown);
    const glasses = new THREE.Mesh(B(.38, .08, .04), M(0x111111)); glasses.position.set(.18, .9, 0); g.add(glasses);
    [[-.14, -.1], [.14, -.1]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(B(.15, .4, .15), M(0x333333)); leg.position.set(lx, .0, lz); g.add(leg);
    });
  } else if (type === 'mandarin_fish') {
    // 쏘가리 쏘야: 갈자갈색 3D 표범무늬 물고기 모델링
    const body = new THREE.Mesh(B(.8, .45, .3), M(0xc2b280)); body.position.y = .45; g.add(body);
    const head = new THREE.Mesh(B(.28, .36, .26), M(0xaa9a6a)); head.position.set(.46, .45, 0); g.add(head);
    const tail = new THREE.Mesh(B(.28, .38, .1), M(0xc2b280)); tail.position.set(-.5, .45, 0); g.add(tail);
    const dorsal = new THREE.Mesh(B(.38, .22, .06), M(0x8b7355)); dorsal.position.set(.05, .72, 0); g.add(dorsal);
    const seye = new THREE.Mesh(B(.08, .08, .08), M(0x111111)); seye.position.set(.58, .5, .14); g.add(seye);
    [[-.15, .16], [.1, .16], [-.3, -.16]].forEach(([spotX, spotZ]) => {
      const spot = new THREE.Mesh(B(.12, .12, .04), M(0x5c4033)); spot.position.set(spotX, .5, spotZ); g.add(spot);
    });
  }

  g.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; c.userData.agr = g; } });
  return g;
}

function placeAnimal(x, y, z, type, isInjured = false) {
  const group = buildAnimal(type, isInjured);
  group.position.set(x, y, z); scene.add(group);
  const angle = Math.random() * Math.PI * 2;
  animalData.push({ type, x, y, z, group, isInjured, angle, targetAngle: angle });
  QuestManager.check();
}

function removeAnimalAt(a) {
  const i = animalData.indexOf(a);
  if (i !== -1) { scene.remove(animalData[i].group); animalData.splice(i, 1); QuestManager.check(); }
}

function getVisualTopY(x, z) {
  const gy = getTopY(Math.round(x), Math.round(z));
  const underBlock = gridData[bk(Math.round(x), gy - 1, Math.round(z))];
  if (underBlock) {
    const t = underBlock.split('_')[0];
    if (t === 'grass' || t === 'straw' || getBlockData(t)?.category === 'plant' || getBlockData(t)?.category === 'seed' || getBlockData(t)?.category === 'resource') return (gy - 1) + 0.2;
  }
  return gy;
}

function isSolid(rawType) {
  if (!rawType) return false;
  if (isDecorativeType(rawType)) return false;
  const def = getBlockData(rawType);
  return def && def.solid;
}

function isLevel3BarrierBlock(rawType) {
  if (!rawType || isDecorativeType(rawType)) return false;
  return !!isSolid(rawType);
}

function isLevel3BarrierAt(x, z) {
  const ix = Math.round(x);
  const iz = Math.round(z);
  const surfaceY = getH(ix, iz);
  const topY = getTopY(ix, iz) - 1;

  for (let y = topY; y > surfaceY && y >= topY - 4; y--) {
    if (isLevel3BarrierBlock(gridData[bk(ix, y, iz)])) return true;
  }
  return false;
}

function isLevel3BarrierNear(x, z, radius = 0.68) {
  const side = radius;
  const diag = radius * 0.7;
  const samples = [
    [0, 0],
    [side, 0],
    [-side, 0],
    [0, side],
    [0, -side],
    [diag, diag],
    [-diag, diag],
    [diag, -diag],
    [-diag, -diag]
  ];
  return samples.some(([dx, dz]) => isLevel3BarrierAt(x + dx, z + dz));
}

function analyzeHabitat(sx, sz) {
  const v = new Set(), q = [[sx, sz]]; v.add(`${sx},${sz}`);
  let count = 0, grassCount = 0;
  while (q.length) {
    count++; if (count > 2000) return { enclosed: false, grass: 0 };
    const [cx, cz] = q.shift();
    const topY = getTopY(cx, cz) - 1;
    const rawType = gridData[bk(cx, topY, cz)];
    const floorType = rawType ? rawType.split('_')[0] : '';
    if (floorType === 'grass' || floorType === 't_low' || floorType === 't_mid') grassCount++;
    for (const [nx, nz] of [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]]) {
      const nk = `${nx},${nz}`; if (v.has(nk)) continue;
      const blocked = [0, 1].some(hy => { const b = gridData[bk(nx, topY + 1 + hy, nz)]; return isSolid(b); });
      if (!blocked) { v.add(nk); q.push([nx, nz]); }
    }
  }
  return { enclosed: true, grass: grassCount };
}

function updateAnimals(t) {
  for (const a of animalData) {
    if (pickedAnimal && pickedAnimal.entry === a) {
      // 들고 있는 동물: orbitTarget 추종, 지면에서 정확히 1블록 위 부유
      const ox = orbitTarget.x, oz = orbitTarget.z;
      a.group.position.set(ox, getH(Math.round(ox), Math.round(oz)) + 1, oz);
      a.group.rotation.y = t * 2;
      continue;
    }
    if (a.type === 'fish' || a.type === 'salmon' || a.type === 'mandarin_fish') updateFish(a, t);
    else if (a.type === 'sheep') updateSheep(a, t);
    else if (a.type === 'horse') updateHorse(a, t);
    else if (a.type === 'goat') updateGoat(a, t);
    else if (a.type === 'bullfrog' || a.type === 'toad') updateFrog(a, t);
    else if (a.type === 'bat') updateBat(a, t);
    else if (a.type === 'bee') updateBee(a, t);
    else if (a.type === 'crane') updateCrane(a, t);
    else if (a.type === 'fox') updateFox(a, t);
    else if (a.type === 'dog') updateWildDog(a, t);
    else if (a.type === 'owner_park') updateOwnerPark(a, t);
    else if (a.type === 'raccoon') updateRaccoon(a, t);
    else if (a.type === 'kestrel') updateKestrel(a, t);
    else if (a.type === 'bear') updateBear(a, t);
    else if (a.type === 'officer_city') updateOfficerCity(a, t);
    else updateDefaultAnimal(a, t);
  }
}

function updateOwnerPark(a, t) {
  a.group.position.set(a.x, a.y + Math.sin(t * 1.5) * 0.02, a.z);
  a.group.rotation.y = a.angle + Math.sin(t * 0.8) * 0.25;
}

function updateOfficerCity(a, t) {
  a.group.position.set(a.x, a.y + Math.sin(t * 1.2) * 0.015, a.z);
  a.group.rotation.y = a.angle + Math.sin(t * 0.5) * 0.15;
}

function updateRaccoon(a, t) {
  // 쓰레기에 갇혀있을 때
  if (typeof level5_conditions !== 'undefined' && !level5_conditions.raccoonRescued) {
    a.group.position.set(a.x, a.y + Math.abs(Math.sin(t * 12)) * 0.15, a.z);
    a.group.rotation.z = Math.sin(t * 15) * 0.15;
    return;
  }
  
  // 구출되었을 때
  if (typeof level5_conditions !== 'undefined' && level5_conditions.raccoonRescued) {
    // 생태 육교가 완성되었을 때: 다리 건너 안전지대로 이동
    if (level5_conditions.viaductConnected) {
      const tx = -60, tz = 95; // 생태 육교 건너 하천 숲 안전지대
      const dx = tx - a.x, dz = tz - a.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 1.0) {
        const spd = 0.025;
        a.x += dx / dist * spd;
        a.z += dz / dist * spd;
        a.targetAngle = Math.atan2(-dz, dx);
      } else {
        // 도착: 가볍게 서성임
        if (Math.random() < 0.01) a.targetAngle = a.angle + (Math.random() - 0.5) * 1.5;
      }
    } else {
      // 생태 육교가 없을 때는 도로 근처(Z=70)를 무서워하며 배회
      const cX = -60, cZ = 70;
      const dist = Math.hypot(a.x - cX, a.z - cZ);
      if (dist > 6) {
        a.targetAngle = Math.atan2(cZ - a.z, a.x - cX);
      } else if (Math.random() < 0.02) {
        a.targetAngle = a.angle + (Math.random() - 0.5) * 2;
      }
      const spd = 0.012;
      a.x += Math.cos(a.angle) * spd;
      a.z -= Math.sin(a.angle) * spd;
    }
  }

  let diff = a.targetAngle - a.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  a.angle += diff * 0.08;

  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.abs(Math.sin(t * 5.0)) * 0.05, a.z);
  a.group.rotation.y = a.angle;
  a.group.rotation.z = 0;
}

let level5CityGroup = null;

function createWorldTextSprite(text, width = 256, height = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(20, 25, 32, 0.84)';
  ctx.fillRect(10, 30, width - 20, height - 60);
  ctx.strokeStyle = '#f7d35c';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 30, width - 20, height - 60);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(2.4, 1.15, 1);
  return sprite;
}

function clearLevel5MissionScene() {
  if (level5CityGroup) {
    scene.remove(level5CityGroup);
    level5CityGroup = null;
  }

  const missionTypes = new Set(['raccoon', 'kestrel', 'officer_city']);
  for (let i = animalData.length - 1; i >= 0; i--) {
    if (missionTypes.has(animalData[i].type)) {
      scene.remove(animalData[i].group);
      animalData.splice(i, 1);
    }
  }

  for (const [key, type] of Object.entries(gridData)) {
    if (type === 'city_trash' || type === 'viaduct' || type === 'biotope' || type === 'wildlife_tunnel') {
      if (meshByKey[key]) scene.remove(meshByKey[key]);
      delete meshByKey[key];
      delete gridData[key];
      deletedBlocks.delete(key);
    }
  }
}

function buildLevel5CityScene() {
  if (level5CityGroup) scene.remove(level5CityGroup);
  const group = new THREE.Group();
  group.userData = { isLevel5CityScenery: true };

  const mat = color => new THREE.MeshLambertMaterial({ color });
  const basic = color => new THREE.MeshBasicMaterial({ color });
  const addBox = (w, h, d, x, y, z, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // 실제 미션 판정용 도로 바닥. Z=74~78은 생태 육교가 반드시 건너야 하는 핵심 도로 구간이다.
  for (let x = -63; x <= -27; x++) {
    for (let z = 72; z <= 81; z++) {
      const y = Math.max(getTopY(x, z) - 1, getH(x, z));
      _place(x, y, z, 'stone');
      addBox(1.02, 0.08, 1.02, x, y + 0.55, z, mat(0x2f3338));
    }
  }

  // 차선, 중앙선, 횡단보도. 도로가 도시로 읽히는 최소 시각 요소다.
  for (let x = -62; x <= -28; x += 3) {
    [74, 76, 78].forEach(z => {
      const y = getTopY(x, z) - 0.38;
      addBox(1.2, 0.04, 0.11, x, y, z, basic(0xf1f1d8));
    });
  }
  for (let x = -54; x <= -50; x++) {
    for (let z = 72; z <= 81; z += 2) {
      const y = getTopY(x, z) - 0.34;
      addBox(0.75, 0.05, 0.82, x, y, z, basic(0xffffff));
    }
  }

  // 양쪽 인도와 가드레일.
  for (let x = -63; x <= -27; x++) {
    [71, 82].forEach(z => {
      const y = Math.max(getTopY(x, z), getH(x, z) + 1);
      addBox(1.0, 0.22, 1.0, x, y - 0.36, z, mat(0x8c8f94));
      if (x % 3 === 0) addBox(0.12, 0.8, 0.12, x, y + 0.12, z, mat(0xd5d8dc));
    });
  }

  // 시청 건물과 박 주임이 서 있는 앞마당.
  for (let x = -53; x <= -47; x++) {
    for (let z = 64; z <= 68; z++) {
      const y = Math.max(getTopY(x, z) - 1, getH(x, z));
      _place(x, y, z, 'stone');
      addBox(1.04, 0.08, 1.04, x, y + 0.55, z, mat(0x6f7882));
    }
  }
  const hallBaseY = Math.max(getTopY(-50, 63), getH(-50, 63) + 1);
  addBox(7.4, 0.26, 3.8, -50, hallBaseY - 0.2, 62.7, mat(0x58616a));
  addBox(6.2, 4.2, 3.0, -50, hallBaseY + 1.9, 62.2, mat(0x9fb0bd));
  addBox(6.8, 0.35, 3.4, -50, hallBaseY + 4.2, 62.2, mat(0x45505a));
  for (let dx = -2; dx <= 2; dx += 2) {
    for (let floor = 0; floor < 3; floor++) {
      addBox(0.72, 0.48, 0.08, -50 + dx, hallBaseY + 1.05 + floor * 1.05, 63.74, basic(0x88d8ff));
    }
  }
  const cityHallLabel = createWorldTextSprite('시청', 192, 104);
  cityHallLabel.position.set(-50, hallBaseY + 5.0, 64.1);
  group.add(cityHallLabel);

  // 옥상 비오톱 미션이 이해되도록 고층 빌딩을 더 분명히 만든다.
  const towerBaseY = Math.max(getTopY(-40, 80), getH(-40, 80) + 1);
  const roofY = Math.max(40, towerBaseY + 8);
  for (let y = towerBaseY; y <= roofY; y++) {
    for (let x = -42; x <= -38; x++) {
      for (let z = 78; z <= 82; z++) {
        const isWall = x === -42 || x === -38 || z === 78 || z === 82;
        const isRoof = y === roofY;
        const isCore = Math.abs(x + 40) <= 1 && Math.abs(z - 80) <= 1;
        if (isWall || isRoof || isCore) _place(x, y, z, 'stone');
      }
    }
  }
  addBox(5.2, 0.24, 5.2, -40, towerBaseY - 0.12, 80, mat(0x4e565f));
  addBox(4.4, Math.max(7.2, roofY - towerBaseY), 4.4, -40, towerBaseY + (roofY - towerBaseY) / 2, 80, mat(0x6e7d8a));
  addBox(4.8, 0.24, 4.8, -40, roofY + 0.22, 80, mat(0x3f474f));
  for (let floor = 0; floor < 7; floor++) {
    [-41.25, -40, -38.75].forEach(x => {
      addBox(0.42, 0.34, 0.07, x, towerBaseY + 1.0 + floor * 1.05, 82.24, basic(0x9ad7ff));
    });
  }
  const roofLabel = createWorldTextSprite('옥상 비오톱', 256, 112);
  roofLabel.position.set(-40, roofY + 1.5, 80);
  group.add(roofLabel);

  scene.add(group);
  level5CityGroup = group;
  if (typeof invalidateRayCache === 'function') invalidateRayCache();
}

function updateKestrel(a, t) {
  // 공중 선회: 빌딩 옥상정원(X: -40, Z: 80) 주변을 높이 43 부근에서 궤도 회전
  const cX = -40, cZ = 80;
  const radius = 6.0;
  const targetY = 43;

  // 시간에 따른 궤도 계산
  a.x = cX + Math.cos(t * 0.6) * radius;
  a.z = cZ + Math.sin(t * 0.6) * radius;
  a.y = targetY + Math.sin(t * 1.5) * 0.5;

  // 진행 방향(접선 방향)을 바라봄
  a.angle = -(t * 0.6) + Math.PI; // 각도 접선
  
  a.group.position.set(a.x, a.y, a.z);
  a.group.rotation.y = a.angle;
  
  // 날개 펄럭임 연출
  a.group.rotation.z = Math.sin(t * 8) * 0.15;
}

function updateBear(a, t) {
  // 반달곰: X:0, Z:-80 심장부 바이옴
  // 근처에 도토리 블록(acorn)이 있는 경우 찾아감
  let targetAcorn = null;
  let minDist = 9999;
  
  // 도토리 블록 검색
  for (const key in gridData) {
    if (gridData[key].split('_')[0] === 'acorn') {
      const [ax, ay, az] = key.split(',').map(Number);
      const dx = ax - a.x, dz = az - a.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 12 && dist < minDist) {
        minDist = dist;
        targetAcorn = { x: ax, z: az };
      }
    }
  }

  if (targetAcorn && minDist > 1.2) {
    const dx = targetAcorn.x - a.x, dz = targetAcorn.z - a.z;
    a.targetAngle = Math.atan2(-dz, dx);
    const spd = 0.012; // 무거운 반달곰의 느린 걸음
    a.x += dx / minDist * spd;
    a.z += dz / minDist * spd;
  } else {
    // 도토리가 없으면 대기 지점(0, -80) 근처 배회
    const cX = 0, cZ = -80;
    const dist = Math.hypot(a.x - cX, a.z - cZ);
    if (dist > 6) {
      a.targetAngle = Math.atan2(cZ - a.z, a.x - cX);
    } else if (Math.random() < 0.008) {
      a.targetAngle = a.angle + (Math.random() - 0.5) * 1.5;
    }
    const spd = 0.005;
    a.x += Math.cos(a.angle) * spd;
    a.z -= Math.sin(a.angle) * spd;
  }

  let diff = a.targetAngle - a.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  a.angle += diff * 0.05;

  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.15;
  a.group.position.set(a.x, a.y + Math.sin(t * 1.5 + a.x) * 0.03, a.z);
  a.group.rotation.y = a.angle;
}


function updateFish(a, t) {
  const wL = BiomeSystem.getDominantBiome(a.x, a.z).waterLevel;
  const curTopY = getVisualTopY(a.x, a.z);
  if (curTopY < wL) {
    const spd = 0.022, look = 3.5;
    const fwdY = getTopY(Math.round(a.x + Math.cos(a.angle) * look), Math.round(a.z - Math.sin(a.angle) * look));
    if (fwdY >= wL - 0.5) { const la = a.angle + Math.PI * 0.6, ra = a.angle - Math.PI * 0.6; const lY = getTopY(Math.round(a.x + Math.cos(la) * look), Math.round(a.z - Math.sin(la) * look)); const rY = getTopY(Math.round(a.x + Math.cos(ra) * look), Math.round(a.z - Math.sin(ra) * look)); a.targetAngle = (lY < rY ? la : ra) + (Math.random() - 0.5) * 0.5; }
    else if (Math.random() < 0.012) { a.targetAngle = a.angle + (Math.random() - 0.5) * 1.0; }
    let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.07;
    const nx = a.x + Math.cos(a.angle) * spd, nz = a.z - Math.sin(a.angle) * spd;
    const nY = getTopY(Math.round(nx), Math.round(nz));
    if (nY < wL) { a.x = nx; a.z = nz; } else { a.targetAngle = a.angle + Math.PI + (Math.random() - 0.5) * 0.8; }
    const depth = Math.max(0.4, wL - curTopY);
    a.group.position.set(a.x, curTopY + depth * 0.35 + Math.sin(t * 1.8 + a.x) * 0.12, a.z);
    a.group.rotation.y = a.angle; a.group.rotation.z = Math.sin(t * 2) * 0.04;
  } else {
    a.group.position.set(a.x, curTopY + 0.2 + Math.abs(Math.sin(t * 15)) * 0.3, a.z);
    a.group.rotation.z = Math.sin(t * 20) * 0.5;
  }
}

function updateSheep(a, t) {
  if (toolMode === 'action' && selItem === 'lure' && hlMesh.visible) {
    const dx = hlMesh.position.x - a.x, dz = hlMesh.position.z - a.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1.5 && dist < 12) { const ws = a.isInjured ? 0.015 : 0.04; a.x += dx / dist * ws; a.z += dz / dist * ws; a.targetAngle = Math.atan2(-dz, dx); }
  }
  let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.1;
  const aheadY = getVisualTopY(a.x + Math.cos(a.angle) * 0.4, a.z - Math.sin(a.angle) * 0.4);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.sin(t * 2.5 + a.x) * 0.06, a.z); a.group.rotation.y = a.angle; a.group.rotation.z = 0;
}

function updateHorse(a, t) {
  let clearPath = 0;
  for (let i = 1; i <= 10; i++) { if (isFenced(Math.round(a.x + Math.cos(a.angle) * i), Math.round(a.z - Math.sin(a.angle) * i))) break; clearPath = i; }
  if (clearPath >= 8) { a.x += Math.cos(a.angle) * 0.08; a.z -= Math.sin(a.angle) * 0.08; a.group.rotation.y = a.angle; }
  else { a.group.rotation.y = a.angle + Math.sin(t * 8) * 0.05; if (Math.random() < 0.02) a.angle += 0.5; }
  const aheadY = getVisualTopY(a.x + Math.cos(a.angle) * 0.4, a.z - Math.sin(a.angle) * 0.4);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.sin(t * 4.0) * 0.08, a.z); a.group.rotation.z = 0;
}

function updateGoat(a, t) {
  if (!a.escapeTimer) a.escapeTimer = 0;
  a.escapeTimer += 0.016;
  if (a.escapeTimer > 30) { a.escapeTimer = 0; const ea = Math.random() * Math.PI * 2; const tx = a.x + Math.cos(ea) * 3, tz = a.z - Math.sin(ea) * 3; if (!isFenced(Math.round(tx), Math.round(tz))) { a.x = tx; a.z = tz; toast('🐐 염소가 탈출했어요!'); } }
  if (Math.random() < 0.01) a.targetAngle = a.angle + (Math.random() - 0.5) * 2;
  let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.1;
  const aheadY = getVisualTopY(a.x + Math.cos(a.angle) * 0.4, a.z - Math.sin(a.angle) * 0.4);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.sin(t * 2.5 + a.x) * 0.06, a.z); a.group.rotation.y = a.angle; a.group.rotation.z = 0;
}

function updateDefaultAnimal(a, t) {
  let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.1;
  const aheadY = getVisualTopY(a.x + Math.cos(a.angle) * 0.4, a.z - Math.sin(a.angle) * 0.4);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.sin(t * 2.5 + a.x) * 0.06, a.z); a.group.rotation.y = a.angle; a.group.rotation.z = 0;
}

function updateFox(a, t) {
  if (typeof level3_conditions !== 'undefined' && level3_conditions.wildDogIsolated) {
    if (typeof orbitTarget !== 'undefined') {
      const dx = orbitTarget.x - a.x, dz = orbitTarget.z - a.z;
      a.targetAngle = Math.atan2(-dz, dx);
    }
  } else {
    if (typeof orbitTarget !== 'undefined') {
      const dx = orbitTarget.x - a.x, dz = orbitTarget.z - a.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8) {
        a.targetAngle = Math.atan2(dz, -dx) + (Math.random() - 0.5) * 0.4;
        const spd = 0.05;
        const nx = a.x + Math.cos(a.targetAngle) * spd;
        const nz = a.z - Math.sin(a.targetAngle) * spd;
        if (nx > -100 && nx < -60 && nz > -20 && nz < 20) {
          a.x = nx; a.z = nz;
        }
      }
    }
    if (Math.random() < 0.015) {
      a.targetAngle = a.angle + (Math.random() - 0.5) * 1.5;
    }
  }

  let diff = a.targetAngle - a.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  a.angle += diff * 0.08;

  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.sin(t * 3.5 + a.x) * 0.04, a.z);
  a.group.rotation.y = a.angle;
}

function updateWildDog(a, t) {
  const dogCenter = (typeof Level3Manager !== 'undefined' && Level3Manager.DOG_CENTER)
    ? Level3Manager.DOG_CENTER
    : { x: -70, z: -10 };
  const cX = dogCenter.x, cZ = dogCenter.z;

  if (typeof currentLevel !== 'undefined' && currentLevel === 3 &&
      typeof level3_phase !== 'undefined' && level3_phase < 2 &&
      !(typeof level3_conditions !== 'undefined' && level3_conditions.wildDogIsolated)) {
    const aheadY = getVisualTopY(a.x, a.z);
    a.y += (aheadY - a.y) * 0.25;
    a.group.position.set(a.x, a.y + Math.abs(Math.sin(t * 5)) * 0.04, a.z);
    a.group.rotation.y = a.angle + Math.sin(t * 1.4) * 0.18;
    return;
  }

  const distFromCenter = Math.hypot(a.x - cX, a.z - cZ);

  if (distFromCenter > 5) {
    a.targetAngle = Math.atan2(cZ - a.z, a.x - cX);
  } else if (Math.random() < 0.02) {
    a.targetAngle = a.angle + (Math.random() - 0.5) * 2;
  }

  let diff = a.targetAngle - a.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  a.angle += diff * 0.08;

  const spd = 0.012;
  const nx = a.x + Math.cos(a.angle) * spd;
  const nz = a.z - Math.sin(a.angle) * spd;

  const isBlocked = isLevel3BarrierNear(nx, nz, 0.72);

  if (!isBlocked) {
    a.x = nx; a.z = nz;
  } else {
    a.targetAngle = a.angle + Math.PI + (Math.random() - 0.5) * 0.8;
  }

  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.25;
  a.group.position.set(a.x, a.y + Math.abs(Math.sin(t * 8)) * 0.08, a.z);
  a.group.rotation.y = a.angle;
}

function updateFrog(a, t) {
  if (!a._frogTimer) a._frogTimer = Math.random() * 4;
  a._frogTimer += 0.016;
  if (a._frogTimer > 5 + Math.random() * 4) {
    a._frogTimer = 0;
    if (Math.random() < 0.35) {
      const da = (Math.random() - .5) * Math.PI;
      a.x += Math.cos(a.angle + da) * (0.2 + Math.random() * 0.4);
      a.z -= Math.sin(a.angle + da) * (0.2 + Math.random() * 0.4);
      a.targetAngle = a.angle + da;
    }
  }
  let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.07;
  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.15;
  a.group.position.set(a.x, a.y + Math.abs(Math.sin(t * 3 + a.x)) * 0.03, a.z);
  a.group.rotation.y = a.angle;
}

function updateBat(a, t) {
  // 박쥐: 동굴 안 고정 위치에서 살짝 흔들림
  a.group.position.set(a.x, a.y + Math.sin(t * 1.8 + a.x) * 0.05, a.z);
  a.group.rotation.y += 0.002;
}

function updateBee(a, t) {
  // 꿀벌: 공중 원형 비행
  if (!a._beeT) a._beeT = Math.random() * Math.PI * 2;
  a._beeT += 0.025;
  a.group.position.set(
    a.x + Math.cos(a._beeT * 0.8) * 0.6,
    a.y + 1.2 + Math.sin(a._beeT * 1.4) * 0.18,
    a.z + Math.sin(a._beeT * 0.8) * 0.6
  );
  a.group.rotation.y = a._beeT;
}

function updateCrane(a, t) {
  // 두루미: 우아하고 느린 이동
  if (Math.random() < 0.004) a.targetAngle = a.angle + (Math.random() - .5) * 1.0;
  let diff = a.targetAngle - a.angle; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI; a.angle += diff * 0.04;
  a.x += Math.cos(a.angle) * 0.008; a.z -= Math.sin(a.angle) * 0.008;
  const aheadY = getVisualTopY(a.x, a.z);
  a.y += (aheadY - a.y) * 0.08;
  a.group.position.set(a.x, a.y, a.z); a.group.rotation.y = a.angle;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1 렌더링 / 애니메이션 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 고목나무를 살린다.
 * 메마른 복셀을 녹색 잎 복셀으로 교체하고 영양분 파티클를 재생한다.
 * 나무 바로 밑에 '그늘 블록'(t_low)을 자동 생성한다.
 * state.js의 OldTree.updateParticles() 종료 시 호출된다.
 */
function bloomTree() {
  if (!OldTree.group) return;

  // 1) 잎 색상 전환: 회색 → 비으는 녹색
  OldTree.leaves.forEach((leaf, i) => {
    const delay = i * 120;
    setTimeout(() => {
      if (leaf.material) {
        leaf.material.color.setHex(0x228B22);
        leaf.material.needsUpdate = true;
      }
    }, delay);
  });

  // 2) 가지 각도 회복
  OldTree.branches.forEach(b => { b.rotation.z = 0.2; });

  // 3) 과일 표시
  OldTree.fruits.forEach(f => { f.visible = true; });

  // 4) 나무 바로 밑 그늘 블록 생성 (3x3 범위)
  const tx = Math.round(OldTree.group.position.x);
  const tz = Math.round(OldTree.group.position.z);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const sx = tx + dx, sz = tz + dz;
      const sy = getTopY(sx, sz);
      if (sy >= 0) _place(sx, sy, sz, 't_low'); // 그늘 효과를 위한 풍부한 풀 바닥
    }
  }

  // 5) 복수 녀욕한 녹색 파티클 이펜트
  const basePos = OldTree.group.position;
  for (let i = 0; i < 20; i++) {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x90EE90, transparent: true, opacity: 0.9 });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(
      basePos.x + (Math.random() - 0.5) * 3,
      basePos.y + 1 + Math.random() * 2,
      basePos.z + (Math.random() - 0.5) * 3
    );
    scene.add(p);
    const startY = p.position.y;
    let elapsed = 0;
    const ticker = setInterval(() => {
      elapsed += 60;
      p.position.y = startY + elapsed * 0.002;
      p.material.opacity -= 0.025;
      if (p.material.opacity <= 0) { clearInterval(ticker); scene.remove(p); }
    }, 60);
  }

  DBG('[World] 🌳 bloomTree() 실행 — 그늘 블록 생성 완료');
}

/**
 * 무당볼레를 생성하고 진딧물 파티클을 종료한다.
 * CompanionPlant 승리 시 systems.js의 LadybugSystem.summon()에서 호출된다.
 * 이미 LadybugSystem이 모델을 관리하므로 이 함수는 AphidSystem을 정리하는 래퍼로 동작한다.
 */
function spawnLadybugAndClearAphids() {
  // AphidSystem 파티클 메쉬 정리
  if (typeof AphidSystem !== 'undefined') {
    AphidSystem.meshes.forEach(m => scene.remove(m));
    AphidSystem.meshes = [];
    AphidSystem.active = false;
  }

  // 무당볼레 대신 화려한 빨간 파티클 이펜트 (LadybugSystem이 3D 모델을 이미 취급)
  if (typeof LadybugSystem !== 'undefined' && LadybugSystem.mesh) {
    const pos = LadybugSystem.mesh.position.clone();
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xFF4444, transparent: true, opacity: 1.0 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x + (Math.random() - 0.5), pos.y + Math.random() * 0.5, pos.z + (Math.random() - 0.5));
      scene.add(p);
      let e = 0;
      const t = setInterval(() => {
        e += 60; p.position.y += 0.015; p.material.opacity -= 0.04;
        if (p.material.opacity <= 0) { clearInterval(t); scene.remove(p); }
      }, 60);
    }
  }
  DBG('[World] 🐞 spawnLadybugAndClearAphids() 실행 — 진딧물 제거 완료');
}

/**
 * 말 NPC를 화면 바깥 시작점에서 풍반 지정 위치로 이동시킨다.
 * 페이즈 3에서 타이타니음(Phase3System):
 * horseSpace === true 후 QuestManager.check()가 호출할 수 있도록 설계.
 *
 * @param {{ x:number, z:number }} targetPos - 도착 위치
 */
function animateHorseReturn(targetPos = { x: 10, z: 3 }) {
  // Phase3System에서 타는 말 메시 활용
  const horse = (typeof Phase3System !== 'undefined') ? Phase3System.horseMesh : null;
  if (!horse) {
    console.warn('[World] animateHorseReturn: horseMesh 없음');
    return;
  }

  // 화면 외부에서 시작
  horse.position.set(targetPos.x - 30, horse.position.y, targetPos.z);
  scene.add(horse);

  const targetY = getVisualTopY(targetPos.x, targetPos.z);
  const startTime = Date.now();
  const DURATION = 3000; // ms

  const tick = setInterval(() => {
    const prog = Math.min((Date.now() - startTime) / DURATION, 1);
    const ease = 1 - Math.pow(1 - prog, 3); // easeOutCubic

    horse.position.x = (targetPos.x - 30) + ease * 30;
    horse.position.y = targetY + Math.abs(Math.sin(prog * Math.PI * 6)) * 0.3; // 말 발바닥 리듬
    horse.position.z = targetPos.z;
    horse.rotation.y = -Math.PI / 2; // 오른쪽에서 들어오는 방향

    if (prog >= 1) {
      clearInterval(tick);
      toast('💨 말이 달려있어요! 별들이 하나두 돌아오고 있어요~');
      DBG('[World] animateHorseReturn() 에니메이션 완료');
    }
  }, 16);
}

/**
 * 수호대 합류 연출을 재생한다.
 * state.js의 checkLevel1Clear() 또는 global_protectors가 true로 설정될 때 호출한다.
 *
 * @param {'bee'|'swallow'|'sheep'} animalType - 합류 연출할 동물 종류
 */
function playProtectorJoinEffect(animalType) {
  const config = {
    bee: { emoji: '🐝', color: 0xFFD700, spawnX: -5, spawnZ: 3, targetX: 8, targetZ: 4, msg: '🐝 꿀벌이 가든히 관리하던 벌집으로 돌아왔어요!' },
    swallow: { emoji: '🐦', color: 0x4FC3F7, spawnX: 16, spawnZ: -5, targetX: 8, targetZ: 9, msg: '🐦 제비가 시녀한 진흙 둥지를 짐고 돌아왔어요!' },
    sheep: { emoji: '🐑', color: 0xE8E8E8, spawnX: -3, spawnZ: 10, targetX: 5, targetZ: 5, msg: '🐑 양이 그늘지고 시원한 고목나무 아래로 옓삼밈습니다!' }
  };
  const cfg = config[animalType];
  if (!cfg) return;

  // 이모지 스프라이트로 동물 등장
  const sprite = (typeof createEmojiSprite === 'function')
    ? createEmojiSprite(cfg.emoji)
    : new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: cfg.color }));

  const startY = getVisualTopY(cfg.spawnX, cfg.spawnZ) + 2;
  sprite.position.set(cfg.spawnX, startY, cfg.spawnZ);
  sprite.scale.set(2, 2, 1);
  scene.add(sprite);

  const startTime = Date.now();
  const DURATION = 2800;
  const targetY = getVisualTopY(cfg.targetX, cfg.targetZ) + 1.2;

  const tick = setInterval(() => {
    const prog = Math.min((Date.now() - startTime) / DURATION, 1);
    const ease = 1 - Math.pow(1 - prog, 2); // easeOutQuad

    sprite.position.x = cfg.spawnX + (cfg.targetX - cfg.spawnX) * ease;
    sprite.position.z = cfg.spawnZ + (cfg.targetZ - cfg.spawnZ) * ease;
    sprite.position.y = startY + (targetY - startY) * ease + Math.sin(prog * Math.PI * 4) * 0.5;

    if (prog >= 1) {
      clearInterval(tick);
      // 화려한 파티클 발사
      for (let i = 0; i < 12; i++) {
        const geo = new THREE.SphereGeometry(0.12, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 1.0 });
        const p = new THREE.Mesh(geo, mat);
        const angle = (i / 12) * Math.PI * 2;
        p.position.set(
          cfg.targetX + Math.cos(angle) * 1.5,
          targetY + 0.5,
          cfg.targetZ + Math.sin(angle) * 1.5
        );
        scene.add(p);
        let e = 0;
        const t = setInterval(() => {
          e += 60; p.position.y += 0.04; p.material.opacity -= 0.04;
          if (p.material.opacity <= 0) { clearInterval(t); scene.remove(p); }
        }, 60);
      }
      toast(cfg.msg);
      DBG(`[World] playProtectorJoinEffect('${animalType}') 완료`);
      // 2초 후 스프라이트 정리
      setTimeout(() => scene.remove(sprite), 2000);
    }
  }, 16);
}

/**
 * 레벨 1 클리어 시 맵의 안개(Fog)를 조정하여
 * '다양성의 숲' 구역을 시각적으로 해금한다.
 * state.js의 checkLevel1Clear()에서 'level1Cleared' 이벤트를 수신하면 호출.
 */
function clearLevelFog() {
  if (!scene.fog) {
    console.warn('[World] clearLevelFog: scene.fog가 없음 — 파라미터 조정 볼수 없음');
    return;
  }

  const STEPS = 60;
  let step = 0;
  const initFar = scene.fog.far ?? 120;
  const initNear = scene.fog.near ?? 50;
  const targetFar = 300;
  const targetNear = 150;

  const tick = setInterval(() => {
    step++;
    const t = step / STEPS;
    scene.fog.near = initNear + (targetNear - initNear) * t;
    scene.fog.far = initFar + (targetFar - initFar) * t;

    if (step >= STEPS) {
      clearInterval(tick);
      // 다양성의 숲 구역 프리븷 청크 시각화 (현재 비활성 청크 로드)
      const diversityForest = BIOME_CONFIG.diversity_forest;
      if (diversityForest) {
        const fx = Math.floor(diversityForest.centerX / CHUNK);
        const fz = Math.floor(diversityForest.centerZ / CHUNK);
        if (chunkState[ck(fx, fz)] !== 'active') {
          chunkState[ck(fx, fz)] = 'visible';
          bldPreview(fx, fz);
        }
      }
      DBG('[World] clearLevelFog() 완료 — 다양성의 숲 해금');
      toast('🌟 다양성의 숲 구역이 해금되었어요!');
    }
  }, 50); // ~3초 전환
}

// 레벨 1 클리어 이벤트 수신 등록
document.addEventListener('level1Cleared', () => {
  DBG('[World] level1Cleared 이벤트 수신 — clearLevelFog() 호출');
  clearLevelFog();

  // 안개 전환(3초) 후 레벨 2 시작
  setTimeout(() => {
    currentLevel = 2;
    DBG('[World] currentLevel → 2, 레벨2 요소 스폰');
    spawnLevel2WhiteBoxElements();
    // ── Level2Manager 초기화 (미션 패널 표시 및 phase 진행) ──
    if (typeof Level2Manager !== 'undefined') {
      Level2Manager.init();
    }
  }, 3200); // clearLevelFog의 STEPS(60) × 50ms = 3000ms + 여유 200ms
});

// phaseAdvanced 이벤트 수신: Phase 4 시작 시 bloomTree() 자동 호출
document.addEventListener('phaseAdvanced', (e) => {
  if (e.detail && e.detail.next === 4) {
    DBG('[World] Phase 4 시작 — bloomTree() 호출');
    setTimeout(() => bloomTree(), 2600); // 지령이 미니게임 종료 후
  }
});

// 레벨 3 클리어 이벤트 수신 등록
document.addEventListener('level3Cleared', () => {
  DBG('[World] level3Cleared 이벤트 수신 — 강의 근원지(Level 4) 해금');
  clearLevelFog();
});

// ──────────────────────────────────────────────
// 화이트박스용 동물 스폰 테스트 함수
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// 화이트박스용 동물 스폰 (diversity_forest 바이옴 내부)
// diversity_forest: centerX=80, centerZ=0, radius=30
// ──────────────────────────────────────────────
function spawnLevel2WhiteBoxElements() {
  // 황소개구리 격리 BFS 구역(cx=7-9, cz=0-2), 수달 댐, 두꺼비 목표지, 박쥐 동굴을 사전 활성화
  // BFS가 비활성 청크를 벽으로 처리하므로, 격리 판정에 필요한 모든 청크를 미리 로드해야 한다
  for (let cx = 7; cx <= 9; cx++) {
    for (let cz = 0; cz <= 2; cz++) {
      activateChunk(cx, cz);
    }
  }
  activateChunk(11, -2);

  // ── 동물 스폰 시 각 좌표의 청크를 먼저 활성화 ──────────────
  // getH가 비활성 청크에서 -1을 반환하면 동물이 지표면 아래(y≈0)에 박혀 보이지
  // 않게 되는 문제를 방지한다 (예: 두꾸 청크 (11,-1) 누락 사례).
  const ensureChunk = (x, z) => activateChunk(Math.floor(x / CHUNK), Math.floor(z / CHUNK));

  // 황소개구리 (외래종) — 격리 연못 지정 구역: X=66~74, Z=8~16
  const bfX = 70, bfZ = 12;
  ensureChunk(bfX, bfZ);
  placeAnimal(bfX, getH(bfX, bfZ) + 1, bfZ, 'bullfrog');

  // 두꺼비 두꾸 (토착종) — 숲 동쪽 바위지대
  const tdX = 88, tdZ = -8;
  ensureChunk(tdX, tdZ);
  placeAnimal(tdX, getH(tdX, tdZ) + 1, tdZ, 'toad');
  DBG(`[Level2] 두꾸 스폰: (${tdX},${tdZ}) Y=${getH(tdX, tdZ) + 1}`);

  // 수달 — 댐 동쪽 바로 옆 (x=62, z=14: 댐에서 4칸 떨어진 하류)
  const otX = 62, otZ = 14;
  ensureChunk(otX, otZ);
  placeAnimal(otX, getH(otX, otZ) + 1, otZ, 'otter');

  // 새끼 박쥐 — 숲 북동쪽 동굴 (지표+2: 천장 아래)
  const btX = 92, btZ = -10;
  ensureChunk(btX, btZ);
  placeAnimal(btX, getH(btX, btZ) + 2, btZ, 'bat');

  DBG('[Level2] 스폰 완료 — 황소개구리(70,12) 두꾸(88,-8) 수달(62,14) 박쥐(92,-10)');

  // ── 수달 물길 댐 블록 배치 (플레이어가 삽으로 제거해야 할 흙 3개) ──────────
  // x=58 라인이 SOURCE(55,18)→TARGET(63,12) 경로를 가로막음
  const DAM_XZ = [{x:58,z:13},{x:58,z:14},{x:58,z:15}];
  const damCells = [];
  for (const {x, z} of DAM_XZ) {
    const dy = getTopY(x, z);
    _place(x, dy, z, 'dirt');
    damCells.push({x, y: dy, z});
  }
  level2_conditions.waterDamCells  = damCells;
  level2_conditions.waterDamPlaced = true;

  // ── 박쥐 동굴 석벽 생성 (3×3 외곽 2층, 천장은 플레이어가 채움) ────────────
  // ROOF_Y = getH(92,-10)+3 — 플레이어가 9칸 돌 블록을 이 레이어에 채우면 달성
  const caveBaseY = Math.round(getH(btX, btZ)) + 1;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;           // 박쥐 위치는 비워둠
      _place(btX + dx, caveBaseY,     btZ + dz, 'stone');
      _place(btX + dx, caveBaseY + 1, btZ + dz, 'stone');
    }
  }
}

// ──────────────────────────────────────────────
// 화이트박스용 동물 스폰 (river_source 바이옴 내부)
// river_source: centerX=45, centerZ=0, radius=30
// ──────────────────────────────────────────────
function spawnLevel4Animals() {
  DBG('[Level4] spawnLevel4Animals() 실행 — 강의 근원지 청크 활성화 및 동물 배치');

  const missionTypes = new Set(['mandarin_fish', 'owner_park', 'salmon', 'crane']);
  for (let i = animalData.length - 1; i >= 0; i--) {
    if (missionTypes.has(animalData[i].type)) {
      scene.remove(animalData[i].group);
      animalData.splice(i, 1);
    }
  }

  // 강 근원지 근방 청크들을 사전 로드
  for (let cx = 4; cx <= 7; cx++) {
    for (let cz = -4; cz <= 3; cz++) {
      activateChunk(cx, cz);
    }
  }

  // 1. 쏘가리 쏘야 (mandarin_fish) — 쓰레기 댐 근처에 눈에 보이도록 배치
  const soyaY = (typeof Level4Manager !== 'undefined' && typeof Level4Manager.getVisibleMissionY === 'function')
    ? Level4Manager.getVisibleMissionY(42, 20) + 0.1
    : getH(42, 20) + 1.1;
  placeAnimal(42, soyaY, 20, 'mandarin_fish');
  const soya = animalData.find(a => a.type === 'mandarin_fish');
  if (soya && soya.group) {
    soya.group.scale.set(0.6, 0.6, 0.6); // 처음엔 힘없이 작아져 있는 상태
  }

  // 2. 펜션 주인 박씨 (owner_park) — 펜션 입구 앞 고정 배치
  const ownerSpawn = (typeof Level4Manager !== 'undefined' && Level4Manager.OWNER_SPAWN)
    ? Level4Manager.OWNER_SPAWN
    : { x: 52, z: 16 };
  const owY = getVisualTopY(ownerSpawn.x, ownerSpawn.z);
  placeAnimal(ownerSpawn.x, owY, ownerSpawn.z, 'owner_park');
  const owner = animalData.find(a => a.type === 'owner_park');
  if (owner && owner.group) {
    owner.group.scale.set(1.25, 1.25, 1.25);
    owner.angle = Math.PI * 1.35;
    owner.targetAngle = owner.angle;
  }

  // 3. 연어 파닥이 (salmon) — X=45, Z=-15
  const saY = (typeof Level4Manager !== 'undefined' && typeof Level4Manager.getVisibleMissionY === 'function')
    ? Level4Manager.getVisibleMissionY(45, -15) + 0.1
    : getH(45, -15) + 1.1;
  placeAnimal(45, saY, -15, 'salmon');

  // 4. 두루미 뚜루 (crane) — X=38, Z=24
  const crY = getH(38, 24);
  placeAnimal(38, crY, 24, 'crane');

  DBG(`[Level4] 스폰 완료 — 쏘야(42,20) 박씨(${ownerSpawn.x},${ownerSpawn.z}) 연어(45,-15) 두루미(38,24)`);
}

// ──────────────────────────────────────────────
// 화이트박스용 동물 스폰 (urban_border 바이옴 내부)
// urban_border: centerX=-60, centerZ=80, radius=35
// ──────────────────────────────────────────────
function spawnLevel5Animals() {
  DBG('[Level5] spawnLevel5Animals() 실행 — 경계 도시 청크 활성화, 빌딩/도로 지형 도색 및 동물 배치');
  clearLevel5MissionScene();

  // 경계 도시 근방 청크들을 사전 로드
  for (let cx = -9; cx <= -4; cx++) {
    for (let cz = 6; cz <= 11; cz++) {
      activateChunk(cx, cz);
    }
  }

  buildLevel5CityScene();

  // 1. 너구리 라쿤이 (raccoon) — X=-60, Z=68
  const rcY = getVisualTopY(-60, 68);
  placeAnimal(-60, rcY, 68, 'raccoon');
  const raccoon = animalData.find(a => a.type === 'raccoon');
  if (raccoon && raccoon.group) {
    raccoon.group.scale.set(0.7, 0.7, 0.7); // 다쳐서 버둥거리는 아기 너구리
  }

  // 2. 황조롱이 삐루 (kestrel) — X=-40, Y=43, Z=80
  const kestrelY = Math.max(getTopY(-40, 80), 43);
  placeAnimal(-40, kestrelY, 80, 'kestrel');

  // 3. 시청 공무원 박 주임 — 시청 앞마당에 크게 배치하고 이름표를 붙인다.
  const ofY = getVisualTopY(-50, 68);
  placeAnimal(-50, ofY, 68, 'officer_city');
  const officer = animalData.find(a => a.type === 'officer_city');
  if (officer && officer.group) {
    officer.group.scale.set(1.55, 1.55, 1.55);
    officer.angle = -Math.PI / 2;
    officer.targetAngle = officer.angle;
    const label = createWorldTextSprite('박 주임', 192, 104);
    label.position.set(0, 2.25, 0);
    label.userData = { isLevel5OfficerLabel: true };
    officer.group.add(label);
  }

  DBG('[Level5] 스폰 완료 — 라쿤이(-60,68) 삐루(-40,80) 박 주임(-50,68)');

  // ── 너구리 발을 묶고 있는 도심 쓰레기 블록 3개 생성 ──────────
  const trashXZ = [{x:-60,z:67},{x:-59,z:68},{x:-61,z:69}];
  for (const {x, z} of trashXZ) {
    const dy = getTopY(x, z);
    _place(x, dy, z, 'city_trash');
  }
}

// ──────────────────────────────────────────────
// 화이트박스용 동물 스폰 (green_heart 바이옴 내부)
// green_heart: centerX=0, centerZ=-80, radius=40
// ──────────────────────────────────────────────
function spawnLevel6Animals() {
  DBG('[Level6] spawnLevel6Animals() 실행 — 초록별 심장부 청크 활성화 및 반달곰 스폰');

  // 심장부 근방 청크들을 사전 로드
  for (let cx = -4; cx <= 4; cx++) {
    for (let cz = -11; cz <= -7; cz++) {
      activateChunk(cx, cz);
    }
  }

  // 1. 지리산 반달가슴곰 웅이 (bear) — X=0, Z=-80
  const beY = getH(0, -80);
  placeAnimal(0, beY, -80, 'bear');

  DBG('[Level6] 스폰 완료 — 반달가슴곰 웅이(0,-80)');

  // ── 도토리 숲 환경 조성 ──────────
  // 반달곰 둥지 주변에 버드나무(willow)와 흙 블록들 배치
  const forestXZ = [[-5,-78], [5,-82], [-3,-84], [4,-76]];
  for (const [x, z] of forestXZ) {
    const dy = getTopY(x, z);
    _place(x, dy, z, 'willow');
  }
}

// 레벨 4 클리어 이벤트 수신 등록
document.addEventListener('level4Cleared', () => {
  DBG('[World] level4Cleared 이벤트 수신 — 경계 도시(Level 5) 해금');
  clearLevelFog();
});

// 레벨 5 클리어 이벤트 수신 등록
document.addEventListener('level5Cleared', () => {
  DBG('[World] level5Cleared 이벤트 수신 — 초록별 심장부(Level 6) 해금');
  clearLevelFog();

  // 3.2초 후 레벨 6 시작
  setTimeout(() => {
    DBG('[World] 레벨6 시작 요청');
    if (typeof window.startLevel6 === 'function') window.startLevel6();
  }, 3200);
});
