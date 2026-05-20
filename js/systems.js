// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  퀘스트 매니저 — 공통 인프라
//  각 레벨 파일(Level1Logic.js, Level2Logic.js …)이
//  자기 등록 패턴으로 levels[N]에 꽂힌다.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const QuestManager = {
  levels: {},
  getCurrentPhase() {
    return this.levels[currentLevel] ? this.levels[currentLevel].currentPhase : 0;
  },
  check() {
    if (this.levels[currentLevel]) this.levels[currentLevel].check();
  },
  updateUI() {
    if (this.levels[currentLevel]) this.levels[currentLevel].updateUI();
  },
  advance() {
    if (this.levels[currentLevel]) this.levels[currentLevel].advance();
  },
  onTreeChopped() {
    if (this.levels[currentLevel] && this.levels[currentLevel].onTreeChopped) {
      this.levels[currentLevel].onTreeChopped();
    }
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  수호대 도감 시스템
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GuardianSystem = {
  updateState(animalId, newState) {
    if (guardianState[animalId] < newState) {
      guardianState[animalId] = newState;
      const data = GUARDIAN_DATA[animalId];
      if (!data) return;

      if (newState === 1) toast(`📖 도감 업데이트: ${data.emoji} 누군가의 흔적을 발견했어요!`);
      else if (newState === 2) toast(`📖 도감 업데이트: ${data.emoji} ${data.name}을(를) 도왔어요!`);
      else if (newState === 3) {
        toast(`🎉 수호대 합류: ${data.emoji} ${data.name}이(가) 친구가 되었어요!`);
        if (typeof showEcoPopup === 'function') {
          showEcoPopup(data.emoji, `${data.name}이(가) 초록별 수호대에 합류했어요!`);
        }
      }

      if (typeof renderGuardianBook === 'function') renderGuardianBook();
    }
  },

  getJoinedCount() {
    return Object.values(guardianState).filter(state => state === 3).length;
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  수호대 조건 리스너 (state.js protectorConditions 기반)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 꿀벌 영입 조건 검사.
 * 맵에 꽃 블록(plant_clover / plant_sunflower)이 3개 이상이면 달성.
 */
function checkBeeCondition() {
  if (global_protectors.bee) return;
  const flowerTypes = protectorConditions.bee.conditions[0].blockTypes;
  const count = Object.values(gridData).filter(t => flowerTypes.includes(t)).length;
  DBG(`[Condition] 꿀벌 꽃 카운트: ${count}/3`);
  if (count >= protectorConditions.bee.conditions[0].minCount) {
    Phase2System._activateHive();
  }
}

/**
 * 제비 영입 조건 검사.
 * hasMud === true 이고 eave 블록이 1개 이상이면 달성.
 */
function checkSwallowCondition() {
  if (global_protectors.swallow) return;
  const mudOk = Phase2System.envFlags.hasMud;
  const eaveCnt = Object.values(gridData).filter(t => t === 'eave').length;
  DBG(`[Condition] 제비 — hasMud:${mudOk}, eave:${eaveCnt}`);
  if (mudOk && eaveCnt >= 1) {
    Phase2System._onNestZoneClick();
  }
}

/**
 * 양 영입 조건 검사.
 * OldTree.state === 'bloomed' 이고 straw 블록이 1개 이상이며 양이 치료됐으면 달성.
 */
function checkSheepCondition() {
  if (global_protectors.sheep) return;
  const treeOk = OldTree.state === 'bloomed' || Phase2System.conditions.treeBlooming;
  const sheepHealed = Phase3System.conditions.sheepHealed;
  DBG(`[Condition] 양 — treeBloomed:${treeOk}, healed:${sheepHealed}`);
  if (treeOk && sheepHealed) {
    global_protectors.sheep = true;
    if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('sheep', 3);
    DBG('[Condition] 🐑 양 영입 완료!');
    checkLevel1Clear();
  }
}

let _l2IsolationTimer = null;

function _scheduleIsolationCheck() {
  clearTimeout(_l2IsolationTimer);
  _l2IsolationTimer = setTimeout(() => {
    if (typeof Level2Logic !== 'undefined') Level2Logic.checkIsolationLoop();
  }, 500);
}

let _l3IsolationTimer = null;
function _scheduleL3IsolationCheck() {
  clearTimeout(_l3IsolationTimer);
  _l3IsolationTimer = setTimeout(() => {
    if (typeof Level3Logic !== 'undefined') Level3Logic.checkWildDogIsolation();
  }, 500);
}
// ────────────────────────────────────────────────────────

/**
 * 블록이 설치될 때마다 수호대 조건을 재검사한다.
 * world.js의 _place() 또는 SeedSystem.grow()에서 호출.
 *
 * @param {string} blockType - 설치된 블록 타입
 */
function onBlockPlaced(blockType) {
  if (typeof invalidateRayCache === 'function') invalidateRayCache();
  ArrowSystem.invalidate();
  // ── 레벨 1 조건 ──────────────────────────────────────
  const flowerTypes = protectorConditions.bee.conditions[0].blockTypes;
  if (flowerTypes.includes(blockType)) checkBeeCondition();
  if (blockType === 'eave') checkSwallowCondition();
  if (blockType === 'straw') checkSheepCondition();

  // ── 레벨 2 조건 ──────────────────────────────────────
  if (currentLevel === 2 && typeof Level2Logic !== 'undefined') {
    // 황소개구리 격리 연못: 흙·돌 블록을 쌓을 때만 검사 (연산 비용이 큼 → 디바운스)
    if (blockType === 'dirt' || blockType === 'stone' ||
      blockType.startsWith('t_') || blockType.startsWith('r_')) {
      _scheduleIsolationCheck();
    }
    // 수달 물길: 흙 블록을 파낸 결과로 물길이 이어지므로 설치 시에도 검사
    Level2Logic.checkWaterFlow();
    // 박쥐 동굴: 돌·흙 블록을 천장에 채울 때 검사
    if (blockType === 'stone' || blockType === 'dirt') {
      Level2Logic.checkCaveLightLevel();
    }
  }

  // ── 레벨 3 조건 ──────────────────────────────────────
  if (currentLevel === 3 && typeof Level3Logic !== 'undefined') {
    if (blockType === 'dirt' || blockType === 'stone' || blockType.startsWith('fence') || blockType === 'bush') {
      _scheduleL3IsolationCheck();
    }
  }
}

/**
 * 블록이 제거될 때마다 레벨 2 조건을 재검사한다.
 * world.js의 removeBlock()에서 호출.
 */
function onBlockRemoved(blockType) {
  if (typeof invalidateRayCache === 'function') invalidateRayCache();
  ArrowSystem.invalidate();
  
  if (currentLevel === 2 && typeof Level2Logic !== 'undefined') {
    // 격리 연못 벽이 허물어졌을 수도 있음 → 재검사
    if (blockType === 'dirt' || blockType === 'stone' ||
      blockType.startsWith('t_') || blockType.startsWith('r_')) {
      _scheduleIsolationCheck();
    }
    // 막힌 흙을 파내어 물길이 열렸을 수 있음
    Level2Logic.checkWaterFlow();
    // 동굴 천장 블록이 제거됐을 수 있음
    Level2Logic.checkCaveLightLevel();
  }

  // ── 레벨 3 조건 ──────────────────────────────────────
  if (currentLevel === 3 && typeof Level3Logic !== 'undefined') {
    if (blockType === 'carcass') {
      Level3Logic.checkCarcassRemoved();
    }
    if (blockType === 'dirt' || blockType === 'stone' || blockType.startsWith('fence') || blockType === 'bush') {
      _scheduleL3IsolationCheck();
    }
  }
}
