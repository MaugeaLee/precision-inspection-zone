import {buildScanBox} from './scanbox.js';
import {scanStage} from './product-policy.js';
import {measurementMotion,makeInspectionTrace,smooth} from './inspection-motion.js';
import {panelGeometry} from './render-quality.js';
import * as T from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {replaceProduct} from './shapes.js';

export const PDF_CELLS=[
 {title:'초고성능 로봇형 검사 비전 시스템',pages:'3 · 9',targets:'차체·내외장·조립부품·가공품·패널',checks:'표면결함, 홀·스터드·팜너트 위치, 치수편차, 조립상태, 기준면·기하공차',equipment:[['ABIS 2IR / ABIS III','2 set','표면결함 검사; 화면에는 사용자 지정 ABIS III 적용'],['AIMAX','1 set','피처 위치·치수 검사'],['O-INSPECT 8/6/3 Duo / CMM','1 set','접촉·광학 정밀측정'],['문형 3차원 측정기','1 set','사용자 지정 ZEISS MMZ G 적용'],['협동로봇 / 산업용 로봇','2대 / 1대','검사·제품 이적재'],['카메라·조명 / 그리퍼·툴체인저 / 분석 서버','각 1식','재촬영·파지·측정 데이터 통합']],outputs:'표면·피처·CMM·문형측정 데이터 → 품질판정 → 통합 OCS'},
 {title:'3D 스캔과 초음파 용접 검사 로봇',pages:'4 · 10',targets:'BIW·대형 패널·도어·후드·접합부·하우징',checks:'CAD 편차, 갭·단차, 비드·실러 형상, 용입·융착 불량, 내부균열·기공·미접합·이물',equipment:[['ATOS ScanBox 8160 + ATOS 5X plusbox','1 set','대형 BIW·패널 3D 스캔'],['ATOS ScanBox 5130 + ATOS 5 plusbox','1 set','중소형 패널 스캔'],['초음파/NDT·프로브 추종장치','1 set','접촉식 매트릭스 헤드·결합매질·분석 단말 (참고 설계)'],['공정 인라인 X-ray','1 set','내부 결함 비파괴 검사'],['협동로봇 / 산업용 로봇','1대 / 1대','UT 추종·핸들링'],['그리퍼 3종·툴체인저 / 차폐·인터록 / 분석 서버','각 1식','파지·접근 제어·융합 판정']],outputs:'3D·UT·X-ray 데이터 융합 → 통합 OCS. 검사 적용 여부·순서는 제품별 레시피 검토 대상'},
 {title:'4족 보행 검사 및 안전 모니터링 로봇',pages:'5 · 11',targets:'공장 전역 지상 통로·설비 주변·AMR 동선·안전구역',checks:'장애물, 누유, 온도 이상, 설비 알람, 접근·출입 이벤트, 환경 이상',equipment:[['4족 보행 로봇 세트','10 set','PDF 계획 수량; 화면에는 대표 1대'],['RGB·Depth / LiDAR / 열화상','패키지 포함','영상·공간·열 이상 감지'],['온습도·가스·미세먼지 센서','패키지 포함','작업환경 모니터링'],['안전 분석 AI / OCS 연계','패키지 포함','위치·위험도·조치 필요 여부 전송'],['복귀·충전 도킹 스테이션','구성도 표기','순찰 후 복귀·대기']],outputs:'이상 유형·위치·위험도 → 통합 OCS → 현장 확인 요청'},
 {title:'원키트 비전 센서 기술 드론 세트',pages:'6 · 12',targets:'공장 상부·고소부·사각지대·창고·물류·AMR 구역',checks:'적재·이송 이상, AMR 경로 이탈·전복 위험, 열 이상, 사각지대 이벤트',equipment:[['원키트 비전 센서 드론 세트','20 set','PDF 계획 수량; 화면에는 대표 1대'],['RGB·Depth·열화상 원키트','패키지 포함','영상·거리·열 데이터 통합'],['실내 위치인식·자율비행','패키지 포함','점검 위치·재촬영 지점 관리'],['도킹·충전 스테이션','패키지 포함','자동 복귀·충전·대기'],['상부·물류 분석 AI / OCS 연계','패키지 포함','이상 이벤트 통합']],outputs:'상부·물류 이상과 위치 → 통합 OCS → 확인·재촬영 요청'},
 {title:'통합 OCS 시뮬레이션',pages:'7 · 13',targets:'검사·측정·모니터링, AMR·로봇·지그·제품 ID 품질이력',checks:'OK/NG 이력, 불량 유형·위치, 원인 후보, 판정 신뢰도, 재측정 조건, 리워크 사유, 설비·운영 상태',equipment:[['QMS 통합 OCS 시뮬레이션','1 set','다중 셀·로봇 협업 및 운영 정책 검토'],['역설계 SW / Process Simulation','각 1 set','형상 변환·디지털 모델·경로 검토'],['Opcenter / Amesim / Testlab','각 1 set','제조운영 연계·1D 모델·시험 분석'],['Heeds / Insight Hub','각 1 set','최적화·ML / 데이터 허브'],['데이터 수집·제조 데이터 팩토리·AI 분석/MLOps 서버','구성도·개요 표기','데이터 수집·통합·분석']],outputs:'검사 데이터 → QMS → 원인 후보 검토 → 재측정·리워크 권고 → 선행공정 환류 요청'}
];
const material=c=>new T.MeshStandardMaterial({color:c,roughness:.5,metalness:.25});
const metal=material(0x8ca2ad);
const gray=material(0x39444e),white=material(0xd7e2e7),blue=material(0x147cb9),black=material(0x14242d),gold=material(0xf4b546);
function box(g,w,h,d,x,y,z,m=white){const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function text(g,s,x,y,z){const e=document.createElement('div');e.className='equipment-label';e.textContent=s;const o=new CSS2DObject(e);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function darkMaterial(){return new T.MeshStandardMaterial({color:0x24313f});}
function group(root,x,z){const g=new T.Group();g.position.set(x,0,z);root.add(g);return g;}
function rack(g,x,z){box(g,.65,1.8,.65,x,.9,z,black);for(let y=.25;y<1.7;y+=.23){box(g,.55,.13,.04,x,y,z+.34,gray);box(g,.06,.04,.02,x+.2,y,z+.37,blue);}}
export function buildPDFCells(root,engine,plan){
 const large=buildScanBox(root,34.5,-14,'8160');const small=buildScanBox(root,42,-11.05,'5130');
 plan.scanBoxes={};
 for(const [id,station,name]of [['8160',large,'ATOS ScanBox 8160'],['5130',small,'ATOS ScanBox 5130']]){
  station.g.userData.zoneCell={zone:'insp',cellId:'SCAN',equipment:id};plan.scanBoxes[id]={g:station.g,name,robots:station.robots};
  station.g.traverse(o=>{if(!o.isCSS2DObject||!o.element.textContent.includes('ScanBox'))return;const el=o.element;el.classList.add('equipment-select');el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',name+' 선택');el.onclick=e=>{e.stopPropagation();plan.onEquipmentFocus?.('SCAN',id);};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};});
 }
 const xr=group(root,58,-14);xr.userData.zoneCell={zone:'insp',cellId:'SCAN'};box(xr,5,.3,3.8,0,.15,0,gray);box(xr,5,2.8,.2,0,1.7,-1.7);for(const x of [-2.4,2.4])box(xr,.2,2.8,3.4,x,1.7,0);box(xr,5,.2,3.8,0,3.2,0);box(xr,4,.8,1.8,0,.7,.9,black);const door=box(xr,3.7,2.3,.15,0,1.95,1.72,gray);const xs=new T.Group();xs.position.set(0,1.15,.5);xr.add(xs);const xl=text(xr,'인라인 X-ray · 대기',0,3.7,0);box(xr,.4,.5,.15,2.7,1.4,1.5,blue);text(xr,'차폐 · 안전 인터록 (모사)',0,.2,2.3);const source=box(xr,.35,.45,.35,-1.8,1.7,0,blue),detector=box(xr,.1,1.2,1.2,1.8,1.7,0,darkMaterial());const beam=box(xr,3.4,.025,.5,0,1.7,0,new T.MeshBasicMaterial({color:0xf1ba5b,transparent:true,opacity:.18,depthWrite:false}));beam.visible=false;
 // Cell 1 tooling and data acquisition, not an extra production station.
 const tooling=group(root,32.2,-27.7);box(tooling,1.2,.75,.8,0,.4,0,gray);for(const x of [-.4,0,.4])box(tooling,.17,.25,.3,x,.9,0,black);text(tooling,'그리퍼 · 툴체인저',0,1.3,0);plan.visuals.VIS.g.attach(tooling);rack(root,55.7,-29.5);
 const dg=group(root,34,3);box(dg,2.5,.12,2,0,.06,0,gray);box(dg,.25,1.1,2,-1.1,.6,0,white);text(dg,'4족 로봇 도킹 · 충전',0,1.6,0);
 const dd=group(root,44,3);box(dd,2.4,.3,2.4,0,.15,0,gray);box(dd,1.8,.08,1.8,0,.35,0,blue);text(dd,'드론 도킹 · 충전',0,1.1,0);
 // Sensor modules on the representative mobile robots.
 box(plan.dog,.25,.2,.3,0,1.15,0,black);box(plan.dog,.12,.12,.12,.78,.9,.12,blue);box(plan.dog,.12,.12,.12,.78,.9,-.12,gold);text(plan.dog,'RGB·Depth / LiDAR / 열화상·환경',0,1.85,0);
 box(plan.drone,.4,.3,.35,0,-.3,0,black);for(const x of [-.12,.12])box(plan.drone,.08,.08,.05,x,-.3,.2,blue);text(plan.drone,'원키트 RGB·Depth·열화상',0,1,0);
 const console=plan.visuals.JUDGE.g;for(const x of [-2.2,-1.1,1.1,2.2])rack(console,x,3);for(const x of [-1.7,0,1.7]){box(console,1.5,.1,.7,x,1.1,-.5,white);box(console,1.1,.6,.08,x,1.55,-.8,blue);}const dashboard=text(console,'QMS · 데이터 허브 · AI 분석',0,4.6,-3.7);
 text(console,'Process Simulation · Opcenter · Amesim',0,.3,4);text(console,'Testlab · Heeds · Insight Hub · 역설계',0,.3,4.5);
 // Separate control pedestals and protective fencing, following the PDF views.
 for(const [x,z]of [[47.6,-14.5],[61.5,-12.3],[40.1,-27],[42.8,-28.5]]){const g=group(root,x,z);box(g,.7,1.1,.6,0,.55,0,white);box(g,.5,.35,.05,0,1.25,.27,blue);}
 for(const [x,z,w]of []){const g=group(root,x,z);for(const dx of [-w/2,w/2]){box(g,.09,1.2,.09,dx,.6,0,gold);box(g,w/2-1.3,.8,.04,dx/2,.65,0,new T.MeshStandardMaterial({color:0x596e74,transparent:true,opacity:.28,wireframe:true}));}}
 buildReferenceLayout(root,plan);
 // Cell 3: charging cabinet and local status terminal. Cell 4: warehouse racks and dock.
 const gc=group(root,34,3);box(gc,.9,1.8,.6,-2,.9,0,white);box(gc,.55,.55,.05,-2,1.3,.33,blue);
 const dc=group(root,44,3);for(const x of [-2,2])box(dc,.15,2.8,.15,x,1.4,-1.7,gray);box(dc,4.2,.2,.7,0,2.8,-1.7,white);
 for(const x of [41,47]){const g=group(root,x,-2);for(const dx of [-1,1])box(g,.1,2.6,.1,dx,1.3,0,gold);for(const y of [.25,1.35,2.45]){box(g,2.2,.08,.9,0,y,0,gray);for(const dx of [-.5,.5])box(g,.7,.6,.65,dx,y+.35,0,white);}}
 const sensorCone=new T.Mesh(new T.ConeGeometry(1.5,4,24,1,true),new T.MeshBasicMaterial({color:0x63d9ff,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide}));sensorCone.position.y=-2.2;plan.drone.add(sensorCone);
 const monitor={ground:null,air:null,cycle:-1};plan.monitor=monitor;
 return {update(t){
  const c=engine.cells.SCAN;const busy=c.state==='BUSY'&&!c.fault;const p=c.progress;
  const stage=scanStage(c.item?.product,p,c.item?.recipe),scan=busy&&stage.scan,ut=busy&&stage.ut,xray=busy&&stage.xray;
  const restingKind=p>=.16&&p<.20?stage.steps[0]:stage.analysis?stage.steps.at(-1):null;
  const chosen=stage.box==='8160'?large:small;
  const phase=scan?(chosen===large?'ScanBox 8160 · ATOS 5X':'ScanBox 5130 · ATOS 5'):ut?'초음파/NDT':xray?'인라인 X-ray':null;
  const phaseKey=phase?c.item.id+':'+phase:null;
  if(phaseKey&&phaseKey!==plan.lastScanPhase)engine.emit('info',phase+' · 검사 모사',{obs:c.item.id,dec:'예시 레시피 단계 전환',act:xray?'차폐문 닫힘·인터록 상태를 모사':'제품 검사 데이터 수집을 모사'});
  plan.lastScanPhase=phaseKey;
  for(const m of [large,small]){m.sample.visible=busy&&(scan||restingKind==='scan')&&m===chosen;m.trace.update(null);let motion=null;if(m.sample.visible){replaceProduct(m.sample,c.item.product);motion=measurementMotion(c.item.product,scan?stage.scanProgress:stage.analysis?1:0,'feature',m.sample.position);m.trace.update(motion);plan.visuals.SCAN.motionText='ScanBox '+stage.box+' · '+'레시피 선택 검사'+' · 다중 시점 '+(motion.index+1)+'/'+motion.count+' · '+motion.phase;}m.update(motion);}
  plan.visuals.SCAN.sample.visible=busy&&(ut||restingKind==='ut');xs.visible=busy&&(xray||restingKind==='xray');if(xs.visible)replaceProduct(xs,c.item.product);beam.visible=false;let xphase='대기 · 반입구 개방';door.position.y=3.3;if(xray){replaceProduct(xs,c.item.product);const q=stage.xrayProgress;xs.position.z=q<.2?1.3*(1-smooth(q/.2)):q>.85?1.3*smooth((q-.85)/.15):0;door.position.y=q<.3?3.3-1.35*smooth((q-.2)/.1):q>.8?1.95+1.35*smooth((q-.8)/.05):1.95;beam.visible=q>=.35&&q<.75&&!c.processHold&&!engine.halted&&!c.fault;beam.position.z=beam.visible?-.6+1.2*(q-.35)/.4:0;xphase=q<.2?'검사 위치 이송':q<.35?'차폐문 닫힘 · 인터록 확인':q<.75?'정지 · 내부 투과 검사':q<.85?'조사 종료 · 개방':'반출';plan.visuals.SCAN.motionText='X-ray · '+xphase;}xl.element.textContent='인라인 X-ray · '+(c.processHold?'보류 · 조사 차단':busy&&!stage.steps.includes('xray')?'레시피 검사 제외':xphase);
  plan.scanStatus={box:stage.box,steps:stage.steps,scan,ut,xray,exposure:beam.visible};
  const cycle=Math.floor(t/60);if(t<(monitor.lastTime??0)){monitor.cycle=-1;monitor.ground=null;monitor.air=null;}monitor.lastTime=t;if(cycle>monitor.cycle&&t>5){monitor.cycle=cycle;const ground=['장애물 확인 요청','누유 의심 확인 요청','열 이상 확인 요청','출입·접근 확인 요청'][cycle%4],air=['적재 상태 확인 요청','AMR 이송 이상 확인 요청','상부 열 이상 확인 요청','사각지대 재촬영 요청'][cycle%4];monitor.ground={type:ground,x:plan.dog.position.x.toFixed(1),z:plan.dog.position.z.toFixed(1),time:t};monitor.air={type:air,x:plan.drone.position.x.toFixed(1),z:plan.drone.position.z.toFixed(1),time:t};for(const [name,event]of [['지상 순찰',monitor.ground],['상부 점검',monitor.air]])engine.emit('warn',name+' · '+event.type,{obs:'시나리오 이벤트 · 위치 ('+event.x+', '+event.z+')',dec:'위치 ('+event.x+', '+event.z+') · 통합 OCS 전달 (모사)',act:'현장 확인 요청 · 실제 센서 판정 아님'});}
  dashboard.element.textContent='통합 OCS · 품질 이력 '+engine.records.length+'건 · 순찰 이벤트 '+(Math.max(0,monitor.cycle+1)*2)+'건 (모사)';
 }};
}




// Spatial relationships from scenario v0.4 pp.1,3,5,7; illustrative clearances, not a dimensioned installation drawing.
function buildReferenceLayout(root,plan){
 const pale=material(0x91a3ad),stripe=material(0xe7bb55),mint=material(0x51cbb6);
 const area=(name,x,z,w,d,color)=>{const g=group(root,x,z);box(g,w,.02,d,0,.055,0,material(color));for(const dx of [-w/2,w/2])box(g,.045,.015,d,dx,.075,0,pale);for(const dz of [-d/2,d/2])box(g,w,.015,.045,0,.075,dz,pale);const l=text(g,name,0,.16,-d/2+.4);l.element.classList.add('subzone-label');return g;};
 for(const zone of INSPECTION_AREAS){
  const {name,x,z,w,d,color,cell}=zone,g=area(name,x,z,w,d,color);g.userData.zoneCell={zone:'insp',cellId:cell};
  const l=g.children.find(o=>o.isCSS2DObject);l.position.set(0,.2,name.startsWith('피처')?-d/2+.65:d/2-.55);l.element.textContent=name.split(' · ')[0];l.element.classList.add('inspection-zone-label');l.element.style.borderColor='#'+color.toString(16).padStart(6,'0');
  l.element.setAttribute('role','button');l.element.setAttribute('tabindex','0');l.element.setAttribute('aria-label',name+' 구역 보기');l.element.onclick=e=>{e.stopPropagation();plan.onEquipmentFocus?.(cell,name.includes('초음파')?'UT':null);};l.element.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();l.element.click();}};
 }
 const fixture=(x,z)=>{const g=group(root,x,z);box(g,1.5,.18,1.25,0,.17,0,gray);for(const dx of [-.55,.55])for(const dz of [-.45,.45]){box(g,.09,.25,.09,dx,.34,dz,metal);box(g,.14,.06,.14,dx,.49,dz,black);}return g;};
 const tools=(x,z)=>{const g=group(root,x,z);box(g,1.6,.08,.65,0,.85,0,metal);for(const dx of [-.65,.65])box(g,.08,.8,.5,dx,.4,0,gray);for(const dx of [-.5,0,.5]){box(g,.18,.15,.2,dx,.98,0,black);box(g,.05,.15,.05,dx,1.13,0,metal);}text(g,'교환 툴 스테이션',0,1.5,0);};
 // Reference images place auxiliary tools between paired stations, outside their loading apertures.
 tools(47.4,-25.7);tools(46.4,-10.3);tools(55,-10.4);
 fixture(34.5,-10.2);fixture(42,-10.2);fixture(58,-10.3);
 // Short loading rails point at each ScanBox opening; their ends stop before the AMR aisle z=-7.
 for(const [x,z]of [[34.5,-10.6],[42,-10.6]])for(const dx of [-.72,.72])box(root,.055,.045,1.1,x+dx,.11,z+.5,metal);
 const arrow=(x,z,color,reverse=false)=>{const g=group(root,x,z);g.rotation.y=reverse?Math.PI:0;box(g,.12,.015,.75,0,.10,0,color);const tri=new T.Mesh(new T.ConeGeometry(.23,.42,3),color);tri.rotation.x=-Math.PI/2;tri.position.set(0,.1,-.5);tri.scale.z=.1;g.add(tri);};
 for(const x of [34.2,43.2,51.2,58.5]){arrow(x,-22.8,mint);arrow(x+1,-22.8,stripe,true);}
 // Front approach stays open, with separate equipment-side tool and fixture storage.
 // Vision fixture supports are built with the upright product holder in plan.js.
 text(root,'반입·회수 통로',45,.11,-21);text(root,'반입·회수 통로',47,.11,-7);
}

export const INSPECTION_AREAS=[
 {name:'표면검사 · ABIS III',cell:'VIS',x:32.9,z:-27.6,w:4.2,d:8.8,color:0x216f69},
 {name:'피처검사 · AIMAX',cell:'VIS',x:37.2,z:-27.6,w:4.2,d:8.8,color:0x285e92},
 {name:'복합 정밀측정 · O-INSPECT',cell:'OINS',x:44.3,z:-27,w:7,d:8,color:0x55538a},
 {name:'대형 정밀측정 · MMZ G',cell:'MMZ',x:52.3,z:-27,w:8.8,d:8,color:0x655381},
 {name:'3D 검사 · ScanBox',cell:'SCAN',x:38.2,z:-14.2,w:15.2,d:11.6,color:0x256782},
 {name:'초음파 검사 · UT',cell:'SCAN',x:50.7,z:-13.7,w:8.8,d:10.8,color:0x86652d},
 {name:'X-ray 검사',cell:'SCAN',x:59.7,z:-13.7,w:8.8,d:10.8,color:0x814d54}
];
