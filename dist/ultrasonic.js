import * as T from 'three';
import {makeProduct} from './shapes.js';
const cache=new Map(),up=new T.Vector3(0,1,0),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const UT_LENGTH=.28;
// Illustrative welded specimen locations, not a production weld map or inspection program.
export function weldRecipe(key){
 if(cache.has(key))return cache.get(key);
 const product=makeProduct(key);product.updateWorldMatrix(true,true);const meshes=[];product.traverse(o=>{if(o.isMesh){let visible=true;for(let p=o;p;p=p.parent)visible=visible&&p.visible;if(visible)meshes.push(o);}});
 const bounds=new T.Box3().setFromObject(product),points=[],ray=new T.Raycaster();
 for(const [u,v] of [[.14,.15],[.38,.15],[.62,.15],[.86,.15],[.86,.85],[.62,.85],[.38,.85],[.14,.85]]){
  const x=T.MathUtils.lerp(bounds.min.x,bounds.max.x,u),z=T.MathUtils.lerp(bounds.min.z,bounds.max.z,v);
  ray.set(new T.Vector3(x,bounds.max.y+1,z),new T.Vector3(0,-1,0));const hit=ray.intersectObjects(meshes,false)[0];if(!hit)continue;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.y<0)normal.negate();points.push({point:hit.point.clone(),normal});
 }
 if(!points.length)throw Error('초음파 검사 위치를 생성하지 못했습니다: '+key);
 const r={points,bounds,size:bounds.getSize(new T.Vector3())};cache.set(key,r);return r;
}
export function ultrasonicMotion(key,q,offset=new T.Vector3()){
 const recipe=weldRecipe(key),count=recipe.points.length,a=T.MathUtils.clamp(q,0,.999999)*count,index=Math.floor(a),f=a-index;
 const cur=recipe.points[index],prev=recipe.points[Math.max(0,index-1)],point=cur.point.clone().add(offset),normal=cur.normal.clone();
 const high=Math.max(recipe.bounds.max.y+offset.y+.34,point.y+.34),position=point.clone();let phase,acquiring=false,coupled=false;
 if(f<.28){position.copy(prev.point).add(offset).lerp(point,smooth(f/.28));position.y=high;phase='용접점 이동';}
 else if(f<.46){position.addScaledVector(normal,(1-smooth((f-.28)/.18))*.10);position.y+=Math.max(0,high-point.y-.10)*(1-smooth((f-.28)/.18));phase='표면 법선 정렬 · 프로브 접근';}
 else if(f<.62){phase='막 접촉 · 음향 결합 확인';coupled=true;}
 else if(f<.84){phase='정지 · 초음파 신호 취득';coupled=true;acquiring=true;}
 else{position.addScaledVector(normal,smooth((f-.84)/.16)*.10);position.y+=Math.max(0,high-point.y-.10)*smooth((f-.84)/.16);phase='접촉 해제 · 후퇴';}
 return {recipe,count,index,point,position,normal,phase,acquiring,coupled};
}
const mat=color=>new T.MeshStandardMaterial({color,roughness:.4,metalness:.35});
const dark=mat(0x23343e),silver=mat(0xaab9be),blue=mat(0x187eaa),white=mat(0xdbe5e8);
function box(g,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;}
function cyl(g,r,length,z,m){const o=new T.Mesh(new T.CylinderGeometry(r,r,length,24),m);o.rotation.x=Math.PI/2;o.position.z=z;g.add(o);return o;}
export function makeUltrasonicHead(){
 const g=new T.Group();g.name='Contact matrix UT head - reference concept';
 cyl(g,.078,.035,.0175,silver);box(g,.12,.10,.065,0,0,.067,dark);
 // Compliance guides and gimbal yoke; final membrane face stays at UT_LENGTH.
 for(const x of [-.065,.065]){box(g,.018,.075,.12,x,0,.145,silver);for(let i=0;i<5;i++){const ring=new T.Mesh(new T.TorusGeometry(.014,.003,6,16),dark);ring.position.set(x,0,.105+i*.014);g.add(ring);}}
 cyl(g,.052,.095,.205,blue);cyl(g,.042,.024,.264,silver);
 const membrane=cyl(g,.037,.008,.276,new T.MeshStandardMaterial({color:0x68d8e7,transparent:true,opacity:.65,roughness:.18}));
 const hose=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.06,0,.24),new T.Vector3(.11,.04,.19),new T.Vector3(.12,.05,.02),new T.Vector3(.06,.04,-.12)]),20,.008,8,false),blue);g.add(hose);
 g.userData.membrane=membrane;return g;
}
export function buildUltrasonicStation(g){
 const cabinet=new T.Group();cabinet.position.set(1.8,0,-2.8);g.add(cabinet);
 box(cabinet,.7,1.1,.55,0,.55,0,white);box(cabinet,.58,.6,.025,0,.65,.29,dark);box(cabinet,.62,.08,.6,0,1.16,0,blue);
 // Couplant reservoir, pump, and reference coupon alongside the fixture.
 box(g,.35,.55,.35,1.8,.30,-1.95,new T.MeshStandardMaterial({color:0x9cd7e0,transparent:true,opacity:.65}));box(g,.15,.12,.18,1.8,.65,-1.95,blue);
 box(g,.38,.05,.23,1.15,.91,-2.05,silver);
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);
 const screen=box(cabinet,.85,.54,.035,0,1.55,.05,new T.MeshBasicMaterial({map:texture}));
 const markers=new T.Group();g.add(markers);let product=null;
 const cable=new T.Line(new T.BufferGeometry().setFromPoints([...Array.from({length:31},()=>new T.Vector3())]),new T.LineBasicMaterial({color:0x161f27}));g.add(cable);
 let last='';
 return {update(key,m,offset,visible,head,blocked){
  markers.visible=visible;
  if(key&&key!==product){product=key;for(const o of [...markers.children]){o.geometry.dispose();o.material.dispose();markers.remove(o);}for(const p of weldRecipe(key).points){const disk=new T.Mesh(new T.CylinderGeometry(.025,.025,.004,16),mat(0xc38d43));disk.position.copy(p.point).add(offset).addScaledVector(p.normal,.003);disk.quaternion.setFromUnitVectors(up,p.normal);markers.add(disk);}}
  markers.children.forEach((o,i)=>o.material.color.set(m&&i===m.index?(m.acquiring&&!blocked?0x68e5b6:0xffd270):0xc38d43));
  if(head){const end=g.worldToLocal(head.getWorldPosition(new T.Vector3()));cable.geometry.setFromPoints(new T.CatmullRomCurve3([new T.Vector3(1.8,1.1,-2.8),new T.Vector3(.3,2.8,-3),end.clone().add(new T.Vector3(0,.35,0)),end]).getPoints(30));head.userData.membrane.material.color.set(m?.coupled?0x6ce6c2:0x68d8e7);}
  const state=blocked?'작업 보류':m?m.phase:'제품·교정·레시피 확인';const stamp=state+':'+(m?.index??-1);if(last===stamp)return;last=stamp;
  ctx.fillStyle='#112632';ctx.fillRect(0,0,640,400);ctx.fillStyle='#8ce8d0';ctx.font='bold 30px sans-serif';ctx.fillText('접촉식 초음파 · 점용접 예시',25,45);ctx.fillStyle='#e4eff4';ctx.font='22px sans-serif';ctx.fillText(state,25,90);ctx.fillText(m?'용접점 '+(m.index+1)+' / '+m.count:'검사 대기',25,125);
  ctx.strokeStyle='#355967';ctx.lineWidth=1;for(let y=160;y<330;y+=40){ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(615,y);ctx.stroke();}
  if(m?.acquiring&&!blocked){ctx.strokeStyle='#7ee7bc';ctx.lineWidth=3;ctx.beginPath();for(let x=25;x<615;x++){const a=Math.exp(-Math.pow((x-110)/9,2))*.8+Math.exp(-Math.pow((x-310)/15,2))*.55+Math.exp(-Math.pow((x-510)/18,2))*.30;const y=310-150*a;if(x===25)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
  ctx.fillStyle='#b3cbd3';ctx.font='20px sans-serif';ctx.fillText('파형·용접점은 설명용 예시 · 실제 측정 아님',25,375);texture.needsUpdate=true;
 }};
}
