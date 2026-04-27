<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🐾 애니멀 어드벤쳐: 생태계 수호자</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { overflow:hidden; background:#87CEEB; font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif; user-select:none; touch-action: none; }
#canvas { display:block; position:fixed; top:0; left:0; width: 100vw; height: 100vh; }

/* 상단 UI */
#topbar { position:fixed; top:0; left:0; right:0; z-index:10; background:linear-gradient(180deg,rgba(20,40,20,0.88),rgba(20,40,20,0.6)); padding:10px 18px; display:flex; align-items:center; gap:16px; border-bottom:2px solid rgba(255,215,0,0.3); backdrop-filter:blur(4px); flex-wrap: wrap; }
#title-text { font-size:20px; font-weight:900; color:#FFD700; text-shadow:0 0 12px rgba(255,215,0,0.5); white-space:nowrap; }
#mission-box { flex:1; min-width: 250px; background:rgba(0,0,0,0.35); border:1px solid rgba(255,215,0,0.25); border-radius:10px; padding:7px 14px; }
#mission-title { font-size:13px; font-weight:800; color:#FFD700; margin-bottom:3px; }
#mission-desc  { font-size:11px; color:rgba(255,255,255,0.85); margin-bottom:4px; line-height:1.4;}
#mission-status { display:flex; gap:14px; flex-wrap: wrap;}
.mc { font-size:12px; color:rgba(255,255,255,0.6); }
.mc.done { color:#5CFF5C; font-weight:bold; }

/* 🌟 마인크래프트 스타일 핫바 (하단 중앙) */
#hotbar-wrapper { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:20; display:flex; flex-direction:column; align-items:center; gap:6px; pointer-events:none; }
#hotbar-label { color:#FFD700; font-size:14px; font-weight:900; text-shadow:1px 1px 2px #000; background:rgba(0,0,0,0.6); padding:4px 16px; border-radius:12px; pointer-events:none; border:1px solid rgba(255,215,0,0.5); transition:transform 0.1s, opacity 0.2s; }
#hotbar-container { display:flex; gap:4px; background:rgba(0,0,0,0.55); padding:6px; border-radius:8px; border:2px solid rgba(255,255,255,0.2); backdrop-filter:blur(4px); pointer-events:auto; }
.hotbar-slot { width:44px; height:44px; background:rgba(255,255,255,0.1); border:2px solid rgba(255,255,255,0.3); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; position:relative; transition:transform 0.1s; }
.hotbar-slot:hover { background:rgba(255,255,255,0.2); }
.hotbar-slot.active { border-color:#FFD700; background:rgba(255,215,0,0.2); transform:scale(1.1); z-index:2; box-shadow:0 0 12px rgba(255,215,0,0.5); }
.slot-num { position:absolute; top:2px; left:4px; font-size:10px; color:rgba(255,255,255,0.7); font-weight:bold; }
.slot-icon { font-size:20px; text-shadow:1px 1px 2px #000; }
.slot-swatch { width:20px; height:20px; border-radius:4px; border:1px solid rgba(255,255,255,0.5); box-shadow:1px 1px 3px rgba(0,0,0,0.5); }

/* 🌟 마인크래프트 스타일 인벤토리 (가방) */
#inventory-overlay { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:50; background:rgba(20,30,20,0.95); border:3px solid #4caf50; border-radius:12px; padding:20px; display:none; flex-direction:column; gap:15px; width:90%; max-width:500px; box-shadow:0 10px 40px rgba(0,0,0,0.8); max-height:85vh; overflow-y:auto; }
.inv-header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px; }
.inv-header h2 { color:#FFD700; font-size:18px; }
.close-btn { background:none; border:none; color:#fff; font-size:24px; cursor:pointer; padding:0 10px;}
.inv-hotbar-preview { background:rgba(255,215,0,0.1); padding:12px; border-radius:8px; border:1px solid rgba(255,215,0,0.3); display:flex; flex-direction:column; align-items:center; }
.inv-hotbar-preview h3 { color:#FFD700; font-size:13px; margin-bottom:4px; }
.inv-hotbar-preview p { color:rgba(255,255,255,0.6); font-size:11px; margin-bottom:10px; }
.inv-category { margin-bottom:5px; }
.inv-category h3 { color:rgba(255,255,255,0.8); font-size:13px; margin-bottom:8px; border-left:3px solid #4caf50; padding-left:8px; }
.inv-grid { display:flex; flex-wrap:wrap; gap:8px; }
.inv-item { display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2); padding:6px 10px; border-radius:6px; cursor:pointer; color:#fff; font-size:12px; transition:0.1s; }
.inv-item:hover { background:rgba(255,215,0,0.2); border-color:#FFD700; }
.btn-clear-slot { margin-top:8px; background:#C0392B; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer; }

/* 우측 상단 버튼들 (회전, 지도, 저장, 가방) */
#side-buttons { position:fixed; top:80px; right:14px; z-index:10; display:flex; flex-direction:column; gap:8px; }
.side-btn { padding:10px; background:rgba(0,0,0,0.6); border:2px solid rgba(255,255,255,0.2); border-radius:8px; color:#fff; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:6px; transition:0.1s; font-size:12px; }
.side-btn:hover { background:rgba(255,255,255,0.2); border-color:#FFD700; color:#FFD700;}

#hint { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); z-index:10; background:rgba(0,0,0,0.65); border:1px solid rgba(255,215,0,0.3); color:#FFD700; padding:6px 18px; border-radius:20px; font-size:11px; white-space:nowrap; pointer-events:none; font-weight:600;}
#toast { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:30; background:rgba(0,0,0,0.88); color:#fff; padding:14px 28px; border-radius:14px; font-size:16px; font-weight:800; display:none; pointer-events:none; border:2px solid rgba(255,215,0,0.4); text-align: center; }
#carry-indicator { position:fixed; top:90px; left:50%; transform:translateX(-50%); z-index:20; background:rgba(255,215,0,0.22); border:2px solid #FFD700; border-radius:20px; padding:6px 18px; color:#FFD700; font-size:13px; font-weight:800; display:none; backdrop-filter:blur(4px); animation:pulse 1s ease-in-out infinite; white-space: nowrap;}
@keyframes pulse { 0%,100%{box-shadow:0 0 8px rgba(255,215,0,0.4);} 50%{box-shadow:0 0 20px rgba(255,215,0,0.8);} }
#map-overlay { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:50; background:rgba(8,18,8,0.96); border:2px solid #FFD700; border-radius:18px; padding:22px; display:none; backdrop-filter:blur(10px); box-shadow:0 0 40px rgba(0,0,0,0.8); max-width: 90vw; max-height: 90vh; overflow: auto;}
#map-overlay h3 { color:#FFD700; font-size:15px; text-align:center; margin-bottom:4px; }
#map-overlay p  { color:rgba(255,255,255,0.55); font-size:11px; text-align:center; margin-bottom:12px; }
#map-grid { display:grid; gap:3px; justify-content: center; }
.mc-cell { width:30px; height:30px; border-radius:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; border:1px solid rgba(255,255,255,0.15); transition:transform 0.1s, filter 0.1s; }
.mc-cell.active  { background:#27AE60; cursor:default; }
.mc-cell.visible { background:#E67E22; }
.mc-cell.visible:hover { transform:scale(1.12); filter:brightness(1.2); }
.mc-cell.hidden  { background:#1a2a1a; cursor:default; }
#map-close { display:block; margin:14px auto 0; padding:8px 28px; background:#FFD700; color:#000; border:none; border-radius:8px; font-size:14px; font-weight:800; cursor:pointer; }
#mission-clear { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:40; background:linear-gradient(135deg,#0d2b12,#1a5c28); border:3px solid #FFD700; border-radius:24px; padding:36px 44px; text-align:center; color:#fff; display:none; box-shadow:0 0 60px rgba(255,215,0,0.3); animation:popIn 0.4s cubic-bezier(0.34,1.56,0.64,1); width: 90%; max-width: 400px;}
@keyframes popIn { from{transform:translate(-50%,-50%) scale(0.5);opacity:0;} to{transform:translate(-50%,-50%) scale(1);opacity:1;} }
#mission-clear .mc-star { font-size:48px; margin-bottom:8px; }
#mission-clear h2 { font-size:30px; color:#FFD700; margin-bottom:10px; }
#mission-clear p  { font-size:15px; opacity:0.9; line-height:1.6; margin-bottom:22px; }
#mission-clear button { padding:12px 30px; background:#FFD700; color:#000; border:none; border-radius:10px; font-size:16px; font-weight:900; cursor:pointer; }

@media (max-width: 600px) {
  #topbar { padding: 5px 10px; gap: 8px;}
  #title-text { font-size: 16px; }
  #hotbar-label { font-size: 12px; padding: 3px 12px; }
  .hotbar-slot { width:34px; height:34px; }
  .slot-icon { font-size:16px; }
  #hint { font-size: 9px; bottom: 75px; }
  .mc-cell { width: 24px; height: 24px; font-size: 10px;}
}
</style>
</head>
<body>
<canvas id="canvas"></canvas>

<div id="topbar">
  <div id="title-text">🐾 생태계 수호자</div>
  <div id="mission-box">
    <div id="mission-title">🎯 미션: 다친 양을 치료하고 서식지 만들기!</div>
    <div id="mission-desc">1. 먹이로 유도해서 양들을 볏짚 위로 데려오세요.<br>2. 구급상자로 치료하고, 풀밭 울타리를 만들어주세요!</div>
    <div id="mission-status">
      <span class="mc" id="mc-heal">⬜ 다친 양 치료 0/1</span>
      <span class="mc" id="mc-sheep">⬜ 보호된 양 0/3</span>
      <span class="mc" id="mc-grass">⬜ 서식지 내 풀밭 0/6</span>
    </div>
  </div>
</div>

<div id="side-buttons">
  <button class="side-btn" onclick="toggleRotation()">🔄 회전 (R)</button>
  <button class="side-btn" onclick="toggleInventory()">🎒 가방 (E)</button>
  <button class="side-btn" onclick="openMap()">🗺️ 지도 (M)</button>
  <button class="side-btn" onclick="saveGame()" style="background:#27AE60;">💾 저장</button>
  <button class="side-btn" onclick="loadGame()" style="background:#2980B9;">📂 불러오기</button>
  <button class="side-btn" onclick="clearAll()" style="background:#C0392B;">🗑️ 초기화</button>
</div>

<div id="hotbar-wrapper">
  <div id="hotbar-label">도구 선택</div>
  <div id="hotbar-container"></div>
</div>

<div id="inventory-overlay">
  <div class="inv-header">
    <h2>🎒 내 가방 (인벤토리)</h2>
    <button class="close-btn" onclick="toggleInventory()">✖</button>
  </div>
  
  <div class="inv-hotbar-preview">
    <h3>👇 단축키(1~9) 슬롯 설정</h3>
    <p>아래에서 아이템을 골라 핫바에 등록하세요.</p>
    <div class="inv-grid" id="inv-hotbar-grid"></div>
    <button class="btn-clear-slot" onclick="clearSelectedSlot()">🆑 현재 슬롯 비우기</button>
  </div>

  <div class="inv-category">
    <h3>🛠️ 도구</h3>
    <div class="inv-grid" id="inv-tools"></div>
  </div>
  <div class="inv-category">
    <h3>🧱 건축 재료</h3>
    <div class="inv-grid" id="inv-materials"></div>
  </div>
  <div class="inv-category">
    <h3>🌳 자연 재료 (복원용)</h3>
    <div class="inv-grid" id="inv-nature"></div>
  </div>
  <div class="inv-category">
    <h3>💖 구조 키트</h3>
    <div class="inv-grid" id="inv-kits"></div>
  </div>
</div>

<div id="hint">💡 단축키 1~9: 슬롯 교체 | 파기: 1번 클릭 (연속 파기: 더블클릭 꾹~) | 카메라 이동: 화면 드래그</div>
<input type="file" id="file-input" accept=".json" style="display:none" onchange="onFileSelected(event)">
<div id="carry-indicator">✋ 동물을 안고 있어요 — 눕힐 곳에 클릭!</div>
<div id="toast"></div>

<div id="map-overlay">
  <h3>🗺️ 세계 지도</h3>
  <p>🟢 탐험 완료 &nbsp;|&nbsp; 🟠 클릭하면 탐험 &nbsp;|&nbsp; ⬛ 미탐험</p>
  <div id="map-grid"></div>
  <button id="map-close" onclick="closeMap()">닫기</button>
</div>
<div id="mission-clear">
  <div class="mc-star">🌟</div>
  <h2>동물 구조 성공!</h2>
  <p>다친 양이 건강을 되찾고,<br>친구들과 푹신한 풀밭에서 뛰놀게 되었어요! 🎉</p>
  <button onclick="document.getElementById('mission-clear').style.display='none'">계속 탐험하기 →</button>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  아이템 및 블록 데이터베이스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ITEM_DB = {
  pickaxe: { category: 'tool', type: 'pickaxe', label: '곡괭이', icon: '⛏️' },
  dirt:  { category: 'material', type: 'block', label: '흙', color: '#7a5c1e', hex: 0x7a5c1e, solid: true },
  grass: { category: 'material', type: 'block', label: '풀', color: '#4caf50', hex: 0x4caf50, solid: true },
  straw: { category: 'material', type: 'block', label: '볏짚', color: '#ddc050', hex: 0xddc050, solid: true },
  fence: { category: 'material', type: 'block', label: '울타리', color: '#8d6e3a', hex: 0x8d6e3a, solid: true },
  stone: { category: 'material', type: 'block', label: '돌', color: '#888888', hex: 0x888888, solid: true },
  
  // 자연 복원용 블록들
  t_low:   { category: 'nature', type: 'block', label: '얕은 풀밭', color: '#6aaa5a', hex: 0x6aaa5a, solid: true },
  t_mid:   { category: 'nature', type: 'block', label: '깊은 풀밭', color: '#4a8a3a', hex: 0x4a8a3a, solid: true },
  t_high:  { category: 'nature', type: 'block', label: '고산 풀밭', color: '#7a8e68', hex: 0x7a8e68, solid: true },
  t_rock:  { category: 'nature', type: 'block', label: '산 바위', color: '#9a8878', hex: 0x9a8878, solid: true },
  t_dirt:  { category: 'nature', type: 'block', label: '자연 흙', color: '#6b5040', hex: 0x6b5040, solid: true },
  t_sub:   { category: 'nature', type: 'block', label: '지층 흙', color: '#888880', hex: 0x888880, solid: true },
  r_sand:  { category: 'nature', type: 'block', label: '강 모래', color: '#c8b47a', hex: 0xc8b47a, solid: true },
  r_gravel:{ category: 'nature', type: 'block', label: '강 자갈', color: '#9a8868', hex: 0x9a8868, solid: true },
  r_sub:   { category: 'nature', type: 'block', label: '강 진흙', color: '#7a6850', hex: 0x7a6850, solid: true },

  lure:  { category: 'kit', type: 'action', label: '먹이(유도)', icon: '🌾' },
  heal:  { category: 'kit', type: 'action', label: '구급상자', icon: '🩹' },
  carry: { category: 'kit', type: 'action', label: '안아주기', icon: '👐' }
};

const TERRAIN_BLOCKS = {
  t_low: {hex:0x6aaa5a, solid:true}, t_mid:  {hex:0x4a8a3a, solid:true},
  t_high:{hex:0x7a8e68, solid:true}, t_rock: {hex:0x9a8878, solid:true},
  t_dirt:{hex:0x6b5040, solid:true}, t_sub:  {hex:0x888880, solid:true},
  r_sand:  {hex:0xc8b47a, solid:true}, r_gravel:{hex:0x9a8868, solid:true}, r_sub: {hex:0x7a6850, solid:true}
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  핫바 및 인벤토리 시스템
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let hotbar = ['pickaxe', 'dirt', 'grass', 'straw', 'fence', 'lure', 'heal', 'carry', null];
let activeSlot = 0; 
let isInventoryOpen = false;
let currentRotation = 0; // 0 or 1 (울타리 회전 상태)

function initInventoryUI() {
  const hotbarEl = document.getElementById('hotbar-container');
  hotbarEl.innerHTML = '';
  
  for(let i=0; i<9; i++) {
    const slot = document.createElement('div');
    slot.className = `hotbar-slot ${i === activeSlot ? 'active' : ''}`;
    slot.onclick = () => selectHotbarSlot(i);
    
    const num = document.createElement('div'); num.className = 'slot-num'; num.textContent = i + 1; slot.appendChild(num);
    const itemId = hotbar[i];
    if(itemId && ITEM_DB[itemId]) {
      const item = ITEM_DB[itemId];
      slot.title = item.label; 
      if(item.icon) { const icon = document.createElement('div'); icon.className = 'slot-icon'; icon.textContent = item.icon; slot.appendChild(icon); }
      else if(item.color) { const swatch = document.createElement('div'); swatch.className = 'slot-swatch'; swatch.style.background = item.color; slot.appendChild(swatch); }
    }
    hotbarEl.appendChild(slot);
  }

  if(isInventoryOpen) {
      const previewEl = document.getElementById('inv-hotbar-grid');
      previewEl.innerHTML = '';
      for(let i=0; i<9; i++) {
        const slot = document.createElement('div');
        slot.className = `hotbar-slot ${i === activeSlot ? 'active' : ''}`;
        slot.onclick = () => { selectHotbarSlot(i); };
        const num = document.createElement('div'); num.className = 'slot-num'; num.textContent = i + 1; slot.appendChild(num);
        const itemId = hotbar[i];
        if(itemId && ITEM_DB[itemId]) {
          const item = ITEM_DB[itemId];
          slot.title = item.label; 
          if(item.icon) { const icon = document.createElement('div'); icon.className = 'slot-icon'; icon.textContent = item.icon; slot.appendChild(icon); }
          else if(item.color) { const swatch = document.createElement('div'); swatch.className = 'slot-swatch'; swatch.style.background = item.color; slot.appendChild(swatch); }
        }
        previewEl.appendChild(slot);
      }
  }

  document.getElementById('inv-tools').innerHTML = ''; 
  document.getElementById('inv-materials').innerHTML = ''; 
  document.getElementById('inv-nature').innerHTML = ''; 
  document.getElementById('inv-kits').innerHTML = '';

  for(const [id, item] of Object.entries(ITEM_DB)) {
    const div = document.createElement('div'); div.className = 'inv-item';
    div.onclick = () => { hotbar[activeSlot] = id; initInventoryUI(); applyCurrentTool(); toast(`${item.label} 장착됨 (슬롯 ${activeSlot+1})`); };
    if(item.icon) div.innerHTML = `<span>${item.icon}</span> ${item.label}`;
    else if(item.color) div.innerHTML = `<div class="slot-swatch" style="background:${item.color}; width:14px; height:14px;"></div> ${item.label}`;
    
    if(item.category === 'tool') document.getElementById('inv-tools').appendChild(div);
    else if(item.category === 'material') document.getElementById('inv-materials').appendChild(div);
    else if(item.category === 'nature') document.getElementById('inv-nature').appendChild(div); 
    else if(item.category === 'kit') document.getElementById('inv-kits').appendChild(div);
  }
}

function selectHotbarSlot(idx) { activeSlot = idx; initInventoryUI(); applyCurrentTool(); }
function clearSelectedSlot() { hotbar[activeSlot] = null; initInventoryUI(); applyCurrentTool(); toast(`슬롯 ${activeSlot+1} 비웠습니다.`); }

let toolMode = 'none', selItem = null;
function applyCurrentTool() {
  const itemId = hotbar[activeSlot];
  const labelEl = document.getElementById('hotbar-label');

  if(!itemId) { 
    toolMode = 'none'; selItem = null; updateHlMesh(); 
    labelEl.textContent = '빈 슬롯';
    labelEl.style.color = 'rgba(255,255,255,0.5)';
    labelEl.style.borderColor = 'transparent';
    return; 
  }
  
  const item = ITEM_DB[itemId];
  toolMode = item.type; selItem = itemId;
  updateHlMesh();

  labelEl.textContent = item.label;
  labelEl.style.color = '#FFD700';
  labelEl.style.borderColor = 'rgba(255,215,0,0.5)';
  labelEl.style.transform = 'translateX(-50%) scale(1.15)';
  setTimeout(() => { labelEl.style.transform = 'translateX(-50%) scale(1)'; }, 150);
}

function toggleInventory() {
  isInventoryOpen = !isInventoryOpen;
  document.getElementById('inventory-overlay').style.display = isInventoryOpen ? 'flex' : 'none';
  if(isInventoryOpen) initInventoryUI();
}

function toggleRotation() {
  currentRotation = (currentRotation + 1) % 2;
  updateHlMesh();
  toast(currentRotation === 1 ? '방향: 90도 회전' : '방향: 기본');
}

window.addEventListener('keydown', e => {
  if(e.key >= '1' && e.key <= '9') selectHotbarSlot(parseInt(e.key) - 1);
  if(e.key.toLowerCase() === 'e') toggleInventory();
  if(e.key.toLowerCase() === 'm') openMap();
  if(e.key.toLowerCase() === 'r') toggleRotation();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS & TERRAIN SCALE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CHUNK=8, GH=60; 
const WORLD_W=CHUNK*10, WORLD_D=CHUNK*10;
const WCX=WORLD_W/2, WCZ=WORLD_D/2;
const WATER_LEVEL = 30; 

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const gridData={}, meshByKey={}, animalData=[];
const chunkState={}, chunkGroups={};
const deletedBlocks=new Set();
let missionDone=false, pickedAnimal=null, injuredHealedCount=0;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SCENE SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const canvas=document.getElementById('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x87CEEB);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xc8e5f5,0.008);
const camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,0.1,500);

const ambient = new THREE.AmbientLight(0xfff0dd,0.52); scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff4c8,1.1);
sun.position.set(25,75,18); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-65; sun.shadow.camera.right=65;
sun.shadow.camera.bottom=-65; sun.shadow.camera.top=65;
sun.shadow.camera.far=180;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xaad4ff,0.3); fill.position.set(-15,20,-15); scene.add(fill);

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(350,32,16),
  new THREE.ShaderMaterial({
    side:THREE.BackSide,
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 t=vec3(.20,.48,.88),m=vec3(.46,.70,.91),r=vec3(.76,.88,.96);vec3 c=h>.15?mix(m,t,smoothstep(.15,.75,h)):mix(r,m,smoothstep(0.,.15,h));gl_FragColor=vec4(c,1.);}'
  })
));
const sunSph=new THREE.Mesh(new THREE.SphereGeometry(5,12,8),new THREE.MeshBasicMaterial({color:0xfffce0}));
sunSph.position.set(110,160,-150); scene.add(sunSph);

function mkCloud(x,y,z,s){
  const g=new THREE.Group(), mat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.90});
  [[0,0,0,5,1.8,3.5],[3,.5,0,3.5,1.4,2.8],[-3,.4,0,3.2,1.3,2.6],[.5,.8,2,3,1.2,2.2],[.5,.8,-2,2.8,1.1,2]].forEach(([px,py,pz,w,h,d])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(px,py,pz); g.add(m);
  });
  g.position.set(x,y,z); g.scale.setScalar(s); return g;
}
const cloudGroups=[[5,60,-12,1.1],[24,65,3,.9],[45,58,10,1.3],[-4,62,30,1],[20,68,50,1.2],[50,59,44,.85],[55,63,20,1],[-6,58,18,.8],[30,61,-10,1.1],[-20,65,-30,1.5],[-40,58,20,1.2]]
  .map(([x,y,z,s])=>{const c=mkCloud(x,y,z,s);scene.add(c);return{mesh:c,bx:x,bz:z};});

const waterDeep = new THREE.Mesh(
  new THREE.PlaneGeometry(5000,5000),
  new THREE.MeshLambertMaterial({color:0x012040, transparent:true, opacity:0.8, depthWrite:false, side:THREE.DoubleSide})
);
waterDeep.rotation.x=-Math.PI/2; waterDeep.position.y=WATER_LEVEL-0.5; scene.add(waterDeep);

const waterVolume = new THREE.Mesh(
  new THREE.PlaneGeometry(5000,5000),
  new THREE.MeshLambertMaterial({color:0x0a4b80, transparent:true, opacity:0.6, depthWrite:false, side:THREE.DoubleSide})
);
waterVolume.rotation.x=-Math.PI/2; waterVolume.position.y=WATER_LEVEL; scene.add(waterVolume);

const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshLambertMaterial({color:0x4a8a30}));
groundMesh.rotation.x=-Math.PI/2; groundMesh.position.set(0,-0.01,0);
groundMesh.receiveShadow=true; groundMesh.userData.isGround=true; scene.add(groundMesh);

const hlMesh=new THREE.Mesh(
  new THREE.BoxGeometry(1.02,1.02,1.02),
  new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3,depthTest:true})
);
hlMesh.visible=false; scene.add(hlMesh);

function updateHlMesh() {
  hlMesh.geometry.dispose();
  if(toolMode === 'block') {
    if(selItem === 'grass' || selItem === 'straw') {
      hlMesh.geometry = new THREE.BoxGeometry(1.02, 0.22, 1.02);
      hlMesh.rotation.y = 0;
    } else if(selItem === 'fence') {
      hlMesh.geometry = new THREE.BoxGeometry(1.02, 1.02, 0.22);
      hlMesh.rotation.y = currentRotation * (Math.PI / 2);
    } else {
      hlMesh.geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
      hlMesh.rotation.y = 0;
    }
  } else {
    hlMesh.geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    hlMesh.rotation.y = 0;
  }
}

const raycaster=new THREE.Raycaster(), mouse2D=new THREE.Vector2(-9999,-9999);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TERRAIN CALCULATION 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function vn(x,z){
  const h=n=>{let v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const a=h(ix+iz*57),b=h(ix+1+iz*57),c=h(ix+(iz+1)*57),d=h(ix+1+(iz+1)*57);
  return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;
}

function getH(wx,wz){
  const nx=wx*0.03, nz=wz*0.03;
  let base=vn(nx,nz)*4.0 + 36.0; 
  const mountains=Math.pow(vn(nx*0.5+100,nz*0.5+100),2.0)*(vn(nx*2.0,nz*2.0)*16.0);
  const riverNoise=Math.abs(vn(nx*0.6+50,nz*0.6+50)*2-1);
  const riverCarve=Math.max(0,1.0-riverNoise*3.5);
  
  let h=base+mountains;
  if(riverCarve>0) h=h-(riverCarve*18.0); 
  
  if(h>50.0) h=50.0+Math.sqrt(h-50.0)*1.5;
  return Math.min(GH,Math.max(10,Math.round(h))); 
}

function terrainType(y,sh){
  const underwater = sh < WATER_LEVEL;
  if(sh-y===0){
    if(underwater) return y<=22 ? 'r_sand' : 'r_gravel'; 
    return sh>=44?'t_rock':sh>=40?'t_high':sh>=36?'t_mid':sh>=34?'t_low':'t_dirt';
  }
  if(underwater) return sh-y<=3 ? 'r_sub' : 't_sub';
  return sh-y<=4 ? 't_dirt' : 't_sub';
}

function colColor(h){
  if(h < WATER_LEVEL) return 0x1565c0; 
  return h>=44?0x9a8878:h>=40?0x7a8e68:h>=36?0x4a7a3a:h>=34?0x6aaa5a:0x7a5c1e;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CHUNK & SPAWN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ck=(cx,cz)=>`${cx},${cz}`;
const w2c=(wx,wz)=>[Math.floor(wx/CHUNK),Math.floor(wz/CHUNK)];
const isActive=(wx,wz)=>chunkState[ck(...w2c(wx,wz))]==='active';

function spawnAnimalsInChunk(cx,cz){
  const x0=cx*CHUNK, z0=cz*CHUNK;
  const count=1+Math.floor(Math.random()*2);
  for(let i=0;i<count;i++){
    const wx=x0+Math.floor(Math.random()*CHUNK), wz=z0+Math.floor(Math.random()*CHUNK);
    const sh=getH(wx,wz);
    if(sh<WATER_LEVEL-1){ if(Math.random()<0.6) placeAnimal(wx,sh+0.5,wz,'fish'); }
    else if(sh>=WATER_LEVEL){ placeAnimal(wx,sh+1,wz,'sheep',Math.random()<0.3); }
  }
}

function bldActive(cx,cz){
  const x0=cx*CHUNK,z0=cz*CHUNK;
  for(let lx=0;lx<CHUNK;lx++) for(let lz=0;lz<CHUNK;lz++){
    const wx=x0+lx,wz=z0+lz,sh=getH(wx,wz);
    for(let y=0;y<=sh;y++) if(!deletedBlocks.has(bk(wx,y,wz))) _place(wx,y,wz,terrainType(y,sh));
  }
}

function bldPreview(cx,cz){
  const k=ck(cx,cz); if(chunkGroups[k]) scene.remove(chunkGroups[k]);
  const g=new THREE.Group(),x0=cx*CHUNK,z0=cz*CHUNK;
  
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);

  for(let lx=0;lx<CHUNK;lx++) for(let lz=0;lz<CHUNK;lz++){
    const wx=x0+lx,wz=z0+lz,sh=getH(wx,wz);
    const visH=sh<WATER_LEVEL?Math.ceil(WATER_LEVEL):sh;
    const col=sh<WATER_LEVEL?0x1565c0:colColor(sh);
    
    const mesh=new THREE.Mesh(boxGeo,new THREE.MeshLambertMaterial({color:col,transparent:true,opacity:0.15}));
    mesh.position.set(wx,visH+0.5,wz); 
    mesh.add(new THREE.LineSegments(edgeGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.25})));
    
    mesh.userData={isPreview:true,cx,cz}; g.add(mesh);
  }
  scene.add(g); chunkGroups[k]=g;
}

function rmVisible(cx,cz){ const k=ck(cx,cz); if(chunkGroups[k]){scene.remove(chunkGroups[k]);delete chunkGroups[k];} }

let gridHelperMesh=null;
function rebuildGrid(){
  if(gridHelperMesh) scene.remove(gridHelperMesh);
  let mnX=Infinity,mxX=-Infinity,mnZ=Infinity,mxZ=-Infinity;
  for(const[k,s] of Object.entries(chunkState)){
    if(s==='active'){const[cx,cz]=k.split(',').map(Number);mnX=Math.min(mnX,cx);mxX=Math.max(mxX,cx);mnZ=Math.min(mnZ,cz);mxZ=Math.max(mxZ,cz);}
  }
  if(mxX<mnX) return;
  const maxDim=Math.max(mxX-mnX+1,mxZ-mnZ+1);
  gridHelperMesh=new THREE.GridHelper(maxDim*CHUNK,maxDim*CHUNK,0x000000,0x000000);
  gridHelperMesh.material.opacity=0.07; gridHelperMesh.material.transparent=true;
  gridHelperMesh.position.set(((mnX+mxX+1)/2)*CHUNK-.5,.02,((mnZ+mxZ+1)/2)*CHUNK-.5);
  scene.add(gridHelperMesh);
}

function activateChunk(cx,cz,isInit=false){
  if(chunkState[ck(cx,cz)]==='active') return;
  rmVisible(cx,cz); chunkState[ck(cx,cz)]='active'; bldActive(cx,cz);
  if(!isInit) spawnAnimalsInChunk(cx,cz);
  
  const viewRadius = 2;
  for(let dx=-viewRadius;dx<=viewRadius;dx++) for(let dz=-viewRadius;dz<=viewRadius;dz++){
    if(dx===0&&dz===0) continue;
    const nx=cx+dx,nz=cz+dz,nk=ck(nx,nz);
    if(!chunkState[nk]||chunkState[nk]==='hidden'){chunkState[nk]='visible';bldPreview(nx,nz);}
  }
  rebuildGrid(); updateMapOverlay();
}

function initWorld(){
  activateChunk(0,0,true); activateChunk(1,0,true);
  activateChunk(0,1,true); activateChunk(1,1,true);
  placeAnimal(3,getTopY(3,3)+0.5,3,'sheep',true);
  placeAnimal(6,getTopY(6,4)+0.5,4,'sheep',false);
  placeAnimal(4,getTopY(4,6)+0.5,6,'sheep',false);
  
  initInventoryUI(); applyCurrentTool();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BLOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bk=(x,y,z)=>`${x},${y},${z}`;
function getTopY(x,z){for(let y=GH;y>=0;y--){if(gridData[bk(x,y,z)]) return y+1;}return 0;}

function getBlockData(rawType) {
  if(!rawType) return null;
  if(ITEM_DB[rawType]) return ITEM_DB[rawType];
  if(TERRAIN_BLOCKS[rawType]) return TERRAIN_BLOCKS[rawType];
  const baseType = rawType.split('_')[0];
  return ITEM_DB[baseType] || TERRAIN_BLOCKS[baseType];
}

function buildMesh(rawType,x,y,z){
  const def=getBlockData(rawType);
  if(!def) return null;

  let type = rawType;
  let rot = 0;
  if (rawType.startsWith('fence_')) {
      type = 'fence';
      rot = parseInt(rawType.split('_')[1]);
  }
  
  const mat=def.transparent
    ?new THREE.MeshLambertMaterial({color:def.hex,transparent:true,opacity:def.opacity})
    :new THREE.MeshLambertMaterial({color:def.hex});
    
  let geo, py = y + 0.5;
  if(type === 'grass' || type === 'straw') {
    geo = new THREE.BoxGeometry(1, 0.2, 1);
    py = y + 0.1;
  } else if(type === 'fence') {
    geo = new THREE.BoxGeometry(1, 1, 0.2); 
  } else {
    geo = new THREE.BoxGeometry(1, 1, 1);
  }

  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.set(x,py,z);
  if(type === 'fence') mesh.rotation.y = rot * (Math.PI / 2);
  mesh.castShadow=mesh.receiveShadow=true;
  mesh.userData={isBlock:true,bx:x,by:y,bz:z};
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0.14})));
  return mesh;
}

function _place(x,y,z,type){
  if(y<0||y>=GH) return;
  const k=bk(x,y,z);
  if(gridData[k]){scene.remove(meshByKey[k]);delete meshByKey[k];delete gridData[k];}
  gridData[k]=type; const mesh=buildMesh(type,x,y,z); if(mesh){meshByKey[k]=mesh; scene.add(mesh);}
  deletedBlocks.delete(k);
}

function placeBlock(x,y,z,type){
  if(!isActive(x,z)){toast('⚠️ 희미한 지역을 먼저 탐험해주세요!');return;}
  let finalType = type;
  if(type === 'fence') finalType = type + '_' + currentRotation;
  _place(x,y,z,finalType); checkMission();
}

function removeBlock(x,y,z){
  const k=bk(x,y,z); if(!gridData[k]) return;
  scene.remove(meshByKey[k]); delete meshByKey[k]; delete gridData[k];
  deletedBlocks.add(k); checkMission();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANIMALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildAnimal(type,isInjured){
  const g=new THREE.Group(), M=hex=>new THREE.MeshLambertMaterial({color:hex}), B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  const woolColor=isInjured?0x999999:0xe8e8e8;
  if(type==='sheep'){
    const b=new THREE.Mesh(B(.75,.55,.55),M(woolColor)); b.position.y=.45; g.add(b);
    const hd=new THREE.Mesh(B(.38,.35,.38),M(0xcccccc)); hd.position.set(.44,.65,0); g.add(hd);
    [[-.22,-.18],[.22,-.18],[-.22,.18],[.22,.18]].forEach(([lx,lz])=>{const l=new THREE.Mesh(B(.14,.28,.14),M(0xaaaaaa));l.position.set(lx,.14,lz);g.add(l);});
    [[-.08],[.08]].forEach(([ez])=>{const e=new THREE.Mesh(B(.07,.07,.07),M(0x111111));e.position.set(.6,.68,ez);g.add(e);});
  } else if(type==='fish'){
    const b=new THREE.Mesh(B(.6,.35,.28),M(0xff6b35)); b.position.y=.5; g.add(b);
    const t=new THREE.Mesh(B(.24,.3,.12),M(0xff4500)); t.position.set(-.38,.5,0); g.add(t);
    const f=new THREE.Mesh(B(.18,.18,.06),M(0xff8c00)); f.position.set(.05,.68,0); g.add(f);
    const e=new THREE.Mesh(B(.09,.09,.09),M(0x111111)); e.position.set(.28,.56,.15); g.add(e);
  }
  g.traverse(c=>{if(c.isMesh){c.castShadow=c.receiveShadow=true;c.userData.agr=g;}});
  return g;
}

function placeAnimal(x,y,z,type,isInjured=false){
  const group=buildAnimal(type,isInjured);
  group.position.set(x,y,z); scene.add(group);
  const angle=Math.random()*Math.PI*2;
  animalData.push({type,x,y,z,group,isInjured,angle,targetAngle:angle});
  checkMission();
}

function removeAnimalAt(a){
  const i=animalData.indexOf(a);
  if(i!==-1){scene.remove(animalData[i].group);animalData.splice(i,1);checkMission();}
}

function getVisualTopY(x, z) {
  const gy = getTopY(Math.round(x), Math.round(z));
  const underBlock = gridData[bk(Math.round(x), gy - 1, Math.round(z))];
  if(underBlock) {
      const t = underBlock.split('_')[0];
      if(t === 'grass' || t === 'straw') return (gy - 1) + 0.2;
  }
  return gy;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CAMERA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const orbitTarget=new THREE.Vector3(CHUNK, 38, CHUNK); 
let theta=0.7,phi=0.85,radius=36;

const keys={w:false,a:false,s:false,d:false,ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false, ' ':false, Shift:false};
window.addEventListener('keydown',e=>{ if(keys.hasOwnProperty(e.key)) keys[e.key]=true; if(e.key===' ') keys[' ']=true; });
window.addEventListener('keyup',e=>{ if(keys.hasOwnProperty(e.key)) keys[e.key]=false; if(e.key===' ') keys[' ']=false; });

function syncCam(){
  phi=Math.max(0.05,Math.min(Math.PI*0.95,phi)); 
  radius=Math.max(8,Math.min(140,radius));
  camera.position.set(orbitTarget.x+radius*Math.sin(phi)*Math.sin(theta),orbitTarget.y+radius*Math.cos(phi),orbitTarget.z+radius*Math.sin(phi)*Math.cos(theta));
  camera.lookAt(orbitTarget);
}
syncCam();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTERACTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isDragging=false, clickMoved=false, dragButton=0;
let mouseStart={x:0,y:0}, currentMouseX=0, currentMouseY=0;
let touchMode=null, touchTimer=null;
let digInterval=null, isHoldingPickaxe=false;
let lastClickTime=0, lastTouchTime=0;

function getRayTargets(){
  const am=[]; for(const a of animalData) a.group.traverse(c=>{if(c.isMesh)am.push(c);});
  const pm=[]; for(const g of Object.values(chunkGroups)) g.traverse(c=>{if(c.isMesh)pm.push(c);});
  return [groundMesh,...Object.values(meshByKey),...am,...pm];
}
function castRay(cx,cy){
  const r=canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1),camera);
  return raycaster.intersectObjects(getRayTargets(),false);
}

function doDig(clientX, clientY) {
  const hits=castRay(clientX, clientY);
  if(!hits.length) return;
  const obj=hits[0].object;
  
  if(obj.userData.isPreview){ activateChunk(obj.userData.cx, obj.userData.cz); toast('✨ 미지의 영역을 탐험했습니다!'); return; }

  if(obj.userData.agr){
    const a=animalData.find(a=>a.group===obj.userData.agr);
    if(a) removeAnimalAt(a);
  } else if(obj.userData.isBlock) {
    removeBlock(obj.userData.bx, obj.userData.by, obj.userData.bz);
  }
}

// Mouse
canvas.addEventListener('mousedown',e=>{
  if(isInventoryOpen) return;
  if(e.button===2&&pickedAnimal){cancelCarry();return;}
  if(e.button===0||e.button===2){
    isDragging=true; clickMoved=false; dragButton=e.button;
    mouseStart={x:e.clientX, y:e.clientY}; currentMouseX=e.clientX; currentMouseY=e.clientY;

    if(e.button===0 && toolMode==='pickaxe') {
      const now = Date.now();
      if (now - lastClickTime < 300) {
        isHoldingPickaxe=true;
        doDig(currentMouseX, currentMouseY); 
        digInterval = setInterval(()=>{ if(isHoldingPickaxe) doDig(currentMouseX, currentMouseY); }, 150); 
      } else {
        doDig(currentMouseX, currentMouseY);
      }
      lastClickTime = now;
    }
  }
});

canvas.addEventListener('mousemove',e=>{
  currentMouseX=e.clientX; currentMouseY=e.clientY;
  mouse2D.x=(e.clientX/window.innerWidth)*2-1; mouse2D.y=-(e.clientY/window.innerHeight)*2+1;
  
  if(!isDragging) return;
  const dx=e.clientX-mouseStart.x, dy=e.clientY-mouseStart.y;
  if(Math.abs(dx)>3||Math.abs(dy)>3) clickMoved=true;
  
  if(clickMoved){
    if(digInterval || isHoldingPickaxe) return;

    if(dragButton===0){
      const fwd=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize();
      const rgt=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
      const panSpd=radius*0.0018;
      orbitTarget.addScaledVector(rgt,-dx*panSpd); orbitTarget.addScaledVector(fwd, dy*panSpd);
    } else if (dragButton===2) {
      theta-=dx*.007; phi+=dy*.007;
    }
    mouseStart={x:e.clientX,y:e.clientY}; syncCam();
  }
});

canvas.addEventListener('mouseup',e=>{
  clearInterval(digInterval); digInterval=null; isHoldingPickaxe=false;
  if(isDragging && !clickMoved && e.button===0){
    if(toolMode !== 'pickaxe') handleClick(e.clientX, e.clientY);
  }
  isDragging=false;
});

// Touch
let initialPinchDist=null, initialRadius=null, initialPanCenter=null;
canvas.addEventListener('touchstart',e=>{
  if(isInventoryOpen) return;
  if(e.touches.length===1){
    touchMode='single'; isDragging=true; clickMoved=false; isHoldingPickaxe=false;
    currentMouseX=e.touches[0].clientX; currentMouseY=e.touches[0].clientY;
    mouseStart={x:currentMouseX,y:currentMouseY};

    if(toolMode==='pickaxe') {
      const now = Date.now();
      if (now - lastTouchTime < 300) {
        isHoldingPickaxe=true; doDig(currentMouseX, currentMouseY); if(navigator.vibrate) navigator.vibrate(50);
        digInterval=setInterval(()=>{ if(isHoldingPickaxe) doDig(currentMouseX, currentMouseY); }, 150);
      } else { doDig(currentMouseX, currentMouseY); if(navigator.vibrate) navigator.vibrate(20); }
      lastTouchTime = now;
    }
  } else if(e.touches.length===2){
    touchMode='zoom_pan'; isDragging=false; clearInterval(digInterval); isHoldingPickaxe=false;
    const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
    initialPinchDist=Math.sqrt(dx*dx+dy*dy); initialRadius=radius;
    initialPanCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
  }
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  if(isInventoryOpen) return; e.preventDefault();
  if(touchMode==='single' && e.touches.length===1){
    currentMouseX=e.touches[0].clientX; currentMouseY=e.touches[0].clientY;
    const dx=currentMouseX-mouseStart.x,dy=currentMouseY-mouseStart.y;
    if(Math.abs(dx)>5||Math.abs(dy)>5) clickMoved=true;
    if(clickMoved){
      if(digInterval || isHoldingPickaxe) return; 
      theta-=dx*.007; phi+=dy*.007; mouseStart={x:currentMouseX,y:currentMouseY}; syncCam();
    }
  } else if(touchMode==='zoom_pan' && e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.sqrt(dx*dx+dy*dy); radius=initialRadius*(initialPinchDist/dist);
    const cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
    const pdx=cx-initialPanCenter.x,pdy=cy-initialPanCenter.y;
    if(Math.abs(pdx)>2||Math.abs(pdy)>2){
      const forward=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize();
      const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
      orbitTarget.addScaledVector(right,-pdx*0.05); orbitTarget.addScaledVector(forward,pdy*0.05);
      initialPanCenter={x:cx,y:cy};
    }
    syncCam();
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  clearInterval(digInterval); digInterval=null; isHoldingPickaxe=false;
  if(touchMode==='single' && !clickMoved && e.changedTouches.length===1) {
    if(toolMode !== 'pickaxe') handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
  if(e.touches.length===0){touchMode=null; isDragging=false;}
});

canvas.addEventListener('mouseleave',()=>{isDragging=false; clearInterval(digInterval);});
canvas.addEventListener('wheel',e=>{radius+=e.deltaY*.04;syncCam();e.preventDefault();},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

function handleClick(clientX, clientY){
  const hits=castRay(clientX,clientY);
  if(pickedAnimal&&!hits.length){cancelCarry();return;}
  if(!hits.length) return;
  const hit=hits[0],obj=hit.object;

  if(obj.userData.isPreview){activateChunk(obj.userData.cx,obj.userData.cz);toast('✨ 미지의 영역을 탐험했습니다!');return;}

  if(pickedAnimal){
    let dx,dy,dz;
    if(obj.userData.isBlock){const n=hit.face.normal.clone().transformDirection(obj.matrixWorld);dx=obj.userData.bx+Math.round(n.x);dy=obj.userData.by+Math.round(n.y);dz=obj.userData.bz+Math.round(n.z);}
    else if(obj.userData.isGround){dx=Math.round(hit.point.x);dz=Math.round(hit.point.z);dy=getTopY(dx,dz);}
    else return;
    dropAnimal(dx,dy,dz); return;
  }

  if(toolMode==='action'){
    if(selItem==='heal'){
      if(obj.userData.agr){
        const a=animalData.find(a=>a.group===obj.userData.agr);
        if(a&&a.isInjured){
          const gx=Math.round(a.x),gz=Math.round(a.z),ty=getTopY(gx,gz)-1;
          const underFloor = gridData[bk(gx,ty,gz)] ? gridData[bk(gx,ty,gz)].split('_')[0] : '';
          if(underFloor==='straw'){
            a.isInjured=false; a.group.children[0].material.color.setHex(0xe8e8e8);
            injuredHealedCount++; toast('💖 치료 성공! 동물이 건강해졌어요!'); checkMission();
          } else { toast('⚠️ 다친 동물은 볏짚(보호소) 위에서 치료해야 해요!'); }
        } else if(a&&!a.isInjured){ toast('😊 이 동물은 이미 건강해요!'); }
      }
      return;
    }
    if(selItem==='carry'){
      if(obj.userData.agr){const a=animalData.find(a=>a.group===obj.userData.agr);if(a)pickUpAnimal(a);return;}
      toast('안아줄 동물을 정확히 클릭해주세요!');
      return;
    }
  }

  if(toolMode==='block'){
    if(obj.userData.isBlock){
      const n=hit.face.normal.clone().transformDirection(obj.matrixWorld);
      placeBlock(obj.userData.bx+Math.round(n.x),obj.userData.by+Math.round(n.y),obj.userData.bz+Math.round(n.z),selItem);
    } else if(obj.userData.isGround){
      const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z);
      placeBlock(gx,getTopY(gx,gz),gz,selItem);
    }
  }
}

function pickUpAnimal(entry){
  pickedAnimal={entry};
  entry.group.traverse(c=>{if(c.isMesh&&c.material){c.material=c.material.clone();c.material.emissive=new THREE.Color(0x886600);c.material.emissiveIntensity=.6;}});
  document.getElementById('carry-indicator').style.display='block';
}
function dropAnimal(x,y,z){
  if(!pickedAnimal) return;
  const{entry}=pickedAnimal; pickedAnimal=null;
  document.getElementById('carry-indicator').style.display='none';
  const i=animalData.indexOf(entry); if(i!==-1){scene.remove(entry.group);animalData.splice(i,1);}
  placeAnimal(x,y,z,entry.type,entry.isInjured);
}
function cancelCarry(){
  if(!pickedAnimal) return;
  const{entry}=pickedAnimal;
  entry.group.traverse(c=>{if(c.isMesh&&c.material){c.material.emissive=new THREE.Color(0);c.material.emissiveIntensity=0;}});
  entry.group.position.set(entry.x,entry.y,entry.z);
  pickedAnimal=null; document.getElementById('carry-indicator').style.display='none';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MISSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function isSolid(rawType) {
  if(!rawType) return false;
  const base = rawType.split('_')[0];
  const def = ITEM_DB[base] || TERRAIN_BLOCKS[base];
  return def && def.solid;
}

function analyzeHabitat(sx,sz){
  const v=new Set(),q=[[sx,sz]]; v.add(`${sx},${sz}`);
  let count=0,grassCount=0;
  while(q.length){
    count++;
    if(count>2000) return {enclosed:false,grass:0};
    const[cx,cz]=q.shift();
    const topY=getTopY(cx,cz)-1;
    const rawType=gridData[bk(cx,topY,cz)];
    const floorType=rawType?rawType.split('_')[0]:'';
    
    if(floorType==='grass'||floorType==='t_low'||floorType==='t_mid') grassCount++;
    for(const[nx,nz] of[[cx+1,cz],[cx-1,cz],[cx,cz+1],[cx,cz-1]]){
      const nk=`${nx},${nz}`; if(v.has(nk)) continue;
      const blocked=[0,1].some(hy=>{
        const b = gridData[bk(nx, topY+1+hy, nz)];
        return isSolid(b);
      });
      if(!blocked){v.add(nk);q.push([nx,nz]);}
    }
  }
  return {enclosed:true,grass:grassCount};
}

function checkMission(){
  const sheepList=animalData.filter(a=>a.type==='sheep');
  let enclosedCount=0,maxGrass=0;
  for(const s of sheepList){
    const r=analyzeHabitat(Math.round(s.x),Math.round(s.z));
    if(r.enclosed){enclosedCount++;if(r.grass>maxGrass)maxGrass=r.grass;}
  }
  const eHeal=document.getElementById('mc-heal'),eS=document.getElementById('mc-sheep'),eG=document.getElementById('mc-grass');
  eHeal.textContent=`${injuredHealedCount>=1?'✅':'⬜'} 다친 양 치료 ${injuredHealedCount}/1`; eHeal.className=`mc${injuredHealedCount>=1?' done':''}`;
  eS.textContent=`${enclosedCount>=3?'✅':'⬜'} 보호된 양 ${enclosedCount}/3`; eS.className=`mc${enclosedCount>=3?' done':''}`;
  const fg=Math.min(6,maxGrass);
  eG.textContent=`${fg>=6?'✅':'⬜'} 서식지 내 풀밭 ${fg}/6`; eG.className=`mc${fg>=6?' done':''}`;
  if(injuredHealedCount>=1&&enclosedCount>=3&&fg>=6&&!missionDone){missionDone=true;setTimeout(()=>{document.getElementById('mission-clear').style.display='block';},600);}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UI & MAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateMapOverlay(){
  const grid=document.getElementById('map-grid');
  let mnX=Infinity,mxX=-Infinity,mnZ=Infinity,mxZ=-Infinity;
  for(const k in chunkState){const[cx,cz]=k.split(',').map(Number);if(cx<mnX)mnX=cx;if(cx>mxX)mxX=cx;if(cz<mnZ)mnZ=cz;if(cz>mxZ)mxZ=cz;}
  if(mnX===Infinity) return;
  const cols=mxX-mnX+1;
  grid.innerHTML=''; grid.style.gridTemplateColumns=`repeat(${cols},minmax(20px,34px))`;
  for(let cz=mnZ;cz<=mxZ;cz++) for(let cx=mnX;cx<=mxX;cx++){
    const st=chunkState[ck(cx,cz)]||'hidden';
    const cell=document.createElement('div'); cell.className=`mc-cell ${st}`;
    if(st==='active') cell.textContent='🟢';
    else if(st==='visible'){cell.textContent='🟠';cell.onclick=()=>{activateChunk(cx,cz);toast('✨ 탐험!');closeMap();};}
    else cell.textContent='⬛';
    grid.appendChild(cell);
  }
}
function openMap(){updateMapOverlay();document.getElementById('map-overlay').style.display='flex';}
function closeMap(){document.getElementById('map-overlay').style.display='none';}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SAVE / LOAD / CLEAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function saveGame(){
  const activeList=Object.entries(chunkState).filter(([,v])=>v==='active').map(([k])=>k);
  const terrainSet=new Set(Object.keys(TERRAIN_BLOCKS));
  const userGrid={};
  for(const[k,v] of Object.entries(gridData)) if(!terrainSet.has(v)) userGrid[k]=v;
  const data={v:8,chunks:activeList,grid:userGrid,deleted:Array.from(deletedBlocks),animals:animalData.map(({type,x,y,z,isInjured})=>({type,x,y,z,isInjured})),missionDone,injuredHealedCount};
  try{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url; a.download='애니멀어드벤쳐_저장.json'; a.click(); URL.revokeObjectURL(url);
    toast('💾 저장됐어요!');
  }catch{toast('저장 실패 😢');}
}
function loadGame(){document.getElementById('file-input').click();}
function onFileSelected(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const data=JSON.parse(ev.target.result);
      clearAll(true);
      deletedBlocks.clear(); for(const k of(data.deleted||[]))deletedBlocks.add(k);
      for(const k of(data.chunks||[])){const[cx,cz]=k.split(',').map(Number);activateChunk(cx,cz,true);}
      for(const[k,t] of Object.entries(data.grid||[])){const[x,y,z]=k.split(',').map(Number);_place(x,y,z,t);}
      for(const a of(data.animals||[]))placeAnimal(a.x,a.y,a.z,a.type,a.isInjured);
      missionDone=data.missionDone||false; injuredHealedCount=data.injuredHealedCount||0;
      checkMission(); toast('📂 불러왔어요!');
    }catch{toast('파일을 읽을 수 없어요 😢');}
    e.target.value='';
  };
  reader.readAsText(file);
}
function clearAll(silent=false){
  for(const m of Object.values(meshByKey))scene.remove(m);
  Object.keys(meshByKey).forEach(k=>delete meshByKey[k]); Object.keys(gridData).forEach(k=>delete gridData[k]);
  for(const g of Object.values(chunkGroups))scene.remove(g);
  Object.keys(chunkGroups).forEach(k=>delete chunkGroups[k]); Object.keys(chunkState).forEach(k=>delete chunkState[k]);
  for(const a of animalData)scene.remove(a.group); animalData.length=0;
  deletedBlocks.clear(); missionDone=false; injuredHealedCount=0;
  initWorld(); checkMission();
  if(!silent)toast('🗑️ 처음으로 돌아갔어요');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANIMATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let toastTimer;
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.style.display='none';},2400);}

canvas.addEventListener('mousemove',()=>{
  raycaster.setFromCamera(mouse2D,camera);
  const hits=raycaster.intersectObjects(getRayTargets(),false);
  if(!hits.length){hlMesh.visible=false;return;}
  const hit=hits[0],obj=hit.object;
  if(obj.userData.isBlock){
    const n=hit.face.normal.clone().transformDirection(obj.matrixWorld);
    const nx=obj.userData.bx+Math.round(n.x);
    const ny=obj.userData.by+Math.round(n.y);
    const nz=obj.userData.bz+Math.round(n.z);
    let py = ny + 0.5;
    if(toolMode === 'block' && (selItem === 'grass' || selItem === 'straw')) py = ny + 0.1;
    hlMesh.position.set(nx, py, nz); hlMesh.visible=true;
  }
  else if(obj.userData.isGround){
    const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z);
    const ny = getTopY(gx,gz);
    let py = ny + 0.5;
    if(toolMode === 'block' && (selItem === 'grass' || selItem === 'straw')) py = ny + 0.1;
    hlMesh.position.set(gx, py, gz); hlMesh.visible=true;
  }
  else hlMesh.visible=false;
});

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

let t=0;
function animate(){
  requestAnimationFrame(animate); t+=.016;

  let camMoved=false;
  const spd=0.4;
  const fwd=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize();
  const rgt=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
  if(keys.w||keys.ArrowUp){orbitTarget.addScaledVector(fwd,spd);camMoved=true;}
  if(keys.s||keys.ArrowDown){orbitTarget.addScaledVector(fwd,-spd);camMoved=true;}
  if(keys.a||keys.ArrowLeft){orbitTarget.addScaledVector(rgt,-spd);camMoved=true;}
  if(keys.d||keys.ArrowRight){orbitTarget.addScaledVector(rgt,spd);camMoved=true;}
  if(keys[' ']){orbitTarget.y += spd; camMoved=true;} 
  if(keys.Shift){orbitTarget.y -= spd; camMoved=true;} 
  if(camMoved) syncCam();

  if(camera.position.y<WATER_LEVEL){
    scene.fog.color.setHex(0x021b3a); scene.fog.density=0.08; renderer.setClearColor(0x021b3a);
  } else {
    scene.fog.color.setHex(0xc8e5f5); scene.fog.density=0.008; renderer.setClearColor(0x87CEEB);
  }

  waterVolume.position.y=WATER_LEVEL+Math.sin(t*1.5)*0.04;
  waterDeep.position.y=WATER_LEVEL-0.5+Math.sin(t*1.5)*0.02;

  // ━━ 동물 애니메이션 ━━
  for(const a of animalData){
    if(pickedAnimal&&pickedAnimal.entry===a){
      a.group.position.y=a.y+1.5+Math.sin(t*4)*.12; a.group.rotation.y=t*1.5; continue;
    }

    const curTopY=getVisualTopY(a.x,a.z);

    if(a.type==='fish'){
      if(curTopY<WATER_LEVEL){
        const spd=0.022, look=3.5;
        const fwdX=a.x+Math.cos(a.angle)*look, fwdZ=a.z-Math.sin(a.angle)*look;
        const fwdY=getTopY(Math.round(fwdX),Math.round(fwdZ));

        if(fwdY>=WATER_LEVEL-0.5){
          const la=a.angle+Math.PI*0.6, ra=a.angle-Math.PI*0.6;
          const lY=getTopY(Math.round(a.x+Math.cos(la)*look),Math.round(a.z-Math.sin(la)*look));
          const rY=getTopY(Math.round(a.x+Math.cos(ra)*look),Math.round(a.z-Math.sin(ra)*look));
          a.targetAngle=(lY<rY?la:ra)+(Math.random()-0.5)*0.5;
        } else if(Math.random()<0.012){
          a.targetAngle=a.angle+(Math.random()-0.5)*1.0;
        }

        let diff=a.targetAngle-a.angle;
        while(diff>Math.PI) diff-=2*Math.PI; while(diff<-Math.PI) diff+=2*Math.PI;
        a.angle+=diff*0.07;

        const nx=a.x+Math.cos(a.angle)*spd, nz=a.z-Math.sin(a.angle)*spd;
        const nY=getTopY(Math.round(nx),Math.round(nz));
        if(nY<WATER_LEVEL){ a.x=nx; a.z=nz; }
        else { a.targetAngle=a.angle+Math.PI+(Math.random()-0.5)*0.8; }

        const depth=Math.max(0.4,WATER_LEVEL-curTopY);
        const swimY=curTopY+depth*0.35+Math.sin(t*1.8+a.x)*0.12;
        a.group.position.set(a.x,swimY,a.z);
        a.group.rotation.y=a.angle; 
        a.group.rotation.z=Math.sin(t*2)*0.04;
      } else {
        a.group.position.set(a.x,curTopY+0.2+Math.abs(Math.sin(t*15))*0.3,a.z);
        a.group.rotation.z=Math.sin(t*20)*0.5;
      }

    } else {
      if(toolMode==='action'&&selItem==='lure'&&hlMesh.visible&&a.type==='sheep'){
        const dx=hlMesh.position.x-a.x, dz=hlMesh.position.z-a.z;
        const dist=Math.sqrt(dx*dx+dz*dz);
        if(dist>1.5&&dist<12){
          const ws=a.isInjured?0.015:0.04;
          a.x+=dx/dist*ws; a.z+=dz/dist*ws;
          a.targetAngle=Math.atan2(-dz, dx); 
        }
      }
      
      let diff=a.targetAngle-a.angle;
      while(diff>Math.PI) diff-=2*Math.PI; while(diff<-Math.PI) diff+=2*Math.PI;
      a.angle+=diff*0.1;
      
      // ✨ 얇은 블록 위로도 자연스럽게 오르는 스마트 스텝
      const aheadX = a.x + Math.cos(a.angle)*0.4;
      const aheadZ = a.z - Math.sin(a.angle)*0.4;
      const aheadY = getVisualTopY(aheadX, aheadZ);
      
      a.y += (aheadY - a.y) * 0.25; 

      a.group.position.set(a.x, a.y+Math.sin(t*2.5+a.x)*0.06, a.z);
      a.group.rotation.y=a.angle;
      a.group.rotation.z=0;
    }
  }

  for(const c of cloudGroups){c.mesh.position.x=c.bx+Math.sin(t*.035+c.bz*.1)*4;c.mesh.position.z=c.bz+Math.cos(t*.025+c.bx*.08)*3;}
  renderer.render(scene,camera);
}

initWorld(); checkMission(); animate();
</script>
</body>
</html>
