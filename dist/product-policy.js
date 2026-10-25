export const LARGE_PRODUCTS=new Set(['hood','door']);
export const measurementCell=product=>LARGE_PRODUCTS.has(product)?'MMZ':'OINS';
export const acceptsProduct=(cell,product)=>!['MMZ','OINS'].includes(cell)||measurementCell(product)===cell;
export const inspectionRoutes={hood:['VIS','SCAN','MMZ'],door:['VIS','SCAN','MMZ'],doortrim:['VIS','SCAN','OINS'],eaxle:['VIS','OINS'],hblock:['OINS'],rcover:['OINS']};
