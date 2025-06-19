import { Product } from '@/types';

export interface ScraperConfig {
  mallId: string;
  mallName: string;
  baseUrl: string;
  region?: string;
  headers?: Record<string, string>;
}

export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  abstract scrapeProducts(): Promise<Product[]>;

  protected generateProductId(mallId: string, productId: string): string {
    return `${mallId}_${productId}`;
  }

  protected normalizePrice(price: string): number {
    // Remove all non-numeric characters except commas and convert to number
    const cleanPrice = price.replace(/[^\d,]/g, '').replace(/,/g, '');
    return parseInt(cleanPrice) || 0;
  }

  protected categorizeProduct(productName: string, tags: string[] = []): string {
    const name = productName.toLowerCase();
    const allTags = tags.map(t => t.toLowerCase());

    // Category mapping based on keywords
    if (name.includes('쌀') || name.includes('과일') || name.includes('채소') || 
        allTags.some(t => t.includes('농산물'))) {
      return 'agricultural';
    }
    if (name.includes('생선') || name.includes('해산물') || name.includes('수산') ||
        allTags.some(t => t.includes('수산물'))) {
      return 'seafood';
    }
    if (name.includes('한우') || name.includes('돼지') || name.includes('닭') ||
        allTags.some(t => t.includes('축산'))) {
      return 'livestock';
    }
    if (name.includes('김치') || name.includes('장아찌') || name.includes('젓갈') ||
        allTags.some(t => t.includes('가공'))) {
      return 'processed';
    }
    if (name.includes('인삼') || name.includes('홍삼') || name.includes('한방') ||
        allTags.some(t => t.includes('건강'))) {
      return 'health';
    }
    if (name.includes('전통') || name.includes('한과') || name.includes('떡') ||
        allTags.some(t => t.includes('전통'))) {
      return 'traditional';
    }
    if (name.includes('특산') || name.includes('명품') ||
        allTags.some(t => t.includes('특산'))) {
      return 'specialty';
    }
    if (name.includes('친환경') || name.includes('유기농') || name.includes('무농약') ||
        allTags.some(t => t.includes('친환경'))) {
      return 'eco_friendly';
    }
    if (name.includes('공예') || name.includes('수공예') || name.includes('도자기') ||
        allTags.some(t => t.includes('공예'))) {
      return 'crafts';
    }

    // Default category
    return 'other';
  }
}