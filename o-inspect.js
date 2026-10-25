import * as T from 'three';
import {panelGeometry} from './render-quality.js';
// ZEISS 8/6/3 photograph-based visual model; not manufacturer CAD dimensions.
export function buildOInspect863(g){
 const mat=(color,metalness=.15,roughness=.38)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const white=mat(0xe9eae8),black=mat(0x262a2d),rubber=mat(0x101519,0,.8),metal=mat(0x9ea9af,.7,.25),blue=mat(0x1354a2);
 const box=(p,w,h,d,x,y,z,m=white)=>{const o=new T.Mesh(panelGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 box(g,1.5,.40,1.35,0,.22,-1.55,black);box(g,1.95,.27,1.8,0,.51,-1.5,black);box(g,1.95,.27,1.8,0,.78,-1.5);
 for(const x of [-.87,.87]){box(g,.25,.35,.4,x,.2,-2.08,black);box(g,.24,1.62,.36,x,1.19,-2.08);}
 box(g,1.96,.36,.32,0,1.94,-2.08);box(g,1.58,.32,.025,0,1.94,-1.905,rubber);
 for(let x=-.77;x<.8;x+=.035)box(g,.012,.31,.02,x,1.94,-1.886,black);
 for(const x of [-.95,.95])for(let y=.73;y<.86;y+=.035)box(g,.012,.009,.18,x,y,-.85,black);
 const table=new T.Group();g.add(table);box(table,1.74,.025,1.48,0,.928,-1.5,metal);
 box(table,1.52,.018,1.22,0,.95,-1.5,new T.MeshPhysicalMaterial({color:0x769498,transparent:true,opacity:.42,metalness:.1,roughness:.12}));
 for(const x of [-.78,.78])box(table,.025,.027,1.3,x,.96,-1.5,black);
 // Joystick console and emergency-stop cap on the front lip.
 box(g,.62,.08,.26,.25,.89,-.46);box(g,.55,.018,.21,.25,.94,-.46,metal);
 for(const x of [.05,.45]){const stick=new T.Mesh(new T.CylinderGeometry(.012,.018,.09,12),black);stick.position.set(x,.99,-.46);g.add(stick);const knob=new T.Mesh(new T.SphereGeometry(.026,12,8),black);knob.position.set(x,1.04,-.46);g.add(knob);}
 box(g,.06,.025,.06,.26,.97,-.46,mat(0xd62d2d));box(g,.04,.015,.04,.17,.96,-.46,mat(0xe7ba29));
 const carriage=new T.Group();g.add(carriage);const head=new T.Group();carriage.add(head);
 box(head,.44,.97,.44,0,.73,-1.6);box(head,.39,.24,.39,0,.18,-1.6,black);
 const optics=new T.Mesh(new T.CylinderGeometry(.082,.082,.09,32),metal);optics.position.set(.08,.035,-1.6);head.add(optics);
 const ring=new T.Mesh(new T.TorusGeometry(.063,.009,8,32),new T.MeshStandardMaterial({color:0xcce6ff,emissive:0x508acc,emissiveIntensity:.4}));ring.rotation.x=Math.PI/2;ring.position.set(.08,-.012,-1.6);head.add(ring);
 const stylus=new T.Group();carriage.add(stylus);box(stylus,.016,.13,.016,0,.083,-1.6,metal);const ruby=new T.Mesh(new T.SphereGeometry(.018,16,12),mat(0xc2294c));ruby.position.set(0,.018,-1.6);stylus.add(ruby);
 function badge(parent,text,w,h,x,y,z,bg,fg){if(typeof document==='undefined')return;const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,128);c.fillStyle=fg;c.font='bold 54px Arial';c.textAlign='center';c.fillText(text,256,85);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const plane=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx}));plane.position.set(x,y,z);parent.add(plane);return plane;}
 badge(head,'ZEISS',.18,.08,0,.34,-1.372,'#1354a2','white');badge(g,'O-INSPECT 8/6/3',.9,.16,0,.80,-.592,'#e9eae8','#333c44');
 const sideBadge=badge(g,'O-INSPECT',.65,.12,.87,1.42,-1.894,'#e9eae8','#333c44');if(sideBadge)sideBadge.rotation.z=Math.PI/2;
 const home=new T.Vector3(0,.967,-1.5);
 function updatePose(pos,optical=false){const shift=-1.6-pos.z;table.position.z=shift;carriage.position.x=pos.x;head.position.y=pos.y+.14;stylus.position.y=pos.y;ring.material.emissiveIntensity=optical?.7:.1;return shift;}
 updatePose(new T.Vector3(0,1.45,-1.6));
 return {sampleHome:home,updatePose,table,carriage,head,stylus};
}

