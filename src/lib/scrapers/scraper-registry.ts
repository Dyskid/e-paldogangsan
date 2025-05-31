import { GenericHTMLScraper } from './generic-scraper';
import { BaseScraper } from './base-scraper';

interface ScraperDefinition {
  type: 'generic' | 'custom';
  config: any;
}

// Mall-specific scraper configurations
export const scraperRegistry: Record<string, ScraperDefinition> = {
  // Example configurations for some malls
  'on-seoul': {
    type: 'generic',
    config: {
      mallId: 'on-seoul',
      mallName: '온서울마켓',
      baseUrl: 'https://on.seoul.go.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'busanbrand': {
    type: 'generic',
    config: {
      mallId: 'busanbrand',
      mallName: '부산브랜드몰',
      baseUrl: 'https://busanbrand.kr',
      productSelector: '.item-box',
      nameSelector: '.item-title',
      priceSelector: '.item-price',
      imageSelector: '.item-img img',
      linkSelector: 'a.item-link'
    }
  },
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