// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1: 초록별 마을 — 단서·미션·페이즈 시스템
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  단서 시스템 (Phase 0)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ClueSystem = {
  clues: [
    { id: 'tree', pos: { x: 8, z: 8 }, found: false, emoji: '🌳', msg: '뿌리가 말라있어요. 흙이 딱딱해서 물을 흡수하지 못해요.' },
    { id: 'farm', pos: { x: 4, z: 4 }, found: false, emoji: '🌱', msg: '흙이 콘크리트처럼 굳어있어요. 씨앗을 심어도 싹이 안 트네요.' },
    { id: 'hive', pos: { x: 12, z: 4 }, found: false, emoji: '🐝', msg: '벌집이 텅 비어있어요. 꿀벌들이 어디로 갔을까요?' },
    { id: 'river', pos: { x: 4, z: 12 }, found: false, emoji: '🦆', msg: '쓰레기가 쌓여 수위가 낮아졌어요. 오리들이 뭍으로 올라와 있어요.' }
  ],
  foundCount: 0,
  meshes: [],

  init() {
    this.meshes.forEach(m => scene.remove(m));
    this.meshes = [];
    this.foundCount = this.clues.filter(c => c.found).length;
    const clueMat = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0.8 });
    const clueGeo = new THREE.SphereGeometry(0.4, 16, 16);
    this.clues.forEach(clue => {
      if (!clue.found) {
        const mesh = new THREE.Mesh(clueGeo, clueMat);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
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
    if (clue && !clue.found) {
      clue.found = true;
      this.foundCount++;
      if (clue.mesh) { scene.remove(clue.mesh); clue.mesh = null; }
      CreatureReport.show(clue.id);
      toast(`🔍 ${clue.emoji} 단서를 찾았어요! (${this.foundCount}/4)`);
      if (this.foundCount >= 4) { setTimeout(() => this.allFound(), 1500); }
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
      if (!clue.found && clue.mesh) {
        clue.mesh.position.y = clue.mesh.userData.baseTopY + 1.2 + Math.sin(t * 3 + clue.pos.x) * 0.3;
      }
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  독성식물, 진딧물, 무당벌레, 동반식물 (Phase 1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ToxicPlantSystem = {
  locations: [{ x: 5, z: 3 }, { x: 7, z: 5 }, { x: 13, z: 6 }],
  removed: 0,
  init() {
    if (Level1Manager.phase1State.toxicRemoved) return;
    this.removed = 0;
    this.locations.forEach(({ x, z }) => {
      const y = getTopY(x, z);
      if (y < 0) return;
      const k = bk(x, y, z);
      if (!deletedBlocks.has(k)) {
        _place(x, y, z, 'toxic_plant');
      }
    });
  },
  remove(x, y, z) {
    const k = bk(x, y, z);
    if (gridData[k] !== 'toxic_plant') return;
    removeBlock(x, y, z);
    this.removed++;
    toast(`🗑️ 독성 식물 제거 (${this.removed}/${this.locations.length})`);
    if (this.removed >= this.locations.length) {
      Level1Manager.phase1State.toxicRemoved = true;
      if (typeof showEcoPopup === 'function') showEcoPopup('🌼❌', '나쁜 노란 꽃을 뽑아<br>동물 친구들이 안전해졌어요!');
      QuestManager.check();
      // 다음 단계 안내는 우측 "🎯 다음 할 일" 카드가 자동 표시
    }
  }
};

const LeafSystem = {
  locations: [{ x: 6, z: 7 }, { x: 9, z: 5 }, { x: 7, z: 10 }, { x: 11, z: 8 }, { x: 5, z: 9 }],
  meshes: [],
  collected: 0,
  needed: 5,

  init() {
    this.meshes.forEach(m => scene.remove(m));
    this.meshes = [];
    this.collected = 0;
    this.locations.forEach(({ x, z }) => {
      const sprite = typeof createEmojiSprite === 'function' ? createEmojiSprite('🍂') : new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), new THREE.MeshLambertMaterial({ color: 0xD2691E }));

      const y = getTopY(x, z);
      sprite.position.set(x, y + 0.5, z);
      sprite.userData = { isLeaf: true, lx: x, lz: z };
      scene.add(sprite);
      this.meshes.push(sprite);
    });
  },

  collect(mesh) {
    scene.remove(mesh);
    this.meshes = this.meshes.filter(m => m !== mesh);
    this.collected++;
    toast(`🍂 낙엽 수집 (${this.collected}/${this.needed})`);
    if (this.collected >= this.needed) {
      toast('🍂 낙엽을 충분히 모았어요! 고목나무 주변 흙에 덮어주세요!');
    }
  },

  placeOnSoil(x, y, z) {
    // 레벨 2 이상에서는 지렁이 미니게임을 트리거하지 않음 (레벨 1 페이즈 1 전용 기능)
    if (typeof currentLevel !== 'undefined' && currentLevel !== 1) {
      toast('⚠️ 낙엽 덮기는 레벨 1에서만 가능해요!');
      return false;
    }
    if (this.collected < this.needed) {
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
    if (this.active) return;
    this.active = true;
    this.progress = 0;

    this.overlay = document.createElement('div');
    this.overlay.id = 'worm-minigame';
    this.overlay.innerHTML = `
      <div class="worm-panel">
        <div class="worm-title">땅속 세계</div>
        <div class="worm-desc">지렁이들이 낙엽을 먹으며 흙을 살려요!<br>각 칸을 눌러서 지렁이를 안내하세요!</div>
        <div id="worm-grid" class="worm-grid"></div>
        <div class="worm-progress">진행: <span id="worm-progress">0</span>/16 칸 완료</div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    const grid = document.getElementById('worm-grid');
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'worm-cell';
      cell.textContent = '🪱';
      cell.dataset.index = i;
      cell.dataset.done = 'false';
      cell.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.activateCell(cell);
      }, { passive: false });
      cell.addEventListener('click', () => this.activateCell(cell));
      grid.appendChild(cell);
    }
  },

  activateCell(cell) {
    if (cell.dataset.done === 'true') return;
    cell.dataset.done = 'true';
    cell.style.background = '#2C1810';
    cell.style.borderColor = '#4caf50';
    cell.textContent = '✨';
    this.progress++;
    const progEl = document.getElementById('worm-progress');
    if (progEl) progEl.textContent = this.progress;

    const idx = parseInt(cell.dataset.index);
    const col = idx % 4;
    const neighbors = [];
    if (col > 0) neighbors.push(idx - 1);
    if (col < 3) neighbors.push(idx + 1);
    if (idx >= 4) neighbors.push(idx - 4);
    if (idx < 12) neighbors.push(idx + 4);

    neighbors.forEach(n => {
      const nb = document.querySelector(`#worm-minigame [data-index="${n}"]`);
      if (nb && nb.dataset.done !== 'true') {
        setTimeout(() => { if (nb.dataset.done !== 'true') nb.style.borderColor = '#FFD700'; }, 300);
      }
    });

    if (this.progress >= this.totalCells) {
      setTimeout(() => this.complete(), 600);
    }
  },

  complete() {
    if (this.overlay && this.overlay.parentNode) {
      document.body.removeChild(this.overlay);
    }
    this.overlay = null;
    this.active = false;

    const tx = Math.round(OldTree.group ? OldTree.group.position.x : 8);
    const tz = Math.round(OldTree.group ? OldTree.group.position.z : 8);
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
      const wx = tx + dx, wz = tz + dz;
      const wy = getTopY(wx, wz) - 1;
      const k = bk(wx, wy, wz);
      if (gridData[k]) {
        const bt = gridData[k];
        if (bt === 'dirt' || bt === 't_dirt' || bt === 'dirt_dry' || bt === 'dirt_moist') {
          _place(wx, wy, wz, 'dirt_rich');
        }
      }
    }

    toast('🌱 지렁이가 흙을 살려냈어요! 영양토가 생겼어요!');
    Level1Manager.phase1State.wormDone = true;
    if (typeof showEcoPopup === 'function') showEcoPopup('🍂🪱', '지렁이가 낙엽을 먹고<br>딱딱한 흙을 숨 쉬게 만들었어요!');
    OldTree.showNutrientFlow();
    QuestManager.check();
    // 나무 회복 안내
    setTimeout(() => toast('✅ 지렁이 완료! 영양분이 나무 뿌리로 흐르고 있어요... 🌳'), 2600);
    setTimeout(() => toast('🌳 나무 할아버지가 스스로 깨어나고 있어요! 잠시만 기다리세요...'), 5000);
    // ── ui.js의 startWormMinigame() Promise 해제 신호 ──
    document.dispatchEvent(new CustomEvent('wormComplete'));
  }
};

const AphidSystem = {
  active: false,
  meshes: [],
  targetPlant: null,
  attack(x, z) {
    if (this.active) return;
    this.active = true;
    this.targetPlant = { x, z };
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
      const mesh = new THREE.Mesh(geo, mat);
      const y = getTopY(x, z) + 1;
      mesh.position.set(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.8);
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
    if (this.active) return;
    this.active = true;
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    this.mesh = new THREE.Mesh(geo, mat);
    const dotGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const dotMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
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
    if (!this.active || !this.mesh) return;
    if (this.arrived) {
      this.mesh.position.x = this.target.x + Math.cos(t * 2) * 0.5;
      this.mesh.position.z = this.target.z + Math.sin(t * 2) * 0.5;
      return;
    }
    const dx = this.target.x - this.mesh.position.x;
    const dz = this.target.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.5) {
      this.arrived = true;
      AphidSystem.clear(this.target.x, this.target.z);
    } else {
      this.mesh.position.x += (dx / dist) * 0.08;
      this.mesh.position.z += (dz / dist) * 0.08;
      this.mesh.position.y = getTopY(this.target.x, this.target.z) + 2 + Math.sin(t * 8) * 0.2;
    }
  }
};

function showAromaEffect(x, y, z) {
  const geo = new THREE.SphereGeometry(0.6, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, getTopY(Math.round(x), Math.round(z)), z);
  scene.add(mesh);
  let scale = 1;
  const anim = setInterval(() => {
    scale += 0.05;
    mesh.scale.set(scale, scale, scale);
    mesh.material.opacity -= 0.05;
    if (mesh.material.opacity <= 0) { clearInterval(anim); scene.remove(mesh); }
  }, 50);
}

const CompanionPlant = {
  pairs: {
    'tomato': { partner: 'basil', bonus: '🍅 토마토에 열매가 맺혔어요!' },
    'basil': { partner: 'tomato', bonus: '🌿 바질이 토마토를 지켜줘요!' }
  },
  check(x, y, z, plantType) {
    const pair = this.pairs[plantType];
    if (!pair) return false;
    const neighbors = [[x + 1, y, z], [x - 1, y, z], [x, y, z + 1], [x, y, z - 1]];
    for (const [nx, ny, nz] of neighbors) {
      const nb = gridData[bk(nx, ny, nz)];
      if (nb === 'plant_' + pair.partner || nb === 'plant_tomato_fruit') {
        setTimeout(() => {
          if (plantType === 'tomato') {
            _place(x, y, z, 'plant_tomato_fruit');
            Level1Manager.phase1State.tomatoFruited = true;
          } else if (pair.partner === 'tomato') {
            _place(nx, ny, nz, 'plant_tomato_fruit');
          }
          toast(pair.bonus);
          Level1Manager.phase1State.tomatoFruited = true;
          if (typeof showEcoPopup === 'function') showEcoPopup('🍅🌿', '바질의 든든한 도움 덕분에<br>건강한 토마토가 자랐어요!<br><small>(동반식물 효과)</small>');
          showAromaEffect(x, y, z);
          const targetX = plantType === 'tomato' ? x : nx;
          const targetZ = plantType === 'tomato' ? z : nz;
          LadybugSystem.summon(targetX, targetZ);
          QuestManager.check();
          // 다음 단계 안내는 우측 "🎯 다음 할 일" 카드가 자동 표시
        }, 3000);
        return true;
      }
    }
    return false;
  }
};

const CreatureReport = {
  data: {
    tree: { name: '🌳 고목나무', skill: '수백 년을 살며 수십 종의 생명에게 집을 내어줘요', weak: '뿌리가 마르면 주변 생태계 전체가 무너져요', fact: '나무들은 뿌리로 서로 영양분을 나눠요! (숲의 인터넷)', hint: '흙을 먼저 살려야 나무가 회복돼요' },
    farm: { name: '🌱 지렁이', skill: '매일 자기 몸무게만큼 낙엽을 먹어요', weak: '농약과 건조한 땅에서는 살 수 없어요', fact: '지렁이가 없으면 아무리 씨앗을 심어도 풀이 안 자라요', hint: '낙엽을 모아 흙 위에 덮어주세요!' },
    hive: { name: '🐝 꿀벌', skill: '하루에 꽃 수백 송이를 돌아다니며 꽃가루를 날라요', weak: '겹꽃(장미 등)에는 꽃가루가 없어서 못 먹어요', fact: '꿀벌이 없으면 과일과 채소의 70%가 열매를 못 맺어요', hint: '클로버·해바라기처럼 꽃가루 있는 꽃을 심어주세요!' },
    river: { name: '🦆 오리', skill: '고개를 물속에 넣어 먹이를 찾아요', weak: '물이 너무 얕으면 먹이를 못 찾아요', fact: '물이 없으면 깃털이 방수력을 잃어 오리가 물에 빠져요!', hint: '강의 쓰레기를 치워 수위를 높여주세요!' }
  },
  timer: null,
  show(id) {
    const d = this.data[id];
    if (!d) return;
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1 미션 관리자
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Level1Manager = {
  currentPhase: 0,
  phaseComplete: {},
  injuredHealedCount: 0,
  phase1State: {
    toxicRemoved: false,
    tomatoFruited: false,
    wormDone: false,
    treeGrowing: false
  },

  init() { /* 추가 초기화 필요시 사용 */ },

  check() {
    if (this.currentPhase === 1) this.checkPhase1();
    else if (this.currentPhase === 2) this.checkPhase2();
    else if (this.currentPhase === 3) this.checkPhase3();
  },

  checkPhase1() {
    if (this.phaseComplete[1]) return;
    const s = this.phase1State;
    const toxicOk = s.toxicRemoved;
    const tomatoOk = s.tomatoFruited;
    const wormOk = s.wormDone;
    const treeOk = s.treeGrowing;

    // 핫바 hint 글로우는 phase1State에 의존하므로 매 체크마다 갱신
    if (typeof initInventoryUI === 'function') initInventoryUI();

    const statusEl = document.getElementById('mission-status');
    if (statusEl) {
      const toxicCnt = (typeof ToxicPlantSystem !== 'undefined') ? ToxicPlantSystem.removed : 0;
      const leafCnt = (typeof LeafSystem !== 'undefined') ? LeafSystem.collected : 0;
      statusEl.innerHTML = `
        <div class="mc${toxicOk ? ' done' : ''}">${toxicOk ? '✅' : '1️⃣'} 🌼 노란 독성 꽃 뽑기 <small style="opacity:0.7">— 🪏 삽으로 클릭 (${toxicCnt}/3)</small></div>
        <div class="mc${tomatoOk ? ' done' : ''}">${tomatoOk ? '✅' : '2️⃣'} 🍅 토마토 + 🌿 바질 나란히 심기 <small style="opacity:0.7">— 💧 물주고 → 5·6번 씨앗 인접 배치</small></div>
        <div class="mc${wormOk ? ' done' : ''}">${wormOk ? '✅' : '3️⃣'} 🍂 낙엽 5장 모아 흙에 덮기 <small style="opacity:0.7">— 모은 낙엽 ${leafCnt}/5</small></div>
        <div class="mc${treeOk ? ' done' : ''}">${treeOk ? '✅' : '🌳'} 나무 할아버지 회복 <small style="opacity:0.7">— 지렁이가 흙을 살리면 자동</small></div>
      `;
    }

    if (toxicOk && tomatoOk && wormOk && treeOk) {
      this.phaseComplete[1] = true;
      setTimeout(() => {
        showPhaseTransition(2);
        setTimeout(() => {
          this.currentPhase = 2;
          advancePhase(2);
          this.updateUI();
          Phase2System.init();
        }, 2500);
      }, 600);
    }
  },

  checkPhase2() { Phase2System.check(); },

  checkPhase3() {
    if (this.phaseComplete[3]) return;
    Phase3System.check();
  },

  advance() {
    this.currentPhase++;
    advancePhase(this.currentPhase);
    toast(`새로운 퀘스트(페이즈 ${this.currentPhase})가 시작되었습니다!`);
    this.updateUI();
    showPhaseTransition(this.currentPhase);
  },

  updateUI(healed = 0, enclosed = 0, grass = 0) {
    const titleEl = document.getElementById('mission-title');
    const descEl = document.getElementById('mission-desc');
    const statusEl = document.getElementById('mission-status');

    if (this.currentPhase === 0) {
      titleEl.textContent = `🔍 단서 탐색 중...`;
      if (descEl) descEl.innerHTML = `마을 곳곳의 <b style="color:#FFD700">노란색 구슬</b>을 눌러 단서를 수집하세요!<br><small style="opacity:0.7">🎯 우측 "다음 할 일" 카드를 참고하세요</small>`;
      if (statusEl) statusEl.innerHTML = '';

    } else if (this.currentPhase === 1) {
      titleEl.textContent = `🌱 페이즈 1: 병든 고목나무 살리기`;
      if (descEl) descEl.innerHTML = `네 가지 과제를 순서대로 해결하세요.<br><small style="opacity:0.7">🎯 우측 "다음 할 일" 카드에 자세한 방법이 있어요</small>`;
      this.checkPhase1();  // 상태바 즉시 갱신

    } else if (this.currentPhase === 2) {
      titleEl.textContent = `🦋 페이즈 2: 곤충과 새가 돌아오고 있어요`;
      if (descEl) descEl.innerHTML = `표시된 구역을 클릭해서 생태계를 복원하세요!`;
      if (statusEl) {
        const c = Phase2System.conditions, e = Phase2System.envFlags;
        statusEl.innerHTML = `
          <div class="mc${c.hiveFull ? ' done' : ''}">${c.hiveFull ? '✅' : '1️⃣'} 🐝 꿀벌 귀환 <small style="opacity:0.7">→ 꽃 심기 + 나뭇가지 제거</small></div>
          <div class="mc${e.riverTrashCount === 0 ? ' done' : ''}">${e.riverTrashCount === 0 ? '✅' : '2️⃣'} 🗑️ 강 쓰레기 제거 <small style="opacity:0.7">→ 남은 ${e.riverTrashCount}개</small></div>
          <div class="mc${c.nestBuilt ? ' done' : ''}">${c.nestBuilt ? '✅' : '3️⃣'} 🪺 제비 둥지 완성 <small style="opacity:0.7">→ 강물 먼저 살려야 가능</small></div>
        `;
      }

    } else if (this.currentPhase === 3) {
      titleEl.textContent = `🎯 동물의 보금자리 만들기`;
      if (descEl) descEl.innerHTML = `노란색 화살표(⬇️)가 가리키는 대상을 찾아 클릭하세요!`;
      if (statusEl) {
        const c = Phase3System.conditions;
        statusEl.innerHTML = `
          <div class="mc${c.sheepHealed ? ' done' : ''}">${c.sheepHealed ? '✅' : '1️⃣'} 🐑 <b>양 치료:</b> 화살표를 따라 양을 그늘과 볏짚으로 옮기고 치료해 주세요!</div>
          <div class="mc${c.horseSpace ? ' done' : ''}">${c.horseSpace ? '✅' : '2️⃣'} 🐴 <b>말 돕기:</b> 말굽의 돌을 빼고, 화살표가 가리키는 붉은 울타리를 치워주세요!</div>
          <div class="mc${c.goatClimbed ? ' done' : ''}">${c.goatClimbed ? '✅' : '3️⃣'} 🐐 <b>염소 놀이터:</b> 도망가려는 파란 구슬을 잡고, 염소를 바위 위로 올려보내세요!</div>
        `;
      }
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  고목나무
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    if (!this.group) return;
    if (this.state === 'chopped') { scene.remove(this.group); return; }
    else if (this.group.parent !== scene) { scene.add(this.group); }
    const leafColor = this.state === 'withered' ? 0x888888 : (this.state === 'growing' ? 0x90EE90 : 0x228B22);
    this.leaves.forEach(l => { if (l.material) l.material.color.setHex(leafColor); });
    this.branches.forEach(b => { b.rotation.z = this.state === 'withered' ? -0.4 : 0.2; });
    if (this.state === 'blooming') this.fruits.forEach(f => f.visible = true);
    else this.fruits.forEach(f => f.visible = false);
  },
  showNutrientFlow() {
    if (!this.group) return;
    const basePos = this.group.position;
    this._particles = [];
    this._particleStart = Date.now();
    for (let i = 0; i < 14; i++) {
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
    if (!this._particles || this._particles.length === 0) return;
    const elapsed = Date.now() - this._particleStart;
    if (elapsed > 2200) {
      this._particles.forEach(p => scene.remove(p));
      this._particles = [];
      this.setState('blooming');
      Level1Manager.phase1State.treeGrowing = true;
      Phase2System.conditions.treeBlooming = true;
      checkSheepCondition();
      if (typeof showEcoPopup === 'function') showEcoPopup('🌳✨', '주변 흙이 건강해져서<br>나무 할아버지가 살아났어요!');
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
      if (Date.now() > endTime) { clearInterval(shakeInterval); orbitTarget.y = originalY; syncCam(); }
      else { orbitTarget.y = originalY + (Math.random() - 0.5) * 1.5; syncCam(); }
    }, 50);
    scene.remove(this.group);
    this.state = 'chopped';
    const tx = 8, tz = 8;
    for (let x = tx - 10; x <= tx + 10; x++) {
      for (let z = tz - 10; z <= tz + 10; z++) {
        if (Math.hypot(x - tx, z - tz) <= 10) {
          for (let y = 0; y <= GH; y++) {
            const k = bk(x, y, z);
            if (gridData[k] && meshByKey[k]) {
              const type = gridData[k].split('_')[0];
              if (['grass', 't_low', 't_mid', 't_high', 't_dirt', 'dirt'].includes(type)) {
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
    if (bt !== 'dirt_dry' && bt !== 'dirt' && bt !== 't_dirt') {
      toast('⚠️ 물을 흡수할 수 없는 곳이에요!');
      return;
    }
    const current = this.moisture[k] || 0;
    this.moisture[k] = current + 3;
    if (this.moisture[k] <= 6) {
      if (gridData[k] === 'dirt_dry' || gridData[k] === 'dirt' || gridData[k] === 't_dirt')
        _place(x, y, z, 'dirt_moist');
      showWaterGauge(this.moisture[k]);
      toast('💧 적당히 촉촉해졌어요!');
    } else {
      _place(x, y, z, 'dirt_wet');
      this.killPlantAbove(x, y + 1, z);
      showWaterGauge(this.moisture[k], true);
      toast('⚠️ 물을 너무 많이 줬어요! 씨앗이 썩어요!');
    }
    setTimeout(() => { if (this.moisture[k] > 0) this.moisture[k] -= 1; }, 5000);
  },
  killPlantAbove(x, y, z) {
    const k = bk(x, y, z);
    if (gridData[k] && (gridData[k].startsWith('plant_') || gridData[k] === 'sprout')) {
      _place(x, y, z, 'plant_dead');
      toast('💀 식물이 과습으로 죽었어요...');
    }
  }
};

const SeedSystem = {
  planted: {},
  plant(x, y, z, seedType) {
    const floorKey = bk(x, y - 1, z);
    const floorBlock = gridData[floorKey];
    if (floorBlock !== 'dirt_moist' && floorBlock !== 'dirt_rich') {
      toast('⚠️ 젖은 흙 위에만 씨앗을 심을 수 있어요!'); return;
    }
    if (gridData[bk(x, y, z)]) { toast('⚠️ 이미 뭔가 심어져 있어요!'); return; }
    this.planted[bk(x, y, z)] = { type: seedType, plantedAt: Date.now(), grown: false };
    _place(x, y, z, 'sprout');
    toast(`🌱 ${ITEM_DB[seedType].label}을 심었어요!`);
    QuestManager.check();
  },
  update(t) {
    const now = Date.now();
    for (const [k, p] of Object.entries(this.planted)) {
      if (!p.grown && now - p.plantedAt > 10000) {
        const [x, y, z] = k.split(',').map(Number);
        this.grow(x, y, z, p.type);
      }
    }
  },
  grow(x, y, z, seedType) {
    const k = bk(x, y, z);
    const floorBlock = gridData[bk(x, y - 1, z)];
    if (floorBlock === 'dirt_wet') {
      _place(x, y, z, 'plant_dead');
      toast('💀 과습으로 식물이 죽었어요...'); return;
    }
    const plantType = 'plant_' + ITEM_DB[seedType].grows;
    _place(x, y, z, plantType);
    if (this.planted[k]) this.planted[k].grown = true;
    toast(`🌿 ${ITEM_DB[seedType].label}가 자랐어요!`);
    const partnerFound = CompanionPlant.check(x, y, z, ITEM_DB[seedType].grows);
    if (ITEM_DB[seedType].grows === 'tomato' && !partnerFound) {
      setTimeout(() => AphidSystem.attack(x, z), 2000);
    }
    QuestManager.check();
  }
};

const ArrowSystem = {
  pool: [],
  activeCount: 0,
  _dirty: true,
  _cache: {},

  invalidate() { this._dirty = true; },

  _rebuildCache() {
    const out = {};
    for (const [k, type] of Object.entries(gridData)) {
      if (!out[type]) out[type] = [];
      const [x, y, z] = k.split(',').map(Number);
      out[type].push({ x, y, z });
    }
    this._cache = out;
    this._dirty = false;
  },

  getArrow() {
    if (this.activeCount < this.pool.length) {
      const a = this.pool[this.activeCount++];
      a.visible = true;
      return a;
    }
    const geo = new THREE.ConeGeometry(0.3, 0.6, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI; // point down
    scene.add(mesh);
    this.pool.push(mesh);
    this.activeCount++;
    return mesh;
  },
  update(t) {
    this.activeCount = 0;
    if (this._dirty) this._rebuildCache();
    if (QuestManager.getCurrentPhase() === 1) {
      const s = Level1Manager.phase1State;
      const sin = Math.sin(t * 5) * 0.15;
      if (!s.toxicRemoved) {
        for (const { x, y, z } of (this._cache.toxic_plant || [])) {
          const a = this.getArrow();
          a.position.set(x, y + 1.2 + sin, z);
        }
      } else if (!s.tomatoFruited) {
        for (const type of ['dirt_rich', 'dirt_moist', 'sprout']) {
          for (const { x, y, z } of (this._cache[type] || [])) {
            const a = this.getArrow();
            a.position.set(x, y + 1.2 + sin, z);
          }
        }
      } else if (!s.wormDone) {
        for (const type of ['dirt_dry', 't_dirt']) {
          for (const { x, y, z } of (this._cache[type] || [])) {
            if (this.activeCount < 5 && Math.sin(x * z) > 0.8) {
              const a = this.getArrow();
              a.position.set(x, y + 1.2 + sin, z);
            }
          }
        }
      }
    } else if (QuestManager.getCurrentPhase() === 3) {
      const c = Phase3System.conditions;
      const p3 = Phase3System;
      // 양 미션 화살표
      if (!c.sheepHealed) {
        if (p3.sheepMesh) {
          const a = this.getArrow();
          a.position.set(p3.sheepMesh.position.x, p3.sheepMesh.position.y + 1.5 + Math.sin(t * 5) * 0.15, p3.sheepMesh.position.z);
        }
        if (p3._sheepSelected && !p3._sheepOnStraw && p3.shadeMesh) {
          const a = this.getArrow();
          a.position.set(p3.shadeMesh.position.x, p3.shadeMesh.position.y + 1.2 + Math.sin(t * 5) * 0.15, p3.shadeMesh.position.z);
        }
        if (!p3._sheepSelected && !p3._sheepOnStraw && p3.strawMesh && p3.sheepMesh && Math.abs(p3.sheepMesh.position.x - p3.shadeMesh.position.x) < 0.5) {
          const a = this.getArrow();
          a.position.set(p3.strawMesh.position.x, p3.strawMesh.position.y + 1.2 + Math.sin(t * 5) * 0.15, p3.strawMesh.position.z);
        }
      }
      // 말 미션 화살표
      if (!c.horseSpace) {
        if (p3.horseMesh) {
          const a = this.getArrow();
          a.position.set(p3.horseMesh.position.x, p3.horseMesh.position.y + 1.5 + Math.sin(t * 5) * 0.15, p3.horseMesh.position.z);
        }
        p3.fenceMeshes.forEach(f => {
          const a = this.getArrow();
          a.position.set(f.position.x, f.position.y + 1.2 + Math.sin(t * 5) * 0.15, f.position.z);
        });
      }
      // 염소 미션 화살표
      if (!c.goatClimbed) {
        if (p3.goatMesh && !p3._escapeMiniActive) {
          const a = this.getArrow();
          a.position.set(p3.goatMesh.position.x, p3.goatMesh.position.y + 1.5 + Math.sin(t * 5) * 0.15, p3.goatMesh.position.z);
        }
        p3.escapeSpheres.forEach(s => {
          const a = this.getArrow();
          a.position.set(s.position.x, s.position.y + 1.2 + Math.sin(t * 5) * 0.15, s.position.z);
        });
        if (p3._goatSelected && p3.rockMesh) {
          const a = this.getArrow();
          a.position.set(p3.rockMesh.position.x, p3.rockMesh.position.y + 1.8 + Math.sin(t * 5) * 0.15, p3.rockMesh.position.z);
        }
      }
    }
    for (let i = this.activeCount; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  페이즈 2 시스템 — 화이트박스 프로토타입
//  (꿀벌 귀환 / 강 쓰레기 제거 / 나무의 손님들)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  페이즈 공통 헬퍼 (Phase2System / Phase3System 공유)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function _phaseBox(w, h, d, hex, x, y, z, ud = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: hex }));
  m.position.set(x, y, z); m.castShadow = true; Object.assign(m.userData, ud); scene.add(m); return m;
}
function _phaseSprite(emoji, x, y, z, ud = {}) {
  if (typeof createEmojiSprite !== 'function') return _phaseBox(1, 1, 1, 0xff0000, x, y + 0.5, z, ud);
  const m = createEmojiSprite(emoji);
  m.position.set(x, y + 0.8, z); Object.assign(m.userData, ud); scene.add(m); return m;
}
function _makeOverlay(html) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
  ov.innerHTML = html;
  return ov;
}

const Phase2System = {
  flowerZoneMeshes: [],
  branchMesh: null,
  trashMeshes: [],
  nestZoneMesh: null,
  conditions: { hiveFull: false, nestBuilt: false, treeBlooming: false },
  envFlags: { riverTrashCount: 3, hasMud: false, birdHoleSize: 0, toxicPlantsRemoved: true },

  init() {
    this._clearAll();
    Object.assign(this.conditions, { hiveFull: false, nestBuilt: false, treeBlooming: false });
    Object.assign(this.envFlags, { riverTrashCount: 3, hasMud: false });
    this._initFlowerZones();
    this._initBranch();
    this._initRiverTrash();
    this._initTreeZones();
    QuestManager.updateUI();
  },

  _clearAll() {
    [...this.flowerZoneMeshes, ...this.trashMeshes,
    this.branchMesh, this.nestZoneMesh]
      .filter(Boolean).forEach(m => scene.remove(m));
    this.flowerZoneMeshes = []; this.trashMeshes = [];
    this.branchMesh = null; this.nestZoneMesh = null;
  },

  _initFlowerZones() {
    [{ x: 2, z: 3 }, { x: 6, z: 3 }, { x: 2, z: 5 }, { x: 6, z: 5 }].forEach(({ x, z }) => {
      this.flowerZoneMeshes.push(_phaseSprite('🌸', x, getTopY(x, z), z, { isFlowerZone: true, planted: false }));
    });
  },

  _initBranch() {
    const x = 8, z = 4;
    this.branchMesh = _phaseSprite('🪵', x, getTopY(x, z), z, { isBranch: true });
  },

  _initRiverTrash() {
    [{ x: 3, z: 11 }, { x: 4, z: 13 }, { x: 5, z: 12 }].forEach(({ x, z }) => {
      this.trashMeshes.push(_phaseSprite('🗑️', x, getTopY(x, z), z, { isTrash: true }));
    });
  },

  _initTreeZones() {
    if (!OldTree.group) return;
    const tx = 8, tz = 8, ty = getTopY(tx, tz);
    this.nestZoneMesh = _phaseSprite('🪺', tx - 1.5, ty + 2.7, tz, { isNestZone: true });
  },

  getAllMeshes() {
    return [...this.flowerZoneMeshes, ...this.trashMeshes,
    this.branchMesh, this.nestZoneMesh].filter(Boolean);
  },

  handleClick(obj) {
    if (obj.userData.isFlowerZone) { this._onFlowerZoneClick(obj); return true; }
    if (obj.userData.isBranch) { this._onBranchClick(obj); return true; }
    if (obj.userData.isTrash) { this._onTrashClick(obj); return true; }
    if (obj.userData.isNestZone) { this._onNestZoneClick(); return true; }
    return false;
  },

  _onFlowerZoneClick(mesh) {
    if (mesh.userData.planted) { toast('🌸 이미 꽃이 피어있어요!'); return; }
    this._showFlowerUI(mesh);
  },

  _showFlowerUI(targetMesh) {
    const ov = _makeOverlay(`
      <div style="color:#FFD700;font-size:20px;font-weight:900;">🌸 어떤 꽃을 심을까요?</div>
      <div style="color:rgba(255,255,255,0.8);font-size:13px;text-align:center;">꿀벌이 좋아하는 꽃을 골라주세요!</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        ${[['장미', '🌹', false], ['국화', '🌼', false], ['클로버', '🍀', true], ['해바라기', '🌻', true]]
        .map(([n, e, ok]) => `<button data-ok="${ok}" data-name="${n}" style="padding:12px 18px;font-size:18px;border-radius:12px;border:none;cursor:pointer;background:${ok ? '#27AE60' : '#555'};color:#fff;font-weight:700;">${e} ${n}</button>`).join('')}
      </div>
      <button class="p2c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">취소</button>`);
    document.body.appendChild(ov);
    ov.querySelectorAll('[data-ok]').forEach(btn => btn.addEventListener('click', () => {
      const ok = btn.dataset.ok === 'true';
      document.body.removeChild(ov);
      if (ok) {
        targetMesh.userData.planted = true;
        targetMesh.material.color.setHex(0xF1C40F);
        toast(`🌸 ${btn.dataset.name}을/를 심었어요! 꿀벌이 좋아해요!`);
        DBG('[Phase2] 꽃 심기 성공:', btn.dataset.name);
        this._checkHiveReady();
      } else {
        toast(`⚠️ ${btn.dataset.name}에는 꿀벌이 오지 않아요!`);
        DBG('[Phase2] 부적합 꽃 선택:', btn.dataset.name);
      }
    }));
    ov.querySelector('.p2c').addEventListener('click', () => document.body.removeChild(ov));
  },

  _checkHiveReady() {
    const planted = this.flowerZoneMeshes.filter(m => m.userData.planted).length;
    const total = this.flowerZoneMeshes.length;
    DBG(`[Phase2] 꽃 진행: ${planted}/${total}, 나뭇가지 남음: ${!!this.branchMesh}`);
    if (planted < total) { toast(`🌸 꽃 심기 (${planted}/${total})`); return; }
    if (this.branchMesh) { toast('🐝 꽃이 모두 피었어요! 벌집 가는 길 나뭇가지를 치워주세요!'); return; }
    this._activateHive();
  },

  _onBranchClick(mesh) {
    scene.remove(mesh); this.branchMesh = null;
    toast('🪵 나뭇가지를 치웠어요!');
    DBG('[Phase2] 장애물 제거 완료');
    if (this.flowerZoneMeshes.every(m => m.userData.planted)) this._activateHive();
    else toast('🐝 꽃을 모두 심으면 벌들이 돌아올 거예요!');
  },

  _activateHive() {
    if (this.conditions.hiveFull) return;
    this.conditions.hiveFull = true;
    toast('🐝 벌집에 꿀벌이 돌아왔어요!');
    DBG('[Phase2] hiveFull = true');
    if (typeof showEcoPopup === 'function') showEcoPopup('🌸🐝', '꿀벌이 돌아와<br>꽃가루를 날라요!');
    if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('bee', 3);
    // ── state.js 동기화 ──
    global_protectors.bee = true;
    if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
    checkLevel1Clear();
    // ────────────────────
    this.check();
  },

  _onTrashClick(mesh) {
    scene.remove(mesh);
    this.trashMeshes = this.trashMeshes.filter(m => m !== mesh);
    this.envFlags.riverTrashCount--;
    toast(`🗑️ 쓰레기 제거 (남은: ${this.envFlags.riverTrashCount}개)`);
    DBG('[Phase2] 쓰레기 제거, 남은 수:', this.envFlags.riverTrashCount);
    if (this.envFlags.riverTrashCount <= 0) {
      this.envFlags.hasMud = true;
      toast('💧 강물 수위가 올라갔어요! 강가에 진흙이 생겼어요!');
      DBG('[Phase2] hasMud = true — 제비 둥지 열쇠 활성화');
      if (typeof showEcoPopup === 'function') showEcoPopup('🗑️💧', '쓰레기를 치우자<br>강물이 맑아지고 진흙이 생겼어요!');
      // 수달(otter)은 레벨 2에서 강물 연결 시 합류하므로 여기서 합류 처리하지 않음
    }
    QuestManager.updateUI();
  },

  _onNestZoneClick() {
    if (this.conditions.nestBuilt) { toast('🪺 이미 둥지가 완성됐어요!'); return; }
    if (!this.envFlags.hasMud) {
      toast('⚠️ 진흙이 부족합니다. 강가 쓰레기를 먼저 치워 강물을 살려주세요!');
      DBG('[Phase2] 둥지 실패 — hasMud = false');
      return;
    }
    this.conditions.nestBuilt = true;
    if (this.nestZoneMesh) this.nestZoneMesh.material.color.setHex(0x27AE60);
    toast('🪺 진흙으로 제비 둥지가 완성됐어요!');
    DBG('[Phase2] nestBuilt = true');
    if (typeof showEcoPopup === 'function') showEcoPopup('💧🪺', '강물이 살아나<br>진흙으로 둥지를 지었어요!');
    if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('swallow', 3);
    // ── state.js 동기화 ──
    global_protectors.swallow = true;
    if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
    checkLevel1Clear();
    // ────────────────────
    this.check();
  },

  check() {
    const { hiveFull, nestBuilt, treeBlooming } = this.conditions;
    DBG('[Phase2] 조건 체크 — hiveFull:', hiveFull, '| nestBuilt:', nestBuilt);
    QuestManager.updateUI();
    if (hiveFull && nestBuilt && !treeBlooming) {
      this.conditions.treeBlooming = true;
      DBG('🦋 하늘이 활기로 가득해요! 페이즈 3 시작');
      if (typeof showEcoPopup === 'function') showEcoPopup('🌳🦋', '생명이 돌아왔어요!<br>하늘이 활기로 가득해요!');
      setTimeout(() => {
        showPhaseTransition(3);
        setTimeout(() => {
          Level1Manager.currentPhase = 3;
          advancePhase(3);
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

  conditions: { sheepHealed: false, horseSpace: false, goatClimbed: false },

  init() {
    this._clearAll();
    Object.assign(this.conditions, { sheepHealed: false, horseSpace: false, goatClimbed: false });
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
    this.sheepMesh = null; this.shadeMesh = null; this.strawMesh = null;
    this.horseMesh = null; this.goatMesh = null; this.rockMesh = null;
    this.fenceMeshes = []; this.escapeSpheres = [];
    if (this._escapeTimer) { clearTimeout(this._escapeTimer); this._escapeTimer = null; }
  },

  _initSheepZone() {
    const sx = 3, sz = 3, sy = getVisualTopY(sx, sz);
    this.sheepMesh = buildAnimal('sheep', true); // 다친 양
    this.sheepMesh.position.set(sx, sy, sz);
    this.sheepMesh.traverse(c => { if (c.isMesh) c.userData.isSheep = true; });
    scene.add(this.sheepMesh);

    // 그늘 = 고목나무(8,8) 바로 옆, 볏짚 = 그 근처
    const shx = 7, shz = 8;
    this.shadeMesh = _phaseSprite('🌳', shx, getVisualTopY(shx, shz), shz, { isShadeZone: true });
    const stx = 5, stz = 8;
    this.strawMesh = _phaseSprite('🌾', stx, getVisualTopY(stx, stz), stz, { isStrawZone: true });
  },

  _initHorseZone() {
    const hx = 10, hz = 3, hy = getVisualTopY(hx, hz);
    this.horseMesh = buildAnimal('horse', false);
    this.horseMesh.position.set(hx, hy, hz);
    this.horseMesh.traverse(c => { if (c.isMesh) c.userData.isHorse = true; });
    scene.add(this.horseMesh);

    this.fenceMeshes = [
      _phaseBox(0.15, 0.8, 1.0, 0xFF4444, hx + 1.2, hy + 0.4, hz, { isFence3: true }),
      _phaseBox(0.15, 0.8, 1.0, 0xFF4444, hx - 1.2, hy + 0.4, hz, { isFence3: true })
    ];
  },

  _initGoatZone() {
    const gx = 11, gz = 12, gy = getVisualTopY(gx, gz);
    this.goatMesh = buildAnimal('goat', false);
    this.goatMesh.position.set(gx, gy, gz);
    this.goatMesh.traverse(c => { if (c.isMesh) c.userData.isGoat = true; });
    scene.add(this.goatMesh);

    const rx = gx + 2, rz = gz, ry = getVisualTopY(rx, rz);
    this.rockMesh = _phaseBox(1.5, 1.0, 1.5, 0x888888, rx, ry + 0.5, rz, { isRock3: true });
  },

  getAllMeshes() {
    return [this.sheepMesh, this.shadeMesh, this.strawMesh,
    this.horseMesh, this.goatMesh, this.rockMesh,
    ...this.fenceMeshes, ...this.escapeSpheres].filter(Boolean);
  },

  handleClick(obj) {
    if (obj.userData.isSheep) { this._onSheepClick(); return true; }
    if (obj.userData.isShadeZone) { this._onShadeZoneClick(); return true; }
    if (obj.userData.isStrawZone) { this._onStrawZoneClick(); return true; }
    if (obj.userData.isHorse) { this._onHorseClick(); return true; }
    if (obj.userData.isFence3) { this._onFenceClick(obj); return true; }
    if (obj.userData.isGoat) { this._onGoatClick(); return true; }
    if (obj.userData.isEscapeSphere) { this._onEscapeSphereClick(obj); return true; }
    if (obj.userData.isRock3) { this._onRockClick(); return true; }
    return false;
  },

  // ── 양 (A) ──
  _onSheepClick() {
    if (this.conditions.sheepHealed) { toast('🐑 양이 건강해졌어요!'); return; }
    if (this._sheepOnStraw) { this._showFirstAidPopup(); return; }
    this._sheepSelected = true;
    this.sheepMesh.traverse(c => { if (c.isMesh && c.material) { c.material = c.material.clone(); c.material.emissive = new THREE.Color(0x664400); c.material.emissiveIntensity = 0.6; } });
    toast('🐑 양을 선택했어요! 고목나무 근처 ☂️ 그늘 표시를 클릭하세요!');
  },

  _onShadeZoneClick() {
    if (!this._sheepSelected || this._sheepOnStraw) return;
    this.sheepMesh.position.set(this.shadeMesh.position.x, this.shadeMesh.position.y - 0.8, this.shadeMesh.position.z);
    this.shadeMesh.material.color.setHex(0xBBBBBB);
    this._sheepSelected = false;
    this.sheepMesh.traverse(c => { if (c.isMesh && c.material) c.material.emissiveIntensity = 0; });
    toast('🐑 시원한 그늘로 왔어요! 양을 다시 클릭해서 🌾 볏짚 표시를 클릭하세요!');
  },

  _onStrawZoneClick() {
    if (!this._sheepSelected) { toast('⚠️ 노란색 화살표가 가리키는 양을 먼저 클릭해주세요!'); return; }
    if (this.conditions.sheepHealed) return;
    this.sheepMesh.position.set(this.strawMesh.position.x, this.strawMesh.position.y - 0.8, this.strawMesh.position.z);
    this.strawMesh.material.color.setHex(0xF5A800);
    this._sheepOnStraw = true;
    this._sheepSelected = false;
    this.sheepMesh.traverse(c => { if (c.isMesh && c.material) c.material.emissiveIntensity = 0; });
    toast('🐑 볏짚 위로 이동했어요! 양을 다시 클릭해서 다리를 치료해주세요!');
  },

  _showFirstAidPopup() {
    const ov = _makeOverlay(`
      <div style="font-size:40px;">🏥</div>
      <div style="color:#FFD700;font-size:20px;font-weight:900;">응급 처치</div>
      <div style="color:rgba(255,255,255,0.85);font-size:14px;text-align:center;line-height:1.7;">양이 다리를 다쳤어요.<br>볏짚 위에서 따뜻하게 쉬게 해주면 낫는대요!</div>
      <button id="p3-heal-ok" style="padding:12px 30px;border-radius:12px;border:none;cursor:pointer;background:#E74C3C;color:#fff;font-size:17px;font-weight:700;">💖 치료하기</button>
      <button class="p3c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">취소</button>`);
    document.body.appendChild(ov);
    document.getElementById('p3-heal-ok').addEventListener('click', () => {
      document.body.removeChild(ov);
      this.conditions.sheepHealed = true;
      this.sheepMesh.traverse(c => { if (c.isMesh && c.material) { c.material.color.setHex(0xe8e8e8); c.material.emissiveIntensity = 0; } });
      toast('💖 양이 치료되었어요! 건강을 되찾았어요!');
      DBG('[Phase3] sheepHealed = true');
      if (typeof showEcoPopup === 'function') showEcoPopup('🐑💖', '볏짚 위에서 쉬게 해주니<br>양이 건강해졌어요!');
      // ── state.js 동기화 ──
      checkSheepCondition();
      // ────────────────────
      this.check();
    });
    ov.querySelector('.p3c').addEventListener('click', () => document.body.removeChild(ov));
  },

  // ── 말 (B) ──
  _onHorseClick() { this._showHoofPopup(); },

  _showHoofPopup() {
    const ov = _makeOverlay(`
      <div style="font-size:40px;">🐴</div>
      <div style="color:#FFD700;font-size:20px;font-weight:900;">발굽 돌 제거</div>
      <div style="color:rgba(255,255,255,0.85);font-size:14px;text-align:center;line-height:1.7;">말의 발굽 사이에 돌이 끼었어요.<br>조심스럽게 제거해 주세요!</div>
      <button id="p3-hoof-ok" style="padding:12px 30px;border-radius:12px;border:none;cursor:pointer;background:#8B4513;color:#fff;font-size:17px;font-weight:700;">🪨 돌 제거하기</button>
      <button class="p3c" style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;background:#888;color:#fff;">닫기</button>`);
    document.body.appendChild(ov);
    document.getElementById('p3-hoof-ok').addEventListener('click', () => {
      document.body.removeChild(ov);
      toast('🐴 발굽 돌을 제거했어요! 이제 노란 화살표가 가리키는 울타리를 치워주세요!');
      DBG('[Phase3] 말 발굽 돌 제거 완료');
      if (typeof showEcoPopup === 'function') showEcoPopup('🐴🪨', '발굽 돌을 빼주니<br>말이 편안해졌어요!');
    });
    ov.querySelector('.p3c').addEventListener('click', () => document.body.removeChild(ov));
  },

  _onFenceClick(mesh) {
    if (!Phase2System.envFlags.toxicPlantsRemoved) {
      toast('⚠️ 독성 식물을 먼저 제거해야 울타리를 칠 수 있어요!');
      DBG('[Phase3] 울타리 제거 실패 — toxicPlantsRemoved = false');
      return;
    }
    scene.remove(mesh);
    this.fenceMeshes = this.fenceMeshes.filter(m => m !== mesh);
    toast(`🚧 울타리 제거! (남은: ${this.fenceMeshes.length}개)`);
    DBG('[Phase3] 울타리 제거, 남은 수:', this.fenceMeshes.length);
    if (this.fenceMeshes.length === 0) {
      this.conditions.horseSpace = true;
      toast('🐴 말이 드넓은 공간을 뛸 수 있어요!');
      DBG('[Phase3] horseSpace = true');
      if (typeof showEcoPopup === 'function') showEcoPopup('🐴🌿', '울타리가 사라지니<br>말이 자유롭게 뛰어요!');
      this.check();
    }
  },

  // ── 염소 (C) ──
  _onGoatClick() {
    if (this.conditions.goatClimbed) { toast('🐐 염소가 바위에 올라있어요!'); return; }
    if (this._escapeSphereClicked >= 3 && !this._goatSelected) {
      this._goatSelected = true;
      this.goatMesh.traverse(c => { if (c.isMesh && c.material) { c.material = c.material.clone(); c.material.emissive = new THREE.Color(0x004466); c.material.emissiveIntensity = 0.6; } });
      toast('🐐 염소를 선택했어요! 노란색 화살표가 가리키는 바위를 클릭하세요!');
      return;
    }
    if (!this._escapeMiniActive) this._startEscapeMinigame();
  },

  _startEscapeMinigame() {
    if (this._escapeMiniActive) return;
    this._escapeMiniActive = true;
    this._escapeSphereClicked = 0;
    this.escapeSpheres.forEach(m => scene.remove(m));
    this.escapeSpheres = [];
    const gx = this.goatMesh ? this.goatMesh.position.x : 14;
    const gz = this.goatMesh ? this.goatMesh.position.z : 7;
    [{ dx: -2, dz: 1 }, { dx: 1, dz: 2 }, { dx: 2, dz: -1 }].forEach(({ dx, dz }) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshLambertMaterial({ color: 0x00AAFF }));
      const sy = getTopY(Math.round(gx + dx), Math.round(gz + dz));
      m.position.set(gx + dx, sy + 0.6, gz + dz);
      m.castShadow = true;
      m.userData = { isEscapeSphere: true };
      scene.add(m);
      this.escapeSpheres.push(m);
    });
    toast('🐐 염소가 도망치려 해요! 파란 구슬을 모두 클릭해서 막아주세요! (10초)');
    DBG('[Phase3] 탈출 미니게임 시작');
    this._escapeTimer = setTimeout(() => { if (this._escapeMiniActive) this._escapeTimerFail(); }, 10000);
  },

  _onEscapeSphereClick(mesh) {
    if (!this._escapeMiniActive) return;
    scene.remove(mesh);
    this.escapeSpheres = this.escapeSpheres.filter(m => m !== mesh);
    this._escapeSphereClicked++;
    toast(`🔵 (${this._escapeSphereClicked}/3) 구슬 잡기 성공!`);
    if (this._escapeSphereClicked >= 3) {
      clearTimeout(this._escapeTimer); this._escapeTimer = null;
      this._escapeMiniActive = false;
      toast('🐐 구슬을 모두 막았어요! 염소를 클릭해서 바위로 데려가세요!');
      DBG('[Phase3] 탈출 미니게임 클리어');
    }
  },

  _escapeTimerFail() {
    this._escapeMiniActive = false; this._escapeSphereClicked = 0;
    this.escapeSpheres.forEach(m => scene.remove(m)); this.escapeSpheres = [];
    toast('⚠️ 염소가 도망쳤어요! 다시 클릭해서 잡아주세요!');
    DBG('[Phase3] 탈출 미니게임 실패 — 재시도 가능');
  },

  _onRockClick() {
    if (!this._goatSelected) { toast('⚠️ 노란색 화살표가 가리키는 염소를 먼저 클릭하세요!'); return; }
    if (this.conditions.goatClimbed) return;
    this.conditions.goatClimbed = true;
    this.goatMesh.position.set(this.rockMesh.position.x, this.rockMesh.position.y + 0.55, this.rockMesh.position.z);
    this.goatMesh.traverse(c => { if (c.isMesh && c.material) c.material.emissiveIntensity = 0; });
    this._goatSelected = false;
    toast('🐐 염소가 바위 위로 올라갔어요!');
    DBG('[Phase3] goatClimbed = true');
    DBG('저기 먹구름이 몰려오고 있어요! 보스전 복선 발견');
    if (typeof showEcoPopup === 'function') showEcoPopup('🐐🪨', '염소가 바위에 올라<br>멀리 먹구름을 바라봐요!');
    this.check();
  },

  check() {
    const c = this.conditions;
    DBG('[Phase3] 조건 체크 — sheep:', c.sheepHealed, '| horse:', c.horseSpace, '| goat:', c.goatClimbed);
    Level1Manager.updateUI();
    if (c.sheepHealed && c.horseSpace && c.goatClimbed) {
      Level1Manager.phaseComplete[3] = true;
      checkLevel1Clear();
      DBG('🎉 페이즈 3 클리어!');
      setTimeout(() => { document.getElementById('mission-clear').style.display = 'block'; }, 600);
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QuestManager에 레벨 1 등록 (systems.js 로드 후 실행)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function registerLevel1() {
    if (typeof QuestManager !== 'undefined') {
        QuestManager.levels[1] = Level1Manager;
        DBG('[Level1Logic] QuestManager.levels[1] 등록 완료');
    } else {
        console.error('[Level1Logic] QuestManager를 찾을 수 없습니다! 로드 순서를 확인하세요.');
    }
})();
