import {UT_LENGTH,makeUltrasonicHead,buildUltrasonicStation} from './ultrasonic.js';
import {processPhase} from './process-v04.js';
import {scanStage,visionRange} from './product-policy.js';
import {makeHandlingTool} from './gripper.js';
import {prepareTransfer,applyTransfer} from './transfer.js';
import {buildOInspect863} from './o-inspect.js';
import {buildMMZG} from './mmz-g.js';
import {measurementMotion,makeInspectionTrace,smooth} from './inspection-motion.js';
import {makeABISIII} from './abis.js';
import {panelGeometry} from './render-quality.js';
import {buildPDFCells} from './pdf-cells.js';
import {makeRobotRig,makeProduct,replaceProduct} from './shapes.js';
import * as T from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

export const PLAN=[
 {id:'A-4-1',name:'초고성능 로봇형 검사 비전 시스템 Cell',short:'로봇형 비전검사',nodes:['VIS','OINS','MMZ'],x:44,z:-27,w:26,d:10,description:'ZEISS ABIS III 표면검사 · ZEISS AIMAX 피처검사 · ZEISS O-INSPECT 8/6/3 · ZEISS MMZ G 정밀측정'},
 {id:'A-4-2',name:'3D 스캔과 초음파 용접 검사 로봇 Cell',short:'3D·초음파 용접검사',nodes:['SCAN'],x:47,z:-14,w:34,d:11,description:'ATOS ScanBox 8160 / 5130 · ATOS 5X / 5 · 초음파/NDT · 인라인 X-ray · 차폐·안전 인터록'},
 {id:'A-4-3',name:'4족 보행 검사 및 안전 모니터링 로봇 Cell',short:'4족 보행·안전 모니터링',nodes:[],x:34,z:3,w:6,d:7,description:'공장 전역 지상 순찰 · RGB/Depth·LiDAR·열화상·환경 센서 · 장애물·누유·열·접근 이상 → OCS'},
 {id:'A-4-4',name:'원키트 비전 센서 기술 드론 세트 Cell',short:'원키트 비전 드론',nodes:[],x:44,z:3,w:6,d:7,description:'공장 상부·창고·물류 점검 · RGB/Depth/열화상 원키트 · 실내 위치인식 · 도킹/충전 · 적재·이송 이상 → OCS'},
 {id:'A-4-5',name:'AI정밀검사(QMS) 통합 OCS 시뮬레이션 Cell',short:'QMS 통합 OCS',nodes:['JUDGE'],x:57,z:2,w:11,d:12,description:'Cell 1~4 작업지시·장비상태·품질이력 통합 · OK/불확실/NG · 재검사 및 공정 환류 요청'}
];
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.38,metalness:.22});
const white=mat(0xe2e8eb),blue=mat(0x176ab4),dark=mat(0x243641),orange=mat(0xe29b22),metal=mat(0x8eabb3);
function box(g,w,h,d,x,y,z,m=white){const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function label(g,text,x,y,z){const e=document.createElement('div');e.className='equipment-label';e.textContent=text;const o=new CSS2DObject(e);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function segment(g,a,b,r,m){const dir=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());g.add(o);return o;}
// Manufacturer meshes and URDF joint transforms; no arm scaling or stretched links.
function robot(g,x,z,cobot,sensor){const root=new T.Group();root.position.set(x,cobot?1.15:.65,cobot?-2.6:z);if(cobot&&x>0)root.rotation.y=Math.PI;g.add(root);box(root,cobot?.38:.65,cobot?.4:.65,cobot?.38:.65,0,cobot?-.2:-.325,0,dark);const tag=label(root,cobot?'두산 H2515':'현대 HDR50-22',0,2.5,0);const carried=new T.Group();g.add(carried);return {root,tag,cobot,sensor,carried,station:g,homeX:x};}
function pose(r,target,model,t){
 if(r.model!==model){if(r.rig)r.root.remove(r.rig.root);r.rig=makeRobotRig(model);r.root.add(r.rig.root);r.model=model;const tip=r.rig.tcp;if(r.sensor==='ABIS'){r.abis=makeABISIII();r.tool=r.abis;tip.add(r.abis);}else if(r.cobot){r.tool=new T.Group();tip.add(r.tool);if(r.sensor==='3D / UT'){tip.remove(r.tool);r.tool=makeUltrasonicHead();tip.add(r.tool);}else {box(r.tool,.15,.12,.16,0,0,.08,blue);box(r.tool,.08,.06,.04,0,0,.18,dark);}}else {r.gripFrame=new T.Group();tip.add(r.gripFrame);r.handlingTool=makeHandlingTool();r.gripFrame.add(r.handlingTool.root);}}
 const world=r.station.localToWorld(target.clone().addScaledVector(r.motion?.normal||r.aimNormal||new T.Vector3(0,1,0),r.cobot?(r.sensor==='ABIS'?.264:r.sensor==='3D / UT'?UT_LENGTH:.20):0));if(r.poseT!==t||r.poseModel!==model||r.poseProduct!==r.product||(r.poseError??1)>.015){r.poseError=r.rig.solve(world,r.cobot?.012:.002);if(r.robustIK&&r.poseError>.02){let best=r.rig.joints.map(j=>j.angle),error=r.poseError;for(const yaw of [0,1.57,-1.57,3.14]){r.rig.setAngles(r.cobot?[yaw,.55,-1.15,0,.65,0]:[yaw,1.3,.4,0,.4,0]);const e=r.rig.solve(world,.002);if(e<error){error=e;best=r.rig.joints.map(j=>j.angle);}if(error<.004)break;}r.rig.setAngles(best);r.poseError=error;}r.poseT=t;r.poseModel=model;r.poseProduct=r.product;}r.carried.visible=false;if(r.tool){const q=r.rig.tcp.getWorldQuaternion(new T.Quaternion());const direction=(r.motion?.normal.clone()||r.aimNormal?.clone()||new T.Vector3(0,1,0)).negate();const down=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction);r.tool.quaternion.copy(q.invert().multiply(down));}r.tag.element.textContent=(r.cobot?'두산 ':'현대 ')+model+(r.sensor==='ABIS'?' · ZEISS ABIS III':'');
}

// Enclosed inspection workspaces; transparent panels expose the demonstration.
function booth(g,title){
 const shell=new T.Group();shell.name='reference-vision-booth';g.add(shell);
 const glass=new T.MeshStandardMaterial({color:0xc3d4da,transparent:true,opacity:.27,depthWrite:false,roughness:.65,side:T.DoubleSide});
 const left=-3.95,right=4.45,back=-4.9,front=1.5,h=3.35;
 for(const x of [left,right]){for(let i=0;i<=4;i++)box(shell,.10,h,.10,x,h/2,back+i*(front-back)/4,metal);for(let i=0;i<4;i++)box(shell,.045,h-.25,(front-back)/4-.1,x,h/2,back+(i+.5)*(front-back)/4,glass);for(const y of [.12,h])box(shell,.1,.08,front-back,x,y,(front+back)/2,metal);}
 for(let i=0;i<=6;i++)box(shell,.10,h,.10,left+i*(right-left)/6,h/2,back,metal);
 for(let i=0;i<6;i++)box(shell,(right-left)/6-.1,h-.25,.045,left+(i+.5)*(right-left)/6,h/2,back,glass);
 for(const y of [.12,h])box(shell,right-left,.08,.1,(left+right)/2,y,back,metal);
 for(const x of [left,right]){box(shell,.18,h+.12,.18,x,h/2,front,blue);box(shell,.11,1.8,.10,x+(x<0?.22:-.22),.9,front,orange);}
 box(shell,7.9,.025,6.1,.25,.08,-1.65,metal);
 for(const [caption,x]of [['ABIS 표면검사',-1.5],['AIMAX 피처검사',1.5]]){const cv=document.createElement('canvas');cv.width=768;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#e9edef';ctx.fillRect(0,0,768,128);ctx.fillStyle='#164c77';ctx.font='bold 66px Arial, sans-serif';ctx.textAlign='center';ctx.fillText(caption,384,87);const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(2,.34),new T.MeshBasicMaterial({map:texture}));sign.position.set(x,2.8,back+.065);shell.add(sign);}
 label(shell,title,0,h+.3,back);
}
function visionFixture(v){
 const g=v.g;
 box(g,1.25,.12,.9,0,.48,-1.1,metal);for(const x of [-.55,.55])for(const z of [-1.45,-.75])box(g,.12,.42,.12,x,.24,z,dark);
 v.fixturePosts=[];for(const x of [-.56,.56])for(const z of [-1.35,-.85]){const post=new T.Group();post.position.set(x,.54,z);g.add(post);box(post,.08,.90,.08,0,.45,0,metal);box(post,.17,.10,.16,0,.62,0,blue);box(post,.14,.07,.16,x<0?.10:-.10,.83,0,dark);v.fixturePosts.push(post);}
 v.sample=new T.Group();g.add(v.sample);v.referenceVision=true;
 label(g,'품목별 고정 지그',.15,.25,-.15);
 for(const [x,col,turn]of [[-.4,0x29beba,0],[.65,0xed9632,Math.PI]]){const arrow=new T.Group();arrow.position.set(x,.1,.95);arrow.rotation.y=turn;g.add(arrow);box(arrow,.13,.02,.7,0,0,0,mat(col));const tip=new T.Mesh(new T.ConeGeometry(.22,.35,3),mat(col));tip.rotation.x=-Math.PI/2;tip.position.z=-.5;tip.scale.z=.1;arrow.add(tip);}
 label(g,'투입 →    ← 회수',.1,.15,1.5);

}
function setVisionProduct(v,key){
 if(v.visionProduct===key)return;v.visionProduct=key;
 const b=new T.Box3().setFromObject(makeProduct(key)),upright=['door','hood','doortrim'].includes(key);
 v.sample.quaternion.setFromAxisAngle(new T.Vector3(1,0,0),upright?Math.PI/2:0);
 v.sample.position.set(0,upright?.62+(b.max.z-b.min.z)/2:.62,upright?-1.1:-.8);
 v.sampleHome=v.sample.position.clone();v.fixtureRotation=v.sample.quaternion.clone();
 v.fixturePosts.forEach(p=>p.scale.y=upright?Math.max(.55,(b.max.z-b.min.z)*.8):.35);
}

function route(g,points,color){const vectors=points.map(p=>new T.Vector3(...p));const curve=new T.CurvePath();for(let i=0;i<vectors.length;i++)curve.add(new T.LineCurve3(vectors[i],vectors[(i+1)%vectors.length]));const line=new T.Line(new T.BufferGeometry().setFromPoints([...vectors,vectors[0]]),new T.LineDashedMaterial({color,dashSize:.5,gapSize:.35,transparent:true,opacity:.55}));line.computeLineDistances();g.add(line);return curve;}
function patrol(object,path,t,speed){const u=(t*speed/path.getLength())%1;object.position.copy(path.getPointAt(u));const d=path.getTangentAt(u);object.rotation.y=Math.atan2(-d.z,d.x);}

export class PlanScene{
 constructor(engine,scene,onFocus){this.engine=engine;this.root=new T.Group();scene.add(this.root);this.lastReport=0;this.visuals={};this.labels=[];this.cobot='H2515';this.handler='HDR50-22';this.focus=null;
  for(const p of PLAN){const g=new T.Group();g.position.set(p.x,0,p.z);this.root.add(g);box(g,p.w,.035,p.d,0,.015,0,mat(p.id==='A-4-1'?0x23535a:p.id==='A-4-2'?0x284760:0x314c53));const l=label(g,p.short,0,.15,-p.d/2+.3);l.element.classList.add('plan-label');l.element.onclick=()=>onFocus(p.id);this.labels.push(l);}
  for(const c of engine.order){const g=new T.Group();g.position.set(c.def.x+(c.id==='VIS'?1.5:0),0,c.def.z-(c.id==='DOCK'?0:c.id==='JUDGE'?5.5:c.id==='VIS'?1.5:2.5));g.userData.zoneCell={zone:'insp',cellId:c.id};this.root.add(g);const v={g,robots:[]};this.visuals[c.id]=v;
   if(c.id==='VIS'){
    booth(g,'ABIS 표면검사 · AIMAX 피처검사');visionFixture(v);
    v.handler=robot(g,-1.25,.05,false);v.robots.push(v.handler);v.handler.robustIK=true;v.handler.restTarget=new T.Vector3(-1.5,1.7,.0);
    for(const [x,sensor]of [[-.82,'ABIS'],[.82,'AIMAX']]){const r=robot(g,x,-.9,true,sensor);r.root.position.z=-.8;box(g,.36,.75,.36,x,.375,-.8,dark);r.fixedBase=true;r.robustIK=true;r.aimNormal=new T.Vector3(0,0,1);r.restTarget=new T.Vector3(x*.5,1.9,-.35);v.robots.push(r);}
    v.trace=makeInspectionTrace(g);setVisionProduct(v,'door');
   }
   else if(c.id==='SCAN'){box(g,1.1,.75,1.5,0,.375,-1.5,dark);box(g,1.2,.12,1.7,0,.81,-1.5,metal);box(g,.36,.75,.36,-.85,.375,-1.5,dark);v.sample=new T.Group();v.sample.position.set(0,.88,-1.5);g.add(v.sample);v.handler=robot(g,0,.55,false);const utRobot=robot(g,-.85,-1.5,true,'3D / UT');utRobot.root.position.z=-1.5;utRobot.fixedBase=true;utRobot.robustIK=true;v.robots.push(v.handler,utRobot);v.ultrasonic=buildUltrasonicStation(g);v.trace=makeInspectionTrace(g,0xf5b34a);label(g,'접촉식 초음파 · 점용접 검사 예시',0,3.7,-1.5);}
   else if(c.id==='MMZ'){Object.assign(v,buildMMZG(g));v.sample=new T.Group();v.sample.position.set(0,.91,-1.5);g.add(v.sample);v.handler=robot(g,0,.55,false);v.robots.push(v.handler);v.trace=makeInspectionTrace(g);label(g,'ZEISS MMZ G · 후드/도어 대형 검사',0,5.4,-1.6);}
   else if(c.id==='OINS'){Object.assign(v,buildOInspect863(g));v.sample=new T.Group();v.sample.position.copy(v.sampleHome);g.add(v.sample);v.handler=robot(g,0,.55,false);v.robots.push(v.handler);v.trace=makeInspectionTrace(g);label(g,'ZEISS O-INSPECT 8/6/3 · 대형 제외 검사',0,3.4,-1.6);}
   else if(c.id==='DOCK'){box(g,2,.08,1.7,0,.04,0,metal);label(g,'공용 반입 · ID 확인',0,1.3,0);}
   else {box(g,8,.18,.8,0,.09,-3.7,dark);box(g,8,3.2,.18,0,2,-3.7,dark);for(const x of [-2.5,0,2.5])box(g,2.35,2.2,.08,x,2.15,-3.58,blue);label(g,'통합 관제월 · QMS / OCS',0,4,-3.7);}
  }
  // Schematic factory context, outside the inspection zone.
  for(const [name,x,z] of [['유연생산',10,-25],['정밀조립',22,-25],['적응가공',10,-9],['물류·창고',22,-9]]){const g=new T.Group();g.position.set(x,0,z);this.root.add(g);box(g,9,.04,11,0,0,0,mat(0x3b555a));label(g,name,0,.2,-5);for(const dz of [-2.5,2]){box(g,5,1.1,2.2,0,.55,dz,dark);box(g,4.7,.15,2,0,1.2,dz,metal);for(const dx of [-1.5,0,1.5])box(g,.75,.6,.9,dx,1.55,dz,white);}}
  label(this.root,'공장 전역 순찰 · 개념 배치',15,.2,8);
  this.groundPatrol=route(this.root,[[3,.12,6],[3,.12,-35],[28,.12,-35],[64,.12,-35],[64,.12,9],[28,.12,9],[28,.12,-17],[16,.12,-17],[16,.12,6]],0xf1bd5a);
  this.airPatrol=route(this.root,[[6,6,4],[6,6,-30],[24,6,-30],[60,6,-25],[60,6,-8],[44,6,5],[24,6,5],[24,6,-12],[12,6,-12]],0x74d9f2);
  this.dog=new T.Group();this.root.add(this.dog);box(this.dog,1.1,.4,.55,0,.8,0,orange);box(this.dog,.3,.3,.4,.65,.85,0,dark);this.legs=[];for(const x of [-.4,.4])for(const z of [-.3,.3]){const leg=new T.Group();leg.position.set(x,.7,z);this.dog.add(leg);box(leg,.11,.65,.11,0,-.3,0,metal);this.legs.push(leg);}label(this.dog,'4족 로봇 · 공장 순찰',0,1.5,0);
  this.drone=new T.Group();this.root.add(this.drone);box(this.drone,.6,.2,.5,0,0,0,white);this.rotors=[];for(const x of [-.6,.6])for(const z of [-.6,.6]){segment(this.drone,new T.Vector3(),new T.Vector3(x,0,z),.05,dark);const rotor=box(this.drone,.65,.025,.08,x,.12,z,metal);this.rotors.push(rotor);}box(this.drone,.16,.2,.16,0,-.2,0,blue);label(this.drone,'드론 · 공장 상공 점검',0,.7,0);this.pdfCells=buildPDFCells(this.root,engine,this);
 }
 update(){const t=this.engine.time;if(t<this.lastReport)this.lastReport=0;if(t-this.lastReport>=45){this.lastReport=t;this.engine.emit('info','공장 순찰 · 점검 데이터 전달',{obs:'4족 순찰·드론 비전 점검 (모사)',dec:'QMS·OCS 상태 통합',act:'설비 상태·점검 영상 이력 연결'});this.engine.spawnPacket(this.dog.position.clone().add(new T.Vector3(0,1,0)));this.engine.spawnPacket(this.drone.position.clone());}for(const c of this.engine.order){c.g.visible=false;const v=this.visuals[c.id],busy=c.state==='BUSY',p=c.visualProgress??c.progress;const on=busy&&p>=.16&&p<=.84;v.motionText=busy?(p<.16?'반입 · 지그 안착':p>.84?'검사 완료 · 반출':'지그 고정 · 기준 정렬'):'대기';v.trace?.update(null);if(v.referenceVision&&c.item)setVisionProduct(v,c.item.product);if(v.referenceVision&&c.aiDemo)v.sample.position.copy(v.sampleHome).x+=c.aiDemo.fixtureX||0;if(v.sample){if(c.item)replaceProduct(v.sample,c.item.product);v.sample.visible=on;if(c.occ?.pm)c.occ.pm.visible=!(busy&&p>.02&&p<.98);}
   const transfer=busy?prepareTransfer(c,v):null;if(v.handler&&!transfer)v.handler.transfer=null;
   for(const r of v.robots){r.tag.visible=!!(this.focus===c.id||PLAN.find(p=>p.id===this.focus)?.nodes.includes(c.id));let target=new T.Vector3(0,1.4,-1.5);if(r===v.handler){if(transfer)target.copy(transfer.target);else target.copy(r.restTarget||new T.Vector3(0,1.8,1.4));}else {target.copy(r.restTarget||new T.Vector3(r.homeX,1.7,-2.1));r.root.position.x=r.homeX;r.motion=null;const st=scanStage(c.item?.product,p,c.item?.recipe),vr=visionRange(c.item?.product,c.item?.recipe,r.sensor),range=r.sensor==='3D / UT'?(st.ut?[st.start,st.end,'ut','초음파 접합부']:null):vr?[...vr,r.sensor==='ABIS'?'surface':'feature',r.sensor==='ABIS'?'ABIS III 표면 영역':'AIMAX 피처 측정']:null;if(busy&&c.item&&range&&p>=range[0]&&p<range[1]){r.motion=measurementMotion(c.item.product,(p-range[0])/(range[1]-range[0]),range[2],v.referenceVision?new T.Vector3():v.sample.position);if(v.referenceVision){const m=r.motion,q=v.sample.quaternion;m.position.applyQuaternion(q).add(v.sample.position);m.point.applyQuaternion(q).add(v.sample.position);m.normal.applyQuaternion(q);m.sampleRotation=q.clone();m.sampleOffset=v.sample.position.clone();}if(c.aiDemo&&r.sensor==='ABIS'){const m=r.motion;if(c.aiDemo.sensorShift){m.position.x+=c.aiDemo.sensorShift;m.normal.copy(m.position).sub(m.point).normalize();}if(c.aiDemo.acquire!==undefined)m.acquiring=!!c.aiDemo.acquire;}const localQ=(p-range[0])/(range[1]-range[0]),blend=smooth(Math.min(localQ/.06,(1-localQ)/.06));if(!r.fixedBase)r.root.position.x=T.MathUtils.lerp(r.homeX,r.motion.position.x+r.motion.normal.x*(r.sensor==='ABIS'?.264:.2),blend);target.lerp(r.motion.position,blend);if(blend<1||(r.sensor==='3D / UT'&&(c.fault||c.processHold||this.engine.halted)))r.motion.acquiring=false;v.trace.update(r.motion);v.motionText=range[3]+' '+(r.motion.index+1)+'/'+r.motion.count+' · '+r.motion.phase;}}r.product=c.item?.product;r.carry=r===v.handler&&busy&&((p>.02&&p<.16)||(p>.84&&p<.98));pose(r,target,r.cobot?this.cobot:this.handler,t);}
   if(v.bridge||v.updatePose){let pos=new T.Vector3(0,v.updatePose?1.45:2.0,-1.6),measure=null,isOptical=false;if(busy&&c.item&&p>=.2&&p<.76){const optical=c.id==='OINS'&&p<.46;const q=optical?(p-.2)/.26:c.id==='OINS'?(p-.46)/.30:(p-.2)/.56;const m=measurementMotion(c.item.product,q,optical?'feature':'touch',v.sampleHome||v.sample.position);measure=m;isOptical=optical;pos.copy(m.position);if(!optical)pos.copy(m.position).addScaledVector(m.normal,-.018);v.trace.update(m);v.motionText=(optical?'광학 측정':'접촉 측정')+' '+(m.index+1)+'/'+m.count+' · '+m.phase;}if(v.updatePose){const shift=v.updatePose(pos,isOptical);v.sample.position.copy(v.sampleHome);v.sample.position.z+=shift;if(measure){measure.position.z+=shift;measure.point.z+=shift;v.trace.update(measure);}}else{v.bridge.position.z=pos.z+1.6;v.probe.position.x=pos.x;v.stylus.position.set(0,pos.y,-1.6);const len=Math.max(.1,(v.headHeight||2.9)-pos.y-.2);v.ram.scale.y=len;v.ram.position.y=pos.y+.2+len/2;}}
   if(v.ultrasonic){const r=v.robots.find(r=>r.sensor==='3D / UT');v.ultrasonic.update(c.item?.product,r.motion,v.sample.position,busy&&!!r.motion,r.tool,!!(c.fault||c.processHold||this.engine.halted));}
   if(transfer)applyTransfer(c,v);
   if(c.fault)v.motionText='설비 이상 · 검사 중지';
  }
  patrol(this.dog,this.groundPatrol,t,.8);this.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*3+i*Math.PI)*.4);patrol(this.drone,this.airPatrol,t,1.3);this.rotors.forEach(r=>r.rotation.y=t*22);this.pdfCells.update(t);for(const c of this.engine.order){const phase=processPhase(c);if(phase)this.visuals[c.id].motionText=phase;}
 }
 setLabels(on){this.root.traverse(o=>{if(o.isCSS2DObject)o.visible=on;});}
}





