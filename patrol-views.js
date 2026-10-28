import * as T from 'three';
// Illustrative field of view matches the virtual camera (65 degrees, 16:9).
// Ground intersections do not account for occlusion by equipment.
export function createPatrolViews(scene,entries){
 const group=new T.Group();scene.add(group);
 const camera=new T.PerspectiveCamera(65,16/9,.08,12);
 const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
 const faces=[0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7];
 const build=(name,color,range)=>{
  const entry=entries.find(e=>e.name===name),g=new T.Group();group.add(g);
  const make=(count,line,opacity)=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));const material=line?new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}):new T.MeshBasicMaterial({color,transparent:true,opacity,side:T.DoubleSide,depthWrite:false});const o=line?new T.LineSegments(geometry,material):new T.Mesh(geometry,material);o.frustumCulled=false;o.raycast=()=>{};g.add(o);return o;};
  return {entry,range,volume:make(24,false,.12),outline:make(24,true,.95),ground:make(36,false,.24),border:make(24,true,1)};
 };
 const views=[build('드론 · 하방 검사',0x39dfff,12),build('4족 보행 로봇 · 전방',0xffbd48,6)];
 const write=(object,points)=>{const a=object.geometry.attributes.position;points.forEach((p,i)=>a.setXYZ(i,p.x,p.y,p.z));a.needsUpdate=true;object.geometry.setDrawRange(0,points.length);};
 return {group,update(){
  scene.updateMatrixWorld(true);
  for(const v of views){const pose=v.entry.pose();camera.position.copy(pose.position);const d=pose.target.clone().sub(pose.position).normalize();camera.up.set(0,Math.abs(d.y)>.98?0:1,Math.abs(d.y)>.98?-1:0);camera.lookAt(pose.target);camera.far=v.range;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   const corners=[];for(const z of [-1,1])for(const [x,y]of [[-1,-1],[1,-1],[1,1],[-1,1]])corners.push(new T.Vector3(x,y,z).unproject(camera));
   write(v.volume,faces.map(i=>corners[i]));write(v.outline,edges.flatMap(([a,b])=>[corners[a],corners[b]]));
   const hits=[],floor=.035;
   for(const [a,b]of edges){const p=corners[a],q=corners[b];if((p.y-floor)*(q.y-floor)<0){const h=p.clone().lerp(q,(floor-p.y)/(q.y-p.y));if(!hits.some(x=>x.distanceToSquared(h)<1e-8))hits.push(h);}}
   const center=new T.Vector3();hits.forEach(p=>center.add(p));if(hits.length)center.divideScalar(hits.length);hits.sort((a,b)=>Math.atan2(a.z-center.z,a.x-center.x)-Math.atan2(b.z-center.z,b.x-center.x));
   write(v.ground,hits.length<3?[]:hits.flatMap((p,i)=>[center,p,hits[(i+1)%hits.length]]));write(v.border,hits.flatMap((p,i)=>[p,hits[(i+1)%hits.length]]));
  }
 }};
}
