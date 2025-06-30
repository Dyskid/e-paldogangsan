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

    // Category mapping based on keywords - check seafood first as it's more specific
    if (name.includes('생선') || name.includes('해산물') || name.includes('수산') ||
        name.includes('전복') || name.includes('새우') || name.includes('멸치') ||
        name.includes('김') || name.includes('미역') || name.includes('다시마') ||
        name.includes('조개') || name.includes('굴') || name.includes('오징어') ||
        name.includes('문어') || name.includes('낙지') || name.includes('갈치') ||
        name.includes('고등어') || name.includes('민어') || name.includes('조기') ||
        name.includes('홍게') || name.includes('꽃게') || name.includes('어촌') ||
        allTags.some(t => t.includes('수산물'))) {
      return 'seafood';
    }
    if (name.includes('한우') || name.includes('돼지') || name.includes('닭') ||
        name.includes('소고기') || name.includes('돼지고기') || name.includes('닭고기') ||
        name.includes('갈비') || name.includes('삼겹살') || name.includes('목살') ||
        allTags.some(t => t.includes('축산'))) {
      return 'livestock';
    }
    if (name.includes('김치') || name.includes('장아찌') || name.includes('젓갈') ||
        name.includes('간장') || name.includes('된장') || name.includes('고추장') ||
        name.includes('액젓') || name.includes('장류') || name.includes('절임') ||
        allTags.some(t => t.includes('가공'))) {
      return 'processed';
    }
    if (name.includes('인삼') || name.includes('홍삼') || name.includes('한방') ||
        name.includes('울금') || name.includes('건강') || name.includes('영양') ||
        name.includes('녹용') || name.includes('벌꿀') || name.includes('꿀') ||
        name.includes('구기자') || name.includes('황칠') ||
        allTags.some(t => t.includes('건강'))) {
      return 'health';
    }
    if (name.includes('전통주') || name.includes('막걸리') || name.includes('동동주') ||
        name.includes('홍주') || name.includes('소주') || name.includes('약주') ||
        name.includes('한과') || name.includes('떡') || name.includes('전통') ||
        allTags.some(t => t.includes('전통'))) {
      return 'traditional';
    }
    if (name.includes('쌀') || name.includes('과일') || name.includes('채소') ||
        name.includes('호박') || name.includes('고구마') || name.includes('감자') ||
        name.includes('배추') || name.includes('무') || name.includes('파') ||
        name.includes('마늘') || name.includes('양파') || name.includes('버섯') ||
        name.includes('곡물') || name.includes('잡곡') ||
        allTags.some(t => t.includes('농산물'))) {
      return 'agricultural';
    }
    if (name.includes('특산') || name.includes('명품') || name.includes('선물세트') ||
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