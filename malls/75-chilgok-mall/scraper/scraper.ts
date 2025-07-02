import puppeteer from 'puppeteer';
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

class Mall75Scraper {
  private baseUrl = 'https://cgmall.cyso.co.kr/';
  private mallId = 75;
  private mallName = 'chilgok-mall';
  private products: Product[] = [];

  async scrape() {
    console.log(`Starting scraper for ${this.mallName} (ID: ${this.mallId})`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to main page
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Get categories
      const categories = await this.getCategories(page);
      console.log(`Found ${categories.length} categories`);
      
      // Scrape products from each category
      for (const category of categories) {
        console.log(`Scraping category: ${category.name}`);
        await this.scrapeCategory(page, category);
      }
      
      // Save results
      this.saveResults();
      console.log(`Scraping completed. Total products: ${this.products.length}`);
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      await browser.close();
    }
  }

  private async getCategories(page: puppeteer.Page) {
    try {
      const categories = await page.evaluate(() => {
        const cats: any[] = [];
        const selectors = ['.category a', '.nav-category a', '.menu-category a'];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, i) => {
            const href = el.getAttribute('href');
            const name = el.textContent?.trim();
            
            if (href && name) {
              cats.push({ name, url: href, id: `cat${i}` });
            }
          });
          
          if (cats.length > 0) break;
        }
        
        return cats;
      });
      
      return categories.slice(0, 20).map(cat => ({
        ...cat,
        url: new URL(cat.url, this.baseUrl).toString()
      }));
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  private async scrapeCategory(page: puppeteer.Page, category: any) {
    try {
      await page.goto(category.url, { waitUntil: 'networkidle2' });
      
      // Extract products
      const products = await page.evaluate((categoryName, mallId, mallName) => {
        const items: Product[] = [];
        const productSelectors = ['.product-item', '.item', '.goods'];
        
        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(el => {
            const nameEl = el.querySelector('.name, .title, .product-name');
            const priceEl = el.querySelector('.price, .cost');
            const imgEl = el.querySelector('img');
            const linkEl = el.querySelector('a');
            
            const name = nameEl?.textContent?.trim();
            const price = priceEl?.textContent?.trim();
            const imageUrl = imgEl?.getAttribute('src') || '';
            const productUrl = linkEl?.getAttribute('href') || '';
            
            if (name && price) {
              items.push({
                id: `${mallId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                price: price.replace(/[^0-9]/g, ''),
                imageUrl,
                productUrl,
                category: categoryName,
                mallId,
                mallName
              });
            }
          });
          
          if (items.length > 0) break;
        }
        
        return items;
      }, category.name, this.mallId, this.mallName);
      
      // Fix relative URLs
      products.forEach(product => {
        if (product.imageUrl) {
          product.imageUrl = new URL(product.imageUrl, this.baseUrl).toString();
        }
        if (product.productUrl) {
          product.productUrl = new URL(product.productUrl, this.baseUrl).toString();
        }
      });
      
      this.products.push(...products);
      
      // Check for pagination and scrape additional pages if needed
      // Limited to 5 pages per category
      
    } catch (error) {
      console.error(`Failed to scrape category ${category.name}:`, error);
    }
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
const scraper = new Mall75Scraper();
scraper.scrape().catch(console.error);
