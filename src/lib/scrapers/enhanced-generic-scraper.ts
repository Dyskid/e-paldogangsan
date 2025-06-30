import { BaseScraper, ScraperConfig } from './base-scraper';
import { Product } from '@/types';
import * as cheerio from 'cheerio';
import axios from 'axios';
import iconv from 'iconv-lite';

interface EnhancedScraperConfig extends ScraperConfig {
  productSelector: string;
  nameSelector: string;
  priceSelector: string;
  imageSelector?: string;
  linkSelector?: string;
  descriptionSelector?: string;
  encoding?: string; // Support for different character encodings
  paginationSelector?: string; // For handling pagination
  maxPages?: number; // Limit pages to scrape
  categorySelector?: string; // For extracting categories
  originalPriceSelector?: string; // For sale prices
  waitTime?: number; // Delay between requests
  extractFromScript?: boolean; // Extract data from JavaScript
  scriptPattern?: RegExp; // Pattern to extract from scripts
}

export class EnhancedGenericHTMLScraper extends BaseScraper {
  private enhancedConfig: EnhancedScraperConfig;

  constructor(config: EnhancedScraperConfig) {
    super(config);
    this.enhancedConfig = config;
  }

  async scrapeProducts(): Promise<Product[]> {
    const allProducts: Product[] = [];
    const maxPages = this.enhancedConfig.maxPages || 1;
    
    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = this.getPageUrl(page);
      const products = await this.scrapePage(pageUrl);
      allProducts.push(...products);
      
      // Check if there are more pages
      if (products.length === 0) break;
      
      // Add delay between requests
      if (this.enhancedConfig.waitTime && page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, this.enhancedConfig.waitTime));
      }
    }
    
    return allProducts;
  }

  private getPageUrl(page: number): string {
    if (page === 1) return this.config.baseUrl;
    
    // Handle different pagination patterns
    const url = new URL(this.config.baseUrl);
    url.searchParams.set('page', page.toString());
    return url.toString();
  }

  private async scrapePage(url: string): Promise<Product[]> {
    try {
      // Use axios for better encoding support
      const response = await axios.get(url, {
        headers: this.config.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        responseType: this.enhancedConfig.encoding ? 'arraybuffer' : 'text'
      });

      let html = response.data;
      
      // Handle character encoding if specified
      if (this.enhancedConfig.encoding && response.data instanceof Buffer) {
        html = iconv.decode(response.data, this.enhancedConfig.encoding);
      }

      const $ = cheerio.load(html);
      const products: Product[] = [];

      // Extract products from JavaScript if configured
      if (this.enhancedConfig.extractFromScript && this.enhancedConfig.scriptPattern) {
        const scriptsData = this.extractFromScripts($, this.enhancedConfig.scriptPattern);
        if (scriptsData.length > 0) {
          return this.parseScriptProducts(scriptsData);
        }
      }

      // Standard HTML extraction
      $(this.enhancedConfig.productSelector).each((index, element) => {
        try {
          const $el = $(element);
          
          const name = this.extractText($el, this.enhancedConfig.nameSelector);
          const priceText = this.extractText($el, this.enhancedConfig.priceSelector);
          
          if (!name || !priceText) return;

          const productPath = this.enhancedConfig.linkSelector 
            ? $el.find(this.enhancedConfig.linkSelector).attr('href') || $el.attr('href')
            : $el.attr('href');
          
          const productUrl = this.resolveUrl(productPath);

          const imageUrl = this.enhancedConfig.imageSelector
            ? this.extractImageUrl($el, this.enhancedConfig.imageSelector)
            : undefined;

          const description = this.enhancedConfig.descriptionSelector
            ? this.extractText($el, this.enhancedConfig.descriptionSelector)
            : undefined;

          const category = this.enhancedConfig.categorySelector
            ? this.extractText($el, this.enhancedConfig.categorySelector)
            : this.categorizeProduct(name);

          const originalPrice = this.enhancedConfig.originalPriceSelector
            ? this.extractText($el, this.enhancedConfig.originalPriceSelector)
            : undefined;

          const product: Product = {
            id: this.generateProductId(this.config.mallId, `${index}_${Date.now()}`),
            name,
            price: this.normalizePrice(priceText),
            originalPrice: originalPrice ? this.normalizePrice(originalPrice) : undefined,
            imageUrl: imageUrl ? this.resolveUrl(imageUrl) : '',
            category,
            region: this.config.region || '',
            productUrl,
            description: description || '',
            tags: [],
            featured: false,
            isNew: true,
            mallId: this.config.mallId,
            mallName: this.config.mallName,
            mallUrl: this.config.baseUrl
          };

          products.push(product);
        } catch (error) {
          console.error(`Error parsing product at index ${index}:`, error);
        }
      });

      return products;
    } catch (error) {
      console.error(`Error scraping page ${url}:`, error);
      return [];
    }
  }

  private extractText($el: cheerio.Cheerio, selector: string): string {
    // Handle multiple selector patterns
    if (selector.includes('||')) {
      const selectors = selector.split('||').map(s => s.trim());
      for (const sel of selectors) {
        const text = $el.find(sel).text().trim();
        if (text) return text;
      }
      return '';
    }
    
    return $el.find(selector).text().trim();
  }

  private extractImageUrl($el: cheerio.Cheerio, selector: string): string | undefined {
    const $img = $el.find(selector);
    
    // Try different image attributes
    return $img.attr('src') || 
           $img.attr('data-src') || 
           $img.attr('data-lazy-src') ||
           $img.css('background-image')?.match(/url\(['"]?(.+?)['"]?\)/)?.[1];
  }

  private resolveUrl(path?: string): string {
    if (!path) return this.config.baseUrl;
    
    try {
      return new URL(path, this.config.baseUrl).href;
    } catch {
      // Handle relative paths that might not parse correctly
      if (path.startsWith('/')) {
        const baseUrl = new URL(this.config.baseUrl);
        return `${baseUrl.protocol}//${baseUrl.host}${path}`;
      }
      return this.config.baseUrl;
    }
  }

  private extractFromScripts($: cheerio.CheerioAPI, pattern: RegExp): any[] {
    const results: any[] = [];
    
    $('script').each((_, script) => {
      const scriptContent = $(script).html();
      if (!scriptContent) return;
      
      const matches = scriptContent.match(pattern);
      if (matches && matches[1]) {
        try {
          const data = JSON.parse(matches[1]);
          if (Array.isArray(data)) {
            results.push(...data);
          } else {
            results.push(data);
          }
        } catch (error) {
          console.error('Error parsing script data:', error);
        }
      }
    });
    
    return results;
  }

  private parseScriptProducts(data: any[]): Product[] {
    // Override this method in specific scrapers to handle custom data formats
    return [];
  }

  // Enhanced price normalization
  protected normalizePrice(priceText: string): number {
    // Remove all non-numeric characters except decimal points
    const cleanPrice = priceText
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '');
    
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? 0 : price;
  }
}