import * as T from 'three';
function rounded(w,h,d){const r=Math.min(.045,w/5,h/5,d/5),s=new T.Shape();s.moveTo(-w/2+r,-h/2+r);s.lineTo(w/2-r,-h/2+r);s.lineTo(w/2-r,h/2-r);s.lineTo(-w/2+r,h/2-r);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,steps:1});g.translate(0,0,-d/2+r);return g;}
// Image-based visual approximation of the Spot-based HMG factory safety robot.
export function buildSafetyQuadruped(root){
 const yellow=new T.MeshStandardMaterial({color:0xf5bf12,roughness:.38,metalness:.18}),black=new T.MeshStandardMaterial({color:0x161c20,roughness:.48,metalness:.35}),rubber=new T.MeshStandardMaterial({color:0x080c10,roughness:.85}),lens=new T.MeshStandardMaterial({color:0x234e67,metalness:.7,roughness:.14});
 const mesh=(geo,mat,parent=root)=>{const o=new T.Mesh(geo,mat);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w,h,d,x,y,z,mat,parent=root)=>{const o=mesh(rounded(w,h,d),mat,parent);o.position.set(x,y,z);return o;};
 const joint=(radius,x,y,z,parent=root)=>{const o=mesh(new T.CylinderGeometry(radius,radius,.12,20),black,parent);o.rotation.x=Math.PI/2;o.position.set(x,y,z);return o;};
 const link=(a,b,w,mat)=>{const o=box(w,1,w*.8,0,0,0,mat);return {o,a,b};};
 const place=(o,a,b)=>{o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=a.distanceTo(b);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());};
 box(1.23,.34,.53,0,.94,0,yellow);box(1.02,.16,.48,-.03,.74,0,black);box(.28,.32,.47,.64,.92,0,yellow);
 box(.035,.19,.34,.793,.94,0,black);
 for(const z of [-.115,0,.115]){const o=mesh(new T.CylinderGeometry(.035,.035,.018,16),lens);o.rotation.z=Math.PI/2;o.position.set(.82,.97,z);}
 box(.25,.04,.24,.18,1.13,0,black);const stop=mesh(new T.CylinderGeometry(.04,.04,.035,16),new T.MeshStandardMaterial({color:0xd92c28}));stop.position.set(.37,1.14,0);
 for(const z of [-.274,.274]){box(.64,.09,.016,-.1,.96,z,black);for(let i=0;i<5;i++)box(.045,.07,.02,-.41+i*.07,.85,z,black);}
 // Raised AI inspection unit from the supplied reference photo.
 box(.34,.12,.32,-.15,1.16,0,black);joint(.13,-.15,1.26,0);box(.4,.27,.35,-.08,1.43,0,yellow);box(.29,.20,.37,.06,1.40,0,black);box(.025,.12,.22,.22,1.4,0,black);
 for(const z of [-.075,.075]){const o=mesh(new T.CylinderGeometry(.04,.04,.018,20),lens);o.rotation.z=Math.PI/2;o.position.set(.24,1.42,z);}
 const legs=[];
 for(const [i,[x,z]]of [[.43,.34],[.43,-.34],[-.43,.34],[-.43,-.34]].entries()){
  joint(.125,x,.88,z);const hip=new T.Vector3(x,.85,z),knee=joint(.082,0,0,0),upper=link(null,null,.135,yellow).o,lower=link(null,null,.065,black).o,foot=mesh(new T.SphereGeometry(.052,14,10),rubber);foot.scale.set(1.25,.7,1);legs.push({hip,knee,upper,lower,foot,phase:(i===0||i===3)?0:Math.PI});
 }
 return {update(t){for(const l of legs){const phase=t*3+l.phase,foot=new T.Vector3(l.hip.x+Math.sin(phase)*.13,.045+Math.max(0,Math.cos(phase))*.075,l.hip.z),knee=new T.Vector3(l.hip.x-.20,.43,l.hip.z);l.knee.position.copy(knee);l.foot.position.copy(foot);place(l.upper,l.hip,knee);place(l.lower,knee,foot);}}};
}
