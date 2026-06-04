// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LEVEL 5: 경계 도시 비즈니스 로직
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Level5Manager {
  static currentPhase = 0; // 0: 시작, 1: 너구리 구출, 2: 생태통로/비오톱/공무원, 3: 심사보스, 4: 클리어
  static _auditLastTick = null; // 심사 타이머 실시간 delta 추적용 (ms)

  static init() {
    Level5Manager.currentPhase = 1;
    level5_phase = 1;
    level5_conditions.raccoonRescued = false;
    level5_conditions.officerConvinced = false;
    level5_conditions.viaductConnected = false;
    level5_conditions.tunnelBuilt = false;
    level5_conditions.biotopePlacedCount = 0;
    level5_conditions.biotopeCells = [];
    level5_conditions.isAuditing = false;

    DBG('[Level5] Level5Manager.init() 실행');
    
    // 1. 동물들 스폰
    if (typeof spawnLevel5Animals === 'function') {
      spawnLevel5Animals();
    }

    // 2. 카메라를 경계 도시 중심으로 이동
    if (typeof orbitTarget !== 'undefined' && typeof syncCam === 'function') {
      orbitTarget.set(-45, 35, 75);
      syncCam();
    }

    // 3. 할머니 인트로 대화 팝업
    if (typeof uiShowNpcDialogue === 'function') {
      uiShowNpcDialogue('l5_intro');
    } else if (typeof showNpcDialogue === 'function') {
      showNpcDialogue('l5_intro');
    }

    Level5Manager.updateUI();
  }

  static update(t) {
    if (Level5Manager.currentPhase === 3 && level5_conditions.isAuditing) {
      // 심사 보스전 진행 중 — 실시간 delta로 카운트다운 (프레임 레이트 무관)
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (Level5Manager._auditLastTick == null) Level5Manager._auditLastTick = now;
      const dt = (now - Level5Manager._auditLastTick) / 1000;
      Level5Manager._auditLastTick = now;

      level5_conditions.auditTimer -= dt;
      if (level5_conditions.auditTimer <= 0) {
        level5_conditions.auditTimer = 0;
        level5_conditions.isAuditing = false;
        Level5Manager._auditLastTick = null;
        Level5Manager.completeAudit();
      }
      Level5Manager.updateAuditProgressUI();
    }
  }

  static check() {
    if (Level5Manager.currentPhase >= 2 && level5_conditions.officerConvinced) {
      Level5Manager.checkViaductConnection();
      Level5Manager.checkTunnel();
      Level5Manager.checkBiotope();
      Level5Manager.checkTransitionToAudit();
    }
    Level5Manager.updateUI();
  }

  static updateUI() {
    const title = document.getElementById('mission-title');
    const desc = document.getElementById('mission-desc');
    const status = document.getElementById('mission-status');
    if (!title || !desc || !status) return;

    const trashCount = Object.values(gridData).filter(type => type && type.startsWith('city_trash')).length;
    const tunnelCount = Object.values(gridData).filter(type => type && type.startsWith('wildlife_tunnel')).length;
    const score = Math.round(level5_conditions.auditScore || 0);

    title.textContent = 'Level 5. 경계 도시';

    if (Level5Manager.currentPhase === 1) {
      desc.textContent = '회색 도시의 쓰레기를 치워 라쿤이를 구출하세요.';
      status.innerHTML = `<div class="mc">도심 쓰레기: ${trashCount}개 남음</div><div class="mc">라쿤이 구조: ${level5_conditions.raccoonRescued ? '완료' : '진행 중'}</div>`;
    } else if (Level5Manager.currentPhase === 2) {
      desc.textContent = '생태 육교, 동물 터널, 옥상 비오톱으로 도시와 숲을 연결하세요.';
      status.innerHTML = `
        <div class="mc">공무원 설득: ${level5_conditions.officerConvinced ? '완료' : '필요'}</div>
        <div class="mc">생태 육교: ${level5_conditions.viaductConnected ? '연결됨' : '미완성'}</div>
        <div class="mc">동물 터널: ${level5_conditions.tunnelBuilt ? '완성' : `${Math.min(tunnelCount, 2)} / 2`}</div>
        <div class="mc">옥상 비오톱: ${Math.min(level5_conditions.biotopePlacedCount, 4)} / 4</div>
      `;
    } else if (Level5Manager.currentPhase === 3) {
      desc.textContent = '생태통로 심사 기준을 통과해 경계 도시를 안정화하세요.';
      status.innerHTML = `<div class="mc">심사 점수: ${score}점 / 80점</div><div class="mc">남은 시간: ${Math.ceil(level5_conditions.auditTimer || 0)}초</div>`;
    } else if (Level5Manager.currentPhase >= 4) {
      desc.textContent = '도심과 자연을 잇는 생태 연결망이 완성되었습니다.';
      status.innerHTML = '<div class="mc">레벨 5 완료</div>';
    }
  }

  static handleClick(x, y, z) {
    // 1. 너구리 구출 Phase일 때 도심 쓰레기 블록 파괴
    const key = bk(x, y, z);
    const block = gridData[key];
    
    if (block && block.startsWith('city_trash')) {
      if (toolMode === 'shovel' || toolMode === 'pickaxe') {
        _remove(x, y, z);
        playBlockBreakEffect(x, y, z, 0x708090);
        
        // 남은 쓰레기 세기
        let trashCount = 0;
        for (const k in gridData) {
          if (gridData[k].startsWith('city_trash')) trashCount++;
        }
        
        if (trashCount === 0 && !level5_conditions.raccoonRescued) {
          level5_conditions.raccoonRescued = true;
          toast('🦝 너구리 라쿤이를 구출했습니다!');
          
          // 너구리 스케일 원복
          const raccoon = animalData.find(a => a.type === 'raccoon');
          if (raccoon && raccoon.group) {
            raccoon.group.scale.set(1.0, 1.0, 1.0);
          }
          
          Level5Manager.currentPhase = 2;
          level5_phase = 2;
          Level5Manager.updateUI();
          
          setTimeout(() => {
            if (typeof showNpcDialogue === 'function') {
              showNpcDialogue('l5_raccoon_rescued');
            }
          }, 1200);
        }
        Level5Manager.updateUI();
      } else {
        toast('🛠️ 삽이나 곡괭이를 사용하여 쓰레기를 치워주세요.');
      }
      return true;
    }

    // 2. 공무원 박 주임 클릭 대화 설득
    const clickedNpc = animalData.find(a => {
      const dx = a.x - x, dz = a.z - z;
      return a.type === 'officer_city' && Math.sqrt(dx*dx + dz*dz) < 1.8;
    });

    if (clickedNpc && !level5_conditions.officerConvinced) {
      // 시나리오 순서: 너구리 구출이 먼저
      if (!level5_conditions.raccoonRescued) {
        toast('🦝 먼저 쓰레기에 갇힌 너구리 라쿤이를 구출해 주세요!');
        return true;
      }
      Level5Manager.showOfficerConvincePopup();
      return true;
    }

    return false;
  }

  // 시청 공무원 박 주임 설득 팝업 렌더링
  static showOfficerConvincePopup() {
    // 기존 대화창 제거
    const existing = document.getElementById('officer-convince-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'officer-convince-popup';
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 460px; padding: 28px; background: rgba(30, 40, 50, 0.85);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
      color: #fff; font-family: sans-serif; z-index: 10000;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    `;

    popup.innerHTML = `
      <h3 style="margin: 0 0 12px 0; color: #4fc3f7; font-size: 20px;">🏢 시청 도로개발과 박 주임</h3>
      <p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px; color: #e0e0e0;">
        "8차선 도로는 출퇴근 차량 지증과 도시 성장을 위해 꼭 필요합니다. 도로를 멈출 수도 없는데, 동물의 이동로를 지킬 획기적인 생태 대안이 있습니까?"
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button onclick="Level5Manager.selectConvince(1)" style="padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; text-align: left; cursor: pointer; transition: all 0.2s;">
          💡 1. <b>[친환경 통합 대안 제시]</b> 도로 위에 나무와 흙으로 덮인 <b>생태 육교</b>를 설치하고 도로 밑엔 <b>야행성 터널</b>을 뚫으면, 로드킬도 예방하고 시민들에겐 친환경 하늘숲 공원을 선물할 수 있습니다!
        </button>
        <button onclick="Level5Manager.selectConvince(2)" style="padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; text-align: left; cursor: pointer; transition: all 0.2s;">
          ❌ 2. <b>[단순 반대]</b> 자연 파괴는 무조건 안 됩니다! 도로 확장 계획 자체를 전면 취소하고 다른 곳에 길을 내십시오.
        </button>
      </div>
    `;

    document.body.appendChild(popup);
  }

  static selectConvince(choice) {
    const popup = document.getElementById('officer-convince-popup');
    if (!popup) return;

    if (choice === 1) {
      level5_conditions.officerConvinced = true;
      popup.innerHTML = `
        <h3 style="margin: 0 0 12px 0; color: #81c784; font-size: 20px;">🟢 설득 대성공!</h3>
        <p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
          "아하! 도로 확장과 자연의 공존이 동시에 가능하군요! <b>생태 육교와 동물 터널</b> 예산을 승인하겠습니다. 도심 빌딩 숲 옥상에도 황조롱이를 위한 <b>비오톱 정원</b>을 함께 지원해 드릴 테니 바로 설계해 보십시오!"
        </p>
        <button onclick="Level5Manager.closeConvinceAndGetItems()" style="padding: 10px 20px; background: #2e7d32; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; float: right;">
          아이템 받기 & 닫기
        </button>
      `;
    } else {
      popup.innerHTML = `
        <h3 style="margin: 0 0 12px 0; color: #e57373; font-size: 20px;">🔴 설득 실패</h3>
        <p style="margin: 0 0 20px 0; line-height: 1.6; font-size: 15px;">
          "계획 취소는 행정상 불가능합니다. 좀 더 현실적이고 사람과 동물이 상생할 수 있는 대책을 제시해 주셔야 합니다."
        </p>
        <button onclick="Level5Manager.showOfficerConvincePopup()" style="padding: 10px 20px; background: #d32f2f; border: none; border-radius: 6px; color: #fff; font-weight: bold; cursor: pointer; float: right;">
          다시 대화하기
        </button>
      `;
    }
  }

  static closeConvinceAndGetItems() {
    const popup = document.getElementById('officer-convince-popup');
    if (popup) popup.remove();

    // 퀵바에 레벨 5 건설 아이템들 지급
    if (typeof hotbar !== 'undefined') {
      hotbar[6] = 'viaduct';
      hotbar[7] = 'biotope';
      hotbar[8] = 'wildlife_tunnel';
      if (typeof initInventoryUI === 'function') initInventoryUI();
    }
    toast('⚙️ 생태 육교, 비오톱, 동물 터널 블록을 획득했습니다!');
    Level5Manager.updateUI();
    
    if (typeof showNpcDialogue === 'function') {
      showNpcDialogue('l5_officer_convinced');
    }
  }

  // 1. 생태 육교 BFS 연결 상태 판단 (하천 구역 Z=70과 안전 숲 Z=82를 도로 위에 이었는지 검증)
  static checkViaductConnection() {
    if (!level5_conditions.officerConvinced) return;

    // 도로 구역은 Z=74~78 사이이며, 다리가 도로 전체를 온전히 가로질렀는지 체크
    // 시작점 Z=73에서 Z=79까지 viaduct 블록으로 경로가 이어져야 함
    // X범위는 -60에서 -30 사이
    const startZ = 73, endZ = 79;
    let connected = false;

    // 각 X 좌표별로 Z=73에서 Z=79까지 BFS 탐색을 하여 연결 검사
    for (let startX = -60; startX <= -30; startX++) {
      const visited = new Set();
      const queue = [[startX, startZ]];
      visited.add(`${startX},${startZ}`);
      let pathFound = false;

      while (queue.length > 0) {
        const [cx, cz] = queue.shift();
        if (cz === endZ) {
          pathFound = true;
          break;
        }

        for (const [dx, dz] of [[1,0], [-1,0], [0,1], [0,-1]]) {
          const nx = cx + dx;
          const nz = cz + dz;
          if (nx < -60 || nx > -30 || nz < startZ || nz > endZ) continue;
          
          const key = `${nx},${nz}`;
          if (visited.has(key)) continue;

          // Z=73과 Z=79는 육지이므로 viaduct가 아니어도 됨
          const isLand = (nz === startZ || nz === endZ);
          const topY = getTopY(nx, nz) - 1;
          const block = gridData[bk(nx, topY, nz)];
          
          if (isLand || (block && block.startsWith('viaduct'))) {
            visited.add(key);
            queue.push([nx, nz]);
          }
        }
      }

      if (pathFound) {
        // 이 다리가 최소 2칸 이상 폭을 가지고 있는지 체크
        // 해당 X라인 좌우로도 viaduct가 깔려 있는지 확인
        let widthCheck = 0;
        for (let checkZ = 74; checkZ <= 78; checkZ++) {
          // 좌/우 인접 칸은 각자의 지표면 높이로 검사 (startX 높이로 probe하면 어긋남)
          const yLeft = getTopY(startX - 1, checkZ) - 1;
          const yRight = getTopY(startX + 1, checkZ) - 1;
          const bLeft = gridData[bk(startX - 1, yLeft, checkZ)];
          const bRight = gridData[bk(startX + 1, yRight, checkZ)];
          if ((bLeft && bLeft.startsWith('viaduct')) || (bRight && bRight.startsWith('viaduct'))) {
            widthCheck++;
          }
        }
        if (widthCheck >= 3) { // 3개 이상의 도로 구역에서 2칸 이상 두께 형성
          connected = true;
          break;
        }
      }
    }

    if (connected && !level5_conditions.viaductConnected) {
      level5_conditions.viaductConnected = true;
      toast('🌉 생태 육교가 도로를 안전하게 연결했습니다!');

      // 너구리 영입 (수호대 합류 플래그를 항상 직접 설정)
      global_protectors.raccoon = true;
      if (typeof GuardianSystem !== 'undefined' && typeof GuardianSystem.updateState === 'function') {
        GuardianSystem.updateState('raccoon', 3);
      } else {
        guardianState.raccoon = 3;
        if (typeof renderGuardians === 'function') renderGuardians();
      }
      if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
      Level5Manager.updateUI();
      
      // 너구리 합류 다이얼로그
      setTimeout(() => {
        if (typeof showNpcDialogue === 'function') {
          showNpcDialogue('l5_raccoon_join');
        }
      }, 1500);
      
      Level5Manager.checkTransitionToAudit();
    }
  }

  // 2. 동물 터널 블록 검사
  static checkTunnel() {
    if (level5_conditions.tunnelBuilt) return;
    
    let tunnelCount = 0;
    for (const key in gridData) {
      if (gridData[key].startsWith('wildlife_tunnel')) {
        tunnelCount++;
      }
    }

    if (tunnelCount >= 2) {
      level5_conditions.tunnelBuilt = true;
      toast('🚇 소형 동물을 위한 하부 통로 터널이 구축되었습니다!');
      Level5Manager.updateUI();
      Level5Manager.checkTransitionToAudit();
    }
  }

  // 3. 빌딩 비오톱 블록 개수 검사
  static checkBiotope() {
    let count = 0;
    const cells = [];
    for (const key in gridData) {
      if (gridData[key].startsWith('biotope')) {
        const [x, y, z] = key.split(',').map(Number);
        // 빌딩 옥상(X=-40, Z=80) 옥상 면적
        if (Math.abs(x - -40) <= 2 && Math.abs(z - 80) <= 2 && y >= 39) {
          count++;
          cells.push({x, y, z});
        }
      }
    }

    level5_conditions.biotopePlacedCount = count;
    level5_conditions.biotopeCells = cells;
    Level5Manager.updateUI();

    if (count >= 4 && !global_protectors.kestrel) {
      // 황조롱이 영입 (수호대 합류 플래그를 항상 직접 설정)
      global_protectors.kestrel = true;
      if (typeof GuardianSystem !== 'undefined' && typeof GuardianSystem.updateState === 'function') {
        GuardianSystem.updateState('kestrel', 3);
      } else {
        guardianState.kestrel = 3;
        if (typeof renderGuardians === 'function') renderGuardians();
      }
      if (typeof updateProtectorSlots === 'function') updateProtectorSlots();
      Level5Manager.updateUI();
      
      toast('🦅 황조롱이 삐루가 비오톱 텃밭에 둥지를 지어 합류했습니다!');
      
      setTimeout(() => {
        if (typeof showNpcDialogue === 'function') {
          showNpcDialogue('l5_kestrel_join');
        }
      }, 1500);

      Level5Manager.checkTransitionToAudit();
    }
  }

  // 세 조건이 모두 충족되었을 때 심사 챌린지로 전환
  static checkTransitionToAudit() {
    if (Level5Manager.currentPhase >= 3) return;
    if (level5_conditions.viaductConnected && level5_conditions.tunnelBuilt && global_protectors.kestrel) {
      Level5Manager.currentPhase = 3;
      level5_phase = 3;
      Level5Manager.updateUI();
      
      setTimeout(() => {
        if (typeof showNpcDialogue === 'function') {
          showNpcDialogue('l5_audit_start');
        }
        Level5Manager.startAudit();
      }, 3000);
    }
  }

  // 심사 보스전 시작
  static startAudit() {
    level5_conditions.isAuditing = true;
    level5_conditions.auditTimer = 30;
    level5_conditions.auditScore = 0;
    Level5Manager._auditLastTick = null; // 첫 update에서 기준 시각 초기화
    Level5Manager.updateUI();
    
    // 심사 전광판 UI 생성
    const board = document.createElement('div');
    board.id = 'audit-dashboard-ui';
    board.style.cssText = `
      position: fixed; top: 80px; right: 20px; width: 240px;
      padding: 16px; background: rgba(15, 25, 35, 0.85);
      backdrop-filter: blur(10px); border: 1px solid rgba(79, 195, 247, 0.4);
      border-radius: 12px; color: #fff; font-family: sans-serif; z-index: 999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(board);
    
    Level5Manager.updateAuditProgressUI();
  }

  static updateAuditProgressUI() {
    const board = document.getElementById('audit-dashboard-ui');
    if (!board) return;

    // 배수력: 터널 설치 개수에 따라 비례 (터널 2개면 100%)
    let tunnelCount = 0;
    for (const key in gridData) {
      if (gridData[key].startsWith('wildlife_tunnel')) tunnelCount++;
    }
    const drainage = Math.min(100, tunnelCount * 50);

    // 야간 동물 통행율: 생태육교 유무 (육교 있으면 100%)
    const traffic = level5_conditions.viaductConnected ? 100 : 0;

    // 시민 만족도: 옥상 비오톱 개수에 비례 (4개면 100%)
    const satisfaction = Math.min(100, level5_conditions.biotopePlacedCount * 25);

    const total = Math.round((drainage + traffic + satisfaction) / 3);
    level5_conditions.auditScore = total;
    Level5Manager.updateUI();

    board.innerHTML = `
      <h4 style="margin: 0 0 12px 0; color: #4fc3f7; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; font-size: 16px;">📋 생태통로 심사 검증</h4>
      <div style="font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
        <div>🌧️ 우천 배수력: <span style="font-weight:bold; color:#ffb74d;">${drainage}%</span></div>
        <div>🐾 야간 동물통행: <span style="font-weight:bold; color:#81c784;">${traffic}%</span></div>
        <div>👨‍👩‍👧 시민 친화도: <span style="font-weight:bold; color:#ba68c8;">${satisfaction}%</span></div>
        <div style="margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px; font-size: 15px;">
          📈 종합 승인 점수: <span style="font-weight:bold; color:#26a69a; font-size: 18px;">${total}점</span>
        </div>
        <div style="margin-top: 4px; font-size: 12px; color:#aaa;">(최종 합격 요건: 80점 이상)</div>
        <div style="text-align: center; margin-top: 10px; padding: 6px; background: rgba(255,255,255,0.06); border-radius: 6px; font-weight: bold;">
          ⏰ 남은 심사 시간: ${Math.ceil(level5_conditions.auditTimer)}초
        </div>
      </div>
    `;
  }

  static completeAudit() {
    const board = document.getElementById('audit-dashboard-ui');
    if (board) board.remove();

    if (level5_conditions.auditScore >= 80) {
      Level5Manager.currentPhase = 4;
      level5_phase = 4;
      Level5Manager.updateUI();
      
      if (typeof showNpcDialogue === 'function') {
        showNpcDialogue('l5_clear');
      }

      // 최종 클리어 배너 팝업 연동
      setTimeout(() => {
        Level5Manager.showLevel5ClearOverlay();
      }, 2000);
    } else {
      // 불합격 시 보강 경고 팝업
      const warning = document.createElement('div');
      warning.style.cssText = `
        position: fixed; top: 30%; left: 50%; transform: translate(-50%, -50%);
        padding: 20px; background: rgba(183, 28, 28, 0.9); backdrop-filter: blur(10px);
        border: 2px solid #ef5350; border-radius: 12px; color: #fff; font-family: sans-serif;
        text-align: center; z-index: 10000; box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      `;
      warning.innerHTML = `
        <h4 style="margin: 0 0 10px 0; font-size: 18px;">⚠️ 심사 기준 미달 (점수: ${level5_conditions.auditScore}점)</h4>
        <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
          우천 배수(동물 터널), 통행(생태 육교), 만족도(옥상 비오톱 4개)<br>조건을 점검하고 보강한 뒤 재심사를 받으십시오.
        </p>
        <button onclick="this.parentElement.remove(); Level5Manager.startAudit();" style="padding: 8px 16px; background: #fff; color: #b71c1c; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
          다시 심사받기
        </button>
      `;
      document.body.appendChild(warning);
    }
  }

  static showLevel5ClearOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'level5-clear-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 15, 25, 0.85); backdrop-filter: blur(16px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #fff; font-family: sans-serif; z-index: 100000;
      animation: fadeIn 0.8s ease forwards;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px; background: rgba(255,255,255,0.03); border: 1px solid rgba(79, 195, 247, 0.3); border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        <div style="font-size: 72px; margin-bottom: 20px; filter: drop-shadow(0 0 10px #4fc3f7);">🦝🦅</div>
        <h2 style="margin: 0 0 10px 0; font-size: 32px; color: #4fc3f7; letter-spacing: 1px; font-weight: 800;">레벨 5 완료!</h2>
        <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #81c784; font-weight: normal;">경계 도시 - 회색 섬의 징검다리</h3>
        <p style="margin: 0 0 30px 0; font-size: 15px; color: #b0bec5; line-height: 1.6;">
          너구리와 황조롱이 수호대가 도심과 자연을 안전하게 연결했습니다.<br>
          도로와 빌딩 숲 위로 푸르른 하늘길이 열리며 자연과의 완벽한 공존이 시작되었습니다.
        </p>
        <button onclick="Level5Manager.proceedToLevel6()" style="padding: 14px 40px; background: linear-gradient(135deg, #0288d1, #26a69a); border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(2,136,209,0.4); transition: all 0.3s;">
          최종장: 초록별 심장부 진입하기 →
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  static proceedToLevel6() {
    const overlay = document.getElementById('level5-clear-overlay');
    if (overlay) overlay.remove();
    
    // level5Cleared 커스텀 이벤트 디스패치 -> world.js가 리스닝하여 레벨 6 실행
    document.dispatchEvent(new CustomEvent('level5Cleared'));
  }
}

// 글로벌 등록
window.Level5Manager = Level5Manager;
if (typeof QuestManager !== 'undefined') {
  QuestManager.levels[5] = Level5Manager;
}
