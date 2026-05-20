// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 4: 강의 근원지 — 핵심 검증 알고리즘 + 미션 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Level4Logic = {
    eventQueue: [],
    isEventPlaying: false,
    rainParticles: null,
    riverCells: [], // 강줄기 타겟 경로 셀 목록

    enqueueEvent(eventMsg, duration = 3000) {
        this.eventQueue.push({ msg: eventMsg, duration });
        if (!this.isEventPlaying) this.playNextEvent();
    },

    playNextEvent() {
        if (this.eventQueue.length === 0) { this.isEventPlaying = false; return; }
        this.isEventPlaying = true;
        const ev = this.eventQueue.shift();
        DBG(`[레벨4 이벤트] ${ev.msg}`);
        if (typeof toast === 'function') toast(`🐟 ${ev.msg}`);
        setTimeout(() => this.playNextEvent(), ev.duration);
    },

    alert(msg) {
        DBG(`[레벨4 경고] ${msg}`);
        if (typeof toast === 'function') toast(`⚠️ ${msg}`);
    },

    // ──────────────────────────────────────────────
    // A. 클릭 및 아이템 상호작용 처리
    // ──────────────────────────────────────────────
    handleClick(obj) {
        const activeItem = hotbar[activeSlot];

        // 1. 쏘가리 구조 상호작용 (쓰레기 댐 제거)
        if (obj.userData && obj.userData.isTrashDam) {
            if (level4_phase === 1 && !level4_conditions.soyaRescued) {
                if (activeItem === 'shovel' || activeItem === 'pickaxe') {
                    const pos = obj.position;
                    const key = `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`;
                    
                    // 쓰레기 블록 파괴
                    scene.remove(obj);
                    delete gridData[key];
                    deletedBlocks.add(key);
                    
                    // 남은 쓰레기 댐 검사
                    let remainingTrash = 0;
                    scene.traverse(child => {
                        if (child.userData && child.userData.isTrashDam) {
                            remainingTrash++;
                        }
                    });

                    if (remainingTrash === 0) {
                        level4_conditions.soyaRescued = true;
                        
                        // 쏘가리 물속 탈출 연출
                        const soya = animalData.find(a => a.type === 'mandarin_fish');
                        if (soya) {
                            soya.x = 42; soya.z = 20; soya.y = getH(soya.x, soya.z) - 0.5;
                            if (soya.group) {
                                soya.group.position.set(soya.x, soya.y, soya.z);
                                // 크기 회복 연출
                                soya.group.scale.set(1.5, 1.5, 1.5);
                            }
                        }

                        this.enqueueEvent('🐠 쏘가리 쏘야를 가두던 쓰레기 댐이 해체되어 쏘야가 강으로 무사히 빠져나갔습니다!', 4500);
                        
                        setTimeout(() => {
                            if (typeof showNpcDialogue === 'function') {
                                showNpcDialogue('l4_soya_rescued', { autoClose: 6000 });
                            }
                            level4_phase = 2;
                            Level4Manager.currentPhase = 2;
                            Level4Manager.check();
                        }, 2000);
                    } else {
                        this.alert(`강둑의 쓰레기를 마저 파내어 물길을 열어주세요! (남은 쓰레기: ${remainingTrash}개)`);
                    }
                    return true;
                } else {
                    this.alert('삽(🪤) 또는 곡괭이(⛏️)를 장착하고 쓰레기 댐 블록을 파괴하세요!');
                    return true;
                }
            }
        }

        // 2. 펜션 주인 박씨 설득 상호작용
        const ownerEntry = animalData.find(a => a.type === 'owner_park');
        if (ownerEntry && obj.userData.agr === ownerEntry.group) {
            if (level4_phase === 2) {
                if (level4_conditions.ownerConvinced) {
                    if (activeItem === 'low_pollution') {
                        // 오염 저감 장치 설치
                        hotbar[activeSlot] = null;
                        if (typeof initInventoryUI === 'function') initInventoryUI();
                        if (typeof applyCurrentTool === 'function') applyCurrentTool();

                        level4_conditions.pollutionDeviceInstalled = true;
                        this.enqueueEvent('⚙️ 펜션 방류구에 오염 저감 장치를 설치했습니다! 강물이 맑아지기 시작합니다.', 4000);
                        
                        // 거품 파티클 제거
                        this.removePollutionFoams();
                        
                        Level4Manager.check();
                        return true;
                    } else {
                        this.alert('펜션 주인 박씨를 설득했습니다. 인벤토리에서 오염 저감 장치(⚙️)를 장착해 펜션 앞에 설치해 주세요!');
                        return true;
                    }
                } else {
                    this.showOwnerDialogueBoard();
                    return true;
                }
            }
        }

        // 3. 시멘트 보 제거 상호작용
        if (obj.userData && obj.userData.isCementDam) {
            if (level4_phase === 2) {
                if (activeItem === 'pickaxe') {
                    const pos = obj.position;
                    const key = `${Math.round(pos.x)},${Math.round(pos.y)},${Math.round(pos.z)}`;
                    
                    scene.remove(obj);
                    delete gridData[key];
                    deletedBlocks.add(key);

                    level4_conditions.cementDamRemovedCount++;
                    const removed = level4_conditions.cementDamRemovedCount;

                    this.enqueueEvent(`🧱 시멘트 보 블록을 하나 부수었습니다. (${removed} / 3)`, 3500);
                    
                    if (removed >= 3) {
                        Level4Manager.check();
                    }
                    return true;
                } else {
                    this.alert('곡괭이(⛏️)를 장착해 연어의 길을 막는 단단한 시멘트 보를 철거하세요!');
                    return true;
                }
            }
        }

        // 4. 버드나무(willow) 심기 상호작용은 systems.js 의 블록 설치 훅에서 잡지만, 클릭 피드백이 필요한 경우 여기에 둘 수 있습니다.
        return false;
    },

    // ──────────────────────────────────────────────
    // B. 펜션 주인 박씨 설득 다이얼로그 보드 생성 (Premium Glassmorphism UI)
    // ──────────────────────────────────────────────
    showOwnerDialogueBoard() {
        if (document.getElementById('owner-dialogue-board')) return;

        const overlay = document.createElement('div');
        overlay.id = 'owner-dialogue-board';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        overlay.style.backdropFilter = 'blur(8px)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.innerHTML = `
            <div style="background:rgba(20,25,35,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:30px;width:450px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.5);color:#fff;font-family:'Segoe UI',sans-serif;">
                <div style="font-size:3rem;margin-bottom:15px;">🏡</div>
                <h3 style="margin:0 0 10px 0;font-size:1.4rem;color:#ffcc44;">펜션 주인 박씨</h3>
                <p style="font-size:0.95rem;line-height:1.6;color:#ddd;margin-bottom:25px;">
                    "아니, 우리 펜션 오염 물질 때문에 연어들이 못 올라온다고요?<br>
                    나도 먹고살려고 하는 일인데 무조건 장사를 멈출 순 없소!"
                </p>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <button class="dlg-opt" data-idx="1" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:12px;border-radius:8px;cursor:pointer;transition:all 0.2s;text-align:left;font-size:0.9rem;">
                        💡 <b>"친환경 인증 오염 저감 장치를 달면, 생태 펜션으로 정부 보조금과 더 많은 손님이 올 거예요."</b>
                    </button>
                    <button class="dlg-opt" data-idx="2" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:12px;border-radius:8px;cursor:pointer;transition:all 0.2s;text-align:left;font-size:0.9rem;">
                        ⚠️ <b>"당장 법을 어기고 있으니 신고하겠습니다! 벌금을 내고 싶으신가요?"</b>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 호버 효과
        const buttons = overlay.querySelectorAll('.dlg-opt');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255,204,68,0.2)';
                btn.style.borderColor = '#ffcc44';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255,255,255,0.08)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            });

            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                document.body.removeChild(overlay);
                
                if (idx === 1) {
                    // 설득 성공
                    level4_conditions.ownerConvinced = true;
                    // 인벤토리에 오염 저감 장치 지급
                    if (typeof grantItem === 'function') {
                        grantItem('low_pollution');
                    } else {
                        // fallback
                        hotbar[activeSlot] = 'low_pollution';
                        if (typeof initInventoryUI === 'function') initInventoryUI();
                    }

                    Level4Logic.enqueueEvent('🤝 박씨를 대화로 설득했습니다! 박씨가 준 오염 저감 장치(⚙️)가 퀵바에 들어왔습니다.', 4500);
                    Level4Manager.check();
                } else {
                    // 설득 실패 피드백
                    Level4Logic.alert('😠 박씨가 화를 내며 쫓아냅니다. 좀 더 현명하고 평화적인 생태 공존 제안을 건네보세요.');
                }
            });
        });
    },

    // 거품 파티클 제거
    removePollutionFoams() {
        const toRemove = [];
        scene.traverse(child => {
            if (child.userData && child.userData.isFoam) {
                toRemove.push(child);
            }
        });
        toRemove.forEach(mesh => scene.remove(mesh));
    },

    // ──────────────────────────────────────────────
    // C. 100년 홍수 폭우 연출 및 타이머 작동
    // ──────────────────────────────────────────────
    triggerFloodAlert() {
        level4_conditions.isFlooding = true;
        level4_phase = 3;
        Level4Manager.currentPhase = 3;
        Level4Manager.updateUI();

        if (typeof showNpcDialogue === 'function') {
            showNpcDialogue('l4_flood_warning', { autoClose: 6000 });
        }

        // 비 효과 활성화
        this.createRainEffect();

        // 60초 타이머 개시
        const timerInterval = setInterval(() => {
            if (!level4_conditions.isFlooding) {
                clearInterval(timerInterval);
                return;
            }

            level4_conditions.floodTimer--;
            const time = level4_conditions.floodTimer;

            if (time <= 0) {
                clearInterval(timerInterval);
                this.evaluateFloodDefense();
            } else {
                Level4Manager.updateUI();
                // 15초마다 강둑 취약부 붕괴 위협 연출
                if (time % 15 === 0) {
                    this.damageLevees();
                }
            }
        }, 1000);
    },

    createRainEffect() {
        // 기존 비 파티클이 있다면 삭제
        if (this.rainParticles) scene.remove(this.rainParticles);

        const particleCount = 600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        // 카메라 근처 중심 랜덤 좌표계 배치
        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 120;
            const y = Math.random() * 50 + 20;
            const z = (Math.random() - 0.5) * 120;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: -Math.random() * 0.5 - 0.5,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x88bbff,
            size: 0.35,
            transparent: true,
            opacity: 0.7
        });

        this.rainParticles = new THREE.Points(geometry, material);
        this.rainParticles.userData = { velocities };
        scene.add(this.rainParticles);

        // 안개 강도 높여 먹구름 낀 듯한 어둠 유도
        if (scene.fog) {
            scene.fog.color.setHex(0x333b47);
            scene.fog.density = 0.015;
            renderer.setClearColor(0x333b47);
        }
    },

    updateRainParticles() {
        if (!this.rainParticles) return;

        const positions = this.rainParticles.geometry.attributes.position.array;
        const velocities = this.rainParticles.userData.velocities;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y; // 아래로 하강
            positions[i * 3 + 2] += velocities[i].z;

            // 바닥에 부딪히거나 화면 아래로 나가면 상공으로 리셋
            if (positions[i * 3 + 1] < getH(positions[i * 3], positions[i * 3 + 2])) {
                positions[i * 3 + 1] = Math.random() * 40 + 30;
                positions[i * 3] = (Math.random() - 0.5) * 120;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
    },

    // 15초마다 강둑 붕괴 이벤트 (둑 위치의 흙 블록 제거 및 경고)
    damageLevees() {
        // S자 강줄기 양측 둑 좌표 후보
        const leveeCandidates = [
            {x:45, y:30, z:5},
            {x:55, y:30, z:-10},
            {x:48, y:30, z:-25}
        ];

        let target = null;
        for (const c of leveeCandidates) {
            const k = `${c.x},${c.y},${c.z}`;
            if (gridData[k] && gridData[k] !== 'water') {
                target = c;
                break;
            }
        }

        if (target) {
            const k = `${target.x},${target.y},${target.z}`;
            const mesh = meshByKey[k];
            if (mesh) {
                scene.remove(mesh);
                delete gridData[k];
                deletedBlocks.add(k);
            }
            this.alert(`🌊 폭우로 인해 강둑(${target.x}, ${target.z})의 흙이 유실되어 무너졌습니다! 신속히 보강해 주세요!`);
        }
    },

    // ──────────────────────────────────────────────
    // D. 수호대 액션 스킬 가동
    // ──────────────────────────────────────────────
    castOtterSkill() {
        if (!global_protectors.otter) {
            this.alert('🦦 수달 보글이가 아직 합류하지 않아 도움을 받을 수 없습니다!');
            return;
        }

        // 둑의 취약 부위(Y=30의 강둑 중 비어 있는 물길 둑)를 하이라이트
        const weakPoints = [
            {x:45, y:30, z:5},
            {x:55, y:30, z:-10},
            {x:48, y:30, z:-25}
        ];

        let highlighted = false;
        weakPoints.forEach(p => {
            const k = `${p.x},${p.y},${p.z}`;
            if (!gridData[k]) {
                highlighted = true;
                // 파란색 투명 가이드 큐브 소환
                const geom = new THREE.BoxGeometry(1.05, 1.05, 1.05);
                const mat = new THREE.MeshBasicMaterial({
                    color: 0x00aaff,
                    transparent: true,
                    opacity: 0.5,
                    wireframe: false
                });
                const helper = new THREE.Mesh(geom, mat);
                helper.position.set(p.x, p.y + 0.5, p.z);
                scene.add(helper);

                setTimeout(() => scene.remove(helper), 8000);
            }
        });

        if (highlighted) {
            this.enqueueEvent('🦦 수달 수리가 무너진 강둑의 물줄기 취약 지점을 파랗게 하이라이트했습니다. 돌이나 흙으로 메워주세요!', 4000);
        } else {
            this.enqueueEvent('🦦 수달 수리가 강둑을 점검했으나 모두 안전하게 보강되어 있습니다!', 3000);
        }
    },

    castCraneSkill() {
        if (!global_protectors.crane) {
            this.alert('🦩 두루미 뚜루가 아직 합류하지 않아 기후 전선을 파악할 수 없습니다!');
            return;
        }

        // 폭우 전선 경로를 다이얼로그 오버레이 형태로 동적 팝업
        if (document.getElementById('crane-radar-popup')) return;

        const overlay = document.createElement('div');
        overlay.id = 'crane-radar-popup';
        overlay.style.position = 'fixed';
        overlay.style.bottom = '120px';
        overlay.style.right = '20px';
        overlay.style.background = 'rgba(10,35,25,0.9)';
        overlay.style.border = '2px solid #55cc99';
        overlay.style.borderRadius = '12px';
        overlay.style.padding = '15px';
        overlay.style.width = '240px';
        overlay.style.color = '#fff';
        overlay.style.fontFamily = 'monospace';
        overlay.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6)';
        overlay.style.zIndex = '999';

        overlay.innerHTML = `
            <div style="font-size:0.85rem;border-bottom:1px solid #55cc99;padding-bottom:5px;margin-bottom:8px;font-weight:bold;color:#55cc99;display:flex;justify-content:between;">
                <span>📡 두루미 기상 레이더</span>
                <span style="cursor:pointer;color:#ff5555;float:right;" onclick="document.body.removeChild(this.parentElement.parentElement)">❌</span>
            </div>
            <div style="font-size:0.8rem;line-height:1.5;">
                • 강수량: <b>120mm / h</b> (폭우)<br>
                • 풍속: <b>남남서 14m/s</b><br>
                • 구름 이동: <b>북동쪽으로 전개</b><br>
                • 범람 취약 구역:<br>
                  <span style="color:#ffcc44;">[X: 55, Z: -10] 산비탈 하류</span><br>
                  <span style="color:#ffcc44;">[X: 48, Z: -25] 마을 진입구</span>
            </div>
        `;

        document.body.appendChild(overlay);
        setTimeout(() => {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }, 12000);

        this.enqueueEvent('🦩 두루미 뚜루가 하늘 높이 날아올라 먹구름 전선과 홍수 범람 취약 구역을 무선 예보합니다!', 4000);
    },

    // ──────────────────────────────────────────────
    // E. 홍수 결과 평가 및 클리어 연출
    // ──────────────────────────────────────────────
    evaluateFloodDefense() {
        level4_conditions.isFlooding = false;
        
        // 1. 녹색 댐(심은 버드나무 개수) 체크
        let willowCount = 0;
        for (const [k, v] of Object.entries(gridData)) {
            if (v === 'willow') {
                const [x, , z] = k.split(',').map(Number);
                // 산비탈 지역 (Z > 30 부근)
                if (z > 20) willowCount++;
            }
        }
        level4_conditions.willowPlantedCount = willowCount;

        // 2. 강둑이 보수되었는지(약점 3곳이 비어있는지 물이 채워져 있는지) 검사
        const weakPoints = [
            {x:45, y:30, z:5},
            {x:55, y:30, z:-10},
            {x:48, y:30, z:-25}
        ];
        let brokenCount = 0;
        weakPoints.forEach(p => {
            const k = `${p.x},${p.y},${p.z}`;
            if (!gridData[k] || gridData[k] === 'water') {
                brokenCount++;
            }
        });

        // 3. 점수 환산
        // 나무 8개 이상 = 60점 기본, 미달 시 개당 7점 차감
        // 무너진 둑 개수당 15점 감점
        let score = 100;
        const woodShortage = Math.max(0, 8 - willowCount);
        score -= woodShortage * 8;
        score -= brokenCount * 15;
        score = Math.max(0, score);
        level4_conditions.floodDefenseScore = score;

        // 안개 및 하늘 색 복원
        if (scene.fog) {
            scene.fog.color.setHex(0xe0f0ff);
            scene.fog.density = 0.005;
            renderer.setClearColor(0xe0f0ff);
        }
        if (this.rainParticles) {
            scene.remove(this.rainParticles);
            this.rainParticles = null;
        }

        // 결과 다이얼로그 연출
        if (score >= 80) {
            level4_phase = 4;
            Level4Manager.currentPhase = 4;
            Level4Manager.clearLevel4();
        } else if (score >= 50) {
            // 경고 및 보완 요구 (미완성 클리어가 가능할 수 있으나 생태 가이드라인 상 확실히 방어하는 것이 학습 효과에 좋음)
            this.alert(`🌊 수량이 너무 많고 강둑이 일부 무너져 마을 귀퉁이가 침수되었습니다! (방어 점수: ${score}점)`);
            this.enqueueEvent('👵 할머니: "나무가 부족하고 둑이 무너졌어! 나무를 더 심고 둑을 보수해서 다시 방어해보자."', 5000);
            
            // 타이머 리셋 후 재대비 기회 부여
            level4_conditions.floodTimer = 35;
            this.triggerFloodAlert();
        } else {
            this.alert(`❌ 대홍수가 마을을 휩쓸었습니다! 산비탈에 나무를 심고 무너진 둑을 완전히 보수하세요! (방어 점수: ${score}점)`);
            level4_conditions.floodTimer = 45;
            this.triggerFloodAlert();
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Level4Manager 객체 정의 (QuestManager 규격 매핑)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Level4Manager = {
    currentPhase: 1,
    phaseComplete: {
        soya: false,
        salmon: false,
        crane: false,
        flood: false
    },

    // 쏘가리, 펜션 주인, 시멘트 보 스폰 좌표 정의
    SOYA_SPAWN: { x: 42, y: 29.5, z: 20 },
    OWNER_SPAWN: { x: 50, y: 34.5, z: 12 },
    DAM_COORDS: [
        { x: 50, y: 30, z: 0 },
        { x: 50, y: 30, z: -1 },
        { x: 50, y: 30, z: -2 }
    ],

    init() {
        DBG('[Level4Manager] 강의 근원지 초기화 시작');
        level4_phase = 1;
        this.currentPhase = 1;
        this.phaseComplete = { soya: false, salmon: false, crane: false, flood: false };

        // 전역 상태 초기화
        level4_conditions.soyaRescued = false;
        level4_conditions.ownerConvinced = false;
        level4_conditions.pollutionDeviceInstalled = false;
        level4_conditions.cementDamRemovedCount = 0;
        level4_conditions.willowPlantedCount = 0;
        level4_conditions.isFlooding = false;
        level4_conditions.floodTimer = 60;
        global_protectors.crane = false;
        global_protectors.salmon = false;

        // 지형 데이터에 시멘트 보 배치 및 쓰레기 댐 배치
        this.spawnLevel4WhiteBoxElements();

        // 쏘가리, 펜션 주인, 들개, 여우 등 스폰
        if (typeof spawnLevel4Animals === 'function') {
            spawnLevel4Animals();
        }

        // 나침반 타이틀 업데이트 및 보이기
        const compass = document.getElementById('nav-compass');
        if (compass) {
            const titleEl = compass.querySelector('.nc-title');
            if (titleEl) titleEl.textContent = '💧 강의 근원지';
            compass.style.display = 'flex';
        }

        // 인벤토리에 나무 묘목(willow) 및 삽, 곡괭이 등 지급
        hotbar = [null, 'pickaxe', 'watering_can', 'shovel', 'willow', 'stone', 'grass', null, null];
        if (typeof initInventoryUI === 'function') initInventoryUI();

        // 오프닝 대사 연출
        setTimeout(() => {
            if (typeof showNpcDialogue === 'function') {
                showNpcDialogue('l4_intro', { autoClose: 7000 });
            }
        }, 1000);

        this.updateUI();
    },

    spawnLevel4WhiteBoxElements() {
        // 1. 강을 가로막는 시멘트 보 3개 배치 (X=50, Y=30, Z=0..-2)
        level4_conditions.cementDamCells = [...this.DAM_COORDS];
        this.DAM_COORDS.forEach(c => {
            const key = `${c.x},${c.y},${c.z}`;
            gridData[key] = 'cement_dam';

            // 3D 메시 생성 및 추가
            const geom = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(c.x, c.y + 0.5, c.z);
            mesh.userData = { isCementDam: true };
            scene.add(mesh);
            meshByKey[key] = mesh;
        });

        // 2. 쏘가리가 갇힌 쓰레기 댐(X=42, Y=30, Z=20 주위 3칸) 배치
        const trashCoords = [
            { x: 42, y: 30, z: 19 },
            { x: 41, y: 30, z: 20 },
            { x: 43, y: 30, z: 20 }
        ];
        trashCoords.forEach(c => {
            const key = `${c.x},${c.y},${c.z}`;
            gridData[key] = 'toxic_plant'; // 임시로 독성 식물 비주얼로 표현하되 쓰레기로 지칭

            const geom = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshLambertMaterial({ color: 0x6e5c45 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(c.x, c.y + 0.5, c.z);
            mesh.userData = { isTrashDam: true };
            scene.add(mesh);
            meshByKey[key] = mesh;
        });

        // 3. 펜션 앞 방류구 근처에 거품(foam) 블록 배치
        const foamCoords = [
            { x: 49, y: 31, z: 12 },
            { x: 48, y: 30.5, z: 13 },
            { x: 51, y: 31, z: 13 }
        ];
        foamCoords.forEach(c => {
            const geom = new THREE.SphereGeometry(0.3, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const foam = new THREE.Mesh(geom, mat);
            foam.position.set(c.x, c.y, c.z);
            foam.userData = { isFoam: true };
            scene.add(foam);
        });
    },

    check() {
        if (currentLevel !== 4) return;

        // 쏘가리 구조 단계 완료 여부 확인
        if (level4_phase === 1 && level4_conditions.soyaRescued) {
            this.phaseComplete['soya'] = true;
            level4_phase = 2;
            this.currentPhase = 2;
        }

        // 연어 영입 조건 체크
        if (level4_phase === 2 && !global_protectors.salmon) {
            const devicePlaced = level4_conditions.pollutionDeviceInstalled;
            const damsRemoved = level4_conditions.cementDamRemovedCount >= 3;
            if (devicePlaced && damsRemoved) {
                global_protectors.salmon = true;
                if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('salmon', 3);
                if (typeof updateProtectorSlots === 'function') updateProtectorSlots();

                Level4Logic.enqueueEvent('🎉 남대천 연어 파닥이가 맑은 물길을 거슬러 상류 수호대로 합류했습니다!', 4500);
                setTimeout(() => {
                    if (typeof showNpcDialogue === 'function') {
                        showNpcDialogue('l4_salmon_join', { autoClose: 5000 });
                    }
                    this.check();
                }, 1500);
            }
        }

        // 두루미 영입 조건 체크
        if (level4_phase === 2 && !global_protectors.crane) {
            // 심은 버드나무 개수 집계
            let willowCount = 0;
            for (const [k, v] of Object.entries(gridData)) {
                if (v === 'willow') {
                    const [x, , z] = k.split(',').map(Number);
                    if (z > 20) willowCount++; // 산비탈 구역
                }
            }
            level4_conditions.willowPlantedCount = willowCount;

            if (willowCount >= 8) {
                global_protectors.crane = true;
                if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('crane', 3);
                if (typeof updateProtectorSlots === 'function') updateProtectorSlots();

                Level4Logic.enqueueEvent('🎉 두루미 뚜루가 정화 습지의 얕은 물가에 우아하게 착지하여 합류했습니다!', 4500);
                
                // 정화 습지 생성 연출 (산비탈 아래 물웅덩이 채워짐)
                this.spawnWetlandWaters();

                setTimeout(() => {
                    if (typeof showNpcDialogue === 'function') {
                        showNpcDialogue('l4_crane_join', { autoClose: 5000 });
                    }
                    this.check();
                }, 1500);
            }
        }

        // 연어와 두루미가 모두 영입되면 홍수 경보 발동
        if (level4_phase === 2 && global_protectors.salmon && global_protectors.crane) {
            level4_phase = 3;
            this.currentPhase = 3;
            setTimeout(() => {
                Level4Logic.triggerFloodAlert();
            }, 1000);
        }

        this.updateUI();
    },

    spawnWetlandWaters() {
        // 산비탈 아래 (X: 38..44, Z: 22..26)에 정화된 얕은 물길 형성
        for (let x = 38; x <= 44; x++) {
            for (let z = 22; z <= 26; z++) {
                const key = `${x},29,${z}`;
                if (!gridData[key]) {
                    gridData[key] = 'water';
                    const geom = new THREE.BoxGeometry(1, 0.4, 1);
                    const mat = new THREE.MeshLambertMaterial({ color: 0x0088cc, transparent: true, opacity: 0.6 });
                    const mesh = new THREE.Mesh(geom, mat);
                    mesh.position.set(x, 29.2, z);
                    scene.add(mesh);
                    meshByKey[key] = mesh;
                }
            }
        }
    },

    clearLevel4() {
        this.phaseComplete['flood'] = true;
        level4_phase = 4;
        this.currentPhase = 4;
        
        // 지형 색상 원래 푸른빛으로 보정
        const sourceConfig = BIOME_CONFIG.river_source;
        for (const [k, mesh] of Object.entries(meshByKey)) {
            const [x, , z] = k.split(',').map(Number);
            const dist = Math.hypot(x - sourceConfig.centerX, z - sourceConfig.centerZ);
            if (dist < sourceConfig.radius + 15 && mesh.material) {
                const def = getBlockData(gridData[k]);
                if (def && def.hex) {
                    mesh.material.color.setHex(def.hex);
                }
            }
        }

        const compass = document.getElementById('nav-compass');
        if (compass) compass.style.display = 'none';

        setTimeout(() => {
            toast('🎊 수호대들의 힘으로 100년 홍수를 물리쳤으며 강의 근원지가 영롱하게 되살아났습니다!');
            if (typeof showNpcDialogue === 'function') {
                showNpcDialogue('l4_clear', { autoClose: 6000 });
            }
            
            // 미션 클리어 팝업
            setTimeout(() => {
                const el = document.getElementById('level4-clear');
                if (el) el.style.display = 'block';
            }, 3000);
        }, 1000);

        this.updateUI();
    },

    updateUI() {
        const titleEl  = document.getElementById('mission-title');
        const descEl   = document.getElementById('mission-desc');
        const statusEl = document.getElementById('mission-status');

        if (!titleEl) return;

        titleEl.textContent = '🐟 [강의 근원지] 물과 숲의 순환 미션';

        const phase = level4_phase;
        const soyaRescued = level4_conditions.soyaRescued;
        const ownerConvinced = level4_conditions.ownerConvinced;
        const pollutionDevice = level4_conditions.pollutionDeviceInstalled;
        const damsRemoved = level4_conditions.cementDamRemovedCount;
        const willowCount = level4_conditions.willowPlantedCount;
        const timer = level4_conditions.floodTimer;

        if (descEl) {
            if (phase === 1) {
                descEl.innerHTML = '<b style="color:#FFD700">① 쓰레기 댐에 갇힌 쏘가리 쏘야를 구출하세요!</b> 삽이나 곡괭이로 쏘야 주변의 쓰레기 더미를 파헤쳐 길을 열어주세요.';
            } else if (phase === 2) {
                descEl.innerHTML = '강줄기를 회복하기 위해 펜션 오염을 정화하고 시멘트 보를 철거하며, 산비탈에 나무를 가꾸어 수호대들을 영입하세요!';
            } else if (phase === 3) {
                descEl.innerHTML = '<b style="color:#ff5555;font-size:1.15rem;">⚠️ 100년 홍수 비상 경보 발령! ⚠️</b> 범람하는 강둑을 보강하고 두루미/수달의 스킬을 써서 대홍수를 이겨내세요!';
            } else {
                descEl.innerHTML = '강의 근원지 복원 완료! 물과 숲이 맑고 웅장하게 흐릅니다.';
            }
        }

        if (statusEl) {
            if (phase === 1) {
                statusEl.innerHTML = `
                    <div class="mc${soyaRescued ? ' done' : ''}">
                        ${soyaRescued ? '✅' : '⭐'} 🐠 <b>쏘가리 쏘야 구조:</b> 강바닥의 쓰레기 댐 3개를 도구로 타격해 제거
                    </div>
                `;
            } else if (phase === 2) {
                statusEl.innerHTML = `
                    <div class="mc${pollutionDevice ? ' done' : ''}">
                        ${pollutionDevice ? '✅' : '1️⃣'} ⚙️ <b>오염 저감 장치 설치:</b> 펜션 주인 박씨 대화/설득 ➡️ 배출구에 오염 장치 설치
                        <small style="opacity:0.7"> -> 설득 여부: ${ownerConvinced ? '성공' : '미완료'}</small>
                    </div>
                    <div class="mc${damsRemoved >= 3 ? ' done' : ''}">
                        ${damsRemoved >= 3 ? '✅' : '2️⃣'} 🧱 <b>시멘트 보 제거:</b> 곡괭이로 강바닥 보 3개 파괴 (진행: ${damsRemoved}/3)
                    </div>
                    <div class="mc${willowCount >= 8 ? ' done' : ''}">
                        ${willowCount >= 8 ? '✅' : '3️⃣'} 🌳 <b>녹색 댐 조성:</b> 산비탈 구역(Z > 20)에 버드나무(willow) 8그루 이상 배치 (진행: ${willowCount}/8)
                    </div>
                `;
            } else if (phase === 3) {
                statusEl.innerHTML = `
                    <div style="background:rgba(255,85,85,0.15);border:1px solid #ff5555;border-radius:8px;padding:10px;text-align:center;margin-bottom:12px;">
                        <span style="font-size:1.1rem;font-weight:bold;color:#ff8888;">홍수 범람까지 남은 시간: <span style="font-size:1.3rem;">${timer}초</span></span>
                    </div>
                    <div style="display:flex;gap:10px;margin-bottom:10px;">
                        <button id="btn-otter-skill" style="flex:1;background:#0044bb;color:#fff;border:1px solid #00aaff;padding:8px 5px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:0.8rem;transition:all 0.2s;">🦦 수달: 둑 보강안내</button>
                        <button id="btn-crane-skill" style="flex:1;background:#228b22;color:#fff;border:1px solid #55cc99;padding:8px 5px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:0.8rem;transition:all 0.2s;">🦩 두루미: 폭우 예보</button>
                    </div>
                    <div style="font-size:0.85rem;color:#ccc;line-height:1.5;">
                        • <b>버드나무 녹색 댐:</b> ${willowCount}그루 심어짐 (8그루 권장)<br>
                        • <b>보강 규칙:</b> 수달을 호출해 지목된 약점 둑이 뚫리면 즉시 돌/흙 블록을 그 자리에 설치해 막으세요!
                    </div>
                `;

                // 스킬 버튼 이벤트 연결
                setTimeout(() => {
                    const ob = document.getElementById('btn-otter-skill');
                    const cb = document.getElementById('btn-crane-skill');
                    if (ob && !ob.dataset.bound) {
                        ob.dataset.bound = '1';
                        ob.addEventListener('click', () => Level4Logic.castOtterSkill());
                    }
                    if (cb && !cb.dataset.bound) {
                        cb.dataset.bound = '1';
                        cb.addEventListener('click', () => Level4Logic.castCraneSkill());
                    }
                }, 50);
            } else {
                statusEl.innerHTML = `
                    <div class="mc done">
                        ✅ 100년 홍수를 물리쳤으며 두루미와 연어가 수호대로 합류했습니다!
                    </div>
                `;
            }
        }
    },

    advance() {
        DBG('[Level4Manager] advance() 호출');
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QuestManager에 레벨 4 등록
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function registerLevel4() {
    if (typeof QuestManager !== 'undefined') {
        QuestManager.levels[4] = Level4Manager;
        DBG('[Level4Logic] QuestManager.levels[4] 등록 완료');
    } else {
        console.error('[Level4Logic] QuestManager를 찾을 수 없습니다!');
    }
})();
