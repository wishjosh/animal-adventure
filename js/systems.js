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
        const yOffset = clue.id === 'tree' ? 6 : 1;
        mesh.position.set(clue.pos.x, ty + yOffset, clue.pos.z);
        mesh.userData = { isClue: true, clueId: clue.id, baseTopY: ty + yOffset - 1 };
        halo.userData = { isClue: true, clueId: clue.id, baseTopY: ty + yOffset - 1 };
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
    if(QuestManager.phase1State.toxicRemoved) return;
    this.removed = 0;
    this.locations.forEach(({x, z}) => {
      const y = getTopY(x, z);
      if(y < 0) return;
      const k = bk(x, y, z);
      if(!deletedBlocks.has(k)) {
        _place(x, y, z, 'toxic_plant');
      }
    });
  },
  remove(x, y, z) {
    const k = bk(x, y, z);
    if(gridData[k] !== 'toxic_plant') return;
    removeBlock(x, y, z);
    this.removed++;
    toast(`🗑️ 독성 식물 제거 (${this.removed}/${this.locations.length})`);
    if(this.removed >= this.locations.length) {
      QuestManager.phase1State.toxicRemoved = true;
      if(typeof showEcoPopup === 'function') showEcoPopup('🌼❌', '나쁜 노란 꽃을 뽑아<br>동물 친구들이 안전해졌어요!');
      QuestManager.check();
      setTimeout(() => toast('✅ 꽃 뽑기 완료! 다음: 텃밭에 토마토 씨앗을 심고 물을 주세요! 🌱'), 3500);
      setTimeout(() => toast('💡 가방(🎒)에서 토마토 씨앗을 골라 화살표 위치에 심으세요!'), 6500);
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
      const group = new THREE.Group();
      const leafColor = Math.random() > 0.5 ? 0xD2691E : 0xFF8C00;
      const mat = new THREE.MeshLambertMaterial({ color: leafColor });
      const veinMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

      // 잎 몸통 (넓은 중앙부)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.08, 0.55), mat);
      group.add(body);
      // 잎 끝 (뾰족한 부분)
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.20), mat);
      tip.position.z = -0.36;
      group.add(tip);
      // 줄기
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.22), veinMat);
      stem.position.z = 0.38;
      group.add(stem);
      // 잎맥
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.70), veinMat);
      group.add(vein);

      group.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });

      const y = getTopY(x, z) + 0.12;
      group.position.set(x, y, z);
      group.rotation.x = 0.2;
      group.rotation.y = Math.random() * Math.PI;
      group.userData = { isLeaf: true, lx: x, lz: z };
      scene.add(group);
      this.meshes.push(group);
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
    // 나무 회복 안내
    setTimeout(() => toast('✅ 지렁이 완료! 영양분이 나무 뿌리로 흐르고 있어요... 🌳'), 2600);
    setTimeout(() => toast('🌳 나무 할아버지가 스스로 깨어나고 있어요! 잠시만 기다리세요...'), 5000);
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
          const targetX = plantType === 'tomato' ? x : nx;
          const targetZ = plantType === 'tomato' ? z : nz;
          LadybugSystem.summon(targetX, targetZ);
          QuestManager.check();
          // 다음 단계 안내
          setTimeout(() => toast('✅ 토마토 완료! 다음: 낙엽 🍂 5장을 주워서 고목나무 근처 흙에 덮어주세요!'), 3500);
          setTimeout(() => toast('💡 땅에 있는 주황색 낙엽을 맨손(곡괭이 없이)으로 클릭하면 주울 수 있어요!'), 6500);
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
        <div class="mc${toxicOk?' done':''}">\n          ${toxicOk?'✅':'1️⃣'} 🌼 나쁜 노란 꽃 뽑기 <small style="opacity:0.7">→ 말 구출</small>\n        </div>
        <div class="mc${tomatoOk?' done':''}">\n          ${tomatoOk?'✅':'2️⃣'} 💧 토마토 물 주기 <small style="opacity:0.7">→ 싹 틔우기</small>\n        </div>
        <div class="mc${wormOk?' done':''}">\n          ${wormOk?'✅':'3️⃣'} 🍂 지렁이 밥 주기 <small style="opacity:0.7">→ 영양토 만들기</small>\n        </div>
        <div class="mc${treeOk?' done':''}">\n          ${treeOk?'✅':'🌳'} 나무 할아버지 <small style="opacity:0.7">→ 지렁이가 부르면 자동!</small>\n        </div>
      `;
    }

    if(toxicOk && tomatoOk && wormOk && treeOk) {
      this.phaseComplete[1] = true;
      setTimeout(() => {
        showPhaseTransition(2);
        setTimeout(() => {
          this.currentPhase = 2;
          this.updateUI();
          Phase2System.init();
        }, 2500);
      }, 600);
    }
  },

  checkPhase2() { Phase2System.check(); },

  checkPhase3() {
    if(this.phaseComplete[3]) return;
    Phase3System.check();
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
      titleEl.textContent = `🔍 단서 탐색 중... (탭해서 열기)`;
      if(descEl) descEl.innerHTML = `마을 곳곳의 <b style="color:#FFD700">노란색 구슬</b>을 눌러 단서를 수집하세요!`;
      if(statusEl) statusEl.innerHTML = '';

    } else if(this.currentPhase === 1) {
      titleEl.textContent = `🌱 목표: 병든 고목나무 살리기 (탭해서 열기)`;
      if(descEl) descEl.innerHTML = `화살표(⬇️)와 반짝이는 도구를 따라 순서대로 해결하세요!`;
      this.checkPhase1();  // 상태바 즉시 갱신

    } else if(this.currentPhase === 2) {
      titleEl.textContent = `🦋 페이즈 2: 곤충과 새가 돌아오고 있어요`;
      if(descEl) descEl.innerHTML = `표시된 구역을 클릭해서 생태계를 복원하세요!`;
      if(statusEl) {
        const c = phase2_conditions, e = environment_flags;
        statusEl.innerHTML = `
          <div class="mc${c.hiveFull?' done':''}">${c.hiveFull?'✅':'1️⃣'} 🐝 꿀벌 귀환 <small style="opacity:0.7">→ 꽃 심기 + 나뭇가지 제거</small></div>
          <div class="mc${e.riverTrashCount===0?' done':''}">${e.riverTrashCount===0?'✅':'2️⃣'} 🗑️ 강 쓰레기 제거 <small style="opacity:0.7">→ 남은 ${e.riverTrashCount}개</small></div>
          <div class="mc${c.nestBuilt?' done':''}">${c.nestBuilt?'✅':'3️⃣'} 🪺 제비 둥지 완성 <small style="opacity:0.7">→ 강물 먼저 살려야 가능</small></div>
        `;
      }

    } else if(this.currentPhase === 3) {
      titleEl.textContent = `🐑 페이즈 3: 동물들의 보금자리를 완성해요`;
      if(descEl) descEl.innerHTML = `양·말·염소를 돌봐서 생태계를 완성해요!`;
      if(statusEl) {
        const c = phase3_conditions;
        statusEl.innerHTML = `
          <div class="mc${c.sheepHealed?' done':''}">${c.sheepHealed?'✅':'1️⃣'} 🐑 양 치료 <small style="opacity:0.7">→ 그늘→볏짚→치료</small></div>
          <div class="mc${c.horseSpace?' done':''}">${c.horseSpace?'✅':'2️⃣'} 🐴 말 공간 확보 <small style="opacity:0.7">→ 발굽 돌 제거 + 울타리 철거</small></div>
          <div class="mc${c.goatClimbed?' done':''}">${c.goatClimbed?'✅':'3️⃣'} 🐐 염소 등반 <small style="opacity:0.7">→ 탈출 미니게임 → 바위 등반</small></div>
        `;
      }
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
    const bt = gridData[k];
    if(bt !== 'dirt_dry' && bt !== 'dirt' && bt !== 't_dirt') {
      toast('⚠️ 물을 흡수할 수 없는 곳이에요!');
      return;
    }
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
    QuestManager.check();
  },
  update(t) {
    const now = Date.now();
    for(const [k, p] of Object.entries(this.planted)) {
      if(!p.grown && now - p.plantedAt > 10000) {
        const [x, y, z] = k.split(',').map(Number);
        this.grow(x, y, z, p.type);
      }
    }
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  페이즈 2 시스템 — 화이트박스 프로토타입
//  (꿀벌 귀환 / 강 쓰레기 제거 / 나무의 손님들)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Phase2System = {
  _birdHouseDone:  false,
  flowerZoneMeshes: [],
  branchMesh:       null,
  trashMeshes:      [],
  birdHouseMesh:    null,
  nestZoneMesh:     null,

  init() {
    this._clearAll();
    Object.assign(phase2_conditions, { hiveFull:false, nestBuilt:false, treeBlooming:false });
    Object.assign(environment_flags, { riverTrashCount:3, hasMud:false, birdHoleSize:0 });
    this._birdHouseDone = false;
    this._initFlowerZones();
    this._initBranch();
    this._initRiverTrash();
    this._initTreeZones();
    QuestManager.updateUI();
  },

  _clearAll() {
    [...this.flowerZoneMeshes, ...this.trashMeshes,
      this.branchMesh, this.birdHouseMesh, this.nestZoneMesh]
      .filter(Boolean).forEach(m => scene.remove(m));
    this.flowerZoneMeshes = []; this.trashMeshes = [];
    this.branchMesh = null; this.birdHouseMesh = null; this.nestZoneMesh = null;
  },

  _box(w,h,d,hex,x,y,z,ud) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color:hex}));
    m.position.set(x,y,z); m.castShadow = true; Object.assign(m.userData, ud); scene.add(m); return m;
  },

  _initFlowerZones() {
    [{x:2,z:3},{x:6,z:3},{x:2,z:5},{x:6,z:5}].forEach(({x,z}) => {
      this.flowerZoneMeshes.push(
        this._box(0.7,0.4,0.7, 0x9B59B6, x, getTopY(x,z)+0.2, z, {isFlowerZone:true, planted:false})
      );
    });
  },

  _initBranch() {
    const x=8, z=4;
    this.branchMesh = this._box(2.2,0.3,0.5, 0x5C3D1A, x, getTopY(x,z)+0.15, z, {isBranch:true});
  },

  _initRiverTrash() {
    [{x:3,z:11},{x:4,z:13},{x:5,z:12}].forEach(({x,z}) => {
      this.trashMeshes.push(
        this._box(0.5,0.5,0.5, 0xFF3333, x, getTopY(x,z)+0.25, z, {isTrash:true})
      );
    });
  },

  _initTreeZones() {
    if(!OldTree.group) return;
    const tx=8, tz=8, ty=getTopY(tx,tz);
    this.birdHouseMesh = this._box(0.7,0.7,0.7, 0x3498DB, tx+1.5, ty+3.5, tz, {isBirdHouse:true});
    this.nestZoneMesh  = this._box(0.7,0.4,0.7, 0x8B6914, tx-1.5, ty+3.5, tz, {isNestZone:true});
  },

  getAllMeshes() {
    return [...this.flowerZoneMeshes, ...this.trashMeshes,
      this.branchMesh, this.birdHouseMesh, this.nestZoneMesh].filter(Boolean);
  },

  handleClick(obj) {
    if(obj.userData.isFlowerZone) { this._onFlowerZoneClick(obj); return true; }
    if(obj.userData.isBranch)     { this._onBranchClick(obj);     return true; }
    if(obj.userData.isTrash)      { this._onTrashClick(obj);      return true; }
    if(obj.userData.isBirdHouse)  { this._onBirdHouseClick();     return true; }
    if(obj.userData.isNestZone)   { this._onNestZoneClick();      return true; }
    return false;
  },

  _onFlowerZoneClick(mesh) {
    if(mesh.userData.planted) { toast('🌸 이미 꽃이 피어있어요!'); return; }
    this._showFlowerUI(mesh);
  },

  _showFlowerUI(targetMesh) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    ov.innerHTML = `
      <div style="color:#FFD700;font-size:20px;font-weight:900;">🌸 어떤 꽃을 심을까요?</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;text-align:center;">꿀벌이 좋아하는 꽃을 골라주세요!</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        ${[['장미','🌹',false],['국화','🌼',false],['클로버','🍀',true],['해바라기','🌻',true]]
          .map(([n,e,ok])=>`<button data-ok="${ok}" data-name="${n}" style="padding:12px 18px;font-size:18px;border-radius:12px;border:none;cursor:pointer;background:${ok?'#27AE60':'#555'};color:#fff;font-weight:700;">${e} ${n}</button>`).join('')}
      </div>
      <button class="p2c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">취소</button>`;
    document.body.appendChild(ov);
    ov.querySelectorAll('[data-ok]').forEach(btn => btn.addEventListener('click', () => {
      const ok = btn.dataset.ok === 'true';
      document.body.removeChild(ov);
      if(ok) {
        targetMesh.userData.planted = true;
        targetMesh.material.color.setHex(0xF1C40F);
        toast(`🌸 ${btn.dataset.name}을/를 심었어요! 꿀벌이 좋아해요!`);
        console.log('[Phase2] 꽃 심기 성공:', btn.dataset.name);
        this._checkHiveReady();
      } else {
        toast(`⚠️ ${btn.dataset.name}에는 꿀벌이 오지 않아요!`);
        console.log('[Phase2] 부적합 꽃 선택:', btn.dataset.name);
      }
    }));
    ov.querySelector('.p2c').addEventListener('click', () => document.body.removeChild(ov));
  },

  _checkHiveReady() {
    const planted = this.flowerZoneMeshes.filter(m => m.userData.planted).length;
    const total   = this.flowerZoneMeshes.length;
    console.log(`[Phase2] 꽃 진행: ${planted}/${total}, 나뭇가지 남음: ${!!this.branchMesh}`);
    if(planted < total) { toast(`🌸 꽃 심기 (${planted}/${total})`); return; }
    if(this.branchMesh) { toast('🐝 꽃이 모두 피었어요! 벌집 가는 길 나뭇가지를 치워주세요!'); return; }
    this._activateHive();
  },

  _onBranchClick(mesh) {
    scene.remove(mesh); this.branchMesh = null;
    toast('🪵 나뭇가지를 치웠어요!');
    console.log('[Phase2] 장애물 제거 완료');
    if(this.flowerZoneMeshes.every(m => m.userData.planted)) this._activateHive();
    else toast('🐝 꽃을 모두 심으면 벌들이 돌아올 거예요!');
  },

  _activateHive() {
    if(phase2_conditions.hiveFull) return;
    phase2_conditions.hiveFull = true;
    toast('🐝 벌집에 꿀벌이 돌아왔어요!');
    console.log('[Phase2] hiveFull = true');
    if(typeof showEcoPopup === 'function') showEcoPopup('🌸🐝', '꿀벌이 돌아와<br>꽃가루를 날라요!');
    this.check();
  },

  _onTrashClick(mesh) {
    scene.remove(mesh);
    this.trashMeshes = this.trashMeshes.filter(m => m !== mesh);
    environment_flags.riverTrashCount--;
    toast(`🗑️ 쓰레기 제거 (남은: ${environment_flags.riverTrashCount}개)`);
    console.log('[Phase2] 쓰레기 제거, 남은 수:', environment_flags.riverTrashCount);
    if(environment_flags.riverTrashCount <= 0) {
      environment_flags.hasMud = true;
      toast('💧 강물 수위가 올라갔어요! 강가에 진흙이 생겼어요!');
      console.log('[Phase2] hasMud = true — 제비 둥지 열쇠 활성화');
      if(typeof showEcoPopup === 'function') showEcoPopup('🗑️💧', '쓰레기를 치우자<br>강물이 맑아지고 진흙이 생겼어요!');
    }
    QuestManager.updateUI();
  },

  _onBirdHouseClick() {
    if(this._birdHouseDone) { toast('🐦 이미 박새가 입주했어요!'); return; }
    this._showBirdHoleUI();
  },

  _showBirdHoleUI() {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    ov.innerHTML = `
      <div style="color:#FFD700;font-size:20px;font-weight:900;">🐦 박새 새집 만들기</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;text-align:center;">박새가 들어올 수 있는 구멍 크기를 맞춰보세요!<br><span style="color:#aaa;font-size:11px;">(너무 크면 다른 새가 침입해요)</span></div>
      <div style="display:flex;align-items:center;gap:12px;">
        <label style="color:#fff;font-size:15px;">구멍 크기:</label>
        <input id="p2-hole" type="number" min="20" max="40" value="25"
          style="width:72px;padding:8px;font-size:18px;font-weight:700;border-radius:8px;border:none;text-align:center;">
        <span style="color:#fff;font-size:15px;">mm</span>
      </div>
      <div style="display:flex;gap:10px;">
        <button id="p2-hole-ok" style="padding:10px 24px;border-radius:10px;border:none;cursor:pointer;background:#3498DB;color:#fff;font-size:16px;font-weight:700;">완료</button>
        <button class="p2c" style="padding:10px 18px;border-radius:10px;border:none;cursor:pointer;background:#888;color:#fff;">취소</button>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById('p2-hole-ok').addEventListener('click', () => {
      const val = parseInt(document.getElementById('p2-hole').value);
      environment_flags.birdHoleSize = val;
      document.body.removeChild(ov);
      console.log('[Phase2] 입력 구멍 크기:', val, 'mm');
      if(val === 28) {
        this._birdHouseDone = true;
        if(this.birdHouseMesh) this.birdHouseMesh.material.color.setHex(0x27AE60);
        toast('🐦 딱 맞아요! 박새 가족이 입주했어요!');
        console.log('[Phase2] 박새 입주 성공 (28mm)');
        if(typeof showEcoPopup === 'function') showEcoPopup('🐦🏠', '딱 맞는 구멍!<br>박새 가족이 입주했어요!');
      } else {
        toast(val < 28
          ? `⚠️ 구멍이 너무 작아요 (${val}mm). 박새가 들어가지 못해요!`
          : `⚠️ 구멍이 너무 커요 (${val}mm). 다른 새가 침입할 수 있어요!`);
      }
    });
    ov.querySelector('.p2c').addEventListener('click', () => document.body.removeChild(ov));
  },

  _onNestZoneClick() {
    if(phase2_conditions.nestBuilt) { toast('🪺 이미 둥지가 완성됐어요!'); return; }
    if(!environment_flags.hasMud) {
      toast('⚠️ 진흙이 부족합니다. 강가 쓰레기를 먼저 치워 강물을 살려주세요!');
      console.log('[Phase2] 둥지 실패 — hasMud = false');
      return;
    }
    phase2_conditions.nestBuilt = true;
    if(this.nestZoneMesh) this.nestZoneMesh.material.color.setHex(0x27AE60);
    toast('🪺 진흙으로 제비 둥지가 완성됐어요!');
    console.log('[Phase2] nestBuilt = true');
    if(typeof showEcoPopup === 'function') showEcoPopup('💧🪺', '강물이 살아나<br>진흙으로 둥지를 지었어요!');
    this.check();
  },

  check() {
    const { hiveFull, nestBuilt, treeBlooming } = phase2_conditions;
    console.log('[Phase2] 조건 체크 — hiveFull:', hiveFull, '| nestBuilt:', nestBuilt);
    QuestManager.updateUI();
    if(hiveFull && nestBuilt && !treeBlooming) {
      phase2_conditions.treeBlooming = true;
      console.log('🦋 하늘이 활기로 가득해요! 페이즈 3 시작');
      if(typeof showEcoPopup === 'function') showEcoPopup('🌳🦋', '생명이 돌아왔어요!<br>하늘이 활기로 가득해요!');
      setTimeout(() => {
        showPhaseTransition(3);
        setTimeout(() => {
          QuestManager.currentPhase = 3;
          QuestManager.updateUI();
          Phase3System.init();
        }, 2500);
      }, 800);
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  페이즈 3 시스템 — 화이트박스 프로토타입
//  (양 치료 / 말 공간 확보 / 염소 등반)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Phase3System = {
  // 양 (A)
  sheepMesh: null, shadeMesh: null, strawMesh: null,
  _sheepSelected: false, _sheepOnStraw: false,

  // 말 (B)
  horseMesh: null, fenceMeshes: [],

  // 염소 (C)
  goatMesh: null, rockMesh: null,
  escapeSpheres: [], _escapeMiniActive: false,
  _escapeSphereClicked: 0, _escapeTimer: null, _goatSelected: false,

  init() {
    this._clearAll();
    Object.assign(phase3_conditions, { sheepHealed:false, horseSpace:false, goatClimbed:false });
    this._sheepSelected = false; this._sheepOnStraw = false;
    this._escapeMiniActive = false; this._escapeSphereClicked = 0; this._goatSelected = false;
    this._initSheepZone();
    this._initHorseZone();
    this._initGoatZone();
    QuestManager.updateUI();
    toast('🐑 페이즈 3: 동물들의 보금자리를 완성해요!');
  },

  _clearAll() {
    [this.sheepMesh, this.shadeMesh, this.strawMesh,
     this.horseMesh, this.goatMesh, this.rockMesh,
     ...this.fenceMeshes, ...this.escapeSpheres]
      .filter(Boolean).forEach(m => scene.remove(m));
    this.sheepMesh=null; this.shadeMesh=null; this.strawMesh=null;
    this.horseMesh=null; this.goatMesh=null; this.rockMesh=null;
    this.fenceMeshes=[]; this.escapeSpheres=[];
    if(this._escapeTimer){ clearTimeout(this._escapeTimer); this._escapeTimer=null; }
  },

  _box(w,h,d,hex,x,y,z,ud) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshLambertMaterial({color:hex}));
    m.position.set(x,y,z); m.castShadow=true; Object.assign(m.userData,ud); scene.add(m); return m;
  },

  _initSheepZone() {
    const sx=3, sz=3, sy=getTopY(sx,sz);
    this.sheepMesh  = this._box(0.8,0.8,0.8, 0xEEEEEE, sx,      sy+0.4,  sz, {isSheep:true});
    this.shadeMesh  = this._box(1.0,0.1,1.0, 0x888888, sx+1.5,  sy+0.05, sz, {isShadeZone:true});
    this.strawMesh  = this._box(1.0,0.1,1.0, 0xF5C842, sx+3,    sy+0.05, sz, {isStrawZone:true});
  },

  _initHorseZone() {
    const hx=10, hz=3, hy=getTopY(hx,hz);
    this.horseMesh = this._box(0.9,0.9,0.9, 0x8B4513, hx, hy+0.45, hz, {isHorse:true});
    this.fenceMeshes = [
      this._box(0.15,0.8,1.0, 0xFF4444, hx+1.2, hy+0.4, hz, {isFence3:true}),
      this._box(0.15,0.8,1.0, 0xFF4444, hx-1.2, hy+0.4, hz, {isFence3:true})
    ];
  },

  _initGoatZone() {
    const gx=14, gz=7, gy=getTopY(gx,gz);
    this.goatMesh = this._box(0.7,0.7,0.7, 0x888888, gx,   gy+0.35, gz, {isGoat:true});
    this.rockMesh = this._box(0.8,2.0,0.8, 0x777777, gx+2, gy+1.0,  gz, {isRock3:true});
  },

  getAllMeshes() {
    return [this.sheepMesh, this.shadeMesh, this.strawMesh,
            this.horseMesh, this.goatMesh, this.rockMesh,
            ...this.fenceMeshes, ...this.escapeSpheres].filter(Boolean);
  },

  handleClick(obj) {
    if(obj.userData.isSheep)       { this._onSheepClick();        return true; }
    if(obj.userData.isShadeZone)   { this._onShadeZoneClick();    return true; }
    if(obj.userData.isStrawZone)   { this._onStrawZoneClick();    return true; }
    if(obj.userData.isHorse)       { this._onHorseClick();        return true; }
    if(obj.userData.isFence3)      { this._onFenceClick(obj);     return true; }
    if(obj.userData.isGoat)        { this._onGoatClick();         return true; }
    if(obj.userData.isEscapeSphere){ this._onEscapeSphereClick(obj); return true; }
    if(obj.userData.isRock3)       { this._onRockClick();         return true; }
    return false;
  },

  // ── 양 (A) ──
  _onSheepClick() {
    if(phase3_conditions.sheepHealed){ toast('🐑 양이 건강해졌어요!'); return; }
    if(this._sheepOnStraw) { this._showFirstAidPopup(); return; }
    this._sheepSelected = true;
    this.sheepMesh.material.emissive = new THREE.Color(0x664400);
    this.sheepMesh.material.emissiveIntensity = 0.6;
    toast('🐑 양을 선택했어요! 그늘 구역(회색)으로 데려가세요!');
  },

  _onShadeZoneClick() {
    if(!this._sheepSelected || this._sheepOnStraw) return;
    this.sheepMesh.position.set(this.shadeMesh.position.x, this.shadeMesh.position.y+0.45, this.shadeMesh.position.z);
    this.shadeMesh.material.color.setHex(0xBBBBBB);
    this._sheepSelected = false;
    this.sheepMesh.material.emissiveIntensity = 0;
    toast('🐑 그늘로 이동했어요! 양을 다시 클릭해서 볏짚(노란색)으로 데려가세요!');
  },

  _onStrawZoneClick() {
    if(!this._sheepSelected){ toast('⚠️ 먼저 양을 클릭해 선택하세요!'); return; }
    if(phase3_conditions.sheepHealed) return;
    this.sheepMesh.position.set(this.strawMesh.position.x, this.strawMesh.position.y+0.45, this.strawMesh.position.z);
    this.strawMesh.material.color.setHex(0xF5A800);
    this._sheepOnStraw = true;
    this._sheepSelected = false;
    this.sheepMesh.material.emissiveIntensity = 0;
    toast('🐑 볏짚 위로 이동했어요! 양을 다시 클릭해서 치료하세요!');
  },

  _showFirstAidPopup() {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    ov.innerHTML = `
      <div style="font-size:40px;">🏥</div>
      <div style="color:#FFD700;font-size:20px;font-weight:900;">응급 처치</div>
      <div style="color:rgba(255,255,255,0.85);font-size:14px;text-align:center;line-height:1.7;">양이 다리를 다쳤어요.<br>볏짚 위에서 따뜻하게 쉬게 해주면 낫는대요!</div>
      <button id="p3-heal-ok" style="padding:12px 30px;border-radius:12px;border:none;cursor:pointer;background:#E74C3C;color:#fff;font-size:17px;font-weight:700;">💖 치료하기</button>
      <button class="p3c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">취소</button>`;
    document.body.appendChild(ov);
    document.getElementById('p3-heal-ok').addEventListener('click', () => {
      document.body.removeChild(ov);
      phase3_conditions.sheepHealed = true;
      this.sheepMesh.material.color.setHex(0xFFFFFF);
      this.sheepMesh.material.emissiveIntensity = 0;
      toast('💖 양이 치료되었어요! 건강을 되찾았어요!');
      console.log('[Phase3] sheepHealed = true');
      if(typeof showEcoPopup==='function') showEcoPopup('🐑💖','볏짚 위에서 쉬게 해주니<br>양이 건강해졌어요!');
      this.check();
    });
    ov.querySelector('.p3c').addEventListener('click', () => document.body.removeChild(ov));
  },

  // ── 말 (B) ──
  _onHorseClick() { this._showHoofPopup(); },

  _showHoofPopup() {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
    ov.innerHTML = `
      <div style="font-size:40px;">🐴</div>
      <div style="color:#FFD700;font-size:20px;font-weight:900;">발굽 돌 제거</div>
      <div style="color:rgba(255,255,255,0.85);font-size:14px;text-align:center;line-height:1.7;">말의 발굽 사이에 돌이 끼었어요.<br>조심스럽게 제거해 주세요!</div>
      <button id="p3-hoof-ok" style="padding:12px 30px;border-radius:12px;border:none;cursor:pointer;background:#8B4513;color:#fff;font-size:17px;font-weight:700;">🪨 돌 제거하기</button>
      <button class="p3c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">닫기</button>`;
    document.body.appendChild(ov);
    document.getElementById('p3-hoof-ok').addEventListener('click', () => {
      document.body.removeChild(ov);
      toast('🐴 발굽 돌을 제거했어요! 이제 울타리를 치워 공간을 넓혀주세요!');
      console.log('[Phase3] 말 발굽 돌 제거 완료');
      if(typeof showEcoPopup==='function') showEcoPopup('🐴🪨','발굽 돌을 빼주니<br>말이 편안해졌어요!');
    });
    ov.querySelector('.p3c').addEventListener('click', () => document.body.removeChild(ov));
  },

  _onFenceClick(mesh) {
    if(!environment_flags.toxicPlantsRemoved){
      toast('⚠️ 독성 식물을 먼저 제거해야 울타리를 칠 수 있어요!');
      console.log('[Phase3] 울타리 제거 실패 — toxicPlantsRemoved = false');
      return;
    }
    scene.remove(mesh);
    this.fenceMeshes = this.fenceMeshes.filter(m => m !== mesh);
    toast(`🚧 울타리 제거! (남은: ${this.fenceMeshes.length}개)`);
    console.log('[Phase3] 울타리 제거, 남은 수:', this.fenceMeshes.length);
    if(this.fenceMeshes.length === 0){
      phase3_conditions.horseSpace = true;
      toast('🐴 말이 드넓은 공간을 뛸 수 있어요!');
      console.log('[Phase3] horseSpace = true');
      if(typeof showEcoPopup==='function') showEcoPopup('🐴🌿','울타리가 사라지니<br>말이 자유롭게 뛰어요!');
      this.check();
    }
  },

  // ── 염소 (C) ──
  _onGoatClick() {
    if(phase3_conditions.goatClimbed){ toast('🐐 염소가 바위에 올라있어요!'); return; }
    if(this._escapeSphereClicked >= 3 && !this._goatSelected){
      this._goatSelected = true;
      this.goatMesh.material.emissive = new THREE.Color(0x004466);
      this.goatMesh.material.emissiveIntensity = 0.6;
      toast('🐐 염소를 선택했어요! 바위로 데려가세요!');
      return;
    }
    if(!this._escapeMiniActive) this._startEscapeMinigame();
  },

  _startEscapeMinigame() {
    if(this._escapeMiniActive) return;
    this._escapeMiniActive = true;
    this._escapeSphereClicked = 0;
    this.escapeSpheres.forEach(m => scene.remove(m));
    this.escapeSpheres = [];
    const gx = this.goatMesh ? this.goatMesh.position.x : 14;
    const gz = this.goatMesh ? this.goatMesh.position.z : 7;
    const gy = getTopY(Math.round(gx), Math.round(gz));
    [{dx:-2,dz:1},{dx:1,dz:2},{dx:2,dz:-1}].forEach(({dx,dz}) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8), new THREE.MeshLambertMaterial({color:0x00AAFF}));
      m.position.set(gx+dx, gy+0.6, gz+dz);
      m.castShadow = true;
      m.userData = { isEscapeSphere:true };
      scene.add(m);
      this.escapeSpheres.push(m);
    });
    toast('🐐 염소가 도망치려 해요! 파란 구슬을 모두 클릭해서 막아주세요! (10초)');
    console.log('[Phase3] 탈출 미니게임 시작');
    this._escapeTimer = setTimeout(() => { if(this._escapeMiniActive) this._escapeTimerFail(); }, 10000);
  },

  _onEscapeSphereClick(mesh) {
    if(!this._escapeMiniActive) return;
    scene.remove(mesh);
    this.escapeSpheres = this.escapeSpheres.filter(m => m !== mesh);
    this._escapeSphereClicked++;
    toast(`🔵 (${this._escapeSphereClicked}/3) 구슬 잡기 성공!`);
    if(this._escapeSphereClicked >= 3){
      clearTimeout(this._escapeTimer); this._escapeTimer = null;
      this._escapeMiniActive = false;
      toast('🐐 구슬을 모두 막았어요! 염소를 클릭해서 바위로 데려가세요!');
      console.log('[Phase3] 탈출 미니게임 클리어');
    }
  },

  _escapeTimerFail() {
    this._escapeMiniActive = false; this._escapeSphereClicked = 0;
    this.escapeSpheres.forEach(m => scene.remove(m)); this.escapeSpheres = [];
    toast('⚠️ 염소가 도망쳤어요! 다시 클릭해서 잡아주세요!');
    console.log('[Phase3] 탈출 미니게임 실패 — 재시도 가능');
  },

  _onRockClick() {
    if(!this._goatSelected){ toast('⚠️ 먼저 염소를 클릭해서 선택하세요!'); return; }
    if(phase3_conditions.goatClimbed) return;
    phase3_conditions.goatClimbed = true;
    this.goatMesh.position.set(this.rockMesh.position.x, this.rockMesh.position.y+1.1, this.rockMesh.position.z);
    this.goatMesh.material.emissiveIntensity = 0;
    this._goatSelected = false;
    toast('🐐 염소가 바위 위로 올라갔어요!');
    console.log('[Phase3] goatClimbed = true');
    console.log('저기 먹구름이 몰려오고 있어요! 보스전 복선 발견');
    if(typeof showEcoPopup==='function') showEcoPopup('🐐🪨','염소가 바위에 올라<br>멀리 먹구름을 바라봐요!');
    this.check();
  },

  check() {
    const { sheepHealed, horseSpace, goatClimbed } = phase3_conditions;
    console.log('[Phase3] 조건 체크 — sheep:', sheepHealed, '| horse:', horseSpace, '| goat:', goatClimbed);
    QuestManager.updateUI();
    if(sheepHealed && horseSpace && goatClimbed){
      QuestManager.phaseComplete[3] = true;
      console.log('📯 페이즈 3 완료! 보스 챌린지(겨울밤) 진입 대기 상태');
      setTimeout(() => { document.getElementById('mission-clear').style.display='block'; }, 600);
    }
  }
};
