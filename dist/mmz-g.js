import * as T from 'three';
import {panelGeometry} from './render-quality.js';
// Manufacturer-photo-based representation; configuration dimensions are illustrative.
export function buildMMZG(g){
 const white=new T.MeshStandardMaterial({color:0xe5e6e5,roughness:.35}),dark=new T.MeshStandardMaterial({color:0x29353d,metalness:.6,roughness:.3}),metal=new T.MeshStandardMaterial({color:0xadb7be,metalness:.75,roughness:.25});
 const box=(p,w,h,d,x,y,z,m=white)=>{const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 box(g,4.8,.08,4.7,0,.04,-1.6,dark);
 for(const x of [-2.1,2.1]){box(g,.45,.7,4.5,x,.43,-1.6);box(g,.16,.035,4.3,x,.80,-1.6,dark);for(let z=-3.6;z<.6;z+=.6)box(g,.455,.004,.008,x,.77,z,metal);}
 // A separate fixture stands in the walk-in measuring area.
 box(g,1.7,.75,1.7,0,.455,-1.5,dark);box(g,1.9,.08,1.9,0,.87,-1.5,metal);
 const bridge=new T.Group();g.add(bridge);
 for(const x of [-2.1,2.1]){const shape=new T.Shape();shape.moveTo(-.15,.8);shape.lineTo(.15,.8);shape.lineTo(.30,2.95);shape.lineTo(-.30,2.95);shape.closePath();const leg=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:false}),white);leg.position.set(x,0,-1.825);leg.castShadow=true;bridge.add(leg);}
 box(bridge,4.8,.62,.65,0,3.1,-1.6);
 const probe=new T.Group();bridge.add(probe);box(probe,.45,1.75,.45,0,4.25,-1.6);
 const ram=box(probe,.095,1,.095,0,2,-1.6,metal),stylus=new T.Group();probe.add(stylus);box(stylus,.09,.13,.09,0,.25,0,white);box(stylus,.018,.18,.018,0,.11,0,metal);const ruby=new T.Mesh(new T.SphereGeometry(.018,16,12),new T.MeshStandardMaterial({color:0xc52c4d}));ruby.position.y=.018;stylus.add(ruby);
 if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#e5e6e5';c.fillRect(0,0,512,96);c.fillStyle='#164c91';c.font='bold 52px Arial';c.fillText('ZEISS  MMZ G',14,65);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const badge=new T.Mesh(new T.PlaneGeometry(1.8,.34),new T.MeshBasicMaterial({map:tex}));badge.position.set(0,3.1,-1.269);bridge.add(badge);}
 return {bridge,probe,ram,stylus,headHeight:3.1};
}
