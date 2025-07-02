import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: number;
  mallName: string;
}

class MallundefinedScraper {
  private baseUrl = 'https://esmall.cyso.co.kr/';
  private mallId = undefined;
  private mallName = 'uiseong-market-day';
  private products: Product[] = [];

  async scrape() {
    console.log(`Starting scraper for ${this.mallName} (ID: ${this.mallId})`);
    
    try {
      // Scrape categories
      const categories = await this.getCategories();
      console.log(`Found ${categories.length} categories`);
      
      // Scrape products from each category
      for (const category of categories) {
        console.log(`Scraping category: ${category.name}`);
        await this.scrapeCategory(category);
      }
      
      // Save results
      this.saveResults();
      console.log(`Scraping completed. Total products: ${this.products.length}`);
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  }

  private async getCategories() {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const categories: any[] = [];
      
      // Extract categories based on analysis
      const categorySelectors = ['.category a', '.nav-category a', '.menu-category a'];
      
      for (const selector of categorySelectors) {
        $(selector).each((i, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          const name = $el.text().trim();
          
          if (href && name) {
            const url = new URL(href, this.baseUrl).toString();
            categories.push({ name, url, id: `cat${i}` });
          }
        });
        
        if (categories.length > 0) break;
      }
      
      return categories.slice(0, 20); // Limit categories
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  private async scrapeCategory(category: any) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 5) { // Limit pages per category
      const url = this.buildCategoryUrl(category.url, page);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const productCount = this.extractProducts($, category.name);
        
        if (productCount === 0) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Rate limiting
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to scrape page ${page} of ${category.name}:`, error);
        hasMore = false;
      }
    }
  }

  private buildCategoryUrl(categoryUrl: string, page: number): string {
    const separator = categoryUrl.includes('?') ? '&' : '?';
    return `${categoryUrl}${separator}page=${page}`;
  }

  private extractProducts($: cheerio.CheerioAPI, categoryName: string): number {
    let productCount = 0;
    const productSelectors = ['.product-item', '.item', '.goods'];
    
    for (const selector of productSelectors) {
      $(selector).each((i, el) => {
        const $product = $(el);
        
        const name = $product.find('.name').text().trim();
        const price = $product.find('.price').text().trim();
        const imageUrl = $product.find('img').attr('src') || '';
        const productLink = $product.find('a').attr('href') || '';
        
        if (name && price) {
          const product: Product = {
            id: `${this.mallId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            price: this.normalizePrice(price),
            imageUrl: new URL(imageUrl, this.baseUrl).toString(),
            productUrl: new URL(productLink, this.baseUrl).toString(),
            category: categoryName,
            mallId: this.mallId,
            mallName: this.mallName
          };
          
          this.products.push(product);
          productCount++;
        }
      });
      
      if (productCount > 0) break;
    }
    
    return productCount;
  }

  private normalizePrice(price: string): string {
    return price.replace(/[^0-9]/g, '');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `products-${this.mallId}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(this.products, null, 2));
    console.log(`Results saved to ${outputFile}`);
  }
}

// Run the scraper
const scraper = new MallundefinedScraper();
scraper.scrape().catch(console.error);
