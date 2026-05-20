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
//  레벨 2: 다양성의 숲 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level2_phase = 0; // 0 (시작) -> 1 (두꺼비 구출) -> 2 (격리 미션 진행) -> 3 (완료)
const level2_conditions = {
  bullfrogIsolated: false,
  toadRescued: false,
  waterDamPlaced: false,   // spawnLevel2WhiteBoxElements() 호출 후 true
  waterDamCells: []        // [{x, y, z}] — 실제 배치된 댐 블록 좌표 (Y 포함)
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 3: 연결의 평원 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level3_phase = 0; // 0 (시작) -> 1 (노루 구출) -> 2 (여우/독수리 미션) -> 3 (사막화 연출 & 퍼즐) -> 4 (완료)
const level3_conditions = {
  deerRescued: false,
  wildDogIsolated: false,
  foxFedCount: 0,
  carcassRemovedCount: 0,
  carcassCells: [],
  isDesertified: false,
  foodChainPuzzleSolved: false
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 4: 강의 근원지 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level4_phase = 0; // 0 (시작) -> 1 (쏘가리 구조 및 펜션 대화) -> 2 (연어/두루미 미션) -> 3 (100년 홍수 대비 및 방어) -> 4 (완료)
const level4_conditions = {
  soyaRescued: false,
  ownerConvinced: false,
  pollutionDeviceInstalled: false,
  cementDamRemovedCount: 0,
  cementDamCells: [], // [{x, y, z}] — 시멘트 보 블록 위치
  willowPlantedCount: 0,
  floodTimer: 60,
  isFlooding: false,
  floodDefenseScore: 0 // 홍수 방어 성공도 (0 ~ 100)
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 5: 경계 도시 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level5_phase = 0; // 0 (시작) -> 1 (너구리 구조) -> 2 (생태통로 건설/비오톱/공무원) -> 3 (심판 보스전) -> 4 (완료)
const level5_conditions = {
  raccoonRescued: false,
  officerConvinced: false,
  viaductConnected: false,
  tunnelBuilt: false,
  biotopePlacedCount: 0,
  biotopeCells: [],
  isAuditing: false,
  auditTimer: 30,
  auditScore: 0
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 6: 초록별 심장부 — 페이즈 및 상태 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let level6_phase = 0; // 0 (시작) -> 1 (기후 이상 정화/파견) -> 2 (반달곰 신뢰 쌓기) -> 3 (심장 박동 회복) -> 4 (엔딩) -> 5 (샌드박스)
const level6_conditions = {
  bridgeCutscenePlayed: false,
  craneDispatched: false,
  eagleDispatched: false,
  otterSalmonDispatched: false,
  craneSalmonDispatched: false,
  sheepDispatched: false,
  dispatchedCount: 0,
  bearEncountered: false,
  bearAcornFedCount: 0,
  heartBeatScore: 0,
  globalStabilized: false
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  수호대 영입 상태
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 레벨 1, 2, 3, 4, 5, 6 수호대 최종 합류 여부.
 * systems.js 및 각 레벨 Logic의 조건 달성 시 true로 설정.
 */
const global_protectors = {
  bee: false,   // 레벨 1: 꿀벌 — 꽃 블록 3개 이상
  swallow: false,   // 레벨 1: 제비 — 진흙 웅덩이 + 처마 설치
  sheep: false,   // 레벨 1: 양   — 그늘(나무 개화) + 볏짚 설치
  otter: false,   // 레벨 2: 수달 — 강물 연결
  bat: false,    // 레벨 2: 황금박쥐 — 동굴 빛 차단
  fox: false,    // 레벨 3: 붉은여우 — 먹이 주기 및 신뢰
  eagle: false,   // 레벨 3: 독수리 — 사체 제거
  crane: false,   // 레벨 4: 두루미 — 녹색 댐(나무 8그루)
  salmon: false,  // 레벨 4: 연어 — 오염 저감 장치 + 보 3개 제거
  raccoon: false, // 레벨 5: 너구리 — 생태 육교 연결
  kestrel: false, // 레벨 5: 황조롱이 — 비오톱 4개 설치
  bear: false     // 레벨 6: 반달곰 — 도토리 신뢰 3단계
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
  const prev = Level1Manager.currentPhase;
  if (targetPhase !== undefined) Level1Manager.currentPhase = targetPhase;

  DBG(`[State] Phase ${prev} → ${Level1Manager.currentPhase}`);

  document.dispatchEvent(new CustomEvent('phaseAdvanced', {
    detail: { prev, next: Level1Manager.currentPhase }
  }));
}

/**
 * 레벨 1 클리어 조건을 검사한다.
 * global_protectors 의 bee·swallow·sheep 이 모두 true 이면 클리어.
 *
 * @returns {boolean}
 */
function checkLevel1Clear() {
  const phase3Done = typeof Level1Manager !== 'undefined'
    && !!Level1Manager.phaseComplete[3];

  const cleared = global_protectors.bee
    && global_protectors.swallow
    && global_protectors.sheep
    && phase3Done;

  if (cleared) {
    DBG('[State] 🎉 Level 1 Clear! 수호대 전원 합류 완료.');
    document.dispatchEvent(new CustomEvent('level1Cleared'));
  }

  return cleared;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THREE.js 객체를 위한 전역 변수 (main.js에서 초기화됨)
// scene, camera, renderer 등은 main.js에서 선언하지만 var를 쓰지 않는 이상 여기서 선언해야 할 수도 있습니다.
// 스크립트를 합칠 때 참조 에러를 막기 위해 구조를 그대로 유지합니다.