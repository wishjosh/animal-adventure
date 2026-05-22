// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LEVEL 6: 초록별 심장부 비즈니스 로직
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Level6Manager {
  static currentPhase = 0; // 0: 시작, 1: 기후이상파견, 2: 반달곰신뢰, 3: 심장박동회복, 4: 엔딩, 5: 샌드박스
  static activeSignals = {
    arctic: { label: '북극 빙하 녹음', coords: [150, 40], solved: false, required: 'crane', icon: '🦩', detail: '기온 상승으로 빙하가 무너지며 두루미의 한계선이 흔들립니다.' },
    amazon: { label: '아마존 대화재', coords: [220, 180], solved: false, required: 'eagle', icon: '🦅', detail: '산불 연기로 산소가 파괴되고 있습니다. 독수리의 정화가 필요합니다.' },
    reef: { label: '태평양 백화현상', coords: [90, 150], solved: false, required: 'salmon', icon: '🐟', detail: '수온 급상승으로 산호초와 연어가 떼죽음 위험에 빠졌습니다.' },
    siberia: { label: '시베리아 동토 해빙', coords: [280, 70], solved: false, required: 'otter', icon: '🦦', detail: '탄소가 대량 누출되는 수계를 지킬 수달의 방벽이 시급합니다.' },
    village: { label: '초록마을 탄소 급감', coords: [340, 130], solved: false, required: 'sheep', icon: '🐑', detail: '목초지가 마르고 있어 양의 탄소 흡수 식생 관리가 필요합니다.' }
  };

  static init() {
    Level6Manager.currentPhase = 1;
    level6_phase = 1;
    level6_conditions.bridgeCutscenePlayed = false;
    level6_conditions.dispatchedCount = 0;
    level6_conditions.bearEncountered = false;
    level6_conditions.bearAcornFedCount = 0;
    level6_conditions.heartBeatScore = 0;
    level6_conditions.globalStabilized = false;

    for (const key in Level6Manager.activeSignals) {
      Level6Manager.activeSignals[key].solved = false;
    }

    DBG('[Level6] Level6Manager.init() 실행');

    // 1. 동물 스폰
    if (typeof spawnLevel6Animals === 'function') {
      spawnLevel6Animals();
    }

    // 2. 카메라를 심장부 중심으로
    if (typeof controls !== 'undefined' && controls.target) {
      controls.target.set(0, 32, -80);
      camera.position.set(20, 50, -45);
    }

    // 3. 브릿지 물방울 컷신 연출 (10초 시뮬레이션 후 세계 지도 오픈)
    Level6Manager.playWaterDropBridgeCutscene();
  }

  static playWaterDropBridgeCutscene() {
    toast('🌊 지구 순환 브릿지 컷신 연출 중...');
    
    // 심장부 하늘에 화려한 파란색 오로라 입자 흐름 시뮬레이션
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.SphereGeometry(0.18, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.9 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set((Math.random() - 0.5) * 30, 45 + Math.random() * 5, -80 + (Math.random() - 0.5) * 30);
      scene.add(m);
      particles.push(m);
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      particles.forEach(p => {
        p.position.y -= 0.1;
        p.position.x += Math.sin(frame * 0.1 + p.position.y) * 0.05;
        p.material.opacity = Math.max(0, p.material.opacity - 0.01);
      });
      if (frame >= 90) {
        clearInterval(interval);
        particles.forEach(p => scene.remove(p));
        
        // 컷신 종료 후 세계 지도 호출
        level6_conditions.bridgeCutscenePlayed = true;
        
        if (typeof showNpcDialogue === 'function') {
          showNpcDialogue('l6_intro');
        }
        
        setTimeout(() => {
          if (typeof showNpcDialogue === 'function') {
            showNpcDialogue('l6_abnormal_signals');
          }
          Level6Manager.showWorldMapPopup();
        }, 4000);
      }
    }, 30);
  }

  static showWorldMapPopup() {
    const existing = document.getElementById('world-map-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'world-map-popup';
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 680px; padding: 24px; background: rgba(10, 20, 30, 0.92);
      backdrop-filter: blur(16px); border: 2px solid rgba(79, 195, 247, 0.4);
      border-radius: 20px; color: #fff; font-family: sans-serif; z-index: 10000;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    `;

    let nodesHtml = '';
    for (const key in Level6Manager.activeSignals) {
      const sig = Level6Manager.activeSignals[key];
      const color = sig.solved ? '#4caf50' : '#ef5350';
      const statusIcon = sig.solved ? '🟢' : '🚨';
      const pulseClass = sig.solved ? '' : 'animation: pulse 1.2s infinite;';
      nodesHtml += `
        <div onclick="Level6Manager.clickSignalNode('${key}')" style="
          position: absolute; left: ${sig.coords[0]}px; top: ${sig.coords[1]}px;
          display: flex; flex-direction: column; align-items: center; cursor: pointer;
          transform: translate(-50%, -50%); ${pulseClass}
        ">
          <div style="font-size: 24px; filter: drop-shadow(0 0 5px ${color});">${sig.icon}</div>
          <div style="background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; border: 1px solid ${color}; white-space: nowrap; margin-top: 4px;">
            ${statusIcon} ${sig.label}
          </div>
        </div>
      `;
    }

    popup.innerHTML = `
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); filter: brightness(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      </style>
      <h3 style="margin: 0 0 16px 0; color: #4fc3f7; text-align: center; font-size: 22px; font-weight: bold;">🗺️ 초록별 홀로그램 기후 지도</h3>
      
      <!-- 세계 지도 판넬 백그라운드 -->
      <div style="position: relative; width: 632px; height: 260px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <!-- 지도 도트 무늬 연출 -->
        <div style="position: absolute; width:100%; height:100%; opacity:0.15; background: radial-gradient(circle, #4fc3f7 1px, transparent 1px); background-size: 12px 12px;"></div>
        
        <!-- 이상 신호 노드들 -->
        ${nodesHtml}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; color: #b0bec5;">
          지구 정화 진행율: <b style="color:#26a69a;">${level6_conditions.dispatchedCount} / 5 구역 완료</b>
        </div>
        <button onclick="document.getElementById('world-map-popup').remove()" style="padding: 8px 18px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color:#fff; cursor:pointer;">
          지도 닫기
        </button>
      </div>
    `;

    document.body.appendChild(popup);
  }

  static clickSignalNode(key) {
    const sig = Level6Manager.activeSignals[key];
    if (sig.solved) {
      toast(`✅ ${sig.label}은(는) 이미 안정화되었습니다.`);
      return;
    }

    // 파견 확인 창 생성
    const confirmPopup = document.createElement('div');
    confirmPopup.id = 'dispatch-confirm-popup';
    confirmPopup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 380px; padding: 24px; background: rgba(15, 25, 35, 0.95);
      backdrop-filter: blur(12px); border: 1px solid #4fc3f7; border-radius: 16px;
      color: #fff; font-family: sans-serif; z-index: 10001;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    `;

    confirmPopup.innerHTML = `
      <h4 style="margin: 0 0 8px 0; color: #ffb74d; font-size: 17px;">🚨 ${sig.label}</h4>
      <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.5; color: #ccc;">
        ${sig.detail}
      </p>
      <div style="margin-bottom: 20px; font-size: 13px;">
        💡 파견 적합 수호대: <b style="color: #4fc3f7; font-size:14px;">${ITEM_DB[sig.required]?.label || sig.required}</b>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="document.getElementById('dispatch-confirm-popup').remove()" style="padding: 8px 14px; background: rgba(255,255,255,0.08); border:none; border-radius:6px; color:#fff; cursor:pointer;">취소</button>
        <button onclick="Level6Manager.dispatchProtector('${key}')" style="padding: 8px 18px; background: #0288d1; border:none; border-radius:6px; color:#fff; font-weight:bold; cursor:pointer;">수호대 파견</button>
      </div>
    `;

    document.body.appendChild(confirmPopup);
  }

  static dispatchProtector(key) {
    const sig = Level6Manager.activeSignals[key];
    const confirmPopup = document.getElementById('dispatch-confirm-popup');
    if (confirmPopup) confirmPopup.remove();

    // 플레이어가 해당 수호대를 이미 영입했는지 확인
    const isRecruited = global_protectors[sig.required];

    if (!isRecruited) {
      // 에러 경고 팝업
      const alertPopup = document.createElement('div');
      alertPopup.style.cssText = `
        position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
        padding: 18px; background: rgba(183, 28, 28, 0.95); border: 1px solid #ef5350;
        border-radius: 12px; color: #fff; font-family: sans-serif; text-align: center;
        z-index: 10002; box-shadow: 0 8px 25px rgba(0,0,0,0.5);
      `;
      alertPopup.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 8px;">⚠️ 파견 불가</div>
        <p style="margin: 0 0 12px 0; font-size: 13.5px; line-height: 1.4;">
          해당 위기 지역을 극복할 <b>[${ITEM_DB[sig.required]?.label || sig.required}]</b> 수호대가<br>아직 영입되지 않았습니다!
        </p>
        <button onclick="this.parentElement.remove()" style="padding: 6px 14px; background: #fff; color: #b71c1c; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">확인</button>
      `;
      document.body.appendChild(alertPopup);
      return;
    }

    // 파견 성공 처리
    sig.solved = true;
    level6_conditions.dispatchedCount++;
    toast(`🦩 수호대 파견 완료! ${sig.label} 구역이 정상 복구 중입니다.`);

    // 홀로그램 맵 갱신
    Level6Manager.showWorldMapPopup();

    // 5곳 모두 완수 여부 판단
    if (level6_conditions.dispatchedCount >= 5) {
      setTimeout(() => {
        const popup = document.getElementById('world-map-popup');
        if (popup) popup.remove();
        Level6Manager.proceedToBearPhase();
      }, 2000);
    }
  }

  // 2단계: 반달곰 조우 및 신뢰 쌓기 돌입
  static proceedToBearPhase() {
    Level6Manager.currentPhase = 2;
    level6_phase = 2;
    level6_conditions.bearEncountered = true;

    // 도토리 획득 퀵바 지급
    if (typeof hotbar !== 'undefined') {
      hotbar[5] = 'acorn'; // 도토리
      if (typeof renderHotbar === 'function') renderHotbar();
    }

    if (typeof showNpcDialogue === 'function') {
      showNpcDialogue('l6_bear_encounter');
    }
  }

  // 매 프레임/블록 갱신 감지 웅이 도토리 먹기 체크
  static checkBearFeed(x, y, z) {
    if (Level6Manager.currentPhase !== 2) return;

    // 웅이 캐릭터 찾기
    const bear = animalData.find(a => a.type === 'bear');
    if (!bear) return;

    // 배치된 도토리 블록과 웅이 사이의 거리 측정
    const dx = bear.x - x, dz = bear.z - z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    if (dist <= 2.2) {
      // 웅이가 접근해서 먹음
      _remove(x, y, z);
      playBlockBreakEffect(x, y, z, 0xa0522d); // 도토리 브레이크 파티클
      
      level6_conditions.bearAcornFedCount++;
      toast(`🐻 웅이가 도토리를 맛있게 먹었습니다! (신뢰도: ${level6_conditions.bearAcornFedCount} / 3)`);

      // 3단계 클리어 시 최종 수호대 합류
      if (level6_conditions.bearAcornFedCount >= 3) {
        if (typeof GuardianSystem !== 'undefined' && typeof GuardianSystem.updateState === 'function') {
          GuardianSystem.updateState('bear', 3);
        } else {
          global_protectors.bear = true;
          guardianState.bear = 3;
          if (typeof renderGuardians === 'function') renderGuardians();
        }

        Level6Manager.currentPhase = 3;
        level6_phase = 3;

        setTimeout(() => {
          if (typeof showNpcDialogue === 'function') {
            showNpcDialogue('l6_bear_join');
          }
          Level6Manager.startGlobalStabilization();
        }, 1500);
      }
    }
  }

  // 3단계: 최종 지구 심장 박동률 게이지 회복 루프
  static startGlobalStabilization() {
    level6_conditions.heartBeatScore = 0;
    
    const board = document.createElement('div');
    board.id = 'heartbeat-dashboard-ui';
    board.style.cssText = `
      position: fixed; top: 80px; right: 20px; width: 250px;
      padding: 18px; background: rgba(10, 10, 15, 0.9);
      backdrop-filter: blur(10px); border: 2px solid rgba(229, 115, 115, 0.5);
      border-radius: 16px; color: #fff; font-family: sans-serif; z-index: 999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5); text-align: center;
    `;
    document.body.appendChild(board);

    // 12마리 심장 활성화 시각 연출 및 맥동 루프
    let score = 0;
    const interval = setInterval(() => {
      score += 5;
      level6_conditions.heartBeatScore = score;

      board.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #ef5350; font-size: 16px; font-weight: bold;">💓 초록별 심장 박동 회복</h4>
        <div style="font-size: 36px; margin: 8px 0; animation: beat 0.8s infinite; color:#ef5350; filter: drop-shadow(0 0 8px #ef5350);">❤️</div>
        <div style="font-size: 14px; margin-bottom: 8px;">12마리 수호대 심장 주파수 연동</div>
        <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; margin-bottom: 8px;">
          <div style="width: ${score}%; height: 100%; background: linear-gradient(90deg, #ef5350, #ff8a80); border-radius: 5px; transition: width 0.1s;"></div>
        </div>
        <div style="font-size: 16px; font-weight: bold; color: #ff8a80;">${score}% 충전 완료</div>
        
        <style>
          @keyframes beat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        </style>
      `;

      if (score >= 100) {
        clearInterval(interval);
        board.remove();
        
        Level6Manager.currentPhase = 4;
        level6_phase = 4;
        level6_conditions.globalStabilized = true;

        if (typeof showNpcDialogue === 'function') {
          showNpcDialogue('l6_clear');
        }

        setTimeout(() => {
          Level6Manager.showFinalEndingOverlay();
        }, 4000);
      }
    }, 500); // 10초간 상승
  }

  static showFinalEndingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'final-ending-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(5, 8, 15, 0.95); display: flex; flex-direction: column;
      align-items: center; justify-content: center; color: #fff; font-family: sans-serif;
      z-index: 100000; overflow-y: auto; padding: 40px 20px;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 40px; background: rgba(255,255,255,0.02); border: 1px solid rgba(239, 83, 80, 0.3); border-radius: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
        <div style="font-size: 80px; margin-bottom: 24px; animation: glow 2s infinite alternate;">🌍💚</div>
        <h1 style="margin: 0 0 12px 0; font-size: 36px; background: linear-gradient(135deg, #a5d6a7, #ef5350); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; letter-spacing: 1.5px;">초록별의 수호대 대장</h1>
        <h3 style="margin: 0 0 24px 0; font-size: 18px; color: #81c784; font-weight: normal;">지구 생태 순환망 완전 정상화 성공</h3>
        <p style="margin: 0 0 35px 0; font-size: 15px; color: #b0bec5; line-height: 1.7; text-align: justify; text-justify: inter-word;">
          처음 마주했던 초록 마을의 시든 고목나무 그늘 아래 참새와 양 한 마리,<br>
          다양성의 숲 연못의 습지 개구리들과 물길을 연 수달,<br>
          먹이사슬의 평화로운 순환을 되찾아 주었던 평원의 붉은여우와 독수리,<br>
          강을 가로막던 펜션을 설득하고 녹색 댐을 세워 연어가 펄떡이며 올라오던 하천 상류,<br>
          그리고 회색 도시의 벽을 뚫어 동물 통로를 연결해 준 경계 도시의 여정까지...<br><br>
          모든 수호대가 마침내 손을 잡아, 지구 기온 연쇄 붕괴를 저지하고 생태의 심장을 규칙적인 맥박으로 되살려 냈습니다.
        </p>
        <div style="margin-bottom: 30px; font-size: 16px; font-weight: bold; color: #ffd54f;">
          "수고했어, 수호대 대장. 초록별이 따뜻한 바람으로 고맙다고 해."
        </div>
        <button onclick="Level6Manager.unlockSandboxMode()" style="padding: 14px 40px; background: linear-gradient(135deg, #ef5350, #ffb74d); border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(239,83,80,0.4); transition: all 0.3s;">
          무한 자유 샌드박스 모드 해금!
        </button>
      </div>
      
      <style>
        @keyframes glow {
          from { filter: drop-shadow(0 0 5px rgba(239, 83, 80, 0.4)); }
          to { filter: drop-shadow(0 0 20px rgba(239, 83, 80, 0.8)); }
        }
      </style>
    `;

    document.body.appendChild(overlay);
  }

  static handleClick(x, y, z) {
    // Level 6 상호작용은 세계지도 팝업과 블록 설치 훅(checkBearFeed)으로 처리
    return false;
  }

  static unlockSandboxMode() {
    const overlay = document.getElementById('final-ending-overlay');
    if (overlay) overlay.remove();

    Level6Manager.currentPhase = 5;
    level6_phase = 5;

    // 무한 샌드박스 치트 도구 지급 및 안개 제거
    if (typeof scene !== 'undefined' && scene.fog) {
      scene.fog.far = 1000;
      scene.fog.near = 500;
    }

    toast('🎉 축하합니다! 모든 안개가 걷히고 원하는 곳에 동물을 배치할 수 있는 무한 자유 모드가 해금되었습니다.');
  }
}

// 글로벌 등록
window.Level6Manager = Level6Manager;
if (typeof QuestManager !== 'undefined') {
  QuestManager.levels[6] = Level6Manager;
}
