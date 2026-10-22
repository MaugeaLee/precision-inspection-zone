import {makeProduct} from './shapes.js';
import {KIT} from './original/factory.js';
import {InspZone,INSP} from './original/inspzone.js';

export const PRODUCTS=INSP.products;
export const ROUTES=INSP.routes;
export const CELL_SHORT={DOCK:'접수·도킹',VIS:'ABIS III · AIMAX',SCAN:'3D 스캔·UT',OINS:'O-INSPECT',MMZ:'MMZ M',JUDGE:'AI 판정'};
export const RESULT={ok:'OK',unc:'불확실',ng:'NG'};
export const vehicleState={park:'대기·충전',out:'반입 구역으로 이동',load:'샘플 인수',in:'시료 접수로 이송',queue:'접수 대기',move:'검사 셀로 이동',work:'검사 중',ready:'후속 셀 대기',home:'스테이션 복귀'};

// The original inspection equipment and state machine run independently of the other Zones.
// Manufacturing sample requests and feedback acknowledgements are explicitly simulated here.
export class InspectionSession extends InspZone {
  constructor(scene){
    super(scene);
    this.events=[];this.records=[];this.trace=[];this.listeners=new Set();
    this.equipment=Object.fromEntries(this.order.map(c=>[c.id,{state:'IDLE',remaining:0,busy:false}]));
    this.sim={mode:{key:'dark'},seed:42,stats:{goodBy:{}},movers:[],extMovers:[],log:(level,title,detail)=>this.emit(level,title,detail),zoneCell:(_zone,id)=>this.equipment[id],fos:{sampleAccept:(req,id)=>this.emit('info','AMR 배차 · '+req.id,{obs:PRODUCTS[req.product][1]+' 검사 요청',dec:'Handling Agent · 운반 자원 배정',act:id+' → 샘플 반입 구역'}),sampleHandover:it=>this.emit('info','샘플 인계 확인 · '+it.id,{obs:it.serial,dec:'제품 ID·작업정보 대조',act:'접수·도킹 대기열 진입'}),sampleResult:(it,res)=>{if(res==='ng')this.emit('ng','선행공정 품질 환류 요청',{obs:INSP.zones[it.zone]+' · '+PRODUCTS[it.product][1],dec:'제품 보류·로트 영향 범위 검토 요청',act:'리워크 검토·공정 보정·샘플링 강화 요청 (모사)'});}}};
    this.restart('dark');
  }
  restart(mode='dark'){
    this.events=[];this.records=[];this.trace=[];
    for(const c of Object.values(this.equipment))Object.assign(c,{state:'IDLE',remaining:0,busy:false});
    mode='dark';this.sim.mode.key=mode;super.setup(this.sim,null,true);this.wallG.visible=false;
    this.sourceTimer=0;this.autoIndex=0;this.sim.extMovers=this.carriers.map(c=>this.tele(c));
    this.emit('info','정밀검사존 준비 완료',{obs:'5개 사업계획 셀 · 검사 AMR 3대',dec:'피지컬AI 시연 모드',act:'샘플 반입 요청 대기'});
  }
  onEvent(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  emit(level,title,detail={}){
    if(title.includes('샘플 수거 배차'))detail={obs:'단독 존의 샘플 요청을 모사합니다.',dec:'검사 레시피·운반 자원 확인',act:'선택 제품의 생산 Zone 샘플 반입 구역으로 이동'};
    const event={time:this.time??0,level,title:title.replace(/^정밀검사 /,''),...detail};
    this.events?.unshift(event);if(this.events?.length>200)this.events.length=200;
    this.listeners?.forEach(fn=>fn(event));
  }
  enqueue(product,scenario='ok'){
    if(!PRODUCTS[product])throw new Error('알 수 없는 제품');
    if(this.queue.length>=12)return false;
    const zone=PRODUCTS[product][0],id=`QS-${String(++this.seq).padStart(4,'0')}`;
    const req={id,serial:`DEMO-${product.toUpperCase()}-${String(this.seq).padStart(4,'0')}`,zone,product,scenario,t0:this.time,stageTrace:[]};
    this.queue.push(req);this.stats.samples++;
    this.emit('info','샘플 접수 요청 · '+id,{obs:INSP.zones[zone]+' / '+PRODUCTS[product][1],dec:'검사 레시피: '+ROUTES[product].map(k=>CELL_SHORT[k]).join(' → '),act:'검사 AMR 배차 대기'});
    return true;
  }
  attach(c){const m=makeProduct(c.item.product);m.position.set(0,KIT.BELT_Y-.02,0);c.g.add(m);c.pm=m;}
  sampleTick(){} // Production throughput is outside this independent Zone.
  go(c,pts,state){
    if(state==='out'){
      const pickupX=[33.5,37,40.5][{main:0,flex:1,adapt:2}[c.item.zone]];
      pts=[{x:c.x,z:c.z},{x:c.x,z:7.8},{x:29.4,z:7.8},{x:29.4,z:-31.5},{x:pickupX,z:-31.5}];
    }else if(state==='in'){
      pts=[{x:c.x,z:c.z},{x:this.entryX(c.i),z:-31.5},{x:this.entryX(c.i),z:INSP.entryZ}];
    }
    super.go(c,pts,state);
  }
  tick(dt,halted,auto){
    if(!halted){
      for(const [id,e]of Object.entries(this.equipment))if(e.remaining>0){
        const before=e.remaining;e.remaining=Math.max(0,e.remaining-dt);
        if(before>18&&e.remaining<=18){e.state='MAINT';this.emit('warn',CELL_SHORT[id]+' · 점검 진행',{act:'Asset Management Agent · 복구 조건 확인'});}
        if(e.remaining===0){e.state='IDLE';this.emit('info',CELL_SHORT[id]+' · 복구 확인',{obs:'점검 완료 신호 (모사)',dec:'작업 재개 조건 확인',act:'미완료 검사부터 재개'});}
      }
      if(auto){this.sourceTimer+=dt;if(this.sourceTimer>=65&&this.queue.length<4){this.sourceTimer=0;const products=['hood','hblock','eaxle','doortrim','rcover','door'];const scenarios=['ok','uncertain','ng','ok','ok','auto'];const i=this.autoIndex++%6;this.enqueue(products[i],scenarios[i]);}}
    }
    super.step(dt,halted);
    for(const c of this.carriers){
      if(c.state==='work'&&c.item&&c.item.stageTrace?.at(-1)?.cell!==c.at){
        const entry={cell:c.at,time:this.time};c.item.stageTrace.push(entry);this.trace.push({sample:c.item.id,product:c.item.product,...entry});
        this.emit('info',CELL_SHORT[c.at]+' 시작 · '+c.item.id,{obs:PRODUCTS[c.item.product][1],act:c.at==='JUDGE'?'검사 누락·데이터 유효성 확인 후 판정':this.cells[c.at].def.use});
      }
    }
  }
  judge(c,cell){
    const it=c.item,original=this.rng;
    if(it.scenario==='ok')this.rng=()=>.95;
    else if(it.scenario==='ng')this.rng=()=>.08;
    else if(it.scenario==='uncertain')this.rng=()=>it.rechecked ? .95 : .01;
    try{super.judge(c,cell);}finally{this.rng=original;}
  }
  push(it,res){
    super.push(it,res);
    this.records.push({sample_id:it.id,product_id:it.serial,product:PRODUCTS[it.product][1],source_zone:INSP.zones[it.zone],time_seconds:Math.round(this.time),result:RESULT[res],remeasured:!!it.rechecked,route:it.stageTrace.map(s=>s.cell).join(' → '),scenario:it.scenario,source:'simulation'});
    if(res==='ok')this.emit('info','OK 판정 · '+it.id,{obs:'필수 검사 완료 · 시나리오 기준 충족',dec:'Quality & Recovery Agent · 정상 반출',act:'QMS 품질이력 기록 · AMR 복귀'});
  }
  injectFault(id='VIS'){
    const e=this.equipment[id];if(!e||e.remaining>0)return false;
    e.state='DOWN';e.remaining=45;
    this.emit('warn',CELL_SHORT[id]+' · 설비 이상 발생',{obs:'장비 이상 신호 주입 (모사)',dec:'해당 셀 검사 보류 · 제품 상태 유지',act:'점검 → 복구 조건 확인 → 검사 재개'});return true;
  }
}
