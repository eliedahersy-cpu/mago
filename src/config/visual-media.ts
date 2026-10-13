/**
 * MAGO replaceable visual slots.
 *
 * Replace any 'src' path with the final approved image saved under /public.
 * The gallery and recipe pages automatically use these slots. Keep original
 * packaging art and labels unaltered when preparing replacement files.
 *
 * Mix Box 1: closed carton hero. Slots 2–4 intentionally use the existing
 * open-box photo with different framing until distinct approved angles arrive.
 * No false extra product photographs are manufactured.
 */
export type MixGalleryImage = {
  id: string;
  src: string;
  alt: string;
  label: string;
  position?: string;
  zoom?: number;
};

export const mixBoxGallery: MixGalleryImage[] = [
  {id:'closed',src:'/products/mago-mix-box.webp',alt:'MAGO five-cup mix box, closed front view',label:'Closed box',zoom:1.13},
  {id:'open',src:'/products/mago-mix-box-open.webp',alt:'MAGO mix box opened with five pasta cups inside',label:'Open box',zoom:1.05},
  {id:'detail',src:'/products/mago-mix-box-open.webp',alt:'Detail of the five MAGO cups inside the open mix box',label:'Cup arrangement',position:'center 35%',zoom:1.35},
  {id:'inside',src:'/products/mago-mix-box-open.webp',alt:'Inside view of the MAGO five-cup mix',label:'Inside the box',position:'center 65%',zoom:1.2},
];

/**
 * Use the recipe slug as the key for an optional imagery override.
 * The published recipe database already has a hero_image field.
 * These code-level overrides let approved assets be staged before changing
 * the database. Empty config => use the existing recipe's hero_image.
 *
 * Example:
 * 'spicy-muhammara-fusilli-roasted-veggies': '/recipes/muhammara-veggies.webp',
 */
export const recipeImageOverrides: Record<string,string> = {};

export function recipeImage(slug:string, fallback:string|null):string {
  return recipeImageOverrides[slug] || fallback || '/products/fusilli-spicy-muhammara.webp';
}
