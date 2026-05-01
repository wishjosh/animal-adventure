// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  지형 계산 및 블록 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function vn(x,z){
  const h=n=>{let v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const a=h(ix+iz*57),b=h(ix+1+iz*57),c=h(ix+(iz+1)*57),d=h(ix+1+(iz+1)*57);
  return a+(b-a)*ux+(c-a)*uz+(a-b-c+d)*ux*uz;
}

function getH(wx,wz){
  const nx=wx*0.03, nz=wz*0.03;
  const macroNoise=vn(wx*0.012+100,wz*0.012+100);
  let base=0;
  if(macroNoise>0.45) base=36.0+(macroNoise-0.45)*12.0;
  else if(macroNoise<0.35) base=18.0+(macroNoise*20.0);
  else base=24.0+(macroNoise-0.35)*100.0*0.12;
  const distFromCenter=Math.sqrt(wx*wx+wz*wz);
  if(distFromCenter<50){ const boost=(50-distFromCenter)/50; if(base<36.0) base=base+(36.0-base)*boost; }
  const mountains=Math.pow(vn(nx*0.5+100,nz*0.5+100),2.0)*(vn(nx*2.0,nz*2.0)*18.0);
  const riverNoise=Math.abs(vn(nx*0.6+50,nz*0.6+50)*2-1);
  const riverCarve=Math.max(0,1.0-riverNoise*3.5);
  let h=base;
  if(h>=34.0) h+=mountains;
  if(riverCarve>0) h=h-(riverCarve*16.0);
  if(h>50.0) h=50.0+Math.sqrt(h-50.0)*1.5;
  return Math.min(GH,Math.max(10,Math.round(h)));
}

function terrainType(y,sh){
  const underwater=sh<WATER_LEVEL;
  if(sh-y===0){ if(underwater) return y<=22?'r_sand':'r_gravel'; return sh>=44?'t_rock':sh>=40?'t_high':sh>=36?'t_mid':sh>=34?'t_low':'t_dirt'; }
  if(underwater) return sh-y<=3?'r_sub':'t_sub';
  return sh-y<=4?'t_dirt':'t_sub';
}
function colColor(h){ if(h<WATER_LEVEL) return 0x1565c0; return h>=44?0x9a8878:h>=40?0x7a8e68:h>=36?0x4a7a3a:h>=34?0x6aaa5a:0x7a5c1e; }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  청크 시스템
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ck=(cx,cz)=>`${cx},${cz}`;
const w2c=(wx,wz)=>[Math.floor(wx/CHUNK),Math.floor(wz/CHUNK)];
const isActive=(wx,wz)=>chunkState[ck(...w2c(wx,wz))]==='active';

function spawnAnimalsInChunk(cx,cz){
  const x0=cx*CHUNK,z0=cz*CHUNK;
  const count=1+Math.floor(Math.random()*2);
  for(let i=0;i<count;i++){
    const wx=x0+Math.floor(Math.random()*CHUNK),wz=z0+Math.floor(Math.random()*CHUNK);
    const sh=getH(wx,wz);
    if(sh<WATER_LEVEL-1){ if(Math.random()<0.6) placeAnimal(wx,sh+0.5,wz,'fish'); }
    else if(sh>=WATER_LEVEL){ placeAnimal(wx,sh+1,wz,'sheep',Math.random()<0.3); }
  }
}

function spawnLevelAnimals() {
  placeAnimal(3,getTopY(3,3)+0.5,3,'sheep',true);
  placeAnimal(6,getTopY(6,4)+0.5,4,'sheep',false);
  placeAnimal(4,getTopY(4,6)+0.5,6,'sheep',false);
  placeAnimal(12,getTopY(12,5)+0.5,5,'horse',false);
  placeAnimal(14,getTopY(14,8)+0.5,8,'goat',false);
}

function bldActive(cx,cz){
  const x0=cx*CHUNK,z0=cz*CHUNK;
  for(let lx=0;lx<CHUNK;lx++) for(let lz=0;lz<CHUNK;lz++){
    const wx=x0+lx,wz=z0+lz,sh=getH(wx,wz);
    
    const minH = Math.min(getH(wx-1,wz), getH(wx+1,wz), getH(wx,wz-1), getH(wx,wz+1));
    const visibleStartY = Math.min(sh, minH);

    for(let y=0;y<=sh;y++) {
      const k=bk(wx,y,wz);
      if(!deletedBlocks.has(k)) {
        const type = terrainType(y,sh);
        gridData[k] = type;
        if(y >= visibleStartY) {
          if(!meshByKey[k]) {
            const mesh=buildMesh(type,wx,y,wz);
            if(mesh){meshByKey[k]=mesh;scene.add(mesh);}
          }
        }
      }
    }
  }
}

function bldPreview(cx,cz){
  const k=ck(cx,cz); if(chunkGroups[k]) scene.remove(chunkGroups[k]);
  const g=new THREE.Group(),x0=cx*CHUNK,z0=cz*CHUNK;
  for(let lx=0;lx<CHUNK;lx++) for(let lz=0;lz<CHUNK;lz++){
    const wx=x0+lx,wz=z0+lz,sh=getH(wx,wz);
    const visH=sh<WATER_LEVEL?Math.ceil(WATER_LEVEL):sh;
    const col=sh<WATER_LEVEL?0x1565c0:colColor(sh);
    const geo=new THREE.BoxGeometry(1,1,1);
    const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col,transparent:true,opacity:0.15}));
    mesh.position.set(wx,visH+0.5,wz);
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.25})
    ));
    mesh.userData={isPreview:true,cx,cz}; g.add(mesh);
  }
  scene.add(g); chunkGroups[k]=g;
}

function rmVisible(cx,cz){ const k=ck(cx,cz); if(chunkGroups[k]){scene.remove(chunkGroups[k]);delete chunkGroups[k];} }

let gridHelperMesh=null;
function rebuildGrid(){
  if(gridHelperMesh) scene.remove(gridHelperMesh);
  let mnX=Infinity,mxX=-Infinity,mnZ=Infinity,mxZ=-Infinity;
  for(const[k,s] of Object.entries(chunkState)){
    if(s==='active'){const[cx,cz]=k.split(',').map(Number);mnX=Math.min(mnX,cx);mxX=Math.max(mxX,cx);mnZ=Math.min(mnZ,cz);mxZ=Math.max(mxZ,cz);}
  }
  if(mxX<mnX) return;
  const maxDim=Math.max(mxX-mnX+1,mxZ-mnZ+1);
  gridHelperMesh=new THREE.GridHelper(maxDim*CHUNK,maxDim*CHUNK,0x000000,0x000000);
  gridHelperMesh.material.opacity=0.07; gridHelperMesh.material.transparent=true;
  gridHelperMesh.position.set(((mnX+mxX+1)/2)*CHUNK-.5,.02,((mnZ+mxZ+1)/2)*CHUNK-.5);
  scene.add(gridHelperMesh);
}

function activateChunk(cx,cz,isInit=false){
  if(chunkState[ck(cx,cz)]==='active') return;
  rmVisible(cx,cz); chunkState[ck(cx,cz)]='active'; bldActive(cx,cz);
  if(!isInit) spawnAnimalsInChunk(cx,cz);
  const viewRadius=2;
  for(let dx=-viewRadius;dx<=viewRadius;dx++) for(let dz=-viewRadius;dz<=viewRadius;dz++){
    if(dx===0&&dz===0) continue;
    const nx=cx+dx,nz=cz+dz,nk=ck(nx,nz);
    if(!chunkState[nk]||chunkState[nk]==='hidden'){chunkState[nk]='visible';bldPreview(nx,nz);}
  }
  rebuildGrid(); updateMapOverlay();
}

function initOldTree() {
  if(OldTree.group) scene.remove(OldTree.group);
  const g=new THREE.Group();
  const tx=8,tz=8,ty=getTopY(tx,tz);
  g.position.set(tx,ty,tz);
  const M=(hex)=>new THREE.MeshLambertMaterial({color:hex});
  const trunkMat=M(0x5C3D1A);
  for(let i=0;i<3;i++){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.8,1,0.8),trunkMat);
    mesh.position.y=i+0.5; mesh.castShadow=true; mesh.receiveShadow=true;
    mesh.userData={isOldTree:true}; g.add(mesh);
  }
  OldTree.branches=[]; OldTree.leaves=[]; OldTree.fruits=[];
  const branchDirs=[{y:2.2,r:0},{y:2.5,r:Math.PI/2},{y:2.8,r:Math.PI},{y:2.4,r:-Math.PI/2},{y:3.0,r:Math.PI/4}];
  branchDirs.forEach(dir=>{
    const bg=new THREE.Group(); bg.position.set(0,dir.y,0); bg.rotation.y=dir.r;
    const branch=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,1.2),trunkMat);
    branch.position.z=0.6; branch.castShadow=true; branch.userData={isOldTree:true};
    bg.add(branch); OldTree.branches.push(bg);
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2),M(0x888888));
    leaf.position.z=1.2; leaf.castShadow=true; leaf.userData={isOldTree:true};
    bg.add(leaf); OldTree.leaves.push(leaf);
    const fruit=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),M(0xff0000));
    fruit.position.set(0,-0.6,1.2); fruit.visible=false;
    bg.add(fruit); OldTree.fruits.push(fruit);
    g.add(bg);
  });
  [{x:0,y:3.5,z:0},{x:0.5,y:3.2,z:0.5},{x:-0.5,y:3.2,z:-0.5}].forEach(pos=>{
    const leaf=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.3,1.3),M(0x888888));
    leaf.position.set(pos.x,pos.y,pos.z); leaf.castShadow=true; leaf.userData={isOldTree:true};
    g.add(leaf); OldTree.leaves.push(leaf);
  });
  OldTree.group=g; scene.add(g); OldTree.updateVisual();
}

function initWorld(){
  activateChunk(0,0,true); activateChunk(1,0,true);
  activateChunk(0,1,true); activateChunk(1,1,true);
  initOldTree();
  ClueSystem.init();
  ToxicPlantSystem.init();
  LeafSystem.init();
  spawnLevelAnimals();
  initInventoryUI(); applyCurrentTool();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  블록 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bk=(x,y,z)=>`${x},${y},${z}`;
function getTopY(x,z){for(let y=GH;y>=0;y--){if(gridData[bk(x,y,z)]) return y+1;}return 0;}

function getBlockData(rawType) {
  if(!rawType) return null;
  if(ITEM_DB[rawType]) return ITEM_DB[rawType];
  if(TERRAIN_BLOCKS[rawType]) return TERRAIN_BLOCKS[rawType];
  const baseType=rawType.split('_')[0];
  return ITEM_DB[baseType]||TERRAIN_BLOCKS[baseType];
}

function buildMesh(rawType,x,y,z){
  const def=getBlockData(rawType);
  if(!def) return null;
  let type=rawType, rot=0;
  if(rawType.startsWith('fence_')){ type='fence'; rot=parseInt(rawType.split('_')[1]); }
  const mat=def.transparent?new THREE.MeshLambertMaterial({color:def.hex,transparent:true,opacity:def.opacity}):new THREE.MeshLambertMaterial({color:def.hex});
  
  if(def.category==='plant' || def.category==='seed') {
    const group = new THREE.Group();
    const isSprout = rawType === 'sprout';
    const h = isSprout ? 0.5 : 1.1;
    const w = isSprout ? 0.6 : 0.95;
    const thick = 0.15;
    const g1 = new THREE.BoxGeometry(w, h, thick);
    const g2 = new THREE.BoxGeometry(thick, h, w);
    const m1 = new THREE.Mesh(g1, mat); m1.rotation.y = Math.PI / 4;
    const m2 = new THREE.Mesh(g2, mat); m2.rotation.y = Math.PI / 4;
    m1.castShadow=m1.receiveShadow=true; m2.castShadow=m2.receiveShadow=true;
    m1.add(new THREE.LineSegments(new THREE.EdgesGeometry(g1),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0.14})));
    m2.add(new THREE.LineSegments(new THREE.EdgesGeometry(g2),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0.14})));
    group.add(m1); group.add(m2);
    // 익은 토마토: 줄기 위에 빨간 열매 구
    if(rawType === 'plant_tomato_fruit') {
      const fruitGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const fruitMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
      const fruit = new THREE.Mesh(fruitGeo, fruitMat);
      fruit.position.y = h * 0.5 + 0.25;
      fruit.castShadow = true;
      group.add(fruit);
    }
    group.position.set(x, y + 0.4, z);
    group.userData={isBlock:true,bx:x,by:y,bz:z};
    return group;
  }

  let geo, py=y+0.5;
  if(type==='grass'||type==='straw'||def.category==='resource'){
    geo=new THREE.BoxGeometry(1,0.2,1); py=y+0.1;
  } else if(type==='fence'){
    geo=new THREE.BoxGeometry(1,1,0.2);
  } else {
    geo=new THREE.BoxGeometry(1,1,1);
  }
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.set(x,py,z);
  if(type==='fence') mesh.rotation.y=rot*(Math.PI/2);
  mesh.castShadow=mesh.receiveShadow=true;
  mesh.userData={isBlock:true,bx:x,by:y,bz:z};
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:0.14})));
  return mesh;
}

function _place(x,y,z,type){
  if(y<0||y>=GH) return;
  const k=bk(x,y,z);
  if(gridData[k]){if(meshByKey[k])scene.remove(meshByKey[k]);delete meshByKey[k];delete gridData[k];}
  gridData[k]=type; const mesh=buildMesh(type,x,y,z); if(mesh){meshByKey[k]=mesh;scene.add(mesh);}
  deletedBlocks.delete(k);
}

function placeBlock(x,y,z,type){
  if(!isActive(x,z)){toast('⚠️ 희미한 지역을 먼저 탐험해주세요!');return;}
  let finalType=type;
  if(type==='fence') finalType=type+'_'+currentRotation;
  _place(x,y,z,finalType); QuestManager.check();
}

function removeBlock(x,y,z){
  const k=bk(x,y,z); if(!gridData[k]) return;
  if(meshByKey[k]){scene.remove(meshByKey[k]); delete meshByKey[k];}
  delete gridData[k];
  deletedBlocks.add(k); 
  
  const neighbors = [
    [x, y-1, z], [x, y+1, z],
    [x-1, y, z], [x+1, y, z],
    [x, y, z-1], [x, y, z+1]
  ];
  for(const [nx,ny,nz] of neighbors) {
    const nk = bk(nx,ny,nz);
    if(gridData[nk] && !meshByKey[nk]) {
      const type = gridData[nk];
      const mesh = buildMesh(type,nx,ny,nz);
      if(mesh){ meshByKey[nk]=mesh; scene.add(mesh); }
    }
  }

  QuestManager.check();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  동물 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildAnimal(type,isInjured){
  const g=new THREE.Group(), M=hex=>new THREE.MeshLambertMaterial({color:hex}), B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  const woolColor=isInjured?0x999999:0xe8e8e8;
  if(type==='sheep'){
    const b=new THREE.Mesh(B(.75,.55,.55),M(woolColor)); b.position.y=.45; g.add(b);
    const hd=new THREE.Mesh(B(.38,.35,.38),M(0xcccccc)); hd.position.set(.44,.65,0); g.add(hd);
    [[-.22,-.18],[.22,-.18],[-.22,.18],[.22,.18]].forEach(([lx,lz])=>{const l=new THREE.Mesh(B(.14,.28,.14),M(0xaaaaaa));l.position.set(lx,.14,lz);g.add(l);});
    [[-.08],[.08]].forEach(([ez])=>{const e=new THREE.Mesh(B(.07,.07,.07),M(0x111111));e.position.set(.6,.68,ez);g.add(e);});
  } else if(type==='fish'){
    const b=new THREE.Mesh(B(.6,.35,.28),M(0xff6b35)); b.position.y=.5; g.add(b);
    const t=new THREE.Mesh(B(.24,.3,.12),M(0xff4500)); t.position.set(-.38,.5,0); g.add(t);
    const f=new THREE.Mesh(B(.18,.18,.06),M(0xff8c00)); f.position.set(.05,.68,0); g.add(f);
    const e=new THREE.Mesh(B(.09,.09,.09),M(0x111111)); e.position.set(.28,.56,.15); g.add(e);
  } else if(type==='horse'){
    const b=new THREE.Mesh(B(1.0,0.6,0.5),M(0x8B4513)); b.position.y=.5; g.add(b);
    const hd=new THREE.Mesh(B(0.4,0.4,0.35),M(0x8B4513)); hd.position.set(.6,.8,0); g.add(hd);
    [[-.35,-.15],[.35,-.15],[-.35,.15],[.35,.15]].forEach(([lx,lz])=>{const l=new THREE.Mesh(B(.15,.5,.15),M(0x5C2E00));l.position.set(lx,.25,lz);g.add(l);});
    const mane=new THREE.Mesh(B(.3,.1,.1),M(0x111111)); mane.position.set(.4,1.0,0); g.add(mane);
    const tail=new THREE.Mesh(B(.1,.4,.1),M(0x111111)); tail.position.set(-.55,.5,0); tail.rotation.z=0.2; g.add(tail);
  } else if(type==='goat'){
    const b=new THREE.Mesh(B(0.7,0.5,0.45),M(0xEEEEEE)); b.position.y=.4; g.add(b);
    const hd=new THREE.Mesh(B(0.3,0.3,0.3),M(0xEEEEEE)); hd.position.set(.4,.65,0); g.add(hd);
    [[-.2,-.15],[.2,-.15],[-.2,.15],[.2,.15]].forEach(([lx,lz])=>{const l=new THREE.Mesh(B(.12,.4,.12),M(0xAAAAAA));l.position.set(lx,.2,lz);g.add(l);});
    [[.08],[-.08]].forEach(([ez])=>{const horn=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.2,4),M(0xAAAAAA));horn.position.set(.4,.85,ez);g.add(horn);});
    const beard=new THREE.Mesh(B(.05,.15,.1),M(0xEEEEEE)); beard.position.set(.5,.45,0); g.add(beard);
  }
  g.traverse(c=>{if(c.isMesh){c.castShadow=c.receiveShadow=true;c.userData.agr=g;}});
  return g;
}

function placeAnimal(x,y,z,type,isInjured=false){
  const group=buildAnimal(type,isInjured);
  group.position.set(x,y,z); scene.add(group);
  const angle=Math.random()*Math.PI*2;
  animalData.push({type,x,y,z,group,isInjured,angle,targetAngle:angle});
  QuestManager.check();
}

function removeAnimalAt(a){
  const i=animalData.indexOf(a);
  if(i!==-1){scene.remove(animalData[i].group);animalData.splice(i,1);QuestManager.check();}
}

function getVisualTopY(x,z){
  const gy=getTopY(Math.round(x),Math.round(z));
  const underBlock=gridData[bk(Math.round(x),gy-1,Math.round(z))];
  if(underBlock){
    const t=underBlock.split('_')[0];
    if(t==='grass'||t==='straw'||getBlockData(t)?.category==='plant'||getBlockData(t)?.category==='seed'||getBlockData(t)?.category==='resource') return (gy-1)+0.2;
  }
  return gy;
}

function isSolid(rawType){
  if(!rawType) return false;
  const base=rawType.split('_')[0];
  const def=ITEM_DB[base]||TERRAIN_BLOCKS[base];
  return def&&def.solid;
}

function analyzeHabitat(sx,sz){
  const v=new Set(),q=[[sx,sz]]; v.add(`${sx},${sz}`);
  let count=0,grassCount=0;
  while(q.length){
    count++; if(count>2000) return {enclosed:false,grass:0};
    const[cx,cz]=q.shift();
    const topY=getTopY(cx,cz)-1;
    const rawType=gridData[bk(cx,topY,cz)];
    const floorType=rawType?rawType.split('_')[0]:'';
    if(floorType==='grass'||floorType==='t_low'||floorType==='t_mid') grassCount++;
    for(const[nx,nz] of[[cx+1,cz],[cx-1,cz],[cx,cz+1],[cx,cz-1]]){
      const nk=`${nx},${nz}`; if(v.has(nk)) continue;
      const blocked=[0,1].some(hy=>{ const b=gridData[bk(nx,topY+1+hy,nz)]; return isSolid(b); });
      if(!blocked){v.add(nk);q.push([nx,nz]);}
    }
  }
  return {enclosed:true,grass:grassCount};
}

function updateAnimals(t){
  for(const a of animalData){
    if(pickedAnimal&&pickedAnimal.entry===a){ a.group.position.y=a.y+1.5+Math.sin(t*4)*.12; a.group.rotation.y=t*1.5; continue; }
    if(a.type==='fish') updateFish(a,t);
    else if(a.type==='sheep') updateSheep(a,t);
    else if(a.type==='horse') updateHorse(a,t);
    else if(a.type==='goat') updateGoat(a,t);
    else updateDefaultAnimal(a,t);
  }
}

function updateFish(a,t){
  const curTopY=getVisualTopY(a.x,a.z);
  if(curTopY<WATER_LEVEL){
    const spd=0.022,look=3.5;
    const fwdY=getTopY(Math.round(a.x+Math.cos(a.angle)*look),Math.round(a.z-Math.sin(a.angle)*look));
    if(fwdY>=WATER_LEVEL-0.5){ const la=a.angle+Math.PI*0.6,ra=a.angle-Math.PI*0.6; const lY=getTopY(Math.round(a.x+Math.cos(la)*look),Math.round(a.z-Math.sin(la)*look)); const rY=getTopY(Math.round(a.x+Math.cos(ra)*look),Math.round(a.z-Math.sin(ra)*look)); a.targetAngle=(lY<rY?la:ra)+(Math.random()-0.5)*0.5; }
    else if(Math.random()<0.012){ a.targetAngle=a.angle+(Math.random()-0.5)*1.0; }
    let diff=a.targetAngle-a.angle; while(diff>Math.PI)diff-=2*Math.PI; while(diff<-Math.PI)diff+=2*Math.PI; a.angle+=diff*0.07;
    const nx=a.x+Math.cos(a.angle)*spd,nz=a.z-Math.sin(a.angle)*spd;
    const nY=getTopY(Math.round(nx),Math.round(nz));
    if(nY<WATER_LEVEL){a.x=nx;a.z=nz;}else{a.targetAngle=a.angle+Math.PI+(Math.random()-0.5)*0.8;}
    const depth=Math.max(0.4,WATER_LEVEL-curTopY);
    a.group.position.set(a.x,curTopY+depth*0.35+Math.sin(t*1.8+a.x)*0.12,a.z);
    a.group.rotation.y=a.angle; a.group.rotation.z=Math.sin(t*2)*0.04;
  } else {
    a.group.position.set(a.x,curTopY+0.2+Math.abs(Math.sin(t*15))*0.3,a.z);
    a.group.rotation.z=Math.sin(t*20)*0.5;
  }
}

function updateSheep(a,t){
  if(toolMode==='action'&&selItem==='lure'&&hlMesh.visible){
    const dx=hlMesh.position.x-a.x,dz=hlMesh.position.z-a.z;
    const dist=Math.sqrt(dx*dx+dz*dz);
    if(dist>1.5&&dist<12){ const ws=a.isInjured?0.015:0.04; a.x+=dx/dist*ws; a.z+=dz/dist*ws; a.targetAngle=Math.atan2(-dz,dx); }
  }
  let diff=a.targetAngle-a.angle; while(diff>Math.PI)diff-=2*Math.PI; while(diff<-Math.PI)diff+=2*Math.PI; a.angle+=diff*0.1;
  const aheadY=getVisualTopY(a.x+Math.cos(a.angle)*0.4,a.z-Math.sin(a.angle)*0.4);
  a.y+=(aheadY-a.y)*0.25;
  a.group.position.set(a.x,a.y+Math.sin(t*2.5+a.x)*0.06,a.z); a.group.rotation.y=a.angle; a.group.rotation.z=0;
}

function updateHorse(a,t){
  let clearPath=0;
  for(let i=1;i<=10;i++){ if(isFenced(Math.round(a.x+Math.cos(a.angle)*i),Math.round(a.z-Math.sin(a.angle)*i))) break; clearPath=i; }
  if(clearPath>=8){ a.x+=Math.cos(a.angle)*0.08; a.z-=Math.sin(a.angle)*0.08; a.group.rotation.y=a.angle; }
  else{ a.group.rotation.y=a.angle+Math.sin(t*8)*0.05; if(Math.random()<0.02) a.angle+=0.5; }
  const aheadY=getVisualTopY(a.x+Math.cos(a.angle)*0.4,a.z-Math.sin(a.angle)*0.4);
  a.y+=(aheadY-a.y)*0.25;
  a.group.position.set(a.x,a.y+Math.sin(t*4.0)*0.08,a.z); a.group.rotation.z=0;
}

function updateGoat(a,t){
  if(!a.escapeTimer) a.escapeTimer=0;
  a.escapeTimer+=0.016;
  if(a.escapeTimer>30){ a.escapeTimer=0; const ea=Math.random()*Math.PI*2; const tx=a.x+Math.cos(ea)*3,tz=a.z-Math.sin(ea)*3; if(!isFenced(Math.round(tx),Math.round(tz))){ a.x=tx;a.z=tz;toast('🐐 염소가 탈출했어요!'); } }
  if(Math.random()<0.01) a.targetAngle=a.angle+(Math.random()-0.5)*2;
  let diff=a.targetAngle-a.angle; while(diff>Math.PI)diff-=2*Math.PI; while(diff<-Math.PI)diff+=2*Math.PI; a.angle+=diff*0.1;
  const aheadY=getVisualTopY(a.x+Math.cos(a.angle)*0.4,a.z-Math.sin(a.angle)*0.4);
  a.y+=(aheadY-a.y)*0.25;
  a.group.position.set(a.x,a.y+Math.sin(t*2.5+a.x)*0.06,a.z); a.group.rotation.y=a.angle; a.group.rotation.z=0;
}

function updateDefaultAnimal(a,t){
  let diff=a.targetAngle-a.angle; while(diff>Math.PI)diff-=2*Math.PI; while(diff<-Math.PI)diff+=2*Math.PI; a.angle+=diff*0.1;
  const aheadY=getVisualTopY(a.x+Math.cos(a.angle)*0.4,a.z-Math.sin(a.angle)*0.4);
  a.y+=(aheadY-a.y)*0.25;
  a.group.position.set(a.x,a.y+Math.sin(t*2.5+a.x)*0.06,a.z); a.group.rotation.y=a.angle; a.group.rotation.z=0;
}
