// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2: 다양성의 숲 — 핵심 검증 알고리즘 + 미션 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── 이벤트 큐 & 알림 시스템 ───────────────────────
const Level2Logic = {
    eventQueue: [],
    isEventPlaying: false,

    enqueueEvent(eventMsg, duration = 3000) {
        this.eventQueue.push({ msg: eventMsg, duration });
        if (!this.isEventPlaying) this.playNextEvent();
    },

    playNextEvent() {
        if (this.eventQueue.length === 0) { this.isEventPlaying = false; return; }
        this.isEventPlaying = true;
        const ev = this.eventQueue.shift();
        DBG(`[이벤트] ${ev.msg}`);
        if (typeof toast === 'function') toast(`🌿 ${ev.msg}`);
        setTimeout(() => this.playNextEvent(), ev.duration);
    },

    alert(msg) {
        DBG(`[경고] ${msg}`);
        if (typeof toast === 'function') toast(`⚠️ ${msg}`);
    },

    // 유틸: 특정 좌표의 동물 배열
    getAnimalsAt(x, z) {
        return animalData.filter(a => Math.round(a.x) === x && Math.round(a.z) === z);
    },

    // ──────────────────────────────────────────────
    // A. 외래종 격리 연못 검증 (황소개구리 중심 BFS)
    // ──────────────────────────────────────────────
    // 황소개구리 위치에서 BFS로 연결된 빈 공간 탐색.
    // 탐색이 MAX_CELLS 이내 종료 = 황소개구리가 블록으로 둘러싸임 = 격리 성공
    checkIsolationLoop() {
        if (level2_conditions.bullfrogIsolated) return;

        const bfEntry = animalData.find(a => a.type === 'bullfrog');
        if (!bfEntry) { console.warn('[Level2] 황소개구리 없음'); return; }

        const startX = Math.round(bfEntry.x);
        const startZ = Math.round(bfEntry.z);

        const visited = new Set();
        const queue = [[startX, startZ]];
        visited.add(`${startX},${startZ}`);
        let containsNative = false;
        const MAX_CELLS = 150; // 이 이상이면 개방된 것으로 간주

        while (queue.length > 0) {
            if (visited.size > MAX_CELLS) return; // 아직 갇히지 않음

            const [cx, cz] = queue.shift();

            // 토착종 동반 여부 확인
            for (const a of this.getAnimalsAt(cx, cz)) {
                if (a.type === 'toad' || a.type === 'salamander') containsNative = true;
            }

            const curTopY = getTopY(cx, cz) - 1;
            for (const [nx, nz] of [[cx+1,cz],[cx-1,cz],[cx,cz+1],[cx,cz-1]]) {
                const nKey = `${nx},${nz}`;
                if (visited.has(nKey)) continue;

                // 비활성 청크(gridData 미로드)는 벽으로 취급 → BFS 무한 팽창 방지
                const blocked = !isActive(nx, nz) || [0, 1].some(hy => {
                    const b = gridData[bk(nx, curTopY + 1 + hy, nz)];
                    return isSolid(b);
                });
                if (!blocked) { visited.add(nKey); queue.push([nx, nz]); }
            }
        }

        // BFS가 MAX_CELLS 이내 종료 → 황소개구리가 갇혀 있음!
        if (visited.size < 4) {
            this.alert('격리 공간이 너무 좁아요! (최소 4칸 필요)');
            return;
        }
        if (containsNative) {
            this.alert('⚠️ 토착종이 외래종과 함께 갇혀있어요! 다시 확인해 주세요.');
            return;
        }

        // 격리 성공!
        level2_conditions.bullfrogIsolated = true;
        this.enqueueEvent('🐸 황소개구리가 성공적으로 격리되었어요!', 4000);
        Level2Manager._clearBullfrogZone();
        if (level2_phase === 2) {
            level2_phase = 3;
            this.enqueueEvent('🎉 외래종 격리 미션 완료!', 3000);
        }
        Level2Manager.check();
    },

    // ──────────────────────────────────────────────
    // B. 수달 영입 — 댐 블록(흙) 제거 검증
    // ──────────────────────────────────────────────
    // spawnLevel2WhiteBoxElements()가 배치한 3개의 흙 댐 블록이
    // 모두 삽으로 제거됐는지 확인한다. (BFS 지형 높이 방식은 baseHeight>waterLevel 문제로 폐기)
    checkWaterFlow() {
        if (global_protectors.otter) return;
        if (!level2_conditions.waterDamPlaced) return;

        // gridData 부재(=블록 미복원 중)가 아닌 deletedBlocks 기록을 기준으로 판단.
        // 저장/불러오기 시 gridData가 아직 채워지지 않아 undefined != 'dirt'가
        // 되는 오탐(false-positive)을 방지한다.
        const cleared = level2_conditions.waterDamCells.every(({ x, y, z }) =>
            deletedBlocks.has(bk(x, y, z))
        );

        if (cleared) {
            global_protectors.otter = true;
            this.enqueueEvent('🌊 막혔던 물길이 뚫려 수달 수리가 합류했습니다!', 4000);
            if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('otter', 3);
            if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
            Level2Manager.check();
        }
    },

    // ──────────────────────────────────────────────
    // C. 박쥐 영입 — 동굴 천장 석재 차단 검증
    // ──────────────────────────────────────────────
    // spawnLevel2WhiteBoxElements()가 3×3 동굴 석벽(천장 제외)을 생성함.
    // 플레이어가 ROOF_Y(지표+3) 레이어 3×3칸을 돌/흙으로 채우면 달성.
    checkCaveLightLevel() {
        if (global_protectors.bat) return;

        const CX = 92, CZ = -10;
        const ROOF_Y = Math.round(getH(CX, CZ)) + 3;

        let lightLevel = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const block = gridData[bk(CX + dx, ROOF_Y, CZ + dz)];
                if (!block || (!block.startsWith('stone') && !block.startsWith('dirt'))) {
                    lightLevel++;
                }
            }
        }

        if (lightLevel === 0) {
            global_protectors.bat = true;
            this.enqueueEvent('🦇 동굴이 완전히 어두워져 황금박쥐 금비가 깨어납니다!', 4000);
            if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('bat', 3);
            if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
            Level2Manager.check();
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2 미션 관리자 (QuestManager.levels[2]에 등록됨)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Level2Manager = {
    currentPhase: 0,
    phaseComplete: {},
    missionGuided: false,

    // 두꾸 화살표 & 목표 마커 메쉬 참조
    _toadArrow: null,
    _targetMarker: null,
    // 황소개구리 격리 구역 마커 배열
    _bfZoneMarkers: [],
    // 황소개구리 추적 화살표
    _bfArrow: null,
    // 수달 위치 화살표
    _otterArrow: null,
    // 댐 블록 위치 화살표 배열
    _damArrows: [],
    // 박쥐 위치 화살표
    _batArrow: null,

    // 두꾸가 있어야 할 '습지 경계부' 목표 위치 (숲 서쪽 강가)
    TOAD_TARGET: { x: 72, z: 8 },
    // 두꾸 원래 위치 (숲 동쪽 바위지대) ← world.js spawnLevel2WhiteBoxElements와 일치
    TOAD_SPAWN:  { x: 88, z: -8 },

    // ── 레벨 2 진입 시 최초 1회 호출 ──────────────
    init() {
        level2_phase = 1;
        this.currentPhase = 1;
        level2_conditions.bullfrogIsolated = false;
        level2_conditions.toadRescued = false;
        // waterDamPlaced / waterDamCells 는 spawnLevel2WhiteBoxElements()가
        // init() 직전에 설정하므로 여기서 덮어쓰지 않는다
        this.missionGuided = false;
        this.phaseComplete = {};

        DBG('[Level2Manager] init() — 레벨 2 시작');

        // ── 나침반 표시 (diversity_forest 방향 안내) ─
        const compass = document.getElementById('nav-compass');
        if (compass) compass.style.display = 'flex';

        // ── Phase 0: 도감 카드 팝업 ─────────────────
        toast('🌿 [다양성의 숲] 도감 카드를 확인하세요!');

        // ── Phase 1: 두꾸 구출 안내 ─────────────────
        setTimeout(() => {
            toast('🐸 길 잃은 어린 두꺼비 두꾸를 발견했어요! 바위지대에 있는 두꾸(초록 블록)를 클릭해 안아주세요!');
        }, 2500);

        setTimeout(() => {
            toast('💡 두꾸를 안은 뒤, ⬇️ 화살표가 가리키는 습지 경계부(파란 마커)에 내려놓으세요!');
            this._showToadArrowAndMarker();
        }, 5500);

        this.updateUI();
    },

    // ── 두꾸 위치 화살표 + 목표 마커 생성 ─────────
    _showToadArrowAndMarker() {
        // 기존 마커 정리
        this._clearMarkers();

        const toadEntry = animalData.find(a => a.type === 'toad');
        if (!toadEntry) return;

        // 두꾸 위에 깜빡이는 노란 화살표
        const arrowGeo = new THREE.ConeGeometry(0.35, 0.7, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        this._toadArrow = new THREE.Mesh(arrowGeo, arrowMat);
        this._toadArrow.rotation.x = Math.PI; // 아래를 가리킴
        // getH()+1 = 지표면 위, +2.2 = 두꾸 머리 위 공중
        this._toadArrow.position.set(toadEntry.x, getH(toadEntry.x, toadEntry.z) + 1 + 2.2, toadEntry.z);
        this._toadArrow._baseY = this._toadArrow.position.y;
        scene.add(this._toadArrow);

        // 목표 위치(습지 경계부)에 파란 반짝이는 마커
        const markerGeo = new THREE.BoxGeometry(2, 0.15, 2);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00BFFF, transparent: true, opacity: 0.7 });
        this._targetMarker = new THREE.Mesh(markerGeo, markerMat);
        this._targetMarker.position.set(
            this.TOAD_TARGET.x,
            getH(this.TOAD_TARGET.x, this.TOAD_TARGET.z) + 1 + 0.1,  // 지표면 바로 위
            this.TOAD_TARGET.z
        );
        scene.add(this._targetMarker);

        // 마커 위에 「습지」 라벨 스프라이트
        if (typeof createEmojiSprite === 'function') {
            const label = createEmojiSprite('🌊');
            label.position.set(this.TOAD_TARGET.x, getH(this.TOAD_TARGET.x, this.TOAD_TARGET.z) + 1 + 1.2, this.TOAD_TARGET.z);
            label.scale.set(1.5, 1.5, 1);
            label._isL2Label = true;
            scene.add(label);
            this._targetMarker._label = label;
        }
    },

    // ── 매 프레임 화살표 + 나침반 업데이트 ──────────
    updateArrows(t) {
        // 두꾸 추적 화살표
        if (this._toadArrow) {
            const toadEntry = animalData.find(a => a.type === 'toad');
            if (toadEntry) {
                this._toadArrow.position.x = toadEntry.x;
                this._toadArrow.position.z = toadEntry.z;
                // getH()+1 = 지표면, +2.2 = 두꾸 머리 위 높이
                this._toadArrow.position.y = getH(toadEntry.x, toadEntry.z) + 1 + 2.2 + Math.sin(t * 4) * 0.2;
            } else {
                // 들어올리는 중(pickedAnimal이 toad)일 때는 마커 보존
                const isCarryingToad = typeof pickedAnimal !== 'undefined'
                    && pickedAnimal && pickedAnimal.entry && pickedAnimal.entry.type === 'toad';
                if (!isCarryingToad) this._clearMarkers();
            }
        }
        if (this._targetMarker) {
            // depthTest:false로 지형 위에 항상 표시
            if (!this._targetMarker.material._depthFixed) {
                this._targetMarker.material.depthTest = false;
                this._targetMarker.renderOrder = 100;
                this._targetMarker.material._depthFixed = true;
            }
            this._targetMarker.material.opacity = 0.6 + Math.abs(Math.sin(t * 3)) * 0.4;
        }
        // 황소개구리 화살표 애니메이션 (Phase 2 이후)
        if (this._bfArrow) {
            this._bfArrow.position.y = this._bfArrow._baseY + Math.sin(t * 3) * 0.25;
        }
        // 수달 화살표 애니메이션
        if (this._otterArrow) {
            if (global_protectors.otter) {
                // 수달 영입 완료 → 화살표 제거
                if (this._otterArrow._label) scene.remove(this._otterArrow._label);
                scene.remove(this._otterArrow); this._otterArrow = null;
            } else {
                this._otterArrow.position.y = this._otterArrow._baseY + Math.sin(t * 2.8 + 1) * 0.3;
            }
        }
        // 댐 블록 화살표 애니메이션
        if (this._damArrows.length > 0) {
            if (global_protectors.otter) {
                this._clearDamMarkers();
            } else {
                for (let i = 0; i < this._damArrows.length; i++) {
                    const arr = this._damArrows[i];
                    arr.position.y = arr._baseY + Math.sin(t * 3 + i) * 0.25;
                    if (arr._label) arr._label.position.y = arr.position.y + 1.2;
                }
            }
        }
        // 박쥐 화살표 애니메이션
        if (this._batArrow) {
            if (global_protectors.bat) {
                // 박쥐 영입 완료 → 화살표 제거
                if (this._batArrow._label) scene.remove(this._batArrow._label);
                scene.remove(this._batArrow); this._batArrow = null;
            } else {
                this._batArrow.position.y = this._batArrow._baseY + Math.sin(t * 2.5 + 2) * 0.3;
            }
        }
        // 나침반 방향 업데이트
        this._updateNavCompass();
    },


    // ── 화면 우측 나침반 방향 계산 ─────────────────
    // diversity_forest 바이옴 중심: X=80, Z=0 (data.js BIOME_CONFIG 기준)
    _updateNavCompass() {
        const compass  = document.getElementById('nav-compass');
        const arrowEl  = document.getElementById('nav-arrow');
        const distEl   = document.getElementById('nav-dist');
        const hintEl   = document.getElementById('nav-hint');
        if (!compass || !arrowEl) return;

        // 현재 카메라 주시점
        const ox = orbitTarget.x, oz = orbitTarget.z;
        const TX = 80, TZ = 0;  // diversity_forest centerX, centerZ

        const dx = TX - ox, dz = TZ - oz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const distBlocks = Math.round(dist);

        // diversity_forest radius=30 이내 → "도착" 상태
        if (dist < 30) {
            compass.classList.add('nc-nearby');
            arrowEl.textContent = '✅';
            if (distEl) distEl.textContent = '도착!';
            if (hintEl) hintEl.innerHTML = '미지의 영역을<br>클릭해 탐험하세요!';
            arrowEl.style.transform = 'rotate(0deg)';
            return;
        }

        compass.classList.remove('nc-nearby');
        if (distEl) distEl.textContent = `약 ${distBlocks}칸`;
        if (hintEl) hintEl.innerHTML = '이 방향으로<br>탐험하세요!';

        // 카메라 정면 / 우측 벡터 (orbit/first-person 양 모드 호환)
        // ※ 1인칭에선 camera.position === orbitTarget이라 (ox-camera.position.x)는 0이 됨.
        //    camera.getWorldDirection을 써야 양 모드 모두 정상 동작.
        const camFwd = new THREE.Vector3();
        camera.getWorldDirection(camFwd);
        camFwd.y = 0;
        if (camFwd.lengthSq() < 1e-6) camFwd.set(0, 0, -1);
        camFwd.normalize();
        const camRgt = new THREE.Vector3()
            .crossVectors(camFwd, new THREE.Vector3(0, 1, 0))
            .normalize();

        // 목표 방향 단위 벡터 (XZ 평면)
        const wDir = new THREE.Vector3(dx, 0, dz).normalize();

        // 스크린 공간 투영
        const screenX = wDir.dot(camRgt);   // 오른쪽 → +
        const screenY = wDir.dot(camFwd);   // 위(앞) → +

        // 화살표 회전: atan2(x, y) → 0°=위, 시계방향 양수
        const angle = Math.atan2(screenX, screenY) * (180 / Math.PI);
        arrowEl.textContent = '⬆️';
        arrowEl.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    },

    // ── 두꾸가 목표 위치에 내려졌을 때 호출 ─────────
    onToadDropped(x, z) {
        if (level2_conditions.toadRescued) return;
        const dx = Math.abs(x - this.TOAD_TARGET.x);
        const dz = Math.abs(z - this.TOAD_TARGET.z);
        if (dx <= 3 && dz <= 3) {
            level2_conditions.toadRescued = true;
            level2_phase = 2;
            this.currentPhase = 2;
            this.missionGuided = true;
            this._clearMarkers();

            toast('✅ 두꾸가 안전한 습지로 이동했어요!');
            setTimeout(() => {
                toast('📍 이제 빨간 황소개구리를 블록(흙/돌)으로 둘러싸 격리 연못을 만드세요!');
            }, 2500);
            setTimeout(() => {
                toast('🗺️ 오렌지 기둥이 격리 가능 구역(강변)을 표시합니다. 기둥 안쪽을 막으세요!');
                this._showBullfrogZone();
                // Phase 2 시작 시 수달·박쥐 위치 화살표도 함께 표시
                this._showOtterArrow();
                this._showDamMarkers();
                this._showBatArrow();
            }, 4500);
            setTimeout(() => {
                toast('🦦 수달 근처 청록색(⛏️) 화살표가 가리키는 흙 블록 3개를 삽으로 파내세요!');
            }, 7000);
            setTimeout(() => {
                toast('🦇 박쥐(보라 블록)가 동쪽 동굴에 있어요! 천장 빈틈을 돌 블록으로 채워주세요!');
            }, 10000);
            this.updateUI();
        } else {
            toast('💡 두꾸를 ⬇️ 파란 마커(🌊)가 있는 습지 경계부에 내려놓으세요!');
        }
    },

    // ── 황소개구리 격리 구역 시각화 ──────────────────
    // 격리 연못 지정 구역: 황소개구리(70,12) 중심 ±4칸 (강변)
    _showBullfrogZone() {
        this._clearBullfrogZone();
        const bfEntry = animalData.find(a => a.type === 'bullfrog');
        if (!bfEntry) return;

        const bfX = Math.round(bfEntry.x), bfZ = Math.round(bfEntry.z);

        // 빨간 하강 화살표 (황소개구리 위)
        const arrGeo = new THREE.ConeGeometry(0.45, 0.9, 4);
        const arr = new THREE.Mesh(arrGeo,
            new THREE.MeshBasicMaterial({ color: 0xFF2222, depthTest: false }));
        arr.rotation.x = Math.PI;
        arr._baseY = getH(bfX, bfZ) + 1 + 3.2;
        arr.position.set(bfX, arr._baseY, bfZ);
        arr.renderOrder = 110;
        scene.add(arr);
        this._bfArrow = arr;
        this._bfZoneMarkers.push(arr);

        // 오렌지 코너 기둥 4개 (격리 구역 경계)
        const R = 4;
        for (const [cx, cz] of [[bfX-R,bfZ-R],[bfX+R,bfZ-R],[bfX-R,bfZ+R],[bfX+R,bfZ+R]]) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 5, 0.5),
                new THREE.MeshBasicMaterial({ color: 0xFF8C00, depthTest: false }));
            p.position.set(cx, getH(cx, cz) + 1 + 2.5, cz);
            p.renderOrder = 110;
            scene.add(p);
            this._bfZoneMarkers.push(p);
        }

        // 바닥 오렌지 반투명 구역 표시
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(R * 2, 0.1, R * 2),
            new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.22, depthTest: false }));
        floor.position.set(bfX, getH(bfX, bfZ) + 1.05, bfZ);
        floor.renderOrder = 109;
        scene.add(floor);
        this._bfZoneMarkers.push(floor);
    },

    // ── 동물 위치 화살표 공통 생성 ───────────────────
    _showAnimalArrow(arrowProp, type, color, emoji) {
        if (this[arrowProp]) { scene.remove(this[arrowProp]); this[arrowProp] = null; }
        const entry = animalData.find(a => a.type === type);
        if (!entry) return;
        const arr = new THREE.Mesh(
            new THREE.ConeGeometry(0.45, 0.9, 4),
            new THREE.MeshBasicMaterial({ color, depthTest: false })
        );
        arr.rotation.x = Math.PI;
        arr._baseY = getH(entry.x, entry.z) + 1 + 3.5;
        arr.position.set(entry.x, arr._baseY, entry.z);
        arr.renderOrder = 110;
        scene.add(arr);
        this[arrowProp] = arr;
        if (typeof createEmojiSprite === 'function') {
            const label = createEmojiSprite(emoji);
            label.position.set(entry.x, arr._baseY + 1.2, entry.z);
            label.scale.set(2, 2, 1);
            label._isL2Label = true;
            scene.add(label);
            arr._label = label;
        }
    },

    _showOtterArrow() { this._showAnimalArrow('_otterArrow', 'otter', 0x0066FF, '🦦'); },
    _showBatArrow()   { this._showAnimalArrow('_batArrow',   'bat',   0xAA00FF, '🦇'); },

    _showDamMarkers() {
        this._clearDamMarkers();
        for (let i = 0; i < level2_conditions.waterDamCells.length; i++) {
            const { x, y, z } = level2_conditions.waterDamCells[i];
            const arr = new THREE.Mesh(
                new THREE.ConeGeometry(0.45, 0.9, 4),
                new THREE.MeshBasicMaterial({ color: 0x00CCFF, depthTest: false })
            );
            arr.rotation.x = Math.PI;
            arr._baseY = y + 3.5;
            arr.position.set(x, arr._baseY, z);
            arr.renderOrder = 110;
            scene.add(arr);
            if (typeof createEmojiSprite === 'function') {
                const label = createEmojiSprite('⛏️');
                label.position.set(x, arr._baseY + 1.2, z);
                label.scale.set(2, 2, 1);
                scene.add(label);
                arr._label = label;
            }
            this._damArrows.push(arr);
        }
    },

    _clearDamMarkers() {
        for (const arr of this._damArrows) {
            if (arr._label) scene.remove(arr._label);
            scene.remove(arr);
        }
        this._damArrows = [];
    },

    _clearBullfrogZone() {
        if (this._bfArrow) { this._bfArrow = null; }
        for (const m of this._bfZoneMarkers) scene.remove(m);
        this._bfZoneMarkers = [];
    },


    // ── 마커/화살표 정리 ────────────────────────────
    _clearMarkers() {
        if (this._toadArrow) { scene.remove(this._toadArrow); this._toadArrow = null; }
        if (this._targetMarker) {
            if (this._targetMarker._label) scene.remove(this._targetMarker._label);
            scene.remove(this._targetMarker);
            this._targetMarker = null;
        }
    },

    // ── 미션 조건 검사 ──────────────────────────────
    check() {
        this._checkLevelClear();
    },

    _checkLevelClear() {
        if (this.phaseComplete['level2']) return;

        const otterDone = global_protectors.otter === true;
        const batDone   = global_protectors.bat   === true;
        const frogDone  = level2_conditions.bullfrogIsolated === true;

        if (otterDone && batDone && frogDone) {
            this.phaseComplete['level2'] = true;
            DBG('[Level2Manager] 🎉 레벨 2 클리어!');
            // 나침반 숨김
            const compass = document.getElementById('nav-compass');
            if (compass) compass.style.display = 'none';
            // 모든 화살표 정리
            this._clearBullfrogZone();
            if (this._otterArrow) {
                if (this._otterArrow._label) scene.remove(this._otterArrow._label);
                scene.remove(this._otterArrow); this._otterArrow = null;
            }
            if (this._batArrow) {
                if (this._batArrow._label) scene.remove(this._batArrow._label);
                scene.remove(this._batArrow); this._batArrow = null;
            }
            setTimeout(() => {
                toast('🎊 다양성의 숲이 회복되었어요! 수호대 5마리가 모두 합류했습니다!');
                document.dispatchEvent(new CustomEvent('level2Cleared'));
            }, 1000);
        }

        this.updateUI();
    },

    // ── 미션 패널 UI 업데이트 ─────────────────────
    updateUI() {
        const titleEl  = document.getElementById('mission-title');
        const descEl   = document.getElementById('mission-desc');
        const statusEl = document.getElementById('mission-status');

        if (!titleEl) return;

        const toadDone  = level2_conditions.toadRescued;
        const frogDone  = level2_conditions.bullfrogIsolated;
        const otterDone = global_protectors.otter;
        const batDone   = global_protectors.bat;

        titleEl.textContent = '🌿 [다양성의 숲] 생태계 복원 미션';

        if (descEl) {
            if (!toadDone) {
                descEl.innerHTML = '<b style="color:#FFD700">① 먼저 길 잃은 두꺼비 두꾸를 구출하세요!</b> ⬇️ 황금 화살표를 따라 두꾸를 찾아주세요.';
            } else {
                descEl.innerHTML = '외래종을 격리하고 수호대를 영입하여 숲의 균형을 되찾으세요!';
            }
        }

        if (statusEl) {
            statusEl.innerHTML = `
                <div class="mc${toadDone ? ' done' : ''}"
                     style="${!toadDone ? 'border:1px solid #FFD700;padding:4px 6px;border-radius:6px;' : ''}">
                    ${toadDone ? '✅' : '⭐'} 🐸 <b>두꾸 구출 (튜토리얼):</b>
                    ${toadDone
                        ? '두꾸가 안전한 습지로 이동했어요!'
                        : '황금 화살표(⬇️)를 따라 <b>두꾸(초록 블록)</b>를 클릭 → 파란 마커(🌊)에 내려놓기'
                    }
                </div>
                <div class="mc${frogDone ? ' done' : ''}">
                    ${frogDone ? '✅' : '1️⃣'} 🐸 <b>외래종 격리:</b> 블록으로 황소개구리(빨간 블록) 격리 연못 만들기
                    <small style="opacity:0.7"> → 최소 4칸, 폐곡선, 황소개구리 포함</small>
                </div>
                <div class="mc${otterDone ? ' done' : ''}">
                    ${otterDone ? '✅' : '2️⃣'} 🦦 <b>수달 수리 영입:</b> 삽으로 막힌 흙 블록을 파내어 물길 연결
                    <small style="opacity:0.7"> → 도감 단서: "깊은 물이 있어야 살 수 있어요"</small>
                </div>
                <div class="mc${batDone ? ' done' : ''}">
                    ${batDone ? '✅' : '3️⃣'} 🦇 <b>황금박쥐 금비 영입:</b> 동굴 천장 빈틈을 돌 블록으로 채우기
                    <small style="opacity:0.7"> → 도감 단서: "1cm 빛만 들어와도 잠을 못 자요"</small>
                </div>
            `;
        }
    },

    // ── advance 더미 (QuestManager 호환성) ─────────
    advance() {
        DBG('[Level2Manager] advance() 호출');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2 클리어 이벤트 처리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('level2Cleared', () => {
    DBG('[Level2] level2Cleared 이벤트 수신');
    setTimeout(() => {
        const el = document.getElementById('level2-clear');
        if (el) el.style.display = 'block';
    }, 2000);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QuestManager에 레벨 2 등록 (systems.js 로드 후 실행)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function registerLevel2() {
    if (typeof QuestManager !== 'undefined') {
        QuestManager.levels[2] = Level2Manager;
        DBG('[Level2Logic] QuestManager.levels[2] 등록 완료');
    } else {
        console.error('[Level2Logic] QuestManager를 찾을 수 없습니다! 로드 순서를 확인하세요.');
    }
})();