// Conservative shared-aisle reservation. No timeout ever overrides separation.
export const CLEARANCE=2.6;
export const MOVING=new Set(['out','in','move','home','buffer']);
export function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;const u=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;return Math.hypot(p.x-a.x-u*dx,p.z-a.z-u*dz);}
export function pathClear(c,others){return others.every(o=>o===c||c.path.slice(1).every((b,i)=>segmentDistance(o,c.path[i],b)>=CLEARANCE));}
export function corridorPath(a,b){
 const access=p=>p.z<-30?-39:p.z<-18?-21:p.z<0?-7:6.5;
 const az=access(a),bz=access(b),lane=29.4;
 const pts=[{x:a.x,z:a.z},{x:a.x,z:az}];
 if(az!==bz)pts.push({x:lane,z:az},{x:lane,z:bz});
 pts.push({x:b.x,z:bz},{x:b.x,z:b.z});
 return pts.filter((p,i)=>!i||Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z)>.001);
}
export class TrafficReservations{
 constructor(){this.owner=null;this.serial=0;}
 request(c){c.trafficOrder=++this.serial;c.trafficWaiting=true;}
 acquire(c,carriers){
  if(this.owner&&!MOVING.has(this.owner.state))this.owner=null;
  if(this.owner)return this.owner===c;
  const eligible=carriers.filter(o=>MOVING.has(o.state)&&pathClear(o,carriers)).sort((a,b)=>a.trafficOrder-b.trafficOrder);
  if(eligible[0]!==c)return false;
  this.owner=c;c.trafficWaiting=false;return true;
 }
 release(c){if(this.owner===c)this.owner=null;c.trafficWaiting=false;}
}
