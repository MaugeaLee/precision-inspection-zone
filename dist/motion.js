import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {loadShapes} from './shapes.js';
import {PlanScene} from './plan.js';
const $=id=>document.getElementById(id),scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.05,200),renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x20343f);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('view').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;scene.add(new T.HemisphereLight(0xe7f5ff,0x46535a,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(15,30,20);scene.add(light);const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.6;
let playing=true,progress=.25,last=performance.now();
try{
 await loadShapes();
 const order=[['VIS',35,-24],['SCAN',51,-10],['OINS',44,-24],['MMZ',52,-24],['JUDGE',57,5]].map(([id,x,z])=>({id,def:{x,z},g:new T.Group(),state:'BUSY',progress,item:{id:'PREVIEW',product:'hood'}}));
 const engine={time:0,order,cells:Object.fromEntries(order.map(c=>[c.id,c])),records:[],emit(){},spawnPacket(){}};
 const plan=new PlanScene(engine,scene,()=>{});
 function select(){const id=$('device').value;plan.focus=id;plan.root.children.forEach(g=>g.visible=g===plan.visuals[id].g||(id==='SCAN'&&g.userData.zoneCell?.cellId==='SCAN'));const c=engine.cells[id];controls.target.set(id==='SCAN'?47:c.def.x,1.5,id==='SCAN'?-14:c.def.z-3.5);camera.position.copy(controls.target).add(id==='SCAN'?new T.Vector3(15,18,27):id==='VIS'?new T.Vector3(4.5,7.5,6.5):new T.Vector3(3.5,4,4.5));controls.update();}
 $('device').onchange=select;$('product').onchange=()=>{order.forEach(c=>c.item.product=$('product').value);};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시정지':'재생';};$('progress').oninput=()=>{progress=Number($('progress').value)/1000;playing=false;$('play').textContent='재생';};select();
 new ResizeObserver(()=>{renderer.setSize($('view').clientWidth,$('view').clientHeight);camera.aspect=$('view').clientWidth/$('view').clientHeight;camera.updateProjectionMatrix();}).observe($('view'));
 renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(playing)progress=(progress+dt/70)%1;engine.time=progress*70;order.forEach(c=>c.progress=progress);plan.update();$('progress').value=Math.round(progress*1000);$('percent').textContent=Math.round(progress*100)+'%';$('phase').textContent=plan.visuals[$('device').value].motionText;controls.update();renderer.render(scene,camera);});
}catch(e){$('phase').textContent='동작 로딩 실패: '+e.message;console.error(e);}



