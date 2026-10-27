import * as T from 'three';
const point=(o,x,y,z)=>o.localToWorld(new T.Vector3(x,y,z));
export function createRobotCameras(plan,engine,select){
 const entries=[];
 const add=(name,root,pose,hide=root)=>{const e={id:String(entries.length),name,root,pose,hide};entries.push(e);root.userData.robotCamera=e;return e;};
 for(const [cell,v] of Object.entries(plan.visuals))for(const r of v.robots){
  const name=cell+' · '+(r.cobot?'H2515 · '+(r.sensor==='3D / UT'?'초음파 접촉부':r.sensor):'HDR50-22 · 그리퍼');
  const e=add(name,r.root,()=>{
   if(r.cobot&&r.tool)return {position:point(r.tool,0,0,r.sensor==='ABIS'?.29:r.sensor==='3D / UT'?.23:.23),target:point(r.tool,0,0,1.2)};
   if(r.rig){const p=r.rig.tcp.getWorldPosition(new T.Vector3());return {position:p.clone().add(new T.Vector3(0,.18,.12)),target:p.clone().add(new T.Vector3(0,-.6,0))};}
   return {position:point(r.root,0,2,.4),target:point(v.g,0,.9,-1.5)};
  });
  r.tag.element.setAttribute('role','button');r.tag.element.setAttribute('tabindex','0');r.tag.element.title=name+' 가상 카메라';r.tag.element.style.cursor='pointer';r.tag.element.style.pointerEvents='auto';
  r.tag.element.onclick=ev=>{ev.stopPropagation();select(e);};r.tag.element.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(e);}};
 }
 for(const [id,box]of Object.entries(plan.scanBoxes||{}))for(const [i,r]of (box.robots||[]).entries())add('ScanBox '+id+' · H2515 '+(i+1)+' · ATOS',r.base,()=>({position:point(r.sensor,0,0,.18),target:point(r.sensor,0,0,1.2)}));
 add('4족 보행 로봇 · 전방',plan.dog,()=>({position:point(plan.dog,.86,.97,0),target:point(plan.dog,5,.85,0)}));
 add('드론 · 하방 검사',plan.drone,()=>({position:point(plan.drone,0,-.4,0),target:point(plan.drone,0,-5,.1)}));
 for(const c of engine.carriers){const e=add('AMR '+(c.i+1)+' · 전방',c.g,()=>{const o=engine.carriers[c.i].g;return {position:point(o,0,.65,.85),target:point(o,0,.65,5)};});e.carrier=c.i;}
 return {entries,refresh(){for(const e of entries)if(e.carrier!==undefined){e.root=engine.carriers[e.carrier].g;e.hide=e.root;e.root.userData.robotCamera=e;}},find(hits){for(const h of hits){let visible=true;for(let o=h.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible||!h.object.isMesh)continue;for(let o=h.object;o;o=o.parent)if(o.userData.robotCamera)return o.userData.robotCamera;const materials=Array.isArray(h.object.material)?h.object.material:[h.object.material];if(materials.some(m=>!m.transparent||m.opacity>=.65))return null;}return null;}};
}

// Hide the selected robot body for the virtual lens, but keep its carried specimen visible.
export function hideCameraBody(entry){const changed=[];entry.hide.traverse(o=>{if(!o.isMesh||!o.visible)return;for(let p=o;p&&p!==entry.hide;p=p.parent)if(p.userData.product)return;changed.push(o);o.visible=false;});return ()=>changed.forEach(o=>o.visible=true);}
