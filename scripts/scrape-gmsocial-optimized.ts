import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface GmsocialProduct {
  id: string;
  title: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

class GmsocialOptimizedScraper {
  private baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  private products: GmsocialProduct[] = [];
  private processedIds = new Set<string>();

  async run() {
    console.log('🚀 Starting optimized 광명가치몰 scraping...');
    
    try {
      // Scrape known product IDs based on previous verification
      const knownIds = [
        105, 104, 103, 78, 77, 76, 70, 66, 59, 53, 52, 50,
        79, 80, 81, 106, 89, 63, 62, 58, 65, 61, 60, 56,
        68, 69, 71, 72, 73, 88, 111, 121, 54, 51, 49, 107,
        110, 108
      ];
      
      // Additional IDs to check (expand range)
      for (let id = 1; id <= 130; id++) {
        if (!knownIds.includes(id)) {
          knownIds.push(id);
        }
      }
      
      console.log(`📋 Checking ${knownIds.length} product IDs...`);
      
      // Batch process for efficiency
      const batchSize = 10;
      for (let i = 0; i < knownIds.length; i += batchSize) {
        const batch = knownIds.slice(i, i + batchSize);
        const promises = batch.map(id => this.scrapeProduct(id));
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            this.products.push(result.value);
            console.log(`✅ Product ${batch[index]}: ${result.value.title.substring(0, 50)}...`);
          }
        });
        
        // Small delay between batches
        if (i + batchSize < knownIds.length) {
          await this.delay(500);
        }
      }
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async scrapeProduct(productId: number): Promise<GmsocialProduct | null> {
    if (this.processedIds.has(productId.toString())) {
      return null;
    }
    
    try {
      const productUrl = `${this.baseUrl}goods/view.php?product_id=${productId}`;
      
      const response = await axios.get(productUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Check if product exists
      if ($('body').text().includes('상품이 존재하지 않습니다') || 
          $('body').text().includes('판매중이 아닙니다')) {
        return null;
      }
      
      // Extract product details
      const title = this.extractTitle($);
      const price = this.extractPrice($);
      
      if (!title || !price) {
        return null;
      }
      
      const imageUrl = this.extractImageUrl($);
      const vendor = this.extractVendor($);
      const category = this.extractCategory($);
      const description = this.extractDescription($) || title;
      
      this.processedIds.add(productId.toString());
      
      return {
        id: `gmsocial_${productId}`,
        title: title.trim(),
        name: title.trim(),
        price: price.trim(),
        imageUrl: imageUrl || '',
        productUrl,
        category: category || '기타',
        vendor: vendor || '',
        description: description.trim(),
        mallId: 'gmsocial',
        mallName: '광명가치몰',
        mallUrl: this.baseUrl,
        region: '경기도 광명시',
        tags: [vendor, category].filter(Boolean),
        featured: false,
        isNew: false,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
    } catch (error) {
      // Silently ignore 404 errors
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Error scraping product ${productId}:`, error.message);
      return null;
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_name h1',
      '.product_name h1',
      '.goods_title',
      'h1.product_name',
      '.product_info h1',
      '.goods_detail h1',
      'h1'
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
      '.goods_price .price',
      '.product_price .price',
      '.price_area .price',
      '.price:contains("원")',
      '.sale_price',
      '.current_price'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.includes('원')) {
        return text;
      }
    }
    
    // Try to find price in text
    const priceMatch = $('body').text().match(/[\d,]+원/);
    if (priceMatch) {
      return priceMatch[0];
    }
    
    return '';
  }

  private extractImageUrl($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_image img',
      '.product_image img',
      '.main_image img',
      '.detail_image img',
      'img[src*="product"]'
    ];
    
    for (const selector of selectors) {
      const src = $(selector).first().attr('src');
      if (src) {
        if (src.startsWith('/')) {
          return 'http://gmsocial.mangotree.co.kr' + src;
        } else if (src.startsWith('http')) {
          return src;
        } else {
          return 'http://gmsocial.mangotree.co.kr/mall/' + src;
        }
      }
    }
    
    return '';
  }

  private extractVendor($: cheerio.CheerioAPI): string {
    const selectors = [
      '.seller_name',
      '.vendor_name',
      '.brand_name',
      '.shop_name',
      '.company_name'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    
    return '';
  }

  private extractCategory($: cheerio.CheerioAPI): string {
    const breadcrumb = $('.breadcrumb, .location').text();
    const categories = breadcrumb.split('>').map(s => s.trim()).filter(s => s);
    
    if (categories.length > 1) {
      return categories[categories.length - 1];
    }
    
    return '';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_description',
      '.product_summary',
      '.short_desc',
      'meta[name="description"]'
    ];
    
    for (const selector of selectors) {
      if (selector.includes('meta')) {
        const content = $(selector).attr('content');
        if (content) return content.substring(0, 200);
      } else {
        const text = $(selector).first().text().trim();
        if (text && text.length > 0) {
          return text.substring(0, 200);
        }
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
    const productsFile = path.join(outputDir, 'gmsocial-products-complete.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '광명가치몰',
      mallUrl: this.baseUrl,
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      productsByCategory: this.products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      productsByVendor: this.products.reduce((acc, product) => {
        if (product.vendor) {
          acc[product.vendor] = (acc[product.vendor] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      priceRange: {
        min: Math.min(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      },
      sampleProducts: this.products.slice(0, 10)
    };
    
    const summaryFile = path.join(outputDir, 'gmsocial-complete-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📊 Results saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);
    console.log(`   Total products: ${this.products.length}`);
    console.log(`   Categories: ${Object.keys(summary.productsByCategory).length}`);
    console.log(`   Vendors: ${Object.keys(summary.productsByVendor).length}`);
  }

  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }
}

// Run the scraper
async function main() {
  const scraper = new GmsocialOptimizedScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}