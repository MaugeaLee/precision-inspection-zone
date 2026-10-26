import {recipeControls,readRecipe,loadRecipe} from './recipe-ui.js';
import {acceptsProduct} from './product-policy.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {KIT} from './original/factory.js';
import {loadShapes,makeProduct} from './shapes.js';
import {PlanScene} from './plan.js';
const $=id=>document.getElementById(id),scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.05,200),renderer=new T.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x20343f);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('view').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;scene.add(new T.HemisphereLight(0xe7f5ff,0x46535a,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(15,30,20);scene.add(light);const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.6;
let playing=true,progress=.25,last=performance.now();
try{
 document.querySelector('header').insertAdjacentHTML('afterend',recipeControls);loadRecipe($('product').value);
 await loadShapes();
 const order=[['VIS',35,-24],['SCAN',51,-10],['OINS',45,-24],['MMZ',51,-24],['JUDGE',57,5]].map(([id,x,z])=>({id,def:{x,z},g:new T.Group(),state:'BUSY',progress,item:{id:'PREVIEW',product:'hood',recipe:readRecipe()}}));
 const engine={time:0,order,cells:Object.fromEntries(order.map(c=>[c.id,c])),records:[],emit(){},spawnPacket(){}};
 const plan=new PlanScene(engine,scene,()=>{});
 for(const c of order.filter(c=>plan.visuals[c.id].handler)){const g=KIT.makeCarrierAMR();g.position.set(0,0,2.5);plan.visuals[c.id].g.add(g);const pm=makeProduct(c.item.product);pm.position.y=.88;g.add(pm);c.occ={g,pm};}
 function select(){const id=$('device').value;for(const option of $('product').options)option.disabled=!acceptsProduct(id,option.value);if(!acceptsProduct(id,$('product').value)){$('product').value=id==='MMZ'?'hood':'hblock';$('product').onchange();}plan.focus=id;plan.root.children.forEach(g=>g.visible=g===plan.visuals[id].g||(id==='SCAN'&&g.userData.zoneCell?.cellId==='SCAN'));const c=engine.cells[id];controls.target.set(id==='SCAN'?47:c.def.x,1.5,id==='SCAN'?-14:c.def.z-3.5);camera.position.copy(controls.target).add(id==='SCAN'?new T.Vector3(15,18,27):id==='VIS'?new T.Vector3(4.5,7.5,6.5):id==='MMZ'?new T.Vector3(6,6,8):new T.Vector3(3.5,4,4.5));controls.update();}
 document.querySelectorAll('.recipe-v04 select,.recipe-v04 input').forEach(e=>e.onchange=()=>order.forEach(c=>c.item.recipe=readRecipe()));$('device').onchange=select;$('product').onchange=()=>{loadRecipe($('product').value);order.forEach(c=>{c.item.product=$('product').value;c.item.recipe=readRecipe();if(c.occ){c.occ.pm.removeFromParent();c.occ.pm=makeProduct(c.item.product);c.occ.pm.position.y=.88;c.occ.g.add(c.occ.pm);}});};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시정지':'재생';};$('progress').oninput=()=>{progress=Number($('progress').value)/1000;playing=false;$('play').textContent='재생';};select();
 new ResizeObserver(()=>{renderer.setSize($('view').clientWidth,$('view').clientHeight);camera.aspect=$('view').clientWidth/$('view').clientHeight;camera.updateProjectionMatrix();}).observe($('view'));
 renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.05);last=now;if(playing)progress=(progress+dt/70)%1;engine.time=progress*70;order.forEach(c=>c.progress=progress);plan.update();$('progress').value=Math.round(progress*1000);$('percent').textContent=Math.round(progress*100)+'%';$('phase').textContent=plan.visuals[$('device').value].motionText;controls.update();renderer.render(scene,camera);});
}catch(e){$('phase').textContent='동작 로딩 실패: '+e.message;console.error(e);}



