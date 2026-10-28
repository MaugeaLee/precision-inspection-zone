import * as T from 'three';
import {hideCameraBody} from './robot-cameras.js';

const FONT='"Malgun Gothic","Apple SD Gothic Neo",sans-serif';
const clock=t=>[8+Math.floor(t/3600),Math.floor(t/60)%60,Math.floor(t)%60].map(n=>String(n).padStart(2,'0')).join(':');
const point=(o,x,y,z)=>o.localToWorld(new T.Vector3(x,y,z));
function look(root,px,py,pz,tx,ty,tz){return ()=>({position:point(root,px,py,pz),target:point(root,tx,ty,tz)});}
function world(px,py,pz,tx,ty,tz){return ()=>({position:new T.Vector3(px,py,pz),target:new T.Vector3(tx,ty,tz)});}
function applyPose(camera,pose){
 camera.position.copy(pose.position);
 const d=pose.target.clone().sub(pose.position).normalize();
 camera.up.set(0,Math.abs(d.y)>.98?0:1,Math.abs(d.y)>.98?-1:0);
 camera.lookAt(pose.target);
}
function makeFeed(w,h){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 return {canvas,ctx:canvas.getContext('2d'),texture,material:new T.MeshBasicMaterial({map:texture,toneMapped:false})};
}
function caption(text){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#0c1820';ctx.fillRect(0,0,512,64);
 ctx.fillStyle='#7fe7d0';ctx.font='bold 30px '+FONT;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,34);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 return new T.Mesh(new T.PlaneGeometry(2.18,.2),new T.MeshBasicMaterial({map:texture,toneMapped:false}));
}
function shortName(name){
 return name.replace(' · H2515','').replace(' · HDR50-22 · 그리퍼',' · HDR50').replace(' · HDR50-22',' · HDR50').replace(' · 초음파 접촉부',' · UT').replace('ScanBox ','SB ').replace(' · 전방','');
}
function channelOf(id,name,pose,hide=null){return {id,name,pose,hide};}
function hideSubject(entry){
 const cam=entry.hide?.hide?entry.hide:entry;
 return cam.hide?.traverse?hideCameraBody(cam):()=>{};
}

export function createOcsWall(renderer,scene,plan,cameras,patrolViews){
 const judge=plan.visuals.JUDGE,engine=plan.engine,feeds=[],cam=new T.PerspectiveCamera(65,16/9,.04,220);
 const panels=[
  {key:'drone',title:'드론 · 하방 가상 카메라',live:'DRONE-01',find:()=>cameras.entries.find(e=>e.name.includes('드론'))},
  {key:'dog',title:'4족 · 전방 가상 카메라',live:'QUAD-01',find:()=>cameras.entries.find(e=>e.name.includes('4족'))},
  {key:'cctv',title:'CCTV · 에셋 슬라이스',live:'CCTV-SLICE'}
 ];
 const boards=panels.map(()=>makeFeed(640,360));

 (judge.ocsScreens||[]).forEach((bezel,i)=>{
  const x=bezel.position.x;
  const video=new T.Mesh(new T.PlaneGeometry(2.2,1.96),boards[i].material);video.position.set(x,2.15,-3.50);video.userData.ocsFeed=true;judge.g.add(video);feeds.push(video);
  const plate=caption(panels[i].title);plate.position.set(x,.96,-3.50);judge.g.add(plate);
 });
 (judge.ocsDesks||[]).forEach((bezel,i)=>{
  const x=bezel.position.x;
  const video=new T.Mesh(new T.PlaneGeometry(1.04,.54),boards[i].material);video.position.set(x,1.55,-.74);video.userData.ocsFeed=true;judge.g.add(video);feeds.push(video);
 });

 const area=[
  channelOf('C01','VIS · 비전검사 부스',look(plan.visuals.VIS.g,0,3.3,5.1,0,1.15,-1)),
  channelOf('C02','SCAN · 복합검사',look(plan.visuals.SCAN.g,2.6,3.5,4.4,0,1.05,-1.3)),
  channelOf('C03','ScanBox 8160',look(plan.scanBoxes['8160'].g,0,3.1,8.4,0,1.3,0)),
  channelOf('C04','ScanBox 5130',look(plan.scanBoxes['5130'].g,0,2.6,4.8,0,1.1,0)),
  channelOf('C05','MMZ G · 정밀측정',look(plan.visuals.MMZ.g,2.8,4,4.6,0,1.35,-1.4)),
  channelOf('C06','O-INSPECT',look(plan.visuals.OINS.g,2.3,3.3,4.1,0,1.15,-1.4)),
  channelOf('C07','X-ray · 비파괴',world(58,4.3,-9.2,58,1.5,-14)),
  channelOf('C08','공용 반입 · DOCK',look(plan.visuals.DOCK.g,2.6,3.1,3.4,0,.55,0)),
  channelOf('C09','4족 도킹',world(34,3.8,7.2,34,.7,3)),
  channelOf('C10','드론 도킹',world(44,3.8,7.2,44,.8,3)),
  channelOf('C11','4족 · 순찰 에셋',()=>({position:point(plan.dog,-1.9,2.15,-2.5),target:point(plan.dog,.25,.65,.15)})),
  channelOf('C12','드론 · 상부 에셋',()=>({position:point(plan.drone,2.3,.85,2.1),target:point(plan.drone,0,0,0)}))
 ];
 function assetChannels(){
  const list=area.slice();
  engine.carriers.forEach((c,i)=>list.push(channelOf('C-AMR'+(i+1),'AMR '+(i+1)+' · 이송',()=>({position:point(engine.carriers[i].g,-2.3,2.45,-2.5),target:point(engine.carriers[i].g,0,.4,.15)}))));
  for(const e of cameras.entries){
   if(e.name.includes('드론')||e.name.includes('4족'))continue;
   list.push(channelOf('V'+e.id,shortName(e.name),e.pose,e));
  }
  return list;
 }

 let tile=0,page=-1,shown=[];
 function grab(ctx,dx,dy,dw,dh){
  const size=renderer.getSize(new T.Vector2()),w=Math.min(320,size.x),h=w*9/16,ratio=renderer.getPixelRatio();
  renderer.setViewport(0,0,w,h);renderer.setScissor(0,0,w,h);renderer.setScissorTest(true);
  renderer.render(scene,cam);
  ctx.drawImage(renderer.domElement,0,renderer.domElement.height-h*ratio,w*ratio,h*ratio,dx,dy,dw,dh);
 }
 function paint(entry,ctx,dx,dy,dw,dh){
  if(!entry){ctx.fillStyle='#07141c';ctx.fillRect(dx,dy,dw,dh);return;}
  applyPose(cam,entry.pose());
  const restore=hideSubject(entry);
  try{grab(ctx,dx,dy,dw,dh);}finally{restore();}
 }
 function chromeDedicated(ctx,w,h,panel,entry,simTime){
  const rec=Math.floor(performance.now()/500)%2===0;
  ctx.fillStyle='#0c1820';ctx.fillRect(0,0,w,36);ctx.fillRect(0,h-34,w,34);
  ctx.fillStyle=rec?'#ff4d4d':'#7a2a2a';ctx.beginPath();ctx.arc(18,18,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e8fbff';ctx.font='bold 16px '+FONT;ctx.textAlign='left';ctx.fillText('REC  '+panel.live,30,22);
  ctx.textAlign='right';ctx.fillStyle='#5ee0a8';ctx.fillText('LIVE',w-16,22);
  ctx.textAlign='left';ctx.fillStyle='#d7eef2';ctx.font='15px '+FONT;ctx.fillText(entry?.name||panel.title,14,h-12);
  ctx.textAlign='right';ctx.fillStyle='#8fb4bc';ctx.fillText(clock(simTime)+'  SIM',w-14,h-12);
 }
 function chromeCctv(ctx,w,h,tiles,simTime,pageIndex,pages){
  const tw=w/2,th=(h-28)/2;
  tiles.forEach((ch,i)=>{
   const x=(i%2)*tw,y=Math.floor(i/2)*th;
   ctx.strokeStyle='rgba(80,200,190,.55)';ctx.strokeRect(x+.5,y+.5,tw-1,th-1);
   ctx.fillStyle='#0c1820';ctx.fillRect(x,y,tw,22);
   ctx.fillStyle='#7fe7d0';ctx.font='bold 12px '+FONT;ctx.textAlign='left';ctx.fillText(ch?.id||'—',x+8,y+15);
   ctx.fillStyle='#e8fbff';ctx.font='12px '+FONT;ctx.fillText(ch?.name||'대기',x+58,y+15);
  });
  ctx.fillStyle='#0c1820';ctx.fillRect(0,h-28,w,28);
  ctx.fillStyle='#7fe7d0';ctx.font='bold 13px '+FONT;ctx.textAlign='left';ctx.fillText('CCTV SLICE · AUTO',12,h-10);
  ctx.textAlign='center';ctx.fillStyle='#cfe6ea';ctx.fillText((pageIndex+1)+' / '+pages,w/2,h-10);
  ctx.textAlign='right';ctx.fillStyle='#8fb4bc';ctx.fillText(clock(simTime)+'  SIM',w-12,h-10);
 }

 return {update(){
  if(document.hidden)return;
  const prevShadow=renderer.shadowMap.enabled,size=renderer.getSize(new T.Vector2());
  feeds.forEach(o=>o.visible=false);
  if(patrolViews)patrolViews.group.visible=false;
  renderer.shadowMap.enabled=false;
  renderer.setRenderTarget(null);
  try{
   const drone=panels[0].find(),dog=panels[1].find();
   paint(drone,boards[0].ctx,0,0,640,360);chromeDedicated(boards[0].ctx,640,360,panels[0],drone,engine.time);boards[0].texture.needsUpdate=true;
   paint(dog,boards[1].ctx,0,0,640,360);chromeDedicated(boards[1].ctx,640,360,panels[1],dog,engine.time);boards[1].texture.needsUpdate=true;
   const list=assetChannels(),pages=Math.max(1,Math.ceil(list.length/4));
   const next=Math.floor(performance.now()/7000)%pages;
   const cctx=boards[2].ctx;
   if(next!==page){page=next;tile=0;shown=list.slice(page*4,page*4+4);cctx.fillStyle='#07141c';cctx.fillRect(0,0,640,360);for(let i=0;i<4;i++)paint(shown[i],cctx,(i%2)*320,Math.floor(i/2)*166,320,166);}
   else {const i=tile%4;paint(shown[i],cctx,(i%2)*320,Math.floor(i/2)*166,320,166);tile++;}
   chromeCctv(cctx,640,360,shown,engine.time,page,pages);boards[2].texture.needsUpdate=true;
  }catch(err){console.warn('OCS wall feed',err);}
  finally{
   feeds.forEach(o=>o.visible=true);
   if(patrolViews)patrolViews.group.visible=true;
   renderer.shadowMap.enabled=prevShadow;
   renderer.setScissorTest(false);
   renderer.setViewport(0,0,size.x,size.y);
  }
 }};
}
