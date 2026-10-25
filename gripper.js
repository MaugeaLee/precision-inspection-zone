import * as T from 'three';
import {LARGE_PRODUCTS} from './product-policy.js';
// Illustrative interchangeable tooling, dimensioned to the displayed products.
export function makeHandlingTool(){
 const root=new T.Group(),vacuum=new T.Group(),clamp=new T.Group();root.add(vacuum,clamp);
 const metal=new T.MeshStandardMaterial({color:0xadbcc6,metalness:.75,roughness:.25}),blue=new T.MeshStandardMaterial({color:0x1675ba,metalness:.3,roughness:.35}),rubber=new T.MeshStandardMaterial({color:0x182932,roughness:.85});
 function box(g,w,h,d,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;}
 function cylinder(g,r,h,y,mat){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mat);m.position.y=y;m.castShadow=true;g.add(m);return m;}
 cylinder(root,.10,.07,.055,metal);box(root,.22,.12,.18,0,.10,0,blue);
 const rail=box(clamp,1,.06,.17,0,.005,0,metal),jaws=[];
 for(const side of [-1,1]){const jaw=new T.Group();clamp.add(jaw);box(jaw,.045,.16,.18,0,-.045,0,metal);box(jaw,.018,.065,.15,-side*.028,-.075,0,rubber);jaws.push(jaw);}
 const cross=box(vacuum,1,.045,.07,0,.015,0,metal),bars=[],cups=[];
 for(const x of [-1,1]){bars.push(box(vacuum,.055,.04,1,x,.005,0,metal));for(const z of [-1,1]){const cup=new T.Group();vacuum.add(cup);cylinder(cup,.025,.04,-.025,metal);cylinder(cup,.065,.035,-.0625,rubber);cups.push({cup,x,z});}}
 const lamp=box(root,.045,.025,.045,.07,.175,0,new T.MeshBasicMaterial({color:0xf4b04b}));
 return {root,update(product,size,closed,rotation){root.quaternion.copy(rotation);const large=LARGE_PRODUCTS.has(product);vacuum.visible=large;clamp.visible=!large;
  const width=Math.max(.16,size.x);rail.scale.x=width+.26;jaws.forEach((j,i)=>j.position.x=(i?1:-1)*(width/2+.037+(1-closed)*.10));
  const sx=Math.max(.18,size.x*.30),sz=Math.max(.12,size.z*.28);cross.scale.x=sx*2+.12;bars.forEach((b,i)=>{b.position.x=(i?1:-1)*sx;b.scale.z=sz*2+.10;});cups.forEach(({cup,x,z})=>cup.position.set(x*sx,0,z*sz));lamp.material.color.setHex(closed>.95?0x43e9a0:0xf4b04b);
 }};
}
