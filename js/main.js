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
    camera.position.set(orbitTarget.x, orbitTarget.y, orbitTarget.z);
    camera.lookAt(orbitTarget.x - dx, orbitTarget.y - dy, orbitTarget.z - dz);
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

syncCam();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  인터랙션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isDragging = false, clickMoved = false, dragButton = 0;
let mouseStart = { x: 0, y: 0 }, currentMouseX = 0, currentMouseY = 0;
let touchMode = null;
let digInterval = null, isHoldingPickaxe = false;
let lastClickTime = 0, lastTouchTime = 0;
let mobileDigInterval = null;
let lastSpaceTap = 0;
let creativeFlight = true;
const mobileMove = { x: 0, y: 0, active: false };

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
  const touchLayout = window.matchMedia('(pointer: coarse), (max-width: 760px), (max-height: 520px)').matches;
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
  document.body.classList.toggle('flight-off', !creativeFlight);
  document.body.classList.toggle('flight-on', creativeFlight);
  const flyBtn = document.getElementById('mobile-fly-btn');
  if (flyBtn) {
    flyBtn.classList.toggle('active', creativeFlight);
    const small = flyBtn.querySelector('small');
    if (small) small.textContent = creativeFlight ? '비행' : '걷기';
  }
  if (!silent && typeof toast === 'function') toast(creativeFlight ? '✦ 비행 모드' : '🚶 걷기 모드', { important: true });
}

function getCrosshairCoords() {
  const r = canvas.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function mobileUseAtCrosshair() {
  if (isUIBlocking()) return;
  const c = getCrosshairCoords();
  handleClick(c.x, c.y);
}

function mobileDigAtCrosshair() {
  if (isUIBlocking()) return;
  const c = getCrosshairCoords();
  if (toolMode === 'pickaxe') doDig(c.x, c.y);
  else handleClick(c.x, c.y);
}

document.addEventListener('pointerlockchange', updateFpHud);

// V 키로 시점 토글
window.addEventListener('keydown', e => {
  if (e.key === 'v' || e.key === 'V') setFirstPerson(!firstPerson);
  if (e.key === ' ' && !e.repeat) {
    const now = Date.now();
    if (now - lastSpaceTap < 340) setCreativeFlight(!creativeFlight);
    lastSpaceTap = now;
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
    if (obj.isMesh || obj.isSprite) bm.push(obj);
    else if (obj.isGroup) obj.traverse(c => { if (c.isMesh || c.isSprite) bm.push(c); });
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

function doDig(clientX, clientY) {
  if (isUIBlocking()) return;
  const hits = castRay(clientX, clientY);
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
  const ud = obj.userData.isBlock ? obj.userData : (obj.parent && obj.parent.userData.isBlock ? obj.parent.userData : null);

  if (obj.userData.isPreview) { activateChunk(obj.userData.cx, obj.userData.cz); toast('✨ 미지의 영역을 탐험했습니다!'); return; }
  if (obj.userData.agr) { const a = animalData.find(a => a.group === obj.userData.agr); if (a) removeAnimalAt(a); }
  else if (ud) { removeBlock(ud.bx, ud.by, ud.bz); }
}

canvas.addEventListener('mousedown', e => {
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
      if (now - lastClickTime < 300) { isHoldingPickaxe = true; doDig(currentMouseX, currentMouseY); digInterval = setInterval(() => { if (isHoldingPickaxe) doDig(currentMouseX, currentMouseY); }, 150); }
      else { doDig(currentMouseX, currentMouseY); }
      lastClickTime = now;
    }
  }
});

canvas.addEventListener('mousemove', e => {
  // 1인칭(포인터 락): 마우스 이동량으로 자유롭게 둘러보기
  if (firstPerson && document.pointerLockElement === canvas) {
    theta -= e.movementX * 0.0025;
    phi   += e.movementY * 0.0025;
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
    else if (dragButton === 2) { theta -= dx * .007; phi += dy * .007; }
    mouseStart = { x: e.clientX, y: e.clientY }; syncCam();
  }
});

canvas.addEventListener('mouseup', e => {
  clearInterval(digInterval); digInterval = null; isHoldingPickaxe = false;
  if (isDragging && !clickMoved && e.button === 0) { if (toolMode !== 'pickaxe') { const ic = interactCoords(e); handleClick(ic.x, ic.y); } }
  isDragging = false;
});

let initialPinchDist = null, initialRadius = null, initialPanCenter = null;
canvas.addEventListener('touchstart', e => {
  if (isUIBlocking()) return;
  const canvasTouches = Array.from(e.touches).filter(t => t.target === canvas);
  if (canvasTouches.length === 1) {
    const touch = canvasTouches[0];
    touchMode = 'single'; isDragging = true; clickMoved = false; isHoldingPickaxe = false;
    currentMouseX = touch.clientX; currentMouseY = touch.clientY;
    mouseStart = { x: currentMouseX, y: currentMouseY };
    if (toolMode === 'pickaxe') {
      const now = Date.now();
      if (now - lastTouchTime < 300) { isHoldingPickaxe = true; doDig(currentMouseX, currentMouseY); if (navigator.vibrate) navigator.vibrate(50); digInterval = setInterval(() => { if (isHoldingPickaxe) doDig(currentMouseX, currentMouseY); }, 150); }
      else { doDig(currentMouseX, currentMouseY); if (navigator.vibrate) navigator.vibrate(20); }
      lastTouchTime = now;
    }
  } else if (canvasTouches.length === 2) {
    touchMode = 'zoom_pan'; isDragging = false; clearInterval(digInterval); isHoldingPickaxe = false;
    const dx = canvasTouches[0].clientX - canvasTouches[1].clientX, dy = canvasTouches[0].clientY - canvasTouches[1].clientY;
    initialPinchDist = Math.sqrt(dx * dx + dy * dy); initialRadius = radius;
    initialPanCenter = { x: (canvasTouches[0].clientX + canvasTouches[1].clientX) / 2, y: (canvasTouches[0].clientY + canvasTouches[1].clientY) / 2 };
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  if (isUIBlocking()) return; e.preventDefault();
  const canvasTouches = Array.from(e.touches).filter(t => t.target === canvas);
  if (touchMode === 'single' && canvasTouches.length === 1) {
    const touch = canvasTouches[0];
    currentMouseX = touch.clientX; currentMouseY = touch.clientY;
    const dx = currentMouseX - mouseStart.x, dy = currentMouseY - mouseStart.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) clickMoved = true;
    if (clickMoved) { if (digInterval || isHoldingPickaxe) return; theta -= dx * .007; phi += dy * .007; mouseStart = { x: currentMouseX, y: currentMouseY }; syncCam(); }
  } else if (touchMode === 'zoom_pan' && canvasTouches.length === 2) {
    const dx = canvasTouches[0].clientX - canvasTouches[1].clientX, dy = canvasTouches[0].clientY - canvasTouches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy); radius = initialRadius * (initialPinchDist / dist);
    const cx = (canvasTouches[0].clientX + canvasTouches[1].clientX) / 2, cy = (canvasTouches[0].clientY + canvasTouches[1].clientY) / 2;
    const pdx = cx - initialPanCenter.x, pdy = cy - initialPanCenter.y;
    if (Math.abs(pdx) > 2 || Math.abs(pdy) > 2) { const forward = camForwardFlat(); const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize(); orbitTarget.addScaledVector(right, -pdx * 0.05); orbitTarget.addScaledVector(forward, pdy * 0.05); initialPanCenter = { x: cx, y: cy }; }
    syncCam();
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if(!isUIBlocking()) e.preventDefault(); // 아이패드 등 터치 기기에서 클릭 이벤트 중복 발생(더블 클릭) 방지
  clearInterval(digInterval); digInterval = null; isHoldingPickaxe = false;
  if (touchMode === 'single' && !clickMoved && e.changedTouches.length === 1) { if (toolMode !== 'pickaxe') handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }
  const canvasTouches = Array.from(e.touches).filter(t => t.target === canvas);
  if (canvasTouches.length === 0) { touchMode = null; isDragging = false; }
}, { passive: false });

canvas.addEventListener('mouseleave', () => { isDragging = false; clearInterval(digInterval); });
canvas.addEventListener('wheel', e => { radius += e.deltaY * .04; syncCam(); e.preventDefault(); }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function handleClick(clientX, clientY) {
  if (isUIBlocking()) return;
  const hits = castRay(clientX, clientY);
  if (pickedAnimal && !hits.length) { cancelCarry(); return; }
  if (!hits.length) return;
  const hit = hits[0], obj = hit.object;

  // Group 안 자식 Mesh인 경우 부모의 userData를 확인
  const getUD = o => o.userData.isBlock ? o.userData : (o.parent && o.parent.userData.isBlock ? o.parent.userData : null);

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
    if (obj.userData.isBlock) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); dx = obj.userData.bx + Math.round(n.x); dy = obj.userData.by + Math.round(n.y); dz = obj.userData.bz + Math.round(n.z); }
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
    if (obj.userData.isBlock) { WateringSystem.water(obj.userData.bx, obj.userData.by, obj.userData.bz); }
    else if (obj.userData.isGround) { const gx = Math.round(hit.point.x), gz = Math.round(hit.point.z); WateringSystem.water(gx, getTopY(gx, gz) - 1, gz); }
    return;
  }

  if (toolMode === 'seed') {
    if (obj.userData.isBlock) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); SeedSystem.plant(obj.userData.bx + Math.round(n.x), obj.userData.by + Math.round(n.y), obj.userData.bz + Math.round(n.z), selItem); }
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
    if (obj.userData.isBlock) { tx = obj.userData.bx; tz = obj.userData.bz; }
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
    if (obj.userData.isBlock) { if (!hit.face) return; const n = hit.face.normal.clone().transformDirection(obj.matrixWorld); placeBlock(obj.userData.bx + Math.round(n.x), obj.userData.by + Math.round(n.y), obj.userData.bz + Math.round(n.z), selItem); }
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

// Stats 모니터
let stats;
if (typeof Stats !== 'undefined') {
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  stats.dom.style.position = 'absolute';
  stats.dom.style.bottom = '10px';
  stats.dom.style.left = '10px';
  stats.dom.style.top = 'auto';
  stats.dom.style.zIndex = '9999';
}

let t = 0;
function animate() {
  if (stats) stats.begin();
  requestAnimationFrame(animate); t += .016;

  // 1인칭: 커서가 필요한 모달 UI가 뜨면 포인터 락을 풀어 버튼/대화를 조작할 수 있게 한다
  if (firstPerson && document.pointerLockElement === canvas && needsCursor()) {
    document.exitPointerLock();
  }
  updateFpHud();
  if (typeof mobileControls !== 'undefined' && mobileControls) {
    mobileControls.classList.toggle('controls-hidden', needsCursor());
  }

  let camMoved = false;
  const spd = 0.4 * (keys.Control ? 1.45 : 1);
  const fwd = camForwardFlat();
  const rgt = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  let moveForward = (keys.w || keys.ArrowUp ? 1 : 0) - (keys.s || keys.ArrowDown ? 1 : 0) + mobileMove.y;
  let moveRight = (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + mobileMove.x;
  const moveLen = Math.hypot(moveForward, moveRight);
  if (moveLen > 1) {
    moveForward /= moveLen;
    moveRight /= moveLen;
  }
  if (Math.abs(moveForward) > 0.01) { orbitTarget.addScaledVector(fwd, moveForward * spd); camMoved = true; }
  if (Math.abs(moveRight) > 0.01) { orbitTarget.addScaledVector(rgt, moveRight * spd); camMoved = true; }
  if (creativeFlight && (keys[' '] || camMoveDir === 1)) { orbitTarget.y += spd; camMoved = true; }
  if (creativeFlight && (keys.Shift || camMoveDir === -1)) { orbitTarget.y -= spd; camMoved = true; }
  if (camMoved) syncCam();

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
  if (stats) stats.end();
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
  const startUp = (e) => { stopMobileControlEvent(e); camMoveDir = 1; };
  const startDown = (e) => { stopMobileControlEvent(e); camMoveDir = -1; };
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

const mobileUseBtn = document.getElementById('mobile-use-btn');
if (mobileUseBtn) {
  mobileUseBtn.addEventListener('pointerdown', e => {
    stopMobileControlEvent(e);
    mobileUseAtCrosshair();
  }, { passive: false });
}

const mobileDigBtn = document.getElementById('mobile-dig-btn');
if (mobileDigBtn) {
  const startDig = e => {
    stopMobileControlEvent(e);
    mobileDigAtCrosshair();
    clearInterval(mobileDigInterval);
    if (toolMode === 'pickaxe' || toolMode === 'shovel') {
      mobileDigInterval = setInterval(mobileDigAtCrosshair, 180);
    }
  };
  const stopDig = e => {
    stopMobileControlEvent(e);
    clearInterval(mobileDigInterval);
    mobileDigInterval = null;
  };
  mobileDigBtn.addEventListener('pointerdown', startDig, { passive: false });
  mobileDigBtn.addEventListener('pointerup', stopDig, { passive: false });
  mobileDigBtn.addEventListener('pointercancel', stopDig, { passive: false });
  mobileDigBtn.addEventListener('pointerleave', stopDig, { passive: false });
}

const mobileFlyBtn = document.getElementById('mobile-fly-btn');
if (mobileFlyBtn) {
  mobileFlyBtn.addEventListener('pointerdown', e => {
    stopMobileControlEvent(e);
    setCreativeFlight(!creativeFlight);
  }, { passive: false });
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
