import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const assets={},metadata={};
export const PRODUCT_NAMES={hood:'후드',door:'도어',doortrim:'도어트림',eaxle:'e-axle',hblock:'유압블록',rcover:'리어커버'};
export async function loadShapes(base='.'){
 const loader=new GLTFLoader();
 await Promise.all([...Object.keys(PRODUCT_NAMES),'H2515','HDR50-22'].map(async key=>{
  const robot=!PRODUCT_NAMES[key],url=base+'/assets/models/'+(robot?'official/':'')+key;
  const gltf=await loader.loadAsync(url+'.glb');assets[key]=gltf.scene;
  gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  if(robot){const r=await fetch(url+'.json');if(!r.ok)throw new Error(key+' 관절 정보 로드 실패');metadata[key]=await r.json();}
 }));
}
export function makeProduct(key){
 if(!assets[key])throw new Error('제품 모델 미로드: '+key);
 const g=new T.Group(),model=assets[key].clone(true);g.add(model);model.traverse(o=>{if(o.name==='Raw')o.visible=false;});
 // Preserve source dimensions. Only orient trim flat and place its lower face on the fixture.
 if(key==='doortrim')model.rotation.x=-Math.PI/2;
 const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());model.position.x-=center.x;model.position.z-=center.z;model.position.y-=bounds.min.y;
 g.userData.product=key;return g;
}
export function replaceProduct(holder,key){if(holder.userData.product===key)return;holder.clear();holder.add(makeProduct(key));holder.userData.product=key;}
export function makeRobotRig(model){
 if(!metadata[model])throw new Error('공식 로봇 형상 없음: '+model);
 const root=new T.Group(),zup=new T.Group(),asset=assets[model].clone(true);zup.rotation.x=-Math.PI/2;zup.add(asset);root.add(zup);
 const info=metadata[model],joints=info.joints.map(j=>({...j,node:asset.getObjectByName(j.name),axis:new T.Vector3(...j.axis),angle:0}));
 if(joints.some(j=>!j.node))throw new Error(model+' 관절 노드 누락');
 const flange=asset.getObjectByName(info.tip);if(!flange)throw new Error(model+' 플랜지 누락');
 const tcp=new T.Group();tcp.position.z=.15;flange.add(tcp);
 const home=model==='HDR50-22'?[0,1.3,.4,0,.4,0]:[0,.55,-1.15,0,.65,0];
 const rig={root,asset,joints,flange,tcp,model,setAngles(values){joints.forEach((j,i)=>{j.angle=T.MathUtils.clamp(values[i]??0,j.lower,j.upper);j.node.quaternion.setFromAxisAngle(j.axis,j.angle);});root.updateWorldMatrix(true,true);},solve(target){
  root.updateWorldMatrix(true,true);
  const tip=new T.Vector3(),origin=new T.Vector3(),axis=new T.Vector3(),qa=new T.Quaternion();
  for(let pass=0;pass<9;pass++){
   tcp.getWorldPosition(tip);if(tip.distanceTo(target)<.012)break;
   for(let i=joints.length-1;i>=0;i--){const j=joints[i];j.node.getWorldPosition(origin);j.node.parent.getWorldQuaternion(qa);axis.copy(j.axis).applyQuaternion(qa).normalize();tcp.getWorldPosition(tip);
    const a=tip.sub(origin),b=target.clone().sub(origin);a.addScaledVector(axis,-a.dot(axis));b.addScaledVector(axis,-b.dot(axis));if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)continue;a.normalize();b.normalize();const delta=Math.atan2(axis.dot(new T.Vector3().crossVectors(a,b)),a.dot(b));j.angle=T.MathUtils.clamp(j.angle+T.MathUtils.clamp(delta,-.25,.25),j.lower,j.upper);j.node.quaternion.setFromAxisAngle(j.axis,j.angle);j.node.updateWorldMatrix(false,true);
   }
  }
  return tcp.getWorldPosition(new T.Vector3()).distanceTo(target);
 }};
 rig.setAngles(home);return rig;
}
