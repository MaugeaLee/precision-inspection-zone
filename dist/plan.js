import {panelGeometry} from './render-quality.js';
import {buildPDFCells} from './pdf-cells.js';
import {makeRobotRig,makeProduct,replaceProduct} from './shapes.js';
import * as T from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

export const PLAN=[
 {id:'A-4-1',name:'초고성능 로봇형 검사 비전 시스템 Cell',short:'로봇형 비전검사',nodes:['VIS','OINS','MMZ'],x:35,z:-17,w:7,d:24,description:'ZEISS ABIS III 표면검사 · ZEISS AIMAX 피처검사 · ZEISS O-INSPECT 8/6/3 · ZEISS MMZ M 정밀측정'},
 {id:'A-4-2',name:'3D 스캔과 초음파 용접 검사 로봇 Cell',short:'3D·초음파 용접검사',nodes:['SCAN'],x:51,z:-20,w:23,d:20,description:'ATOS ScanBox 8160 / 5130 · ATOS 5X / 5 · 초음파/NDT · 인라인 X-ray · 차폐·안전 인터록'},
 {id:'A-4-3',name:'4족 보행 검사 및 안전 모니터링 로봇 Cell',short:'4족 보행·안전 모니터링',nodes:[],x:34,z:3,w:6,d:7,description:'공장 전역 지상 순찰 · RGB/Depth·LiDAR·열화상·환경 센서 · 장애물·누유·열·접근 이상 → OCS'},
 {id:'A-4-4',name:'원키트 비전 센서 기술 드론 세트 Cell',short:'원키트 비전 드론',nodes:[],x:44,z:3,w:6,d:7,description:'공장 상부·창고·물류 점검 · RGB/Depth/열화상 원키트 · 실내 위치인식 · 도킹/충전 · 적재·이송 이상 → OCS'},
 {id:'A-4-5',name:'AI정밀검사(QMS) 통합 OCS 시뮬레이션 Cell',short:'QMS 통합 OCS',nodes:['JUDGE'],x:44,z:-6,w:6,d:8,description:'Cell 1~4 작업지시·장비상태·품질이력 통합 · OK/불확실/NG · 재검사 및 공정 환류 요청'}
];
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.38,metalness:.22});
const white=mat(0xe2e8eb),blue=mat(0x176ab4),dark=mat(0x243641),orange=mat(0xe29b22),metal=mat(0x8eabb3);
function box(g,w,h,d,x,y,z,m=white){const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function label(g,text,x,y,z){const e=document.createElement('div');e.className='equipment-label';e.textContent=text;const o=new CSS2DObject(e);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function segment(g,a,b,r,m){const dir=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());g.add(o);return o;}
// Manufacturer meshes and URDF joint transforms; no arm scaling or stretched links.
function robot(g,x,z,cobot,sensor){const root=new T.Group();root.position.set(x,cobot?.4:0,z);g.add(root);if(cobot)box(root,.38,.4,.38,0,-.2,0,dark);const tag=label(root,cobot?'두산 H2515':'현대 HDR50-22',0,2.5,0);const carried=new T.Group();g.add(carried);return {root,tag,cobot,sensor,carried,station:g};}
function pose(r,target,model,t){
 if(r.model!==model){if(r.rig)r.root.remove(r.rig.root);r.rig=makeRobotRig(model);r.root.add(r.rig.root);r.model=model;const tip=r.rig.tcp;box(tip,r.cobot?.18:.24,.09,.12,0,0,0,r.cobot?blue:dark);if(!r.cobot)for(const x of [-.12,.12])box(tip,.035,.12,.05,x,0,.06,metal);}
 const world=r.station.localToWorld(target.clone());if(r.poseT!==t||r.poseModel!==model){r.rig.solve(world);r.poseT=t;r.poseModel=model;}r.carried.position.copy(r.station.worldToLocal(r.rig.tcp.getWorldPosition(new T.Vector3()))).add(new T.Vector3(0,-.18,0));r.carried.visible=!!r.carry;if(r.carry&&r.product)replaceProduct(r.carried,r.product);r.tag.element.textContent=(r.cobot?'두산 ':'현대 ')+model;
}

// Enclosed inspection workspaces; transparent panels expose the demonstration.
function booth(g,title){
 const glass=new T.MeshStandardMaterial({color:0x9ed8e2,transparent:true,opacity:.16,depthWrite:false,roughness:.25,side:T.DoubleSide});
 for(const x of [-2.65,2.65])for(const z of [-3.4,.5])box(g,.14,3.4,.14,x,1.7,z,dark);
 for(const z of [-3.4,.5])box(g,5.4,.18,.18,0,3.35,z,dark);
 for(const x of [-2.65,2.65]){box(g,.18,.18,4,x,3.35,-1.45,dark);box(g,.06,2.9,3.8,x,1.5,-1.45,glass);box(g,.1,.45,3.8,x,.25,-1.45,white);}
 box(g,5.2,2.9,.06,0,1.5,-3.4,glass);box(g,5.3,.45,.1,0,.25,-3.4,white);
 // Central front opening for loading; side guards keep the handling robot inside.
 for(const x of [-2.1,2.1])box(g,1,2.9,.06,x,1.5,.5,glass);
 box(g,2.8,.08,.1,0,3.1,.5,blue);
 for(const x of [-1.65,1.65])box(g,.09,.07,3.4,x,3.2,-1.45,new T.MeshBasicMaterial({color:0xc2f7ff}));
 box(g,.4,.65,.12,2.88,1.15,.5,blue);label(g,title,0,3.8,-1.45);
}
function route(g,points,color){const vectors=points.map(p=>new T.Vector3(...p));const curve=new T.CurvePath();for(let i=0;i<vectors.length;i++)curve.add(new T.LineCurve3(vectors[i],vectors[(i+1)%vectors.length]));const line=new T.Line(new T.BufferGeometry().setFromPoints([...vectors,vectors[0]]),new T.LineDashedMaterial({color,dashSize:.5,gapSize:.35,transparent:true,opacity:.55}));line.computeLineDistances();g.add(line);return curve;}
function patrol(object,path,t,speed){const u=(t*speed/path.getLength())%1;object.position.copy(path.getPointAt(u));const d=path.getTangentAt(u);object.rotation.y=Math.atan2(-d.z,d.x);}

export class PlanScene{
 constructor(engine,scene,onFocus){this.engine=engine;this.root=new T.Group();scene.add(this.root);this.lastReport=0;this.visuals={};this.labels=[];this.cobot='H2515';this.handler='HDR50-22';this.focus=null;
  for(const p of PLAN){const g=new T.Group();g.position.set(p.x,0,p.z);this.root.add(g);box(g,p.w,.035,p.d,0,.015,0,mat(p.id==='A-4-1'?0x23535a:p.id==='A-4-2'?0x284760:0x314c53));const l=label(g,p.short,0,.15,-p.d/2+.3);l.element.classList.add('plan-label');l.element.onclick=()=>onFocus(p.id);this.labels.push(l);}
  for(const c of engine.order){const g=new T.Group();g.position.set(c.def.x,0,c.def.z);g.userData.zoneCell={zone:'insp',cellId:c.id};this.root.add(g);const v={g,robots:[]};this.visuals[c.id]=v;
   if(c.id==='VIS'||c.id==='SCAN'){booth(g,c.id==='VIS'?'표면·피처 비전검사 부스':'초음파/NDT 검사 부스');box(g,1.7,.75,1.5,0,.375,-1.5,dark);box(g,1.9,.12,1.7,0,.81,-1.5,metal);v.sample=new T.Group();v.sample.position.set(0,.88,-1.5);g.add(v.sample);v.handler=robot(g,-1.3,-.4,false);v.robots.push(v.handler);if(c.id==='VIS'){v.robots.push(robot(g,-.8,-2.15,true,'ABIS'),robot(g,.8,-2.15,true,'AIMAX'));label(g,'ZEISS ABIS III · AIMAX',0,.4,.65);}else{v.robots.push(robot(g,.8,-2.15,true,'3D / UT'));label(g,'접합부 · 초음파 프로브 추종',0,.4,.65);}}
   else if(c.id==='OINS'||c.id==='MMZ'){const big=c.id==='MMZ',w=big?3:2;box(g,w,.75,2.2,0,.375,-1.6,dark);box(g,w,.15,2.2,0,.825,-1.6,metal);v.bridge=new T.Group();g.add(v.bridge);for(const x of [-w/2+.12,w/2-.12])box(v.bridge,.23,2,.3,x,1.8,-2.1);box(v.bridge,w,.3,.4,0,2.8,-2.1);v.probe=new T.Group();v.bridge.add(v.probe);box(v.probe,.12,1.1,.12,0,2,-2.1,metal);box(v.probe,.05,.22,.05,0,1.35,-2.1,orange);v.sample=new T.Group();v.sample.position.set(0,.91,-1.5);g.add(v.sample);v.handler=robot(g,-1.3,-.4,false);v.robots.push(v.handler);label(g,big?'ZEISS MMZ M':'ZEISS O-INSPECT 8/6/3',0,3.3,-1.7);}
   else if(c.id==='DOCK'){box(g,2,.08,1.7,0,.04,0,metal);label(g,'공용 반입 · ID 확인',0,1.3,0);}
   else {box(g,2.8,1,.7,0,.5,-1,dark);box(g,2.4,1.3,.12,0,1.6,-1,blue);label(g,'QMS · OCS / 판정·환류',0,2.6,-1);}
  }
  // Schematic factory context, outside the inspection zone.
  for(const [name,x,z] of [['유연생산',10,-25],['정밀조립',22,-25],['적응가공',10,-9],['물류·창고',22,-9]]){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);box(g,9,.04,11,0,0,0,mat(0x3b555a));label(g,name,0,.2,-5);for(const dz of [-2.5,2]){box(g,5,1.1,2.2,0,.55,dz,dark);box(g,4.7,.15,2,0,1.2,dz,metal);for(const dx of [-1.5,0,1.5])box(g,.75,.6,.9,dx,1.55,dz,white);}}
  label(this.root,'공장 전역 순찰 · 개념 배치',15,.2,8);
  this.groundPatrol=route(this.root,[[3,.12,6],[3,.12,-35],[28,.12,-35],[64,.12,-35],[64,.12,9],[28,.12,9],[28,.12,-17],[16,.12,-17],[16,.12,6]],0xf1bd5a);
  this.airPatrol=route(this.root,[[6,6,4],[6,6,-30],[24,6,-30],[60,6,-25],[60,6,-8],[44,6,5],[24,6,5],[24,6,-12],[12,6,-12]],0x74d9f2);
  this.dog=new T.Group();this.root.add(this.dog);box(this.dog,1.1,.4,.55,0,.8,0,orange);box(this.dog,.3,.3,.4,.65,.85,0,dark);this.legs=[];for(const x of [-.4,.4])for(const z of [-.3,.3]){const leg=new T.Group();leg.position.set(x,.7,z);this.dog.add(leg);box(leg,.11,.65,.11,0,-.3,0,metal);this.legs.push(leg);}label(this.dog,'4족 로봇 · 공장 순찰',0,1.5,0);
  this.drone=new T.Group();this.root.add(this.drone);box(this.drone,.6,.2,.5,0,0,0,white);this.rotors=[];for(const x of [-.6,.6])for(const z of [-.6,.6]){segment(this.drone,new T.Vector3(),new T.Vector3(x,0,z),.05,dark);const rotor=box(this.drone,.65,.025,.08,x,.12,z,metal);this.rotors.push(rotor);}box(this.drone,.16,.2,.16,0,-.2,0,blue);label(this.drone,'드론 · 공장 상공 점검',0,.7,0);this.pdfCells=buildPDFCells(this.root,engine,this);
 }
 update(){const t=this.engine.time;if(t<this.lastReport)this.lastReport=0;if(t-this.lastReport>=45){this.lastReport=t;this.engine.emit('info','공장 순찰 · 점검 데이터 전달',{obs:'4족 순찰·드론 비전 점검 (모사)',dec:'QMS·OCS 상태 통합',act:'설비 상태·점검 영상 이력 연결'});this.engine.spawnPacket(this.dog.position.clone().add(new T.Vector3(0,1,0)));this.engine.spawnPacket(this.drone.position.clone());}for(const c of this.engine.order){c.g.visible=false;const v=this.visuals[c.id],busy=c.state==='BUSY'&&!c.fault,p=c.progress;const on=busy&&p>.16&&p<.84;if(v.sample){if(c.item)replaceProduct(v.sample,c.item.product);v.sample.visible=on;if(c.occ?.pm)c.occ.pm.visible=!(busy&&p>.02&&p<.98);}
   for(const r of v.robots){r.tag.visible=!!(this.focus===c.id||PLAN.find(p=>p.id===this.focus)?.nodes.includes(c.id));let target=new T.Vector3(0,1.4,-1.5);if(r===v.handler){if(busy&&(p<.16||p>.84)){const q=p<.16?p/.16:(1-p)/.16;target.set(0,1.1+Math.sin(q*Math.PI)*.8,-1.5*q);}else target.set(-1.2,1.6,-.5);}else if(on){target.set((r.root.position.x<0?-.25:.25)+Math.sin(t*2)*.12,1.3,-1.5+Math.cos(t*2)*.12);}else target.set(r.root.position.x*.6,1.4,-1.7);r.product=c.item?.product;r.carry=r===v.handler&&busy&&((p>.02&&p<.16)||(p>.84&&p<.98));pose(r,target,r.cobot?this.cobot:this.handler,t);}
   if(v.bridge){v.bridge.position.z=on?Math.sin(t)*.3:0;v.probe.position.x=on?Math.sin(t*.8)*.5:0;}
  }
  patrol(this.dog,this.groundPatrol,t,.8);this.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*3+i*Math.PI)*.4);patrol(this.drone,this.airPatrol,t,1.3);this.rotors.forEach(r=>r.rotation.y=t*22);this.pdfCells.update(t);
 }
 setLabels(on){this.root.traverse(o=>{if(o.isCSS2DObject)o.visible=on;});}
}
