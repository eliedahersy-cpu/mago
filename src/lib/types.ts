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

export type SocialNetwork = 'instagram' | 'tiktok' | 'facebook' | 'youtube';
