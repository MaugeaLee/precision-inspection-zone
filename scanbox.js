import * as T from 'three';
import {makeRobotRig} from './shapes.js';
import {makeInspectionTrace} from './inspection-motion.js';
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
const material=(color,metalness=.2)=>new T.MeshStandardMaterial({color,metalness,roughness:.4});
const white=material(0xe4e9ec),dark=material(0x29333b),edge=material(0x111b22),steel=material(0x91a1ad,.75),blue=material(0x0755b8),yellow=material(0xf2cf26);
function box(g,w,h,d,x,y,z,m=dark){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function plate(g,caption,x,y,z,w=.7,h=.22,color='#e6edf1',bg='#26343c'){
 const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='bold 55px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(caption,256,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);g.add(m);
}
function label(g,s,y){const el=document.createElement('div');el.className='equipment-label';el.textContent=s;const l=new CSS2DObject(el);l.position.set(0,y,0);g.add(l);}
export function buildScanBox(root,x,z,id){
 const big=id==='8160',w=big?5.75:4.3,d=big?10.15:4.25,h=big?3.9:3.05;
 const g=new T.Group();g.position.set(x,0,z);g.userData.zoneCell={zone:'insp',cellId:'SCAN',equipment:id};root.add(g);
 box(g,w,.08,d,0,.04,0,steel);
 // Open roof and front loading opening, with modular opaque side/rear panels.
 const count=big?7:3;
 for(const side of [-1,1])for(let i=0;i<count;i++){
  const zz=-d/2+(i+.5)*d/count;box(g,.09,h*.70,d/count-.025,side*(w/2-.04),h*.35,zz,dark);box(g,.15,h*.70,.04,side*(w/2-.04),h*.35,zz-d/count/2,edge);
  box(g,.13,.065,d/count,side*(w/2-.04),h*.65,zz,steel);
 }
 for(let i=0;i<4;i++){box(g,w/4-.025,h*.70,.10,-w/2+(i+.5)*w/4,h*.35,-d/2,dark);box(g,.04,h*.70,.15,-w/2+i*w/4,h*.35,-d/2,edge);}
 for(const side of [-1,1]){
  const px=side*(w/2-.38),front=d/2;
  box(g,.76,h,.66,px,h/2,front-.32,big?dark:white);box(g,.08,h,.73,px-side*.38,h/2,front-.32,edge);
  if(big||side<0){
   box(g,.58,.60,.06,px,1.7,front+.035,edge);box(g,.49,.37,.04,px,1.77,front+.075,blue);plate(g,'INSPECT',px,1.78,front+.1,.45,.13,'#e3f8ff','#105891');box(g,.65,.035,.32,px,1.35,front+.12,steel);
   for(const yy of [.4,.7])for(let n=0;n<5;n++)box(g,.22,.013,.02,px,yy+n*.025,front+.025,edge);
   box(g,.07,.07,.04,px+.25,2.2,front+.045,yellow);box(g,.04,.04,.05,px+.25,2.2,front+.075,material(0xcc2525));
  }
  plate(g,side<0?'ZEISS':'SCANBOX',px,h-.35,front+.025,.61,.22,'#ffffff',side<0?'#0755b8':big?'#29333b':'#596872');
  box(g,.07,h*.75,.06,side*(w/2-.83),h*.375,front,edge);
  for(let n=0;n<8;n++)box(g,.025,.02,.075,side*(w/2-.83),.25+n*.27,front,yellow);
 }
 const lamp=new T.Group();lamp.position.set(-w/2+.38,h+.16,d/2-.3);g.add(lamp);
 for(const [i,col]of [0x34bc70,0xf1bd24,0xe13c32].entries()){const o=new T.Mesh(new T.CylinderGeometry(.055,.055,.09,16),material(col));o.position.y=i*.095;lamp.add(o);}
 const table=new T.Group();g.add(table);box(table,big?1.4:1.2,.35,big?3:1.2,0,.25,0,edge);
 const disk=new T.Mesh(new T.CylinderGeometry(big?.8:1.25,big?.8:1.25,.12,48),steel);disk.position.y=.8;table.add(disk);
 if(big){disk.visible=false;box(table,1.6,.12,3.4,0,.8,0,steel);for(const zz of [-1.2,1.2])box(table,1.3,.12,.12,0,.9,zz,edge);}
 const sample=new T.Group();sample.position.y=.96;g.add(sample);
 const robots=[];
 for(const side of big?[-1,1]:[-1]){
  const base=new T.Group();g.add(base);const rig=makeRobotRig('H2515');base.add(rig.root);box(base,.48,.50,.48,0,-.25,0,edge);
  const sensor=new T.Group();rig.tcp.add(sensor);box(sensor,.38,.16,.14,0,0,.04,edge);for(const xx of [-.13,.13]){const lens=new T.Mesh(new T.CylinderGeometry(.045,.045,.035,20),blue);lens.rotation.x=Math.PI/2;lens.position.set(xx,0,.13);sensor.add(lens);}box(sensor,.055,.055,.025,0,0,.13,blue);
  if(big){box(g,.32,.14,d-1.5,side*(w/2-1),.15,0,steel);for(const dx of [-.15,.15])box(g,.035,.05,d-1.5,side*(w/2-1)+dx,.25,0,edge);}
  robots.push({base,rig,sensor,side});
 }
 const trace=makeInspectionTrace(g,0x64caff);label(g,'ATOS ScanBox '+id+(big?' · 대형 후드/도어':' · 중소형 검사물'),h+.65);
 const update=motion=>{
  const key=motion?[...motion.position.toArray(),...motion.point.toArray()].map(n=>n.toFixed(4)).join(','):'idle';if(g.userData.lastPose===key)return;g.userData.lastPose=key;
  for(const r of robots){
   const target=motion?motion.position.clone().add(new T.Vector3(r.side*.12,.2,0)):new T.Vector3(r.side*.65,1.7,-.2);
   r.base.position.set(r.side*(big?1.75:1.3),.65,motion?T.MathUtils.clamp(target.z-.55,-d/2+1,d/2-1):-.6);r.base.rotation.y=r.side>0?Math.PI:0;
   const world=g.localToWorld(target.clone());for(let n=0;n<3;n++)r.rig.solve(world);
   const direction=motion?motion.point.clone().sub(target).normalize():new T.Vector3(0,-1,0);
   r.sensor.quaternion.copy(r.rig.tcp.getWorldQuaternion(new T.Quaternion()).invert().multiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction)));
  }
 };
 update(null);return {g,sample,trace,update,robots};
}
