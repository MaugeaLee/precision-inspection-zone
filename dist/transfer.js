import * as T from 'three';
import {makeProduct} from './shapes.js';
const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
export function restorePayload(c){
 const m=c?.pm;if(!m)return;
 c.g.add(m);m.position.set(0,.88,0);m.quaternion.identity();m.visible=true;
}
// Deterministic phases also support reverse scrubbing and paused frames.
export function transferMotion(p,pick,place,height){
 const unload=p>=.84,q=unload?(p-.84)/.16:p/.16;
 const a=(unload?place:pick).clone(),b=(unload?pick:place).clone();
 a.y+=height+.08;b.y+=height+.08;
 const upA=a.clone().add(new T.Vector3(0,.22,0)),upB=b.clone().add(new T.Vector3(0,.22,0));
 let target,closed=0,owner=unload?'fixture':'amr',phase='접근';
 if(p>=.16&&p<.84)return {target:new T.Vector3(.7,1.65,.6),owner:'fixture',closed:0,phase:'지그 고정 · 검사'};
 if(q<.08)target=new T.Vector3(.7,1.65,.6).lerp(upA,smooth(q/.08));
 else if(q<.18)target=upA.clone().lerp(a,smooth((q-.08)/.10));
 else if(q<.28){target=a.clone();closed=smooth((q-.18)/.1);phase='파지 확인';}
 else if(q<.42){target=a.clone().lerp(upA,smooth((q-.28)/.14));closed=1;owner='gripper';phase='수직 인양';}
 else if(q<.70){const u=smooth((q-.42)/.28);target=upA.clone().lerp(upB,u);target.y+=Math.sin(u*Math.PI)*.40;target.x+=Math.sin(u*Math.PI)*1.05;closed=1;owner='gripper';phase='검사물 이송';}
 else if(q<.82){target=upB.clone().lerp(b,smooth((q-.70)/.12));closed=1;owner='gripper';phase='안착';}
 else if(q<.90){target=b.clone();closed=1-smooth((q-.82)/.08);owner=unload?'amr':'fixture';phase='파지 해제';}
 else {target=q<.95?b.clone().lerp(upB,smooth((q-.90)/.05)):upB.clone().lerp(new T.Vector3(.7,1.65,.6),smooth((q-.95)/.05));owner=unload?'amr':'fixture';phase='그리퍼 후퇴';}
 return {target,closed,owner,phase:(unload?'반출 · ':'반입 · ')+phase,turn:smooth((q-.42)/.28),unload};
}
export function prepareTransfer(c,v){
 const r=v.handler;if(!r||!c.item)return null;
 const carrier=c.occ;
 if(!carrier?.pm)return null;
 const key=c.item.id+':'+c.item.product;
 if(r.transferKey!==key||r.payload!==carrier.pm){
  r.transferKey=key;r.payload=carrier.pm;
  const probe=makeProduct(c.item.product),size=new T.Box3().setFromObject(probe).getSize(new T.Vector3());r.payloadHeight=size.y;
  r.pick=v.g.worldToLocal(carrier.g.localToWorld(new T.Vector3(0,.88,0)));
  r.pickRotation=v.g.getWorldQuaternion(new T.Quaternion()).invert().multiply(carrier.g.getWorldQuaternion(new T.Quaternion()));
  r.fixtureFrame??=new T.Group();v.g.add(r.fixtureFrame);
 }
 const m=transferMotion(c.progress,r.pick,v.sampleHome||new T.Vector3(0,v.sample.position.y,-1.5),r.payloadHeight);
 r.transfer=m;return m;
}
export function applyTransfer(c,v){
 const r=v.handler,m=r?.transfer;if(!m||!c.occ?.pm)return;
 const payload=c.occ.pm,frame=r.gripFrame;
 frame.quaternion.copy(r.rig.tcp.getWorldQuaternion(new T.Quaternion()).invert());
 const yaw=new T.Quaternion().slerpQuaternions(m.unload?new T.Quaternion():r.pickRotation,m.unload?r.pickRotation:new T.Quaternion(),m.turn??0);
 if(m.owner==='gripper'){
  frame.add(payload);payload.position.set(0,-r.payloadHeight-.08,0);payload.quaternion.copy(yaw);payload.visible=true;
 }else if(m.owner==='amr')restorePayload(c.occ);
 else {
  r.fixtureFrame.position.copy(v.sample.position);r.fixtureFrame.add(payload);payload.position.set(0,0,0);payload.quaternion.identity();payload.visible=c.id!=='SCAN';
 }
 if(c.id!=='SCAN')v.sample.visible=false;
 r.fingers.forEach((f,i)=>f.position.x=(i?1:-1)*(.12+(1-m.closed)*.10));
 if(c.progress<.16||c.progress>=.84)v.motionText=m.phase;
}

