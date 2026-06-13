// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  레벨 4: 강의 근원지 — 핵심 검증 알고리즘 + 미션 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const Level4Logic = {
    eventQueue: [],
    isEventPlaying: false,
    rainParticles: null,
    riverCells: [], // 강줄기 타겟 경로 셀 목록
    _floodInterval: null, // 100년 홍수 카운트다운 타이머 핸들
    _leveeGuideGroup: null,

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

    getInteractiveRoot(obj, flag) {
        let cur = obj;
        let match = null;
        while (cur) {
            if (cur.userData?.[flag]) match = cur;
            cur = cur.parent;
        }
        return match;
    },

    getPollutionInstallTarget(obj) {
        return this.getInteractiveRoot(obj, 'isPollutionOutlet') ||
            this.getInteractiveRoot(obj, 'isFoam') ||
            this.getInteractiveRoot(obj, 'isLevel4Pension');
    },

    countRemainingByFlag(flag) {
        const keys = new Set();
        scene.traverse(child => {
            const data = child.userData || {};
            const parentData = child.parent?.userData || {};
            const source = data[flag] ? data : parentData[flag] ? parentData : null;
            if (source?.gridKey) keys.add(source.gridKey);
        });
        return keys.size;
    },

    countHillsideWillows() {
        let count = 0;
        for (const [k, v] of Object.entries(gridData)) {
            if (v !== 'willow') continue;
            const [, , z] = k.split(',').map(Number);
            if (z > 20) count++;
        }
        return count;
    },

    refreshWillowProgress() {
        const count = this.countHillsideWillows();
        level4_conditions.willowPlantedCount = count;
        return count;
    },

    getFloodWeakPoints() {
        const points = [
            { x: 45, z: 5 },
            { x: 55, z: -10 },
            { x: 48, z: -25 }
        ];
        return points.map(p => ({ ...p, y: this.getLeveeBlockY(p.x, p.z) }));
    },

    getLeveeBlockY(x, z) {
        const gx = Math.round(x);
        const gz = Math.round(z);
        const terrainY = typeof getH === 'function' ? getH(gx, gz) : 30;
        const loadedTopY = typeof getTopY === 'function' ? getTopY(gx, gz) : 0;
        const loadedSurfaceY = loadedTopY > 0 ? loadedTopY - 1 : terrainY;
        const waterY = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 30;
        return Math.max(loadedSurfaceY, terrainY, waterY);
    },

    isLeveeOpen(p) {
        const block = gridData[`${p.x},${p.y},${p.z}`];
        return !block || block === 'water';
    },

    clearLeveeGuides() {
        if (!this._leveeGuideGroup) return;
        scene.remove(this._leveeGuideGroup);
        this._leveeGuideGroup = null;
    },

    showLeveeGuides(points, urgent = false) {
        this.clearLeveeGuides();
        const group = new THREE.Group();
        const color = urgent ? 0xffd34d : 0x00aaff;
        points.forEach((p, idx) => {
            const column = new THREE.Mesh(
                new THREE.BoxGeometry(1.25, 4.8, 1.25),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.46 })
            );
            column.position.set(p.x, p.y + 2.4, p.z);
            column.userData = { isLeveeGuide: true };
            group.add(column);

            const ring = new THREE.Mesh(
                new THREE.BoxGeometry(2.2, 0.18, 2.2),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
            );
            ring.position.set(p.x, p.y + 0.12, p.z);
            ring.userData = { isLeveeGuide: true };
            group.add(ring);

            if (typeof createEmojiSprite === 'function') {
                const marker = createEmojiSprite(urgent ? '⚠️' : '🦦');
                marker.position.set(p.x, p.y + 5.4, p.z);
                marker.scale.set(1.25, 1.25, 1);
                marker.userData = { isLeveeGuide: true };
                group.add(marker);
            }

            if (idx === 0 && typeof updateDestinationCompass === 'function') {
                updateDestinationCompass({
                    x: p.x,
                    z: p.z,
                    title: '🦦 둑 보강 위치',
                    hint: `X:${p.x}<br>Z:${p.z} 막기!`,
                    arrivedHint: '이 위치에<br>돌/흙 배치!',
                    arrivedText: '보강 위치 도착!',
                    radius: 5
                });
            }
        });
        scene.add(group);
        this._leveeGuideGroup = group;
        setTimeout(() => {
            if (this._leveeGuideGroup === group) this.clearLeveeGuides();
        }, 18000);
    },

    playRemovalEffect(key, color) {
        const [x, y, z] = key.split(',').map(Number);
        if (![x, y, z].every(Number.isFinite)) return;
        if (typeof clearBlockCrackEffect === 'function') clearBlockCrackEffect(key);
        if (typeof playBlockBreakEffect === 'function') playBlockBreakEffect(x, y, z, color);
    },

    installPollutionDevice() {
        const activeItem = hotbar[activeSlot];
        if (level4_conditions.pollutionDeviceInstalled) {
            this.alert('이미 펜션 방류구에 오염 저감 장치를 설치했습니다.');
            return true;
        }
        if (level4_phase < 2 || !level4_conditions.soyaRescued) {
            this.alert('먼저 쓰레기 댐을 해체해 쏘가리 쏘야를 구출해 주세요!');
            return true;
        }
        if (!level4_conditions.ownerConvinced) {
            this.alert('먼저 펜션 주인 박씨를 설득해야 오염 저감 장치를 설치할 수 있습니다.');
            return true;
        }
        if (activeItem !== 'low_pollution') {
            this.alert('오염 저감 장치(⚙️)를 장착한 뒤 펜션 방류구나 거품을 눌러 설치하세요!');
            return true;
        }

        hotbar[activeSlot] = null;
        if (typeof initInventoryUI === 'function') initInventoryUI();
        if (typeof applyCurrentTool === 'function') applyCurrentTool();

        level4_conditions.pollutionDeviceInstalled = true;
        this.enqueueEvent('⚙️ 펜션 방류구에 오염 저감 장치를 설치했습니다! 강물이 맑아지기 시작합니다.', 4000);
        this.removePollutionFoams();
        if (typeof Level4Manager !== 'undefined') {
            Level4Manager.showInstalledPollutionDevice?.();
            Level4Manager.updateUI?.();
            Level4Manager.check?.();
        }
        if (typeof invalidateRayCache === 'function') invalidateRayCache();
        return true;
    },

    // ──────────────────────────────────────────────
    // A. 클릭 및 아이템 상호작용 처리
    // ──────────────────────────────────────────────
    handleClick(obj) {
        const activeItem = hotbar[activeSlot];

        // 1. 쏘가리 구조 상호작용 (쓰레기 댐 제거)
        const trashDamObj = this.getInteractiveRoot(obj, 'isTrashDam');
        if (trashDamObj) {
            if (level4_phase === 1 && !level4_conditions.soyaRescued) {
                if (activeItem === 'shovel' || activeItem === 'pickaxe') {
                    // 생성 시 저장한 grid key를 사용해 정합성 보장 (position.y가 +0.5 오프셋이라 재계산 시 어긋남)
                    const key = trashDamObj.userData.gridKey ||
                        `${Math.round(trashDamObj.position.x)},${Math.round(trashDamObj.position.y)},${Math.round(trashDamObj.position.z)}`;

                    // 쓰레기 블록 파괴
                    this.playRemovalEffect(key, 0x708090);
                    scene.remove(trashDamObj);
                    delete gridData[key];
                    delete meshByKey[key];
                    deletedBlocks.add(key);
                    
                    // 남은 쓰레기 댐 검사
                    const remainingTrash = this.countRemainingByFlag('isTrashDam');

                    if (remainingTrash === 0) {
                        level4_conditions.soyaRescued = true;
                        
                        // 쏘가리 물속 탈출 연출
                        const soya = animalData.find(a => a.type === 'mandarin_fish');
                        if (soya) {
                            soya.x = 42;
                            soya.z = 20;
                            soya.y = typeof Level4Manager !== 'undefined'
                                ? Level4Manager.getVisibleMissionY(soya.x, soya.z) + 0.1
                                : getH(soya.x, soya.z) + 1.1;
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
                    if (typeof invalidateRayCache === 'function') invalidateRayCache();
                    return true;
                } else {
                    this.alert('삽(🪤) 또는 곡괭이(⛏️)를 장착하고 쓰레기 댐 블록을 파괴하세요!');
                    return true;
                }
            }
        }

        // 2. 펜션 방류구/거품/펜션 본체에 오염 저감 장치 설치
        const pollutionTarget = this.getPollutionInstallTarget(obj);
        if (pollutionTarget) {
            return this.installPollutionDevice();
        }

        // 2. 펜션 주인 박씨 설득 상호작용
        const ownerEntry = animalData.find(a => a.type === 'owner_park');
        if (ownerEntry && obj.userData.agr === ownerEntry.group) {
            if (level4_phase === 2) {
                if (level4_conditions.ownerConvinced) {
                    if (activeItem === 'low_pollution') {
                        return this.installPollutionDevice();
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
        const cementDamObj = this.getInteractiveRoot(obj, 'isCementDam');
        if (cementDamObj) {
            if (level4_phase === 2) {
                if (activeItem === 'pickaxe') {
                    // 생성 시 저장한 grid key를 사용해 정합성 보장
                    const key = cementDamObj.userData.gridKey ||
                        `${Math.round(cementDamObj.position.x)},${Math.round(cementDamObj.position.y)},${Math.round(cementDamObj.position.z)}`;

                    this.playRemovalEffect(key, 0xa0a0a0);
                    scene.remove(cementDamObj);
                    delete gridData[key];
                    delete meshByKey[key];
                    deletedBlocks.add(key);

                    level4_conditions.cementDamRemovedCount++;
                    const removed = level4_conditions.cementDamRemovedCount;

                    this.enqueueEvent(`🧱 시멘트 보 블록을 하나 부수었습니다. (${removed} / 3)`, 3500);

                    // 시멘트 보 제거는 removeBlock()을 거치지 않으므로 진행도 UI를 직접 갱신
                    Level4Manager.updateUI();

                    if (removed >= 3) {
                        Level4Manager.check();
                    }
                    if (typeof invalidateRayCache === 'function') invalidateRayCache();
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

        // 재대비(재호출) 시 이전 타이머가 살아있으면 정리해 중복 카운트다운 방지
        if (this._floodInterval) clearInterval(this._floodInterval);

        // 60초 타이머 개시
        this._floodInterval = setInterval(() => {
            if (!level4_conditions.isFlooding) {
                clearInterval(this._floodInterval);
                return;
            }

            level4_conditions.floodTimer--;
            const time = level4_conditions.floodTimer;

            if (time <= 0) {
                clearInterval(this._floodInterval);
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
        const leveeCandidates = this.getFloodWeakPoints();

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
                this.playRemovalEffect(k, 0x7a5c1e);
                scene.remove(mesh);
                delete meshByKey[k];
            }
            delete gridData[k];
            deletedBlocks.add(k);
            if (typeof invalidateRayCache === 'function') invalidateRayCache();
            this.showLeveeGuides([target], true);
            this.alert(`🌊 폭우로 인해 강둑(${target.x}, ${target.z})의 흙이 유실되어 무너졌습니다! 신속히 보강해 주세요!`);
        }
    },

    // ──────────────────────────────────────────────
    // D. 수호대 액션 스킬 가동
    // ──────────────────────────────────────────────
    castOtterSkill() {
        if (!global_protectors.otter) {
            if (currentLevel !== 4) {
                this.alert('🦦 수달 보글이가 아직 합류하지 않아 도움을 받을 수 없습니다!');
                return;
            }
            global_protectors.otter = true;
            if (typeof GuardianSystem !== 'undefined') GuardianSystem.updateState('otter', 3);
            if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
        }

        const weakPoints = this.getFloodWeakPoints();
        const brokenPoints = weakPoints.filter(p => this.isLeveeOpen(p));
        const guidePoints = brokenPoints.length ? brokenPoints : weakPoints;
        this.showLeveeGuides(guidePoints, brokenPoints.length > 0);

        const pointText = guidePoints.map(p => `X:${p.x} Z:${p.z}`).join(' / ');
        if (brokenPoints.length) {
            this.enqueueEvent(`🦦 수달 수리가 막아야 할 둑을 표시했습니다: ${pointText}`, 5000);
        } else {
            this.enqueueEvent(`🦦 아직 무너지진 않았지만 취약 둑 3곳을 미리 표시했습니다: ${pointText}`, 5000);
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
        const willowCount = this.refreshWillowProgress();

        // 2. 강둑이 보수되었는지(약점 3곳이 비어있는지 물이 채워져 있는지) 검사
        const weakPoints = this.getFloodWeakPoints();
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
            this.clearLeveeGuides();
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
    pensionGroup: null,
    phaseComplete: {
        soya: false,
        salmon: false,
        crane: false,
        flood: false
    },

    // 쏘가리, 펜션 주인, 시멘트 보 스폰 좌표 정의
    SOYA_SPAWN: { x: 42, y: 29.5, z: 20 },
    PENSION_SITE: { x: 50, z: 13 },
    OWNER_SPAWN: { x: 52, z: 16 },
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

        // 레벨 4 지역 청크와 동물을 먼저 로드한다. 이후 미션 오브젝트를 얹어야 지형 생성에 덮이지 않는다.
        if (typeof spawnLevel4Animals === 'function') {
            spawnLevel4Animals();
        }

        // 지형 데이터에 시멘트 보 배치 및 쓰레기 댐 배치
        this.spawnLevel4WhiteBoxElements();

        // 나침반 타이틀 업데이트 및 보이기
        const compass = document.getElementById('nav-compass');
        if (compass) {
            const titleEl = compass.querySelector('.nc-title');
            if (titleEl) titleEl.textContent = '💧 강의 근원지';
            compass.style.display = 'flex';
        }
        if (typeof updateDestinationCompass === 'function') {
            updateDestinationCompass({
                x: this.SOYA_SPAWN.x,
                z: this.SOYA_SPAWN.z,
                title: '💧 강의 근원지',
                hint: '쏘가리 쏘야<br>방향으로!',
                arrivedHint: '쏘가리 쏘야<br>방향으로!',
                arrivedText: '목표 도착!',
                radius: 30
            });
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

    getVisibleMissionY(x, z) {
        const waterY = typeof WATER_LEVEL !== 'undefined' ? WATER_LEVEL : 30;
        const gx = Math.round(x);
        const gz = Math.round(z);
        const loadedTopY = typeof getTopY === 'function' ? getTopY(gx, gz) : 0;
        const terrainTopY = typeof getH === 'function' ? getH(gx, gz) + 1 : 0;
        return Math.max(loadedTopY, terrainTopY, waterY);
    },

    clearLevel4WhiteBoxElements() {
        if (this.pensionGroup) {
            scene.remove(this.pensionGroup);
            this.pensionGroup = null;
        }

        for (const [key, obj] of Object.entries(meshByKey)) {
            if (obj?.userData?.isTrashDam || obj?.userData?.isCementDam) {
                scene.remove(obj);
                delete meshByKey[key];
                delete gridData[key];
            }
        }

        const foams = [];
        scene.traverse(child => {
            if (child.userData?.isFoam) foams.push(child);
        });
        foams.forEach(foam => scene.remove(foam));
    },

    createCementDamMesh(x, y, z, key) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.userData = { isBlock: true, bx: x, by: y, bz: z, isCementDam: true, gridKey: key };

        const edgeMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.32 });
        const makeMat = color => new THREE.MeshLambertMaterial({ color });
        const addBox = (w, h, d, px, py, pz, color) => {
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, makeMat(color));
            mesh.position.set(px, py, pz);
            mesh.castShadow = mesh.receiveShadow = true;
            mesh.userData = { isBlock: true, bx: x, by: y, bz: z, isCementDam: true, gridKey: key };
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone()));
            group.add(mesh);
            return mesh;
        };

        addBox(1.18, 1.05, 1.18, 0, 0.52, 0, 0xa8a8a8);
        addBox(1.42, 0.24, 1.42, 0, 1.18, 0, 0xc7c7c7);
        addBox(0.18, 1.45, 0.18, -0.54, 0.8, -0.54, 0x6b6b6b);
        addBox(0.18, 1.45, 0.18, 0.54, 0.8, 0.54, 0x6b6b6b);
        addBox(1.12, 0.14, 0.08, 0, 1.42, 0.58, 0xffd34d);
        addBox(1.12, 0.14, 0.08, 0, 1.62, 0.58, 0x3c3c3c);

        if (typeof createEmojiSprite === 'function') {
            const marker = createEmojiSprite('🧱');
            marker.position.set(0, 2.05, 0);
            marker.scale.set(1.05, 1.05, 1);
            group.add(marker);
        }

        if (typeof this.createLevel4TextSprite === 'function') {
            const label = this.createLevel4TextSprite('보', 128, 96);
            label.position.set(0, 2.85, 0);
            label.scale.set(1.15, 0.75, 1);
            label.userData = { isCementDam: true, gridKey: key };
            group.add(label);
        }

        return group;
    },

    placeLevel4MissionMesh(key, type, mesh) {
        if (meshByKey[key]) {
            scene.remove(meshByKey[key]);
            delete meshByKey[key];
        }
        gridData[key] = type;
        deletedBlocks.delete(key);
        scene.add(mesh);
        meshByKey[key] = mesh;
    },

    createTrashDamMesh(x, y, z, key) {
        const group = new THREE.Group();
        group.position.set(x, y + 0.48, z);
        group.userData = { isBlock: true, bx: x, by: y, bz: z, isTrashDam: true, gridKey: key };

        const darkMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        const mudMat = new THREE.MeshLambertMaterial({ color: 0x6e5c45 });
        const bagMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        const bottleMat = new THREE.MeshLambertMaterial({ color: 0x2f7f9f });
        const warningMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });

        const base = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.5, 1.08), mudMat);
        base.position.y = -0.12;
        base.castShadow = base.receiveShadow = true;
        base.add(new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry), edgeMat.clone()));
        group.add(base);

        const chunks = [
            { geo: new THREE.BoxGeometry(0.48, 0.42, 0.42), mat: bagMat, pos: [-0.22, 0.22, 0.12], rot: 0.25 },
            { geo: new THREE.BoxGeometry(0.52, 0.28, 0.36), mat: darkMat, pos: [0.2, 0.18, -0.16], rot: -0.35 },
            { geo: new THREE.CylinderGeometry(0.09, 0.09, 0.65, 8), mat: bottleMat, pos: [0.12, 0.38, 0.2], rot: 1.35 }
        ];

        chunks.forEach(({ geo, mat, pos, rot }) => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...pos);
            mesh.rotation.z = rot;
            mesh.castShadow = mesh.receiveShadow = true;
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone()));
            group.add(mesh);
        });

        const marker = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 3), warningMat);
        marker.position.set(0, 0.92, 0);
        marker.rotation.x = Math.PI;
        group.add(marker);

        if (typeof createEmojiSprite === 'function') {
            const label = createEmojiSprite('🗑️');
            label.position.set(0, 1.28, 0);
            label.scale.set(0.9, 0.9, 1);
            group.add(label);
        }

        return group;
    },

    clearPensionFootprint() {
        const { x, z } = this.PENSION_SITE;
        for (let dx = -4; dx <= 4; dx++) {
            for (let dz = -3; dz <= 4; dz++) {
                const wx = x + dx;
                const wz = z + dz;
                for (let y = 0; y <= GH; y++) {
                    const key = bk(wx, y, wz);
                    const type = gridData[key];
                    const obj = meshByKey[key];
                    if (!obj) continue;
                    if (obj.userData?.isDecorative || (typeof isDecorativeType === 'function' && isDecorativeType(type))) {
                        scene.remove(obj);
                        delete meshByKey[key];
                        delete gridData[key];
                    }
                }
            }
        }
    },

    getPensionBaseY() {
        const { x, z } = this.PENSION_SITE;
        let y = this.getVisibleMissionY(x, z);
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -2; dz <= 3; dz++) {
                y = Math.max(y, this.getVisibleMissionY(x + dx, z + dz));
            }
        }
        return y + 0.08;
    },

    createPensionLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(46, 34, 22, 0.92)';
        ctx.fillRect(18, 32, 220, 64);
        ctx.strokeStyle = '#f7d58a';
        ctx.lineWidth = 5;
        ctx.strokeRect(18, 32, 220, 64);
        ctx.fillStyle = '#fff4c8';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('펜션', 128, 65);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(2.4, 1.2, 1);
        sprite.userData = { isLevel4PensionLabel: true };
        return sprite;
    },

    createLevel4TextSprite(text, width = 256, height = 128) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(10, 28, width - 20, height - 56);
        ctx.strokeStyle = '#ffd86b';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 28, width - 20, height - 56);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(2.2, 1.1, 1);
        return sprite;
    },

    createPensionSite() {
        this.clearPensionFootprint();
        const { x, z } = this.PENSION_SITE;
        const baseY = this.getPensionBaseY();
        const group = new THREE.Group();
        group.position.set(x, baseY, z);
        group.userData = { isLevel4Pension: true, isPollutionOutlet: true };

        const mat = color => new THREE.MeshLambertMaterial({ color });
        const addBox = (w, h, d, color, px, py, pz) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
            mesh.position.set(px, py, pz);
            mesh.castShadow = mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };

        addBox(6.4, 0.22, 5.0, 0x6b4a2e, 0, 0.08, 0.25);
        addBox(4.9, 2.2, 3.4, 0xf3d79c, 0, 1.28, 0);
        addBox(1.0, 1.45, 0.12, 0x6e3f24, 0, 0.78, 1.76);
        addBox(0.72, 0.52, 0.14, 0x86c5e8, -1.35, 1.45, 1.77);
        addBox(0.72, 0.52, 0.14, 0x86c5e8, 1.35, 1.45, 1.77);
        addBox(0.88, 0.62, 0.14, 0x86c5e8, -2.52, 1.42, -0.7);
        addBox(0.88, 0.62, 0.14, 0x86c5e8, 2.52, 1.42, -0.7);
        addBox(0.45, 1.05, 0.45, 0x5a3b2a, 1.65, 2.82, -0.75);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 1.25, 4), mat(0x9f2f28));
        roof.position.set(0, 2.72, 0);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = roof.receiveShadow = true;
        group.add(roof);

        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.4, 12), mat(0x666666));
        pipe.position.set(-3.45, 0.42, 0.9);
        pipe.rotation.z = Math.PI / 2;
        pipe.castShadow = pipe.receiveShadow = true;
        pipe.userData = { isPollutionOutlet: true };
        group.add(pipe);

        const sign = this.createPensionLabel();
        sign.position.set(0, 2.35, 1.95);
        group.add(sign);

        if (typeof createEmojiSprite === 'function') {
            const marker = createEmojiSprite('🏡');
            marker.position.set(0, 4.2, 0.2);
            marker.scale.set(2.3, 2.3, 1);
            group.add(marker);
        }

        scene.add(group);
        this.pensionGroup = group;
        return group;
    },

    showInstalledPollutionDevice() {
        if (!this.pensionGroup || this.pensionGroup.userData.pollutionDeviceMesh) return;
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.62, 0.42, 0.32),
            new THREE.MeshLambertMaterial({ color: 0x56c7d8, emissive: 0x114455, emissiveIntensity: 0.2 })
        );
        box.position.set(-2.95, 0.78, 1.18);
        box.castShadow = box.receiveShadow = true;
        box.userData = { isPollutionDeviceInstalled: true };

        const light = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.18, 0.05),
            new THREE.MeshBasicMaterial({ color: 0x66ff99 })
        );
        light.position.set(0.18, 0.06, 0.18);
        box.add(light);

        this.pensionGroup.add(box);
        this.pensionGroup.userData.pollutionDeviceMesh = box;
    },

    getInteractionMeshes() {
        const meshes = [];
        if (this.pensionGroup && this.pensionGroup.parent) {
            this.pensionGroup.traverse(child => {
                if (child.isMesh || child.isSprite) meshes.push(child);
            });
        }
        scene.traverse(child => {
            if (child.userData?.isFoam || child.userData?.isPollutionOutlet) {
                if (child.isMesh || child.isSprite) meshes.push(child);
            }
        });
        return meshes;
    },

    needsLevel4LandmarkRepair() {
        const owner = animalData.find(a => a.type === 'owner_park');
        const ownerMissing = !owner || !owner.group || !owner.group.parent;
        const ownerMoved = owner && Math.hypot(owner.x - this.OWNER_SPAWN.x, owner.z - this.OWNER_SPAWN.z) > 0.5;
        const ownerUnlabeled = owner && owner.group && !owner.group.userData?.level4OwnerLabel;
        return !this.pensionGroup || !this.pensionGroup.parent || ownerMissing || ownerMoved || ownerUnlabeled;
    },

    ensurePensionAndOwnerVisible() {
        if (!this.pensionGroup || !this.pensionGroup.parent) {
            this.createPensionSite();
        }

        let owner = animalData.find(a => a.type === 'owner_park');
        const spawn = this.OWNER_SPAWN;
        const y = typeof getVisualTopY === 'function'
            ? getVisualTopY(spawn.x, spawn.z)
            : this.getVisibleMissionY(spawn.x, spawn.z) + 1;

        if (!owner && typeof placeAnimal === 'function') {
            placeAnimal(spawn.x, y, spawn.z, 'owner_park');
            owner = animalData.find(a => a.type === 'owner_park');
        }
        if (!owner || !owner.group) return;

        owner.x = spawn.x;
        owner.y = y;
        owner.z = spawn.z;
        owner.angle = Math.PI * 1.35;
        owner.targetAngle = owner.angle;
        owner.group.position.set(owner.x, owner.y, owner.z);
        owner.group.scale.set(1.45, 1.45, 1.45);
        if (!owner.group.parent) scene.add(owner.group);

        if (!owner.group.userData.level4OwnerLabel) {
            const label = this.createLevel4TextSprite('박씨', 192, 112);
            label.position.set(0, 2.25, 0);
            label.userData = { isLevel4OwnerLabel: true };
            owner.group.add(label);
            owner.group.userData.level4OwnerLabel = true;
        }
    },

    spawnLevel4WhiteBoxElements() {
        this.clearLevel4WhiteBoxElements();
        this.createPensionSite();

        // 1. 강을 가로막는 시멘트 보 3개 배치
        const placedCementCells = [];
        this.DAM_COORDS.forEach(c => {
            const y = this.getVisibleMissionY(c.x, c.z);
            const key = `${c.x},${y},${c.z}`;
            const mesh = this.createCementDamMesh(c.x, y, c.z, key);
            this.placeLevel4MissionMesh(key, 'cement_dam', mesh);
            placedCementCells.push({ x: c.x, y, z: c.z });
        });
        level4_conditions.cementDamCells = placedCementCells;

        // 2. 쏘가리가 갇힌 쓰레기 댐(X=42, Z=20 주위 3칸) 배치
        const trashCoords = [
            { x: 42, z: 19 },
            { x: 41, z: 20 },
            { x: 43, z: 20 }
        ];
        trashCoords.forEach(c => {
            const y = this.getVisibleMissionY(c.x, c.z);
            const key = `${c.x},${y},${c.z}`;
            const mesh = this.createTrashDamMesh(c.x, y, c.z, key);
            this.placeLevel4MissionMesh(key, 'city_trash', mesh);
        });

        // 3. 펜션 앞 방류구 근처에 거품(foam) 블록 배치
        const foamCoords = [
            { x: 49, z: 12 },
            { x: 48, z: 13 },
            { x: 51, z: 13 }
        ];
        foamCoords.forEach(c => {
            const y = this.getVisibleMissionY(c.x, c.z) + 0.35;
            const geom = new THREE.SphereGeometry(0.3, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const foam = new THREE.Mesh(geom, mat);
            foam.position.set(c.x, y, c.z);
            foam.userData = { isFoam: true, isPollutionOutlet: true };
            scene.add(foam);
        });

        if (typeof invalidateRayCache === 'function') invalidateRayCache();
        this.ensurePensionAndOwnerVisible();
        if (level4_conditions.pollutionDeviceInstalled) this.showInstalledPollutionDevice();
    },

    check() {
        if (currentLevel !== 4) return;
        const willowCount = Level4Logic.refreshWillowProgress();

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

        if (typeof hideDestinationCompass === 'function') hideDestinationCompass();

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
        const willowCount = Level4Logic.refreshWillowProgress();
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

    updateArrows(t) {
        this.updateNavCompass();
    },

    updateNavCompass() {
        if (this.phaseComplete.flood || level4_phase >= 4) {
            if (typeof hideDestinationCompass === 'function') hideDestinationCompass();
            return;
        }
        if (this.needsLevel4LandmarkRepair()) {
            this.ensurePensionAndOwnerVisible();
        }
        // 현재 단계에 따라 목표 좌표 설정
        let TX, TZ, hintText, titleText = '💧 강의 근원지';
        if (level4_phase === 1 || !level4_conditions.soyaRescued) {
            TX = 42; TZ = 20;  // 쏘가리 위치
            hintText = '쏘가리 쏘야<br>방향으로!';
        } else if (!level4_conditions.pollutionDeviceInstalled) {
            TX = this.OWNER_SPAWN.x;
            TZ = this.OWNER_SPAWN.z;
            titleText = '🏡 펜션 오염원';
            hintText = level4_conditions.ownerConvinced
                ? '펜션 방류구에<br>장치 설치!'
                : '펜션 주인 박씨<br>설득하기!';
        } else if (level4_conditions.cementDamRemovedCount < 3) {
            const nextDam = level4_conditions.cementDamCells?.[level4_conditions.cementDamRemovedCount] || this.DAM_COORDS[0];
            TX = nextDam.x;
            TZ = nextDam.z;
            hintText = '시멘트 보<br>철거하기!';
        } else if (!global_protectors.crane) {
            TX = 40;
            TZ = 24;
            hintText = '산비탈에<br>버드나무 심기!';
        } else {
            const riverSource = BIOME_CONFIG.river_source;
            TX = riverSource.centerX;
            TZ = riverSource.centerZ;
            hintText = '강의 근원지<br>탐험하세요!';
        }
        if (typeof updateDestinationCompass !== 'function') return;
        updateDestinationCompass({
            x: TX,
            z: TZ,
            title: titleText,
            hint: hintText,
            arrivedHint: hintText,
            arrivedText: '목표 도착!',
            radius: 30
        });
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
