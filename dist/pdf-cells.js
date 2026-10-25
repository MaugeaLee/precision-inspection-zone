import {measurementMotion,makeInspectionTrace,smooth} from './inspection-motion.js';
import {panelGeometry} from './render-quality.js';
import * as T from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {replaceProduct} from './shapes.js';

export const PDF_CELLS=[
 {title:'초고성능 로봇형 검사 비전 시스템',pages:'3 · 9',targets:'차체·내외장·조립부품·가공품·패널',checks:'표면결함, 홀·스터드·팜너트 위치, 치수편차, 조립상태, 기준면·기하공차',equipment:[['ABIS 2IR / ABIS III','2 set','표면결함 검사; 화면에는 사용자 지정 ABIS III 적용'],['AIMAX','1 set','피처 위치·치수 검사'],['O-INSPECT 8/6/3 Duo / CMM','1 set','접촉·광학 정밀측정'],['문형 3차원 측정기','1 set','사용자 지정 ZEISS MMZ G 적용'],['협동로봇 / 산업용 로봇','2대 / 1대','검사·제품 이적재'],['카메라·조명 / 그리퍼·툴체인저 / 분석 서버','각 1식','재촬영·파지·측정 데이터 통합']],outputs:'표면·피처·CMM·문형측정 데이터 → 품질판정 → 통합 OCS'},
 {title:'3D 스캔과 초음파 용접 검사 로봇',pages:'4 · 10',targets:'BIW·대형 패널·도어·후드·접합부·하우징',checks:'CAD 편차, 갭·단차, 비드·실러 형상, 용입·융착 불량, 내부균열·기공·미접합·이물',equipment:[['ATOS ScanBox 8160 + ATOS 5X plusbox','1 set','대형 BIW·패널 3D 스캔'],['ATOS ScanBox 5130 + ATOS 5 plusbox','1 set','중소형 패널 스캔'],['초음파/NDT·프로브 추종장치','1 set','접합부 내부 결함'],['공정 인라인 X-ray','1 set','내부 결함 비파괴 검사'],['협동로봇 / 산업용 로봇','1대 / 1대','UT 추종·핸들링'],['그리퍼 3종·툴체인저 / 차폐·인터록 / 분석 서버','각 1식','파지·접근 제어·융합 판정']],outputs:'3D·UT·X-ray 데이터 융합 → 통합 OCS. 검사 적용 여부·순서는 제품별 레시피 검토 대상'},
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
function scanner(root,x,z,w,name){const g=group(root,x,z);g.userData.zoneCell={zone:'insp',cellId:'SCAN'};box(g,w,.15,3.6,0,.075,0,gray);box(g,w,3.5,.18,0,1.75,-1.7,gray);for(const side of [-1,1])box(g,.2,3.5,3.6,side*w/2,1.75,0,gray);box(g,w,.3,3.6,0,3.5,0,gray);box(g,w-.8,.7,2,0,.5,0,black);const sample=new T.Group();sample.position.y=.9;g.add(sample);const sensor=new T.Group();g.add(sensor);box(sensor,.38,.18,.18,0,0,0,blue);for(const x of [-.13,.13])box(sensor,.07,.07,.02,x,0,.10,black);box(sensor,.06,.06,.02,0,0,.10,white);const rail=box(g,w-.5,.1,.12,0,3.15,0,metal);const mast=box(g,.08,1,.08,0,2.6,0,gray);const trace=makeInspectionTrace(g,0x64caff);const lamp=box(g,.15,.2,.15,w/2-.2,3.85,1.5,gold);text(g,name,0,4.2,0);text(g,'형상 · CAD 편차',0,.25,1.9);for(const x of [-w/2+.25,w/2-.25])box(g,.1,.1,3,x,3.15,0,metal);return {g,sample,sensor,lamp,mast,trace,rail};}
export function buildPDFCells(root,engine,plan){
 const large=scanner(root,34,-14,5.5,'ATOS ScanBox 8160 · 5X');const small=scanner(root,42,-14,4,'ATOS ScanBox 5130 · 5');
 const xr=group(root,60,-14);xr.userData.zoneCell={zone:'insp',cellId:'SCAN'};box(xr,5,.3,3.8,0,.15,0,gray);box(xr,5,2.8,.2,0,1.7,-1.7);for(const x of [-2.4,2.4])box(xr,.2,2.8,3.4,x,1.7,0);box(xr,5,.2,3.8,0,3.2,0);box(xr,4,.8,1.8,0,.7,.9,black);const door=box(xr,3.7,2.3,.15,0,1.95,1.72,gray);const xs=new T.Group();xs.position.set(0,1.15,.5);xr.add(xs);const xl=text(xr,'인라인 X-ray · 대기',0,3.7,0);box(xr,.4,.5,.15,2.7,1.4,1.5,blue);text(xr,'차폐 · 안전 인터록 (모사)',0,.2,2.3);const source=box(xr,.35,.45,.35,-1.8,1.7,0,blue),detector=box(xr,.1,1.2,1.2,1.8,1.7,0,darkMaterial());const beam=box(xr,3.4,.025,.5,0,1.7,0,new T.MeshBasicMaterial({color:0xf1ba5b,transparent:true,opacity:.18,depthWrite:false}));beam.visible=false;
 // Cell 1 tooling and data acquisition, not an extra production station.
 const tooling=group(root,39.5,-28);box(tooling,1.2,.75,.8,0,.4,0,gray);for(const x of [-.4,0,.4])box(tooling,.17,.25,.3,x,.9,0,black);text(tooling,'그리퍼 · 툴체인저',0,1.3,0);rack(root,56,-29);
 const dg=group(root,34,3);box(dg,2.5,.12,2,0,.06,0,gray);box(dg,.25,1.1,2,-1.1,.6,0,white);text(dg,'4족 로봇 도킹 · 충전',0,1.6,0);
 const dd=group(root,44,3);box(dd,2.4,.3,2.4,0,.15,0,gray);box(dd,1.8,.08,1.8,0,.35,0,blue);text(dd,'드론 도킹 · 충전',0,1.1,0);
 // Sensor modules on the representative mobile robots.
 box(plan.dog,.25,.2,.3,0,1.15,0,black);box(plan.dog,.12,.12,.12,.78,.9,.12,blue);box(plan.dog,.12,.12,.12,.78,.9,-.12,gold);text(plan.dog,'RGB·Depth / LiDAR / 열화상·환경',0,1.85,0);
 box(plan.drone,.4,.3,.35,0,-.3,0,black);for(const x of [-.12,.12])box(plan.drone,.08,.08,.05,x,-.3,.2,blue);text(plan.drone,'원키트 RGB·Depth·열화상',0,1,0);
 const console=plan.visuals.JUDGE.g;for(const x of [-2.2,-1.1,1.1,2.2])rack(console,x,3);for(const x of [-1.7,0,1.7]){box(console,1.5,.1,.7,x,1.1,-.5,white);box(console,1.1,.6,.08,x,1.55,-.8,blue);}const dashboard=text(console,'QMS · 데이터 허브 · AI 분석',0,4.6,-3.7);
 text(console,'Process Simulation · Opcenter · Amesim',0,.3,4);text(console,'Testlab · Heeds · Insight Hub · 역설계',0,.3,4.5);
 // Separate control pedestals and protective fencing, following the PDF views.
 for(const [x,z]of [[31,-10],[47.5,-10],[63.5,-10]]){const g=group(root,x,z);box(g,.7,1.1,.6,0,.55,0,white);box(g,.5,.35,.05,0,1.25,.27,blue);}
 for(const [x,z,w]of [[35,-22,7],[34,-11.5,6],[42,-11.5,5]]){const g=group(root,x,z);for(const dx of [-w/2,w/2]){box(g,.09,1.2,.09,dx,.6,0,gold);box(g,w/2-1.3,.8,.04,dx/2,.65,0,new T.MeshStandardMaterial({color:0x596e74,transparent:true,opacity:.28,wireframe:true}));}}
 // Cell 3: charging cabinet and local status terminal. Cell 4: warehouse racks and dock.
 const gc=group(root,34,3);box(gc,.9,1.8,.6,-2,.9,0,white);box(gc,.55,.55,.05,-2,1.3,.33,blue);
 const dc=group(root,44,3);for(const x of [-2,2])box(dc,.15,2.8,.15,x,1.4,-1.7,gray);box(dc,4.2,.2,.7,0,2.8,-1.7,white);
 for(const x of [41,47]){const g=group(root,x,-2);for(const dx of [-1,1])box(g,.1,2.6,.1,dx,1.3,0,gold);for(const y of [.25,1.35,2.45]){box(g,2.2,.08,.9,0,y,0,gray);for(const dx of [-.5,.5])box(g,.7,.6,.65,dx,y+.35,0,white);}}
 const sensorCone=new T.Mesh(new T.ConeGeometry(1.5,4,24,1,true),new T.MeshBasicMaterial({color:0x63d9ff,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide}));sensorCone.position.y=-2.2;plan.drone.add(sensorCone);
 const monitor={ground:null,air:null,cycle:-1};plan.monitor=monitor;
 return {update(t){
  const c=engine.cells.SCAN;const busy=c.state==='BUSY'&&!c.fault;const p=c.progress;
  const scan=busy&&p>.16&&p<.4,ut=busy&&p>=.4&&p<.65,xray=busy&&p>=.65&&p<.84;
  const chosen=c.item?.product==='hood'?large:small;
  const phase=scan?(chosen===large?'ScanBox 8160 · ATOS 5X':'ScanBox 5130 · ATOS 5'):ut?'초음파/NDT':xray?'인라인 X-ray':null;
  const phaseKey=phase?c.item.id+':'+phase:null;
  if(phaseKey&&phaseKey!==plan.lastScanPhase)engine.emit('info',phase+' · 검사 모사',{obs:c.item.id,dec:'예시 레시피 단계 전환',act:xray?'차폐문 닫힘·인터록 상태를 모사':'제품 검사 데이터 수집을 모사'});
  plan.lastScanPhase=phaseKey;
  for(const m of [large,small]){m.sample.visible=scan&&m===chosen;m.trace.update(null);if(m.sample.visible){replaceProduct(m.sample,c.item.product);const motion=measurementMotion(c.item.product,(p-.16)/.24,'feature',m.sample.position);m.sensor.position.copy(motion.position).add(new T.Vector3(0,.18,0));m.sensor.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),motion.normal.clone().negate());m.trace.update(motion);plan.visuals.SCAN.motionText='ATOS 다중 시점 '+(motion.index+1)+'/'+motion.count+' · '+motion.phase;}else m.sensor.position.set(0,2.5,0);m.rail.position.z=m.sensor.position.z;m.mast.position.set(m.sensor.position.x,(3.15+m.sensor.position.y)/2,m.sensor.position.z);m.mast.scale.y=Math.max(.1,3.15-m.sensor.position.y);m.lamp.material=m.sample.visible?blue:gold;}
  plan.visuals.SCAN.sample.visible=ut;xs.visible=xray;beam.visible=false;let xphase='대기 · 반입구 개방';door.position.y=3.3;if(xray){replaceProduct(xs,c.item.product);const q=(p-.65)/.19;xs.position.z=q<.2?1.3*(1-smooth(q/.2)):q>.85?1.3*smooth((q-.85)/.15):0;door.position.y=q<.3?3.3-1.35*smooth((q-.2)/.1):q>.8?1.95+1.35*smooth((q-.8)/.05):1.95;beam.visible=q>=.35&&q<.75;beam.position.z=beam.visible?-.6+1.2*(q-.35)/.4:0;xphase=q<.2?'검사 위치 이송':q<.35?'차폐문 닫힘 · 인터록 확인':q<.75?'정지 · 내부 투과 검사':q<.85?'조사 종료 · 개방':'반출';plan.visuals.SCAN.motionText='X-ray · '+xphase;}xl.element.textContent='인라인 X-ray · '+xphase;
  const cycle=Math.floor(t/60);if(t<(monitor.lastTime??0)){monitor.cycle=-1;monitor.ground=null;monitor.air=null;}monitor.lastTime=t;if(cycle>monitor.cycle&&t>5){monitor.cycle=cycle;const ground=['장애물 확인 요청','누유 의심 확인 요청','열 이상 확인 요청','출입·접근 확인 요청'][cycle%4],air=['적재 상태 확인 요청','AMR 이송 이상 확인 요청','상부 열 이상 확인 요청','사각지대 재촬영 요청'][cycle%4];monitor.ground={type:ground,x:plan.dog.position.x.toFixed(1),z:plan.dog.position.z.toFixed(1),time:t};monitor.air={type:air,x:plan.drone.position.x.toFixed(1),z:plan.drone.position.z.toFixed(1),time:t};for(const [name,event]of [['지상 순찰',monitor.ground],['상부 점검',monitor.air]])engine.emit('warn',name+' · '+event.type,{obs:'시나리오 이벤트 · 위치 ('+event.x+', '+event.z+')',dec:'위치 ('+event.x+', '+event.z+') · 통합 OCS 전달 (모사)',act:'현장 확인 요청 · 실제 센서 판정 아님'});}
  dashboard.element.textContent='통합 OCS · 품질 이력 '+engine.records.length+'건 · 순찰 이벤트 '+(Math.max(0,monitor.cycle+1)*2)+'건 (모사)';
 }};
}

