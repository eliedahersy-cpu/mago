export type SocialNetwork = 'instagram' | 'tiktok' | 'facebook' | 'youtube';

export interface StoreSettings {
  storeName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  currency: string;
  shippingFlatFee: number;
  freeShippingThreshold: number;
  deliveryAreas: string[];
  socialLinks: Partial<Record<SocialNetwork, string>>;
  announcementBar: string | null;
}

export type ProductType = 'cup' | 'bundle' | 'extra' | 'retail' | 'merch';
export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductImage {
  url: string;
  alt: string;
  kind: 'packshot' | 'lifestyle' | 'video';
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  flavour: string | null;
  type: ProductType;
  status: ProductStatus;
  tagline: string | null;
  sauce: string | null;
  shortDescription: string | null;
  description: string | null;
  story: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  proteinG: number | null;
  prepMinutes: number | null;
  isBestSeller: boolean;
  isFeatured: boolean;
  sortOrder: number;
  badges: string[];
  ingredients: { name: string }[];
  nutrition: { label: string; value: string }[];
  preparation: { title: string; body: string }[];
  flavourProfiles: string[];
  spiceLevel: number;
  textures: string[];
  occasions: string[];
  style: 'lebanese' | 'italian' | 'fusion' | null;
  bundleSize: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  images: ProductImage[];
  collections: { slug: string; title: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  productCount: number;
}

export interface RecipeSummary {
  slug: string;
  title: string;
  subtitle: string | null;
  heroImage: string | null;
  minutes: number;
  tags: string[];
  productName: string | null;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  isVerifiedBuyer: boolean;
}

export interface AutomaticDiscount {
  title: string;
  value: number;
  minCupQuantity: number;
}
