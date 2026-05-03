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
  heal:  { category:'kit', type:'action', label:'구급상자',   icon:'🩹' }
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
  { emoji:'🌳', text:'마을 곳곳에 무언가 잘못된 흔적이 있어.<br>단서를 하나씩 조사해보자!', btn:'탐험 시작하기 →' }
];

// 수호대 도감 데이터
const GUARDIAN_DATA = {
  sheep: {
    id: 'sheep', name: '점박이 양', title: '구름을 잃어버린 겁쟁이', emoji: '🐑',
    story: '친구들은 모두 하얀 양털을 가졌는데, 몽실이는 털에 까만 점이 박혀있어 태양이 내리쬐면 점박이 무늬가 너무 뜨거워져요. 하늘의 구름이 땅으로 내려온 것 같은 "커다란 나무 그늘"을 찾아 헤매고 있어요.',
    personality: '겁이 많고 더위를 타면 털이 삐죽삐죽 솟아요.',
    hint: '고목나무를 살려 그늘을 만들어주고 볏짚으로 안내하세요.'
  },
  bee: {
    id: 'bee', name: '토종 꿀벌', title: '길 잃은 향기 배달부', emoji: '🐝',
    story: '부릉이의 등에는 꽃들에게 전해줄 "노란 꽃가루 편지"가 가득 들어있는 작은 배낭이 있어요. 마을에 꽃이 다 시들어버려서 편지를 전해줄 곳이 없어 쉬지 않고 날아다녀요.',
    personality: '콧노래를 부르지만, 꽃이 없으면 어지럼증을 느껴요.',
    hint: '클로버나 해바라기 같은 꽃가루가 있는 꽃을 심어주세요.'
  },
  swallow: {
    id: 'swallow', name: '봄을 알리는 제비', title: '집 없는 비행사', emoji: '🐦',
    story: '강을 따라 날아온 제비 짹짹이는 강물 위로 솟아오른 둥지를 지을 자리가 없어서 슬퍼요. 쓰레기가 가득한 강에서는 진흙을 구할 수 없거든요.',
    personality: '하늘을 나는 걸 좋아하지만, 잘 곳이 없으면 금방 지쳐요.',
    hint: '강의 쓰레기를 치워 진흙을 모으고 새집을 지어주세요.'
  },
  otter: {
    id: 'otter', name: '장난꾸러기 수달', title: '강물의 파수꾼', emoji: '🦦',
    story: '수달 보글이는 맑은 강물을 좋아하지만 지금 강은 너무 더러워요. 배가 고픈데 강에 물고기들이 보이지 않아 바위 위에 앉아 울고 있어요.',
    personality: '호기심이 많고 물장구치는 걸 좋아해요.',
    hint: '강을 깨끗하게 복원해서 수달이 살 곳을 만들어주세요.'
  },
  bat: {
    id: 'bat', name: '밤하늘의 박쥐', title: '동굴을 잃은 사냥꾼', emoji: '🦇',
    story: '숲의 해충을 잡아먹는 고마운 박쥐 깜깜이. 사람들이 동굴 입구를 막아버려서 낮에 잠을 잘 곳이 없어요.',
    personality: '눈이 부신 걸 싫어하고 어두운 곳을 편안해해요.',
    hint: '안전하고 어두운 숲의 틈새를 찾아 안식처를 만들어주세요.'
  },
  fox: {
    id: 'fox', name: '꾀돌이 붉은 여우', title: '숲속의 은둔자', emoji: '🦊',
    story: '여우 붉은꼬리는 숲이 베어지면서 몸을 숨길 덤불을 잃었어요. 무서운 들개들을 피해 안전하게 쉴 곳을 찾고 있어요.',
    personality: '경계심이 강하지만 은근히 사람의 온기를 좋아해요.',
    hint: '풍성한 덤불과 풀숲을 조성해 여우를 숨겨주세요.'
  },
  eagle: {
    id: 'eagle', name: '용감한 독수리', title: '하늘의 제왕', emoji: '🦅',
    story: '독수리 수리는 너무 높은 둥지에서 떨어져 날개를 다쳤어요. 튼튼한 나무 꼭대기에 다시 둥지를 틀고 싶어해요.',
    personality: '위풍당당하지만 다치면 매우 소심해져요.',
    hint: '안전한 높은 지대를 만들고 치료를 도와주세요.'
  },
  crane: {
    id: 'crane', name: '우아한 두루미', title: '춤추는 롱다리', emoji: '🦩',
    story: '두루미 뚜루는 깨끗한 습지에서 우아한 춤을 추고 싶지만, 물이 말라붙어 춤출 곳이 없어요.',
    personality: '아름다운 춤을 추는 걸 좋아하며 깔끔해요.',
    hint: '습지를 복원해 뚜루가 춤출 수 있는 공간을 주세요.'
  },
  salmon: {
    id: 'salmon', name: '힘찬 연어', title: '강물을 거스르는 자', emoji: '🐟',
    story: '알을 낳기 위해 강을 거슬러 올라온 연어 파닥이. 큰 댐에 막혀 고향으로 돌아가지 못하고 있어요.',
    personality: '포기를 모르는 끈기 있는 성격이에요.',
    hint: '연어가 올라갈 수 있는 어도를 만들어주세요.'
  },
  raccoon: {
    id: 'raccoon', name: '먹보 너구리', title: '밤의 숲 도둑', emoji: '🦝',
    story: '숲속 열매가 사라져 마을로 내려온 너구리 통통이. 배가 너무 고파서 쓰레기통을 뒤지다 길을 잃었어요.',
    personality: '먹을 것 앞에서는 앞뒤를 가리지 않아요.',
    hint: '숲에 과일나무를 심어 너구리의 식량을 마련해 주세요.'
  },
  kestrel: {
    id: 'kestrel', name: '매서운 황조롱이', title: '바람의 정령', emoji: '🦉',
    story: '도시의 빌딩 숲에서 길을 잃은 황조롱이 삐루. 쥐를 사냥할 넓은 들판이 사라져서 굶주리고 있어요.',
    personality: '날카로운 눈매를 가졌지만 사실 외로움을 많이 타요.',
    hint: '들판을 복원해서 삐루의 사냥터를 만들어주세요.'
  },
  bear: {
    id: 'bear', name: '느긋한 반달곰', title: '숲속의 듬직한 형님', emoji: '🐻',
    story: '밀렵꾼의 덫을 피해 도망치느라 지쳐버린 반달곰 웅이. 달콤한 꿀과 도토리를 먹고 깊은 잠을 잘 동굴이 필요해요.',
    personality: '느릿느릿하지만 화나면 아주 무서워요. 꿀을 아주 좋아해요.',
    hint: '꿀벌이 모은 꿀을 주고 따뜻한 쉼터를 찾아주세요.'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  바이옴(Biome) 지형 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BIOME_CONFIG = {
  green_village: {
    id: 'green_village',
    centerX: 0, centerZ: 0, radius: 40,
    baseHeight: 34, roughness: 1.0,
    surface: 't_dirt', subsurface: 't_sub',
    waterLevel: 30
  },
  diversity_forest: {
    id: 'diversity_forest',
    centerX: 80, centerZ: 0, radius: 30,
    baseHeight: 38, roughness: 1.5,
    surface: 't_mid', subsurface: 't_rock',
    waterLevel: 30
  },
  river_source: {
    id: 'river_source',
    centerX: 0, centerZ: 80, radius: 40,
    baseHeight: 28, roughness: 0.2,
    surface: 'r_sub', subsurface: 'r_gravel',
    waterLevel: 32
  },
  coral_reef: {
    id: 'coral_reef',
    centerX: 80, centerZ: 80, radius: 50,
    baseHeight: 15, roughness: 0.5,
    surface: 'r_sand', subsurface: 'stone',
    waterLevel: 30
  }
};
