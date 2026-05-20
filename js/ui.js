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

function _buildHotbarSlot(i) {
  const slot = document.createElement('div');
  slot.className = `hotbar-slot ${i === activeSlot ? 'active' : ''}`;
  slot.onclick = () => selectHotbarSlot(i);
  const num = document.createElement('div'); num.className = 'slot-num'; num.textContent = i + 1; slot.appendChild(num);
  const itemId = hotbar[i];
  if (itemId && ITEM_DB[itemId]) {
    const item = ITEM_DB[itemId]; slot.title = item.label;
    if (item.icon) { const ic = document.createElement('div'); ic.className = 'slot-icon'; ic.textContent = item.icon; slot.appendChild(ic); }
    else if (item.color) { const sw = document.createElement('div'); sw.className = 'slot-swatch'; sw.style.background = item.color; slot.appendChild(sw); }
    const ph = QuestManager.getCurrentPhase(), lm = QuestManager.levels[1];
    if (ph === 1 && lm) {
      const s = lm.phase1State;
      if (!s.toxicRemoved && itemId === 'shovel') slot.classList.add('slot-glowing');
      else if (s.toxicRemoved && !s.tomatoFruited && (itemId === 'seed_tomato' || itemId === 'seed_basil' || itemId === 'watering_can')) slot.classList.add('slot-glowing');
      else if (s.tomatoFruited && !s.wormDone && itemId === 'fallen_leaf') slot.classList.add('slot-glowing');
    }
  } else {
    const ic = document.createElement('div'); ic.className = 'slot-icon'; ic.textContent = '🖐️'; slot.appendChild(ic);
    const ph = QuestManager.getCurrentPhase();
    if (ph === 2 || ph === 3) { ic.style.opacity = '1'; slot.classList.add('slot-glowing'); slot.title = '맨손으로 클릭하세요!'; }
    else { ic.style.opacity = '0.4'; slot.title = '맨손 (관찰/이동)'; }
  }
  return slot;
}

function initInventoryUI() {
  const hotbarEl = document.getElementById('hotbar-container');
  hotbarEl.innerHTML = '';
  for (let i = 0; i < 9; i++) hotbarEl.appendChild(_buildHotbarSlot(i));
  if (isInventoryOpen) {
    const previewEl = document.getElementById('inv-hotbar-grid');
    previewEl.innerHTML = '';
    for (let i = 0; i < 9; i++) previewEl.appendChild(_buildHotbarSlot(i));
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
    v:14, chunks:activeList, grid:userGrid, deleted:Array.from(deletedBlocks),
    animals:animalData.map(({type,x,y,z,isInjured,angle})=>({type,x,y,z,isInjured,angle})),
    currentLevel: currentLevel,
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
    guardianState: guardianState,
    level2State: {
      level2_phase:      level2_phase,
      level2_conditions: { ...level2_conditions },
      level2Manager: typeof Level2Manager !== 'undefined' ? {
        currentPhase:  Level2Manager.currentPhase,
        phaseComplete: { ...Level2Manager.phaseComplete }
      } : null
    },
    level1State: {
      level_phase:             Level1Manager.currentPhase,
      yellow_orbs_collected:   ClueSystem.foundCount,
      toxic_plants_removed:    Level1Manager.phase1State.toxicRemoved,
      tomatoFruited:           Level1Manager.phase1State.tomatoFruited,
      leaves_collected:        LeafSystem.collected,
      tree_state:              OldTree.state,
      phase2_conditions:       { ...Phase2System.conditions },
      environment_flags:       { ...Phase2System.envFlags },
      phase3_conditions:       { ...Phase3System.conditions },
      global_protectors:       { ...global_protectors }
    }
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

      if (data.level1State) {
        const s = data.level1State;
        Level1Manager.currentPhase                    = s.level_phase             ?? Level1Manager.currentPhase;
        ClueSystem.foundCount                         = s.yellow_orbs_collected   ?? 0;
        Level1Manager.phase1State.toxicRemoved        = s.toxic_plants_removed    ?? false;
        Level1Manager.phase1State.tomatoFruited       = s.tomatoFruited           ?? false;
        LeafSystem.collected                          = s.leaves_collected        ?? 0;
        OldTree.state                                 = s.tree_state              ?? 'withered';
        if (s.phase2_conditions) Object.assign(Phase2System.conditions, s.phase2_conditions);
        if (s.environment_flags) Object.assign(Phase2System.envFlags,   s.environment_flags);
        if (s.phase3_conditions) Object.assign(Phase3System.conditions, s.phase3_conditions);
        Object.assign(global_protectors, s.global_protectors ?? {});
      }
      if (data.level2State) {
        const l2 = data.level2State;
        level2_phase = l2.level2_phase ?? 0;
        if (l2.level2_conditions) Object.assign(level2_conditions, l2.level2_conditions);
        if (l2.level2Manager && typeof Level2Manager !== 'undefined') {
          Level2Manager.currentPhase  = l2.level2Manager.currentPhase  ?? 0;
          Level2Manager.phaseComplete = l2.level2Manager.phaseComplete ?? {};
        }
      }
      updateProtectorSlots();

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
  Level1Manager.currentPhase=0;
  Level1Manager.phaseComplete={};
  Level1Manager.injuredHealedCount=0;
  Level1Manager.phase1State={ toxicRemoved:false, tomatoFruited:false, wormDone:false, treeGrowing:false };
  OldTree.chopCount=0; OldTree.state='withered';

  Object.keys(guardianState).forEach(k => guardianState[k] = 0);
  ClueSystem.clues.forEach(c=>c.found=false);
  LeafSystem.meshes.forEach(m=>scene.remove(m));
  LeafSystem.meshes=[]; LeafSystem.collected=0;

  ClueSystem.foundCount = 0;
  Object.assign(global_protectors, { bee: false, swallow: false, sheep: false, otter: false, bat: false });
  // 레벨 2 상태 초기화
  level2_phase = 0;
  if (typeof level2_conditions !== 'undefined') {
    level2_conditions.bullfrogIsolated = false;
    level2_conditions.toadRescued = false;
  }
  if (typeof Level2Manager !== 'undefined') {
    Level2Manager.currentPhase = 0;
    Level2Manager.phaseComplete = {};
    Level2Manager.missionGuided = false;
  }
  updateProtectorSlots();
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
  if (n >= 1) { Level1Manager.phase1State.toxicRemoved = true; ClueSystem.foundCount = 4; }
  if (n >= 2) { Level1Manager.phase1State.tomatoFruited = true; }
  if (n >= 3) { LeafSystem.collected = 5; OldTree.state = 'withered'; }
  if (n >= 4) { OldTree.state = 'bloomed'; Phase2System.conditions.treeBlooming = true; }
  if(n === 2) Phase2System.init();
  else if(n >= 3) { Phase2System._clearAll(); Phase3System.init(); }
  QuestManager.updateUI();
  updateProtectorSlots();
  toast(`🔧 페이즈 ${n}로 이동했어요 (개발자 모드)`);
};

// 개발 테스트용 — 브라우저 콘솔에서 goLevel2() 로 레벨 2를 즉시 시작
window.goLevel2 = function () {
  isOpeningActive = false;
  document.getElementById('opening-overlay').style.display = 'none';

  // 레벨 1 클리어 상태 강제 설정
  global_protectors.bee = true;
  global_protectors.swallow = true;
  global_protectors.sheep = true;
  Level1Manager.phaseComplete = { 1: true, 2: true, 3: true };
  Level1Manager.phase1State = { toxicRemoved: true, tomatoFruited: true, wormDone: true, treeGrowing: true };
  Level1Manager.currentPhase = 3;
  Level1Manager.phase1State = { toxicRemoved: true, tomatoFruited: true, wormDone: true, treeGrowing: true };
  ClueSystem.foundCount = 4; LeafSystem.collected = 5;
  OldTree.state = 'bloomed'; Phase2System.conditions.treeBlooming = true;

  // 중복 스폰 방지: 기존 Level2 동물 제거
  for (let i = animalData.length - 1; i >= 0; i--) {
    if (LEVEL2_ANIMAL_TYPES.includes(animalData[i].type)) {
      if (animalData[i].group) scene.remove(animalData[i].group);
      animalData.splice(i, 1);
    }
  }

  currentLevel = 2;
  spawnLevel2WhiteBoxElements();

  if (typeof Level2Manager !== 'undefined') {
    Level2Manager.init();
    QuestManager.updateUI();
  }
  if (typeof updateProtectorSlots === 'function') updateProtectorSlots();

  // 두꾸 위치로 카메라 자동 이동
  const td = animalData.find(a => a.type === 'toad');
  if (td && typeof orbitTarget !== 'undefined' && typeof syncCam === 'function') {
    orbitTarget.set(td.x, td.y + 5, td.z);
    syncCam();
  }

  toast('🔧 레벨 2 [다양성의 숲]로 이동했어요 (개발자 모드)');
};

// 레벨 3 진입 — Level3Logic.js 로드 후 실제 구현으로 교체 예정
window.startLevel3 = function () {
  document.getElementById('level2-clear').style.display = 'none';
  if (typeof Level3Manager !== 'undefined') {
    Level3Manager.init();
  } else {
    toast('🚧 레벨 3: 연결의 평원 — 준비 중입니다!');
  }
};

// 개발 테스트용 — 브라우저 콘솔에서 goLevel3() 로 레벨 3를 즉시 시작
window.goLevel3 = function () {
  isOpeningActive = false;
  const overlay = document.getElementById('opening-overlay');
  if (overlay) overlay.style.display = 'none';
  const l2Clear = document.getElementById('level2-clear');
  if (l2Clear) l2Clear.style.display = 'none';

  global_protectors.bee = true;
  global_protectors.swallow = true;
  global_protectors.sheep = true;
  global_protectors.otter = true;
  global_protectors.bat = true;

  currentLevel = 3;
  if (typeof Level3Manager !== 'undefined') {
    Level3Manager.init();
  }
  if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
  toast('🔧 레벨 3 [연결의 평원]으로 이동했어요 (개발자 모드)');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1 UI 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * data.js의 encyclopediaCards에서 카드를 불러와 화면 중앙에 팝업한다.
 * 블록 또는 생물 클릭 시 트리거된다.
 *
 * @param {string} cardId - encyclopediaCards의 키 (예: 'honeybee', 'ancient_tree')
 */
function showEncyclopediaCard(cardId) {
  const card = encyclopediaCards[cardId];
  if (!card) {
    console.warn(`[UI] showEncyclopediaCard: cardId '${cardId}' 없음`);
    return;
  }

  // 기존 팝업이 있으면 제거
  const existing = document.getElementById('encyclopedia-popup');
  if (existing) document.body.removeChild(existing);

  const ov = document.createElement('div');
  ov.id = 'encyclopedia-popup';
  ov.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
    'background:rgba(0,0,0,0.70)', 'z-index:95',
    'display:flex', 'align-items:center', 'justify-content:center'
  ].join(';');

  ov.innerHTML = `
    <div style="
      background:linear-gradient(160deg,#1a2a1a,#0d1a0d);
      border:2px solid #4caf50; border-radius:20px;
      padding:28px 32px; max-width:360px; width:90%;
      box-shadow:0 8px 40px rgba(0,0,0,0.7);
      font-family:sans-serif; color:#fff; text-align:center;
    ">
      <div style="font-size:52px; margin-bottom:10px;">${card.icon}</div>
      <div style="font-size:20px; font-weight:900; color:#a5d6a7; margin-bottom:12px;">${card.title}</div>
      <div style="font-size:14px; line-height:1.7; color:rgba(255,255,255,0.85); margin-bottom:16px;">${card.body}</div>
      <div style="
        background:rgba(76,175,80,0.15); border:1px solid rgba(76,175,80,0.4);
        border-radius:10px; padding:10px 14px;
        font-size:13px; color:#c8e6c9; line-height:1.6;
      ">💡 ${card.tip}</div>
      <button id="enc-close" style="
        margin-top:18px; padding:10px 28px;
        background:#4caf50; color:#fff; font-weight:700; font-size:15px;
        border:none; border-radius:10px; cursor:pointer;
      ">닫기</button>
    </div>
  `;

  document.body.appendChild(ov);
  document.getElementById('enc-close').addEventListener('click', () => {
    document.body.removeChild(ov);
  });
  // 배경 클릭으로도 닫기
  ov.addEventListener('click', (e) => {
    if (e.target === ov) document.body.removeChild(ov);
  });

  DBG(`[UI] showEncyclopediaCard('${cardId}') 표시`);
}

/**
 * 지렁이 부활 HTML 미니게임 오버레이를 표시한다.
 * systems.js의 WormMinigame.start()를 호출하는 래퍼 함수.
 * ui.js에서 LeafSystem.placeOnSoil() → WormMinigame 순서를 대체할 수도 있다.
 *
 * @param {number} centerX - 고목나무 밑동 X 좌표
 * @param {number} centerZ - 고목나무 밑동 Z 좌표
 * @returns {Promise<boolean>} 미니게임 클리어 여부
 */
function startWormMinigame(centerX = 8, centerZ = 8) {
  return new Promise((resolve) => {
    // systems.js의 WormMinigame이 이미 오버레이를 관리함
    if (typeof WormMinigame !== 'undefined') {
      WormMinigame.start(centerX, centerZ);
      // WormMinigame.complete() 이후 'wormComplete' 커스텀 이벤트로 결과를 수신
      const handler = () => {
        document.removeEventListener('wormComplete', handler);
        resolve(true);
      };
      document.addEventListener('wormComplete', handler, { once: true });
    } else {
      console.warn('[UI] startWormMinigame: WormMinigame 없음 — 폴백 사용');
      resolve(false);
    }
  });
}

/**
 * 수호대가 영입될 때마다 화면 하단의 슬롯 아이콘을 활성화 상태로 변경한다.
 * systems.js의 global_protectors 변경 후 호출한다.
 * HTML에 id="protector-slot-bee", "protector-slot-swallow", "protector-slot-sheep" 요소가 있어야 한다.
 */
function updateProtectorSlots() {
  const slotMap = {
    bee:     { id: 'protector-slot-bee',     emoji: '🐝', label: '꿀벌' },
    swallow: { id: 'protector-slot-swallow', emoji: '🐦', label: '제비' },
    sheep:   { id: 'protector-slot-sheep',   emoji: '🐑', label: '양'   },
    otter:   { id: 'protector-slot-otter',   emoji: '🦦', label: '수달' },
    bat:     { id: 'protector-slot-bat',     emoji: '🦇', label: '금비' },
    fox:     { id: 'protector-slot-fox',     emoji: '🦊', label: '여우' },
    eagle:   { id: 'protector-slot-eagle',   emoji: '🦅', label: '독수리' }
  };

  for (const [key, cfg] of Object.entries(slotMap)) {
    const el = document.getElementById(cfg.id);
    if (!el) continue;

    const joined = global_protectors[key] === true;
    el.classList.toggle('slot-active', joined);
    el.classList.toggle('slot-inactive', !joined);
    el.title = joined ? `${cfg.emoji} ${cfg.label} 합류 완료!` : `${cfg.emoji} ${cfg.label} (미합류)`;

    if (joined) {
      el.style.animation = 'none';
      requestAnimationFrame(() => {
        el.style.animation = 'protector-join-pulse 0.6s ease-out 2';
      });
    }
  }

  // 레벨 1 클리어 배너: 꿀벌+제비+양 모두 합류 시
  const lv1Joined = global_protectors.bee && global_protectors.swallow && global_protectors.sheep;
  const clearBanner = document.getElementById('protector-clear-banner');
  if (clearBanner) clearBanner.style.display = lv1Joined ? 'flex' : 'none';

  DBG('[UI] updateProtectorSlots() — bee:', global_protectors.bee,
    '| swallow:', global_protectors.swallow, '| sheep:', global_protectors.sheep,
    '| otter:', global_protectors.otter, '| bat:', global_protectors.bat);
}

// level1Cleared 이벤트 수신 → UI 슬롯 갱신
document.addEventListener('level1Cleared', () => {
  updateProtectorSlots();
  toast('🎉 초록 마을의 수호대가 모두 모였어요!');
});

// global_protectors 변경을 감지하기 위한 Proxy 래퍼 설정
// (state.js 로드 후 실행되므로 DOMContentLoaded 시점에 등록)
document.addEventListener('DOMContentLoaded', () => {
  // phaseAdvanced 이벤트 수신 → 수호대 슬롯 UI 갱신
  document.addEventListener('phaseAdvanced', () => updateProtectorSlots());
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NPC 대사 팝업
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * data.js의 npcDialogues에서 대사를 불러와 화면에 단계적으로 표시한다.
 * 기존 grandma-popup 요소를 재활용하거나, 독립 오버레이를 생성한다.
 *
 * @param {string} phaseKey - npcDialogues의 키 (예: 'phase0_intro', 'phase1_complete')
 * @param {Object} [opts]
 * @param {number}  [opts.autoClose=5000]  - ms 후 자동 닫힘 (0이면 수동)
 * @param {boolean} [opts.useExisting=true] - grandma-popup 재활용 여부
 */
function showNpcDialogue(phaseKey, opts = {}) {
  const dialogue = npcDialogues[phaseKey];
  if (!dialogue) {
    console.warn(`[UI] showNpcDialogue: phaseKey '${phaseKey}' 없음`);
    return;
  }

  const { autoClose = 5000, useExisting = true } = opts;

  // grandma-popup 재활용 시도
  if (useExisting) {
    const gpop = document.getElementById('grandma-popup');
    const gtxt = document.getElementById('grandma-text');
    if (gpop && gtxt) {
      gtxt.innerHTML = dialogue.lines.join('<br>');
      gpop.style.display = 'block';
      if (autoClose > 0) {
        clearTimeout(gpop._npcTimer);
        gpop._npcTimer = setTimeout(() => { gpop.style.display = 'none'; }, autoClose);
      }
      DBG(`[UI] showNpcDialogue('${phaseKey}') — grandma-popup 사용`);
      return;
    }
  }

  // grandma-popup 없으면 독립 오버레이 생성
  const existing = document.getElementById('npc-dialogue-popup');
  if (existing) document.body.removeChild(existing);

  const ov = document.createElement('div');
  ov.id = 'npc-dialogue-popup';
  ov.style.cssText = [
    'position:fixed', 'bottom:160px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:60', 'max-width:380px', 'width:90%',
    'background:linear-gradient(160deg,rgba(20,40,20,0.97),rgba(10,25,10,0.97))',
    'border:2px solid rgba(76,175,80,0.6)', 'border-radius:18px',
    'padding:18px 22px', 'font-family:sans-serif', 'color:#fff',
    'box-shadow:0 6px 30px rgba(0,0,0,0.6)',
    'animation:fadeInUp 0.35s ease-out'
  ].join(';');

  // 대사를 한 줄씩 순차 표시하는 타이핑 효과
  let lineIdx = 0;
  const renderLine = () => {
    const line = dialogue.lines[lineIdx] || '';
    ov.innerHTML = `
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="font-size:28px;flex-shrink:0;">👵</div>
        <div>
          <div style="font-size:11px;color:#a5d6a7;font-weight:700;margin-bottom:4px;">${dialogue.speaker}</div>
          <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.92);">${line}</div>
          ${lineIdx < dialogue.lines.length - 1
            ? `<div style="text-align:right;margin-top:8px;">
                <button id="npc-next-btn" style="
                  padding:5px 14px;background:rgba(76,175,80,0.25);
                  border:1px solid #4caf50;border-radius:8px;
                  color:#a5d6a7;font-size:12px;cursor:pointer;">다음 ▶</button>
               </div>`
            : `<div style="text-align:right;margin-top:8px;font-size:10px;color:rgba(255,255,255,0.4);">클릭하면 닫힙니다</div>`
          }
        </div>
      </div>
    `;
    const nextBtn = document.getElementById('npc-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { lineIdx++; renderLine(); });
    }
  };
  renderLine();

  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => {
    if (e.target === ov || lineIdx >= dialogue.lines.length - 1) {
      if (ov.parentNode) document.body.removeChild(ov);
    }
  });

  if (autoClose > 0) {
    setTimeout(() => { if (ov.parentNode) document.body.removeChild(ov); }, autoClose + dialogue.lines.length * 3000);
  }

  DBG(`[UI] showNpcDialogue('${phaseKey}') — 독립 팝업 생성`);
}

// phaseAdvanced 이벤트 수신 → 페이즈별 할머니 대사 자동 표시
document.addEventListener('phaseAdvanced', (e) => {
  const phaseDialogueMap = {
    1: 'phase1_start',
    2: 'phase2_start',
    3: 'phase3_start',
    4: 'phase4_bloom'
  };
  const key = phaseDialogueMap[e.detail?.next];
  if (key) {
    setTimeout(() => showNpcDialogue(key, { autoClose: 6000 }), 800);
  }
});
