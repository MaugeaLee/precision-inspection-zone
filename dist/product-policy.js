export const LARGE_PRODUCTS=new Set(['hood','door']);
export const measurementCell=product=>LARGE_PRODUCTS.has(product)?'MMZ':'OINS';
export const acceptsProduct=(cell,product)=>!['MMZ','OINS'].includes(cell)||measurementCell(product)===cell;
export const inspectionRoutes={hood:['VIS','SCAN','MMZ'],door:['VIS','SCAN','MMZ'],doortrim:['VIS','SCAN','OINS'],eaxle:['VIS','OINS'],hblock:['OINS'],rcover:['OINS']};
// Demo recipe assumptions: these variants represent welded panel assemblies.
// Welding is independent of size; never infer NDT eligibility from dimensions.
export const WELDED_PRODUCTS=new Set(['hood','door']);
export const requiresNDT=product=>WELDED_PRODUCTS.has(product);
export const scanBoxFor=product=>LARGE_PRODUCTS.has(product)?'8160':'5130';
export const scanRecipeLabel=product=>'ScanBox '+scanBoxFor(product)+(requiresNDT(product)?' → 초음파 → X-ray':' · 비파괴검사 제외');
export function scanStage(product,p){
 const welded=requiresNDT(product),end=welded?.4:.84;
 return {box:scanBoxFor(product),scan:p>=.16&&p<end,ut:welded&&p>=.4&&p<.65,xray:welded&&p>=.65&&p<.84,scanProgress:(p-.16)/(end-.16),welded};
}
