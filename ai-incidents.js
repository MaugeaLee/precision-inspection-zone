// Scenario events follow the same progress ranges as the physical recovery animation.
export function incidentAt(p){
 if(p>=.28&&p<.58)return {id:'fixture',title:'검사물 안착 오차',phase:p<.31?0:p<.34?1:p<.54?2:3,steps:['기준 위치 이탈 감지 · 검사 시작 보류','재파지·재안착 경로 선택','HDR50-22 재파지 → 인양 → 위치 보정 → 재안착','안착 위치 확인 · 검사 재개'],result:'안착 오차 보정 완료'};
 if(p>=.65&&p<.84)return {id:'vision',title:'반사·가림에 의한 취득 불량',phase:p<.675?0:p<.70?1:p<.77?2:3,steps:['검사 영상 품질 저하 감지 · 해당 부위 판정 보류','같은 부위의 관측 자세 변경 선택','H2515·ABIS 3 자세 보정 → 같은 부위 재취득','취득 상태 확인 · 검사 경로 복귀'],result:'취득 불량 복구 완료'};
 return null;
}
export function createIncidentTracker(){
 let seen=new Set(),lastTime=-1,last=null,count=0;
 const ranges=[[.28,.31,.34,.54,.58],[.65,.675,.70,.77,.84]];
 return {update(engine,ai){
  if(engine.time<lastTime){seen.clear();last=null;count=0;}lastTime=engine.time;
  const c=engine.cells.VIS,active=ai?incidentAt(c.progress):null;
  if(ai&&!ai.held)for(const range of ranges){
   const event=incidentAt(range[0]);
   for(let phase=0;phase<5;phase++){
    const key=ai.sample+':'+event.id+':'+phase;
    if(c.progress<range[phase]||seen.has(key))continue;
    seen.add(key);
    if(phase===4){count++;last={...event,sample:ai.sample};}
    engine.emit(phase===0?'warn':'info','AI 문제 대응 · '+event.title,{obs:ai.sample+' · '+['감지','판단','복구','확인','완료'][phase],dec:phase===4?event.result:event.steps[phase],act:phase===4?'복구 확인 후 정상 공정 계속':'시나리오 모사'});
   }
  }
  c.aiIncident=active;
  return {active:active?{...active,sample:ai.sample}:null,last,count,held:!!ai?.held};
 },reset(){seen.clear();lastTime=-1;last=null;count=0;}};
}
