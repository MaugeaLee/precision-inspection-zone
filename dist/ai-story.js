// Presentation timeline only: no live perception, AI inference or equipment commands.
export const DURATION=90;
export const CHAPTERS=[
 {title:'01 · 실제 자세를 보고 집습니다',asis:'고정된 적재 위치와 파지점으로 반복 이송',tobe:'검사물 자세를 인식해 파지 위치와 자세를 보정',steps:['AMR 위 도어의 위치·기울어짐 인식','기존 파지점과 실제 위치가 다름을 판단','HDR50-22 파지 위치·자세 보정 후 이송','그리퍼 파지 유지 · 지그 안착 확인']},
 {title:'02 · 제대로 검사됐는지 확인합니다',asis:'정해진 검사 경로를 한 번 실행',tobe:'취득 불량 부위를 찾아 관측 자세를 바꾸고 재취득',steps:['동일 부위의 반사·취득 불량 감지','판정 보류 · 관측 각도 변경 결정','H2515의 ABIS 3 관측 자세 조정','같은 부위 재취득 · 취득 상태 확인']},
 {title:'03 · 안착 불량에 대응합니다',asis:'안착 이상 시 정지하고 작업자 조치 대기',tobe:'안착 오차를 확인하고 허용된 재안착 동작 수행',steps:['지그 기준 위치와 도어 안착 위치 비교','안착 불량 판단 · 검사 시작 보류','재파지 → 인양 → 위치 보정 → 재안착','고정 상태 확인 후 검사 재개']}
];
const blend=(a,b,q)=>a+(b-a)*Math.max(0,Math.min(1,q));
export function storyAt(seconds){
 const t=Math.max(0,Math.min(DURATION,seconds)),chapter=Math.min(2,Math.floor(t/30)),u=t-chapter*30,stage=u<6?0:u<11?1:u<25?2:3;
 const ai={pickX:0,pickYaw:0,fixtureX:0,sensorShift:0,acquire:false};let progress;
 if(chapter===0){ai.pickX=.08;ai.pickYaw=.18;progress=u<11?0:u<25?blend(0,.16,(u-11)/14):.16;}
 if(chapter===1){progress=.32;ai.sensorShift=u<11?0:blend(0,-.14,(u-11)/10);ai.acquire=u>=25;}
 if(chapter===2){
  // Retract from the fixture with the same grasp, then lower at the corrected position.
  ai.fixtureX=u<18?.075:blend(.075,0,(u-18)/4);
  progress=u<11?.16:u<15?blend(.16,.1312,(u-11)/4):u<18?blend(.1312,.112,(u-15)/3):u<22?.112:u<25?blend(.112,.16,(u-22)/3):u<28?.16:blend(.20,.23,(u-28)/2);
  ai.acquire=u>=28;
 }
 return {t,u,chapter,stage,progress,ai,...CHAPTERS[chapter],message:CHAPTERS[chapter].steps[stage]};
}
