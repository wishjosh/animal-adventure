// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 2 샌드박스 핵심 검증 알고리즘 (화이트박스 로직)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Level2Logic = {
    eventQueue: [],
    isEventPlaying: false,

    // 서사적 디테일 제어: 이벤트 대기열(Queue) 시스템
    enqueueEvent(eventMsg, duration = 3000) {
        this.eventQueue.push({ msg: eventMsg, duration });
        if (!this.isEventPlaying) {
            this.playNextEvent();
        }
    },

    playNextEvent() {
        if (this.eventQueue.length === 0) {
            this.isEventPlaying = false;
            return;
        }
        this.isEventPlaying = true;
        const ev = this.eventQueue.shift();

        // 시각적 연출 대신 콘솔 로그와 토스트로 대체 (화이트박스 기준)
        console.log(`[이벤트 진행 중] ${ev.msg}`);
        if (typeof toast === 'function') toast(`[이벤트] ${ev.msg}`);

        // 이벤트 진행 시간(duration) 동안 메인 미션 알림 차단
        setTimeout(() => {
            this.playNextEvent();
        }, ev.duration);
    },

    alert(msg) {
        if (this.isEventPlaying) {
            console.log(`[대기열 차단] 이벤트 진행 중 알림 무시됨: ${msg}`);
        } else {
            console.log(`[경고] ${msg}`);
            if (typeof toast === 'function') toast(`⚠️ ${msg}`);
        }
    },

    // 유틸: 특정 좌표에 있는 동물 배열 반환
    getAnimalsAt(x, z) {
        return animalData.filter(a => Math.round(a.x) === x && Math.round(a.z) === z);
    },

    // ──────────────────────────────────────────────
    // A. 외래종 격리 연못 검증 (Flood Fill)
    // ──────────────────────────────────────────────
    checkIsolationLoop() {
        if (level2_conditions.bullfrogIsolated) return;

        const visited = new Set();
        const isolatedZones = [];
        const W_WIDTH = typeof WORLD_W !== 'undefined' ? WORLD_W : 80;
        const W_DEPTH = typeof WORLD_D !== 'undefined' ? WORLD_D : 80;

        for (let x = 0; x < W_WIDTH; x++) {
            for (let z = 0; z < W_DEPTH; z++) {
                const posKey = `${x},${z}`;
                if (visited.has(posKey)) continue;

                // 현재 (x,z) 지면 위의 블록 유무 확인
                const topY = getTopY(x, z);
                const cellBlock = gridData[bk(x, topY, z)];
                const isWall = isSolid(cellBlock);

                // 빈 공간(벽이 아닌 곳)을 발견하면 Flood Fill 시작
                if (!isWall) {
                    let queue = [[x, z]];
                    let currentZone = [];
                    let isClosed = true;
                    let boundaryBlocks = new Set();

                    visited.add(posKey);

                    while (queue.length > 0) {
                        const [cx, cz] = queue.shift();
                        currentZone.push([cx, cz]);

                        // 맵 끝에 닿았다면 폐곡선이 아님 (열린 공간)
                        if (cx <= 0 || cx >= W_WIDTH - 1 || cz <= 0 || cz >= W_DEPTH - 1) {
                            isClosed = false;
                        }

                        // 상하좌우 4방향 탐색
                        const neighbors = [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]];
                        for (const [nx, nz] of neighbors) {
                            if (nx < 0 || nx >= W_WIDTH || nz < 0 || nz >= W_DEPTH) continue;

                            const nKey = `${nx},${nz}`;
                            const nTopY = getTopY(nx, nz);
                            const nBlock = gridData[bk(nx, nTopY, nz)];

                            if (isSolid(nBlock)) {
                                // 테두리 구성 물질 기록
                                boundaryBlocks.add(nBlock);
                            } else {
                                if (!visited.has(nKey)) {
                                    visited.add(nKey);
                                    queue.push([nx, nz]);
                                }
                            }
                        }
                    }

                    if (isClosed) {
                        isolatedZones.push({
                            area: currentZone.length,
                            cells: currentZone,
                            boundaries: Array.from(boundaryBlocks)
                        });
                    }
                }
            }
        }

        // 찾아낸 폐곡선 영역(Zone)들의 조건 검증
        for (const zone of isolatedZones) {
            // 조건 2: 구성 블록 속성이 '흙(dirt)' 또는 '돌(stone)'인가?
            const isSolidMaterial = zone.boundaries.every(b => {
                const base = b ? b.split('_')[0] : '';
                return base === 'dirt' || base === 'stone' || base === 't'; // t_dirt, t_rock 등
            });
            if (!isSolidMaterial) continue;

            // 조건 3: 내부 빈 공간 최소 4칸 이상
            if (zone.area < 4) continue;

            let containsBullfrog = false;
            let containsNative = false;

            // 동물 스캔
            for (const [zx, zz] of zone.cells) {
                const animals = this.getAnimalsAt(zx, zz);
                for (const a of animals) {
                    if (a.type === 'bullfrog') containsBullfrog = true;
                    if (a.type === 'salamander' || a.type === 'toad') containsNative = true;
                }
            }

            // 조건 4 & 5: 황소개구리 포함 여부 및 토착종 배제 여부
            if (containsBullfrog) {
                if (containsNative) {
                    this.alert("경고: 토착종이 외래종과 함께 갇혔습니다! 다시 지어주세요.");
                } else {
                    level2_conditions.bullfrogIsolated = true;
                    console.log("[시스템] 외래종 격리 연못 조건 충족");
                    this.enqueueEvent("황소개구리가 안전하게 격리되었습니다!", 4000);

                    if (level2_phase === 2) {
                        level2_phase = 3; // 페이즈 진척
                        this.enqueueEvent("레벨 2 메인 미션 클리어!", 3000);
                    }
                }
            }
        }
    },

    // ──────────────────────────────────────────────
    // B. 수달 영입 수위 검증 (단방향 경로 탐색)
    // ──────────────────────────────────────────────
    checkWaterFlow() {
        if (global_protectors.otter) return;

        // 가상의 수원지(Water Source)와 수달의 목표 위치(Target)
        const SOURCE = { x: 10, z: 10 };
        const TARGET = { x: 40, z: 40 };

        // 단순 BFS 로직으로 물길 도달 여부 확인
        let queue = [[SOURCE.x, SOURCE.z]];
        let visited = new Set();
        visited.add(`${SOURCE.x},${SOURCE.z}`);

        let isConnected = false;

        while (queue.length > 0) {
            const [cx, cz] = queue.shift();

            if (cx === TARGET.x && cz === TARGET.z) {
                isConnected = true;
                break;
            }

            const neighbors = [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]];
            for (const [nx, nz] of neighbors) {
                const nKey = `${nx},${nz}`;
                const topY = getTopY(nx, nz);

                // 물이 흐를 수 있는 고도(예: 30 미만)와 블록이 없는지 확인
                if (topY < WATER_LEVEL && !isSolid(gridData[bk(nx, topY, nz)])) {
                    if (!visited.has(nKey)) {
                        visited.add(nKey);
                        queue.push([nx, nz]);
                    }
                }
            }
        }

        if (isConnected) {
            global_protectors.otter = true;
            console.log("수달 합류 컷신 대기열 등록");
            this.enqueueEvent("🌊 막혔던 물길이 뚫려 수달이 합류했습니다!", 4000);
        }
    },

    // ──────────────────────────────────────────────
    // C. 박쥐 영입 광원 차단 검증
    // ──────────────────────────────────────────────
    checkCaveLightLevel() {
        if (global_protectors.bat) return;

        // 가상의 동굴 천장 영역 좌표 (x: 50~55, z: 50~55)
        const CAVE_MIN_X = 50, CAVE_MAX_X = 55;
        const CAVE_MIN_Z = 50, CAVE_MAX_Z = 55;
        const ROOF_Y = 40; // 동굴 천장의 Y 좌표

        let lightLevel = 0;

        for (let x = CAVE_MIN_X; x <= CAVE_MAX_X; x++) {
            for (let z = CAVE_MIN_Z; z <= CAVE_MAX_Z; z++) {
                const block = gridData[bk(x, ROOF_Y, z)];
                // 천장에 돌(stone)이나 흙(dirt)이 없으면 빛이 들어오는 것으로 판정
                if (!block || (!block.startsWith('stone') && !block.startsWith('dirt'))) {
                    lightLevel++;
                }
            }
        }

        if (lightLevel === 0) {
            global_protectors.bat = true;
            console.log("황금박쥐 합류 컷신 대기열 등록");
            this.enqueueEvent("🦇 동굴이 어두워져 황금박쥐가 깨어납니다!", 4000);
        }
    }
};