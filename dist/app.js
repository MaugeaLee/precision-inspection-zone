import {loadShapes} from './shapes.js';
import {PLAN,PlanScene} from './plan.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RENDER} from './original/blender.js';
import {INSP} from './original/inspzone.js';
import {InspectionSession,PRODUCTS,ROUTES,CELL_SHORT,RESULT,vehicleState} from './session.js';

const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=t=>[8+Math.floor(t/3600),Math.floor(t/60)%60,Math.floor(t)%60].map(n=>String(n).padStart(2,'0')).join(':');
let planScene;
let engine,renderer,scene,camera,controls,labelRenderer,selected=null,running=true,halted=false,speed=10,mode='dark',showLabels=true,showData=true,uiTimer=0,last=performance.now(),cameraGoal=null,routeLine,recorder,recordCanvas,recordContext,recordStart,recordChunks=[],recordStream;
const viewport=$('viewport');
const names={DOCK:'시료 접수·도킹',VIS:'ZEISS ABIS III · AIMAX',SCAN:'3D 스캔·초음파검사',OINS:'ZEISS O-INSPECT 8/6/3',MMZ:'ZEISS MMZ M',JUDGE:'AI 판정·결과 버퍼'};
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function openModal(title,html){$('modal-title').textContent=title;$('modal-body').innerHTML=html;$('modal').showModal();}

async function init(){
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
    viewport.append(renderer.domElement);
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x172b32,.008);
    camera=new THREE.PerspectiveCamera(40,1,.1,220);camera.position.set(78,60,38);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.set(26,0,-12);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=5;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.47;
    controls.addEventListener('start',()=>cameraGoal=null);
    scene.add(new THREE.HemisphereLight(0xcdebf4,0x495049,2.6));
    const sun=new THREE.DirectionalLight(0xffecd9,3);sun.position.set(18,38,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=110;sun.shadow.bias=-.0005;sun.target.position.set(39,0,-11);scene.add(sun,sun.target);
    const rim=new THREE.DirectionalLight(0x6cbac6,2);rim.position.set(57,12,-36);scene.add(rim);
    const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.25;pmrem.dispose();
    labelRenderer=new CSS2DRenderer();labelRenderer.domElement.className='label-layer';viewport.append(labelRenderer.domElement);
    const loader=new GLTFLoader();
    try{await Promise.all(['amr'].map(async k=>{const gltf=await loader.loadAsync('./assets/models/'+k+'.glb');gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});RENDER.assets[k]=gltf.scene;}));RENDER.loaded=true;}
    catch(e){console.warn('기본 도형 모델로 전환합니다.',e);RENDER.loaded=false;toast('기본 장비 모델로 실행합니다.');}
    await loadShapes();
    engine=new InspectionSession(scene);
    planScene=new PlanScene(engine,scene,focusPlan);
    engine.onEvent(()=>renderLog());
    makeFloor();makeSourceBays();makeCellList();bindControls();makeRoute();
    for(const c of engine.order){c.label.position.y=2.8;c.el.querySelector('.nm span').textContent=CELL_SHORT[c.id];c.el.addEventListener('pointerdown',e=>{e.stopPropagation();focusCell(c.id);});for(const p of c.plates)p.visible=false;}
    new ResizeObserver(resize).observe(viewport);resize();
    seedDemo();$('loader').hidden=true;updateUI();requestAnimationFrame(frame);
  }catch(error){console.error(error);$('loader').innerHTML='<strong>3D 화면을 시작하지 못했습니다.</strong><small>WebGL2 지원 브라우저에서 다시 열어 주세요.</small><small>'+escape(error.message)+'</small>';}
}
function makeFloor(){
  const floor=new THREE.Mesh(new THREE.BoxGeometry(52,.25,48),new THREE.MeshStandardMaterial({color:0x627b80,roughness:.9}));floor.position.set(26,-.19,-13);floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(52,52,0x779594,0x718a8b);grid.position.set(26,-.055,-13);grid.scale.z=48/52;grid.material.transparent=true;grid.material.opacity=.37;scene.add(grid);
  const curbMat=new THREE.MeshStandardMaterial({color:0x243c45,roughness:.7});
  for(const z of [-37,11]){const curb=new THREE.Mesh(new THREE.BoxGeometry(52,.4,.2),curbMat);curb.position.set(26,-.01,z);scene.add(curb);}
  const laneMat=new THREE.MeshBasicMaterial({color:0x6acfb9,transparent:true,opacity:.4});
  for(let z=-31;z<9;z+=1.5){const dash=new THREE.Mesh(new THREE.PlaneGeometry(.07,.8),laneMat);dash.rotation.x=-Math.PI/2;dash.position.set(29.4,.006,z);scene.add(dash);}
}
function makeSourceBays(){
  const material=new THREE.MeshStandardMaterial({color:0x254b52,roughness:.8});
  for(const [i,name]of ['정밀조립','유연생산','적응가공'].entries()){
    const x=[33.5,37,40.5][i];const pad=new THREE.Mesh(new THREE.BoxGeometry(2.7,.08,2),material);pad.position.set(x,.01,-31.5);pad.receiveShadow=true;scene.add(pad);
    const element=document.createElement('div');element.className='source-label';element.style.cssText='font-size:8px;color:#a6cec8;background:#19363ce8;padding:4px 7px;border:1px solid #3e6668;border-radius:3px;white-space:nowrap';element.textContent=name+' 샘플 반입';const label=new CSS2DObject(element);label.position.set(x,.35,-32.3);scene.add(label);
  }
}
function makeCellList(){
  $('cell-list').innerHTML=PLAN.map(p=>`<button class="cell-row" data-plan="${p.id}"><span class="cell-number">${p.id.slice(-1)}</span><span><strong>${p.short}</strong><small>검사 · 모니터링</small><span id="plan-state-${p.id}" class="state">대기</span></span></button>`).join('')+`<div class="station-links">${engine.order.map(c=>`<button data-cell="${c.id}">${c.id==='DOCK'?'공용 반입':names[c.id]}</button>`).join('')}</div>`;
  document.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>focusPlan(b.dataset.plan));
  document.querySelectorAll('[data-cell]').forEach(b=>b.onclick=()=>focusCell(b.dataset.cell));
}
function focusPlan(id){const p=PLAN.find(p=>p.id===id);selected=id;planScene.focus=id;cameraGoal={target:new THREE.Vector3(p.x,.7,p.z),position:new THREE.Vector3(p.x+12,13,p.z+11)};updateFocus();}
function bindControls(){
  $('play').onclick=()=>{running=!running;renderPlay();};
  document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
  $('reset').onclick=()=>{stopRecording();restart();toast('검사 시연을 초기화했습니다.');};
  $('overview').onclick=()=>{selected=null;planScene.focus=null;$('focus-card').hidden=true;document.querySelectorAll('[data-cell]').forEach(b=>b.classList.remove('active'));cameraGoal={position:new THREE.Vector3(78,60,38),target:new THREE.Vector3(26,0,-12)};};
  $('labels').onclick=()=>{showLabels=!showLabels;engine.setLabels(false);planScene.setLabels(showLabels);for(const c of engine.order)for(const p of c.plates)p.visible=false;$('labels').classList.toggle('active',showLabels);$('labels').setAttribute('aria-pressed',showLabels);document.querySelectorAll('.source-label').forEach(el=>el.style.visibility=showLabels?'visible':'hidden');};
  $('data-lines').onclick=()=>{showData=!showData;$('data-lines').classList.toggle('active',showData);$('data-lines').setAttribute('aria-pressed',showData);};
  $('cobot-model').onchange=()=>{planScene.cobot=$('cobot-model').value;planScene.update();};
  $('handler-model').onchange=()=>{planScene.handler=$('handler-model').value;planScene.update();};
  $('product').onchange=makeRoute;
  $('enqueue').onclick=()=>{if(engine.enqueue($('product').value,$('outcome').value)){toast(PRODUCTS[$('product').value][1]+' 샘플을 투입했습니다.');if(!running){running=true;renderPlay();}}else toast('대기열이 가득 찼습니다. 진행 후 다시 투입해 주세요.');updateUI();};
  $('auto').onchange=()=>toast($('auto').checked?'자동 샘플 요청 시연을 시작합니다.':'자동 시연을 끄고 수동 투입만 받습니다.');
  $('stop').onclick=()=>{halted=!halted;$('stop').textContent=halted?'▶ 정지 해제':'■ 보호정지';$('stop').classList.toggle('engaged',halted);engine.emit(halted?'warn':'info',halted?'Zone 보호정지 발령':'보호정지 해제·작업 재개',{obs:halted?'모든 검사장비·AMR 정지':'시뮬레이션 안전 상태 확인',act:halted?'진행 제품 상태 유지':'미완료 작업부터 재개'});updateUI();};
  $('fault').onclick=()=>{const group=PLAN.find(p=>p.id===selected);if(group&&!group.nodes.length){toast('이 셀은 순찰·비전 점검 시연입니다. 검사장비 셀을 선택해 주세요.');return;}const target=group?.nodes[0]??(engine.cells[selected]?selected:'VIS');toast(engine.injectFault(target)?CELL_SHORT[target]+' 이상·복구 시연을 시작합니다.':'해당 셀은 이미 복구 중입니다.');updateUI();};
  $('history').onclick=showHistory;$('about').onclick=showAbout;$('close-modal').onclick=()=>$('modal').close();$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();}});
  $('record').onclick=()=>recorder?.state==='recording'?stopRecording():startRecording();
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||$('modal').open)return;if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.key==='Escape')$('overview').click();});
  // Raycast equipment rather than requiring the small label to be clicked.
  let pointerDown;
  renderer.domElement.addEventListener('pointerdown',e=>pointerDown=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)return;const rect=renderer.domElement.getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);for(const hit of ray.intersectObjects(planScene.root.children,true)){let o=hit.object;while(o){if(o.userData.zoneCell){focusCell(o.userData.zoneCell.cellId);return;}o=o.parent;}}});
}
function restart(){
  engine.restart(mode);engine.wallG.visible=false;for(const c of engine.order){c.label.position.y=2.8;c.el.querySelector('.nm span').textContent=CELL_SHORT[c.id];for(const p of c.plates)p.visible=false;}
  running=true;halted=false;$('stop').textContent='■ 보호정지';$('stop').classList.remove('engaged');renderPlay();seedDemo();updateUI();
}
function seedDemo(){engine.enqueue('hood','ok');engine.enqueue('hblock','uncertain');engine.enqueue('eaxle','ng');}
function renderPlay(){$('play').textContent=running?'Ⅱ 일시정지':'▶ 재생';$('play').setAttribute('aria-label',running?'일시정지':'재생');}
function focusCell(id){
  if(!engine.cells[id])return;selected=id;planScene.focus=id;const c=engine.cells[id];
  cameraGoal={target:new THREE.Vector3(c.def.x,1,c.def.z-1),position:new THREE.Vector3(c.def.x+7.8,6.3,c.def.z+6.5)};
  document.querySelectorAll('[data-cell]').forEach(b=>b.classList.toggle('active',b.dataset.cell===id));updateFocus();
}
function updateFocus(){
  if(!selected)return;const plan=PLAN.find(p=>p.id===selected);if(plan){$('focus-card').hidden=false;$('focus-card').innerHTML=`<div class="eyebrow">Cell ${plan.id.slice(-1)}</div><h3>${plan.name}</h3><p>${plan.description}</p><p class="detail-note">사업계획서의 셀 구분 · 장비 배치는 시연 구성안</p>`;return;}const c=engine.cells[selected],fault=engine.equipment[selected].state;
  $('focus-card').hidden=false;$('focus-card').innerHTML=`<div class="eyebrow">QIS-${selected}</div><h3>${names[selected]}</h3><p>${escape(c.def.use)}</p><div class="detail-grid"><div><span>현재 상태</span><b>${halted?'보호정지':fault!=='IDLE'?fault==='DOWN'?'이상':'점검 중':c.state==='BUSY'?'검사 중':c.state==='DONE'?'인계 대기':'대기'}</b></div><div><span>작업 진행</span><b>${Math.round(c.progress*100)}%</b></div><div><span>기준 사이클</span><b>${Math.round(c.def.cycle*engine.mul)}s</b></div><div><span>작업 완료</span><b>${c.done}회</b></div></div><p class="detail-note">사이클·판정은 원본 시뮬레이션 설정값입니다.</p>`;
}
function makeRoute(){
  const product=$('product').value,ids=['DOCK',...ROUTES[product],'JUDGE'];$('route-product').textContent=PRODUCTS[product][1];$('recipe-route').innerHTML=ids.map(id=>`<span class="node">${CELL_SHORT[id]}</span>`).join('<span>→</span>');
  if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();}
  const points=[];for(let i=0;i<ids.length;i++){const d=INSP.cells[ids[i]];if(i){const p=INSP.cells[ids[i-1]];points.push(new THREE.Vector3(INSP.lane,.09,p.z),new THREE.Vector3(INSP.lane,.09,d.z));}points.push(new THREE.Vector3(d.x,.09,d.z));}
  routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x97ffe3,transparent:true,opacity:.38}));scene.add(routeLine);
}
function renderLog(){
  if(!engine)return;
  $('event-log').innerHTML=engine.events.slice(0,35).map(e=>`<div class="event ${e.level==='ng'?'ng':e.level==='warn'?'warn':''}"><time>${time(e.time)}</time><strong>${escape(e.title)}</strong><p>${escape(e.dec??e.obs??'')}${e.act?'<br>'+escape(e.act):''}</p></div>`).join('');
}
function updateUI(){
  const s=engine.summary();$('clock').textContent=time(engine.time);$('samples').innerHTML=s.samples+'<small>개</small>';$('inflight').innerHTML=s.active+'<small>/</small>'+s.queue;$('completed').innerHTML=s.done+'<small>개</small>';$('ok').textContent=s.ok;$('unc').textContent=s.unc;$('ng').textContent=s.ng;
  $('agent-state').textContent=halted?'보호정지 · 재개 대기':!running?'시연 일시정지':s.active?'검사 작업 조정 중':'샘플 요청 대기';
  for(const c of engine.order){const fault=engine.equipment[c.id].state,label=halted?'보호정지':fault==='DOWN'?'설비 이상':fault==='MAINT'?'점검 중':c.state==='BUSY'?'검사 중 · '+(c.item?.id??''):c.state==='DONE'?'후속 셀 대기':'대기';}
  for(const p of PLAN){const el=$('plan-state-'+p.id),cs=p.nodes.map(id=>engine.cells[id]);el.textContent=halted?'보호정지':!running?'일시정지':!cs.length?'순찰·점검 중':cs.some(c=>c.fault)?'설비 점검':cs.some(c=>c.state==='BUSY')?'검사·작업 중':'대기';}
  $('amr-list').innerHTML=engine.carriers.map(c=>`<div class="amr-item"><span class="amr-icon">▱</span><div><strong>${c.uid}</strong><p class="${c.state==='park'?'':'moving'}">${halted?'보호정지':vehicleState[c.state]??c.state}${c.item?' · '+escape(PRODUCTS[c.item.product][1]):''}</p></div></div>`).join('');
  engine.updateLabels();if(halted)for(const c of engine.order)c.chip.textContent='보호정지';updateFocus();
}
function resize(){const {width,height}=viewport.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);labelRenderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
function frame(now){
  const real=Math.min((now-last)/1000,.1);last=now;
  if(running&&!halted){let remaining=real*speed;while(remaining>0){const dt=Math.min(remaining,.08);engine.tick(dt,false,$('auto').checked);remaining-=dt;}}
  else engine.halted=halted;
  // Keep every mechanical animation frozen during pause/protective stop.
  if(running&&!halted)engine.update(real,true,speed);planScene.update();engine.wallG.visible=false;engine.pkG.visible=showData;for(const c of engine.order)c.iot.visible=showData;
  if(cameraGoal){camera.position.lerp(cameraGoal.position,.07);controls.target.lerp(cameraGoal.target,.07);if(camera.position.distanceTo(cameraGoal.position)<.02)cameraGoal=null;}
  controls.update();renderer.render(scene,camera);labelRenderer.render(scene,camera);
  uiTimer+=real;if(uiTimer>.2){uiTimer=0;updateUI();}
  if(recorder?.state==='recording')drawRecording();requestAnimationFrame(frame);
}
function showHistory(){
  const rows=engine.records.map(r=>`<tr><td>${r.sample_id}<br><small>${r.product_id}</small></td><td>${r.product}</td><td>${time(r.time_seconds)}</td><td class="${r.result==='OK'?'green':r.result==='NG'?'red':'amber'}">${r.result}</td><td>${r.remeasured?'예':'—'}</td><td>${escape(r.route)}</td></tr>`).reverse().join('');
  openModal('검사·판정 이력',`<div class="export-row"><button id="export-csv">CSV 저장</button><button id="export-json">JSON · 작업 경로 저장</button><span>현재 실행의 시뮬레이션 기록</span></div>${rows?'<table><thead><tr><th>샘플 / 제품 ID</th><th>제품</th><th>시각</th><th>판정</th><th>재측정</th><th>수행 경로</th></tr></thead><tbody>'+rows+'</tbody></table>':'<p class="empty-history">아직 판정 이력이 없습니다.<br>검사 시연을 진행한 후 확인해 주세요.</p>'}<p>불확실은 중간 판정 이벤트입니다. 재측정 후의 최종 OK·NG 이력과 함께 기록합니다. NG의 후속 조치는 생산 Zone으로의 요청으로 표현합니다.</p>`);
  $('export-csv').onclick=()=>{const columns=['sample_id','product_id','product','source_zone','time_seconds','result','remeasured','route','scenario','source'];const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';download(new Blob(['\ufeff'+[columns.join(','),...engine.records.map(r=>columns.map(k=>quote(r[k])).join(','))].join('\r\n')],{type:'text/csv;charset=utf-8'}),'QIS_inspection_history.csv');};
  $('export-json').onclick=()=>download(new Blob([JSON.stringify({source:'simulation',mode,records:engine.records,trace:engine.trace,events:engine.events},null,2)],{type:'application/json'}),'QIS_inspection_trace.json');
}
function showAbout(){openModal('정밀검사존 · 구성 및 출처',`<p>메타팩토리의 정밀검사존을 독립 실행 화면으로 분리했습니다. 사업계획서의 다섯 셀로 구성하고 공용 반입 구역과 검사 장비를 하위 공정으로 분리했습니다. AMR·판정 상태머신은 원본을 활용합니다.</p><h3>5개 셀 · 장비 구성</h3>${PLAN.map(p=>`<p><b>${p.name}</b><br>${p.description}</p>`).join('')}<p>표면·피처 검사: 두산 H2017 / H2515. 검사물 이적재: 현대 HDR50-22. 두산 H2017·H2515와 현대 HDR50-22는 제조사 공개 메시·URDF 기반입니다. HDR80-22는 공식 형상 미확보로 선택을 보류했습니다. 제품은 원본의 제품별 시각화 모델이며 실물 CAD가 아닙니다. 장비의 셀 내 배치와 검사 경로는 시연 구성안입니다. 비전검사 부스는 첨부 도면을 참고한 시연 형상이며, 생산·조립·물류 구역은 공장 전역 순찰을 보여 주는 개념 배치입니다.</p><h3>검사 경로</h3><table><tr><th>제품</th><th>검사 경로 (접수·판정 공통)</th></tr><tr><td>후드 · 도어 · 도어트림</td><td>비전검사 → 3D 스캔·UT</td></tr><tr><td>e-axle</td><td>비전검사 → O-INSPECT</td></tr><tr><td>유압블록 · 리어커버</td><td>MMZ M → O-INSPECT</td></tr></table><h3>시연 범위</h3><p>검사 동작·OK/불확실/NG·설비 이상·복구·품질 환류 요청을 모사합니다. 실제 검사장비·PLC·MQTT·AI 모델과 연결되어 있지 않습니다. 실제 도입 장비의 수량·정확도·검출 성능을 나타내지 않습니다.</p><p>불확실 판정은 O-INSPECT 재측정 후 재판정합니다. NG는 보류·리워크 검토·선행공정 보정 요청으로 기록하며, 생산 Zone의 실제 재작업 완료를 모사하지 않습니다.</p><h3>조작·영상 저장</h3><p>드래그: 회전 / 휠: 확대 / 오른쪽 드래그: 이동 / Space: 재생·일시정지 / Esc: 전체 보기. 녹화는 3D 장면·셀 라벨·시각·판정 실적을 포함한 1920×1080 WebM 영상으로 저장합니다.</p><h3>출처</h3><p><a href="https://theuniversepark.github.io/meta-factory/" target="_blank" rel="noopener">피지컬AI 실증 메타팩토리 · Jin Park</a><br><a href="https://github.com/theuniversepark/meta-factory" target="_blank" rel="noopener">원본 공개 저장소</a> · package.json ISC 표기<br>three.js · MIT · <a href="./vendor/three/LICENSE" target="_blank" rel="noopener">라이선스</a><br><a href="./assets/ORIGINAL_OPEN_SOURCE.md" target="_blank" rel="noopener">원본 오픈소스 고지</a> · <a href="./assets/source.json" target="_blank" rel="noopener">참조 소스 버전</a></p>`);}
function startRecording(){
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast('이 브라우저는 영상 녹화를 지원하지 않습니다.');return;}
  recordCanvas=document.createElement('canvas');recordCanvas.width=1920;recordCanvas.height=1080;recordContext=recordCanvas.getContext('2d');drawRecording();
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){toast('WebM 녹화를 지원하는 브라우저에서 실행해 주세요.');return;}
  recordStream=recordCanvas.captureStream(30);recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:8_000_000});recordChunks=[];recordStart=performance.now();
  recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};
  recorder.onstop=()=>{
    const blob=new Blob(recordChunks,{type:mime}),url=URL.createObjectURL(blob),name='QIS_animation_'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';
    recordStream.getTracks().forEach(t=>t.stop());$('record').classList.remove('recording');$('record').innerHTML='<span class="record-dot"></span> 녹화';
    openModal('녹화 영상 · WebM',`<video id="record-preview" controls playsinline src="${url}" style="width:100%;border-radius:8px;background:#07131a"></video><p>1920 × 1080 · ${Math.round((performance.now()-recordStart)/1000)}초 · ${(blob.size/1024/1024).toFixed(2)} MB · WebM</p><p><a id="record-save" href="${url}" download="${name}">↓ 녹화 영상 저장</a></p><p>3D 장면·셀 라벨·시각·실적을 포함합니다. 저장 링크를 눌러 영상을 내려받을 수 있습니다.</p>`);
    toast('녹화 영상을 만들었습니다. 미리보기에서 저장해 주세요.');
  };
  recorder.onerror=()=>{recordStream?.getTracks().forEach(t=>t.stop());$('record').classList.remove('recording');$('record').innerHTML='<span class="record-dot"></span> 녹화';toast('녹화를 완료하지 못했습니다. 다시 시도해 주세요.');};
  recorder.start(1000);$('record').classList.add('recording');$('record').textContent='■ 녹화 종료';toast('3D 애니메이션 녹화를 시작했습니다.');
}
function stopRecording(){if(recorder?.state==='recording')recorder.stop();}
function drawRecording(){
  if(!recordContext)return;const ctx=recordContext,w=recordCanvas.width,h=recordCanvas.height,canvas=renderer.domElement;
  ctx.fillStyle='#14242c';ctx.fillRect(0,0,w,h);const scale=Math.min(w/canvas.width,(h-140)/canvas.height),dw=canvas.width*scale,dh=canvas.height*scale,dx=(w-dw)/2,dy=75+(h-140-dh)/2;ctx.drawImage(canvas,dx,dy,dw,dh);
  ctx.fillStyle='#0e1d26';ctx.fillRect(0,0,w,75);ctx.fillRect(0,h-65,w,65);ctx.fillStyle='#66dfc2';ctx.font='bold 25px "Malgun Gothic",sans-serif';ctx.fillText('정밀검사 Zone · Inspection Studio',35,46);ctx.fillStyle='#a2c3c8';ctx.font='17px "Malgun Gothic",sans-serif';ctx.fillText('시뮬레이션   '+time(engine?.time??0),1510,44);
  if(engine&&showLabels)for(const c of PLAN.map(p=>({id:p.id,def:{x:p.x,z:p.z},state:p.nodes.some(id=>engine.cells[id].state==='BUSY')?'BUSY':'IDLE'}))){const p=new THREE.Vector3(c.def.x,3.1,c.def.z).project(camera);if(p.z>1||p.z< -1)continue;const x=dx+(p.x+1)*dw/2,y=dy+(-p.y+1)*dh/2;ctx.font='15px "Malgun Gothic",sans-serif';const text=(PLAN.find(p=>p.id===c.id)?.short??CELL_SHORT[c.id])+' · '+(halted?'정지':c.state==='BUSY'?'검사 중':'대기'),width=ctx.measureText(text).width+24;ctx.fillStyle='#10232be8';ctx.fillRect(x-width/2,y-14,width,31);ctx.fillStyle='#c2e3df';ctx.fillText(text,x-width/2+12,y+7);}
  if(engine){ctx.font='18px "Malgun Gothic",sans-serif';ctx.fillStyle='#b3ccd0';ctx.fillText(`반입 ${engine.stats.samples}    최종 판정 ${engine.stats.done}    OK ${engine.stats.ok}    불확실 ${engine.stats.unc}    NG ${engine.stats.ng}`,35,h-25);ctx.fillStyle='#648f9b';ctx.font='14px "Malgun Gothic",sans-serif';ctx.fillText('검사 동작·결과는 시나리오 모사입니다.',1460,h-25);}
}
init();
