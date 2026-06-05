// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 3: 연결의 평원 — 핵심 검증 알고리즘 + 미션 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Level3Logic = {
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
        DBG(`[레벨3 이벤트] ${ev.msg}`);
        if (typeof toast === 'function') toast(`🦊 ${ev.msg}`);
        setTimeout(() => this.playNextEvent(), ev.duration);
    },

    alert(msg) {
        DBG(`[레벨3 경고] ${msg}`);
        if (typeof toast === 'function') toast(`⚠️ ${msg}`);
    },

    // ──────────────────────────────────────────────
    // A. 클릭 및 아이템 상호작용 처리
    // ──────────────────────────────────────────────
    handleClick(obj) {
        const activeItem = hotbar[activeSlot];
        
        // 1. 노루 치료 상호작용
        const deerEntry = animalData.find(a => a.type === 'deer');
        if (deerEntry && obj.userData.agr === deerEntry.group) {
            if (level3_phase === 1) {
                if (!level3_conditions.deerRescued) {
                    // 맨손(또는 구급상자 외 도구)일 때는 픽업/재배치를 허용 → main.js 맨손 핸들러로 위임
                    if (activeItem !== 'heal') {
                        return false;
                    }

                    // 이하 구급상자(heal) 장착 상태 — 안전지대 안에서만 치료 가능
                    const dx = Math.abs(deerEntry.x - Level3Manager.DEER_TARGET.x);
                    const dz = Math.abs(deerEntry.z - Level3Manager.DEER_TARGET.z);
                    if (dx > 4 || dz > 4) {
                        this.alert('노루를 먼저 ⬇️ 파란 마커가 표시된 풀밭 안전지대로 옮겨주세요!');
                        return true;
                    }

                    // 구급상자 소모
                    hotbar[activeSlot] = null;
                    if (typeof initInventoryUI === 'function') initInventoryUI();
                    if (typeof applyCurrentTool === 'function') applyCurrentTool();

                    level3_conditions.deerRescued = true;
                    deerEntry.isInjured = false;

                    // 다친 상태 비주얼 복원 (회색 -> 원래 노루 색상)
                    scene.remove(deerEntry.group);
                    deerEntry.group = buildAnimal('deer', false);
                    deerEntry.group.position.set(deerEntry.x, deerEntry.y, deerEntry.z);
                    scene.add(deerEntry.group);

                    this.enqueueEvent('🦌 노루 초롱이가 치료되어 생기를 되찾았습니다!', 4000);

                    setTimeout(() => {
                        if (typeof showNpcDialogue === 'function') {
                            showNpcDialogue('l3_deer_healed', { autoClose: 6000 });
                        }
                        level3_phase = 2;
                        Level3Manager.currentPhase = 2;
                        Level3Manager.showCarcassGuides();
                        Level3Manager.check();
                    }, 1500);
                    return true;
                }
            }
        }

        // 2. 붉은여우 먹이 주기 상호작용
        const foxEntry = animalData.find(a => a.type === 'fox');
        if (foxEntry && (obj.userData.agr === foxEntry.group || this.isNearFox(obj, foxEntry))) {
            if (level3_phase === 2) {
                if (!level3_conditions.wildDogIsolated) {
                    this.alert('🦊 여우가 들개 무리 때문에 불안해하며 먹이를 거부합니다. 들개부터 격리해 주세요!');
                    return true;
                }
                if (global_protectors.fox) return false;

                if (activeItem === 'lure') {
                    // 먹이(lure) 소모
                    hotbar[activeSlot] = null;
                    if (typeof initInventoryUI === 'function') initInventoryUI();
                    if (typeof applyCurrentTool === 'function') applyCurrentTool();

                    level3_conditions.foxFedCount++;
                    const count = level3_conditions.foxFedCount;
                    
                    if (count === 1) {
                        this.enqueueEvent('🦊 여우가 킁킁거리며 짚을 던져준 자리를 관찰합니다. (1/3)', 3500);
                        // 여우 움직임 연출
                        this.moveFoxSlightly(foxEntry, -2, 2);
                    } else if (count === 2) {
                        this.enqueueEvent('🦊 여우가 눈치를 보며 한 걸음 다가왔습니다. (2/3)', 3500);
                        this.moveFoxSlightly(foxEntry, 2, -2);
                    } else if (count === 3) {
                        global_protectors.fox = true;
                        this.enqueueEvent('🎉 붉은여우 붉은꼬리가 당신을 신뢰하여 수호대로 합류했습니다! (3/3)', 4500);
                        if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('fox', 3);
                        if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
                        
                        setTimeout(() => {
                            if (typeof showNpcDialogue === 'function') {
                                showNpcDialogue('l3_fox_join', { autoClose: 5000 });
                            }
                            Level3Manager.check();
                        }, 1500);
                    }
                    return true;
                } else {
                    this.alert('먹이(🌾)를 가방에서 장착하고 여우에게 던져주세요!');
                    return true;
                }
            }
        }
        return false;
    },

    isNearFox(obj, fox) {
        if (!obj.position) return false;
        const dist = Math.hypot(obj.position.x - fox.x, obj.position.z - fox.z);
        return dist < 4;
    },

    moveFoxSlightly(fox, dx, dz) {
        fox.x += dx;
        fox.z += dz;
        fox.y = getH(fox.x, fox.z) + 0.5;
        if (fox.group) {
            fox.group.position.set(fox.x, fox.y, fox.z);
        }
    },

    // ──────────────────────────────────────────────
    // B. 들개 격리 검증 (BFS)
    // ──────────────────────────────────────────────
    checkWildDogIsolation() {
        if (level3_conditions.wildDogIsolated) return;

        const dogs = animalData.filter(a => a.type === 'dog');
        if (dogs.length === 0) { console.warn('[Level3] 들개 없음'); return; }

        const MAX_CELLS = 120; // 들개 가두기 허용 면적 제한

        // 한 출발점에서 BFS로 폐곡선(가둠) 영역을 탐색한다.
        // escaped=true 이면 영역이 열려 있어 아직 격리되지 않은 것.
        const floodFrom = (startX, startZ) => {
            const visited = new Set();
            const queue = [[startX, startZ]];
            visited.add(`${startX},${startZ}`);
            let hasProtected = false;
            let escaped = false;

            while (queue.length > 0) {
                if (visited.size > MAX_CELLS) { escaped = true; break; }
                const [cx, cz] = queue.shift();

                // 이 영역에 보호 동물(노루/여우)이 함께 갇혀 있는지 확인
                for (const a of animalData) {
                    if ((a.type === 'deer' || a.type === 'fox') &&
                        Math.round(a.x) === cx && Math.round(a.z) === cz) {
                        hasProtected = true;
                    }
                }

                for (const [nx, nz] of [[cx+1, cz], [cx-1, cz], [cx, cz+1], [cx, cz-1]]) {
                    const nKey = `${nx},${nz}`;
                    if (visited.has(nKey)) continue;

                    // 비활성 청크는 벽으로 취급 (BFS가 빠져나가지 못함)
                    if (!isActive(nx, nz)) continue;

                    // 이웃 칸의 지면 위 설치 블록(관목/울타리/돌/흙 등)을 격리벽으로 검사
                    const blocked = isLevel3BarrierAt(nx, nz);

                    if (!blocked) {
                        visited.add(nKey);
                        queue.push([nx, nz]);
                    }
                }
            }
            return { visited, hasProtected, escaped };
        };

        // 들개 전원이 각자 폐곡선 영역에 갇혀 있어야 격리 완료
        let anyProtectedTrapped = false;
        let tooSmall = false;
        for (const dog of dogs) {
            const res = floodFrom(Math.round(dog.x), Math.round(dog.z));
            if (res.escaped) return; // 한 마리라도 빠져나갈 수 있으면 아직 미완 (조용히 대기)
            if (res.hasProtected) anyProtectedTrapped = true;
            if (res.visited.size < 4) tooSmall = true;
        }

        if (anyProtectedTrapped) {
            this.alert('⚠️ 노루나 여우가 들개와 함께 갇혀 있습니다! 공간을 다시 나누어 주세요.');
            return;
        }
        if (tooSmall) {
            this.alert('격리 구역이 들개들에게 너무 좁습니다! (최소 4칸 필요)');
            return;
        }

        level3_conditions.wildDogIsolated = true;
        this.enqueueEvent('🐕 들개들이 완벽하게 분리되어 격리되었습니다!', 4000);
        Level3Manager.check();
    },

    // ──────────────────────────────────────────────
    // C. 독수리 영입 - 사체 정화 검사
    // ──────────────────────────────────────────────
    checkCarcassRemoved() {
        if (global_protectors.eagle) return;

        // carcassCells가 모두 deletedBlocks에 포함되었는지 검사
        const cleared = level3_conditions.carcassCells.every(({ x, y, z }) =>
            deletedBlocks.has(bk(x, y, z))
        );

        if (cleared) {
            global_protectors.eagle = true;
            this.enqueueEvent('🦅 들판이 정화되자 용감한 독수리 수리가 날아왔습니다!', 4000);

            // 모든 사체가 제거되었으므로 가이드 화살표 정리
            Level3Manager.clearCarcassGuides();

            // 나뭇가지 꼭대기에 독수리 스폰
            const TX = -80, TZ = 5;
            const TY = getTopY(TX, TZ);
            placeAnimal(TX, TY + 3, TZ, 'eagle');

            if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('eagle', 3);
            if (typeof updateProtectorSlots === 'function') updateProtectorSlots();

            setTimeout(() => {
                if (typeof showNpcDialogue === 'function') {
                    showNpcDialogue('l3_eagle_join', { autoClose: 5000 });
                }
                Level3Manager.check();
            }, 1500);
        } else {
            // 일부만 제거된 경우: 남아 있는 사체 위에만 가이드를 다시 표시
            if (level3_phase === 2) Level3Manager.showCarcassGuides();
            Level3Manager.updateUI();
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 3 미션 관리자 (QuestManager.levels[3]에 등록됨)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Level3Manager = {
    currentPhase: 0,
    phaseComplete: {},
    
    // 노루 이송 대상 풀밭 좌표
    DEER_TARGET: { x: -80, z: -8 },
    DEER_SPAWN:  { x: -76, z: 4 },
    DOG_CENTER:  { x: -70, z: -10 },
    DOG_SPAWNS: [
        { x: -70, z: -9 },
        { x: -68, z: -11 },
        { x: -72, z: -10 }
    ],

    _deerArrow: null,
    _deerTargetMarker: null,
    _dogArrow: null,
    _foxArrow: null,
    _carcassArrows: [],

    init() {
        currentLevel = 3;
        level3_phase = 1;
        this.currentPhase = 1;
        this.phaseComplete = {};

        level3_conditions.deerRescued = false;
        level3_conditions.wildDogIsolated = false;
        level3_conditions.foxFedCount = 0;
        level3_conditions.carcassRemovedCount = 0;
        level3_conditions.carcassCells = [];
        level3_conditions.isDesertified = false;
        level3_conditions.foodChainPuzzleSolved = false;

        DBG('[Level3Manager] 연결의 평원 초기화 시작');

        // 레벨 3 전용 핫바 설정
        hotbar = [null, 'pickaxe', 'shovel', 'heal', 'lure', 'fence', 'bush', null, null];
        if (typeof initInventoryUI === 'function') initInventoryUI();
        if (typeof applyCurrentTool === 'function') applyCurrentTool();

        // 들개(cx≈-9~-10), 여우(cx=-11), 노루(-80→cx=-10) 등 평원 동물 청크 사전 로드
        for (let cx = -11; cx <= -8; cx++) {
            for (let cz = -3; cz <= 2; cz++) {
                activateChunk(cx, cz);
            }
        }

        // 기존 평원 구역 동물 청소
        for (let i = animalData.length - 1; i >= 0; i--) {
            const a = animalData[i];
            const dist = Math.hypot(a.x - (-80), a.z - 0);
            if (dist < 50 && ['sheep', 'fish', 'bullfrog', 'toad', 'otter', 'bat'].includes(a.type)) {
                if (a.group) scene.remove(a.group);
                animalData.splice(i, 1);
            }
        }

        // 동물 스폰
        placeAnimal(this.DEER_SPAWN.x, getH(this.DEER_SPAWN.x, this.DEER_SPAWN.z) + 0.5, this.DEER_SPAWN.z, 'deer', true); // 다친 노루
        placeAnimal(-84, getH(-84, 10) + 0.5, 10, 'fox'); // 붉은여우
        
        // 들개 3마리 배치: 노루 치료 구역에서 너무 멀지 않게 두어 phase 2 진입 시 바로 인지되도록 한다
        for (const pos of this.DOG_SPAWNS) {
            placeAnimal(pos.x, getH(pos.x, pos.z) + 0.5, pos.z, 'dog');
        }

        // 사체 블록 3개 스폰
        const carcasses = [{x:-85, z:-5}, {x:-72, z:-12}, {x:-68, z:6}];
        const cells = [];
        for (const {x, z} of carcasses) {
            const y = getTopY(x, z);
            _place(x, y, z, 'carcass');
            cells.push({x, y, z});
        }
        level3_conditions.carcassCells = cells;

        // 오프닝 대사 출력
        if (typeof showNpcDialogue === 'function') {
            showNpcDialogue('l3_intro', { autoClose: 6000 });
        }

        // 나침반 제목을 "연결의 평원"으로 업데이트
        const compass = document.getElementById('nav-compass');
        if (compass) {
            const titleEl = compass.querySelector('.nc-title');
            if (titleEl) titleEl.textContent = '🌾 연결의 평원';
            compass.style.display = 'flex';
        }
        if (typeof updateDestinationCompass === 'function') {
            updateDestinationCompass({
                x: -80,
                z: 0,
                title: '🌾 연결의 평원',
                hint: '평원 방향으로<br>나아가세요!',
                arrivedHint: '연결의 평원을<br>탐험하세요!',
                arrivedText: '평원 도착!',
                radius: 35
            });
        }

        // 가이드 마커 생성
        this.showDeerGuide();
        this.updateUI();

        // 카메라 노루 방향으로 이동
        if (typeof orbitTarget !== 'undefined' && typeof syncCam === 'function') {
            orbitTarget.set(this.DEER_SPAWN.x, getH(this.DEER_SPAWN.x, this.DEER_SPAWN.z) + 2, this.DEER_SPAWN.z);
            syncCam();
        }
    },

    showDeerGuide() {
        this.clearGuides();

        const deer = animalData.find(a => a.type === 'deer');
        if (!deer) return;

        // 노루 위 화살표
        const arrowGeo = new THREE.ConeGeometry(0.35, 0.7, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, depthTest: false });
        this._deerArrow = new THREE.Mesh(arrowGeo, arrowMat);
        this._deerArrow.rotation.x = Math.PI;
        this._deerArrow.position.set(deer.x, getH(deer.x, deer.z) + 3.2, deer.z);
        this._deerArrow.renderOrder = 110;
        scene.add(this._deerArrow);

        // 풀밭 안전지대 마커
        const markerGeo = new THREE.BoxGeometry(2.5, 0.15, 2.5);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00BFFF, transparent: true, opacity: 0.65, depthTest: false });
        this._deerTargetMarker = new THREE.Mesh(markerGeo, markerMat);
        this._deerTargetMarker.position.set(this.DEER_TARGET.x, getH(this.DEER_TARGET.x, this.DEER_TARGET.z) + 1.05, this.DEER_TARGET.z);
        this._deerTargetMarker.renderOrder = 100;
        scene.add(this._deerTargetMarker);

        if (typeof createEmojiSprite === 'function') {
            const label = createEmojiSprite('🍀');
            label.position.set(this.DEER_TARGET.x, getH(this.DEER_TARGET.x, this.DEER_TARGET.z) + 2.2, this.DEER_TARGET.z);
            label.scale.set(1.5, 1.5, 1);
            scene.add(label);
            this._deerTargetMarker._label = label;
        }
    },

    showCarcassGuides() {
        this.clearCarcassGuides();
        for (let i = 0; i < level3_conditions.carcassCells.length; i++) {
            const { x, y, z } = level3_conditions.carcassCells[i];
            if (deletedBlocks.has(bk(x, y, z))) continue;

            const arr = new THREE.Mesh(
                new THREE.ConeGeometry(0.35, 0.7, 4),
                new THREE.MeshBasicMaterial({ color: 0x00CCFF, depthTest: false })
            );
            arr.rotation.x = Math.PI;
            arr.position.set(x, y + 3.2, z);
            arr.renderOrder = 110;
            scene.add(arr);

            if (typeof createEmojiSprite === 'function') {
                const label = createEmojiSprite('⛏️');
                label.position.set(x, y + 4.2, z);
                label.scale.set(1.5, 1.5, 1);
                scene.add(label);
                arr._label = label;
            }
            this._carcassArrows.push(arr);
        }
    },

    clearCarcassGuides() {
        for (const arr of this._carcassArrows) {
            if (arr._label) scene.remove(arr._label);
            scene.remove(arr);
        }
        this._carcassArrows = [];
    },

    clearGuides() {
        if (this._deerArrow) { scene.remove(this._deerArrow); this._deerArrow = null; }
        if (this._deerTargetMarker) {
            if (this._deerTargetMarker._label) scene.remove(this._deerTargetMarker._label);
            scene.remove(this._deerTargetMarker);
            this._deerTargetMarker = null;
        }
        if (this._dogArrow) {
            if (this._dogArrow._label) scene.remove(this._dogArrow._label);
            scene.remove(this._dogArrow);
            this._dogArrow = null;
        }
        if (this._foxArrow) {
            if (this._foxArrow._label) scene.remove(this._foxArrow._label);
            scene.remove(this._foxArrow);
            this._foxArrow = null;
        }
        this.clearCarcassGuides();
    },

    updateArrows(t) {
        // 노루 추적 화살표
        if (this._deerArrow) {
            const deer = animalData.find(a => a.type === 'deer');
            if (deer && !level3_conditions.deerRescued) {
                this._deerArrow.position.x = deer.x;
                this._deerArrow.position.z = deer.z;
                this._deerArrow.position.y = getH(deer.x, deer.z) + 3.2 + Math.sin(t * 3.5) * 0.25;
            } else {
                scene.remove(this._deerArrow);
                this._deerArrow = null;
            }
        }

        // 노루 타겟 마커 펄싱
        if (this._deerTargetMarker) {
            this._deerTargetMarker.material.opacity = 0.5 + Math.abs(Math.sin(t * 3)) * 0.3;
        }

        // 들개 무리 및 여우 가이드 화살표 (Phase 2 시작 시)
        if (level3_phase === 2) {
            if (!this._dogArrow) {
                // 들개 구역 위에 안내 화살표
                const arr = new THREE.Mesh(
                    new THREE.ConeGeometry(0.4, 0.8, 4),
                    new THREE.MeshBasicMaterial({ color: 0xFF2222, depthTest: false })
                );
                arr.rotation.x = Math.PI;
                arr.position.set(this.DOG_CENTER.x, getH(this.DOG_CENTER.x, this.DOG_CENTER.z) + 3.5, this.DOG_CENTER.z);
                arr.renderOrder = 110;
                scene.add(arr);
                this._dogArrow = arr;

                if (typeof createEmojiSprite === 'function') {
                    const label = createEmojiSprite('🐕');
                    label.position.set(this.DOG_CENTER.x, getH(this.DOG_CENTER.x, this.DOG_CENTER.z) + 4.7, this.DOG_CENTER.z);
                    label.scale.set(1.5, 1.5, 1);
                    scene.add(label);
                    arr._label = label;
                }
            }
            if (this._dogArrow) {
                if (level3_conditions.wildDogIsolated) {
                    if (this._dogArrow._label) scene.remove(this._dogArrow._label);
                    scene.remove(this._dogArrow);
                    this._dogArrow = null;
                } else {
                    this._dogArrow.position.set(
                        this.DOG_CENTER.x,
                        getH(this.DOG_CENTER.x, this.DOG_CENTER.z) + 3.5 + Math.sin(t * 3) * 0.2,
                        this.DOG_CENTER.z
                    );
                    if (this._dogArrow._label) {
                        this._dogArrow._label.position.set(
                            this.DOG_CENTER.x,
                            this._dogArrow.position.y + 1.2,
                            this.DOG_CENTER.z
                        );
                    }
                }
            }

            if (!this._foxArrow && !global_protectors.fox) {
                const fox = animalData.find(a => a.type === 'fox');
                if (fox) {
                    const arr = new THREE.Mesh(
                        new THREE.ConeGeometry(0.4, 0.8, 4),
                        new THREE.MeshBasicMaterial({ color: 0xFF8C00, depthTest: false })
                    );
                    arr.rotation.x = Math.PI;
                    arr.position.set(fox.x, getH(fox.x, fox.z) + 3.5, fox.z);
                    arr.renderOrder = 110;
                    scene.add(arr);
                    this._foxArrow = arr;

                    if (typeof createEmojiSprite === 'function') {
                        const label = createEmojiSprite('🦊');
                        label.position.set(fox.x, getH(fox.x, fox.z) + 4.7, fox.z);
                        label.scale.set(1.5, 1.5, 1);
                        scene.add(label);
                        arr._label = label;
                    }
                }
            }

            // 여우가 합류하면 안내 화살표 제거
            if (this._foxArrow && global_protectors.fox) {
                if (this._foxArrow._label) scene.remove(this._foxArrow._label);
                scene.remove(this._foxArrow);
                this._foxArrow = null;
            }

            if (this._foxArrow) {
                const fox = animalData.find(a => a.type === 'fox');
                if (fox) {
                    this._foxArrow.position.x = fox.x;
                    this._foxArrow.position.z = fox.z;
                    this._foxArrow.position.y = getH(fox.x, fox.z) + 3.5 + Math.sin(t * 2.8) * 0.25;
                    if (this._foxArrow._label) {
                        this._foxArrow._label.position.x = fox.x;
                        this._foxArrow._label.position.z = fox.z;
                        this._foxArrow._label.position.y = this._foxArrow.position.y + 1.2;
                    }
                }
            }

            // 사체 블록 3개 화살표 매 프레임 업데이트
            if (this._carcassArrows.length > 0) {
                for (let i = 0; i < this._carcassArrows.length; i++) {
                    const arr = this._carcassArrows[i];
                    arr.position.y = arr.position.y + Math.sin(t * 3.2 + i) * 0.01; // 미세 진동
                    if (arr._label) arr._label.position.y = arr.position.y + 1.2;
                }
            }
        }

        // 나침반 방향을 평원 중심 X=-80, Z=0으로 유도
        this.updateNavCompass();
    },

    updateNavCompass() {
        if (this.phaseComplete['level3'] || level3_phase >= 4) {
            if (typeof hideDestinationCompass === 'function') hideDestinationCompass();
            return;
        }
        if (typeof updateDestinationCompass !== 'function') return;
        updateDestinationCompass({
            x: -80,
            z: 0,
            title: '🌾 연결의 평원',
            hint: '평원 방향으로<br>나아가세요!',
            arrivedHint: '연결의 평원을<br>탐험하세요!',
            arrivedText: '평원 도착!',
            radius: 35
        });
    },

    onAnimalDropped(x, z, entry) {
        if (entry.type === 'deer' && level3_phase === 1) {
            const dx = Math.abs(x - this.DEER_TARGET.x);
            const dz = Math.abs(z - this.DEER_TARGET.z);
            if (dx <= 4 && dz <= 4) {
                toast('✅ 노루 초롱이를 안전한 풀밭에 내려놓았습니다! 이제 구급상자를 장착하고 클릭해 주세요.');
                this.updateUI();
                if (typeof initInventoryUI === 'function') initInventoryUI();
            }
        }
    },

    check() {
        if (level3_phase === 2 && global_protectors.fox && global_protectors.eagle) {
            level3_phase = 3;
            this.clearGuides();
            this.triggerDesertificationCutscene();
        }
        
        if (level3_phase === 3 && level3_conditions.foodChainPuzzleSolved) {
            level3_phase = 4;
            this.clearLevel3Clear();
        }

        this.updateUI();
    },

    triggerDesertificationCutscene() {
        level3_conditions.isDesertified = true;
        toast('⚠️ 평원의 물과 풀빛이 급격히 메말라갑니다!');
        
        // 지형 색상 사막화 연출 (t_low -> r_sand)
        const plainsConfig = BIOME_CONFIG.connection_plains;
        const cx0 = Math.floor(plainsConfig.centerX / 16);
        const cz0 = Math.floor(plainsConfig.centerZ / 16);

        // 평원 구역 블록 메시 색상 갈색/모래빛으로 변경
        for (const [k, mesh] of Object.entries(meshByKey)) {
            const [x, , z] = k.split(',').map(Number);
            const dist = Math.hypot(x - plainsConfig.centerX, z - plainsConfig.centerZ);
            if (dist < plainsConfig.radius + 10 && mesh.material) {
                mesh.material.color.setHex(0x9a8868); // 사막화 모래 자갈색
            }
        }

        setTimeout(() => {
            if (typeof showNpcDialogue === 'function') {
                showNpcDialogue('l3_simulation', { autoClose: 5000 });
            }
            setTimeout(() => {
                this.showFoodChainTower();
            }, 5500);
        }, 1500);
    },

    // ──────────────────────────────────────────────
    // D. 보스 챌린지 - 먹이사슬 퍼즐 타워 UI 및 검증
    // ──────────────────────────────────────────────
    showFoodChainTower() {
        // 기존 퍼즐 타워 오버레이 제거
        const existing = document.getElementById('foodchain-overlay');
        if (existing) document.body.removeChild(existing);

        const overlay = document.createElement('div');
        overlay.id = 'foodchain-overlay';
        overlay.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
            'background:rgba(0,0,0,0.85)', 'z-index:200',
            'display:flex', 'align-items:center', 'justify-content:center',
            'font-family:sans-serif'
        ].join(';');

        overlay.innerHTML = `
            <div style="
                background:linear-gradient(135deg, #1e251e, #0d120d);
                border:3px solid #ffcc44; border-radius:24px;
                padding:32px; max-width:580px; width:90%; color:#fff;
                box-shadow:0 12px 50px rgba(0,0,0,0.8);
            ">
                <div style="text-align:center; margin-bottom:20px;">
                    <span style="font-size:42px;">🕸️</span>
                    <h2 style="color:#ffcc44; margin:8px 0 4px 0;">먹이사슬 퍼즐 타워</h2>
                    <p style="font-size:13px; color:rgba(255,255,255,0.7); margin:0;">
                        평원을 다시 푸르게 만들기 위해 생태계의 올바른 먹이사슬 순서를 연결하세요!
                    </p>
                </div>

                <div style="display:flex; gap:20px; margin-bottom:24px; min-height:240px;">
                    <!-- 카드 드래그 풀 -->
                    <div style="flex:1; background:rgba(0,0,0,0.4); border-radius:12px; padding:12px; border:1px dashed rgba(255,255,255,0.15);">
                        <h4 style="margin:0 0 10px 0; font-size:12px; color:#ffcc44;">📦 생물 카드</h4>
                        <div id="card-pool" style="display:flex; flex-direction:column; gap:8px;">
                            <div class="f-card" draggable="true" data-type="1" style="background:#5c8d5c; border-radius:8px; padding:8px 12px; cursor:grab; display:flex; align-items:center; gap:8px; font-weight:bold;">
                                <span>🌱</span> 풀 (생산자)
                            </div>
                            <div class="f-card" draggable="true" data-type="3" style="background:#cc6622; border-radius:8px; padding:8px 12px; cursor:grab; display:flex; align-items:center; gap:8px; font-weight:bold;">
                                <span>🦊</span> 붉은여우 (2차 소비자)
                            </div>
                            <div class="f-card" draggable="true" data-type="2" style="background:#8ca33f; border-radius:8px; padding:8px 12px; cursor:grab; display:flex; align-items:center; gap:8px; font-weight:bold;">
                                <span>🦗</span> 메뚜기 (1차 소비자)
                            </div>
                            <div class="f-card" draggable="true" data-type="4" style="background:#443355; border-radius:8px; padding:8px 12px; cursor:grab; display:flex; align-items:center; gap:8px; font-weight:bold;">
                                <span>🦅</span> 독수리 (최상위 포식자)
                            </div>
                        </div>
                    </div>

                    <!-- 퍼즐 타워 슬롯 -->
                    <div style="flex:1.2; display:flex; flex-direction:column; gap:8px;">
                        <div class="f-slot" data-slot="4" style="background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.15); border-radius:10px; height:50px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.5); font-weight:bold; position:relative;">
                            [4층] 최상위 포식자 슬롯
                        </div>
                        <div class="f-slot" data-slot="3" style="background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.15); border-radius:10px; height:50px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.5); font-weight:bold; position:relative;">
                            [3층] 2차 소비자 슬롯
                        </div>
                        <div class="f-slot" data-slot="2" style="background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.15); border-radius:10px; height:50px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.5); font-weight:bold; position:relative;">
                            [2층] 1차 소비자 슬롯
                        </div>
                        <div class="f-slot" data-slot="1" style="background:rgba(255,255,255,0.06); border:1.5px solid rgba(255,255,255,0.15); border-radius:10px; height:50px; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,0.5); font-weight:bold; position:relative;">
                            [1층] 생산자 슬롯
                        </div>
                    </div>
                </div>

                <div id="puzzle-error" style="color:#ff6b6b; font-size:13px; text-align:center; height:20px; margin-bottom:12px; font-weight:bold;"></div>

                <div style="text-align:center; display:flex; gap:12px; justify-content:center;">
                    <button id="btn-verify-puzzle" style="padding:12px 32px; background:#4caf50; border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:bold; cursor:pointer;">
                        ⚙️ 먹이사슬 검증하기
                    </button>
                    <button id="btn-reset-puzzle" style="padding:12px 20px; background:rgba(255,255,255,0.12); border:none; border-radius:12px; color:#fff; font-size:14px; cursor:pointer;">
                        초기화
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 드래그 앤 드롭 구현: HTML5 drag/drop + 모바일 PointerEvent + 탭 배치
        const cards = overlay.querySelectorAll('.f-card');
        const slots = overlay.querySelectorAll('.f-slot');
        let draggedCard = null;
        let selectedCard = null;
        let pointerDrag = null;
        let activeSlot = null;

        const getSlotPlaceholder = (slot) => {
            return slot.dataset.slot === '1' ? '[1층] 생산자 슬롯'
                : slot.dataset.slot === '2' ? '[2층] 1차 소비자 슬롯'
                : slot.dataset.slot === '3' ? '[3층] 2차 소비자 슬롯'
                : '[4층] 최상위 포식자 슬롯';
        };

        const clearActiveSlot = () => {
            if (activeSlot && !activeSlot.querySelector('.f-card')) {
                activeSlot.style.borderColor = 'rgba(255,255,255,0.15)';
            }
            activeSlot = null;
        };

        const setActiveSlot = (slot) => {
            if (activeSlot === slot) return;
            clearActiveSlot();
            if (slot && !slot.querySelector('.f-card')) {
                activeSlot = slot;
                activeSlot.style.borderColor = '#ffcc44';
            }
        };

        const clearSelectedCard = () => {
            if (selectedCard) {
                selectedCard.style.outline = '';
                selectedCard.style.boxShadow = '';
            }
            selectedCard = null;
        };

        const selectCard = (card) => {
            if (!card || card.style.display === 'none') return;
            if (selectedCard === card) {
                clearSelectedCard();
                return;
            }
            clearSelectedCard();
            selectedCard = card;
            selectedCard.style.outline = '2px solid #ffcc44';
            selectedCard.style.boxShadow = '0 0 12px rgba(255,204,68,0.65)';
        };

        const resetSlot = (slot, sourceCard) => {
            slot.innerHTML = getSlotPlaceholder(slot);
            slot.style.borderColor = 'rgba(255,255,255,0.15)';
            if (sourceCard) sourceCard.style.display = 'flex';
            clearSelectedCard();
        };

        const placeCardInSlot = (sourceCard, slot) => {
            if (!sourceCard || !slot || slot.querySelector('.f-card')) return false;

            const clone = sourceCard.cloneNode(true);
            clone.draggable = false;
            clone.removeAttribute('draggable');
            clone.style.width = '90%';
            clone.style.height = '80%';
            clone.style.justifyContent = 'center';
            clone.style.cursor = 'pointer';
            clone.style.touchAction = 'manipulation';

            clone.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                resetSlot(slot, sourceCard);
            });
            clone.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'mouse') return;
                e.preventDefault();
                e.stopPropagation();
                resetSlot(slot, sourceCard);
            });

            slot.innerHTML = '';
            slot.appendChild(clone);
            slot.style.borderColor = '#ffcc44';

            sourceCard.style.display = 'none';
            sourceCard.style.opacity = '1';
            clearSelectedCard();
            return true;
        };

        const getSlotAtPoint = (x, y) => {
            const el = document.elementFromPoint(x, y);
            return el ? el.closest('.f-slot') : null;
        };

        cards.forEach(card => {
            card.style.touchAction = 'none';
            card.style.userSelect = 'none';
            card.style.webkitUserSelect = 'none';

            card.addEventListener('dragstart', () => {
                draggedCard = card;
                card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
                draggedCard = null;
            });

            card.addEventListener('pointerdown', (e) => {
                if (card.style.display === 'none') return;
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                e.preventDefault();
                e.stopPropagation();

                const rect = card.getBoundingClientRect();
                const ghost = card.cloneNode(true);
                ghost.style.position = 'fixed';
                ghost.style.left = `${rect.left}px`;
                ghost.style.top = `${rect.top}px`;
                ghost.style.width = `${rect.width}px`;
                ghost.style.height = `${rect.height}px`;
                ghost.style.margin = '0';
                ghost.style.pointerEvents = 'none';
                ghost.style.opacity = '0.92';
                ghost.style.transform = 'scale(1.03)';
                ghost.style.zIndex = '1000';
                ghost.style.boxShadow = '0 10px 24px rgba(0,0,0,0.45)';
                document.body.appendChild(ghost);

                pointerDrag = {
                    pointerId: e.pointerId,
                    card,
                    ghost,
                    startX: e.clientX,
                    startY: e.clientY,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    moved: false
                };

                card.setPointerCapture?.(e.pointerId);
                card.style.opacity = '0.55';
            });

            card.addEventListener('pointermove', (e) => {
                if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
                e.preventDefault();

                const dx = e.clientX - pointerDrag.startX;
                const dy = e.clientY - pointerDrag.startY;
                if (!pointerDrag.moved && Math.hypot(dx, dy) > 6) pointerDrag.moved = true;

                pointerDrag.ghost.style.left = `${e.clientX - pointerDrag.offsetX}px`;
                pointerDrag.ghost.style.top = `${e.clientY - pointerDrag.offsetY}px`;

                const slot = getSlotAtPoint(e.clientX, e.clientY);
                setActiveSlot(slot);
            });

            const finishPointerDrag = (e) => {
                if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
                e.preventDefault();
                e.stopPropagation();

                const drag = pointerDrag;
                pointerDrag = null;
                drag.card.releasePointerCapture?.(e.pointerId);
                drag.ghost.remove();
                drag.card.style.opacity = '1';

                const dropSlot = getSlotAtPoint(e.clientX, e.clientY);
                clearActiveSlot();

                if (drag.moved && dropSlot) {
                    placeCardInSlot(drag.card, dropSlot);
                } else if (!drag.moved) {
                    selectCard(drag.card);
                }
            };

            card.addEventListener('pointerup', finishPointerDrag);
            card.addEventListener('pointercancel', finishPointerDrag);
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                placeCardInSlot(draggedCard, slot);
            });
            slot.addEventListener('pointerdown', (e) => {
                if (!selectedCard) return;
                e.preventDefault();
                e.stopPropagation();
                placeCardInSlot(selectedCard, slot);
            });
        });

        // 초기화 버튼
        document.getElementById('btn-reset-puzzle').addEventListener('click', () => {
            this.showFoodChainTower();
        });

        // 검증 버튼
        document.getElementById('btn-verify-puzzle').addEventListener('click', () => {
            const errEl = document.getElementById('puzzle-error');
            errEl.textContent = '';

            let pass = true;
            for (let i = 1; i <= 4; i++) {
                const slot = overlay.querySelector(`.f-slot[data-slot="${i}"]`);
                if (slot.children.length === 0) {
                    errEl.textContent = '모든 슬롯에 생물 카드를 배치해 주세요!';
                    return;
                }
                const cardType = slot.children[0].dataset.type;
                if (parseInt(cardType) !== i) {
                    pass = false;
                }
            }

            if (pass) {
                // 성공 처리
                document.body.removeChild(overlay);
                level3_conditions.foodChainPuzzleSolved = true;
                this.check();
            } else {
                errEl.textContent = '❌ 먹이사슬의 흐름이 올바르지 않습니다! 다시 시도해 주세요.';
            }
        });
    },

    clearLevel3Clear() {
        this.phaseComplete['level3'] = true;
        
        // 지형 색상 복원 (t_low 원래 색상)
        const plainsConfig = BIOME_CONFIG.connection_plains;
        for (const [k, mesh] of Object.entries(meshByKey)) {
            const [x, , z] = k.split(',').map(Number);
            const dist = Math.hypot(x - plainsConfig.centerX, z - plainsConfig.centerZ);
            if (dist < plainsConfig.radius + 10 && mesh.material) {
                const def = getBlockData(gridData[k]);
                if (def && def.hex) {
                    mesh.material.color.setHex(def.hex);
                }
            }
        }

        // 방위표 목적지 표시 숨김
        if (typeof hideDestinationCompass === 'function') hideDestinationCompass();

        // 클리어 토스트 및 할머니 대사
        setTimeout(() => {
            toast('🎊 먹이사슬 고리가 연결되어 연결의 평원이 원래 지고의 푸른빛을 되찾았습니다!');
            if (typeof showNpcDialogue === 'function') {
                showNpcDialogue('l3_clear', { autoClose: 6000 });
            }
            
            // 미션 클리어 배너 팝업
            setTimeout(() => {
                const el = document.getElementById('level3-clear');
                if (el) el.style.display = 'block';
                document.dispatchEvent(new CustomEvent('level3Cleared'));
            }, 3000);
        }, 1000);
    },

    updateUI() {
        const titleEl  = document.getElementById('mission-title');
        const descEl   = document.getElementById('mission-desc');
        const statusEl = document.getElementById('mission-status');

        if (!titleEl) return;

        const phase = level3_phase;
        titleEl.textContent = '🌾 [연결의 평원] 먹이사슬 복원 미션';

        const deerRescued = level3_conditions.deerRescued;
        const wildDogIsolated = level3_conditions.wildDogIsolated;
        const foxFedCount = level3_conditions.foxFedCount;
        const carcassRemovedCount = level3_conditions.carcassRemovedCount;
        const carcassTotal = level3_conditions.carcassCells.length;
        const isFoxJoined = global_protectors.fox;
        const isEagleJoined = global_protectors.eagle;

        if (descEl) {
            if (phase === 1) {
                descEl.innerHTML = '<b style="color:#FFD700">① 다친 노루 초롱이를 안전한 곳으로 이송하세요!</b> ⬇️ 마커가 표시된 풀밭으로 노루를 안아 이동시킨 뒤 구급상자로 치료해 주세요.';
            } else if (phase === 2) {
                descEl.innerHTML = '평원을 위협하는 들개 무리를 격리하고 수호대인 붉은여우와 독수리를 합류시키세요!';
            } else if (phase === 3) {
                descEl.innerHTML = '<b style="color:#ffcc44">⚡ 보스 챌린지: 먹이사슬 퍼즐 타워 완성하기</b>';
            } else {
                descEl.innerHTML = '연결의 평원 복원 완료! 생태계 균형이 되돌아왔습니다.';
            }
        }

        if (statusEl) {
            if (phase === 1) {
                statusEl.innerHTML = `
                    <div class="mc${deerRescued ? ' done' : ''}" style="border:1px solid #FFD700;padding:4px 6px;border-radius:6px;">
                        ${deerRescued ? '✅' : '⭐'} 🦌 <b>노루 초롱이 구조:</b>
                        ${deerRescued 
                            ? '노루가 완치되었습니다!' 
                            : '노루 클릭(맨손) ➡️ 풀밭 마커(🍀)에 내려놓기 ➡️ 구급상자(🩹) 클릭'
                        }
                    </div>
                `;
            } else if (phase === 2) {
                const carcassCleanedCount = level3_conditions.carcassCells.filter(({x,y,z}) => deletedBlocks.has(bk(x,y,z))).length;
                statusEl.innerHTML = `
                    <div class="mc${wildDogIsolated ? ' done' : ''}">
                        ${wildDogIsolated ? '✅' : '1️⃣'} 🐕 <b>들개 격리:</b> 관목(bush) 또는 울타리(fence)로 들개 무리 가두기
                        <small style="opacity:0.7"> → 들개가 나가지 못하게 폐곡선 형성</small>
                    </div>
                    <div class="mc${isFoxJoined ? ' done' : ''}">
                        ${isFoxJoined ? '✅' : '2️⃣'} 🦊 <b>붉은여우 영입:</b> 들개 격리 후 먹이(🌾) 3회 제공
                        <small style="opacity:0.7"> → 신뢰 진행도: ${foxFedCount} / 3</small>
                    </div>
                    <div class="mc${isEagleJoined ? ' done' : ''}">
                        ${isEagleJoined ? '✅' : '3️⃣'} 🦅 <b>독수리 영입:</b> 평원에 흩어진 사체 블록(🍖) 3개 삽으로 파내기
                        <small style="opacity:0.7"> → 정화 진행도: ${carcassCleanedCount} / 3</small>
                    </div>
                `;
            } else if (phase === 3) {
                statusEl.innerHTML = `
                    <div class="mc">
                        ⭐ <b>먹이사슬 검증:</b> 퍼즐 타워에 생물들을 순서대로 배치하세요!
                    </div>
                `;
            } else {
                statusEl.innerHTML = `
                    <div class="mc done">
                        ✅ 연결의 평원이 복원되었습니다. (붉은여우 & 독수리 합류 완료)
                    </div>
                `;
            }
        }
    },

    advance() {
        DBG('[Level3Manager] advance() 호출');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QuestManager에 레벨 3 등록
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function registerLevel3() {
    if (typeof QuestManager !== 'undefined') {
        QuestManager.levels[3] = Level3Manager;
        DBG('[Level3Logic] QuestManager.levels[3] 등록 완료');
    } else {
        console.error('[Level3Logic] QuestManager를 찾을 수 없습니다! 로드 순서를 확인하세요.');
    }
})();
