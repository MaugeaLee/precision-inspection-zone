export const LARGE_PRODUCTS=new Set(['hood','door']);
export const measurementCell=product=>LARGE_PRODUCTS.has(product)?'MMZ':'OINS';
export const acceptsProduct=(cell,product)=>!['MMZ','OINS'].includes(cell)||measurementCell(product)===cell;
export {defaultRecipe,recipeFor,routeFor,inspectionRoutes,requiresNDT,scanBoxFor,scanRecipeLabel,scanStage,visionRange} from './recipe-v04.js';