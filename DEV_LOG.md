# 🐾 애니멀 어드벤처: 개발 일지 (Dev Log)

이 문서는 AI(Antigravity)와 사용자 간의 논의 및 코드 변경 사항을 날짜와 주제별로 누적 기록하는 개발 일지입니다.
과거에 어떤 문제들이 있었고, 어떤 구조적 결정을 내렸는지 되짚어볼 때 유용하게 사용할 수 있습니다.

---

## 📅 2026-04-29 (Phase 1 시스템 고도화 및 최적화)

### 1. 거대 단일 파일(Monolithic) 분리 및 모듈화 아키텍처 도입
**[배경]**
* 약 2,000줄에 달하는 모든 게임 로직(HTML, CSS, Three.js 로직)이 `index.html` 파일 하나에 몰려있었습니다.
* 바이브 코딩으로 생성된 기존 코드에 레벨 6까지 시나리오를 확장하려면 유지보수가 불가능에 가깝다고 판단했습니다.

**[작업 내용]**
* 기능과 주제에 맞게 코드를 6개의 핵심 자바스크립트 모듈로 분리했습니다.
  * `css/style.css` (UI 스타일)
  * `js/data.js` (정적 데이터 및 상수)
  * `js/state.js` (전역 변수)
  * `js/systems.js` (퀘스트 및 상호작용 시스템)
  * `js/world.js` (지형 생성 및 동물 AI)
  * `js/ui.js` (인터페이스 조작)
  * `js/main.js` (Three.js 메인 엔진)
* **결과:** 각 파일이 역할별로 나뉘어 향후 새로운 퀘스트나 동물을 추가할 때 한 파일만 수정하면 되도록 뼈대를 완성했습니다.

---

### 2. 레벨 1 시나리오 완벽 동기화 (독성 식물 제거 조건)
**[배경]**
* `Scenario/AA - level 1.md` 문서를 검토한 결과, 코드 구현율이 95% 이상으로 훌륭했으나 한 가지 빠진 조건이 있었습니다.
* 기획서에는 "독성 식물 제거"가 페이즈 1 클리어를 위한 선행 조건이었으나, 코드에서는 제거하지 않아도 다음 페이즈로 넘어가는 오류가 있었습니다.

**[작업 내용]**
* `js/systems.js` 내의 `QuestManager.checkPhase1()` 함수를 수정하여, **독성 식물 3개를 모두 제거(`toxicRemoved`)해야만 페이즈 1이 클리어**되도록 최종 조건을 강화했습니다.
* 화면 상단 미션 상태바 UI에도 해당 항목을 추가했습니다.

---

### 3. 심각한 프레임 렉(FPS Drop) 현상 원인 규명 및 렌더링 최적화
**[배경]**
* 깃허브 링크를 통해 게임을 실행했을 때, 화면 시점 전환과 줌인/아웃이 얼음장처럼 느리고 버벅거리는 현상이 보고되었습니다.
* 초기에는 단순한 마우스 감도(Sensitivity)나 해상도 문제로 접근했으나, FPS 모니터링 결과 **6~10 FPS**라는 심각한 연산 부하가 발생하고 있음을 확인했습니다.

**[원인 규명]**
* 기존의 지형(Chunk) 생성 로직이 산이나 땅을 만들 때 표면만 렌더링하는 것이 아니라, 바닥(y=0)부터 꼭대기(y=50)까지 꽉꽉 채워 **약 3만 개의 투명도를 가진 큐브**를 무식하게 생성하고 있었습니다.
* 3만 개의 큐브가 각각 모서리 선(Edge)과 그림자(Shadow) 연산을 수행하므로 그래픽 카드가 버틸 수 없었습니다.

**[작업 내용 (최적화 대수술)]**
1. **Hidden Block Culling (숨겨진 블록 제거):** `js/world.js`의 `bldActive` 함수를 수정하여, 상하좌우를 수학적으로 계산한 뒤 **유저 눈에 보이는 지표면(껍데기) 블록만 렌더링**하도록 변경했습니다. (3만 개 → 약 1~2천 개 수준으로 90% 이상 렌더링 객체 감소)
2. **동적 블록 노출 (Reveal on Dig):** 유저가 삽으로 땅을 파서 빈 공간이 생겼을 때, 삭제된 블록 밑과 옆에 숨겨져 있던 흙 블록들을 실시간으로 그려주도록 `removeBlock` 로직을 수정했습니다.
3. **프레임 측정기 추가:** 향후 비슷한 성능 이슈를 모니터링하기 위해 `Stats.js` 라이브러리를 추가하여 좌측 하단에 FPS가 표시되도록 했습니다.

**[결과]**
* 지형 렌더링 연산량이 극단적으로 줄어들어, 이제 어떤 기기에서 깃허브 링크로 접속하더라도 60 FPS의 쾌적하고 부드러운 화면 전환이 가능해졌습니다.

---

### 4. 아동(7~8세) 타겟 교육적 UX/UI 전면 개편
**[배경]**
* 기능적으로 게임은 완성되었으나, 유치원생 및 초등학교 저학년 아이들이 "어떤 도구를 언제 써야 하는지", "왜 이 행동을 해야 하는지(생태계 교육)" 직관적으로 이해하기 어려운 점이 발견되었습니다.

**[작업 내용]**
1. **교육적 퀘스트 텍스트:** 딱딱한 지시어("독성 식물 제거")를 아이들의 눈높이에 맞추어 "🌼 나쁜 노란 꽃 뽑기 (동물 보호)" 등 생태계 목표를 함께 표기하도록 변경했습니다.
2. **시각적 내비게이션:**
   * 목표물(노란 꽃, 물 줄 텃밭 등) 머리 위에 3D 화살표(⬇️)가 둥둥 떠서 위치를 안내하도록 `ArrowSystem`을 추가했습니다. (`js/systems.js`)
   * 지금 상황에 꼭 필요한 도구(삽, 물뿌리개 등)가 인벤토리 창에서 황금색으로 반짝(Glow)거리도록 유도합니다. (`slot-glowing` 클래스, `js/ui.js`)
3. **생태계 팝업(Eco Popup):** 미션을 클리어할 때마다 화면 중앙에 `[🍂🪱] 지렁이가 낙엽을 먹고 딱딱한 흙을 숨 쉬게 만들었어요!` 처럼 생태계 인과관계를 이모지와 함께 팝업으로 띄워 학습 효과를 극대화했습니다. (`showEcoPopup()`, `js/ui.js`)

---

### 5. 단서 탐색(Phase 0) 클릭 버그 수정 및 가시성 개선
**[배경]**
* 오프닝 씬 직후 4개의 노란색 단서 구슬을 눌러야 하지만, 빛(Halo) 이펙트가 마우스 클릭을 방해하여 클릭이 작동하지 않았고, 나무 단서 구슬이 고목나무 내부에 겹쳐 생성되어 보이지 않았습니다.

**[작업 내용]**
1. **클릭 판정 수정:** 구슬을 둘러싼 빛(Halo) 효과에도 클릭(Raycast) 판정을 부여하여 튕겨내지 않도록 수정했습니다. (`halo.userData = { isClue: true, ... }`)
2. **나무 단서 구슬 위치 조정:** 고목나무(`x:8, z:8`) 중앙에 겹쳐있던 단서를 `yOffset=3.5`로 나무 위에 띄웠습니다. (이후 2026-04-30에 yOffset=6으로 재조정 — 아래 항목 참고)
3. **오프닝 스토리 안내 추가:** 오프닝 텍스트 3번째 장에 "노란색 구슬(단서) 4개를 직접 눌러서 조사해 보세요!" 라는 명확한 행동 지침을 추가했습니다. (`js/data.js` `openingScenes`)

---

### 6. 레벨 1 동물 배치 및 말·염소 AI 구현
**[배경]**
* 레벨 1 시작 시 플레이어가 즉시 동물들을 발견할 수 있도록 고정 위치 배치가 필요했습니다.
* 기존에는 양(sheep)과 물고기(fish)만 AI가 있었고, 말과 염소는 움직이지 않았습니다.

**[작업 내용]**
* **`spawnLevelAnimals()` 추가 (`js/world.js`):** 레벨 시작 시 양(부상 1마리 포함) 3마리, 말 1마리, 염소 1마리를 지정 좌표에 자동 배치합니다.
* **`updateHorse()` AI 구현:** 앞길에 울타리 없이 8칸 이상 열린 공간이 있을 때 직진하고, 막히면 방향을 전환합니다.
* **`updateGoat()` AI 구현:** 30초마다 랜덤 방향으로 탈출을 시도합니다. 울타리로 막히지 않은 위치라면 실제로 이동하며 토스트 메시지(`🐐 염소가 탈출했어요!`)를 출력합니다.

---

## 📅 2026-04-30 (Phase 1 시뮬레이션 버그 픽스 및 시스템 안정화)

### 1. 맨손 도구 도입 및 행위 위계(Action Hierarchy) 재설계
**[배경]**
* 기존에는 인벤토리에서 빈 슬롯을 선택하면 아무 동작도 하지 않는 평면적인 구조였고, 동물 안아주기(Carry)를 위해서는 특수 아이템을 장착해야만 하는 번거로움이 있었습니다.

**[작업 내용]**
* **맨손(Bare Hands) 기본화:** 빈 슬롯을 선택하면 상태 라벨이 `🖐️ 맨손 (관찰/이동)`으로 표시되도록 수정했습니다. (`applyCurrentTool()`, `js/ui.js`)
* **행위 위계 구조화 (`js/main.js` 리팩토링):** 사용자의 클릭 이벤트를 명확한 3단계 우선순위로 계층화했습니다.
  * **[1순위] 시스템 필수 동작:** 들고 있는 동물 바닥에 내려놓기, 단서 확인, 낙엽 줍기
  * **[2순위] 도구 사용:** 삽, 물뿌리개, 도끼 등 장착한 도구에 맞는 로직 실행
  * **[3순위] 맨손 상호작용 (Default):** 도구 없이 동물을 클릭하면 즉시 공중에 띄워 **안아 올리기(Carry)**가 실행되도록 편의성을 대폭 개선했습니다.

---

### 2. 저장/불러오기 및 데이터 지속성(Persistence) 시스템 강화
**[배경]**
* 독성 식물을 지우거나 씨앗을 심은 뒤 저장하고 다시 로드하면, 파괴했던 식물이 부활하거나 씨앗이 영원히 자라지 않는 치명적인 버그들이 발견되었습니다. 또한 수분 게이지, 낙엽 개수 등 시스템 세부 상태가 파일에 저장되지 않았습니다.

**[작업 내용]**
* **불러오기 로직 렌더링 순서 정상화 (`js/ui.js`):** `onFileSelected()`에서 `initWorld()`가 `deletedBlocks` 목록보다 먼저 실행되어 파괴된 식물들이 강제로 부활하는 버그를 차단했습니다. `deletedBlocks` 복원 → `initWorld()` 호출 순서로 강제 고정했습니다.
* **씨앗 타이머 지속성 확보 (`js/ui.js`):** 불안정한 `setTimeout` 대신 시간 기반(`Date.now()`)으로 심은 시간을 저장 파일에 기록하여, 게임을 껐다 켜도 시간이 누적되어 자라도록 안정화했습니다.
* **통합 세이브 데이터 연동 (`saveGame()`, `onFileSelected()`):** 낙엽 수집량(`leafCollected`), 흙 수분 상태(`waterMoisture`), 심은 씨앗 목록(`seedsPlanted`), 진딧물 상태(`aphidActive`/`aphidTarget`), 독성 식물 제거 수(`toxicRemoved`) 등 모든 서브 시스템의 진행 상태를 `sysState` 키로 묶어 JSON에 저장하고 완벽히 복원하도록 만들었습니다.

---

### 3. 단서 구슬 위치 재조정 및 `hand` 아이템 제거
**[배경]**
* 다른 컴퓨터에서의 작업으로 코드와 일지 간 불일치가 발생한 것이 확인되었습니다.
  * 4/29 작업에서 나무 단서를 `yOffset=3.5`로 띄웠으나 이것이 나무 수관(잎 영역) 안에 위치하여 여전히 가려지는 문제가 있었습니다.
  * 다른 컴퓨터 작업 중 `hand`라는 별도 아이템(`type:'hand'`)이 `ITEM_DB`에 추가되고 핫바 1번 슬롯에 장착된 상태로 변경되었는데, 이 경우 `toolMode='hand'`가 되어 동물 안아올리기(Carry)가 **동작하지 않는 버그**가 생겼습니다. (동물 Carry는 `toolMode === 'bare'` 또는 `'none'`일 때만 작동)

**[작업 내용]**
1. **나무 단서 구슬 `yOffset` 재조정 (`js/systems.js`):** `3.5 → 6`으로 상향하여, 고목나무 꼭대기 잎사귀 위에 구슬이 명확하게 부유하도록 수정했습니다.
2. **`hand` 아이템 제거 (`js/data.js`):** `ITEM_DB`에서 `hand` 항목을 삭제했습니다.
3. **핫바 1번 슬롯 빈 슬롯으로 복원 (`js/state.js`):** `hotbar[0]`을 `'hand'`에서 `null`로 변경했습니다. 이제 게임 시작 시 1번 슬롯(빈 슬롯)이 기본 선택되어 `🖐️ 맨손 (관찰/이동)` 모드가 즉시 활성화되고 동물 안아올리기가 정상 작동합니다.

---

## 📅 2026-05-01 ~ 05-02 (Phase 2 & Phase 3 전체 구현)

### 1. 페이즈 2 시스템 구현 — 꿀벌 귀환 / 강 쓰레기 제거 / 새 둥지
**[배경]**
* Phase 1 클리어(고목나무 살리기) 이후 연결될 두 번째 챕터가 필요했습니다.
* 꿀벌, 강, 새 등 3가지 생태계 요소를 복원하는 퀘스트로 구성했습니다.

**[작업 내용]**
* **전역 상태 변수 추가 (`js/state.js`):**
  * `phase2_conditions`: `hiveFull`, `nestBuilt`, `treeBlooming` 상태 추적
  * `environment_flags`: `riverTrashCount(3)`, `hasMud`, `birdHoleSize` 환경 상태
  * `phase3_conditions`: `sheepHealed`, `horseSpace`, `goatClimbed` (Phase 3용 미리 선언)
* **`Phase2System` 객체 구현 (`js/systems.js`):**
  * **꽃 구역 4개 생성:** 보라색 박스를 클릭하면 꽃 선택 UI 팝업 등장
  * **교육적 꽃 선택 미니게임:** 클로버(🍀)·해바라기(🌻)는 꿀벌이 좋아하는 꽃으로 성공, 장미·국화는 실패 처리. 꽃가루 유무를 놀이로 학습하는 장치.
  * **나뭇가지(isBranch) 장애물:** 꽃을 모두 심은 뒤 나뭇가지를 치워야 벌집(`hiveFull = true`) 조건 충족
  * **강 쓰레기 3개 제거:** 모두 제거 시 `hasMud = true`로 전환 — 제비 둥지의 선행 조건
  * **박새 새집 미니게임(isBirdHouse):** 구멍 크기 숫자 입력 UI에서 정답(28mm)을 맞춰야 박새 입주 성공. 너무 크거나 작으면 실패 안내.
  * **제비 둥지(isNestZone):** `hasMud = true` 조건을 충족해야만 진흙 둥지 완성 가능 — 강 복원이 선행되어야 한다는 생태계 인과관계 반영
* **`ITEM_DB` 확장 (`js/data.js`):** Phase 2 꽃 심기에 필요한 `seed_clover`(클로버)·`seed_sunflower`(해바라기) 씨앗 아이템 추가
* **페이즈 전환 연출 (`js/ui.js`):** `showPhaseTransition(phase)` 함수 신설 — 페이즈 클리어 시 화면 중앙에 이모지와 메시지를 2.5초간 표시 (Phase 2→3→4 메시지 준비)
* **QuestManager UI 확장:** `updateUI()`에 페이즈 2 미션 상태바(꿀벌 귀환 / 쓰레기 제거 남은 수 / 제비 둥지) 실시간 표시 추가

---

### 2. 페이즈 3 시스템 구현 — 동물의 보금자리 만들기
**[배경]**
* 꿀벌과 새가 돌아온 뒤 마지막으로 양·말·염소 3마리의 문제를 해결하는 챕터입니다.
* 각 동물마다 고유한 인터랙션 미니게임을 설계했습니다.

**[작업 내용]**
* **`Phase3System` 객체 구현 (`js/systems.js`):**
  * **양(A) — 그늘·볏짚·응급처치 3단계 퀘스트:**
    1. 다친 양(`isInjured=true`)을 클릭해 선택(노란 하이라이트)
    2. 회색 그늘 구역(isShadeZone)으로 이동 후 재클릭
    3. 노란 볏짚(isStrawZone)으로 이동 후 클릭하면 응급처치 팝업 등장, "치료하기" 버튼으로 완료
  * **말(B) — 발굽 돌 제거 + 울타리 철거:**
    1. 말 클릭 시 "발굽 돌 제거" 팝업이 뜨며 인터랙션
    2. 이후 붉은 울타리(isFence3) 2개를 클릭해 모두 제거하면 `horseSpace = true`
  * **염소(C) — 탈출 미니게임 + 바위 등반 2단계:**
    1. 염소 클릭 시 파란 구슬(isEscapeSphere) 3개가 주변에 생성, 10초 안에 모두 클릭해야 성공 (시간 초과 시 재시도 가능)
    2. 구슬을 모두 잡은 뒤 염소를 클릭해 선택 → 바위(isRock3) 클릭으로 염소를 등반시키면 `goatClimbed = true`
* **`buildAnimal()` 염소(goat) 3D 모델 추가 (`js/world.js`):** 흰 몸체에 뿔 2개(`ConeGeometry`)와 턱수염 포함
* **`spawnLevelAnimals()` 비활성화 (`js/world.js`):** 이제 Phase3System에서 양/말/염소를 지정 좌표에 직접 생성하므로 기존 자동 배치 로직을 비활성화
* **QuestManager UI 확장:** `updateUI()`에 페이즈 3 미션 상태바(양/말/염소 조건) 실시간 표시
* **페이즈 3 완료 처리:** 3조건(`sheepHealed`, `horseSpace`, `goatClimbed`) 모두 충족 시 화면에 `mission-clear` UI 표시 (보스 챌린지 복선)

---

### 3. 레이캐스팅 및 클릭 핸들러에 Phase 2/3 통합
**[배경]**
* Phase 2와 Phase 3의 인터랙티브 오브젝트(꽃 구역, 쓰레기, 울타리, 양 등)가 마우스/터치 클릭에 반응하도록 기존 인터랙션 파이프라인에 연결해야 했습니다.

**[작업 내용]**
* **`getRayTargets()` 확장 (`js/main.js`):** `Phase2System.getAllMeshes()`와 `Phase3System.getAllMeshes()`를 레이캐스팅 대상 목록에 추가
* **`handleClick()` 우선순위 추가:** 행위 위계 1.5순위 위치에 Phase 2/3 핸들러 삽입
  * 독성 식물 맨손 클릭 경고 처리 → Phase 2/3 핸들러 → 도구 모드 순서

---

### 4. ArrowSystem Phase 3 화살표 안내 추가
**[배경]**
* Phase 3의 미션 오브젝트(다친 양, 말, 염소, 울타리, 탈출 구슬, 바위)가 맵 곳곳에 퍼져 있어 아이들이 목표물을 찾기 어려울 수 있었습니다.

**[작업 내용]**
* `ArrowSystem.update()` 내 Phase 3 분기 추가 (`js/systems.js`):
  * `!sheepHealed`: 양 머리 위 + (양 선택됐을 때) 그늘/볏짚 화살표
  * `!horseSpace`: 말 머리 위 + 붉은 울타리 2개 화살표
  * `!goatClimbed`: 염소 머리 위 + 파란 탈출 구슬 + (염소 선택됐을 때) 바위 화살표

---

### 5. 개발자 모드 `goPhase()` 함수 추가
**[배경]**
* 게임 테스트 시 Phase 0부터 퀘스트를 순서대로 다 플레이하지 않고 원하는 페이즈로 바로 진입할 필요가 있었습니다.

**[작업 내용]**
* `window.goPhase = function(n)` 추가 (`js/ui.js`):
  * 브라우저 개발자 콘솔에서 `goPhase(2)` 또는 `goPhase(3)` 호출 시 해당 페이즈로 즉시 이동
  * 오프닝 스킵, phase1State 전체 완료 처리, Phase2/Phase3System 초기화 자동 수행

---

### 6. `clearAll()` 및 `onFileSelected()` Phase 2/3 연동
**[배경]**
* 게임 초기화(리셋) 또는 파일 불러오기 시 Phase 2/3 오브젝트가 씬에 남거나 잘못 초기화되는 문제를 예방했습니다.

**[작업 내용]**
* **`clearAll()` 확장 (`js/ui.js`):** Phase2System._clearAll()과 Phase3System._clearAll()을 호출해 페이즈 전용 메시 및 타이머를 씬에서 완전히 제거
* **`onFileSelected()` 자동 보정 로직 추가:**
  * `phaseComplete[1]=true` 이면서 `currentPhase=1`에 머문 세이브 데이터를 불러올 때 자동으로 `currentPhase=2`로 보정
  * 불러온 페이즈에 따라 Phase2System 또는 Phase3System을 자동 초기화

---

### 7. 모바일 카메라 상승/하강 버튼 추가
**[배경]**
* 모바일/태블릿(아이패드) 환경에서 스페이스바·Shift 키 없이 카메라 높이를 조절할 수 없어 특정 블록이나 동물에 접근하기 어려운 문제가 있었습니다.

**[작업 내용]**
* HTML에 `cam-up-btn`(▲), `cam-down-btn`(▼) 버튼과 `mobile-cam-controls` 컨테이너 추가
* `main.js`에 touch/mousedown 이벤트 리스너 연결 — 버튼을 누르는 동안 `camMoveDir` 플래그를 통해 카메라 Y축 이동
* 터치 기기(`ontouchstart` 또는 `maxTouchPoints > 0`)에서만 버튼이 자동으로 표시되도록 처리

---

### 8. 모바일 터치 더블 파이어 현상 수정 및 호환성 강화
**[배경]**
* 터치 환경에서 `touchstart`와 브라우저 가상 마우스 이벤트가 중복으로 발생하여(더블 클릭), 블록이 두 개 설치되거나 볏짚이 허공에 겹쳐 생성되는 문제가 발생했습니다.

**[작업 내용]**
* `main.js`의 터치 이벤트 핸들러에 `e.preventDefault()` 적용. 이벤트 전파를 막아 모바일/아이패드 환경에서 부드럽고 정확한 상호작용 보장.

---

### 9. 맨손 UI 직관성 확보 & 상호작용 피드백 강화
**[배경]**
* 아무 도구도 들지 않은 '맨손 모드' 상태인지 인지하기 어려웠고, 페이즈 1에서 삽이 아닌 맨손/다른 도구로 독성 식물을 클릭했을 때 반응이 없어 진행이 막히는 경우가 잦았습니다.

**[작업 내용]**
* 핫바(`ui.js`)의 빈 슬롯과 현재 맨손 상태를 `🖐️` 아이콘으로 명확히 표시
* `main.js`의 클릭 이벤트에서 독성 식물 클릭 시, 도구가 'shovel'이 아니면 `toast("⚠️ 삽(Shovel)을 이용해 독성 식물을 뽑아주세요!")` 경고창 출력

---

### 10. 무작위 동물(양 떼) 생성 중단 및 페이즈 3 진짜 동물 투입
**[배경]**
* 맵을 탐험할 때마다 무작위 양이 대량 스폰되어 게임 화면을 덮었고, 페이즈 3의 핵심 동물(말, 염소, 다친 양)이 임시 큐브로 구현되어 구분이 되지 않았습니다.

**[작업 내용]**
* `world.js`의 청크 생성 시 육지 동물(양) 무작위 스폰 로직 완전히 삭제
* `Phase3System`에서 임시 큐브(`_box`)를 버리고, `buildAnimal`을 호출해 귀여운 **진짜 3D 양, 말, 염소 모델** 적용

---

### 11. 화살표(⬇️) 시스템 기반 페이즈 3 완벽 가이드
**[배경]**
* 페이즈 3가 시작되었을 때 퀘스트 텍스트가 어려웠고 무엇을 눌러야 할지 시각적 힌트가 없어 진행이 막혔습니다.

**[작업 내용]**
* `QuestManager`의 미션 문구를 동화책 같은 직관적인 대화체로 변경
* `ArrowSystem`을 페이즈 3에 연결하여 양 ➡️ 그늘 ➡️ 볏짚, 말굽 ➡️ 울타리 등 사용자가 **지금 당장 클릭해야 할 대상의 머리 위**에 노란색 화살표(⬇️)가 통통 튀며 가리키도록 설정

---

### 12. 아기자기한 2D 이모지 스프라이트(Billboard) 전면 도입
**[배경]**
* 식물, 씨앗 자원들과 페이즈 2/3의 인터랙티브 구역(꽃밭, 새집, 쓰레기 등)이 십자 교차형 3D 폴리곤이나 네모 박스라 시각적으로 덜 매력적이었습니다.

**[작업 내용]**
* 캔버스를 활용해 **흰색 둥근 모서리에 그림자가 들어간 고해상도 이모지 카드(스프라이트)**를 생성하는 `createEmojiSprite` 유틸리티 개발
* `world.js`의 `buildMesh()`를 수정해 🍅, 🌿, 🍀, 🌻, 🍂 등의 식물들을 스프라이트로 교체
* `systems.js`의 페이즈 2(🌸, 🗑️, 🪵, 🏠, 🪺) 및 페이즈 3(☂️, 🌾) 임시 박스 구역들을 2D 이모지 카드로 전면 교체하여 동화 같은 분위기 연출

---

---

### 13. 레벨 및 페이즈 계층 구조 리팩토링 (Router Architecture)
**[배경]**
* 기존 퀘스트 로직이 하나의 거대한 `QuestManager`에 하드코딩되어 있어, 추후 레벨(Level) 확장 시 코드가 너무 비대해지고 유지보수가 불가능할 것으로 판단되었습니다.

**[작업 내용]**
* `Level1Manager` 모듈을 분리하여 페이즈 로직(0~3)을 전담하게 하고, `QuestManager`는 레벨 간 라우팅(Routing) 역할만 하도록 구조 전면 개편.
* 게임의 확장성을 확보하고, 추후 `Level2Manager` 등을 손쉽게 끼워 넣을 수 있는 기반 마련.

---

### 14. 초록별 수호대(Guardian) 수집 및 도감 시스템 추가
**[배경]**
* 플레이어가 마을의 동물들을 도와주는 행위에 대한 지속적인 보상과, 각 동물의 배경 서사를 보여줄 수집형 요소가 필요했습니다.

**[작업 내용]**
* `data.js`에 12마리(제비, 수달, 여우 등)의 동물 서사, 성격, 힌트를 담은 `GUARDIAN_DATA` 추가.
* `state.js` 및 `systems.js`에 `GuardianSystem`을 구축하여 미발견(0) -> 발견(1) -> 도움(2) -> 합류(3) 상태를 관리하고 세이브/로드 연동.
* 키보드 `B`나 화면 UI로 열 수 있는 반응형 12칸 도감 모달창 구현 및 스토리 시각화 적용.

---

### 15. 바이옴(Biome) 기반 월드 지형 블렌딩 시스템
**[배경]**
* 단일 노이즈 공식으로만 월드를 그려 맵 전역이 똑같은 풀밭으로만 이루어져 있어 탐험의 재미가 떨어졌습니다.

**[작업 내용]**
* `BIOME_CONFIG`를 정의하여 각 좌표 영역별로 '다양성의 숲(험준한 산악)', '강의 근원지(얕은 수심)', '대산호초' 등의 바이옴 데이터를 설정.
* `BiomeSystem`을 통해 중심점 거리에 따른 가중치(Weight)를 계산하여, 바이옴 경계선에서 지형 고도와 흙 블록 종류가 부드럽게 섞이는 지형 블렌딩 시스템 구현.

---

### 16. 가시거리 기반 렌더링 최적화 (Dynamic Chunk Unloading)
**[배경]**
* 월드 맵의 탐험 구역이 확장됨에 따라 블록 생성 개수가 기하급수적으로 증가하여 심각한 렉(프레임 드랍)이 발생했습니다.

**[작업 내용]**
* `main.js`의 `animate` 루프에서 현재 카메라 시야(Orbit Target 중심)를 계산하는 `updateVisibleChunks` 최적화 매니저 적용.
* 플레이어 반경 2청크 밖의 블록들을 3D 씬(Scene)에서 완전히 제거하여 Draw Call을 최소화하고 메모리 부하를 방지. 시야에 진입 시 즉각 복구 처리.

---

### 17. 2D 스프라이트(이모지) 클릭 불가 버그 픽스
**[배경]**
* 독성 식물(노란 꽃) 등 기존 3D 폴리곤 식물들을 2D 스프라이트(Billboard)로 교체한 이후, 레이캐스터(Raycaster)가 마우스 클릭을 감지하지 못해 게임 진행이 막히는 현상이 발생했습니다.

**[작업 내용]**
* 마우스 클릭 대상을 수집하는 `getRayTargets` 함수가 `THREE.Mesh` 타입만 수집하고 `THREE.Sprite` 타입을 무시하던 로직을 수정하여(`obj.isMesh || obj.isSprite`), 클릭 인터랙션이 정상 작동하도록 패치했습니다.

---

### 18. 바닥에 떨어진 낙엽(LeafSystem)의 2D 스프라이트화
**[배경]**
* 마을 중앙 늙은 나무(Old Tree) 주변에 떨어진 퀘스트용 낙엽들이 여전히 과거의 3D 폴리곤(BoxGeometry 조합) 형태로 남아있어, 최근 개편된 2D 이모지 스프라이트(Billboard) 아트 스타일과 이질감이 있었습니다.

**[작업 내용]**
* `LeafSystem.init()`에서 3D 잎사귀 모델 생성 로직을 제거하고, 다른 자원들과 동일한 스타일의 `🍂` 이모지 스프라이트(`createEmojiSprite`)를 생성하도록 수정하여 시각적 통일성을 맞췄습니다.

---

### 19. 토마토-바질 '동반식물' 퀘스트 가이드 보강
**[배경]**
* 퀘스트 상에서는 바질과 토마토를 나란히 심어야(동반식물 효과) 열매가 맺히도록 로직이 짜여 있었으나, 유저에게 제공되는 안내 메시지와 UI에는 "토마토 씨앗을 심고 물을 주세요"라고만 적혀 있어 플레이어가 바질을 심어야 할 이유를 알 수 없는 상태였습니다.

**[작업 내용]**
* 독성 식물 뽑기 완료 후 출력되는 토스트 알림 메시지를 구체적으로 변경: `토마토(🍅)와 바질(🌿) 씨앗을 나란히 심어주세요!`, `바질의 강한 향이 벌레를 쫓아 토마토를 지켜준답니다!`
* 좌측 미션 UI 텍스트를 `토마토 & 바질 나란히 심기 (동반식물 효과)`로 수정하여 퀘스트의 목표를 명확하게 전달하도록 보완했습니다.

## 📅 2026-05-04 (게임 안내 UI/UX 전면 개편 및 수호대 도감 시스템 구축)

### 1. Toast 알림 스택 방식 전환 (단일 → 누적)
**[배경]**
* 기존 `#toast` 요소는 화면 중앙에 하나만 표시되고 새 메시지가 오면 즉시 덮어씌워지는 구조였습니다.
* 연속으로 여러 안내가 발생하는 퀘스트 상황(예: 꽃 뽑기 완료 직후 3단계 안내)에서 메시지를 놓치는 문제가 있었습니다.

**[작업 내용]**
* **`#toast-container` 신설:** 기존 `#toast` 단일 요소 대신 `position: fixed; bottom: 120px; right: 20px;` 위치에 컨테이너를 배치했습니다. (`index.html`, `css/style.css`)
* **`toast()` 전면 재작성 (`js/ui.js`):** 메시지마다 `.toast-msg` 요소를 생성해 컨테이너에 `append`하는 스택 방식으로 변경. 각 메시지는 4.6초 후 자동 제거됩니다.
* **`slideInRight` / `fadeOut` CSS 애니메이션 추가:** 메시지가 우측에서 밀려 들어오고 자연스럽게 사라지는 효과.

---

### 2. 알림 기록 모달 신설 (📩 메시지 로그)
**[배경]**
* 여러 메시지가 순식간에 지나가면 놓친 안내를 다시 확인할 방법이 없었습니다.

**[작업 내용]**
* **`messageHistory` 배열:** 모든 `toast()` 호출 내용을 시각(HH:MM:SS)과 함께 배열에 누적 저장합니다. (`js/ui.js`)
* **`toggleMessageLog()` / `renderMessageLog()`:** 핫바의 📩 버튼을 누르면 `#message-log-overlay` 모달에서 모든 기록을 최신순으로 열람 가능합니다. 로그가 열려있는 동안 새 메시지도 실시간 반영됩니다.
* **단축키 `L`:** 키보드에서 L 키로도 모달 토글 가능. (`js/ui.js` keydown 리스너)

---

### 3. 수호대 도감 시스템 구축 (📖 Guardian Book)
**[배경]**
* 게임에 수집·완성의 재미를 더하고, 각 동물의 생태적 역할을 어린이들이 깊이 이해할 수 있는 스토리 기반 도감이 필요했습니다.

**[작업 내용]**
* **`GUARDIAN_DATA` 추가 (`js/data.js`):** 12마리 수호대의 이름·칭호·스토리·성격·힌트 데이터를 정의했습니다.
  * 🐑 점박이 양, 🐝 토종 꿀벌, 🐦 봄을 알리는 제비, 🦦 장난꾸러기 수달, 🦇 밤하늘의 박쥐, 🦊 꾀돌이 붉은 여우, 🦅 용감한 독수리, 🦩 우아한 두루미, 🐟 힘찬 연어, 🦝 먹보 너구리, 🦉 매서운 황조롱이, 🐻 느긋한 반달곰
* **`guardianState` 추가 (`js/state.js`):** 각 동물의 발견 단계 추적. `0(미발견) → 1(힌트 공개) → 2(도움 완료) → 3(수호대 합류)`의 4단계 구조.
* **`GuardianSystem` 추가 (`js/systems.js`):** `updateState(id, newState)` 메서드가 상태 변화 시 도감 갱신 토스트와 에코팝업을 자동 출력하며 `renderGuardianBook()`을 호출합니다.
  * Phase 2 꿀벌 귀환 시 → `GuardianSystem.updateState('bee', 3)`
  * Phase 2 강 쓰레기 제거 완료 시 → `GuardianSystem.updateState('otter', 3)` (수달 귀환)
  * Phase 2 제비 둥지 완성 시 → `GuardianSystem.updateState('swallow', 3)`
  * Phase 1 부상 양 치료 시 → `GuardianSystem.updateState('sheep', 3)` (`js/main.js`)
* **`toggleGuardianBook()` / `renderGuardianBook()` (`js/ui.js`):** 도감을 전체 화면 오버레이로 표시. 상태에 따라 그레이스케일 → 컬러 점진 공개. 카드 클릭 시 우측 패널에 스토리·성격·힌트 표시.
* **UI/HTML (`index.html`, `css/style.css`):** 핫바에 📖 버튼 추가, `#guardian-book-overlay` 전체 화면 모달과 그리드·카드·디테일 패널 CSS 구현. 단축키 `B`.
* **세이브/로드 연동 (`js/ui.js`):** `saveGame()`에 `guardianState` 저장, `onFileSelected()`에서 복원.

---

### 4. QuestManager → Level1Manager 아키텍처 리팩토링
**[배경]**
* 향후 레벨 2, 레벨 3 추가를 대비해 퀘스트 시스템을 레벨별로 분리할 수 있는 구조가 필요했습니다.

**[작업 내용]**
* **`Level1Manager` 신설 (`js/systems.js`):** 기존 `QuestManager`의 상태(`currentPhase`, `phaseComplete`, `phase1State` 등)와 메서드(`check`, `updateUI`, `advance`, `checkPhase1` 등)를 `Level1Manager`로 이전했습니다.
* **`QuestManager` Facade 패턴 적용:** `QuestManager`는 `levels[currentLevel]`을 통해 `Level1Manager`에 위임하는 얇은 래퍼로 재구성했습니다. (`levels: { 1: Level1Manager }`)
* **`currentLevel` 전역 변수 추가 (`js/state.js`):** 현재 플레이 중인 레벨 번호를 저장합니다.
* **모든 내부 참조 갱신:** `ToxicPlantSystem`, `WormMinigame`, `CompanionPlant` 등 Phase 1 시스템 내부의 `QuestManager.phase1State` 참조를 `Level1Manager.phase1State`로 직접 교체했습니다.
* **`goPhase()` 버그 수정 (`index.html`):** 기존 코드에서 `QuestManager.phaseComplete = {}` 등을 잘못된 래퍼 객체에 설정하던 버그를 `Level1Manager.phaseComplete = {}` 로 교정했습니다.

---

### 5. 이모지 스프라이트 렌더링 시스템 도입
**[배경]**
* 씨앗, 식물, 낙엽 등 식생 블록들이 기존에는 단색 3D 박스로 표현되어 아이들이 시각적으로 구분하기 어려웠습니다.

**[작업 내용]**
* **`createEmojiSprite(emoji)` 추가 (`js/world.js`):** Canvas API로 128×128 텍스처를 생성하고 Three.js `Sprite`에 매핑합니다. `spriteCache`로 동일 이모지 재사용 시 텍스처 재생성을 방지합니다.
* **`buildMesh()` 식생 처리 교체 (`js/world.js`):** `plant`, `seed`, `resource` 카테고리 블록 렌더링을 기존 X자 교차 폴리곤에서 이모지 스프라이트로 전환했습니다.
  * 🍅 토마토, 🌿 바질, 🍀 클로버, 🌻 해바라기, 🍂 낙엽, 🥀 독성 식물, 🌱 새싹 등
* **`LeafSystem.init()` 개선 (`js/systems.js`):** 기존 3D 폴리곤 낙엽 모델을 `createEmojiSprite('🍂')`로 대체했습니다.
* **Phase 2/3 시스템 이모지 오브젝트화 (`js/systems.js`):** `Phase2System`의 꽃 구역, `Phase3System`의 동물 존 등에서도 `createEmojiSprite`를 활용하도록 변경했습니다.

---

### 6. 미션 상태창 아코디언(Accordion) UI 전환
**[배경]**
* 기존 미션 상태바는 `<div class="mc">` 로 미션 항목이 평면 나열되어 가독성이 떨어졌고, 완료/진행 중 구분이 충분히 직관적이지 않았습니다.

**[작업 내용]**
* **아코디언 CSS 추가 (`css/style.css`):** `.mission-step`, `.step-header`, `.step-title`, `.step-body`, `.mission-step.active`, `.mission-step.done` 클래스 정의. 완료 항목은 반투명 + 취소선, 현재 항목은 황금 테두리 강조.
* **`Level1Manager.updateUI()` 전면 재작성 (`js/systems.js`):** Phase 1·2·3 전체의 `statusEl.innerHTML` 출력을 `mkStep()` 헬퍼 함수 기반 아코디언 구조로 교체했습니다.
  * 첫 번째 미완성 미션이 자동으로 펼쳐진 상태(`active`)로 시작
  * 헤더 클릭으로 언제든 접기/펼치기 토글 가능
  * 완료된 미션 상세 지시사항 포함 (각 미션의 Why까지 설명)
* **`Level1Manager.checkPhase1()` 단순화:** `statusEl.innerHTML` 직접 업데이트 로직을 제거하고 `this.updateUI()` 호출로 위임, DOM 업데이트 책임을 `updateUI()`로 일원화했습니다.

---

## 📅 2026-05-06 (레벨 1 명세서 기반 전면 구조화 — Phase 0~4 완전 연동)

> **작업 배경**
> `[레벨 1: 초록 마을] 파일별 코드 수정 및 구현 명세서`에 따라 5개의 JS 파일과 `index.html`에 걸쳐 페이즈 진행도 상태 관리, 수호대 영입 조건 판별, 렌더링 연출, UI 레이어를 체계적으로 재구성했습니다. 이전까지 `Level1Manager.currentPhase`와 `phase2_conditions` 등의 레거시 변수들이 흩어져 있던 것을 명세서 기준의 통합 구조로 정비했습니다.

---

### 1. `state.js` — 레벨 1 페이즈 상태 전면 추가

**[작업 내용]**
* **페이즈 추적 변수 7개 신설:**

  | 변수명 | 초기값 | 역할 |
  |---|---|---|
  | `level_phase` | `0` | 현재 진행 Phase (0~4) |
  | `yellow_orbs_collected` | `0` | Phase 0 단서 수집 카운트 |
  | `toxic_plants_removed` | `false` | Phase 1 완료 플래그 |
  | `companion_plants_status` | `{tomato, basil, watered}` | Phase 2 동반식물 상태 |
  | `leaves_collected` | `0` | Phase 3 낙엽 수집 카운트 |
  | `tree_state` | `'withered'` | Phase 4 나무 상태 |
  | `global_protectors` | `{bee, swallow, sheep}` | 수호대 최종 합류 여부 |

* **함수 2개 신설:**
  * `advancePhase(targetPhase?)` — 페이즈를 이행하며 `'phaseAdvanced'` 커스텀 이벤트를 `document`에 발행. 다른 모듈이 이벤트로 반응할 수 있도록 설계.
  * `checkLevel1Clear()` — `global_protectors` 3종이 모두 `true`이면 `'level1Cleared'` 이벤트 발행 후 `true` 반환.

* **하위 호환 유지:** 기존 `phase2_conditions`, `environment_flags`, `phase3_conditions`는 리팩터링 전까지 병존.

---

### 2. `data.js` — 기획 텍스트 데이터 중앙화

**[작업 내용]**
* **`npcDialogues`** — 페이즈별 할머니 대사 14개 키 (`phase0_intro` ~ `level1_clear`). 각 항목에 `speaker`와 `lines[]` 배열 포함.
* **`encyclopediaCards`** — 생태계 도감 팝업 카드 7장 (고목나무·지렁이·토종꿀벌·제비·동반식물·독성식물·무당벌레). 각 카드에 `title`, `icon`, `body`, `tip`, `triggerPhase` 포함.
* **`protectorConditions`** — 수호대 영입 달성 조건 메타데이터:
  * 꿀벌: `plant_clover` 또는 `plant_sunflower` 블록 3개 이상
  * 제비: `hasMud === true` + `eave` 블록 1개 이상
  * 양: `treeBlooming` + `straw` 블록 1개 이상 + 양 치료 완료

---

### 3. `systems.js` — 페이즈별 상호작용 로직 state.js 연동 + 수호대 조건 리스너

**[작업 내용]**

**기존 시스템 10개 지점 동기화:**

| 위치 | 추가된 동기화 |
|---|---|
| `ClueSystem.checkClick()` | `yellow_orbs_collected = foundCount` |
| `ToxicPlantSystem.remove()` | `toxic_plants_removed = true` + `advancePhase(2)` |
| `LeafSystem.collect()` | `leaves_collected = collected` |
| `LeafSystem.placeOnSoil()` | `advancePhase(4)` (Phase 3→4 이행) |
| `CompanionPlant.check()` | `companion_plants_status.tomato/basil = true` |
| `OldTree.updateParticles()` | `tree_state = 'bloomed'` + `phase2_conditions.treeBlooming = true` + `checkSheepCondition()` |
| `Level1Manager.advance()` | `advancePhase()` 동기 호출 |
| `Phase2System._activateHive()` | `global_protectors.bee = true` + `checkLevel1Clear()` |
| `Phase2System._onNestZoneClick()` | `global_protectors.swallow = true` + `checkLevel1Clear()` |
| `Phase3System._showFirstAidPopup()` | `checkSheepCondition()` 호출 |

**신규 함수 4개 추가 (파일 끝):**
* `checkBeeCondition()` — 꽃 블록 3개↑ 감지 → `_activateHive()` 자동 트리거
* `checkSwallowCondition()` — `hasMud` + `eave` 블록 감지 → `_onNestZoneClick()` 자동 트리거
* `checkSheepCondition()` — 나무 개화 + straw + 양 치료 3조건 → `global_protectors.sheep = true`
* `onBlockPlaced(blockType)` — 블록 설치 시 3개 조건 함수를 일괄 재검사하는 훅

**WormMinigame 이벤트 연결:**
* `complete()` 완료 시 `document.dispatchEvent(new CustomEvent('wormComplete'))` 추가 → `ui.js`의 `startWormMinigame()` Promise 해제

---

### 4. `world.js` — 렌더링/애니메이션 함수 5개 + onBlockPlaced 훅 연결

**[작업 내용]**

* **`_place()` 훅 추가:** 블록 설치 시마다 `onBlockPlaced(type)` 자동 호출 (수호대 조건 실시간 감지)

* **신규 렌더링 함수 5개:**

  | 함수 | 역할 |
  |---|---|
  | `bloomTree()` | 잎 색상 회색→녹색 전환 + 가지 각도 복원 + 과일 표시 + 3×3 그늘 블록 생성 + 녹색 파티클 이펙트 |
  | `spawnLadybugAndClearAphids()` | AphidSystem 파티클 정리 + 빨간 파티클 이펙트 |
  | `animateHorseReturn(targetPos)` | 말이 화면 외부에서 목표 지점으로 easeOutCubic 트윈 이동 |
  | `playProtectorJoinEffect(animalType)` | 이모지 스프라이트가 지정 경로로 날아오며 도착 후 12개 파티클 폭죽 + 토스트 |
  | `clearLevelFog()` | `scene.fog.near/far`를 60스텝에 걸쳐 서서히 확장 → '다양성의 숲' 청크 프리뷰 자동 로드 |

* **이벤트 리스너 2개 자동 등록:**
  * `'level1Cleared'` → `clearLevelFog()` 호출
  * `'phaseAdvanced'` (next===4) → 2.6초 뒤 `bloomTree()` 호출

---

### 5. `ui.js` — UI 레이어 함수 4개 + save/load/clear 새 상태 연동

**[작업 내용]**

**신규 UI 함수 4개:**

* **`showEncyclopediaCard(cardId)`** — `encyclopediaCards`에서 카드 데이터를 읽어 다크 그린 테마 팝업 생성. 배경 클릭으로 닫기 지원.
* **`startWormMinigame(x, z)`** — `WormMinigame.start()`를 호출하고 `wormComplete` 이벤트를 기다리는 Promise 래퍼.
* **`updateProtectorSlots()`** — `global_protectors` 상태를 읽어 화면 하단 3개 슬롯 아이콘의 `slot-active`/`slot-inactive` 클래스 전환 + `protector-join-pulse` 애니메이션 + 전원 합류 시 클리어 배너 표시.
* **`showNpcDialogue(phaseKey, opts)`** — `npcDialogues`에서 대사를 읽어 `grandma-popup` 재활용 또는 독립 오버레이로 표시. 다음 ▶ 버튼으로 줄 단위 진행. `phaseAdvanced` 이벤트 수신 시 페이즈별 대사 자동 표시 (`phase1_start` ~ `phase4_bloom`).

**save/load/clearAll 새 상태 연동:**
* `saveGame()` — `level1State` 블록으로 7개 신규 변수를 JSON에 포함 (세이브 버전 `v:14`로 갱신)
* `onFileSelected()` — `data.level1State` 복원 후 `updateProtectorSlots()` 호출
* `clearAll()` — 신규 7개 변수 초기화 + `updateProtectorSlots()` 호출
* `goPhase(n)` — 개발자 모드에서 `level_phase`, `tree_state` 등도 함께 동기화

---

### 6. `index.html` — 수호대 슬롯 UI + CSS 애니메이션

**[작업 내용]**
* **수호대 슬롯 3개 (`#protector-slot-bee/swallow/sheep`):** 화면 하단 중앙에 고정. 합류 전 반투명, 합류 후 황금 테두리 + 글로우 효과.
* **클리어 배너 (`#protector-clear-banner`):** 3마리 모두 합류 완료 시 화면 중앙에 표시되는 축하 오버레이.
* **`@keyframes protector-join-pulse`:** 합류 시 슬롯이 확대·수축하며 빛나는 팡파레 애니메이션.
* **캐시버스터 갱신:** 모든 `<script src>` 버전 파라미터를 `?v=20260506`으로 갱신.

---

### 7. 이벤트 기반 모듈 간 통신 구조 확립

**[설계 결정]**
기존 코드에서 각 시스템이 서로를 직접 호출하던 강결합 구조를 **`CustomEvent` 기반 이벤트 버스** 패턴으로 개선했습니다.

```
state.js        → 'phaseAdvanced' 이벤트 발행
                → 'level1Cleared' 이벤트 발행

world.js        → 'phaseAdvanced' 수신 → bloomTree() / clearLevelFog()
ui.js           → 'phaseAdvanced' 수신 → updateProtectorSlots() / showNpcDialogue()
systems.js      → 'wormComplete'  발행 → startWormMinigame() Promise 해제
```

이 구조를 통해 레벨 2 이상 추가 시 새 리스너만 등록하면 되고, 기존 파일 수정 없이 확장이 가능합니다.

---

## 📅 2026-05-06 (Phase 2/3 버그 대규모 수정 — 동물 클릭·위치·UI 전반)

> **작업 배경**
> 레벨 1 Phase 3 전체 플레이 테스트에서 다수의 버그가 발견되었습니다. 동물 상호작용 불가, 오브젝트 공중 부유, UI 가이드 미작동 등 플레이 진행 자체를 막는 치명적인 문제들을 일괄 수정했습니다.

---

### 1. Phase 3 동물 클릭 불가 버그 수정 (THREE.Group 레이캐스팅)

**[배경]**
* 양·말·염소는 `buildAnimal()`로 생성된 `THREE.Group`(여러 메시의 집합체)인데, `getRayTargets()`가 `Phase3System.getAllMeshes()`에서 받은 객체를 `THREE.Mesh`로만 가정하고 있었습니다.
* `intersectObjects(targets, false)` 호출 시 `recursive=false`이므로 Group 자체는 히트하지 못하고, 내부 자식 Mesh들도 대상 배열에 없어 클릭이 완전히 무시되었습니다.

**[수정 내용] (`js/main.js` `getRayTargets()`)**
* Phase 3 오브젝트를 추가하는 구간에서 그룹(`isGroup`)을 감지하면 `.traverse()`로 내부 `Mesh`·`Sprite`를 모두 꺼내어 레이캐스팅 대상 배열에 평탄화(flatten)하도록 변경했습니다.
```javascript
if (m.isMesh || m.isSprite) p3m.push(m);
else if (m.isGroup) m.traverse(c => { if (c.isMesh || c.isSprite) p3m.push(c); });
```

---

### 2. 동물·오브젝트 공중 부유 수정 (`getTopY` → `getVisualTopY`)

**[배경]**
* 잔디(grass) 블록은 높이가 0.2로 얇아, `getTopY(x,z)`(=첫 번째 빈 y칸 반환, 예: y=20)와 실제 시각적 지표면인 `getVisualTopY(x,z)`(=19.2) 사이에 0.8 간격이 발생합니다.
* `Phase3System._initSheepZone()`, `_initHorseZone()`에서 `getTopY`를 사용하여 동물이 공중에 0.8만큼 떠 있었습니다.

**[수정 내용] (`js/systems.js`)**
* `_initSheepZone()`, `_initHorseZone()` 두 곳 모두 `getTopY` → `getVisualTopY`로 교체했습니다.

---

### 3. 그늘 이동 후 양 재부유 수정 (스프라이트 Y 오프셋 역보정)

**[배경]**
* `_sprite()` 헬퍼는 전달받은 Y에 +0.8을 더해 스프라이트를 배치합니다. `_onShadeZoneClick()`에서 양을 그늘로 옮길 때 `shadeMesh.position.y + 0.45`를 사용하면 실제로는 `(sy + 0.8) + 0.45 = sy + 1.25`가 되어 양이 다시 공중에 뜨는 문제였습니다.

**[수정 내용] (`js/systems.js`)**
* `_onShadeZoneClick()`, `_onStrawZoneClick()` 양쪽 모두 `+ 0.45` → `- 0.8`로 변경하여 스프라이트 오프셋을 정확히 역보정했습니다.

---

### 4. 그늘 구역 위치 재배치 및 아이콘 변경

**[배경]**
* 그늘 표시(☂️)가 `(4.5, 3)` 좌표에 생성되어 있었으나, 시나리오상 "고목나무 근처 그늘"이어야 하므로 고목나무가 있는 `(8, 8)` 부근이어야 합니다.
* 우산 아이콘(☂️)이 그늘을 직관적으로 나타내지 못한다는 피드백도 있었습니다.

**[수정 내용] (`js/systems.js` `_initSheepZone()`)**
* 그늘 구역: `(4.5, 3)` → `(7, 8)` (고목나무 바로 옆)
* 볏짚 구역: `(5, 3)` → `(5, 8)` (인접 위치로 함께 이동)
* 아이콘: `☂️` → `🌳` (나무 그늘 의미를 직관적으로 전달)
* 양 클릭 시 안내 토스트도 "고목나무 근처 🌳 그늘 표시를 클릭하세요!"로 업데이트

---

### 5. 염소·바위 미로딩 청크 문제 수정

**[배경]**
* 염소 구역이 `(14, 7)` 좌표였는데, 바위는 `gx + 2 = 16`에 생성되어 청크 `(2, 0)` (x=16~23)에 속했습니다. 이 청크는 초기에 로드되지 않아 바위가 공중에 떠 있는(실제로는 지형 없이 배치된) 현상이 발생했습니다.
* 청크 크기 `CHUNK=8` 기준으로 청크 `(0,0)`~`(1,1)`만 초기에 활성화됩니다.

**[수정 내용] (`js/systems.js` `_initGoatZone()`)**
* 염소 위치: `(14, 7)` → `(11, 12)` (청크 `(1,1)` 내부)
* 바위 위치: `gx+2 = 13` (동일 청크 유지)
* 바위 높이도 `1.0`(H)으로 줄여 "높은 돌탑" 외형 문제도 함께 해결

---

### 6. 탈출 구슬 2개만 보이는 버그 수정

**[배경]**
* `_startEscapeMinigame()`에서 파란 구슬 3개를 생성할 때 모두 염소의 Y 좌표(`getTopY(gx, gz)`)를 그대로 사용했습니다. 구슬이 놓이는 실제 지형이 높은 경우 해당 구슬이 지형 아래로 박혀 보이지 않았습니다.

**[수정 내용] (`js/systems.js` `_startEscapeMinigame()`)**
* 구슬마다 각자의 위치 `(gx+dx, gz+dz)`에서 독립적으로 `getTopY()`를 계산하여 지형 높이에 맞게 배치하도록 수정했습니다.

---

### 7. 박새(birdHouse) 미니게임 제거

**[배경]**
* 구멍 크기(28mm) 숫자 입력 UI 기반 박새 입주 미니게임이 게임 전개 흐름에 필수적이지 않고 복잡도만 올린다는 판단 하에 제거 요청이 있었습니다.

**[수정 내용] (`js/systems.js` `Phase2System`)**
* `_birdHouseDone`, `birdHouseMesh`, `_onBirdHouseClick()`, `_showBirdHoleUI()` 관련 코드 전부 삭제
* `environment_flags.birdHoleSize`, `_clearAll()`, `getAllMeshes()`, `handleClick()`, `_initTreeZones()` 에서의 박새 관련 참조 모두 제거

---

### 8. Phase 2/3 페이즈 전환 시 할머니 대화 미표시 수정

**[배경]**
* Phase 1→2, Phase 2→3 전환 시 `advancePhase(n)` 호출이 누락되어 `document`에 `'phaseAdvanced'` 이벤트가 발행되지 않았습니다. `ui.js`의 `showNpcDialogue()` 리스너가 이 이벤트를 기다리므로 할머니 대사가 전혀 뜨지 않았습니다.

**[수정 내용] (`js/systems.js`)**
* `checkPhase1()` 페이즈 1 완료 처리부에 `advancePhase(2)` 추가
* `Phase2System.check()` 페이즈 2 완료 처리부에 `advancePhase(3)` 추가

---

### 9. 도구 슬롯 반짝임(Glow) 미작동 수정

**[배경]**
* `initInventoryUI()`에서 현재 페이즈를 `QuestManager.currentPhase`로 참조했는데, `QuestManager`는 `Level1Manager`를 감싸는 Facade 객체라 이 프로퍼티가 존재하지 않아 항상 `undefined`였습니다.
* `QuestManager.phase1State`도 같은 이유로 `undefined`.

**[수정 내용] (`js/ui.js` `initInventoryUI()`)**
* `QuestManager.currentPhase` → `QuestManager.getCurrentPhase()`
* `QuestManager.phase1State` → `QuestManager.levels[1]?.phase1State`
* 바질 씨앗(`seed_basil`)도 토마토와 동일하게 반짝임 대상에 포함 (토마토 심은 뒤 바질 심기 유도)
* Phase 2/3에서 맨손 슬롯(빈 슬롯)에도 반짝임 + `'맨손으로 클릭하세요!'` 툴팁 추가

---

### 10. 양 치료 후 수호대 미합류 수정

**[배경]**
* `checkSheepCondition()`에 볏짚 블록(`strawCnt >= 1`) 조건이 포함되어 있었는데, Phase 3의 볏짚 구역은 그리드 데이터에 기록되는 블록이 아닌 이모지 스프라이트(Sprite)였습니다. 따라서 `strawCnt`는 항상 0이 되어 양이 치료를 받아도 절대 수호대에 합류하지 못했습니다.

**[수정 내용] (`js/systems.js` `checkSheepCondition()`)**
* `strawCnt >= 1` 조건 제거. 나무 개화(`treeBlooming`) + 양 치료(`sheepHealed`) 두 조건만으로 수호대 합류 완료 처리하도록 단순화했습니다.

---

### 11. 지형 가시 범위 확장 (섬처럼 보이는 현상 해결)

**[배경]**
* 이동 속도가 빠르고 지형 렌더링 반경이 2청크(16블록)로 좁아, 맵이 허공에 떠있는 섬처럼 보이는 현상이 있었습니다.

**[수정 내용]**
* **안개 밀도 (`js/main.js`):** `THREE.FogExp2` 밀도 `0.008` → `0.003` (시야를 훨씬 멀리까지 확보)
* **청크 활성화 반경 (`js/world.js` `activateChunk()`):** `viewRadius = 2` → `4`
* **청크 표시 반경 (`js/world.js` `updateVisibleChunks()`):** `R = 2` → `4` (플레이어 주변 32블록까지 지형 표시)

---

---

## 📅 2026-05-06 (레벨 2 — 다양성의 숲 기반 설계 및 화이트박스 검증 로직 구현)

> **작업 배경**
> 레벨 1(초록 마을) 클리어 이후 이어지는 레벨 2 `다양성의 숲` 챕터의 핵심 상태 구조, 검증 알고리즘, 테스트용 스폰 함수를 신규 파일로 분리·구현했습니다. 현재는 화이트박스(알고리즘 검증) 단계로, 실제 게임 루프와의 통합은 다음 단계 작업입니다.

---

### 1. 레벨 2 상태 변수 추가 (`js/state.js`)

**[작업 내용]**
* **`level2_phase`** (`0~3`) — 레벨 2 진행 단계 추적
  * `0`: 시작 → `1`: 두꺼비 구출 → `2`: 격리 미션 진행 → `3`: 완료
* **`level2_conditions`** 객체:
  * `bullfrogIsolated`: 외래종(황소개구리) 격리 완료 여부
  * `toadRescued`: 토착 두꺼비 구출 완료 여부
* **`global_protectors`** 확장 — 레벨 1의 `bee/swallow/sheep`에 레벨 2 수호대 2종 추가:
  * `otter`: 수달 — 물길 연결 달성 시 합류
  * `bat`: 황금박쥐 — 동굴 빛 완전 차단 시 합류

---

### 2. 레벨 2 핵심 검증 모듈 신설 (`js/Level2Logic.js`)

**[설계 철학]**
플레이어가 블록을 쌓고 지형을 수정한 결과가 실제로 "생태적으로 유효한 행동"인지 검증하는 **화이트박스 알고리즘**을 별도 파일로 분리했습니다. 단순한 플래그 체크가 아닌, 실제 지형 데이터(`gridData`)를 순회하여 조건을 판별하는 구조입니다.

---

#### 2-1. 이벤트 대기열(Event Queue) 시스템

**[목적]** 여러 미션 결과 알림이 동시에 발생할 때 서사 흐름을 깨지 않도록 메시지를 순차 재생합니다.

* `enqueueEvent(msg, duration)` — 메시지를 대기열에 추가, 재생 중이 아니면 즉시 시작
* `playNextEvent()` — 대기열에서 메시지를 하나씩 꺼내 `toast()`로 표시, 다음 메시지는 `duration` ms 후에 재생
* `alert(msg)` — 이벤트 재생 중이면 알림을 콘솔에만 기록하고 화면 노출 차단 (서사 방해 방지)

---

#### 2-2. A. 외래종 격리 연못 검증 — Flood Fill 알고리즘 (`checkIsolationLoop`)

**[게임 시나리오]** 플레이어가 흙/돌 블록으로 울타리를 쌓아 황소개구리를 가두면 격리 성공으로 판정합니다.

**[알고리즘]**
1. 전체 월드 좌표(`80×80`)를 순회하며 빈 공간(벽이 아닌 셀)에서 **BFS Flood Fill** 시작
2. 탐색 중 맵 경계(x=0, z=0 등)에 닿으면 `isClosed = false` — 열린 공간으로 분류
3. 경계에 닿지 않고 탐색이 끝나면 **폐곡선 영역**으로 인정

**[유효 연못 조건 4가지]**
* 경계 블록이 흙(`dirt`) 또는 돌(`stone`) 계열인가
* 내부 빈 공간이 최소 4칸 이상인가
* 황소개구리(`bullfrog`)가 내부에 존재하는가
* 토착종(`toad` / `salamander`)이 함께 갇히지 않았는가 (함께 있으면 경고 토스트)

**[결과]** 모든 조건 충족 시 `level2_conditions.bullfrogIsolated = true`, `level2_phase → 3` 이행

---

#### 2-3. B. 수달 영입 물길 검증 — BFS 경로 탐색 (`checkWaterFlow`)

**[게임 시나리오]** 막힌 흙을 파내어 수원지에서 수달의 서식지까지 물길이 이어지면 수달이 합류합니다.

**[알고리즘]**
* 수원지 `(10, 10)` → 목표 지점 `(40, 40)` 까지 BFS 탐색
* 이동 가능 조건: `getTopY(x,z) < WATER_LEVEL` (수위 이하) **AND** 해당 블록이 고체가 아닐 것
* 경로가 연결되면 `global_protectors.otter = true`, 수달 합류 이벤트 대기열 등록

---

#### 2-4. C. 황금박쥐 영입 광원 차단 검증 (`checkCaveLightLevel`)

**[게임 시나리오]** 동굴 천장의 구멍을 모두 막아 빛을 완전히 차단해야 황금박쥐가 깨어납니다.

**[알고리즘]**
* 동굴 천장 구역 `x: 50~55, z: 50~55, y: 40` 좌표 전체 스캔
* 해당 Y 위치에 `stone` 또는 `dirt` 블록이 없으면 **빛 누출**로 카운트 (`lightLevel++`)
* `lightLevel === 0`이면 완전 암흑 달성 → `global_protectors.bat = true`, 황금박쥐 합류 이벤트 등록

---

### 3. 화이트박스 테스트 스폰 함수 추가 (`js/world.js`)

**[작업 내용]**
* `spawnLevel2WhiteBoxElements()` 함수 추가
* 검증 알고리즘 단독 테스트를 위한 색상 큐브 플레이스홀더 4종 생성:

  | 동물 | 색상 | 좌표 | `animalData` 타입 |
  |---|---|---|---|
  | 황소개구리 (외래종) | 빨강 | `(20, 20)` | `'bullfrog'` |
  | 두꺼비 두꾸 (토착종) | 초록 | `(22, 22)` | `'toad'` |
  | 수달 | 파랑 | `(40, 40)` | `'otter'` |
  | 새끼 황금박쥐 | 보라 | `(52, 38, 52)` | `'bat'` |

* 각 오브젝트는 `animalData` 배열에 `{ type, x, y, z, group }` 형태로 등록되어 `Level2Logic.getAnimalsAt(x, z)` 조회에 즉시 반응합니다.

---

### 4. 레벨 2 시나리오 확정 (`Scenario/AA Story.md`)

**[테마]** 서식지와 생물 다양성 — 세 개의 생태계가 맞닿은 숲

**[등장 동물 2종]**
* **두꺼비 두꾸** — 바위틈에서 발견된 토착 두꺼비, 습지로 이동 필요
* **새끼 황금박쥐 밤이** — 동굴 입구 빛 노출로 수면 장애 발생

**[수호대 영입 2종]**
* **수달 🦦** (환경 조성형 A) — 막힌 흙 파내어 수달 서식지까지 물길 연결
* **황금박쥐 🦇** (구출형 B) — 동굴 천장 전체를 돌 블록으로 막아 완전 암흑 달성

**[보스 챌린지]** 황소개구리 vs. 외래 붉은귀거북 격리 연못 완성도 판정

**[레벨 2 클리어 조건]** 수달 + 황금박쥐 합류 완료 (누적 수호대 5/12)

---

### 5. 현재 통합 상태 및 다음 단계

**[현황]**
* `Level2Logic.js`의 검증 알고리즘은 독립 실행 가능한 화이트박스 상태로 완성
* `state.js`의 상태 변수 및 `world.js`의 테스트 스폰 함수 준비 완료
* **미완료:** `Level2Logic.js`가 아직 `systems.js` / `main.js` / `ui.js`의 게임 루프에 연결되지 않음

**[다음 작업]**
* `Level2Manager` 구현 및 `QuestManager.levels[2]`에 등록
* `onBlockPlaced()` 훅에 `Level2Logic.checkIsolationLoop()` / `checkWaterFlow()` / `checkCaveLightLevel()` 연결
* 레벨 2 전용 NPC 대사 및 수호대 UI 슬롯 추가 (otter, bat)
* 3D 동물 모델(`buildAnimal('bullfrog')`, `buildAnimal('toad')` 등) 제작

---

## 📅 2026-05-07 (수정 지시서 #1 — Level2Logic 함수 호출 연결)

> **작업 배경**
> `Level2Logic.js`에 검증 함수 3종(`checkIsolationLoop`, `checkWaterFlow`, `checkCaveLightLevel`)이 완성되어 있었으나, 게임 루프 어디에서도 호출되지 않아 블록을 아무리 쌓거나 파내도 레벨 2 조건이 절대 달성되지 않는 상태였습니다. `systems.js`와 `world.js` 두 파일만 수정하여 연결 고리를 완성했습니다.

---

### 1. 레벨 2 조건 검사 훅 연결 (`js/systems.js`)

**[작업 내용]**

#### 디바운스 타이머 추가
* `_l2IsolationTimer` 변수와 `_scheduleIsolationCheck()` 함수 신설
* `checkIsolationLoop`는 전체 월드 BFS Flood Fill로 연산 비용이 크므로, 블록 조작 이벤트가 연속 발생할 때 **500ms 디바운스**를 적용하여 마지막 조작 후 한 번만 실행하도록 처리

#### `onBlockPlaced()` 레벨 2 분기 추가
* 기존 레벨 1 로직(꿀벌·제비·양 조건 검사)은 그대로 유지
* `currentLevel === 2 && typeof Level2Logic !== 'undefined'` 조건 하에 레벨 2 분기 실행:

  | 블록 타입 | 호출 함수 | 이유 |
  |---|---|---|
  | `dirt` / `stone` / `t_*` / `r_*` | `_scheduleIsolationCheck()` | 격리 연못 벽 쌓기 감지 (디바운스 적용) |
  | 모든 블록 | `checkWaterFlow()` | 블록 설치로 물길 상태가 바뀔 수 있음 |
  | `stone` / `dirt` | `checkCaveLightLevel()` | 동굴 천장 채우기 감지 |

#### `onBlockRemoved()` 신규 함수 추가
* 블록 **제거** 시에도 동일한 레벨 2 조건을 재검사할 필요가 있으나, 기존 `onBlockPlaced()` 훅으로는 커버 불가
* `onBlockRemoved(blockType)` 함수를 신설하여 파내는 동작도 조건 판별에 포함:
  * `dirt`/`stone`/`t_*`/`r_*` 제거 → `_scheduleIsolationCheck()` (격리 벽이 허물어졌을 수 있음)
  * 모든 블록 제거 → `checkWaterFlow()` (막힌 흙 파내면 물길 열림)
  * 모든 블록 제거 → `checkCaveLightLevel()` (천장 블록 제거로 빛 누출 발생 가능)

---

### 2. 블록 제거 시 훅 호출 연결 (`js/world.js`)

**[배경]**
* `removeBlock()` 함수가 블록을 `gridData`에서 삭제하기 때문에, 삭제 후에는 어떤 타입이었는지 알 수 없습니다. `onBlockRemoved`에 타입을 전달하려면 **삭제 전에 미리 저장**해야 합니다.

**[작업 내용]**
* `removeBlock()` 첫 줄에 `const removedType = gridData[k];` 추가 — `delete gridData[k]` 실행 전에 타입 보존
* `QuestManager.check()` 직후 `if (typeof onBlockRemoved === 'function') onBlockRemoved(removedType);` 1줄 추가
* 기존 로직(메시 제거 → 인접 블록 복구 → `QuestManager.check()`)은 **변경 없음**

---

### 3. 수정 범위 요약

| 파일 | 변경 내용 |
|---|---|
| `systems.js` | `_l2IsolationTimer` 변수 + `_scheduleIsolationCheck()` 함수 추가 / `onBlockPlaced()` 레벨 2 분기 추가 / `onBlockRemoved()` 신규 함수 추가 |
| `world.js` | `removeBlock()` 내 `removedType` 저장 변수 추가 + 마지막 줄 `onBlockRemoved()` 호출 1줄 추가 |

---

### 4. 이후 과제

* `Level2Manager` 구현 및 `QuestManager.levels[2]`에 등록 (레벨 2 퀘스트 라우팅)
* 레벨 2 전용 NPC 대사 및 수호대 UI 슬롯 추가 (`otter`, `bat`)
* 3D 동물 모델(`buildAnimal('bullfrog')`, `buildAnimal('toad')` 등) 제작
* `index.html`의 `<script>` 로드 순서에 `Level2Logic.js` 포함 여부 최종 확인

---

---

## 📅 2026-05-08 (레벨 2 — Level2Manager 전체 구현 및 게임 루프 완전 통합)

> **작업 배경**
> 2026-05-07에 `Level2Logic.js`의 검증 함수 3종이 `onBlockPlaced/Removed` 훅에 연결되었으나, `Level2Manager` 자체가 미구현 상태라 미션 패널·화살표 안내·두꾸 구출 퀘스트가 전혀 작동하지 않았습니다. `Level2Manager`를 `Level2Logic.js`에 완전 구현하고, 게임의 모든 루프(렌더, 클릭, 스폰, UI)에 통합했습니다.

---

### 1. `Level2Manager` 전체 구현 (`js/Level2Logic.js`)

**[배경]**
* `QuestManager.levels[2]`에 등록할 레벨 2 미션 관리 객체가 없어 `currentLevel`이 2가 되어도 퀘스트가 전혀 시작되지 않았습니다.

**[작업 내용]**

#### `init()` — 레벨 2 진입 시 최초 1회 호출
* `level2_phase = 1`, 모든 조건 초기화, `missionGuided` 리셋
* `#nav-compass` 나침반 표시
* 2.5초·5.5초 딜레이로 두꾸 구출 안내 토스트 시퀀스 출력 후 `_showToadArrowAndMarker()` 호출

#### `_showToadArrowAndMarker()` — 두꾸 시각 안내
* 두꾸(`toad`) `animalData` 위치를 추적하는 **황금 하강 화살표** 생성 (Scene에 추가)
* 목표 습지(`TOAD_TARGET: {x:72, z:8}`)에 **파란 반투명 마커** + `🌊` 이모지 스프라이트 라벨 생성

#### `updateArrows(t)` — 매 프레임 화살표 추적
* 두꾸 화살표: `animalData`의 두꾸 현재 위치로 실시간 추적 이동
* 황소개구리 화살표: 상하 bob 애니메이션
* 수달·박쥐 화살표: 영입 완료 시 자동 제거
* `_updateNavCompass()` 호출 — 카메라 방향 기준으로 목적지 화살표 회전각 계산

#### `_updateNavCompass()` — 화면 내 방향 나침반
* `diversity_forest` 바이옴 중심(`X=80, Z=0`)까지 거리 계산
* 반경 30 이내 진입 시 "도착" 상태로 전환 (`nc-nearby` CSS 클래스)
* 카메라 `forward`·`right` 벡터 내적으로 목적지 스크린 방향 투영 → `⬆️` 화살표 회전

#### `onToadDropped(x, z)` — 두꾸 내려놓기 감지
* `TOAD_TARGET` 중심 ±3칸 내에 두꾸를 내려놓으면 `toadRescued = true`, `level2_phase = 2`
* 마커/화살표 정리 후 Phase 2 미션(황소개구리 격리·수달·박쥐) 안내 토스트 시퀀스 출력
* `_showBullfrogZone()`, `_showOtterArrow()`, `_showBatArrow()` 연속 호출
* 범위 밖이면 "파란 마커에 내려놓으세요" 힌트 출력

#### `_showBullfrogZone()` — 황소개구리 격리 구역 시각화
* 황소개구리 위에 **빨간 하강 화살표** 생성
* 격리 구역 반경 R=4 코너에 **오렌지 기둥 4개** 생성
* 격리 구역 바닥에 반투명 오렌지 사각형 표시

#### `_showAnimalArrow()` / `_showOtterArrow()` / `_showBatArrow()` — 공통 화살표 헬퍼
* 동물 위에 색상 지정 화살표(`ConeGeometry`) + 이모지 스프라이트 라벨 생성
* 수달: 파란(🦦) / 박쥐: 보라(🦇)

#### `check()` / `_checkLevelClear()` — 클리어 조건 판별
* 수달(`global_protectors.otter`) + 박쥐(`global_protectors.bat`) + 황소개구리 격리(`bullfrogIsolated`) 3조건 모두 `true` → `level2Cleared` 커스텀 이벤트 발행
* 클리어 후 나침반·모든 화살표 자동 정리

#### `updateUI()` — 미션 패널 갱신
* 두꾸 구출(튜토리얼) / 외래종 격리 / 수달 영입 / 박쥐 영입 4단계 진행 상태를 `done`/진행 중 스타일로 실시간 표시

#### IIFE 자동 등록
```javascript
QuestManager.levels[2] = Level2Manager;
```
* `level2Cleared` 이벤트 리스너: 2초 후 `#level2-clear` 클리어 화면 표시

---

### 2. `checkWaterFlow()` 리팩토링 (`js/Level2Logic.js`)

**[배경]**
* 기존 BFS 수위(baseHeight > WATER_LEVEL) 방식은 지형 높이 편차로 경로 탐색이 의도대로 동작하지 않았습니다.

**[작업 내용]**
* BFS 기반 경로 탐색 알고리즘 폐기
* `spawnLevel2WhiteBoxElements()`가 배치한 **댐 블록 3개**(`waterDamCells`)가 모두 제거됐는지 직접 확인하는 방식으로 대체
* `level2_conditions.waterDamPlaced`가 `false`이면 즉시 종료 (스폰 전 호출 방지)

---

### 3. `spawnLevel2WhiteBoxElements()` 실제 동물 스폰으로 개선 (`js/world.js`)

**[배경]**
* 이전 버전은 색상 큐브 플레이스홀더로만 구성되어 있었습니다.

**[작업 내용]**
* 색상 큐브 → `placeAnimal()` 호출로 실제 3D 동물 모델 스폰:

  | 동물 | 좌표 | 역할 |
  |---|---|---|
  | 황소개구리(`bullfrog`) | `(70, 12)` | 외래종 격리 대상 |
  | 두꺼비 두꾸(`toad`) | `(88, -8)` | 구출 대상 (숲 동쪽 바위지대) |
  | 수달(`otter`) | `(65, 10)` | 수호대 영입 대상 (숲 서쪽 강가) |
  | 황금박쥐(`bat`) | `(92, -10)` | 수호대 영입 대상 (북동쪽 동굴) |

* **수달 댐 블록 자동 배치:** `x=58` 라인 `z=13/14/15` 3칸에 `dirt` 블록 설치 → `waterDamCells`에 좌표(Y 포함) 저장, `waterDamPlaced = true`
* **박쥐 동굴 석벽 자동 생성:** `(92, -10)` 중심 3×3 외곽 2층에 `stone` 블록 설치 — 천장 9칸(3×3, ROOF_Y 레이어)은 비워두어 플레이어가 채우도록 설계

---

### 4. 신규 3D 동물 모델 4종 추가 (`js/world.js` `buildAnimal()`)

**[작업 내용]**
* **황소개구리(`bullfrog`):** 올리브 넓적 몸통 + 볼록 눈 2개 + 다리 4개
* **두꺼비(`toad`):** 갈색 소형 몸통 + 등 혹 3개 + 볼록 눈
* **수달(`otter`):** 긴 갈색 몸통 + 납작 꼬리 + 크림색 배 + 주둥이
* **박쥐(`bat`):** `updateBat()`으로 동굴 내 고정 위치 미세 흔들림 애니메이션

**신규 AI 함수:**
* `updateFrog(a, t)` — 5~9초마다 랜덤 방향 이동, 지형 높이 추적
* `updateBat(a, t)` — 동굴 내 sin 진동 + 느린 회전

---

### 5. 게임 루프 통합 (`js/main.js`)

**[작업 내용]**
1. **`animate()` 루프 연결:** `currentLevel === 2` 조건 하에 `Level2Manager.updateArrows(t)` 호출 — 매 프레임 화살표 위치 및 나침반 갱신
2. **`putAnimal()` 두꾸 감지:** 동물을 내려놓을 때 `entry.type === 'toad'`이면 `Level2Manager.onToadDropped(x, z)` 호출하여 미션 전환 트리거

---

### 6. 레벨 2 UI 요소 추가 (`index.html` / `css/style.css`)

**[작업 내용]**
* **`#nav-compass` 나침반:** 화면 좌측 중앙 고정. 목적지 방향·거리 표시. `nc-nearby` 도착 상태 시 초록 테두리 pulse 애니메이션. 레벨 2 입장 시 `Level2Manager.init()`에서 표시, 클리어 시 숨김.
* **`#level2-clear` 클리어 화면:** 🐸🦦🦇 아이콘 + 완료 메시지 + "레벨 3: 연결의 평원 →" 버튼 (`window.startLevel3()`)
* **`Level2Logic.js` 스크립트 로드:** `systems.js`, `Level1Logic.js` 이후 로드 순서 확정 (`?v=20260507`)

---

### 7. `state.js` 레벨 2 상태 변수 보완

**[작업 내용]**
* `level2_conditions`에 필드 2개 추가:
  * `waterDamPlaced: false` — 댐 블록 배치 완료 여부 (스폰 전 `checkWaterFlow` 조기 종료용)
  * `waterDamCells: []` — 실제 배치된 댐 블록 좌표 배열 `[{x, y, z}]`

---

### 8. 수정 범위 요약

| 파일 | 주요 변경 내용 |
|---|---|
| `Level2Logic.js` | `Level2Manager` 전체 구현 + `checkWaterFlow` 리팩토링 + `QuestManager.levels[2]` 등록 |
| `world.js` | `spawnLevel2WhiteBoxElements()` 실제 동물 스폰 + 댐/동굴 지형 생성 + `buildAnimal()` 4종 추가 + AI 함수 2개 추가 |
| `main.js` | `animate()` 루프 `updateArrows` 연결 + `putAnimal()` 두꾸 감지 훅 |
| `state.js` | `level2_conditions.waterDamPlaced/Cells` 필드 추가 |
| `index.html` | `#nav-compass` + `#level2-clear` + `Level2Logic.js` 로드 추가 |
| `css/style.css` | 나침반 CSS 스타일 (`nc-*` 클래스, `nc-pulse` 애니메이션) |

---

---

## 📅 2026-05-08 (버그 수정 #1 — 블랙스크린 · 수달 미션 두 버그)

> **작업 배경**
> Level2Manager 통합 작업 직후 화면이 완전히 검게 나오는 현상이 발생했습니다. 원인을 규명하고 수달 물길 미션에서 보고된 두 가지 추가 버그도 함께 수정했습니다.

---

### 1. 블랙스크린 — `Level1Logic.js` 템플릿 리터럴 구문 오류 3건 수정

**[증상]**
* 리팩토링 직후 `index.html`을 열면 Three.js 씬이 초기화되지 않아 캔버스 전체가 검은 화면.

**[원인 규명]**
* `node --check js/Level1Logic.js` 실행 결과 **891번째 줄 `SyntaxError: missing ) after argument list`** 발생.
* `_makeOverlay(\`...\`)` 호출에서 템플릿 리터럴 닫는 백틱 뒤에 함수 호출 닫는 `)` 3곳이 누락된 상태였습니다.

**[수정 위치 및 내용]** (`js/Level1Logic.js`)

| 위치 | 함수 | 수정 내용 |
|---|---|---|
| 약 893번째 줄 | `Phase2System._showFlowerUI()` | `` `...취소</button>` `` → `` `...취소</button>`) `` |
| 약 1133번째 줄 | `Phase3System._showFirstAidPopup()` | `` `...취소</button>` `` → `` `...취소</button>`) `` |
| 약 1159번째 줄 | `Phase3System._showHoofPopup()` | `` `...닫기</button>` `` → `` `...닫기</button>`) `` |

**[검증]**
* 수정 후 8개 JS 파일 전체 `node --check` 통과.
* `Level1Logic.js`가 파싱 실패하면 이후 `world.js`, `ui.js`, `main.js`가 모두 실행되지 않아 Three.js 씬이 초기화되지 않는 구조적 취약점 확인 → 의도적으로 파일 로드 순서를 지킬 것.

---

### 2. 수달 물길 미션 — `terrainOverviewMesh` 가 블록 채굴을 방해하는 버그 수정

**[증상]**
* 수달 영입을 위해 물길 댐 블록을 삽으로 파 내려가면, 첫 블록 제거 후 그 아래부터 클릭해도 아무 반응이 없음. 내려다보면 메쉬 면이 구멍 속을 채우고 있는 것처럼 보임.

**[원인 규명]**
* `buildTerrainOverview()`가 생성하는 `terrainOverviewMesh`는 지형 전역을 덮는 삼각형 메쉬로, 각 버텍스를 **`h + 0.5`** (지표면 블록 중심 높이)에 배치합니다.
* 블록이 있을 때는 블록 내부에 묻혀 보이지 않지만, **블록을 제거하면 메쉬 면이 구멍 속에 노출**됩니다.
* `terrainOverviewMesh`는 `getRayTargets()`에 포함되지 않으므로 클릭 시 레이가 통과해야 하지만, 카메라 기울기 때문에 레이가 메쉬 면(`h+0.5`)을 통과한 뒤 그 바로 아래 블록의 윗면(`h`)을 비스듬히 스쳐 **지면 메쉬(y=−0.01)에 떨어집니다**. 지면 클릭은 곡괭이 모드에서 아무 동작도 하지 않으므로 채굴이 불가능해 보임.

**[수정]** (`js/world.js:228`)
```javascript
// 수정 전
terrainOverviewMesh = new THREE.Mesh(geo, terrainOverviewMat);
terrainOverviewMesh.receiveShadow = true;
scene.add(terrainOverviewMesh);

// 수정 후
terrainOverviewMesh = new THREE.Mesh(geo, terrainOverviewMat);
terrainOverviewMesh.receiveShadow = true;
terrainOverviewMesh.visible = false;   // ← 게임플레이 중 숨김
scene.add(terrainOverviewMesh);
```
* `terrainOverviewMesh`는 씬에 유지하되 기본 비표시로 변경. 추후 미니맵/줌아웃 뷰에서만 표시 가능.

---

### 3. 수달 물길 미션 — 수달 위치가 강에서 너무 멀어 미션 체감 난이도가 과도한 버그 수정

**[증상]**
* 수달이 `(65, 10)`에 스폰되어 댐 블록(`x=58, z=13~15`)까지 직선거리 약 8칸. 두 지점 사이에 지형 블록이 쌓여 있어 실제로 물길을 판다는 느낌을 주기 어려웠고, 어떤 블록을 제거해야 할지 시각적으로 불분명했습니다.

**[수정]** (`js/world.js:1234`)
```javascript
// 수정 전
const otX = 65, otZ = 10;   // 댐에서 ~8칸 떨어진 숲 서쪽

// 수정 후
const otX = 62, otZ = 14;   // 댐(x=58) 바로 동쪽 4칸 — 하류 지점
```
* 수달이 댐 블록 바로 옆에 위치해 "이 댐을 제거하면 물이 수달에게 흐른다"는 인과관계를 직관적으로 전달.
* `checkWaterFlow()` 로직(댐 블록 3개 제거 여부 확인)은 위치 독립적이므로 별도 수정 불필요.

---

### 4. 수정 범위 요약 (버그 수정 #1)

| 파일 | 주요 변경 내용 |
|---|---|
| `Level1Logic.js` | `_makeOverlay()` 호출 닫는 `)` 3곳 추가 — 파싱 오류 / 블랙스크린 수정 |
| `world.js` | `terrainOverviewMesh.visible = false` 추가 — 채굴 방해 메쉬 숨김 |
| `world.js` | 수달 스폰 좌표 `(65,10)` → `(62,14)` 변경 — 댐 근접 배치 |
| `index.html` | `world.js` 버전 쿼리 `v=20260506` → `v=20260508` 캐시 무효화 |

---

---

## 📅 2026-05-08 (버그 수정 #2 — 수달 미션 안내 부재 · init 리셋 오류 · 조기 합류 오탐)

> **작업 배경**
> 버그 수정 #1 이후에도 수달 물길 미션에서 세 가지 추가 문제가 발견되었습니다: 댐 블록 위치가 시각적으로 표시되지 않아 플레이어가 어디를 파야 할지 몰랐고, `Level2Manager.init()`이 댐 데이터를 덮어써 미션이 클리어되지 않았으며, 저장/불러오기 시 수달이 조건 없이 합류하는 오탐이 발생했습니다.

---

### 1. 댐 블록 위치 시각 안내 미표시 — `_showDamMarkers()` 추가 (`js/Level2Logic.js`)

**[증상]**
* Phase 2 진입 후 수달 위치에 파란 화살표는 표시되지만, 실제로 파야 할 댐 흙 블록 3개 위에는 아무런 시각적 표시가 없어 플레이어가 어느 블록을 제거해야 하는지 알 수 없었습니다.

**[작업 내용]**

`Level2Manager`에 댐 마커 시스템 추가:

```javascript
_damArrows: [],  // 댐 블록 위 화살표 배열

_showDamMarkers()   // waterDamCells 좌표를 읽어 각 댐 블록 위에
                    // 청록색(0x00CCFF) 하강 화살표 + ⛏️ 이모지 스프라이트 생성

_clearDamMarkers()  // 수달 합류 시 또는 명시적 정리 시 제거
```

* `_showOtterArrow()` 직후 `_showDamMarkers()` 호출 — Phase 2 시작 4.5초 후 동시 표시
* `updateArrows()` 루프에서 댐 화살표 sin 상하 애니메이션 + 수달 합류 시 자동 제거
* 안내 토스트 메시지를 `"청록색(⛏️) 화살표가 가리키는 흙 블록 3개를 삽으로 파내세요!"` 로 구체화
* `index.html` `Level2Logic.js` 버전 쿼리 `v=20260507` → `v=20260508` 갱신

---

### 2. `Level2Manager.init()`이 댐 상태를 덮어쓰는 버그 수정 (`js/Level2Logic.js`)

**[증상]**
* 삽으로 댐 흙 블록 3개를 모두 제거해도 수달이 합류하지 않음.

**[원인]**
```
spawnLevel2WhiteBoxElements()  →  waterDamCells = [...], waterDamPlaced = true  ← 설정
Level2Manager.init()           →  waterDamCells = [],   waterDamPlaced = false  ← 덮어씀 ❌
```
`checkWaterFlow()`가 `!waterDamPlaced` 가드에 걸려 항상 조기 리턴.

**[수정]**
```javascript
// 수정 전
level2_conditions.waterDamPlaced = false;
level2_conditions.waterDamCells  = [];

// 수정 후
// waterDamPlaced / waterDamCells 는 spawnLevel2WhiteBoxElements()가
// init() 직전에 설정하므로 여기서 덮어쓰지 않는다
```
* `_showDamMarkers()` 도 `waterDamCells` 를 직접 읽으므로 빈 배열 상태에서 호출되던 문제가 함께 해결됨.

---

### 3. 저장/불러오기 시 수달 조기 합류 오탐 수정 (`js/Level2Logic.js`)

**[증상]**
* 게임을 저장했다 불러오면 댐 블록을 파지 않았는데도 "막혔던 물길이 뚫려 수달 수리가 합류했습니다!" 메시지가 즉시 출력됨.

**[원인]** — 저장/불러오기 타이밍 경쟁 조건
```
① level2_conditions 복원: waterDamPlaced = true, waterDamCells = [{x:58,y:29,z:13},...]
② activateChunk() 실행:   지형 gridData 채워짐 (댐 위치 y=29는 비어있음)
③ _place() 루프 첫 블록:  onBlockPlaced → checkWaterFlow() 호출
   gridData['58,29,13'] = undefined  →  undefined !== 'dirt' = true  ✓(오탐)
   3개 모두 오탐 → cleared = true → 수달 즉시 합류 ❌
```

**[수정]** `checkWaterFlow()` 판단 기준을 `gridData` → `deletedBlocks` 로 변경

```javascript
// 수정 전 — gridData 기반 (블록 미복원 상태에서 오탐)
const cleared = level2_conditions.waterDamCells.every(({ x, y, z }) =>
    gridData[bk(x, y, z)] !== 'dirt'
);

// 수정 후 — deletedBlocks 기반 (명시적 제거 기록만 신뢰)
const cleared = level2_conditions.waterDamCells.every(({ x, y, z }) =>
    deletedBlocks.has(bk(x, y, z))
);
```

**`deletedBlocks` 의 특성:**
* 저장 데이터에서 `level2_conditions` 보다 먼저 복원됨
* `_place()` 가 `deletedBlocks.delete(k)` 호출 → 블록 배치 시 기록 제거
* `removeBlock()` 가 `deletedBlocks.add(k)` 호출 → 블록 제거 시 기록 추가
* 따라서 **"삽으로 파낸 블록"만** 포함하는 명확한 기준 제공

| 상황 | deletedBlocks 기준 결과 |
|---|---|
| 저장/불러오기 직후 (댐 미제거) | 세 키 없음 → `cleared = false` ✓ |
| 삽으로 3개 모두 제거 후 | 세 키 있음 → `cleared = true` → 수달 합류 ✓ |
| 게임 새로 시작 (초기화) | `_place()` 가 키 삭제 → 없음 → `cleared = false` ✓ |

---

### 4. 수정 범위 요약 (버그 수정 #2)

| 파일 | 주요 변경 내용 |
|---|---|
| `Level2Logic.js` | `_damArrows`, `_showDamMarkers()`, `_clearDamMarkers()` 추가 |
| `Level2Logic.js` | `updateArrows()` 댐 화살표 애니메이션/자동정리 추가 |
| `Level2Logic.js` | `init()` 내 `waterDamPlaced/Cells` 리셋 제거 |
| `Level2Logic.js` | `checkWaterFlow()` 판단 기준 `gridData` → `deletedBlocks` 변경 |
| `index.html` | `Level2Logic.js` 버전 쿼리 `v=20260507` → `v=20260508` 갱신 |

---

*(이후 새로운 작업이나 문제 해결이 발생할 때마다 이 파일에 날짜/주제별로 누적 기록됩니다.)*
