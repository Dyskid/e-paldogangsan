import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface GmsocialProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  categoryCode: string;
  vendor?: string;
  description?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class GmsocialRobustScraper {
  private baseUrl = 'https://gmsocial.or.kr/mall/';
  private products: GmsocialProduct[] = [];
  private processedProductIds = new Set<string>();
  private maxRetries = 3;
  private requestTimeout = 10000; // Reduced timeout

  async run() {
    console.log('🚀 Starting robust Gmsocial.or.kr scraping...');
    
    try {
      // Start with food category (most likely to have products)
      const foodCategory = {
        code: "0006",
        name: "식품",
        url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0006"
      };
      
      console.log(`\n📂 Processing food category: ${foodCategory.name}`);
      await this.scrapeCategoryRobust(foodCategory);
      
      // Then try other main categories
      const otherCategories = [
        { code: "0001", name: "생활/리빙", url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0001" },
        { code: "0002", name: "패션/뷰티", url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0002" },
        { code: "0003", name: "디지털/가전", url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0003" },
        { code: "0004", name: "가구/인테리어", url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0004" },
        { code: "0005", name: "스포츠/레저", url: "https://gmsocial.or.kr/mall/goods/list.php?category_code=0005" }
      ];
      
      for (const category of otherCategories) {
        console.log(`\n📂 Processing category: ${category.name}`);
        await this.scrapeCategoryRobust(category);
        await this.delay(3000); // Longer delay between categories
      }
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      // Save partial results even if there's an error
      if (this.products.length > 0) {
        await this.saveResults();
      }
      throw error;
    }
  }

  private async scrapeCategoryRobust(category: any) {
    let page = 1;
    let hasNextPage = true;
    let consecutiveEmptyPages = 0;
    
    while (hasNextPage && consecutiveEmptyPages < 3 && page <= 10) { // Safety limits
      try {
        const categoryUrl = `${category.url}&page=${page}`;
        console.log(`    📄 Scraping page ${page}: ${categoryUrl}`);
        
        const productUrls = await this.getCategoryProductUrls(categoryUrl);
        
        if (productUrls.length === 0) {
          consecutiveEmptyPages++;
          console.log(`    ⚠️  No products found on page ${page} (empty pages: ${consecutiveEmptyPages})`);
          if (consecutiveEmptyPages >= 3) {
            hasNextPage = false;
            break;
          }
        } else {
          consecutiveEmptyPages = 0;
          console.log(`    Found ${productUrls.length} products on page ${page}`);
          
          // Process products with better error handling
          for (const productUrl of productUrls) {
            try {
              const productId = this.extractProductId(productUrl);
              if (productId && !this.processedProductIds.has(productId)) {
                const product = await this.scrapeProductWithRetry(productUrl, category);
                if (product) {
                  this.products.push(product);
                  this.processedProductIds.add(productId);
                  console.log(`      ✅ Scraped: ${product.title} - ${product.price}`);
                } else {
                  console.log(`      ⚠️  Failed to scrape product ${productId}`);
                }
                await this.delay(1000); // Delay between products
              }
            } catch (error) {
              console.error(`      ❌ Error processing product ${productUrl}:`, error.message);
            }
          }
        }
        
        page++;
        await this.delay(2000); // Delay between pages
        
      } catch (error) {
        console.error(`    ❌ Error scraping page ${page} of category ${category.name}:`, error.message);
        consecutiveEmptyPages++;
        page++;
      }
    }
  }

  private async getCategoryProductUrls(categoryUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(categoryUrl, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const productUrls = new Set<string>();
      
      // Look for product links with various selectors
      const linkSelectors = [
        'a[href*="view.php?product_id="]',
        'a[href*="goods/view.php"]',
        'a[href*="product_id="]',
        '.item a',
        '.goods_item a',
        '.product_item a'
      ];
      
      for (const selector of linkSelectors) {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href && href.includes('product_id=')) {
            let fullUrl = href;
            if (href.startsWith('/')) {
              fullUrl = 'https://gmsocial.or.kr' + href;
            } else if (href.startsWith('goods/')) {
              fullUrl = 'https://gmsocial.or.kr/mall/' + href;
            } else if (!href.startsWith('http')) {
              fullUrl = 'https://gmsocial.or.kr/mall/goods/' + href;
            }
            productUrls.add(fullUrl);
          }
        });
      }
      
      return Array.from(productUrls);
      
    } catch (error) {
      console.error(`    ❌ Error fetching category page: ${error.message}`);
      return [];
    }
  }

  private async scrapeProductWithRetry(productUrl: string, category: any): Promise<GmsocialProduct | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const product = await this.scrapeProductPage(productUrl, category);
        if (product) {
          return product;
        }
      } catch (error) {
        console.error(`      ❌ Attempt ${attempt}/${this.maxRetries} failed for ${productUrl}: ${error.message}`);
        if (attempt < this.maxRetries) {
          await this.delay(2000 * attempt); // Exponential backoff
        }
      }
    }
    return null;
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/product_id=(\d+)/);
    return match ? match[1] : null;
  }

  private async scrapeProductPage(productUrl: string, category: any): Promise<GmsocialProduct | null> {
    const response = await axios.get(productUrl, {
      timeout: this.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const productId = this.extractProductId(productUrl);
    
    if (!productId) return null;
    
    const title = this.extractTitle($);
    const price = this.extractPrice($);
    const imageUrl = this.extractImageUrl($);
    const vendor = this.extractVendor($);
    
    if (!title || !price) {
      return null;
    }
    
    return {
      id: productId,
      title: title.trim(),
      price: price.trim(),
      imageUrl: imageUrl || '',
      productUrl,
      category: category.name,
      categoryCode: category.code,
      vendor: vendor || '',
      description: '',
      mallId: 'gmsocial',
      mallName: '광명가치몰',
      mallUrl: this.baseUrl,
      region: '경기도 광명시'
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_name',
      '.product_name',
      '.goods_title',
      '.product_title',
      'h1',
      '.title'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    return '';
  }

  private extractPrice($: cheerio.CheerioAPI): string {
    const selectors = [
      '.price',
      '.goods_price',
      '.product_price',
      '.sale_price',
      '.final_price'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && (text.includes('원') || text.includes('₩') || /\d+/.test(text))) {
        return text;
      }
    }
    return '';
  }

  private extractImageUrl($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_image img',
      '.product_image img',
      '.main_image img',
      'img'
    ];
    
    for (const selector of selectors) {
      const src = $(selector).first().attr('src');
      if (src && src.includes('.jpg') || src.includes('.png') || src.includes('.gif')) {
        if (src.startsWith('/')) {
          return 'https://gmsocial.or.kr' + src;
        } else if (src.startsWith('http')) {
          return src;
        }
      }
    }
    return '';
  }

  private extractVendor($: cheerio.CheerioAPI): string {
    const selectors = [
      '.seller_name',
      '.vendor_name',
      '.shop_name',
      '.brand_name'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    return '';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save products
    const productsFile = path.join(outputDir, 'gmsocial-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '광명가치몰',
      mallUrl: this.baseUrl,
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      categoriesScraped: [...new Set(this.products.map(p => p.category))],
      productsByCategory: this.products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priceRange: this.products.length > 0 ? {
        min: Math.min(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      } : { min: 0, max: 0 },
      sampleProducts: this.products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.productUrl
      }))
    };
    
    const summaryFile = path.join(outputDir, 'gmsocial-scrape-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📊 Results saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);
    console.log(`   Total products: ${this.products.length}`);
    console.log(`   Categories: ${Object.keys(summary.productsByCategory).length}`);
  }

  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }
}

// Run the scraper
async function main() {
  const scraper = new GmsocialRobustScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}