export interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
  logo?: string;
}

export interface Region {
  id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  mall_count: number;
  highlight_text: string;
}

export interface Category {
  id: string;
  name_ko: string;
  name_en: string;
  color_theme: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

export interface ProductSyncStatus {
  mallId: string;
  mallName: string;
  lastSyncTime: string;
  productCount: number;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}