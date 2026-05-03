// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UI 함수 (인벤토리, 단축키, 오프닝, 지도 등)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const messageHistory = [];
let isMessageLogOpen = false;

function toast(msg) {
  // 로그에 추가
  const timeStr = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  messageHistory.push({ time: timeStr, text: msg });
  if (isMessageLogOpen) renderMessageLog();

  // 화면 우측 하단에 스택 생성
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.innerHTML = msg;
  container.appendChild(el);

  // 애니메이션 끝나면 자동 제거 (fadeOut은 4.5초 뒤 완전히 투명해짐)
  setTimeout(() => {
    if (el.parentNode === container) container.removeChild(el);
  }, 4600);
}

function toggleMessageLog() {
  const overlay = document.getElementById('message-log-overlay');
  isMessageLogOpen = overlay.style.display === 'none';
  overlay.style.display = isMessageLogOpen ? 'flex' : 'none';
  if (isMessageLogOpen) {
    renderMessageLog();
  }
}

function renderMessageLog() {
  const content = document.getElementById('message-log-content');
  if (!content) return;
  if (messageHistory.length === 0) {
    content.innerHTML = '<div class="log-item" style="text-align:center; color:#888;">아직 기록된 알림이 없습니다.</div>';
    return;
  }
  content.innerHTML = messageHistory.map(log => `
    <div class="log-item">
      <div class="log-time">${log.time}</div>
      <div>${log.text}</div>
    </div>
  `).join('');
  content.scrollTop = content.scrollHeight;
}

function showWaterGauge(level, isOver=false) {
  const el = document.getElementById('water-gauge');
  const bar = document.getElementById('gauge-bar');
  const filled = Math.min(10, level);
  bar.textContent = '█'.repeat(filled) + '░'.repeat(10-filled);
  el.style.borderColor = isOver ? '#ff5252' : '#4fc3f7';
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.style.display='none', 2000);
}

function showPhaseTransition(phase) {
  const messages = {
    2: { emoji:'🌱', text:'식물과 흙이 살아났어요!<br>이제 곤충과 새가 돌아올 거예요.' },
    3: { emoji:'🦋', text:'하늘이 활기로 가득해요!<br>이제 동물들의 차례예요.' },
    4: { emoji:'🌍', text:'생태계의 톱니바퀴가 다시 돌아갑니다!<br>보스 챌린지 준비!' }
  };
  const msg = messages[phase];
  if(!msg) return;
  document.getElementById('pt-emoji').textContent = msg.emoji;
  document.getElementById('pt-text').innerHTML = msg.text;
  const el = document.getElementById('phase-transition');
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function initInventoryUI() {
  const hotbarEl = document.getElementById('hotbar-container');
  hotbarEl.innerHTML = '';
  for(let i=0; i<9; i++) {
    const slot = document.createElement('div');
    slot.className = `hotbar-slot ${i===activeSlot?'active':''}`;
    slot.onclick = () => selectHotbarSlot(i);
    const num = document.createElement('div'); num.className='slot-num'; num.textContent=i+1; slot.appendChild(num);
    const itemId = hotbar[i];
    if(itemId && ITEM_DB[itemId]) {
      const item = ITEM_DB[itemId];
      slot.title = item.label;
      if(item.icon) { const icon=document.createElement('div'); icon.className='slot-icon'; icon.textContent=item.icon; slot.appendChild(icon); }
      else if(item.color) { const sw=document.createElement('div'); sw.className='slot-swatch'; sw.style.background=item.color; slot.appendChild(sw); }
      
      if(QuestManager.currentPhase === 1) {
        const s = QuestManager.phase1State;
        if(!s.toxicRemoved && itemId === 'shovel') slot.classList.add('slot-glowing');
        else if(s.toxicRemoved && !s.tomatoFruited && (itemId === 'seed_tomato' || itemId === 'watering_can')) slot.classList.add('slot-glowing');
        else if(s.tomatoFruited && !s.wormDone && itemId === 'fallen_leaf') slot.classList.add('slot-glowing');
      }
    } else {
      const icon = document.createElement('div'); icon.className = 'slot-icon'; icon.textContent = '🖐️'; slot.appendChild(icon);
      icon.style.opacity = '0.4'; slot.title = '맨손 (관찰/이동)';
    }
    hotbarEl.appendChild(slot);
  }
  if(isInventoryOpen) {
    const previewEl = document.getElementById('inv-hotbar-grid');
    previewEl.innerHTML = '';
    for(let i=0; i<9; i++) {
      const slot=document.createElement('div'); slot.className=`hotbar-slot ${i===activeSlot?'active':''}`;
      slot.onclick=()=>selectHotbarSlot(i);
      const num=document.createElement('div'); num.className='slot-num'; num.textContent=i+1; slot.appendChild(num);
      const itemId=hotbar[i];
      if(itemId && ITEM_DB[itemId]) {
        const item=ITEM_DB[itemId]; slot.title=item.label;
        if(item.icon){const icon=document.createElement('div');icon.className='slot-icon';icon.textContent=item.icon;slot.appendChild(icon);}
        else if(item.color){const sw=document.createElement('div');sw.className='slot-swatch';sw.style.background=item.color;slot.appendChild(sw);}
        
        if(QuestManager.currentPhase === 1) {
          const s = QuestManager.phase1State;
          if(!s.toxicRemoved && itemId === 'shovel') slot.classList.add('slot-glowing');
          else if(s.toxicRemoved && !s.tomatoFruited && (itemId === 'seed_tomato' || itemId === 'watering_can')) slot.classList.add('slot-glowing');
          else if(s.tomatoFruited && !s.wormDone && itemId === 'fallen_leaf') slot.classList.add('slot-glowing');
        }
      } else {
        const icon = document.createElement('div'); icon.className = 'slot-icon'; icon.textContent = '🖐️'; slot.appendChild(icon);
        icon.style.opacity = '0.4'; slot.title = '맨손 (관찰/이동)';
      }
      previewEl.appendChild(slot);
    }
  }
  ['inv-tools','inv-seeds','inv-resources','inv-materials','inv-nature','inv-kits'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.innerHTML='';
  });
  for(const [id,item] of Object.entries(ITEM_DB)) {
    const div=document.createElement('div'); div.className='inv-item';
    div.onclick=()=>{ hotbar[activeSlot]=id; initInventoryUI(); applyCurrentTool(); toast(`${item.label} 장착됨 (슬롯 ${activeSlot+1})`); };
    if(item.icon) div.innerHTML=`<span>${item.icon}</span> ${item.label}`;
    else if(item.color) div.innerHTML=`<div class="slot-swatch" style="background:${item.color};width:14px;height:14px;"></div> ${item.label}`;
    const catMap = { tool:'inv-tools', seed:'inv-seeds', resource:'inv-resources', material:'inv-materials', nature:'inv-nature', plant:'inv-nature', kit:'inv-kits' };
    const target = document.getElementById(catMap[item.category]);
    if(target) target.appendChild(div);
  }
}

function selectHotbarSlot(idx) { activeSlot=idx; initInventoryUI(); applyCurrentTool(); }
function clearSelectedSlot() { hotbar[activeSlot]=null; initInventoryUI(); applyCurrentTool(); toast(`슬롯 ${activeSlot+1} 비웠습니다.`); }

function applyCurrentTool() {
  const itemId = hotbar[activeSlot];
  const labelEl = document.getElementById('hotbar-label');
  if(!itemId) {
    toolMode='bare'; selItem=null; updateHlMesh();
    labelEl.textContent='🖐️ 맨손 (관찰/이동)'; labelEl.style.color='rgba(255,255,255,0.5)'; labelEl.style.borderColor='transparent'; return;
  }
  const item = ITEM_DB[itemId];
  toolMode=item.type; selItem=itemId; updateHlMesh();
  labelEl.textContent=item.label; labelEl.style.color='#FFD700'; labelEl.style.borderColor='rgba(255,215,0,0.5)';
  labelEl.style.transform='translateX(-50%) scale(1.15)';
  setTimeout(()=>{ labelEl.style.transform='translateX(-50%) scale(1)'; }, 150);
}

function toggleInventory() {
  isInventoryOpen=!isInventoryOpen;
  document.getElementById('inventory-overlay').style.display=isInventoryOpen?'flex':'none';
  if(isInventoryOpen) initInventoryUI();
}
function toggleRotation() {
  currentRotation=(currentRotation+1)%2; updateHlMesh();
  toast(currentRotation===1?'방향: 90도 회전':'방향: 기본');
}

window.addEventListener('keydown',e=>{
  if(e.key>='1'&&e.key<='9') selectHotbarSlot(parseInt(e.key)-1);
  if(e.key.toLowerCase()==='e') toggleInventory();
  if(e.key.toLowerCase()==='b') toggleGuardianBook();
  if(e.key.toLowerCase()==='m') openMap();
  if(e.key.toLowerCase()==='r') toggleRotation();
});

let isGuardianBookOpen = false;
function toggleGuardianBook() {
  isGuardianBookOpen = !isGuardianBookOpen;
  document.getElementById('guardian-book-overlay').style.display = isGuardianBookOpen ? 'flex' : 'none';
  if(isGuardianBookOpen) renderGuardianBook();
}

function renderGuardianBook() {
  const grid = document.getElementById('guardian-grid');
  grid.innerHTML = '';
  let joinedCount = GuardianSystem.getJoinedCount();
  document.getElementById('guardian-book-title').textContent = `📖 초록별 수호대 모으기: ${joinedCount} / 12`;
  
  const detailEl = document.getElementById('guardian-detail');
  detailEl.style.display = 'none';

  Object.values(GUARDIAN_DATA).forEach(data => {
    const state = guardianState[data.id] || 0;
    const card = document.createElement('div');
    card.className = 'guardian-card';
    card.dataset.state = state;
    
    let displayEmoji = state === 0 ? '❔' : data.emoji;
    let displayName = state === 0 ? '???' : data.name;
    
    card.innerHTML = `<div class="emoji">${displayEmoji}</div><div class="name">${displayName}</div>`;
    
    card.onclick = () => {
      document.querySelectorAll('.guardian-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      detailEl.style.display = 'block';
      
      document.getElementById('gd-emoji').textContent = state === 0 ? '❔' : data.emoji;
      document.getElementById('gd-name').textContent = state === 0 ? '???' : data.name;
      document.getElementById('gd-title').textContent = state === 0 ? '발견되지 않은 수호대' : `"${data.title}"`;
      
      let storyHTML = '', perHTML = '', hintHTML = '';
      if(state === 0) {
        storyHTML = '아직 이 동물에 대해 알지 못합니다. 마을 어딘가에 흔적이 있을지도 몰라요.';
      } else if(state === 1) {
        storyHTML = '누군가 도움이 필요한 것 같습니다.';
        hintHTML = `💡 힌트: ${data.hint}`;
      } else {
        storyHTML = data.story;
        perHTML = `<b>성격:</b> ${data.personality}`;
      }
      
      document.getElementById('gd-story').innerHTML = storyHTML;
      document.getElementById('gd-personality').innerHTML = perHTML;
      document.getElementById('gd-hint').innerHTML = hintHTML;
    };
    
    grid.appendChild(card);
  });
}

function nextScene() {
  openingStep++;
  if(openingStep >= openingScenes.length) {
    document.getElementById('opening-overlay').style.display = 'none';
    isOpeningActive = false;
    Level1Manager.currentPhase = 0;
    QuestManager.updateUI();
    QuestManager.check();
    return;
  }
  const sc = openingScenes[openingStep];
  document.getElementById('opening-emoji').textContent = sc.emoji;
  document.getElementById('opening-text').innerHTML = sc.text;
  document.getElementById('opening-btn').textContent = sc.btn;
}

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
//  저장 / 불러오기 / 초기화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function saveGame(){
  const activeList=Object.entries(chunkState).filter(([,v])=>v==='active').map(([k])=>k);
  const terrainSet=new Set(Object.keys(TERRAIN_BLOCKS));
  const userGrid={};
  for(const[k,v] of Object.entries(gridData)) if(!terrainSet.has(v)) userGrid[k]=v;
  const data={
    v:13, chunks:activeList, grid:userGrid, deleted:Array.from(deletedBlocks),
    animals:animalData.map(({type,x,y,z,isInjured,angle})=>({type,x,y,z,isInjured,angle})),
    currentLevel: currentLevel,
    themeComplete:Level1Manager.themeComplete,
    currentPhase:Level1Manager.currentPhase,
    phaseComplete:Level1Manager.phaseComplete,
    injuredHealedCount:Level1Manager.injuredHealedCount,
    phase1State:Level1Manager.phase1State,
    oldTreeState:OldTree.state,
    oldTreeChopCount:OldTree.chopCount,
    cluesFound:ClueSystem.clues.map(c=>({id:c.id,found:c.found})),
    sysState: {
      leafCollected: LeafSystem.collected,
      waterMoisture: WateringSystem.moisture,
      seedsPlanted: SeedSystem.planted,
      aphidActive: AphidSystem.active,
      aphidTarget: AphidSystem.targetPlant,
      toxicRemoved: ToxicPlantSystem.removed
    },
    guardianState: guardianState
  };
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
      clearAll(true); // Now clearAll doesn't call initWorld when silent=true
      deletedBlocks.clear(); for(const k of(data.deleted||[]))deletedBlocks.add(k);
      initWorld(); // Call initWorld AFTER restoring deletedBlocks so bldActive respects them
      for(const k of(data.chunks||[])){const[cx,cz]=k.split(',').map(Number);activateChunk(cx,cz,true);}
      for(const[k,t] of Object.entries(data.grid||[])){const[x,y,z]=k.split(',').map(Number);_place(x,y,z,t);}
      for(const a of(data.animals||[]))placeAnimal(a.x,a.y,a.z,a.type,a.isInjured);

      currentLevel = data.currentLevel || 1;
      Level1Manager.themeComplete=data.themeComplete||{};
      Level1Manager.currentPhase=data.currentPhase!==undefined?data.currentPhase:0;
      Level1Manager.phaseComplete=data.phaseComplete||{};
      Level1Manager.injuredHealedCount=data.injuredHealedCount||0;
      Level1Manager.phase1State={
        toxicRemoved:  data.phase1State?.toxicRemoved  || false,
        tomatoFruited: data.phase1State?.tomatoFruited || false,
        wormDone:      data.phase1State?.wormDone      || false,
        treeGrowing:   data.phase1State?.treeGrowing   || false
      };

      OldTree.state=data.oldTreeState||'withered';
      OldTree.chopCount=data.oldTreeChopCount||0;
      OldTree.updateVisual();

      if(data.cluesFound){ data.cluesFound.forEach(saved=>{ const clue=ClueSystem.clues.find(c=>c.id===saved.id); if(clue) clue.found=saved.found; }); }
      ClueSystem.init();

      if(data.sysState) {
        LeafSystem.collected = data.sysState.leafCollected || 0;
        WateringSystem.moisture = data.sysState.waterMoisture || {};
        SeedSystem.planted = data.sysState.seedsPlanted || {};
        AphidSystem.active = data.sysState.aphidActive || false;
        AphidSystem.targetPlant = data.sysState.aphidTarget || null;
        ToxicPlantSystem.removed = data.sysState.toxicRemoved || 0;
        if (AphidSystem.active && AphidSystem.targetPlant) {
          AphidSystem.active = false; // Reset to allow summon again
          AphidSystem.attack(AphidSystem.targetPlant.x, AphidSystem.targetPlant.z);
        }
      }
      
      if(data.guardianState) {
        guardianState = data.guardianState;
      }

      // phaseComplete[1]=true인데 currentPhase가 1에 머문 경우 자동 보정
      if (Level1Manager.currentPhase === 1 && Level1Manager.phaseComplete[1]) {
        Level1Manager.currentPhase = 2;
      }
      if (Level1Manager.currentPhase === 2) Phase2System.init();
      else if (Level1Manager.currentPhase >= 3) Phase3System.init();
      QuestManager.updateUI(); QuestManager.check(); toast('📂 불러왔어요!');
    }catch{ toast('파일을 읽을 수 없어요 😢'); }
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
  deletedBlocks.clear();
  if (typeof Phase2System !== 'undefined') Phase2System._clearAll();
  if (typeof Phase3System !== 'undefined') Phase3System._clearAll();
  currentLevel = 1;
  Level1Manager.themeComplete={};
  Level1Manager.currentPhase=0;
  Level1Manager.phaseComplete={};
  Level1Manager.injuredHealedCount=0;
  Level1Manager.phase1State={ toxicRemoved:false, tomatoFruited:false, wormDone:false, treeGrowing:false };
  OldTree.chopCount=0; OldTree.state='withered';
  
  Object.keys(guardianState).forEach(k => guardianState[k] = 0);
  ClueSystem.clues.forEach(c=>c.found=false);
  LeafSystem.meshes.forEach(m=>scene.remove(m));
  LeafSystem.meshes=[]; LeafSystem.collected=0;
  if(!silent) {
    initWorld(); QuestManager.updateUI(); QuestManager.check();
    toast('🗑️ 처음으로 돌아갔어요');
  }
}

function showEcoPopup(emoji, htmlText) {
  const popup = document.getElementById('eco-popup');
  if(!popup) return;
  document.getElementById('eco-emoji').textContent = emoji;
  document.getElementById('eco-text').innerHTML = htmlText;
  popup.classList.add('show');
  setTimeout(() => { popup.classList.remove('show'); }, 4000);
}

// 개발 테스트용 — 브라우저 콘솔에서 goPhase(2) 또는 goPhase(3) 으로 호출
window.goPhase = function(n) {
  isOpeningActive = false;
  document.getElementById('opening-overlay').style.display = 'none';
  Level1Manager.phaseComplete = {};
  for(let i = 1; i < n; i++) Level1Manager.phaseComplete[i] = true;
  Level1Manager.phase1State = { toxicRemoved:true, tomatoFruited:true, wormDone:true, treeGrowing:true };
  Level1Manager.currentPhase = n;
  if(n === 2) Phase2System.init();
  else if(n >= 3) { Phase2System._clearAll(); Phase3System.init(); }
  QuestManager.updateUI();
  toast(`🔧 페이즈 ${n}로 이동했어요 (개발자 모드)`);
};
