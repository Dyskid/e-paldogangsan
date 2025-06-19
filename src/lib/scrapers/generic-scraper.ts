import { BaseScraper, ScraperConfig } from './base-scraper';
import { Product } from '@/types';
import * as cheerio from 'cheerio';

interface GenericScraperConfig extends ScraperConfig {
  productSelector: string;
  nameSelector: string;
  priceSelector: string;
  imageSelector?: string;
  linkSelector?: string;
  descriptionSelector?: string;
}

export class GenericHTMLScraper extends BaseScraper {
  private genericConfig: GenericScraperConfig;

  constructor(config: GenericScraperConfig) {
    super(config);
    this.genericConfig = config;
  }

  async scrapeProducts(): Promise<Product[]> {
    try {
      const response = await fetch(this.config.baseUrl, {
        headers: this.config.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const products: Product[] = [];

      $(this.genericConfig.productSelector).each((index, element) => {
        try {
          const $el = $(element);
          
          const name = $el.find(this.genericConfig.nameSelector).text().trim();
          const price = $el.find(this.genericConfig.priceSelector).text().trim();
          
          if (!name || !price) return;

          const productPath = this.genericConfig.linkSelector 
            ? $el.find(this.genericConfig.linkSelector).attr('href') 
            : $el.attr('href');
          
          const productUrl = productPath 
            ? new URL(productPath, this.config.baseUrl).href 
            : this.config.baseUrl;

          const imageUrl = this.genericConfig.imageSelector
            ? $el.find(this.genericConfig.imageSelector).attr('src')
            : undefined;

          const description = this.genericConfig.descriptionSelector
            ? $el.find(this.genericConfig.descriptionSelector).text().trim()
            : undefined;

          const product: Product = {
            id: this.generateProductId(this.config.mallId, `${index}_${Date.now()}`),
            name,
            price: this.normalizePrice(price),
            image: imageUrl ? new URL(imageUrl, this.config.baseUrl).href : '',
            category: this.categorizeProduct(name),
            region: this.config.region || '',
            url: productUrl,
            description: description || '',
            tags: [],
            isFeatured: false,
            isNew: true,
            mall: {
              mallId: this.config.mallId,
              mallName: this.config.mallName,
              mallUrl: this.config.baseUrl,
              region: this.config.region || ''
            }
          };

          products.push(product);
        } catch (error) {
          console.error(`Error parsing product at index ${index}:`, error);
        }
      });

      return products;
    } catch (error) {
      console.error(`Error scraping ${this.config.mallName}:`, error);
      return [];
    }
  }
}