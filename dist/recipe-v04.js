export function defaultRecipe(p){return {vision:['hood','door'].includes(p)?'both':['doortrim','eaxle'].includes(p)?'feature':'none',scan:['hood','door','doortrim'].includes(p)?'5130':'none',ndt:['hood','door'].includes(p)?'ut':p==='eaxle'?'xray':'none',ndtOrder:'ut-first',measure:true};}
export const recipeFor=(p,r)=>({...defaultRecipe(p),...r});
export const requiresNDT=(p,r)=>recipeFor(p,r).ndt!=='none';
export const scanBoxFor=(p,r)=>recipeFor(p,r).scan;
export function routeFor(p,r){const v=recipeFor(p,r);return [...(v.vision!=='none'?['VIS']:[]),...(v.scan!=='none'||v.ndt!=='none'?['SCAN']:[]),...(v.measure?[['hood','door'].includes(p)?'MMZ':'OINS']:[])];}
export const inspectionRoutes=Object.fromEntries(['hood','door','doortrim','eaxle','hblock','rcover'].map(p=>[p,routeFor(p)]));
export function scanRecipeLabel(p,r){const v=recipeFor(p,r),ndt=v.ndt==='both'?(v.ndtOrder==='xray-first'?['X-ray','초음파']:['초음파','X-ray']):v.ndt==='ut'?['초음파']:v.ndt==='xray'?['X-ray']:[];return [...(v.scan!=='none'?['ScanBox '+v.scan]:[]),...ndt].join(' → ')||'검사 제외';}
export function scanStage(p,progress,recipe){
 const r=recipeFor(p,recipe),steps=[];if(r.scan!=='none')steps.push('scan');if(r.ndt==='both')steps.push(...(r.ndtOrder==='xray-first'?['xray','ut']:['ut','xray']));else if(r.ndt!=='none')steps.push(r.ndt);
 const span=.56/Math.max(1,steps.length),index=Math.floor((progress-.20)/span),kind=steps[index],start=.20+index*span,end=start+span,q=(progress-start)/span;
 const active=progress>=.20&&progress<.76;
 return {box:r.scan,scan:active&&kind==='scan',ut:active&&kind==='ut',xray:active&&kind==='xray',scanProgress:q,utProgress:q,xrayProgress:q,start,end,kind,steps,analysis:progress>=.76&&progress<.84};
}
export function visionRange(p,recipe,sensor){const r=recipeFor(p,recipe),surface=sensor==='ABIS';if(r.vision==='none'||(surface&&r.vision==='feature')||(!surface&&r.vision==='surface'))return null;return r.vision==='both'?(surface?[.20,.46]:[.49,.76]):[.20,.76];}
