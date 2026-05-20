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
  carcass:           { category:'plant', type:'block', label:'동물 사체',   color:'#7D5C50', hex:0x7D5C50, solid:false, icon:'🍖' },
  
  lure:  { category:'kit', type:'action', label:'먹이(유도)', icon:'🌾' },
  heal:  { category:'kit', type:'action', label:'구급상자',   icon:'🩹' },
  low_pollution:     { category:'kit', type:'action', label:'오염 저감 장치', icon:'⚙️' },
  cement_dam:        { category:'material', type:'block', label:'시멘트 보', color:'#a0a0a0', hex:0xa0a0a0, solid:true, icon:'🧱' },
  willow:            { category:'material', type:'block', label:'버드나무', color:'#3c633a', hex:0x3c633a, solid:true, icon:'🌳' }
};

const TERRAIN_BLOCKS = {
  t_low:{hex:0x6aaa5a,solid:true}, t_mid:{hex:0x4a8a3a,solid:true},
  t_high:{hex:0x7a8e68,solid:true}, t_rock:{hex:0x9a8878,solid:true},
  t_dirt:{hex:0x6b5040,solid:true}, t_sub:{hex:0x888880,solid:true},
  r_sand:{hex:0xc8b47a,solid:true}, r_gravel:{hex:0x9a8868,solid:true}, r_sub:{hex:0x7a6850,solid:true},
  carcass:{hex:0x7D5C50,solid:false}, cement_dam:{hex:0xa0a0a0,solid:true}, willow:{hex:0x3c633a,solid:true}
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
    baseHeight: 34, roughness: 0.25,
    surface: 't_dirt', subsurface: 't_sub',
    waterLevel: 30
  },
  diversity_forest: {
    id: 'diversity_forest',
    centerX: 80, centerZ: 0, radius: 30,
    baseHeight: 35, roughness: 0.30,
    surface: 't_mid', subsurface: 't_rock',
    waterLevel: 30
  },
  river_source: {
    id: 'river_source',
    centerX: 0, centerZ: 80, radius: 40,
    baseHeight: 33, roughness: 0.12,
    surface: 'r_sub', subsurface: 'r_gravel',
    waterLevel: 30
  },
  coastal_shore: {
    id: 'coastal_shore',
    centerX: 80, centerZ: 80, radius: 50,
    baseHeight: 32, roughness: 0.18,
    surface: 'r_sand', subsurface: 'stone',
    waterLevel: 30
  },
  connection_plains: {
    id: 'connection_plains',
    centerX: -80, centerZ: 0, radius: 40,
    baseHeight: 33, roughness: 0.15,
    surface: 't_low', subsurface: 't_dirt',
    waterLevel: 30
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 1 NPC 대사 데이터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * 페이즈별 할머니(및 기타) NPC 대사.
 * ui.js 의 showNpcDialogue(phaseKey) 에서 참조한다.
 *
 * 구조: { [phaseKey]: { speaker, lines: string[] } }
 */
const npcDialogues = {
  phase0_intro: {
    speaker: '할머니',
    lines: [
      '모든 게 연결되어 있단다.',
      '마을에 노란 구슬 4개가 떠다니고 있어. 하나씩 눌러서 무엇이 문제인지 조사해 보렴.'
    ]
  },
  phase0_orb1: {
    speaker: '할머니',
    lines: [
      '아이고, 텃밭을 봤니? 독성 식물이 토마토 옆까지 뻗어버렸어.',
      '삽으로 뽑아내야 다른 식물들이 살 수 있단다.'
    ]
  },
  phase0_orb2: {
    speaker: '할머니',
    lines: [
      '벌집이 텅 비었구나.',
      '꿀벌은 꽃가루가 있어야 살 수 있는데, 마을에 꽃이 없으니 떠나버렸겠지.'
    ]
  },
  phase0_orb3: {
    speaker: '할머니',
    lines: [
      '저 고목나무 좀 봐. 잎사귀가 하나도 없어.',
      '낙엽을 모아서 뿌리에 덮어주면 지렁이들이 흙을 살려줄 거야.'
    ]
  },
  phase0_orb4: {
    speaker: '할머니',
    lines: [
      '제비가 집을 못 짓고 있어.',
      '강이 더러워서 진흙을 구할 수 없거든. 우선 강을 정리해야 해.'
    ]
  },
  phase0_complete: {
    speaker: '할머니',
    lines: [
      '단서 4개를 모두 찾았구나!',
      '이제 무엇부터 해야 할지 알겠니? 먼저 독성 식물을 삽으로 제거해 보자.'
    ]
  },
  phase1_start: {
    speaker: '할머니',
    lines: [
      '저기 노란 독성 식물이 보이지? 삽을 들고 클릭해서 뽑아내 보렴.'
    ]
  },
  phase1_complete: {
    speaker: '할머니',
    lines: [
      '잘했어! 이제 텃밭이 숨을 쉴 수 있겠구나.',
      '다음은 동반식물을 심어서 서로 도와가며 자라게 해야 해.'
    ]
  },
  phase2_start: {
    speaker: '할머니',
    lines: [
      '토마토와 바질은 서로 좋은 친구란다.',
      '물뿌리개로 물을 주고, 씨앗을 심어보렴. 순서가 중요해!'
    ]
  },
  phase2_complete: {
    speaker: '할머니',
    lines: [
      '무당벌레가 나타났어! 진딧물을 잡아줄 거야.',
      '동반식물 덕분에 텃밭에 활기가 돌기 시작했네.'
    ]
  },
  phase3_start: {
    speaker: '할머니',
    lines: [
      '고목나무 주변에 낙엽이 떨어져 있어.',
      '낙엽 5장을 주워서 고목나무 밑동의 흙에 가져다 놓아 보렴.'
    ]
  },
  phase3_complete: {
    speaker: '할머니',
    lines: [
      '지렁이들이 꼼지락거리기 시작했어! 흙을 비옥하게 만들어줄 거야.',
      '이제 나무가 회복될 준비가 된 것 같구나.'
    ]
  },
  phase4_bloom: {
    speaker: '할머니',
    lines: [
      '오! 고목나무에 잎사귀가 돋아나고 있어!',
      '모든 게 연결되어 있단다 — 흙, 벌레, 식물, 동물… 다 하나란다.'
    ]
  },
  level1_clear: {
    speaker: '할머니',
    lines: [
      '꿀벌, 제비, 양 — 수호대가 모두 돌아왔어!',
      '초록 마을이 다시 살아났구나. 정말 고마워, 용감한 탐험가야.'
    ]
  },
  l3_intro: {
    speaker: '할머니',
    lines: [
      '여기가 바로 연결의 평원이란다. 한때는 무성한 풀밭이었지만, 지금은 사막처럼 굳어버렸어.',
      '도로 위에 다리를 다친 어린 노루 초롱이가 쓰러져 있단다. 먼저 노루를 안전한 풀밭으로 옮기고 치료해 주자!'
    ]
  },
  l3_deer_healed: {
    speaker: '할머니',
    lines: [
      '초롱이가 기운을 차렸구나! 다행이야.',
      '하지만 평원이 사막이 된 진짜 원인을 해결해야 해. 들개 무리가 평원에 들어와 생태계 균형을 흔들고 있어.',
      '들개들이 초식동물들을 위협하지 않게 영역을 분리해주고, 붉은여우의 신뢰를 얻어 포식자 균형을 맞춰야 한단다.',
      '그리고 들판에 썩어가고 있는 사체 블록들을 정화해야 하늘의 청소부 독수리가 다시 찾아올 거야.'
    ]
  },
  l3_fox_join: {
    speaker: '할머니',
    lines: [
      '여우 붉은꼬리가 은신처와 먹이를 준 너를 믿기 시작했어! 수호대로 합류하겠다고 하는구나.',
      '포식자가 돌아왔으니 평원의 초식동물 번식을 조절할 수 있을 게다.'
    ]
  },
  l3_eagle_join: {
    speaker: '할머니',
    lines: [
      '사체를 치우니 평원이 정화되어 독수리 수리가 날아왔어! 하늘의 수호대가 합류했단다.'
    ]
  },
  l3_simulation: {
    speaker: '할머니',
    lines: [
      '오, 평원의 빛이 변하고 있어! 이것이 포식자가 가져다주는 평화란다.',
      '이제 이 평원이 오랫동안 유지될 수 있도록 먹이사슬 퍼즐을 맞춰야 해. 준비가 되었니?'
    ]
  },
  l3_clear: {
    speaker: '할머니',
    lines: [
      '대단해! 먹이사슬의 고리가 다시 단단하게 연결되었구나.',
      '수호대 붉은여우와 독수리가 힘을 보태주니 평원이 눈부신 녹색으로 변했단다. 정말 고마워!'
    ]
  },
  l4_intro: {
    speaker: '할머니',
    lines: [
      '여기는 강의 근원지란다. 상류에서 내려오는 맑은 물이 숲과 바다를 잇는 젖줄이지.',
      '하지만 상류에 무허가 펜션이 들어서면서 강물이 오염되고 시멘트 보가 물길을 가로막고 있어.',
      '그리고 쓰레기 댐에 갇혀 옴짝달싹 못 하는 어린 쏘가리 쏘야가 강바닥에 갇혀 있단다. 쓰레기 블록들을 부수어 쏘야를 구해 주렴!'
    ]
  },
  l4_soya_rescued: {
    speaker: '할머니',
    lines: [
      '쏘야가 자유롭게 넓은 강으로 헤엄쳐 갔어! 정말 고맙다.',
      '이제 연어와 두루미를 영입할 차례야.',
      '상류의 펜션 주인 박씨를 설득해 오염 저감 장치를 설치하고, 강을 가로막는 시멘트 보 3개를 모두 파괴하면 연어가 고향으로 돌아올 거야.',
      '또한, 산비탈에 버드나무를 8그루 이상 심어 녹색 댐을 만들고 얕은 습지를 정화하면 두루미가 다시 날아올 거란다.'
    ]
  },
  l4_salmon_join: {
    speaker: '할머니',
    lines: [
      '연어 파닥이가 물길을 거슬러 드디어 상류로 올라왔어! 물의 수호대가 합류했단다.'
    ]
  },
  l4_crane_join: {
    speaker: '할머니',
    lines: [
      '녹색 댐이 물을 정화하자 두루미 뚜루가 얕은 습지에 고고하게 내려앉았구나! 수호대가 합류했단다.'
    ]
  },
  l4_flood_warning: {
    speaker: '할머니',
    lines: [
      '큰일이야! 갑작스러운 폭우로 100년 만의 대홍수가 몰려오고 있어. 60초 후에 홍수가 들이닥칠 게다!',
      '두루미를 호출하면 폭우 전선을 예보받을 수 있고, 수달을 호출하면 넘치기 직전인 둑의 약한 부분이 파랗게 표시된단다.',
      '비가 내리는 동안 약한 강둑을 흙이나 돌로 신속하게 보강하고, 산비탈에 나무를 더 많이 심어 범람을 막아보렴!'
    ]
  },
  l4_clear: {
    speaker: '할머니',
    lines: [
      '해냈어! 녹색 댐의 울창한 숲과 튼튼히 보강한 둑 덕분에 거센 홍수를 한 줌의 피해도 없이 안전하게 이겨냈구나.',
      '수호대 두루미와 연어가 물과 숲의 순환 고리를 굳건히 지켜냈어. 정말 대단하구나!'
    ]
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  도감 카드 데이터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * 생태계 정보 팝업 카드.
 * ui.js 의 showEncyclopediaCard(cardId) 에서 참조한다.
 *
 * 구조: { [cardId]: { title, icon, body, tip, triggerPhase } }
 */
const encyclopediaCards = {
  ancient_tree: {
    title: '고목나무',
    icon: '🌳',
    body: '수백 년을 살아온 고목나무는 그 뿌리로 주변 생물을 먹여살립니다. 잎이 지면 낙엽이 쌓여 흙 속 미생물과 지렁이의 먹이가 됩니다.',
    tip: '낙엽을 뿌리 주변에 모아주면 지렁이가 흙을 비옥하게 만들어요!',
    triggerPhase: 3
  },
  earthworm: {
    title: '지렁이',
    icon: '🪱',
    body: '지렁이는 흙을 먹고 배설하면서 영양분을 만들어냅니다. 지렁이가 지나간 흙은 식물이 훨씬 잘 자랍니다.',
    tip: '지렁이가 없으면 고목나무도 살 수 없어요. 낙엽으로 지렁이를 불러오세요.',
    triggerPhase: 3
  },
  honeybee: {
    title: '토종 꿀벌',
    icon: '🐝',
    body: '꿀벌은 꽃가루를 옮겨 식물이 열매를 맺도록 돕습니다. 꿀벌이 없으면 사과, 딸기, 토마토도 열리지 않습니다.',
    tip: '클로버나 해바라기 같은 꽃을 3개 이상 심으면 꿀벌이 찾아와요!',
    triggerPhase: 0
  },
  swallow: {
    title: '제비',
    icon: '🐦',
    body: '제비는 진흙으로 처마 아래에 둥지를 짓습니다. 강물이 깨끗해야 진흙을 구할 수 있고, 처마가 있어야 안전하게 살 수 있습니다.',
    tip: '강 쓰레기 3개를 치우면 진흙 웅덩이가 생겨요. 그런 다음 처마를 설치하세요.',
    triggerPhase: 0
  },
  companion_plant: {
    title: '동반식물',
    icon: '🌿',
    body: '서로 옆에 심으면 잘 자라는 식물 조합이 있습니다. 토마토 + 바질은 대표적인 동반 관계로, 바질 향이 해충을 쫓아냅니다.',
    tip: '물뿌리개 → 토마토 → 바질 순서로 상호작용하면 무당벌레가 나타나요!',
    triggerPhase: 2
  },
  toxic_plant: {
    title: '독성 식물',
    icon: '☠️',
    body: '외래 유입종인 독성 식물은 빠르게 번식하며 주변 토종 식물의 영양분과 햇빛을 빼앗습니다. 방치하면 텃밭 전체가 죽을 수 있습니다.',
    tip: '삽으로 독성 식물을 제거해야 텃밭이 살아납니다.',
    triggerPhase: 1
  },
  ladybug: {
    title: '무당벌레',
    icon: '🐞',
    body: '무당벌레는 진딧물을 잡아먹는 자연의 해충 방제사입니다. 농약 없이 텃밭을 지켜주는 고마운 친구예요.',
    tip: '동반식물을 심으면 무당벌레가 자연스럽게 찾아와요.',
    triggerPhase: 2
  },
  red_fox: {
    title: '붉은여우',
    icon: '🦊',
    body: '붉은여우는 소형 동물을 사냥해 초식동물의 지나친 번식을 억제합니다. 관목과 덤불에 은신하는 것을 좋아합니다.',
    tip: '들개를 피해 숨을 수 있는 관목 블록을 심고 먹이로 신뢰를 얻으세요.',
    triggerPhase: 2
  },
  golden_eagle: {
    title: '독수리',
    icon: '🦅',
    body: '독수리는 동물의 사체를 먹어 치우는 하늘의 청소부입니다. 질병의 전파를 막아 초원을 건강하게 유지해 줍니다.',
    tip: '평원 곳곳의 사체 블록을 제거하면 평원이 정화되어 독수리가 찾아와요.',
    triggerPhase: 2
  },
  food_chain: {
    title: '먹이사슬',
    icon: '🕸️',
    body: '생태계의 생물들은 먹고 먹히는 관계로 연결되어 있습니다. 생산자(식물)부터 시작해 최상위 포식자에 이르기까지 하나의 사슬을 이룹니다.',
    tip: '올바른 먹이사슬 순서(생산자 → 1차소비자 → 2차소비자 → 최상위포식자)로 퍼즐 타워를 완성하세요.',
    triggerPhase: 3
  },
  crane: {
    title: '두루미',
    icon: '🦩',
    body: '두루미는 매우 희귀한 철새로 물이 얕고 깨끗한 습지나 논밭에서 살아갑니다. 습지의 훼손으로 서식지가 점차 사라지고 있습니다.',
    tip: '산비탈에 버드나무를 많이 심어 맑은 정화 습지를 만들어주면 두루미가 찾아와요.',
    triggerPhase: 2
  },
  salmon: {
    title: '남대천 연어',
    icon: '🐟',
    body: '연어는 바다에서 성장한 후 자신이 태어난 모천(어미 강)으로 돌아와 산란합니다. 콘크리트 보나 댐이 강을 가로막으면 돌아올 수 없습니다.',
    tip: '시멘트 보 3개를 제거하고 펜션 오염을 막아 연어가 거슬러 올라올 수 있게 하세요.',
    triggerPhase: 2
  },
  green_dam: {
    title: '녹색 댐',
    icon: '🌲',
    body: '숲의 나무들은 빗물을 스펀지처럼 흡수했다가 서서히 흘려보내 홍수와 가뭄을 예방합니다. 흙을 웅켜쥐어 산사태도 예방하지요.',
    tip: '버드나무를 심어 녹색 댐을 만들어 100년 홍수로부터 마을을 구하세요.',
    triggerPhase: 3
  },
  mandarin_fish: {
    title: '쏘가리',
    icon: '🐠',
    body: '쏘가리는 물의 흐름이 빠르고 자갈이 많은 깨끗한 강 상류에 사는 한국 고유종입니다. 쓰레기 더미에 막히면 생명이 위험해집니다.',
    tip: '강바닥을 막고 있는 쓰레기 블록들을 모두 파괴하여 쏘야를 구출하세요.',
    triggerPhase: 1
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  수호대 영입 조건 메타데이터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * 각 수호대 동물의 영입 달성 조건.
 * systems.js 의 checkBeeCondition() 등 조건 리스너가 이 데이터를 참조한다.
 *
 * 구조: {
 *   [animalId]: {
 *     label,          // 수호대 이름
 *     emoji,          // 아이콘
 *     conditions: [   // 달성해야 할 조건 목록
 *       { id, description, blockType?, minCount?, flag? }
 *     ],
 *     rewardScene,    // world.js 에서 호출할 연출 함수명
 *     encyclopediaId  // 관련 도감 카드 ID
 *   }
 * }
 */
const protectorConditions = {
  bee: {
    label: '토종 꿀벌',
    emoji: '🐝',
    conditions: [
      {
        id: 'flower_count',
        description: '꽃 블록(clover 또는 sunflower)을 3개 이상 설치',
        blockTypes: ['plant_clover', 'plant_sunflower'],
        minCount: 3
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'honeybee'
  },
  swallow: {
    label: '봄을 알리는 제비',
    emoji: '🐦',
    conditions: [
      {
        id: 'mud_puddle',
        description: '강 쓰레기 3개를 제거하여 진흙 웅덩이 생성',
        flag: 'hasMud'
      },
      {
        id: 'eave_installed',
        description: '처마(eave) 블록을 지붕 아래에 설치',
        blockTypes: ['eave'],
        minCount: 1
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'swallow'
  },
  sheep: {
    label: '점박이 양',
    emoji: '🐑',
    conditions: [
      {
        id: 'tree_bloomed',
        description: '고목나무를 개화시켜 그늘 블록 생성',
        flag: 'treeBlooming'
      },
      {
        id: 'straw_placed',
        description: '볏짚(straw) 블록을 그늘 범위 안에 1개 이상 설치',
        blockTypes: ['straw'],
        minCount: 1,
        requiresShade: true
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'ancient_tree'
  },
  fox: {
    label: '꾀돌이 붉은 여우',
    emoji: '🦊',
    conditions: [
      {
        id: 'wild_dog_isolated',
        description: '들개 구역과 평원을 분리하기 위해 울타리/관목 3개 이상 설치',
        flag: 'wildDogIsolated'
      },
      {
        id: 'fox_fed',
        description: '여우에게 먹이(lure)를 3번 던져주어 신뢰 쌓기',
        flag: 'foxFedCount'
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'red_fox'
  },
  eagle: {
    label: '용감한 독수리',
    emoji: '🦅',
    conditions: [
      {
        id: 'carcass_removed',
        description: '평원에 흩어진 동물 사체 블록 3개 모두 정화',
        flag: 'carcassRemovedCount'
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'golden_eagle'
  },
  crane: {
    label: '우아한 두루미',
    emoji: '🦩',
    conditions: [
      {
        id: 'willow_count',
        description: '산비탈에 버드나무(willow) 블록 8개 이상 설치',
        blockTypes: ['willow'],
        minCount: 8
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'crane'
  },
  salmon: {
    label: '힘찬 연어',
    emoji: '🐟',
    conditions: [
      {
        id: 'pollution_device',
        description: '펜션 오염 배출구에 오염 저감 장치 설치 완료',
        flag: 'pollutionDeviceInstalled'
      },
      {
        id: 'cement_dam_removed',
        description: '강물의 시멘트 보(cement_dam) 블록 3개 모두 제거',
        flag: 'cementDamRemovedCount'
      }
    ],
    rewardScene: 'playProtectorJoinEffect',
    encyclopediaId: 'salmon'
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2 공통 상수 (단일 정의 — 모든 파일에서 참조)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LEVEL2_ANIMAL_TYPES = ['bullfrog', 'toad', 'otter', 'bat'];
const LEVEL2_COLORS = { bullfrog: 0xFF2222, toad: 0xFF00FF, otter: 0x0044FF, bat: 0x800080 };

// 영입 전 안기 불가 수호대 동물 (미션상 carry가 필요한 sheep은 제외)
const NO_CARRY_BEFORE_RECRUIT = new Set(['bee', 'swallow', 'otter', 'bat', 'fox', 'eagle', 'crane', 'salmon', 'raccoon', 'kestrel', 'bear']);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  디버그 헬퍼 — 프로덕션에서 console.log 비용 제거
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DEBUG = (location.hostname === 'localhost' || location.search.includes('debug=1'));
function DBG(...args) { if (DEBUG) console.log(...args); }
