// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  단서 시스템 (Phase 0)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ClueSystem = {
  clues: [
    { id:'tree',  pos:{x:8, z:8},   found:false, emoji:'🌳', msg:'뿌리가 말라있어요. 흙이 딱딱해서 물을 흡수하지 못해요.' },
    { id:'farm',  pos:{x:4, z:4},   found:false, emoji:'🌱', msg:'흙이 콘크리트처럼 굳어있어요. 씨앗을 심어도 싹이 안 트네요.' },
    { id:'hive',  pos:{x:12, z:4},  found:false, emoji:'🐝', msg:'벌집이 텅 비어있어요. 꿀벌들이 어디로 갔을까요?' },
    { id:'river', pos:{x:4, z:12},  found:false, emoji:'🦆', msg:'쓰레기가 쌓여 수위가 낮아졌어요. 오리들이 뭍으로 올라와 있어요.' }
  ],
  foundCount: 0,
  meshes: [],

  init() {
    this.meshes.forEach(m => scene.remove(m));
    this.meshes = [];
    this.foundCount = this.clues.filter(c => c.found).length;
    const clueMat = new THREE.MeshBasicMaterial({color: 0xffe600, transparent:true, opacity:0.8});
    const clueGeo = new THREE.SphereGeometry(0.4, 16, 16);
    this.clues.forEach(clue => {
      if(!clue.found) {
        const mesh = new THREE.Mesh(clueGeo, clueMat);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshBasicMaterial({color: 0xffffff, transparent:true, opacity:0.3}));
        mesh.add(halo);
        const ty = getTopY(clue.pos.x, clue.pos.z);
        mesh.position.set(clue.pos.x, ty + 1, clue.pos.z);
        mesh.userData = { isClue: true, clueId: clue.id, baseTopY: ty };
        scene.add(mesh);
        this.meshes.push(mesh);
        clue.mesh = mesh;
      }
    });
  },

  checkClick(clueId) {
    const clue = this.clues.find(c => c.id === clueId);
    if(clue && !clue.found) {
      clue.found = true;
      this.foundCount++;
      if(clue.mesh) { scene.remove(clue.mesh); clue.mesh = null; }
      CreatureReport.show(clue.id);
      toast(`🔍 ${clue.emoji} 단서를 찾았어요! (${this.foundCount}/4)`);
      if(this.foundCount >= 4) { setTimeout(() => this.allFound(), 1500); }
    }
  },

  allFound() {
    const gp = document.getElementById('grandma-popup');
    gp.style.display = 'block';
    setTimeout(() => {
      gp.style.display = 'none';
      QuestManager.advance();
    }, 4500);
  },

  updateAnims(t) {
    this.clues.forEach(clue => {
      if(!clue.found && clue.mesh) {
        clue.mesh.position.y = clue.mesh.userData.baseTopY + 1.2 + Math.sin(t * 3 + clue.pos.x) * 0.3;
      }
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  독성식물, 진딧물, 무당벌레, 동반식물 (Phase 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ToxicPlantSystem = {
  locations: [ {x:5, z:3}, {x:7, z:5}, {x:13, z:6} ],
  removed: 0,
  init() {
    this.removed = 0;
    this.locations.forEach(({x, z}) => {
      const y = getTopY(x, z);
      _place(x, y, z, 'toxic_plant');
    });
  },
  remove(x, y, z) {
    const k = bk(x, y, z);
    if(gridData[k] !== 'toxic_plant') return;
    removeBlock(x, y, z);
    this.removed++;
    toast(`🗑️ 독성 식물 제거 (${this.removed}/${this.locations.length})`);
    if(this.removed >= this.locations.length) {
      toast('✅ 독성 식물을 모두 제거했어요! 말 목초지가 안전해졌어요!');
      QuestManager.phase1State.toxicRemoved = true;
      if(typeof showEcoPopup === 'function') showEcoPopup('🌼❌', '나쁜 노란 꽃을 뽑아<br>동물 친구들이 안전해졌어요!');
      QuestManager.check();
    }
  }
};

const LeafSystem = {
  locations: [ {x:6,z:7},{x:9,z:5},{x:7,z:10},{x:11,z:8},{x:5,z:9} ],
  meshes: [],
  collected: 0,
  needed: 5,

  init() {
    this.meshes.forEach(m => scene.remove(m));
    this.meshes = [];
    this.collected = 0;
    this.locations.forEach(({x, z}) => {
      const y = getTopY(x, z) + 0.2;
      const geo = new THREE.BoxGeometry(0.5, 0.08, 0.5);
      const mat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0xD2691E : 0xFF8C00 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.userData = { isLeaf: true, lx: x, lz: z };
      scene.add(mesh);
      this.meshes.push(mesh);
    });
  },

  collect(mesh) {
    scene.remove(mesh);
    this.meshes = this.meshes.filter(m => m !== mesh);
    this.collected++;
    toast(`🍂 낙엽 수집 (${this.collected}/${this.needed})`);
    if(this.collected >= this.needed) {
      toast('🍂 낙엽을 충분히 모았어요! 고목나무 주변 흙에 덮어주세요!');
    }
  },

  placeOnSoil(x, y, z) {
    if(this.collected < this.needed) {
      toast(`⚠️ 낙엽이 부족해요! (${this.collected}/${this.needed})`);
      return false;
    }
    WormMinigame.start(x, z);
    return true;
  }
};

const WormMinigame = {
  active: false,
  overlay: null,
  progress: 0,
  totalCells: 16,

  start(centerX, centerZ) {
    if(this.active) return;
    this.active = true;
    this.progress = 0;

    this.overlay = document.createElement('div');
    this.overlay.id = 'worm-minigame';
    this.overlay.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#3B2510,#1a0d00);z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;">
        <div style="color:#FFD700;font-size:22px;font-weight:900;">🐛 땅속 세계</div>
        <div style="color:rgba(255,255,255,0.85);font-size:14px;text-align:center;line-height:1.6;">지렁이들이 낙엽을 먹으며 흙을 살려요!<br>각 칸을 클릭해서 지렁이를 안내하세요!</div>
        <div id="worm-grid" style="display:grid;grid-template-columns:repeat(4,64px);gap:6px;margin:10px 0;"></div>
        <div style="color:rgba(255,255,255,0.6);font-size:13px;">진행: <span id="worm-progress">0</span>/16 칸 완료</div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    const grid = document.getElementById('worm-grid');
    for(let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'width:64px;height:64px;background:#3B2510;border:2px solid #5C3D1A;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;transition:background 0.3s;user-select:none;';
      cell.textContent = '🪱';
      cell.dataset.index = i;
      cell.dataset.done = 'false';
      cell.addEventListener('click', () => this.activateCell(cell));
      grid.appendChild(cell);
    }
  },

  activateCell(cell) {
    if(cell.dataset.done === 'true') return;
    cell.dataset.done = 'true';
    cell.style.background = '#2C1810';
    cell.style.borderColor = '#4caf50';
    cell.textContent = '✨';
    this.progress++;
    const progEl = document.getElementById('worm-progress');
    if(progEl) progEl.textContent = this.progress;

    const idx = parseInt(cell.dataset.index);
    const col = idx % 4;
    const neighbors = [];
    if(col > 0) neighbors.push(idx - 1);
    if(col < 3) neighbors.push(idx + 1);
    if(idx >= 4) neighbors.push(idx - 4);
    if(idx < 12) neighbors.push(idx + 4);

    neighbors.forEach(n => {
      const nb = document.querySelector(`#worm-minigame [data-index="${n}"]`);
      if(nb && nb.dataset.done !== 'true') {
        setTimeout(() => { if(nb.dataset.done !== 'true') nb.style.borderColor = '#FFD700'; }, 300);
      }
    });

    if(this.progress >= this.totalCells) {
      setTimeout(() => this.complete(), 600);
    }
  },

  complete() {
    if(this.overlay && this.overlay.parentNode) {
      document.body.removeChild(this.overlay);
    }
    this.overlay = null;
    this.active = false;

    const tx = Math.round(OldTree.group ? OldTree.group.position.x : 8);
    const tz = Math.round(OldTree.group ? OldTree.group.position.z : 8);
    for(let dx = -3; dx <= 3; dx++) for(let dz = -3; dz <= 3; dz++) {
      const wx = tx + dx, wz = tz + dz;
      const wy = getTopY(wx, wz) - 1;
      const k = bk(wx, wy, wz);
      if(gridData[k]) {
        const bt = gridData[k];
        if(bt === 'dirt' || bt === 't_dirt' || bt === 'dirt_dry' || bt === 'dirt_moist') {
          _place(wx, wy, wz, 'dirt_rich');
        }
      }
    }

    toast('🌱 지렁이가 흙을 살려냈어요! 영양토가 생겼어요!');
    QuestManager.phase1State.wormDone = true;
    if(typeof showEcoPopup === 'function') showEcoPopup('🍂🪱', '지렁이가 낙엽을 먹고<br>딱딱한 흙을 숨 쉬게 만들었어요!');
    OldTree.showNutrientFlow();
    QuestManager.check();
  }
};

const AphidSystem = {
  active: false,
  meshes: [],
  targetPlant: null,
  attack(x, z) {
    if(this.active) return;
    this.active = true;
    this.targetPlant = {x, z};
    for(let i=0; i<5; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshLambertMaterial({color:0x90EE90});
      const mesh = new THREE.Mesh(geo, mat);
      const y = getTopY(x, z) + 1;
      mesh.position.set(x + (Math.random()-0.5)*0.8, y + Math.random()*0.3, z + (Math.random()-0.5)*0.8);
      scene.add(mesh);
      this.meshes.push(mesh);
    }
    toast('🐛 진딧물이 나타났어요! 바질을 옆에 심어주세요!');
  },
  clear(x, z) {
    this.meshes.forEach(m => scene.remove(m));
    this.meshes = [];
    this.active = false;
    toast('✨ 무당벌레가 진딧물을 모두 쫓아냈어요!');
  }
};

const LadybugSystem = {
  active: false,
  mesh: null,
  summon(targetX, targetZ) {
    if(this.active) return;
    this.active = true;
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    const mat = new THREE.MeshLambertMaterial({color:0xFF0000});
    this.mesh = new THREE.Mesh(geo, mat);
    const dotGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const dotMat = new THREE.MeshLambertMaterial({color:0x111111});
    [-0.06, 0.06].forEach(dx => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(dx, 0.05, 0.1);
      this.mesh.add(dot);
    });
    this.mesh.position.set(targetX - 10, getTopY(targetX, targetZ) + 3, targetZ);
    scene.add(this.mesh);
    this.target = { x: targetX, z: targetZ };
    this.arrived = false;
    toast('🐞 무당벌레가 날아왔어요! 진딧물을 물리칩니다!');
  },
  update(t) {
    if(!this.active || !this.mesh) return;
    if(this.arrived) {
      this.mesh.position.x = this.target.x + Math.cos(t*2)*0.5;
      this.mesh.position.z = this.target.z + Math.sin(t*2)*0.5;
      return;
    }
    const dx = this.target.x - this.mesh.position.x;
    const dz = this.target.z - this.mesh.position.z;
    const dist = Math.sqrt(dx*dx + dz*dz);
    if(dist < 0.5) {
      this.arrived = true;
      AphidSystem.clear(this.target.x, this.target.z);
    } else {
      this.mesh.position.x += (dx/dist) * 0.08;
      this.mesh.position.z += (dz/dist) * 0.08;
      this.mesh.position.y = getTopY(this.target.x, this.target.z) + 2 + Math.sin(t*8) * 0.2;
    }
  }
};

function showAromaEffect(x, y, z) {
  const geo = new THREE.SphereGeometry(0.6, 16, 16);
  const mat = new THREE.MeshBasicMaterial({color: 0xffaaaa, transparent: true, opacity: 0.6});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, getTopY(Math.round(x), Math.round(z)), z);
  scene.add(mesh);
  let scale = 1;
  const anim = setInterval(() => {
    scale += 0.05;
    mesh.scale.set(scale, scale, scale);
    mesh.material.opacity -= 0.05;
    if(mesh.material.opacity <= 0) { clearInterval(anim); scene.remove(mesh); }
  }, 50);
}

const CompanionPlant = {
  pairs: {
    'tomato': { partner:'basil', bonus:'🍅 토마토에 열매가 맺혔어요!' },
    'basil':  { partner:'tomato', bonus:'🌿 바질이 토마토를 지켜줘요!' }
  },
  check(x, y, z, plantType) {
    const pair = this.pairs[plantType];
    if(!pair) return false;
    const neighbors = [ [x+1,y,z],[x-1,y,z],[x,y,z+1],[x,y,z-1] ];
    for(const [nx,ny,nz] of neighbors) {
      const nb = gridData[bk(nx,ny,nz)];
      if(nb === 'plant_' + pair.partner || nb === 'plant_tomato_fruit') {
        setTimeout(() => {
          if(plantType === 'tomato') {
            _place(x, y, z, 'plant_tomato_fruit');
          } else if(pair.partner === 'tomato') {
            _place(nx, ny, nz, 'plant_tomato_fruit');
          }
          toast(pair.bonus);
          QuestManager.phase1State.tomatoFruited = true;
          if(typeof showEcoPopup === 'function') showEcoPopup('💧🌱', '목마른 씨앗에 물을 주어<br>건강한 토마토가 자랐어요!');
          showAromaEffect(x, y, z);
          LadybugSystem.summon(x, z);
          QuestManager.check();
        }, 3000);
        return true;
      }
    }
    return false;
  }
};

const CreatureReport = {
  data: {
    tree:  { name:'🌳 고목나무', skill:'수백 년을 살며 수십 종의 생명에게 집을 내어줘요', weak:'뿌리가 마르면 주변 생태계 전체가 무너져요', fact:'나무들은 뿌리로 서로 영양분을 나눠요! (숲의 인터넷)', hint:'흙을 먼저 살려야 나무가 회복돼요' },
    farm:  { name:'🌱 지렁이', skill:'매일 자기 몸무게만큼 낙엽을 먹어요', weak:'농약과 건조한 땅에서는 살 수 없어요', fact:'지렁이가 없으면 아무리 씨앗을 심어도 풀이 안 자라요', hint:'낙엽을 모아 흙 위에 덮어주세요!' },
    hive:  { name:'🐝 꿀벌', skill:'하루에 꽃 수백 송이를 돌아다니며 꽃가루를 날라요', weak:'겹꽃(장미 등)에는 꽃가루가 없어서 못 먹어요', fact:'꿀벌이 없으면 과일과 채소의 70%가 열매를 못 맺어요', hint:'클로버·해바라기처럼 꽃가루 있는 꽃을 심어주세요!' },
    river: { name:'🦆 오리', skill:'고개를 물속에 넣어 먹이를 찾아요', weak:'물이 너무 얕으면 먹이를 못 찾아요', fact:'물이 없으면 깃털이 방수력을 잃어 오리가 물에 빠져요!', hint:'강의 쓰레기를 치워 수위를 높여주세요!' }
  },
  timer: null,
  show(id) {
    const d = this.data[id];
    if(!d) return;
    document.getElementById('cr-name').textContent = d.name;
    document.getElementById('cr-skill').textContent = d.skill;
    document.getElementById('cr-weak').textContent = d.weak;
    document.getElementById('cr-fact').textContent = d.fact;
    document.getElementById('cr-hint').textContent = d.hint;
    const el = document.getElementById('creature-report');
    el.style.display = 'flex';
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { el.style.display = 'none'; }, 6000);
  }
};

const QuestManager = {
  currentTheme: 1,
  currentStep: 1,
  themeComplete: {},
  currentPhase: 0,
  phaseComplete: {},
  injuredHealedCount: 0,
  phase1State: {
    toxicRemoved: false,
    tomatoFruited: false,
    wormDone: false,
    treeGrowing: false
  },

  check() {
    if(this.currentPhase === 0) this.checkPhase0();
    else if(this.currentPhase === 1) this.checkPhase1();
    else if(this.currentPhase === 2) this.checkPhase2();
    else if(this.currentPhase === 3) this.checkPhase3();
  },

  checkPhase0() {},

  checkPhase1() {
    if(this.phaseComplete[1]) return;
    const s = this.phase1State;
    const toxicOk  = s.toxicRemoved;
    const tomatoOk = s.tomatoFruited;
    const wormOk   = s.wormDone;
    const treeOk   = s.treeGrowing;

    const statusEl = document.getElementById('mission-status');
    if(statusEl) {
      statusEl.innerHTML = `
        <span class="mc${toxicOk?' done':''}">
          ${toxicOk?'✅':'⬜'} 🌼 나쁜 노란 꽃 뽑기 <small>(동물 보호)</small>
        </span>
        <span class="mc${tomatoOk?' done':''}">
          ${tomatoOk?'✅':'⬜'} 💧 토마토에 물 주기 <small>(싹 틔우기)</small>
        </span>
        <span class="mc${wormOk?' done':''}">
          ${wormOk?'✅':'⬜'} 🍂 지렁이 밥 주기 <small>(건강한 흙)</small>
        </span>
        <span class="mc${treeOk?' done':''}">
          ${treeOk?'✅':'⬜'} 🌳 나무 할아버지 깨우기 <small>(자연 회복)</small>
        </span>
      `;
    }

    if(toxicOk && tomatoOk && wormOk && treeOk) {
      this.phaseComplete[1] = true;
      setTimeout(() => {
        showPhaseTransition(2);
        setTimeout(() => {
          this.currentPhase = 2;
          this.updateUI();
        }, 2500);
      }, 600);
    }
  },

  checkPhase2() {},

  checkPhase3() {
    if(this.phaseComplete[3]) return;
    const sheepList = animalData.filter(a => a.type === 'sheep');
    let enclosedCount = 0, maxGrass = 0;
    for(const s of sheepList){
      const r = analyzeHabitat(Math.round(s.x), Math.round(s.z));
      if(r.enclosed) { enclosedCount++; if(r.grass > maxGrass) maxGrass = r.grass; }
    }
    const fg = Math.min(6, maxGrass);
    this.updateUI(this.injuredHealedCount, enclosedCount, fg);
    if(this.injuredHealedCount >= 1 && enclosedCount >= 3 && fg >= 6) {
      this.phaseComplete[3] = true;
      setTimeout(() => { document.getElementById('mission-clear').style.display='block'; }, 600);
    }
  },

  onTreeChopped() {},

  advance() {
    this.currentPhase++;
    toast(`새로운 퀘스트(페이즈 ${this.currentPhase})가 시작되었습니다!`);
    this.updateUI();
    showPhaseTransition(this.currentPhase);
  },

  updateUI(healed=0, enclosed=0, grass=0) {
    const titleEl  = document.getElementById('mission-title');
    const descEl   = document.getElementById('mission-desc');
    const statusEl = document.getElementById('mission-status');

    if(this.currentPhase === 0) {
      titleEl.textContent = `🔍 단서 탐색`;
      descEl.innerHTML = `마을을 탐험하며 이상한 점을 찾아보세요!`;
      statusEl.innerHTML = '';

    } else if(this.currentPhase === 1) {
      titleEl.textContent = `🌱 페이즈 1: 자연의 첫걸음`;
      descEl.innerHTML = `도구를 사용해서 친구들을 도와주세요! ⬇️ 화살표와 반짝이는 도구를 찾아보세요.`;
      this.checkPhase1();  // 상태바 즉시 갱신

    } else if(this.currentPhase === 2) {
      titleEl.textContent = `🦋 페이즈 2: 곤충과 새가 돌아오고 있어요`;
      descEl.innerHTML = `준비 중인 퀘스트입니다.`;
      statusEl.innerHTML = '';

    } else if(this.currentPhase === 3) {
      titleEl.textContent = `🐑 페이즈 3: 동물들의 보금자리를 완성해요`;
      descEl.innerHTML = `1. 먹이로 유도해서 양들을 볏짚 위로 데려오세요.<br>2. 구급상자로 치료하고, 풀밭 울타리를 만들어주세요!`;
      statusEl.innerHTML = `
        <span class="mc${healed>=1?' done':''}" id="mc-heal">${healed>=1?'✅':'⬜'} 다친 양 치료 ${healed}/1</span>
        <span class="mc${enclosed>=3?' done':''}" id="mc-sheep">${enclosed>=3?'✅':'⬜'} 보호된 양 ${enclosed}/3</span>
        <span class="mc${grass>=6?' done':''}" id="mc-grass">${grass>=6?'✅':'⬜'} 서식지 내 풀밭 ${grass}/6</span>
      `;
    }
  }
};

const OldTree = {
  group: null,
  state: 'withered',
  chopCount: 0,
  regrowthDays: 0,
  branches: [],
  leaves: [],
  fruits: [],
  _particles: [],
  _particleStart: 0,
  setState(newState) {
    this.state = newState;
    this.updateVisual();
  },
  updateVisual() {
    if(!this.group) return;
    if(this.state === 'chopped') { scene.remove(this.group); return; }
    else if(this.group.parent !== scene) { scene.add(this.group); }
    const leafColor = this.state === 'withered' ? 0x888888 : (this.state === 'growing' ? 0x90EE90 : 0x228B22);
    this.leaves.forEach(l => { if(l.material) l.material.color.setHex(leafColor); });
    this.branches.forEach(b => { b.rotation.z = this.state === 'withered' ? -0.4 : 0.2; });
    if(this.state === 'blooming') this.fruits.forEach(f => f.visible = true);
    else this.fruits.forEach(f => f.visible = false);
  },
  showNutrientFlow() {
    if(!this.group) return;
    const basePos = this.group.position;
    this._particles = [];
    this._particleStart = Date.now();
    for(let i = 0; i < 14; i++) {
      const geo = new THREE.SphereGeometry(0.1, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.85 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        basePos.x + (Math.random() - 0.5) * 2.5,
        basePos.y + Math.random() * 0.5,
        basePos.z + (Math.random() - 0.5) * 2.5
      );
      p._speed = 0.03 + Math.random() * 0.025;
      scene.add(p);
      this._particles.push(p);
    }
    toast('🌱 영양분이 뿌리로 흘러들어가고 있어요...');
  },

  updateParticles() {
    if(!this._particles || this._particles.length === 0) return;
    const elapsed = Date.now() - this._particleStart;
    if(elapsed > 2200) {
      this._particles.forEach(p => scene.remove(p));
      this._particles = [];
      this.setState('growing');
      QuestManager.phase1State.treeGrowing = true;
      if(typeof showEcoPopup === 'function') showEcoPopup('🌳✨', '주변 흙이 건강해져서<br>나무 할아버지가 살아났어요!');
      QuestManager.check();
      toast('🌳 고목나무에 잎이 돋아나고 있어요!');
      return;
    }
    this._particles.forEach(p => {
      p.position.y += p._speed;
      p.material.opacity = Math.max(0, p.material.opacity - 0.008);
    });
  },

  chop() {
    const shakeDuration = 500;
    const endTime = Date.now() + shakeDuration;
    const originalY = orbitTarget.y;
    const shakeInterval = setInterval(() => {
      if(Date.now() > endTime) { clearInterval(shakeInterval); orbitTarget.y = originalY; syncCam(); }
      else { orbitTarget.y = originalY + (Math.random()-0.5)*1.5; syncCam(); }
    }, 50);
    scene.remove(this.group);
    this.state = 'chopped';
    const tx = 8, tz = 8;
    for(let x = tx-10; x <= tx+10; x++) {
      for(let z = tz-10; z <= tz+10; z++) {
        if(Math.hypot(x-tx, z-tz) <= 10) {
          for(let y = 0; y <= GH; y++) {
            const k = bk(x,y,z);
            if(gridData[k] && meshByKey[k]) {
              const type = gridData[k].split('_')[0];
              if(['grass','t_low','t_mid','t_high','t_dirt','dirt'].includes(type)) {
                meshByKey[k].material.color.setHex(0x8B7355);
              }
            }
          }
        }
      }
    }
    toast('🪓 고목나무가 쓰러졌어요... 생태계가 무너집니다');
    QuestManager.onTreeChopped();
  }
};

const WateringSystem = {
  moisture: {},
  water(x, y, z) {
    const k = bk(x, y, z);
    const current = this.moisture[k] || 0;
    this.moisture[k] = current + 3;
    if(this.moisture[k] <= 6) {
      if(gridData[k] === 'dirt_dry' || gridData[k] === 'dirt' || gridData[k] === 't_dirt')
        _place(x, y, z, 'dirt_moist');
      showWaterGauge(this.moisture[k]);
      toast('💧 적당히 촉촉해졌어요!');
    } else {
      _place(x, y, z, 'dirt_wet');
      this.killPlantAbove(x, y+1, z);
      showWaterGauge(this.moisture[k], true);
      toast('⚠️ 물을 너무 많이 줬어요! 씨앗이 썩어요!');
    }
    setTimeout(() => { if(this.moisture[k] > 0) this.moisture[k] -= 1; }, 5000);
  },
  killPlantAbove(x, y, z) {
    const k = bk(x, y, z);
    if(gridData[k] && (gridData[k].startsWith('plant_') || gridData[k] === 'sprout')) {
      _place(x, y, z, 'plant_dead');
      toast('💀 식물이 과습으로 죽었어요...');
    }
  }
};

const SeedSystem = {
  planted: {},
  plant(x, y, z, seedType) {
    const floorKey = bk(x, y-1, z);
    const floorBlock = gridData[floorKey];
    if(floorBlock !== 'dirt_moist' && floorBlock !== 'dirt_rich') {
      toast('⚠️ 젖은 흙 위에만 씨앗을 심을 수 있어요!'); return;
    }
    if(gridData[bk(x,y,z)]) { toast('⚠️ 이미 뭔가 심어져 있어요!'); return; }
    this.planted[bk(x,y,z)] = { type: seedType, plantedAt: Date.now(), grown: false };
    _place(x, y, z, 'sprout');
    toast(`🌱 ${ITEM_DB[seedType].label}을 심었어요!`);
    setTimeout(() => this.grow(x, y, z, seedType), 10000);
  },
  grow(x, y, z, seedType) {
    const k = bk(x, y, z);
    const floorBlock = gridData[bk(x, y-1, z)];
    if(floorBlock === 'dirt_wet') {
      _place(x, y, z, 'plant_dead');
      toast('💀 과습으로 식물이 죽었어요...'); return;
    }
    const plantType = 'plant_' + ITEM_DB[seedType].grows;
    _place(x, y, z, plantType);
    if(this.planted[k]) this.planted[k].grown = true;
    toast(`🌿 ${ITEM_DB[seedType].label}가 자랐어요!`);
    const partnerFound = CompanionPlant.check(x, y, z, ITEM_DB[seedType].grows);
    if(ITEM_DB[seedType].grows === 'tomato' && !partnerFound) {
      setTimeout(() => AphidSystem.attack(x, z), 2000);
    }
    QuestManager.check();
  }
};

const ArrowSystem = {
  pool: [],
  activeCount: 0,
  getArrow() {
    if(this.activeCount < this.pool.length) {
      const a = this.pool[this.activeCount++];
      a.visible = true;
      return a;
    }
    const geo = new THREE.ConeGeometry(0.3, 0.6, 4);
    const mat = new THREE.MeshBasicMaterial({color: 0xffff00});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI; // point down
    scene.add(mesh);
    this.pool.push(mesh);
    this.activeCount++;
    return mesh;
  },
  update(t) {
    this.activeCount = 0;
    if(QuestManager.currentPhase === 1) {
      const s = QuestManager.phase1State;
      if(!s.toxicRemoved) {
        for(const [k, type] of Object.entries(gridData)) {
          if(type === 'toxic_plant') {
            const [x,y,z] = k.split(',').map(Number);
            const a = this.getArrow();
            a.position.set(x, y + 1.2 + Math.sin(t*5)*0.15, z);
          }
        }
      } else if (!s.tomatoFruited) {
        for(const [k, type] of Object.entries(gridData)) {
          if(type === 'dirt_rich' || type === 'dirt_moist' || type === 'sprout') {
            const [x,y,z] = k.split(',').map(Number);
            const a = this.getArrow();
            a.position.set(x, y + 1.2 + Math.sin(t*5)*0.15, z);
          }
        }
      } else if (!s.wormDone) {
        for(const [k, type] of Object.entries(gridData)) {
          if(type === 'dirt_dry' || type === 't_dirt') {
            const [x,y,z] = k.split(',').map(Number);
            // Just point to a few random hard dirts to guide them, up to 5 arrows
            if(this.activeCount < 5 && Math.sin(x*z) > 0.8) {
              const a = this.getArrow();
              a.position.set(x, y + 1.2 + Math.sin(t*5)*0.15, z);
            }
          }
        }
      }
    }
    for(let i=this.activeCount; i<this.pool.length; i++) {
      this.pool[i].visible = false;
    }
  }
};
