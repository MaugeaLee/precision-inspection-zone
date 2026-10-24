import * as T from 'three';
import {makeProduct} from './shapes.js';
const cache=new Map(),up=new T.Vector3(0,1,0);
export const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
// Sample actual visible mesh surfaces, rather than the empty bounding box.
// These are demonstration measurement sites, not CAD/GD&T feature definitions.
export function surfaceRecipe(key){
 if(cache.has(key))return cache.get(key);
 const model=makeProduct(key);model.updateWorldMatrix(true,true);
 const meshes=[];model.traverse(o=>{if(o.isMesh){let visible=true;for(let p=o;p;p=p.parent)visible&&=p.visible;if(visible)meshes.push(o);}});
 const bounds=new T.Box3();for(const m of meshes)bounds.union(new T.Box3().setFromObject(m));
 const size=bounds.getSize(new T.Vector3()),points=[],ray=new T.Raycaster();
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){
  const u=(row%2?6-col:col)/6,v=row/4;
  const x=T.MathUtils.lerp(bounds.min.x+size.x*.12,bounds.max.x-size.x*.12,u),z=T.MathUtils.lerp(bounds.min.z+size.z*.12,bounds.max.z-size.z*.12,v);
  ray.set(new T.Vector3(x,bounds.max.y+1,z),new T.Vector3(0,-1,0));
  const hit=ray.intersectObjects(meshes,false)[0];if(!hit)continue;
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.y<0)normal.negate();
  // Limit the approach tilt to maintain clearance in the schematic fixture.
  normal.lerp(up,.65).normalize();points.push({point:hit.point.clone(),normal});
 }
 if(!points.length)throw new Error('제품 표면 경로를 생성할 수 없습니다: '+key);
 const recipe={points,bounds,size};cache.set(key,recipe);return recipe;
}
export function measurementMotion(key,q,kind,offset=new T.Vector3()){
 const recipe=surfaceRecipe(key),all=recipe.points;
 const count=kind==='surface'?all.length:kind==='ut'?10:8;
 const points=Array.from({length:count},(_,i)=>all[Math.round(i*(all.length-1)/(count-1))]);
 q=T.MathUtils.clamp(q,0,.999999);const a=q*count,index=Math.floor(a),f=a-index;
 const current=points[index],previous=points[Math.max(0,index-1)];
 const point=current.point.clone().add(offset),prev=previous.point.clone().add(offset);
 const contact=kind==='touch'||kind==='ut';
 const gap=contact?.018:kind==='surface'?.32:.24;
 const lift=contact?.26:.18;
 const high=Math.max(recipe.bounds.max.y+offset.y+.30,point.y+gap+lift,prev.y+gap+lift);
 let position,normal=current.normal.clone(),phase,acquiring=false;
 if(f<.3){position=prev.clone().lerp(point,smooth(f/.3));position.y=high;phase='안전 높이 이동';}
 else if(f<.5){position=point.clone().addScaledVector(normal,gap);position.y=T.MathUtils.lerp(high,position.y,smooth((f-.3)/.2));phase=contact?'프로브 접근':'촬영 거리 정렬';}
 else if(f<.78){position=point.clone().addScaledVector(normal,gap);phase=contact?'접촉 · 데이터 취득':'정지 · 광학 취득';acquiring=true;}
 else{position=point.clone().addScaledVector(normal,gap);position.y=T.MathUtils.lerp(position.y,high,smooth((f-.78)/.22));phase='후퇴';}
 return {position,point,normal,index,count,phase,acquiring,recipe};
}
export function makeInspectionTrace(parent,color=0x67e6d0){
 const g=new T.Group();parent.add(g);const dots=[];
 const material=new T.MeshBasicMaterial({color});
 for(let i=0;i<35;i++){const dot=new T.Mesh(new T.SphereGeometry(.016,8,6),material);g.add(dot);dots.push(dot);}
 const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color,transparent:true,opacity:.7}));g.add(line);
 return {g,update(m){g.visible=!!m;if(!m)return;dots.forEach((d,i)=>{d.visible=i<=m.index&&i<m.count;if(d.visible){const p=m.recipe.points[Math.round(i*(m.recipe.points.length-1)/(m.count-1))].point;d.position.copy(p).add(m.point.clone().sub(m.recipe.points[Math.round(m.index*(m.recipe.points.length-1)/(m.count-1))].point));d.position.y+=.02;}});line.visible=m.acquiring;line.geometry.setFromPoints([m.position,m.point]);}};
}
