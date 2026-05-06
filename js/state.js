// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UI 상태 및 전역 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let hotbar = [null, 'pickaxe', 'watering_can', 'shovel', 'seed_tomato', 'seed_basil', 'fallen_leaf', 'grass', 'straw'];
let activeSlot = 0;
let isInventoryOpen = false;
let currentRotation = 0;
let toolMode = 'none', selItem = null;

const gridData = {}, meshByKey = {}, animalData = [];
const chunkState = {}, chunkGroups = {};
const deletedBlocks = new Set();
let pickedAnimal = null;

let isOpeningActive = true;
let openingStep = 0;

let toastTimer;

let currentLevel = 1;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1: 초록 마을 — 페이즈 진행 상태
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 현재 진행 중인 레벨 1의 메인 페이즈 (0 ~ 4) */
let level_phase = 0;

/** Phase 0: 노란 구슬(단서) 수집 카운트 (목표: 4개) */
let yellow_orbs_collected = 0;

/** Phase 1: 독성 식물 제거 완료 여부 */
let toxic_plants_removed = false;

/** Phase 2: 동반식물 심기 & 물주기 상태 */
const companion_plants_status = {
  tomato: false,   // 토마토 씨앗 심기 완료
  basil: false,   // 바질 씨앗 심기 완료
  watered: false    // 물뿌리개로 물주기 완료
};

/** Phase 3: 낙엽 드래그 수집 카운트 (목표: 5개) */
let leaves_collected = 0;

/** Phase 4: 고목나무 상태 — "withered" → "bloomed" */
let tree_state = 'withered';

// --- 하위 호환: 기존 시스템이 참조하는 레거시 플래그 ---
// (systems.js / world.js 리팩터링 전까지 유지)
const phase2_conditions = { hiveFull: false, nestBuilt: false, treeBlooming: false };
const environment_flags = { riverTrashCount: 3, hasMud: false, birdHoleSize: 0, toxicPlantsRemoved: true };
const phase3_conditions = { sheepHealed: false, horseSpace: false, goatClimbed: false };
// -------------------------------------------------------

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2: 다양성의 숲 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level2_phase = 0; // 0 (시작) -> 1 (두꺼비 구출) -> 2 (격리 미션 진행) -> 3 (완료)
const level2_conditions = {
  bullfrogIsolated: false,
  toadRescued: false
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  수호대 영입 상태
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 레벨 1 & 2 수호대 최종 합류 여부.
 * systems.js의 조건 달성 시 true로 설정.
 */
const global_protectors = {
  bee: false,   // 레벨 1: 꿀벌 — 꽃 블록 3개 이상
  swallow: false,   // 레벨 1: 제비 — 진흙 웅덩이 + 처마 설치
  sheep: false,   // 레벨 1: 양   — 그늘(나무 개화) + 볏짚 설치
  otter: false,   // 레벨 2: 수달 — 강물 연결
  bat: false    // 레벨 2: 황금박쥐 — 동굴 빛 차단
};

/**
 * 레벨 전체 수호대 진행도.
 * 0: 미발견(흑백/물음표)  1: 발견(힌트 공개)
 * 2: 도움 진행 중         3: 합류 완료
 */
let guardianState = {
  sheep: 0, bee: 0, swallow: 0, otter: 0, bat: 0, fox: 0,
  eagle: 0, crane: 0, salmon: 0, raccoon: 0, kestrel: 0, bear: 0
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1 페이즈 관리 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 다음 페이즈로 이행한다.
 * UI/World/Systems 레이어가 수신할 커스텀 이벤트 "phaseAdvanced"를 발행한다.
 *
 * @param {number} [targetPhase] - 지정 시 해당 페이즈로 점프, 생략 시 +1 이행
 */
function advancePhase(targetPhase) {
  const prev = level_phase;
  level_phase = (targetPhase !== undefined) ? targetPhase : level_phase + 1;

  console.log(`[State] Phase ${prev} → ${level_phase}`);

  // 다른 모듈이 document 이벤트로 반응할 수 있도록 신호 발행
  document.dispatchEvent(new CustomEvent('phaseAdvanced', {
    detail: { prev, next: level_phase }
  }));
}

/**
 * 레벨 1 클리어 조건을 검사한다.
 * global_protectors 의 bee·swallow·sheep 이 모두 true 이면 클리어.
 *
 * @returns {boolean}
 */
function checkLevel1Clear() {
  const cleared = global_protectors.bee
    && global_protectors.swallow
    && global_protectors.sheep;

  if (cleared) {
    console.log('[State] 🎉 Level 1 Clear! 수호대 전원 합류 완료.');
    document.dispatchEvent(new CustomEvent('level1Cleared'));
  }

  return cleared;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THREE.js 객체를 위한 전역 변수 (main.js에서 초기화됨)
// scene, camera, renderer 등은 main.js에서 선언하지만 var를 쓰지 않는 이상 여기서 선언해야 할 수도 있습니다.
// 스크립트를 합칠 때 참조 에러를 막기 위해 구조를 그대로 유지합니다.
