// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THREE.JS 씬 설정 및 메인 로직
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const canvas=document.getElementById('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x87CEEB);

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xc8e5f5,0.008);
const camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,0.1,500);

const ambient=new THREE.AmbientLight(0xfff0dd,0.52); scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff4c8,1.1);
sun.position.set(25,75,18); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-65; sun.shadow.camera.right=65;
sun.shadow.camera.bottom=-65; sun.shadow.camera.top=65;
sun.shadow.camera.far=180;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xaad4ff,0.3); fill.position.set(-15,20,-15); scene.add(fill);

scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(350,32,16),
  new THREE.ShaderMaterial({
    side:THREE.BackSide,
    vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 t=vec3(.20,.48,.88),m=vec3(.46,.70,.91),r=vec3(.76,.88,.96);vec3 c=h>.15?mix(m,t,smoothstep(.15,.75,h)):mix(r,m,smoothstep(0.,.15,h));gl_FragColor=vec4(c,1.);}'
  })
));
const sunSph=new THREE.Mesh(new THREE.SphereGeometry(5,12,8),new THREE.MeshBasicMaterial({color:0xfffce0}));
sunSph.position.set(110,160,-150); scene.add(sunSph);

function mkCloud(x,y,z,s){
  const g=new THREE.Group(), mat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:0.90});
  [[0,0,0,5,1.8,3.5],[3,.5,0,3.5,1.4,2.8],[-3,.4,0,3.2,1.3,2.6],[.5,.8,2,3,1.2,2.2],[.5,.8,-2,2.8,1.1,2]].forEach(([px,py,pz,w,h,d])=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(px,py,pz); g.add(m);
  });
  g.position.set(x,y,z); g.scale.setScalar(s); return g;
}
const cloudGroups=[[5,60,-12,1.1],[24,65,3,.9],[45,58,10,1.3],[-4,62,30,1],[20,68,50,1.2],[50,59,44,.85],[55,63,20,1],[-6,58,18,.8],[30,61,-10,1.1],[-20,65,-30,1.5],[-40,58,20,1.2]]
  .map(([x,y,z,s])=>{const c=mkCloud(x,y,z,s);scene.add(c);return{mesh:c,bx:x,bz:z};});

const waterDeep=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshLambertMaterial({color:0x012040,transparent:true,opacity:0.8,depthWrite:false,side:THREE.FrontSide}));
waterDeep.rotation.x=-Math.PI/2; waterDeep.position.y=WATER_LEVEL-0.5; scene.add(waterDeep);

const waterVolume=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshLambertMaterial({color:0x0a4b80,transparent:true,opacity:0.6,depthWrite:false,side:THREE.FrontSide}));
waterVolume.rotation.x=-Math.PI/2; waterVolume.position.y=WATER_LEVEL; scene.add(waterVolume);

const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshLambertMaterial({color:0x4a8a30}));
groundMesh.rotation.x=-Math.PI/2; groundMesh.position.set(0,-0.01,0);
groundMesh.receiveShadow=true; groundMesh.userData.isGround=true; scene.add(groundMesh);

const hlMesh=new THREE.Mesh(new THREE.BoxGeometry(1.02,1.02,1.02),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3,depthTest:true}));
hlMesh.visible=false; scene.add(hlMesh);

function updateHlMesh() {
  hlMesh.geometry.dispose();
  if(toolMode==='block'||toolMode==='seed'||toolMode==='resource') {
    if(selItem==='grass'||selItem==='straw'||ITEM_DB[selItem]?.category==='plant'||ITEM_DB[selItem]?.category==='seed'||ITEM_DB[selItem]?.category==='resource') {
      hlMesh.geometry=new THREE.BoxGeometry(1.02,0.22,1.02); hlMesh.rotation.y=0;
    } else if(selItem==='fence') {
      hlMesh.geometry=new THREE.BoxGeometry(1.02,1.02,0.22); hlMesh.rotation.y=currentRotation*(Math.PI/2);
    } else {
      hlMesh.geometry=new THREE.BoxGeometry(1.02,1.02,1.02); hlMesh.rotation.y=0;
    }
  } else {
    hlMesh.geometry=new THREE.BoxGeometry(1.02,1.02,1.02); hlMesh.rotation.y=0;
  }
}

const raycaster=new THREE.Raycaster(), mouse2D=new THREE.Vector2(-9999,-9999);

function isFenced(x,z) {
  const rx=Math.round(x), rz=Math.round(z);
  for(let y=GH; y>=0; y--) { const b=gridData[bk(rx,y,rz)]; if(b&&b.startsWith('fence')) return true; }
  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  카메라
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const orbitTarget=new THREE.Vector3(CHUNK,38,CHUNK);
let theta=0.7,phi=0.85,radius=36;

const keys={w:false,a:false,s:false,d:false,ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,' ':false,Shift:false};
window.addEventListener('keydown',e=>{ if(keys.hasOwnProperty(e.key)) keys[e.key]=true; if(e.key===' ') keys[' ']=true; });
window.addEventListener('keyup',e=>{ if(keys.hasOwnProperty(e.key)) keys[e.key]=false; if(e.key===' ') keys[' ']=false; });

function syncCam(){
  phi=Math.max(0.05,Math.min(Math.PI*0.95,phi));
  radius=Math.max(8,Math.min(140,radius));
  camera.position.set(orbitTarget.x+radius*Math.sin(phi)*Math.sin(theta),orbitTarget.y+radius*Math.cos(phi),orbitTarget.z+radius*Math.sin(phi)*Math.cos(theta));
  camera.lookAt(orbitTarget);
}
syncCam();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  인터랙션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let isDragging=false, clickMoved=false, dragButton=0;
let mouseStart={x:0,y:0}, currentMouseX=0, currentMouseY=0;
let touchMode=null;
let digInterval=null, isHoldingPickaxe=false;
let lastClickTime=0, lastTouchTime=0;

const ptEl = document.getElementById('phase-transition');
const crEl = document.getElementById('creature-report');

function isUIBlocking(){
  return isOpeningActive
    || isInventoryOpen
    || WormMinigame.active
    || (ptEl && ptEl.style.display==='flex')
    || (crEl && crEl.style.display==='flex');
}

function getRayTargets(){
  const am=[]; for(const a of animalData) a.group.traverse(c=>{if(c.isMesh)am.push(c);});
  const pm=[]; for(const g of Object.values(chunkGroups)) g.traverse(c=>{if(c.isMesh)pm.push(c);});
  const ot=[]; if(OldTree.group) OldTree.group.traverse(c=>{if(c.isMesh)ot.push(c);});
  const cm=[]; for(const m of ClueSystem.meshes) cm.push(m,...m.children);
  const lm=[...LeafSystem.meshes];
  return [groundMesh,...Object.values(meshByKey),...am,...pm,...ot,...cm,...lm];
}
function castRay(cx,cy){
  const r=canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1),camera);
  return raycaster.intersectObjects(getRayTargets(),false);
}

function doDig(clientX,clientY){
  if(isUIBlocking()) return;
  const hits=castRay(clientX,clientY);
  if(!hits.length) return;
  const obj=hits[0].object;
  if(obj.userData.isPreview){ activateChunk(obj.userData.cx,obj.userData.cz); toast('✨ 미지의 영역을 탐험했습니다!'); return; }
  if(obj.userData.agr){ const a=animalData.find(a=>a.group===obj.userData.agr); if(a) removeAnimalAt(a); }
  else if(obj.userData.isBlock){ removeBlock(obj.userData.bx,obj.userData.by,obj.userData.bz); }
}

canvas.addEventListener('mousedown',e=>{
  if(isUIBlocking()) return;
  if(e.button===2&&pickedAnimal){cancelCarry();return;}
  if(e.button===0||e.button===2){
    isDragging=true; clickMoved=false; dragButton=e.button;
    mouseStart={x:e.clientX,y:e.clientY}; currentMouseX=e.clientX; currentMouseY=e.clientY;
    if(e.button===0&&toolMode==='pickaxe'){
      const now=Date.now();
      if(now-lastClickTime<300){ isHoldingPickaxe=true; doDig(currentMouseX,currentMouseY); digInterval=setInterval(()=>{ if(isHoldingPickaxe) doDig(currentMouseX,currentMouseY); },150); }
      else{ doDig(currentMouseX,currentMouseY); }
      lastClickTime=now;
    }
  }
});

canvas.addEventListener('mousemove',e=>{
  currentMouseX=e.clientX; currentMouseY=e.clientY;
  mouse2D.x=(e.clientX/window.innerWidth)*2-1; mouse2D.y=-(e.clientY/window.innerHeight)*2+1;
  if(!isDragging) return;
  const dx=e.clientX-mouseStart.x,dy=e.clientY-mouseStart.y;
  if(Math.abs(dx)>3||Math.abs(dy)>3) clickMoved=true;
  if(clickMoved){
    if(digInterval||isHoldingPickaxe) return;
    if(dragButton===0){ const fwd=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize(); const rgt=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize(); const panSpd=radius*0.0018; orbitTarget.addScaledVector(rgt,-dx*panSpd); orbitTarget.addScaledVector(fwd,dy*panSpd); }
    else if(dragButton===2){ theta-=dx*.007; phi+=dy*.007; }
    mouseStart={x:e.clientX,y:e.clientY}; syncCam();
  }
});

canvas.addEventListener('mouseup',e=>{
  clearInterval(digInterval); digInterval=null; isHoldingPickaxe=false;
  if(isDragging&&!clickMoved&&e.button===0){ if(toolMode!=='pickaxe') handleClick(e.clientX,e.clientY); }
  isDragging=false;
});

let initialPinchDist=null, initialRadius=null, initialPanCenter=null;
canvas.addEventListener('touchstart',e=>{
  if(isUIBlocking()) return;
  if(e.touches.length===1){
    touchMode='single'; isDragging=true; clickMoved=false; isHoldingPickaxe=false;
    currentMouseX=e.touches[0].clientX; currentMouseY=e.touches[0].clientY;
    mouseStart={x:currentMouseX,y:currentMouseY};
    if(toolMode==='pickaxe'){
      const now=Date.now();
      if(now-lastTouchTime<300){ isHoldingPickaxe=true; doDig(currentMouseX,currentMouseY); if(navigator.vibrate) navigator.vibrate(50); digInterval=setInterval(()=>{ if(isHoldingPickaxe) doDig(currentMouseX,currentMouseY); },150); }
      else{ doDig(currentMouseX,currentMouseY); if(navigator.vibrate) navigator.vibrate(20); }
      lastTouchTime=now;
    }
  } else if(e.touches.length===2){
    touchMode='zoom_pan'; isDragging=false; clearInterval(digInterval); isHoldingPickaxe=false;
    const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
    initialPinchDist=Math.sqrt(dx*dx+dy*dy); initialRadius=radius;
    initialPanCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
  }
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  if(isUIBlocking()) return; e.preventDefault();
  if(touchMode==='single'&&e.touches.length===1){
    currentMouseX=e.touches[0].clientX; currentMouseY=e.touches[0].clientY;
    const dx=currentMouseX-mouseStart.x,dy=currentMouseY-mouseStart.y;
    if(Math.abs(dx)>5||Math.abs(dy)>5) clickMoved=true;
    if(clickMoved){ if(digInterval||isHoldingPickaxe) return; theta-=dx*.007; phi+=dy*.007; mouseStart={x:currentMouseX,y:currentMouseY}; syncCam(); }
  } else if(touchMode==='zoom_pan'&&e.touches.length===2){
    const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
    const dist=Math.sqrt(dx*dx+dy*dy); radius=initialRadius*(initialPinchDist/dist);
    const cx=(e.touches[0].clientX+e.touches[1].clientX)/2,cy=(e.touches[0].clientY+e.touches[1].clientY)/2;
    const pdx=cx-initialPanCenter.x,pdy=cy-initialPanCenter.y;
    if(Math.abs(pdx)>2||Math.abs(pdy)>2){ const forward=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize(); const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize(); orbitTarget.addScaledVector(right,-pdx*0.05); orbitTarget.addScaledVector(forward,pdy*0.05); initialPanCenter={x:cx,y:cy}; }
    syncCam();
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  clearInterval(digInterval); digInterval=null; isHoldingPickaxe=false;
  if(touchMode==='single'&&!clickMoved&&e.changedTouches.length===1){ if(toolMode!=='pickaxe') handleClick(e.changedTouches[0].clientX,e.changedTouches[0].clientY); }
  if(e.touches.length===0){touchMode=null; isDragging=false;}
});

canvas.addEventListener('mouseleave',()=>{isDragging=false; clearInterval(digInterval);});
canvas.addEventListener('wheel',e=>{radius+=e.deltaY*.04;syncCam();e.preventDefault();},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

function handleClick(clientX,clientY){
  if(isUIBlocking()) return;
  const hits=castRay(clientX,clientY);
  if(pickedAnimal&&!hits.length){cancelCarry();return;}
  if(!hits.length) return;
  const hit=hits[0],obj=hit.object;

  if(QuestManager.currentPhase===0){
    if(obj.userData.isClue){ ClueSystem.checkClick(obj.userData.clueId); return; }
  }

  if(obj.userData.isLeaf){
    LeafSystem.collect(obj);
    return;
  }

  if(obj.userData.isPreview){activateChunk(obj.userData.cx,obj.userData.cz);toast('✨ 미지의 영역을 탐험했습니다!');return;}

  if(pickedAnimal){
    let dx,dy,dz;
    if(obj.userData.isBlock){const n=hit.face.normal.clone().transformDirection(obj.matrixWorld);dx=obj.userData.bx+Math.round(n.x);dy=obj.userData.by+Math.round(n.y);dz=obj.userData.bz+Math.round(n.z);}
    else if(obj.userData.isGround){dx=Math.round(hit.point.x);dz=Math.round(hit.point.z);dy=getTopY(dx,dz);}
    else return;
    dropAnimal(dx,dy,dz); return;
  }

  if(toolMode==='watering'){
    if(obj.userData.isBlock){ WateringSystem.water(obj.userData.bx,obj.userData.by,obj.userData.bz); }
    else if(obj.userData.isGround){ const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z); WateringSystem.water(gx,getTopY(gx,gz)-1,gz); }
    return;
  }

  if(toolMode==='seed'){
    if(obj.userData.isBlock){ const n=hit.face.normal.clone().transformDirection(obj.matrixWorld); SeedSystem.plant(obj.userData.bx+Math.round(n.x),obj.userData.by+Math.round(n.y),obj.userData.bz+Math.round(n.z),selItem); }
    else if(obj.userData.isGround){ const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z); SeedSystem.plant(gx,getTopY(gx,gz),gz,selItem); }
    return;
  }

  if(toolMode==='shovel'){
    if(obj.userData.isBlock){
      const {bx,by,bz}=obj.userData;
      if(gridData[bk(bx,by,bz)]==='toxic_plant'){ ToxicPlantSystem.remove(bx,by,bz); }
      else{ removeBlock(bx,by,bz); }
    } else if(obj.userData.isGround){ const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z); const gy=getTopY(gx,gz)-1; if(gy>=0) removeBlock(gx,gy,gz); }
    return;
  }

  if(toolMode==='resource' && selItem==='fallen_leaf'){
    if(QuestManager.currentPhase !== 1){
      toast('⚠️ 페이즈 1에서만 낙엽을 덮을 수 있어요!'); return;
    }
    let tx, tz;
    if(obj.userData.isBlock){ tx=obj.userData.bx; tz=obj.userData.bz; }
    else if(obj.userData.isGround){ tx=Math.round(hit.point.x); tz=Math.round(hit.point.z); }
    else return;
    LeafSystem.placeOnSoil(tx, getTopY(tx,tz), tz);
    return;
  }

  if(toolMode==='axe'){
    if(obj.userData.isOldTree){
      if(OldTree.state!=='chopped'){ OldTree.chopCount++; if(OldTree.chopCount>=3){ OldTree.chop(); } else { toast(`🪓 쾅! (${OldTree.chopCount}/3)`); if(navigator.vibrate) navigator.vibrate(50); } }
    }
    return;
  }

  if(toolMode==='action'){
    if(selItem==='heal'){
      if(obj.userData.agr){
        const a=animalData.find(a=>a.group===obj.userData.agr);
        if(a&&a.isInjured){
          const gx=Math.round(a.x),gz=Math.round(a.z),ty=getTopY(gx,gz)-1;
          const underFloor=gridData[bk(gx,ty,gz)]?gridData[bk(gx,ty,gz)].split('_')[0]:'';
          if(underFloor==='straw'){ a.isInjured=false; a.group.children[0].material.color.setHex(0xe8e8e8); QuestManager.injuredHealedCount++; toast('💖 치료 성공! 동물이 건강해졌어요!'); QuestManager.check(); }
          else{ toast('⚠️ 다친 동물은 볏짚(보호소) 위에서 치료해야 해요!'); }
        } else if(a&&!a.isInjured){ toast('😊 이 동물은 이미 건강해요!'); }
      }
      return;
    }
    if(selItem==='carry'){
      if(obj.userData.agr){const a=animalData.find(a=>a.group===obj.userData.agr);if(a)pickUpAnimal(a);return;}
      toast('안아줄 동물을 정확히 클릭해주세요!'); return;
    }
  }

  if(toolMode==='block'||toolMode==='resource'){
    if(obj.userData.isBlock){ const n=hit.face.normal.clone().transformDirection(obj.matrixWorld); placeBlock(obj.userData.bx+Math.round(n.x),obj.userData.by+Math.round(n.y),obj.userData.bz+Math.round(n.z),selItem); }
    else if(obj.userData.isGround){ const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z); placeBlock(gx,getTopY(gx,gz),gz,selItem); }
  }
}

function pickUpAnimal(entry){
  pickedAnimal={entry};
  entry.group.traverse(c=>{if(c.isMesh&&c.material){c.material=c.material.clone();c.material.emissive=new THREE.Color(0x886600);c.material.emissiveIntensity=.6;}});
  document.getElementById('carry-indicator').style.display='block';
}
function dropAnimal(x,y,z){
  if(!pickedAnimal) return;
  const{entry}=pickedAnimal; pickedAnimal=null;
  document.getElementById('carry-indicator').style.display='none';
  const i=animalData.indexOf(entry); if(i!==-1){scene.remove(entry.group);animalData.splice(i,1);}
  placeAnimal(x,y,z,entry.type,entry.isInjured);
}
function cancelCarry(){
  if(!pickedAnimal) return;
  const{entry}=pickedAnimal;
  entry.group.traverse(c=>{if(c.isMesh&&c.material){c.material.emissive=new THREE.Color(0);c.material.emissiveIntensity=0;}});
  entry.group.position.set(entry.x,entry.y,entry.z);
  pickedAnimal=null; document.getElementById('carry-indicator').style.display='none';
}

canvas.addEventListener('mousemove',()=>{
  if(isDragging||isUIBlocking()){hlMesh.visible=false;return;}
  raycaster.setFromCamera(mouse2D,camera);
  const hits=raycaster.intersectObjects(getRayTargets(),false);
  if(!hits.length){hlMesh.visible=false;return;}
  const hit=hits[0],obj=hit.object;
  const isFlat=(toolMode==='block'||toolMode==='seed'||toolMode==='resource')&&(selItem==='grass'||selItem==='straw'||ITEM_DB[selItem]?.category==='plant'||ITEM_DB[selItem]?.category==='seed'||ITEM_DB[selItem]?.category==='resource');
  if(obj.userData.isBlock){
    const n=hit.face.normal.clone().transformDirection(obj.matrixWorld);
    const nx=obj.userData.bx+Math.round(n.x),ny=obj.userData.by+Math.round(n.y),nz=obj.userData.bz+Math.round(n.z);
    hlMesh.position.set(nx,isFlat?ny+0.1:ny+0.5,nz); hlMesh.visible=true;
  } else if(obj.userData.isGround){
    const gx=Math.round(hit.point.x),gz=Math.round(hit.point.z);
    const ny=getTopY(gx,gz);
    hlMesh.position.set(gx,isFlat?ny+0.1:ny+0.5,gz); hlMesh.visible=true;
  } else hlMesh.visible=false;
});

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});

// Stats 모니터
let stats;
if(typeof Stats !== 'undefined'){
  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  stats.dom.style.position = 'absolute';
  stats.dom.style.bottom = '10px';
  stats.dom.style.left = '10px';
  stats.dom.style.top = 'auto';
  stats.dom.style.zIndex = '9999';
}

let t=0;
function animate(){
  if(stats) stats.begin();
  requestAnimationFrame(animate); t+=.016;

  let camMoved=false;
  const spd=0.4;
  const fwd=new THREE.Vector3(orbitTarget.x-camera.position.x,0,orbitTarget.z-camera.position.z).normalize();
  const rgt=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
  if(keys.w||keys.ArrowUp){orbitTarget.addScaledVector(fwd,spd);camMoved=true;}
  if(keys.s||keys.ArrowDown){orbitTarget.addScaledVector(fwd,-spd);camMoved=true;}
  if(keys.a||keys.ArrowLeft){orbitTarget.addScaledVector(rgt,-spd);camMoved=true;}
  if(keys.d||keys.ArrowRight){orbitTarget.addScaledVector(rgt,spd);camMoved=true;}
  if(keys[' ']){orbitTarget.y+=spd;camMoved=true;}
  if(keys.Shift){orbitTarget.y-=spd;camMoved=true;}
  if(camMoved) syncCam();

  if(camera.position.y<WATER_LEVEL){ scene.fog.color.setHex(0x021b3a); scene.fog.density=0.08; renderer.setClearColor(0x021b3a); }
  else{ scene.fog.color.setHex(0xc8e5f5); scene.fog.density=0.008; renderer.setClearColor(0x87CEEB); }

  waterVolume.position.y=WATER_LEVEL+Math.sin(t*1.5)*0.04;
  waterDeep.position.y=WATER_LEVEL-0.5+Math.sin(t*1.5)*0.02;

  updateAnimals(t);
  ClueSystem.updateAnims(t);
  LadybugSystem.update(t);
  OldTree.updateParticles();

  for(const c of cloudGroups){c.mesh.position.x=c.bx+Math.sin(t*.035+c.bz*.1)*4;c.mesh.position.z=c.bz+Math.cos(t*.025+c.bx*.08)*3;}
  renderer.render(scene,camera);
  if(stats) stats.end();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  초기화 및 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
initWorld(); QuestManager.check(); animate();
