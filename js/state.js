// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UI 상태 및 전역 변수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let hotbar = [null,'pickaxe','watering_can','shovel','seed_tomato','seed_basil','fallen_leaf','grass','straw'];
let activeSlot = 0;
let isInventoryOpen = false;
let currentRotation = 0;
let toolMode = 'none', selItem = null;

const gridData={}, meshByKey={}, animalData=[];
const chunkState={}, chunkGroups={};
const deletedBlocks=new Set();
let pickedAnimal=null;

let isOpeningActive = true;
let openingStep = 0;

let toastTimer;

// 페이즈 2 상태 (Phase2System에서 직접 참조)
const phase2_conditions = { hiveFull: false, nestBuilt: false, treeBlooming: false };
const environment_flags = { riverTrashCount: 3, hasMud: false, birdHoleSize: 0, toxicPlantsRemoved: true };
const phase3_conditions = { sheepHealed: false, horseSpace: false, goatClimbed: false };

// THREE.js 객체를 위한 전역 변수 (main.js에서 초기화됨)
// scene, camera, renderer 등은 main.js에서 선언하지만 var를 쓰지 않는 이상 여기서 선언해야 할 수도 있습니다.
// 스크립트를 합칠 때 참조 에러를 막기 위해 구조를 그대로 유지합니다.
