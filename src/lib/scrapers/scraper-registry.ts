import { GenericHTMLScraper } from './generic-scraper';
import { BaseScraper } from './base-scraper';

interface ScraperDefinition {
  type: 'generic' | 'custom';
  config: any;
}

// Mall-specific scraper configurations
export const scraperRegistry: Record<string, ScraperDefinition> = {
  // Updated configurations for merged malls
  'mall_1_온서울마켓': {
    type: 'generic',
    config: {
      mallId: 'mall_1_온서울마켓',
      mallName: '온서울마켓',
      baseUrl: 'https://on.seoul.go.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_2_부산브랜드몰': {
    type: 'generic',
    config: {
      mallId: 'mall_2_부산브랜드몰',
      mallName: '부산브랜드몰',
      baseUrl: 'https://busanbrand.kr',
      productSelector: '.item-box',
      nameSelector: '.item-title',
      priceSelector: '.item-price',
      imageSelector: '.item-img img',
      linkSelector: 'a.item-link'
    }
  },
  // Generic configurations for other major malls
  'mall_15_강원더몰': {
    type: 'generic',
    config: {
      mallId: 'mall_15_강원더몰',
      mallName: '강원더몰',
      baseUrl: 'https://gwdmall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_51_남도장터': {
    type: 'generic',
    config: {
      mallId: 'mall_51_남도장터',
      mallName: '남도장터',
      baseUrl: 'https://jnmall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_68_사이소_경북몰_': {
    type: 'generic',
    config: {
      mallId: 'mall_68_사이소_경북몰_',
      mallName: '사이소(경북몰)',
      baseUrl: 'https://www.cyso.co.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_99_제주몰': {
    type: 'generic',
    config: {
      mallId: 'mall_99_제주몰',
      mallName: '제주몰',
      baseUrl: 'https://www.jejumall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  }
  // Add more mall configurations as needed
};

export function createScraper(mallId: string): BaseScraper | null {
  const definition = scraperRegistry[mallId];
  
  if (!definition) {
    console.warn(`No scraper configuration found for mall: ${mallId}`);
    return null;
  }

  switch (definition.type) {
    case 'generic':
      return new GenericHTMLScraper(definition.config);
    // Add more scraper types as needed
    default:
      return null;
  }
}