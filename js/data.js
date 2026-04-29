// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  아이템 및 지형 데이터베이스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ITEM_DB = {
  pickaxe:    { category:'tool',     type:'pickaxe',  label:'곡괭이',       icon:'⛏️' },
  axe:        { category:'tool',     type:'axe',      label:'도끼',         icon:'🪓' },
  watering_can:{ category:'tool',    type:'watering', label:'물뿌리개',     icon:'🪣' },
  shovel:     { category:'tool',     type:'shovel',   label:'삽',           icon:'🪤' },

  seed_tomato:   { category:'seed', type:'seed', label:'토마토 씨앗',    icon:'🍅', grows:'tomato' },
  seed_basil:    { category:'seed', type:'seed', label:'바질 씨앗',      icon:'🌿', grows:'basil'  },
  seed_clover:   { category:'seed', type:'seed', label:'클로버 씨앗',    icon:'🍀', grows:'clover' },
  seed_sunflower:{ category:'seed', type:'seed', label:'해바라기 씨앗',  icon:'🌻', grows:'sunflower' },

  fallen_leaf:{ category:'resource', type:'resource', label:'낙엽', icon:'🍂' },

  dirt:      { category:'material', type:'block', label:'흙',        color:'#7a5c1e', hex:0x7a5c1e, solid:true },
  dirt_dry:  { category:'nature',   type:'block', label:'마른 흙',   color:'#9B7653', hex:0x9B7653, solid:true, dirtState:'dry'   },
  dirt_moist:{ category:'nature',   type:'block', label:'젖은 흙',   color:'#5C3D1A', hex:0x5C3D1A, solid:true, dirtState:'moist' },
  dirt_wet:  { category:'nature',   type:'block', label:'과습된 흙', color:'#3B2510', hex:0x3B2510, solid:true, dirtState:'wet'   },
  dirt_rich: { category:'nature',   type:'block', label:'영양토',    color:'#2C1810', hex:0x2C1810, solid:true, dirtState:'rich'  },

  grass:    { category:'material', type:'block', label:'풀',       color:'#4caf50', hex:0x4caf50, solid:true },
  straw:    { category:'material', type:'block', label:'볏짚',     color:'#ddc050', hex:0xddc050, solid:true },
  fence:    { category:'material', type:'block', label:'울타리',   color:'#8d6e3a', hex:0x8d6e3a, solid:true },
  stone:    { category:'material', type:'block', label:'돌',       color:'#888888', hex:0x888888, solid:true },

  t_low:   { category:'nature', type:'block', label:'얕은 풀밭', color:'#6aaa5a', hex:0x6aaa5a, solid:true },
  t_mid:   { category:'nature', type:'block', label:'깊은 풀밭', color:'#4a8a3a', hex:0x4a8a3a, solid:true },
  t_high:  { category:'nature', type:'block', label:'고산 풀밭', color:'#7a8e68', hex:0x7a8e68, solid:true },
  t_rock:  { category:'nature', type:'block', label:'산 바위',   color:'#9a8878', hex:0x9a8878, solid:true },
  t_dirt:  { category:'nature', type:'block', label:'자연 흙',   color:'#6b5040', hex:0x6b5040, solid:true },
  t_sub:   { category:'nature', type:'block', label:'지층 흙',   color:'#888880', hex:0x888880, solid:true },
  r_sand:  { category:'nature', type:'block', label:'강 모래',   color:'#c8b47a', hex:0xc8b47a, solid:true },
  r_gravel:{ category:'nature', type:'block', label:'강 자갈',   color:'#9a8868', hex:0x9a8868, solid:true },
  r_sub:   { category:'nature', type:'block', label:'강 진흙',   color:'#7a6850', hex:0x7a6850, solid:true },

  sprout:            { category:'plant', type:'block', label:'새싹',        color:'#90EE90', hex:0x90EE90, solid:false },
  plant_tomato:      { category:'plant', type:'block', label:'토마토',      color:'#228B22', hex:0x228B22, solid:false },
  plant_tomato_fruit:{ category:'plant', type:'block', label:'익은 토마토', color:'#FF6347', hex:0xFF6347, solid:false },
  plant_basil:       { category:'plant', type:'block', label:'바질',        color:'#006400', hex:0x006400, solid:false },
  plant_dead:        { category:'plant', type:'block', label:'죽은 식물',   color:'#2F2F2F', hex:0x2F2F2F, solid:false },
  toxic_plant:       { category:'plant', type:'block', label:'독성 식물',   color:'#FFFF00', hex:0xFFFF00, solid:false },

  lure:  { category:'kit', type:'action', label:'먹이(유도)', icon:'🌾' },
  heal:  { category:'kit', type:'action', label:'구급상자',   icon:'🩹' },
  carry: { category:'kit', type:'action', label:'안아주기',   icon:'👐' }
};

const TERRAIN_BLOCKS = {
  t_low:{hex:0x6aaa5a,solid:true}, t_mid:{hex:0x4a8a3a,solid:true},
  t_high:{hex:0x7a8e68,solid:true}, t_rock:{hex:0x9a8878,solid:true},
  t_dirt:{hex:0x6b5040,solid:true}, t_sub:{hex:0x888880,solid:true},
  r_sand:{hex:0xc8b47a,solid:true}, r_gravel:{hex:0x9a8868,solid:true}, r_sub:{hex:0x7a6850,solid:true}
};

const CHUNK=8, GH=60;
const WATER_LEVEL=30;

// 오프닝 스토리
const openingScenes = [
  { emoji:'🗺️', text:'낡은 상자 안에서 이상한 지도를 발견했어요.<br>지도 위로 빨간 경보등이 깜빡이고 있어요.', btn:'다음 →' },
  { emoji:'👵', text:'3일 전부터 마을이 이상해졌어.<br>양이 다쳤고, 벌집은 비어있고,<br>텃밭은 말라가고 있단다.', btn:'다음 →' },
  { emoji:'⭐', text:'마을 곳곳에 떠 있는 <span style="color:#FFD700;font-weight:bold">노란색 구슬(단서) 4개</span>를<br>직접 눌러서 무엇이 문제인지 조사해 보세요!', btn:'다음 →' },
  { emoji:'🌳', text:'초록 마을 한가운데 오래된 고목나무가<br>잎을 다 떨군 채 시들어가고 있어요.<br>힌트: 모든 생태계의 기초는 흙이에요.<br>단서를 찾아 뿌리부터 살려보세요!', btn:'탐험 시작하기 →' }
];
