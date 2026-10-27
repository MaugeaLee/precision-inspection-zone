import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {KIT} from './original/factory.js';
import {loadShapes,makeProduct} from './shapes.js';
import {PlanScene} from './plan.js';
import {storyAt,DURATION} from './ai-story.js';
const $=id=>document.getElementById(id),stages=['인식','판단','행동','확인'];
let elapsed=0,playing=true,last=performance.now(),recorder,recordStream,chunks=[],downloadURL,lastChapter=-1,lastStage=-1;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.05,200);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x20343f);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('view').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;scene.add(new T.HemisphereLight(0xe7f5ff,0x46535a,2));
const light=new T.DirectionalLight(0xffffff,3);light.position.set(15,30,20);scene.add(light);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();
const videoCanvas=document.createElement('canvas');videoCanvas.width=1920;videoCanvas.height=1080;const ctx=videoCanvas.getContext('2d');
function textLines(text,x,y,width,line=36){let row='';for(const char of text){if(ctx.measureText(row+char).width>width){ctx.fillText(row,x,y);row='';y+=line;}row+=char;}ctx.fillText(row,x,y);return y+line;}
function compose(s){
 ctx.fillStyle='#10242d';ctx.fillRect(0,0,1920,1080);ctx.fillStyle='#8ae9cf';ctx.font='24px sans-serif';ctx.fillText('PHYSICAL AI · 정밀검사존 / 적용 목표 시연',40,43);
 ctx.fillStyle='#ffffff';ctx.font='bold 34px sans-serif';ctx.fillText(s.title,40,95);
 const canvas=renderer.domElement,scale=Math.min(1260/canvas.width,740/canvas.height),w=canvas.width*scale,h=canvas.height*scale;ctx.drawImage(canvas,30+(1260-w)/2,125+(740-h)/2,w,h);
 ctx.fillStyle='#b5cbd2';ctx.font='22px sans-serif';ctx.fillText('AS-IS · 사전 설정 중심',1320,165);ctx.font='27px sans-serif';textLines(s.asis,1320,210,550);
 ctx.fillStyle='#8ae9cf';ctx.font='22px sans-serif';ctx.fillText('TO-BE · 상태에 따른 동작 조정',1320,330);ctx.fillStyle='#eef8fa';ctx.font='27px sans-serif';textLines(s.tobe,1320,375,550);
 s.steps.forEach((text,i)=>{ctx.fillStyle=i===s.stage?'#8ae9cf':'#91aab4';ctx.font=(i===s.stage?'bold ':'')+'24px sans-serif';textLines(stages[i]+' · '+text,1320,530+i*85,550,30);});
 ctx.fillStyle='#20413e';ctx.fillRect(30,895,1860,95);ctx.fillStyle='#9effde';ctx.font='bold 32px sans-serif';ctx.fillText(stages[s.stage],55,952);ctx.fillStyle='#ffffff';ctx.font='30px sans-serif';ctx.fillText(s.message,170,952);
 ctx.fillStyle='#a9c2ca';ctx.font='22px sans-serif';ctx.fillText('시나리오 기반 모사 · 실제 AI 추론·센서 입력·장비 제어 아님 · 결과는 예시',40,1035);ctx.fillText(Math.floor(s.t)+' / 90초',1720,1035);
}
function stopRecording(){if(recorder?.state==='recording')recorder.stop();}
function setControls(disabled){document.querySelectorAll('nav button,#timeline,#restart,#play').forEach(e=>e.disabled=disabled);controls.enabled=!disabled;}
try{
 await loadShapes();
 const order=[['VIS',33.5,-25],['SCAN',51,-10],['OINS',45,-24],['MMZ',51,-24],['JUDGE',57,5]].map(([id,x,z])=>({id,def:{x,z},g:new T.Group(),state:id==='VIS'?'BUSY':'IDLE',progress:0,item:id==='VIS'?{id:'AI-DEMO',product:'door',recipe:{vision:'surface',scan:'none',ndt:'none',measure:false}}:null}));
 const engine={time:0,order,cells:Object.fromEntries(order.map(c=>[c.id,c])),records:[],emit(){},spawnPacket(){}};
 const plan=new PlanScene(engine,scene,()=>{}),c=engine.cells.VIS,v=plan.visuals.VIS;
 plan.root.children.forEach(g=>g.visible=g===v.g);plan.focus='VIS';
 const amr=KIT.makeCarrierAMR();amr.position.set(-1.5,0,1.5);v.g.add(amr);const pm=makeProduct('door');pm.position.y=.88;amr.add(pm);c.occ={g:amr,pm};
 const outline=new T.Box3Helper(new T.Box3(),0x78e7d0);scene.add(outline);
 // Wireframe marks the nominal pose; the solid door remains at the observed example pose.
 const nominal=new T.Mesh(new T.BoxGeometry(1.34,.115,1.1),new T.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.35}));nominal.position.set(0,.94,0);amr.add(nominal);
 const point=new T.Mesh(new T.SphereGeometry(.065,16,12),new T.MeshBasicMaterial({color:0xffb15d}));v.g.add(point);
 const sight=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xffc477}));v.g.add(sight);
 function frameCamera(chapter){controls.target.copy(v.g.position).add(new T.Vector3(chapter===0?-.45:0,1.1,chapter===0?-.15:-1.1));camera.position.copy(controls.target).add(chapter===0?new T.Vector3(3.5,3.6,7.8):new T.Vector3(2.8,2.5,6.5));controls.update();}
 function seek(t){elapsed=t;lastChapter=-1;lastStage=-1;}
 $('play').onclick=()=>{if(elapsed>=DURATION)seek(0);playing=!playing;$('play').textContent=playing?'일시정지':'재생';};
 $('restart').onclick=()=>{seek(0);playing=true;$('play').textContent='일시정지';};
 $('timeline').oninput=()=>{seek(Number($('timeline').value)/10);playing=false;$('play').textContent='재생';};
 document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{seek(Number(b.dataset.chapter)*30);playing=true;$('play').textContent='일시정지';});
 $('record').onclick=()=>{
  if(recorder?.state==='recording'){stopRecording();return;}
  if(!window.MediaRecorder||!videoCanvas.captureStream){$('record-status').textContent='이 브라우저는 영상 녹화를 지원하지 않습니다. 화면 시연은 사용할 수 있습니다.';return;}
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime){$('record-status').textContent='WebM 녹화를 지원하는 브라우저에서 열어 주세요.';return;}
  try{
   seek(0);playing=true;$('play').textContent='일시정지';setControls(true);chunks=[];$('save').hidden=true;recordStream=videoCanvas.captureStream(30);recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:8000000});
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=()=>{recordStream.getTracks().forEach(t=>t.stop());setControls(false);$('record').textContent='90초 영상 녹화';if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob(chunks,{type:mime}));$('save').href=downloadURL;$('save').download='정밀검사존_피지컬AI_적용시연.webm';$('save').hidden=false;$('save').textContent='↓ 자막 포함 영상 저장';$('record-status').textContent='녹화 완료 · 1920×1080 · 무음 WebM · 영상 저장을 눌러 내려받으세요.';};
   recorder.onerror=()=>{$('record-status').textContent='녹화 중 오류가 발생했습니다. 다시 시도해 주세요.';recordStream.getTracks().forEach(t=>t.stop());setControls(false);};
   recorder.start(1000);$('record').textContent='■ 녹화 종료';$('record-status').textContent='90초 시연을 처음부터 녹화합니다. 창을 열어 두세요. 완료 시 자동 종료됩니다.';
  }catch(e){recordStream?.getTracks().forEach(t=>t.stop());setControls(false);$('record-status').textContent='녹화를 시작하지 못했습니다: '+e.message;}
 };
 new ResizeObserver(()=>{renderer.setSize($('view').clientWidth,$('view').clientHeight);camera.aspect=$('view').clientWidth/$('view').clientHeight;camera.updateProjectionMatrix();}).observe($('view'));
 $('loading').hidden=true;
 renderer.setAnimationLoop(now=>{
  const dt=Math.min((now-last)/1000,.08);last=now;if(playing)elapsed=Math.min(DURATION,elapsed+dt);const s=storyAt(elapsed);
  if(lastChapter!==s.chapter){frameCamera(s.chapter);lastChapter=s.chapter;$('title').textContent=s.title;$('asis').textContent=s.asis;$('tobe').textContent=s.tobe;$('steps').innerHTML=s.steps.map((t,i)=>'<li>'+stages[i]+' · '+t+'</li>').join('');document.querySelectorAll('[data-chapter]').forEach(b=>b.classList.toggle('active',Number(b.dataset.chapter)===s.chapter));lastStage=-1;}
  if(lastStage!==s.stage){lastStage=s.stage;$('stage').textContent=stages[s.stage];$('message').textContent=s.message;[...$('steps').children].forEach((e,i)=>e.classList.toggle('active',i===s.stage));}
  c.progress=s.progress;c.aiDemo=s.ai;engine.time=elapsed;plan.update();scene.updateMatrixWorld(true);
  outline.box.setFromObject(pm);outline.visible=s.chapter!==1;outline.material.color.set(s.stage===3?0x78e7d0:0xffbd63);nominal.visible=s.chapter===0&&s.stage<2;
  const sensor=v.robots.find(r=>r.sensor==='ABIS');point.visible=sight.visible=s.chapter===1&&!!sensor.motion;if(point.visible){point.position.copy(sensor.motion.point);point.material.color.set(s.stage===3?0x78e7d0:0xffb15d);sight.geometry.setFromPoints([sensor.motion.position,sensor.motion.point]);}
  controls.update();renderer.render(scene,camera);$('timeline').value=Math.round(elapsed*10);$('time').textContent=Math.floor(elapsed)+' / 90초';
  if(recorder?.state==='recording')compose(s);
  if(elapsed>=DURATION&&playing){playing=false;$('play').textContent='다시 재생';stopRecording();}
 });
}catch(e){$('loading').hidden=false;$('loading').textContent='시연을 시작하지 못했습니다: '+e.message;console.error(e);}
