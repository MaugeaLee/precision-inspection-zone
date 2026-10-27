import {recipeFor} from './recipe-v04.js';
export function supportsAI(item){return item&&['door','hood'].includes(item.product)&&['both','surface'].includes(recipeFor(item.product,item.recipe).vision);}
const mix=(a,b,p,l,h)=>a+(b-a)*Math.max(0,Math.min(1,(p-l)/(h-l)));
// One continuous sample lifecycle. State-machine progress is never rewound.
export function integratedAI(p){
 const ai={pickX:.08,pickYaw:.18,fixtureX:p<.44?.075:mix(.075,0,p,.44,.48),sensorShift:0};
 let progress=0,stage='인식',title='검사물 자세 인식',message='AMR 적재 자세를 확인합니다 · 위치·기울어짐 예시',compare='고정 파지점 → 실제 자세에 맞춘 파지점 보정';
 if(p>=.04){stage='판단';message='인식한 자세를 기준으로 파지 위치와 접근 자세를 보정합니다';}
 if(p>=.08){progress=mix(0,.16,p,.08,.28);stage='행동';title='적응형 이적재';message='HDR50-22가 보정된 위치에서 집어 지그로 이송합니다';}
 if(p>=.28){progress=.16;stage=p<.31?'인식':'판단';title='안착 오차 확인';message='기준 위치와 차이 감지 · 검사 시작 보류';compare='이상 시 작업자 조치 대기 → 재파지·재안착';}
 if(p>=.34){progress=p<.39?mix(.16,.1312,p,.34,.39):p<.44?mix(.1312,.112,p,.39,.44):p<.48?.112:mix(.112,.16,p,.48,.54);stage='행동';title='안착 불량 복구';message='재파지 → 인양 → 위치 보정 → 재안착';compare='이상 시 작업자 조치 대기 → 재파지·재안착';}
 if(p>=.54){progress=.16;stage='확인';title='안착 확인';message='보정 위치에 안착 확인 · 비전검사 시작';}
 if(p>=.58){progress=mix(.20,.32,p,.58,.65);stage='행동';title='표면검사';message='ABIS 3가 검사물 표면을 관측합니다';compare='정해진 경로 실행 → 취득 상태 확인 후 검사 보완';}
 if(p>=.65){progress=.32;stage=p<.675?'인식':'판단';title='취득 불량 대응';message='반사·가림 예시 감지 · 해당 부위 판정 보류';ai.acquire=false;}
 if(p>=.70){stage='행동';message='같은 부위를 향해 H2515·ABIS 3 관측 자세를 조정합니다';ai.sensorShift=mix(0,-.10,p,.70,.77);}
 if(p>=.77){stage='확인';message='같은 부위 재취득 · 취득 상태 확인 후 검사 계속';ai.acquire=true;}
 if(p>=.81){ai.sensorShift=mix(-.10,0,p,.81,.84);ai.acquire=false;stage='행동';message='재취득 완료 · 검사 경로 복귀';}
 if(p>=.84){progress=mix(.32,.84,p,.84,.92);ai.sensorShift=0;delete ai.acquire;stage='행동';title='레시피 검사 계속';message='남은 표면·피처 검사를 선택된 레시피에 따라 수행합니다';}
 if(p>=.92){progress=mix(.84,1,p,.92,1);stage='확인';title='검사 완료·회수';message='그리퍼로 검사물을 회수해 AMR에 인계합니다';compare='동작 실행 → 상태 확인·보정·결과 확인';}
 return {progress,ai,stage,title,message,compare};
}
export function syncIntegratedAI(engine){
 const c=engine.cells.VIS;
 if(!supportsAI(c.item)||c.state!=='BUSY'){delete c.aiDemo;delete c.visualProgress;return null;}
 const s=integratedAI(c.progress);c.aiDemo=s.ai;c.visualProgress=s.progress;return {...s,sample:c.item.id,held:!!(engine.halted||c.fault||c.processHold||engine.ctl.hold.has('VIS'))};
}
