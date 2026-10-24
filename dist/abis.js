import * as T from 'three';
import {panelGeometry} from './render-quality.js';

// Photo-based visual approximation, not manufacturer CAD or dimensional data.
// Optical face points along local +Z; rear mounting bracket ends at the origin.
export function makeABISIII(){
 const g=new T.Group();g.name='ZEISS ABIS III · 사진 기반 시각화';
 const material=(color,metalness=.25,roughness=.35)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const shell=material(0xe8e9e6),dark=material(0x222932),rim=material(0x59636d,.7),glass=material(0x153b55,.65,.12);
 function box(w,h,d,x,y,z,m){const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 box(.13,.12,.1,0,0,.05,rim);box(.36,.34,.12,0,0,.15,shell);box(.39,.36,.035,0,0,.222,dark);
 box(.43,.025,.04,0,.19,.24,rim);box(.43,.025,.04,0,-.19,.24,rim);
 for(const x of [-.205,.205])box(.025,.36,.04,x,0,.24,rim);
 const colors=[0x8e5bff,0x368bff,0x4be5ed,0x58eb8e,0xf6df65,0xf9687b];
 colors.forEach((c,i)=>{const m=new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.7,roughness:.25});for(const y of [-.174,.174])box(.059,.012,.009,(i-2.5)*.062,y,.264,m);for(const x of [-.19,.19])box(.012,.05,.009,x,(i-2.5)*.054,.264,m);});
 for(const [x,r] of [[-.078,.046],[.075,.035]]){
  const bezel=new T.Mesh(new T.CylinderGeometry(r,r,.018,40),rim);bezel.rotation.x=Math.PI/2;bezel.position.set(x,.015,.251);g.add(bezel);
  const lens=new T.Mesh(new T.CircleGeometry(r*.78,40),glass);lens.position.set(x,.015,.262);g.add(lens);
  const reflection=new T.Mesh(new T.CircleGeometry(r*.2,20),material(0x67badb));reflection.position.set(x-r*.2,.025,.263);g.add(reflection);
 }
 box(.105,.035,.012,0,-.085,.246,dark);
 for(const x of [-.16,.16])for(const y of [-.14,.14]){const screw=new T.Mesh(new T.SphereGeometry(.006,8,6),rim);screw.position.set(x,y,.245);g.add(screw);}
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#0750a0';c.fillRect(0,0,512,128);c.fillStyle='white';c.font='bold 68px Arial';c.fillText('ZEISS',20,88);c.font='28px Arial';c.fillText('ABIS III',287,82);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const badge=new T.Mesh(new T.PlaneGeometry(.23,.057),new T.MeshBasicMaterial({map:texture}));badge.position.set(0,.125,.246);g.add(badge);
 }
 return g;
}

