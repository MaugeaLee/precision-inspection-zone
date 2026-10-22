import * as T from 'three';
const cache=new Map();
// Bevels retain the original dimensions and catch highlights along panel edges.
export function panelGeometry(w,h,d){
 const key=[w,h,d].join(',');if(cache.has(key))return cache.get(key);
 const r=Math.min(.035,w*.08,h*.08,d*.08),x=w/2-r,y=h/2-r;
 const shape=new T.Shape();shape.moveTo(-x,-y);shape.lineTo(x,-y);shape.lineTo(x,y);shape.lineTo(-x,y);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r,bevelThickness:r,curveSegments:1});g.translate(0,0,-d/2+r);g.computeVertexNormals();cache.set(key,g);return g;
}
export function floorMaterial(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);let seed=21;
 for(let i=0;i<data.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=180+(seed%12);data.data.set([v,v+3,v+4,255],i);}ctx.putImageData(data,0,0);
 const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(28,22);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
 return new T.MeshStandardMaterial({color:0x899da7,map:tex,roughness:.82,metalness:.06});
}
export function contactShadows(scene,stations){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,12,64,64,64);g.addColorStop(0,'rgba(4,15,22,.35)');g.addColorStop(.5,'rgba(4,15,22,.19)');g.addColorStop(1,'rgba(4,15,22,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const tex=new T.CanvasTexture(c);
 for(const [x,z,w,d]of stations){const p=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));p.rotation.x=-Math.PI/2;p.position.set(x,.065,z);scene.add(p);}
}
