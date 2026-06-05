// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THREE.JS 씬 설정 및 메인 로직
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const canvas = document.getElementById('canvas');

function getGameViewportSize() {
  const vv = window.visualViewport;
  return {
    width: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
    height: Math.max(1, Math.round(vv ? vv.height : window.innerHeight))
  };
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const initialViewport = getGameViewportSize();
renderer.setPixelRatio(1);
renderer.setSize(initialViewport.width, initialViewport.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x87CEEB);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 35, 65);
const camera = new THREE.PerspectiveCamera(62, initialViewport.width / initialViewport.height, 0.1, 500);

const ambient = new THREE.AmbientLight(0xfff0dd, 0.52); scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff4c8, 1.1);
sun.position.set(25, 75, 18); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -65; sun.shadow.camera.right = 65;
sun.shadow.camera.bottom = -65; sun.shadow.camera.top = 65;
sun.shadow.camera.far = 180;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xaad4ff, 0.3); fill.position.set(-15, 20, -15); scene.add(fill);

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(350, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 t=vec3(.20,.48,.88),m=vec3(.46,.70,.91),r=vec3(.76,.88,.96);vec3 c=h>.15?mix(m,t,smoothstep(.15,.75,h)):mix(r,m,smoothstep(0.,.15,h));gl_FragColor=vec4(c,1.);}'
  })
));
const sunSph = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfffce0 }));
sunSph.position.set(110, 160, -150); scene.add(sunSph);

function mkCloud(x, y, z, s) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.90 });
  [[0, 0, 0, 5, 1.8, 3.5], [3, .5, 0, 3.5, 1.4, 2.8], [-3, .4, 0, 3.2, 1.3, 2.6], [.5, .8, 2, 3, 1.2, 2.2], [.5, .8, -2, 2.8, 1.1, 2]].forEach(([px, py, pz, w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(px, py, pz); g.add(m);
  });
  g.position.set(x, y, z); g.scale.setScalar(s); return g;
}
const cloudGroups = [[5, 60, -12, 1.1], [24, 65, 3, .9], [45, 58, 10, 1.3], [-4, 62, 30, 1], [20, 68, 50, 1.2], [50, 59, 44, .85], [55, 63, 20, 1], [-6, 58, 18, .8], [30, 61, -10, 1.1], [-20, 65, -30, 1.5], [-40, 58, 20, 1.2]]
  .map(([x, y, z, s]) => { const c = mkCloud(x, y, z, s); scene.add(c); return { mesh: c, bx: x, bz: z }; });

const waterDeep = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ color: 0x012040, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.FrontSide }));
waterDeep.rotation.x = -Math.PI / 2; waterDeep.position.y = WATER_LEVEL - 0.5; scene.add(waterDeep);

const waterVolume = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ color: 0x0a4b80, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.FrontSide }));
waterVolume.rotation.x = -Math.PI / 2; waterVolume.position.y = WATER_LEVEL; scene.add(waterVolume);

const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshLambertMaterial({ color: 0x4a8a30 }));
groundMesh.rotation.x = -Math.PI / 2; groundMesh.position.set(0, -0.01, 0);
groundMesh.receiveShadow = true; groundMesh.userData.isGround = true; scene.add(groundMesh);

const hlMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthTest: true }));
hlMesh.visible = false; scene.add(hlMesh);

// 하이라이트 박스 지오메트리를 미리 생성해 두고 교체만 함 (dispose+create 반복 방지)
const _hlGeoms = {
  flat: new THREE.BoxGeometry(1.02, 0.22, 1.02),
  thin: new THREE.BoxGeometry(1.02, 1.02, 0.22),
  cube: new THREE.BoxGeometry(1.02, 1.02, 1.02)
};
function updateHlMesh() {
  let key = 'cube';
  if (toolMode === 'block' || toolMode === 'seed' || toolMode === 'resource') {
    const cat = ITEM_DB[selItem]?.category;
    if (selItem === 'grass' || selItem === 'straw' || cat === 'plant' || cat === 'seed' || cat === 'resource') key = 'flat';
    else if (selItem === 'fence') key = 'thin';
  }
  if (hlMesh.geometry !== _hlGeoms[key]) hlMesh.geometry = _hlGeoms[key];
  hlMesh.rotation.y = (key === 'thin') ? currentRotation * (Math.PI / 2) : 0;
}

const raycaster = new THREE.Raycaster(), mouse2D = new THREE.Vector2(-9999, -9999);

function isFenced(x, z) {
  const rx = Math.round(x), rz = Math.round(z);
  for (let y = GH; y >= 0; y--) { const b = gridData[bk(rx, y, rz)]; if (b && b.startsWith('fence')) return true; }
  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  카메라
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const orbitTarget = new THREE.Vector3(CHUNK, 38, CHUNK);
let theta = 0.7, phi = 0.85, radius = 36;
let firstPerson = true; // 마인크래프트형 1인칭 시점 (V키로 3인칭 전환)
let cameraBobOffset = 0;
let walkBobPhase = 0;

const WALK_SPEED = 4.3;
const SPRINT_SPEED = 5.6;
const FLY_VERTICAL_SPEED = 5.2;
const JUMP_SPEED = 5.1;
const GRAVITY = 16.5;
const PLAYER_RADIUS = 0.35;
const PLAYER_EYE_HEIGHT = 1.62;
const PLAYER_STEP_HEIGHT = 1.12;
const LOOK_SENS_MOUSE = 0.00165;
const LOOK_SENS_DRAG = 0.0035;
const LOOK_SENS_TOUCH = 0.0031;

const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, ' ': false, Shift: false, Control: false };
window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; if (e.key === ' ') keys[' '] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; if (e.key === ' ') keys[' '] = false; });

function syncCam() {
  phi = Math.max(0.05, Math.min(Math.PI * 0.95, phi));
  radius = Math.max(8, Math.min(140, radius));
  // 시선 방향 단위벡터 (구면좌표)
  const dx = Math.sin(phi) * Math.sin(theta);
  const dy = Math.cos(phi);
  const dz = Math.sin(phi) * Math.cos(theta);
  if (firstPerson) {
    // 1인칭: 카메라가 곧 플레이어의 눈(orbitTarget)이며 -d 방향을 바라본다
    camera.position.set(orbitTarget.x, orbitTarget.y + cameraBobOffset, orbitTarget.z);
    camera.lookAt(orbitTarget.x - dx, orbitTarget.y + cameraBobOffset - dy, orbitTarget.z - dz);
  } else {
    // 3인칭: orbitTarget을 중심으로 radius 거리에서 공전
    camera.position.set(orbitTarget.x + radius * dx, orbitTarget.y + radius * dy, orbitTarget.z + radius * dz);
    camera.lookAt(orbitTarget);
  }
}

// 카메라의 수평 전방 단위벡터 (1인칭/3인칭 모두 동작; orbitTarget==camera 인 1인칭에서도 안전)
function camForwardFlat() {
  const wd = new THREE.Vector3();
  camera.getWorldDirection(wd);
  wd.y = 0;
  if (wd.lengthSq() < 1e-6) wd.set(-Math.sin(theta), 0, -Math.cos(theta));
  return wd.normalize();
}

function getNaturalTopY(x, z) {
  return getH(Math.round(x), Math.round(z)) + 1;
}

function getWalkingEyeY(x, z) {
  return getNaturalTopY(x, z) + PLAYER_EYE_HEIGHT;
}

function isPlayerBlockingType(type) {
  if (!type) return false;
  if (type === 'grass' || type === 'straw') return false;
  if (type.startsWith('plant_') || type.startsWith('seed_')) return false;
  if (type.startsWith('fence')) return true;
  if (type.startsWith('deco_tree') || type === 'deco_street_tree' || type === 'deco_shrub') return true;
  const def = typeof getBlockData === 'function' ? getBlockData(type) : (ITEM_DB[type] || TERRAIN_BLOCKS[type]);
  if (!def || !def.solid) return false;
  return def.category !== 'nature';
}

function getObstacleHeight(type) {
  if (!type) return 0;
  if (type.startsWith('deco_tree') || type === 'deco_street_tree') return 2.8;
  if (type === 'deco_shrub' || type === 'bush') return 1.2;
  if (type.startsWith('fence')) return 1.1;
  return 1.0;
}

function getPlayerSampleCells(x, z) {
  const r = PLAYER_RADIUS;
  const d = r * 0.72;
  const samples = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [d, d], [d, -d], [-d, d], [-d, -d]];
  return samples.map(([ox, oz]) => [Math.round(x + ox), Math.round(z + oz)]);
}

function isPlayerBlockedAt(x, z, eyeY, currentX, currentZ) {
  const currentCells = new Set(getPlayerSampleCells(currentX, currentZ).map(([cx, cz]) => `${cx},${cz}`));
  const currentNaturalTop = getNaturalTopY(currentX, currentZ);
  const bodyBottom = eyeY - PLAYER_EYE_HEIGHT;
  const bodyTop = eyeY + 0.2;

  for (const [rx, rz] of getPlayerSampleCells(x, z)) {
    const cellKey = `${rx},${rz}`;
    const naturalTop = getNaturalTopY(rx, rz);
    if (naturalTop - currentNaturalTop > PLAYER_STEP_HEIGHT && bodyBottom < naturalTop + 0.25) return true;

    for (let y = naturalTop; y <= naturalTop + 3; y++) {
      const type = gridData[bk(rx, y, rz)];
      if (!isPlayerBlockingType(type)) continue;
      if (currentCells.has(cellKey)) continue;
      const obstacleBottom = y - 0.05;
      const obstacleTop = y + getObstacleHeight(type);
      if (bodyBottom < obstacleTop && bodyTop > obstacleBottom) return true;
    }
  }

  return false;
}

function movePlayerWithCollision(dx, dz) {
  let moved = false;
  if (Math.abs(dx) > 0.0001) {
    const nextX = orbitTarget.x + dx;
    if (!isPlayerBlockedAt(nextX, orbitTarget.z, orbitTarget.y, orbitTarget.x, orbitTarget.z)) {
      orbitTarget.x = nextX;
      moved = true;
    }
  }
  if (Math.abs(dz) > 0.0001) {
    const nextZ = orbitTarget.z + dz;
    if (!isPlayerBlockedAt(orbitTarget.x, nextZ, orbitTarget.y, orbitTarget.x, orbitTarget.z)) {
      orbitTarget.z = nextZ;
      moved = true;
    }
  }
  return moved;
}

syncCam();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  인터랙션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isDragging = false, clickMoved = false, dragButton = 0;
let mouseStart = { x: 0, y: 0 }, currentMouseX = 0, currentMouseY = 0;
let digInterval = null, isHoldingPickaxe = false;
let lastClickTime = 0;
let lookPointerId = null;
let lookMoved = false;
let lookHoldTimer = null;
let lookHoldTriggered = false;
let jumpVelocity = 0;
let isGrounded = false;
let lastTouchPointerTime = 0;
let lastUpTapTime = 0;
let creativeFlight = false;
let mobileSprint = false;
const mobileMove = { x: 0, y: 0, active: false };
const TOUCH_LAYOUT_QUERY = '(pointer: coarse), (max-width: 760px), (max-height: 520px)';

const ptEl = document.getElementById('phase-transition');
const crEl = document.getElementById('creature-report');

function isUIBlocking() {
  return isOpeningActive
    || isInventoryOpen
    || WormMinigame.active
    || (ptEl && ptEl.style.display === 'flex')
    || (crEl && crEl.style.display === 'flex');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1인칭 시점 — 포인터 락 / 크로스헤어 / 시점 토글
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 포인터 락 중 상호작용에 쓸 화면 좌표 (락 상태면 화면 중앙 = 크로스헤어 지점)
function interactCoords(e) {
  if (firstPerson && document.pointerLockElement === canvas) {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: e.clientX, y: e.clientY };
}

// 커서가 필요한 모달 UI(대화·퍼즐·도감·지도 등)가 열려 있으면 포인터 락을 풀어야 한다
const _CURSOR_MODAL_IDS = [
  'inventory-overlay', 'guardian-book-overlay', 'message-log-overlay', 'map-overlay',
  'mission-clear', 'level2-clear', 'level3-clear', 'level4-clear',
  'level5-clear-overlay', 'final-ending-overlay', 'creature-report', 'grandma-popup',
  'phase-transition', 'foodchain-overlay', 'owner-dialogue-board',
  'officer-convince-popup', 'world-map-popup', 'dispatch-confirm-popup',
  'npc-dialogue-popup'
];
function needsCursor() {
  if (isUIBlocking()) return true;
  for (const id of _CURSOR_MODAL_IDS) {
    const el = document.getElementById(id);
    if (el && el.style.display !== 'none' && el.offsetParent !== null) return true;
  }
  return false;
}

// 크로스헤어 + 안내 HUD 생성
const fpCrosshair = document.createElement('div');
fpCrosshair.id = 'fp-crosshair';
fpCrosshair.textContent = '✛';
fpCrosshair.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);' +
  'font-size:26px;line-height:1;color:rgba(255,255,255,0.85);text-shadow:0 0 4px #000;' +
  'pointer-events:none;z-index:500;display:none;';
document.body.appendChild(fpCrosshair);

const fpHint = document.createElement('div');
fpHint.id = 'fp-hint';
fpHint.textContent = '🖱️ 화면을 클릭하면 마인크래프트처럼 둘러볼 수 있어요 (V: 시점 전환 · ESC: 커서)';
fpHint.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);' +
  'background:rgba(0,0,0,0.6);color:#fff;padding:6px 14px;border-radius:14px;font-size:13px;' +
  'font-family:sans-serif;pointer-events:none;z-index:500;display:none;white-space:nowrap;';
document.body.appendChild(fpHint);

function updateFpHud() {
  const locked = document.pointerLockElement === canvas;
  const touchLayout = isTouchLayout();
  fpCrosshair.style.display = (firstPerson && (locked || touchLayout) && !needsCursor()) ? 'block' : 'none';
  fpHint.style.display = (firstPerson && !locked && !needsCursor() && !touchLayout) ? 'block' : 'none';
}
function setFirstPerson(on) {
  firstPerson = on;
  if (!on && document.pointerLockElement === canvas) document.exitPointerLock();
  if (on) mouse2D.set(0, 0);
  syncCam();
  updateFpHud();
  if (typeof toast === 'function') toast(on ? '👁️ 1인칭 시점 (마인크래프트 모드)' : '🎥 3인칭 시점');
}

function setCreativeFlight(on, silent = false) {
  creativeFlight = on;
  if (creativeFlight) {
    cameraBobOffset = 0;
    jumpVelocity = 0;
    isGrounded = false;
  }
  document.body.classList.toggle('flight-off', !creativeFlight);
  document.body.classList.toggle('flight-on', creativeFlight);
  const upBtn = document.getElementById('cam-up-btn');
  const upLabel = upBtn && upBtn.querySelector('small');
  if (upLabel) upLabel.textContent = creativeFlight ? '상승' : '점프';
  if (!silent && typeof toast === 'function') toast(creativeFlight ? '✦ 비행 모드' : '🚶 걷기 모드', { important: true });
}

function triggerJump() {
  if (creativeFlight || !isGrounded) return;
  jumpVelocity = JUMP_SPEED;
  isGrounded = false;
}

function handleJumpOrFlightTap() {
  const now = Date.now();
  if (now - lastUpTapTime < 340) {
    setCreativeFlight(!creativeFlight);
  } else if (!creativeFlight) {
    triggerJump();
  }
  lastUpTapTime = now;
}

function isTouchLayout() {
  return typeof window.matchMedia === 'function' && window.matchMedia(TOUCH_LAYOUT_QUERY).matches;
}

function mobileUseAt(clientX, clientY) {
  if (isUIBlocking()) return;
  handleClick(clientX, clientY, { allowNearby: false, purpose: 'use' });
}

function mobileDigAt(clientX, clientY) {
  if (isUIBlocking()) return;
  doDig(clientX, clientY, { allowNearby: false, purpose: 'dig' });
}

document.addEventListener('pointerlockchange', updateFpHud);

// V 키로 시점 토글
window.addEventListener('keydown', e => {
  if (e.key === 'v' || e.key === 'V') setFirstPerson(!firstPerson);
  if (e.key === ' ' && !e.repeat) {
    handleJumpOrFlightTap();
  }
});

updateFpHud();

// getRayTargets 는 mousemove마다 호출되므로 프레임당 최대 1회만 재구성
let _rtStamp = -1, _rtCache = [];
function invalidateRayCache() { _rtStamp = -1; }

function getRayTargets() {
  const now = performance.now();
  if (now - _rtStamp < 14) return _rtCache;  // ~1 frame
  _rtStamp = now;

  const am = []; for (const a of animalData) if(a.group.parent) a.group.traverse(c => { if (c.isMesh) am.push(c); });
  const pm = []; for (const g of Object.values(chunkGroups)) if(g.parent) g.traverse(c => { if (c.isMesh) pm.push(c); });
  const ot = []; if (OldTree.group && OldTree.group.parent) OldTree.group.traverse(c => { if (c.isMesh) ot.push(c); });
  const cm = []; for (const m of ClueSystem.meshes) if(m.parent) cm.push(m, ...m.children);

  const bm = []; for (const obj of Object.values(meshByKey)) {
    if(!obj.parent) continue;
    if (obj.userData && obj.userData.isDecorative) continue;
    if (obj.isMesh || obj.isSprite) bm.push(obj);
    else if (obj.isGroup) obj.traverse(c => { if ((c.isMesh || c.isSprite) && !(c.userData && c.userData.isDecorative)) bm.push(c); });
  }
  const lm = []; for (const m of LeafSystem.meshes) {
    if (m.isMesh || m.isSprite) lm.push(m);
    else if (m.isGroup) m.traverse(c => { if (c.isMesh || c.isSprite) lm.push(c); });
  }
  const p2m = typeof Phase2System !== 'undefined' ? Phase2System.getAllMeshes() : [];
  const p3m = [];
  if (typeof Phase3System !== 'undefined') {
    Phase3System.getAllMeshes().forEach(m => {
      if (!m) return;
      if (m.isMesh || m.isSprite) p3m.push(m);
      else if (m.isGroup) m.traverse(c => { if (c.isMesh || c.isSprite) p3m.push(c); });
    });
  }
  _rtCache = [groundMesh, ...bm, ...am, ...pm, ...ot, ...cm, ...lm, ...p2m, ...p3m];
  return _rtCache;
}
function castRay(cx, cy) {
  const r = canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
  return raycaster.intersectObjects(getRayTargets(), false);
}

function getBlockUserData(obj) {
  if (!obj) return null;
  if (obj.userData && obj.userData.isBlock) return obj.userData;
  if (obj.parent && obj.parent.userData && obj.parent.userData.isBlock) return obj.parent.userData;
  return null;
}

function getInteractionRoot(obj) {
  if (obj && obj.parent && obj.parent.userData && obj.parent.userData.isBlock) return obj.parent;
  return obj;
}

function getInteractionReach(options = {}) {
  if (options.range) return options.range;
  return (firstPerson || isTouchLayout()) ? 5.6 : 9;
}

function getInteractionCenter(obj) {
  const ud = getBlockUserData(obj);
  if (ud) return new THREE.Vector3(ud.bx, ud.by + 0.5, ud.bz);
  const target = obj && obj.parent && obj.parent.userData &&
    (obj.parent.userData.isLeaf || obj.parent.userData.isClue || obj.parent.userData.isOldTree)
    ? obj.parent
    : obj;
  if (!target) return null;
  const box = new THREE.Box3().setFromObject(target);
  if (!box.isEmpty()) return box.getCenter(new THREE.Vector3());
  const pos = new THREE.Vector3();
  target.getWorldPosition(pos);
  return pos;
}

function isNearbyInteractionCandidate(obj, purpose) {
  if (!obj || (obj.userData && obj.userData.isGround)) return false;
  const ud = getBlockUserData(obj);
  const data = obj.userData || {};
  const parentData = (obj.parent && obj.parent.userData) || {};
  const hasAnimal = !!data.agr || !!parentData.agr;
  if (purpose === 'dig' && hasAnimal) return false;
  if (ud || hasAnimal) return true;
  const flags = [
    'isLeaf', 'isClue', 'isPreview', 'isOldTree',
    'isFlowerZone', 'isBranch', 'isTrash', 'isNestZone',
    'isSheep', 'isShadeZone', 'isStrawZone', 'isHorse', 'isFence3',
    'isGoat', 'isEscapeSphere', 'isRock3',
    'isTrashDam', 'isCementDam', 'isFoam'
  ];
  return flags.some(flag => data[flag] || parentData[flag]);
}

function isDirectMarkerTarget(obj, purpose) {
  if (!obj) return false;
  const data = obj.userData || {};
  const parentData = (obj.parent && obj.parent.userData) || {};
  if (data.isClue || parentData.isClue) return true;
  if (purpose !== 'dig' && (data.isPreview || parentData.isPreview)) return true;
  return false;
}

function findNearbyInteractionHit(options = {}) {
  const purpose = options.purpose || 'use';
  const reach = getInteractionReach(options);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward).normalize();
  let best = null;
  const seen = new Set();

  for (const rawObj of getRayTargets()) {
    const obj = getInteractionRoot(rawObj);
    if (!obj || seen.has(obj.uuid)) continue;
    seen.add(obj.uuid);
    if (!isNearbyInteractionCandidate(obj, purpose)) continue;

    const center = getInteractionCenter(obj);
    if (!center) continue;
    const fromPlayer = center.clone().sub(orbitTarget);
    const playerDist = fromPlayer.length();
    if (playerDist > reach || playerDist < 0.05) continue;

    const fromCamera = center.clone().sub(camera.position);
    if (fromCamera.lengthSq() < 1e-6) continue;
    const aimDot = fromCamera.normalize().dot(forward);
    if (aimDot < -0.15) continue;

    const isBlock = !!getBlockUserData(obj);
    const blockPenalty = isBlock && purpose !== 'dig' ? 1.15 : 0.15;
    const score = playerDist + (1 - aimDot) * 2.2 + blockPenalty;
    if (!best || score < best.score) {
      best = {
        score,
        hit: {
          object: obj,
          point: center,
          distance: center.distanceTo(camera.position),
          face: isBlock ? { normal: new THREE.Vector3(0, 1, 0) } : null
        }
      };
    }
  }

  return best ? best.hit : null;
}

function castInteractionRay(clientX, clientY, options = {}) {
  const hits = castRay(clientX, clientY);
  const directMarkers = hits.filter(hit => isDirectMarkerTarget(hit.object, options.purpose || 'use'));
  if (directMarkers.length) return directMarkers;
  if (!options.allowNearby) return hits;

  const reach = getInteractionReach(options);
  const reachableHits = hits.filter(hit => hit.point && hit.point.distanceTo(orbitTarget) <= reach + 0.35);
  if (reachableHits.length && !(reachableHits[0].object.userData && reachableHits[0].object.userData.isGround)) {
    return reachableHits;
  }

  const nearbyHit = findNearbyInteractionHit(options);
  return nearbyHit ? [nearbyHit, ...reachableHits] : reachableHits;
}

function doDig(clientX, clientY, options = {}) {
  if (isUIBlocking()) return;
  const hits = castInteractionRay(clientX, clientY, options);
  if (!hits.length) return;
  const obj = hits[0].object;

  if (QuestManager.getCurrentPhase() === 0 && obj.userData.isClue) {
    ClueSystem.checkClick(obj.userData.clueId);
    return;
  }
  if (QuestManager.getCurrentPhase() === 0) {
    toast('⚠️ 주변에 단서가 더 있을지도 몰라요. 노란 구슬을 찾아보세요!');
    return;
  }

  // Group 안 자식 Mesh인 경우 부모의 userData를 확인
  const ud = getBlockUserData(obj);

  if (obj.userData.isPreview) { activateChunk(obj.userData.cx, obj.userData.cz); toast('✨ 미지의 영역을 탐험했습니다!'); return; }
  if (obj.userData.agr) { const a = animalData.find(a => a.group === obj.userData.agr); if (a) removeAnimalAt(a); }
  else if (ud) { removeBlock(ud.bx, ud.by, ud.bz); }
}

canvas.addEventListener('mousedown', e => {
  if (Date.now() - lastTouchPointerTime < 450) return;
  if (isUIBlocking()) return;
  // 1인칭: 아직 시점이 고정(포인터 락)되지 않았다면, 이 클릭은 락만 걸고 끝낸다
  if (firstPerson && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
    return;
  }
  if (e.button === 2 && pickedAnimal) { cancelCarry(); return; }
  if (e.button === 0 || e.button === 2) {
    const ic = interactCoords(e);
    isDragging = true; clickMoved = false; dragButton = e.button;
    mouseStart = { x: e.clientX, y: e.clientY }; currentMouseX = ic.x; currentMouseY = ic.y;
    if (e.button === 0 && toolMode === 'pickaxe') {
      const now = Date.now();
      if (now - lastClickTime < 300) { isHoldingPickaxe = true; doDig(currentMouseX, currentMouseY, { allowNearby: firstPerson, purpose: 'dig' }); digInterval = setInterval(() => { if (isHoldingPickaxe) doDig(currentMouseX, currentMouseY, { allowNearby: firstPerson, purpose: 'dig' }); }, 150); }
      else { doDig(currentMouseX, currentMouseY, { allowNearby: firstPerson, purpose: 'dig' }); }
      lastClickTime = now;
    }
  }
});

canvas.addEventListener('mousemove', e => {
  // 1인칭(포인터 락): 마우스 이동량으로 자유롭게 둘러보기
  if (firstPerson && document.pointerLockElement === canvas) {
    theta -= e.movementX * LOOK_SENS_MOUSE;
    phi   -= e.movementY * LOOK_SENS_MOUSE;
    mouse2D.set(0, 0); // 하이라이트/레이캐스트는 화면 중앙(크로스헤어) 기준
    syncCam();
    return;
  }
  currentMouseX = e.clientX; currentMouseY = e.clientY;
  mouse2D.x = (e.clientX / window.innerWidth) * 2 - 1; mouse2D.y = -(e.clientY / window.innerHeight) * 2 + 1;
  if (!isDragging) return;
  const dx = e.clientX - mouseStart.x, dy = e.clientY - mouseStart.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) clickMoved = true;
  if (clickMoved) {
    if (digInterval || isHoldingPickaxe) return;
    if (dragButton === 0) { const fwd = new THREE.Vector3(orbitTarget.x - camera.position.x, 0, orbitTarget.z - camera.position.z).normalize(); const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize(); const panSpd = radius * 0.0018; orbitTarget.addScaledVector(rgt, -dx * panSpd); orbitTarget.addScaledVector(fwd, dy * panSpd); }
    else if (dragButton === 2) { theta -= dx * LOOK_SENS_DRAG; phi -= dy * LOOK_SENS_DRAG; }
    mouseStart = { x: e.clientX, y: e.clientY }; syncCam();
  }
});

canvas.addEventListener('mouseup', e => {
  clearInterval(digInterval); digInterval = null; isHoldingPickaxe = false;
  if (isDragging && !clickMoved && e.button === 0) { if (toolMode !== 'pickaxe') { const ic = interactCoords(e); handleClick(ic.x, ic.y, { allowNearby: firstPerson, purpose: 'use' }); } }
  isDragging = false;
});

function clearLookHold() {
  clearTimeout(lookHoldTimer);
  lookHoldTimer = null;
}

function endLookPointer(e) {
  if (e.pointerType === 'mouse' || e.pointerId !== lookPointerId) return;
  e.preventDefault();
  lastTouchPointerTime = Date.now();
  clearLookHold();
  clearInterval(digInterval);
  digInterval = null;
  isHoldingPickaxe = false;

  if (!lookMoved && !lookHoldTriggered) {
    mobileUseAt(e.clientX, e.clientY);
  }

  if (typeof canvas.releasePointerCapture === 'function') {
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  lookPointerId = null;
  lookMoved = false;
  lookHoldTriggered = false;
  isDragging = false;
}

canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  if (isUIBlocking() || lookPointerId !== null) return;
  e.preventDefault();
  lastTouchPointerTime = Date.now();
  lookPointerId = e.pointerId;
  lookMoved = false;
  lookHoldTriggered = false;
  isDragging = true;
  clickMoved = false;
  isHoldingPickaxe = false;
  currentMouseX = e.clientX;
  currentMouseY = e.clientY;
  mouseStart = { x: currentMouseX, y: currentMouseY };
  clearLookHold();
  clearInterval(digInterval);
  digInterval = null;
  if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);

  lookHoldTimer = setTimeout(() => {
    if (lookPointerId !== e.pointerId || lookMoved || isUIBlocking()) return;
    lookHoldTriggered = true;
    isHoldingPickaxe = true;
    mobileDigAt(currentMouseX, currentMouseY);
    if (navigator.vibrate) navigator.vibrate(25);
    digInterval = setInterval(() => mobileDigAt(currentMouseX, currentMouseY), 180);
  }, 360);
}, { passive: false });

canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' || e.pointerId !== lookPointerId) return;
  if (isUIBlocking()) return;
  e.preventDefault();
  currentMouseX = e.clientX;
  currentMouseY = e.clientY;

  if (digInterval || isHoldingPickaxe) return;

  const dx = currentMouseX - mouseStart.x;
  const dy = currentMouseY - mouseStart.y;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    lookMoved = true;
    clickMoved = true;
    clearLookHold();
    theta -= dx * LOOK_SENS_TOUCH;
    phi -= dy * LOOK_SENS_TOUCH;
    mouseStart = { x: currentMouseX, y: currentMouseY };
    syncCam();
  }
}, { passive: false });

canvas.addEventListener('pointerup', endLookPointer, { passive: false });
canvas.addEventListener('pointercancel', endLookPointer, { passive: false });

canvas.addEventListener('mouseleave', () => { isDragging = false; clearInterval(digInterval); });
canvas.addEventListener('wheel', e => { radius += e.deltaY * .04; syncCam(); e.preventDefault(); }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function handleClick(clientX, clientY, options = {}) {
  if (isUIBlocking()) return;
  const hits = castInteractionRay(clientX, clientY, options);
  if (pickedAnimal && !hits.length) { cancelCarry(); return; }
  if (!hits.length) return;
  const hit = hits[0], obj = hit.object;

  // Group 안 자식 Mesh인 경우 부모의 userData를 확인
  const getUD = getBlockUserData;

  // === [1순위] 시스템 기본 동작 (도구 무관) ===
  if (QuestManager.getCurrentPhase() === 0) {
    if (obj.userData.isClue) { ClueSystem.checkClick(obj.userData.clueId); return; }
    toast('탐험을 시작하기 전에 단서를 모두 모아주세요!');
    return;
  }

  // 1-1. 단서 확인
  if (obj.userData.isClue) { ClueSystem.checkClick(obj.userData.clueId); return; }

  // 1-2. 낙엽 줍기
  if (obj.userData.isLeaf || (obj.parent && obj.parent.userData.isLeaf)) {
    const leafMesh = obj.userData.isLeaf ? obj : obj.parent;
    LeafSystem.collect(leafMesh);
    return;
  }

  // 1-3. 미지 영역 개방
  if (obj.userData.isPreview) { activateChunk(obj.userData.cx, obj.userData.cz); toast('✨ 미지의 영역을 탐험했습니다!'); return; }

  // 1-4. 들고 있는 동물 내려놓기
  if (pickedAnimal) {
    let dx, dy, dz;
    const dropUD = getUD(obj);
    if (dropUD) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); dx = dropUD.bx + Math.round(n.x); dy = dropUD.by + Math.round(n.y); dz = dropUD.bz + Math.round(n.z); }
    else if (obj.userData.isGround) { dx = Math.round(hit.point.x); dz = Math.round(hit.point.z); dy = getTopY(dx, dz); }
    else return;
    dropAnimal(dx, dy, dz); return;
  }

  // === [1.5순위] 독성 식물 삽 없이 상호작용 시 경고 및 페이즈 2/3 ===
  const udCheck = getUD(obj);
  if (udCheck && gridData[bk(udCheck.bx, udCheck.by, udCheck.bz)] === 'toxic_plant' && toolMode !== 'shovel') {
    toast('⚠️ 독성 식물은 맨손으로 만지면 위험해요! 인벤토리에서 삽을 선택해서 뽑으세요!');
    return;
  }

  if (QuestManager.getCurrentPhase() === 2 && Phase2System.handleClick(obj)) return;
  if (QuestManager.getCurrentPhase() === 3 && Phase3System.handleClick(obj)) return;
  if (currentLevel === 3 && typeof Level3Logic !== 'undefined' && Level3Logic.handleClick(obj)) return;
  if (currentLevel === 4 && typeof Level4Logic !== 'undefined' && Level4Logic.handleClick(obj)) return;
  if (currentLevel === 5 && typeof Level5Manager !== 'undefined') {
    const ud = getUD(obj);
    const clickX = ud ? ud.bx : Math.round(hit.point.x);
    const clickY = ud ? ud.by : Math.round(hit.point.y);
    const clickZ = ud ? ud.bz : Math.round(hit.point.z);
    if (Level5Manager.handleClick(clickX, clickY, clickZ)) return;
  }
  if (currentLevel === 6 && typeof Level6Manager !== 'undefined') {
    const ud = getUD(obj);
    const clickX = ud ? ud.bx : Math.round(hit.point.x);
    const clickY = ud ? ud.by : Math.round(hit.point.y);
    const clickZ = ud ? ud.bz : Math.round(hit.point.z);
    if (Level6Manager.handleClick(clickX, clickY, clickZ)) return;
  }

  // === [2순위] 도구 모드 (Tool Actions) ===
  if (toolMode === 'watering') {
    const waterUD = getUD(obj);
    if (waterUD) { WateringSystem.water(waterUD.bx, waterUD.by, waterUD.bz); }
    else if (obj.userData.isGround) { const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z); WateringSystem.water(gx, getTopY(gx, gz) - 1, gz); }
    return;
  }

  if (toolMode === 'seed') {
    const seedUD = getUD(obj);
    if (seedUD) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); SeedSystem.plant(seedUD.bx + Math.round(n.x), seedUD.by + Math.round(n.y), seedUD.bz + Math.round(n.z), selItem); }
    else if (obj.userData.isGround) { const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z); SeedSystem.plant(gx, getTopY(gx, gz), gz, selItem); }
    return;
  }

  if (toolMode === 'shovel') {
    const ud2 = getUD(obj);
    if (ud2) {
      const { bx, by, bz } = ud2;
      if (gridData[bk(bx, by, bz)] === 'toxic_plant') { ToxicPlantSystem.remove(bx, by, bz); }
      else { removeBlock(bx, by, bz); }
    } else if (obj.userData.isGround) { const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z); const gy = getTopY(gx, gz) - 1; if (gy >= 0) removeBlock(gx, gy, gz); }
    return;
  }

  if (toolMode === 'resource' && selItem === 'fallen_leaf') {
    if (currentLevel !== 1 || QuestManager.getCurrentPhase() !== 1) {
      toast('⚠️ 낙엽 덮기는 레벨 1 페이즈 1에서만 가능해요!');
      return;
    }
    let tx, tz;
    const leafUD = getUD(obj);
    if (leafUD) { tx = leafUD.bx; tz = leafUD.bz; }
    else if (obj.userData.isGround) { tx = Math.round(hit.point.x); tz = Math.round(hit.point.z); }
    else return;
    LeafSystem.placeOnSoil(tx, getTopY(tx, tz), tz);
    return;
  }

  if (toolMode === 'axe') {
    if (QuestManager.getCurrentPhase() < 3) { toast('⚠️ 지금은 나무를 벨 수 없어요!'); return; }
    if (obj.userData.isOldTree) {
      if (OldTree.state !== 'chopped') { OldTree.chopCount++; if (OldTree.chopCount >= 3) { OldTree.chop(); } else { toast(`🪓 쾅! (${OldTree.chopCount}/3)`); if (navigator.vibrate) navigator.vibrate(50); } }
    }
    return;
  }

  if (toolMode === 'action') {
    if (selItem === 'heal') {
      if (obj.userData.agr) {
        const a = animalData.find(a => a.group === obj.userData.agr);
        if (a && a.isInjured) {
          const gx = Math.round(a.x), gz = Math.round(a.z), ty = getTopY(gx, gz) - 1;
          const underFloor = gridData[bk(gx, ty, gz)] ? gridData[bk(gx, ty, gz)].split('_')[0] : '';
          if (underFloor === 'straw') {
            a.isInjured = false;
            a.group.children[0].material.color.setHex(0xe8e8e8);
            Level1Manager.injuredHealedCount++;
            toast('💖 치료 성공! 동물이 건강해졌어요!');
            if (a.type === 'sheep' && typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('sheep', 3);
            QuestManager.check();
          }
          else { toast('⚠️ 다친 동물은 볏짚(보호소) 위에서 치료해야 해요!'); }
        } else if (a && !a.isInjured) { toast('😊 이 동물은 이미 건강해요!'); }
      }
      return;
    }
  }

  if (toolMode === 'block' || toolMode === 'resource') {
    const blockUD = getUD(obj);
    if (blockUD) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); placeBlock(blockUD.bx + Math.round(n.x), blockUD.by + Math.round(n.y), blockUD.bz + Math.round(n.z), selItem); }
    else if (obj.userData.isGround) { const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z); placeBlock(gx, getTopY(gx, gz), gz, selItem); }
    return;
  }

  // === [3순위] 🖐️ 맨손 모드 (Bare Hands Default Actions) ===
  if (toolMode === 'bare' || toolMode === 'none') {
    if (obj.userData.agr) { 
      const a = animalData.find(a => a.group === obj.userData.agr); 
      if (a) {
        pickUpAnimal(a);
        const animalName = GUARDIAN_DATA[a.type]?.name || ANIMAL_LABELS[a.type] || '동물';
        toast(`🐾 ${animalName}을/를 안아 올렸습니다!`);
      }
      return; 
    }
  }
}

function pickUpAnimal(entry) {
  // 영입 전 안기 불가 수호대 동물 차단
  if (NO_CARRY_BEFORE_RECRUIT.has(entry.type) && !global_protectors[entry.type]) {
    const label = (GUARDIAN_DATA[entry.type]?.name) || '이 동물';
    toast(`⚠️ ${label}은/는 아직 수호대에 합류하지 않았어요!`);
    return;
  }
  pickedAnimal = { entry };
  entry.group.traverse(c => {
    if (c.isMesh && c.material && c.material.emissive !== undefined) {
      c.material.emissive.setHex(0x886600);
      c.material.emissiveIntensity = 0.6;
    }
  });
  document.getElementById('carry-indicator').style.display = 'block';
}

function dropAnimal(x, y, z) {
  if (!pickedAnimal) return;
  const { entry } = pickedAnimal; pickedAnimal = null;
  document.getElementById('carry-indicator').style.display = 'none';
  // emissive 복원
  entry.group.traverse(c => {
    if (c.isMesh && c.material && c.material.emissive !== undefined) {
      c.material.emissive.setHex(0);
      c.material.emissiveIntensity = 0;
    }
  });
  // getH()+1: getTopY가 preview 청크에서 0을 반환하는 버그 방지
  const correctedY = getH(x, z) + 1;
  entry.x = x; entry.y = correctedY; entry.z = z;
  entry.group.position.set(x, correctedY, z);
  if (entry.type === 'toad' && typeof Level2Manager !== 'undefined') {
    Level2Manager.onToadDropped(x, z);
  }
  if (entry.type === 'deer' && typeof Level3Manager !== 'undefined') {
    Level3Manager.onAnimalDropped(x, z, entry);
  }
}

function cancelCarry() {
  if (!pickedAnimal) return;
  const { entry } = pickedAnimal;
  entry.group.traverse(c => {
    if (c.isMesh && c.material && c.material.emissive !== undefined) {
      c.material.emissive.setHex(0);
      c.material.emissiveIntensity = 0;
    }
  });
  entry.group.position.set(entry.x, entry.y, entry.z);
  pickedAnimal = null;
  document.getElementById('carry-indicator').style.display = 'none';
}

canvas.addEventListener('mousemove', () => {
  if (isDragging || isUIBlocking()) { hlMesh.visible = false; return; }
  raycaster.setFromCamera(mouse2D, camera);
  const hits = raycaster.intersectObjects(getRayTargets(), false);
  if (!hits.length) { hlMesh.visible = false; return; }
  const hit = hits[0], obj = hit.object;
  const isFlat = (toolMode === 'block' || toolMode === 'seed' || toolMode === 'resource') && (selItem === 'grass' || selItem === 'straw' || ITEM_DB[selItem]?.category === 'plant' || ITEM_DB[selItem]?.category === 'seed' || ITEM_DB[selItem]?.category === 'resource');
  if (obj.userData.isBlock) {
    if (!hit.face) { hlMesh.visible = false; return; }
    const n = hit.face.normal.clone().transformDirection(obj.matrixWorld);
    const nx = obj.userData.bx + Math.round(n.x), ny = obj.userData.by + Math.round(n.y), nz = obj.userData.bz + Math.round(n.z);
    hlMesh.position.set(nx, isFlat ? ny + 0.1 : ny + 0.5, nz); hlMesh.visible = true;
  } else if (obj.userData.isGround) {
    const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z);
    const ny = getTopY(gx, gz);
    hlMesh.position.set(gx, isFlat ? ny + 0.1 : ny + 0.5, gz); hlMesh.visible = true;
  } else hlMesh.visible = false;
});

function resizeGameViewport() {
  const { width, height } = getGameViewportSize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  updateFpHud();
}
window.addEventListener('resize', resizeGameViewport);
window.addEventListener('orientationchange', () => setTimeout(resizeGameViewport, 250));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeGameViewport);
  window.visualViewport.addEventListener('scroll', resizeGameViewport);
}

let t = 0;
let lastFrameTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;
  t += dt;

  // 1인칭: 커서가 필요한 모달 UI가 뜨면 포인터 락을 풀어 버튼/대화를 조작할 수 있게 한다
  if (firstPerson && document.pointerLockElement === canvas && needsCursor()) {
    document.exitPointerLock();
  }
  updateFpHud();
  if (typeof mobileControls !== 'undefined' && mobileControls) {
    mobileControls.classList.toggle('controls-hidden', needsCursor());
  }

  let camMoved = false;
  let horizontalMoved = false;
  const sprinting = keys.Control || mobileSprint;
  const spd = (sprinting ? SPRINT_SPEED : WALK_SPEED) * dt;
  const fwd = camForwardFlat();
  const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  let moveForward = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0) + mobileMove.y;
  let moveRight = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + mobileMove.x;
  const moveLen = Math.hypot(moveForward, moveRight);
  if (moveLen > 1) {
    moveForward /= moveLen;
    moveRight /= moveLen;
  }
  const dxMove = fwd.x * moveForward * spd + rgt.x * moveRight * spd;
  const dzMove = fwd.z * moveForward * spd + rgt.z * moveRight * spd;
  if (Math.abs(dxMove) > 0.0001 || Math.abs(dzMove) > 0.0001) {
    horizontalMoved = movePlayerWithCollision(dxMove, dzMove);
    camMoved = camMoved || horizontalMoved;
  }
  if (creativeFlight && (keys[' '] || camMoveDir === 1)) { orbitTarget.y += FLY_VERTICAL_SPEED * dt; camMoved = true; }
  if (creativeFlight && (keys.Shift || camMoveDir === -1)) { orbitTarget.y -= FLY_VERTICAL_SPEED * dt; camMoved = true; }
  if (!creativeFlight) {
    const groundEyeY = getWalkingEyeY(orbitTarget.x, orbitTarget.z);
    jumpVelocity -= GRAVITY * dt;
    orbitTarget.y += jumpVelocity * dt;
    if (orbitTarget.y <= groundEyeY) {
      orbitTarget.y = groundEyeY;
      jumpVelocity = 0;
      isGrounded = true;
    } else {
      isGrounded = false;
    }
    camMoved = true;
  }

  const prevBob = cameraBobOffset;
  if (horizontalMoved && !creativeFlight) {
    walkBobPhase += dt * (sprinting ? 13.0 : 9.4);
    cameraBobOffset = Math.sin(walkBobPhase) * 0.045 + Math.sin(walkBobPhase * 2) * 0.012;
  } else {
    cameraBobOffset *= Math.max(0, 1 - dt * 8);
  }
  if (camMoved || Math.abs(cameraBobOffset - prevBob) > 0.001) syncCam();

  const wL = typeof BiomeSystem !== 'undefined' ? BiomeSystem.getDominantBiome(orbitTarget.x, orbitTarget.z).waterLevel : 30;
  if (camera.position.y < wL) { scene.fog.color.setHex(0x021b3a); scene.fog.near = 2; scene.fog.far = 12; renderer.setClearColor(0x021b3a); }
  else { scene.fog.color.setHex(0x87CEEB); scene.fog.near = 35; scene.fog.far = 65; renderer.setClearColor(0x87CEEB); }

  waterVolume.position.y = wL + Math.sin(t * 1.5) * 0.04;
  waterDeep.position.y = wL - 0.5 + Math.sin(t * 1.5) * 0.02;
  
  if (typeof updateVisibleChunks !== 'undefined') updateVisibleChunks(orbitTarget);

  updateAnimals(t);
  ClueSystem.updateAnims(t);
  LadybugSystem.update(t);
  SeedSystem.update(t);
  OldTree.updateParticles();
  if (typeof ArrowSystem !== 'undefined') ArrowSystem.update(t);
  // 레벨 2 화살표 애니메이션 (두꾸 위치 표시)
  if (currentLevel === 2 && typeof Level2Manager !== 'undefined' && Level2Manager.updateArrows) {
    Level2Manager.updateArrows(t);
  }
  // 레벨 3 화살표 애니메이션
  if (currentLevel === 3 && typeof Level3Manager !== 'undefined' && Level3Manager.updateArrows) {
    Level3Manager.updateArrows(t);
  }
  // 레벨 4 나침반 화살표 + 비 파티클 애니메이션
  if (currentLevel === 4 && typeof Level4Manager !== 'undefined' && Level4Manager.updateArrows) {
    Level4Manager.updateArrows(t);
  }
  if (currentLevel === 4 && typeof Level4Logic !== 'undefined') {
    Level4Logic.updateRainParticles();
  }
  // 레벨 5 심사 타이머 갱신
  if (currentLevel === 5 && typeof Level5Manager !== 'undefined') {
    Level5Manager.update(t);
  }

  // ── 방위 나침반 업데이트 ────────────────────────
  // 좌표계: +X=동(E), -X=서(W), -Z=북(N), +Z=남(S)
  // 카메라가 바라보는 방향의 방위각 계산
  //   atan2(dx, -dz) → 0°=북, 90°=동, 180°=남, -90°=서
  const _camDx = orbitTarget.x - camera.position.x;
  const _camDz = orbitTarget.z - camera.position.z;
  const _azimuth = Math.atan2(_camDx, -_camDz) * (180 / Math.PI);
  const _rose = document.getElementById('compass-rose');
  if (_rose) _rose.style.transform = `rotate(${(-_azimuth).toFixed(1)}deg)`;

  for (const c of cloudGroups) { c.mesh.position.x = c.bx + Math.sin(t * .035 + c.bz * .1) * 4; c.mesh.position.z = c.bz + Math.cos(t * .025 + c.bx * .08) * 3; }
  renderer.render(scene, camera);
}

// 모바일 조이스틱 + 액션 버튼 로직
let camMoveDir = 0;
function stopMobileControlEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

function resetMobileJoystick() {
  mobileMove.x = 0;
  mobileMove.y = 0;
  mobileMove.active = false;
  const knob = document.getElementById('mobile-joystick-knob');
  if (knob) knob.style.transform = 'translate(-50%, -50%)';
}

function updateMobileJoystick(e) {
  const ring = document.getElementById('mobile-joystick-ring');
  const knob = document.getElementById('mobile-joystick-knob');
  if (!ring || !knob) return;
  const rect = ring.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const max = rect.width * 0.38;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }
  mobileMove.x = Math.max(-1, Math.min(1, dx / max));
  mobileMove.y = Math.max(-1, Math.min(1, -dy / max));
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

const mobileControls = document.getElementById('mobile-touch-controls');
const joystick = document.getElementById('mobile-joystick');
if (joystick) {
  joystick.addEventListener('pointerdown', e => {
    stopMobileControlEvent(e);
    mobileMove.active = true;
    if (typeof joystick.setPointerCapture === 'function') joystick.setPointerCapture(e.pointerId);
    updateMobileJoystick(e);
  }, { passive: false });
  joystick.addEventListener('pointermove', e => {
    if (!mobileMove.active) return;
    stopMobileControlEvent(e);
    updateMobileJoystick(e);
  }, { passive: false });
  const endJoystick = e => {
    stopMobileControlEvent(e);
    resetMobileJoystick();
  };
  joystick.addEventListener('pointerup', endJoystick, { passive: false });
  joystick.addEventListener('pointercancel', endJoystick, { passive: false });
  joystick.addEventListener('lostpointercapture', resetMobileJoystick);
}

const camUpBtn = document.getElementById('cam-up-btn');
const camDownBtn = document.getElementById('cam-down-btn');
if(camUpBtn && camDownBtn) {
  const startUp = (e) => {
    stopMobileControlEvent(e);
    handleJumpOrFlightTap();
    camMoveDir = creativeFlight ? 1 : 0;
  };
  const startDown = (e) => {
    stopMobileControlEvent(e);
    camMoveDir = creativeFlight ? -1 : 0;
  };
  const stopMove = (e) => { stopMobileControlEvent(e); camMoveDir = 0; };
  camUpBtn.addEventListener('pointerdown', startUp, { passive:false });
  camUpBtn.addEventListener('pointerup', stopMove, { passive:false });
  camUpBtn.addEventListener('pointercancel', stopMove, { passive:false });
  camUpBtn.addEventListener('pointerleave', stopMove, { passive:false });

  camDownBtn.addEventListener('pointerdown', startDown, { passive:false });
  camDownBtn.addEventListener('pointerup', stopMove, { passive:false });
  camDownBtn.addEventListener('pointercancel', stopMove, { passive:false });
  camDownBtn.addEventListener('pointerleave', stopMove, { passive:false });
}

const mobileSprintBtn = document.getElementById('mobile-sprint-btn');
if (mobileSprintBtn) {
  const startSprint = e => {
    stopMobileControlEvent(e);
    mobileSprint = true;
    mobileSprintBtn.classList.add('active');
  };
  const stopSprint = e => {
    stopMobileControlEvent(e);
    mobileSprint = false;
    mobileSprintBtn.classList.remove('active');
  };
  mobileSprintBtn.addEventListener('pointerdown', startSprint, { passive: false });
  mobileSprintBtn.addEventListener('pointerup', stopSprint, { passive: false });
  mobileSprintBtn.addEventListener('pointercancel', stopSprint, { passive: false });
  mobileSprintBtn.addEventListener('pointerleave', stopSprint, { passive: false });
}

function updateTouchControlsAvailability() {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const touchCapable = coarsePointer || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  document.body.classList.toggle('touch-controls-enabled', touchCapable);
  if (mobileControls) mobileControls.style.display = touchCapable ? 'block' : '';
}
updateTouchControlsAvailability();
window.addEventListener('resize', updateTouchControlsAvailability);
window.addEventListener('orientationchange', () => setTimeout(updateTouchControlsAvailability, 150));
setCreativeFlight(creativeFlight, true);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  초기화 및 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
initWorld(); QuestManager.check(); animate();
