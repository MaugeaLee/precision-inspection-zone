import * as T from 'three';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

export const PLAN=[
 {id:'A-4-1',name:'초고성능 로봇형 검사 비전 시스템 Cell',short:'로봇형 비전검사',nodes:['VIS','OINS'],x:35,z:-20,w:7,d:16,description:'ZEISS ABIS III 표면검사 · ZEISS AIMAX 피처검사 · ZEISS O-INSPECT 8/6/3 정밀측정'},
 {id:'A-4-2',name:'3D 스캔과 초음파 용접 검사 로봇 Cell',short:'3D·초음파 용접검사',nodes:['SCAN','MMZ'],x:43.5,z:-20,w:7,d:16,description:'3D 스캔·초음파 용접검사 · ZEISS MMZ M 문형 3차원 측정. MMZ M은 치수측정 장비이며 초음파 검사는 별도 센서로 수행'},
 {id:'A-4-3',name:'4족 보행 검사 및 안전 모니터링 로봇 Cell',short:'4족 보행·안전 모니터링',nodes:[],x:34,z:-6,w:6,d:8,description:'4족 보행 로봇의 순찰·설비 상태 및 안전 모니터링 시연'},
 {id:'A-4-4',name:'원키트 (One-Kit) 비전 센서 기술 드론 Cell',short:'원키트 비전 드론',nodes:[],x:44,z:3,w:6,d:7,description:'드론 비전 센서의 비접촉 점검·영상 수집·QMS 전달 시연'},
 {id:'A-4-5',name:'AI정밀검사(QMS) 통합 OCS 시뮬레이션 Cell',short:'QMS 통합 OCS',nodes:['JUDGE'],x:44,z:-6,w:6,d:8,description:'Cell 1~4 작업지시·장비상태·품질이력 통합 · OK/불확실/NG · 재검사 및 공정 환류 요청'}
];
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.42,metalness:.3});
const white=mat(0xe2e8eb),blue=mat(0x176ab4),dark=mat(0x243641),orange=mat(0xe29b22),metal=mat(0x8eabb3);
function box(g,w,h,d,x,y,z,m=white){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function label(g,text,x,y,z){const e=document.createElement('div');e.className='equipment-label';e.textContent=text;const o=new CSS2DObject(e);o.position.set(x,y,z);g.add(o);return o;}
function segment(g,a,b,r,m){const dir=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,dir.length(),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());g.add(o);return o;}
// Purpose-built articulated proxies, not relabelled ABB meshes or manufacturer CAD.
function robot(g,x,z,cobot,sensor){const root=new T.Group();root.position.set(x,0,z);g.add(root);box(root,.48,.24,.48,0,.12,0,dark);const links=new T.Group();root.add(links);const tag=label(root,cobot?'두산 H2017':'현대 HDR50-22',0,2.9,0);return {root,links,tag,cobot,sensor};}
function pose(r,target,model){
 const a=new T.Vector3(0,.4,0),b=new T.Vector3(-.3,model==='H2515'?1.35:1.5,0),end=target.clone().sub(r.root.position),mid=b.clone().lerp(end,.48);mid.y+=.55;const points=[a,b,mid,end];
 if(!r.bones){r.bones=[.13,.11,.085].map(radius=>{const o=new T.Mesh(new T.CylinderGeometry(radius,radius,1,12),r.cobot?white:orange);r.links.add(o);return o;});r.joints=points.map(()=>{const j=new T.Mesh(new T.SphereGeometry(.13,12,8),r.cobot?blue:dark);r.links.add(j);return j;});r.tool=box(r.links,r.sensor?.38:.28,.16,.26,0,0,0,r.cobot?blue:dark);r.carried=box(r.links,.65,.18,.5,0,0,0,orange);}
 for(let i=0;i<3;i++){const delta=points[i+1].clone().sub(points[i]),bone=r.bones[i];bone.position.copy(points[i]).add(points[i+1]).multiplyScalar(.5);bone.scale.y=delta.length();bone.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}r.joints.forEach((j,i)=>j.position.copy(points[i]));r.tool.position.copy(end);r.carried.position.copy(end).add(new T.Vector3(0,-.18,0));r.carried.visible=!!r.carry;r.root.scale.setScalar(!r.cobot&&model==='HDR80-22'?1.06:1);r.tag.element.textContent=(r.cobot?'두산 ':'현대 ')+model;
}
export class PlanScene{
 constructor(engine,scene,onFocus){this.engine=engine;this.root=new T.Group();scene.add(this.root);this.lastReport=0;this.visuals={};this.labels=[];this.cobot='H2017';this.handler='HDR50-22';this.focus=null;
  for(const p of PLAN){const g=new T.Group();g.position.set(p.x,0,p.z);this.root.add(g);box(g,p.w,.035,p.d,0,.015,0,mat(p.id==='A-4-1'?0x23535a:p.id==='A-4-2'?0x284760:0x314c53));const l=label(g,p.id+'  '+p.short,0,.15,-p.d/2+.3);l.element.classList.add('plan-label');l.element.onclick=()=>onFocus(p.id);this.labels.push(l);}
  for(const c of engine.order){const g=new T.Group();g.position.set(c.def.x,0,c.def.z);g.userData.zoneCell={zone:'insp',cellId:c.id};this.root.add(g);const v={g,robots:[]};this.visuals[c.id]=v;
   if(c.id==='VIS'||c.id==='SCAN'){box(g,1.7,.75,1.5,0,.375,-1.5,dark);box(g,1.9,.12,1.7,0,.81,-1.5,metal);v.sample=box(g,.65,.18,.5,0,.97,-1.5,orange);v.handler=robot(g,-1.65,-.65,false);v.robots.push(v.handler);if(c.id==='VIS'){v.robots.push(robot(g,-1.4,-2.5,true,'ABIS'),robot(g,1.4,-2.5,true,'AIMAX'));label(g,'ZEISS ABIS III · AIMAX',0,3.5,-1.7);}else{v.robots.push(robot(g,1.4,-2.5,true,'3D / UT'));label(g,'3D 스캐너 · 초음파 UT',0,3.5,-1.7);}}
   else if(c.id==='OINS'||c.id==='MMZ'){const big=c.id==='MMZ',w=big?3:2;box(g,w,.75,2.2,0,.375,-1.6,dark);box(g,w,.15,2.2,0,.825,-1.6,metal);v.bridge=new T.Group();g.add(v.bridge);for(const x of [-w/2+.12,w/2-.12])box(v.bridge,.23,2,.3,x,1.8,-2.1);box(v.bridge,w,.3,.4,0,2.8,-2.1);v.probe=new T.Group();v.bridge.add(v.probe);box(v.probe,.12,1.1,.12,0,2,-2.1,metal);box(v.probe,.05,.22,.05,0,1.35,-2.1,orange);v.sample=box(g,.65,.18,.5,0,1,-1.5,orange);v.handler=robot(g,-1.7,-.2,false);v.robots.push(v.handler);label(g,big?'ZEISS MMZ M':'ZEISS O-INSPECT 8/6/3',0,3.3,-1.7);}
   else if(c.id==='DOCK'){box(g,2,.08,1.7,0,.04,0,metal);label(g,'공용 반입 · ID 확인',0,1.3,0);}
   else {box(g,2.8,1,.7,0,.5,-1,dark);box(g,2.4,1.3,.12,0,1.6,-1,blue);label(g,'QMS · OCS / 판정·환류',0,2.6,-1);}
  }
  this.dog=new T.Group();this.root.add(this.dog);box(this.dog,1.1,.4,.55,0,.8,0,orange);box(this.dog,.3,.3,.4,.65,.85,0,dark);this.legs=[];for(const x of [-.4,.4])for(const z of [-.3,.3]){const leg=new T.Group();leg.position.set(x,.7,z);this.dog.add(leg);box(leg,.11,.65,.11,0,-.3,0,metal);this.legs.push(leg);}label(this.dog,'A-4-3 · 순찰',0,1.5,0);
  this.drone=new T.Group();this.root.add(this.drone);box(this.drone,.6,.2,.5,0,0,0,white);this.rotors=[];for(const x of [-.6,.6])for(const z of [-.6,.6]){segment(this.drone,new T.Vector3(),new T.Vector3(x,0,z),.05,dark);const rotor=box(this.drone,.65,.025,.08,x,.12,z,metal);this.rotors.push(rotor);}box(this.drone,.16,.2,.16,0,-.2,0,blue);label(this.drone,'A-4-4 · 비전 점검',0,.7,0);
 }
 update(){const t=this.engine.time;if(t<this.lastReport)this.lastReport=0;if(t-this.lastReport>=45){this.lastReport=t;this.engine.emit('info','A-4-3 · A-4-4 점검 데이터 전달',{obs:'4족 순찰·드론 비전 점검 (모사)',dec:'A-4-5 QMS·OCS 상태 통합',act:'설비 상태·점검 영상 이력 연결'});this.engine.spawnPacket(this.dog.position.clone().add(new T.Vector3(0,1,0)));this.engine.spawnPacket(this.drone.position.clone());}for(const c of this.engine.order){c.g.visible=false;const v=this.visuals[c.id],busy=c.state==='BUSY'&&!c.fault,p=c.progress;const on=busy&&p>.16&&p<.84;if(v.sample){v.sample.visible=on;if(c.occ?.pm)c.occ.pm.visible=!(busy&&p>.02&&p<.98);}
   for(const r of v.robots){r.tag.visible=!!(this.focus===c.id||PLAN.find(p=>p.id===this.focus)?.nodes.includes(c.id));let target=new T.Vector3(0,1.4,-1.5);if(r===v.handler){if(busy&&(p<.16||p>.84)){const q=p<.16?p/.16:(1-p)/.16;target.set(0,1.1+Math.sin(q*Math.PI)*.8,-1.5*q);}else target.set(-1.4,1.6,-.3);}else if(on){target.set(Math.sin(t*2)*.5,1.65,-1.5+Math.cos(t*2)*.3);}else target.set(r.root.position.x,2,-2.2);r.carry=r===v.handler&&busy&&((p>.02&&p<.16)||(p>.84&&p<.98));pose(r,target,r.cobot?this.cobot:this.handler);}
   if(v.bridge){v.bridge.position.z=on?Math.sin(t)*.3:0;v.probe.position.x=on?Math.sin(t*.8)*.5:0;}
  }
  this.dog.position.set(34+Math.sin(t*.08)*1.7,0,-6+Math.cos(t*.08)*2);this.dog.rotation.y=-t*.08;this.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*3+i*Math.PI)*.4);this.drone.position.set(44+Math.sin(t*.1)*1.2,3+Math.sin(t*.3)*.2,3+Math.cos(t*.1));this.rotors.forEach(r=>r.rotation.y=t*22);
 }
 setLabels(on){this.root.traverse(o=>{if(o.isCSS2DObject)o.visible=on;});}
}
