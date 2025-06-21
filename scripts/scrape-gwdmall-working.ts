import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface GwdMallProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class GwdMallWorkingScraper {
  private baseUrl = 'https://gwdmall.kr';
  private products: GwdMallProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting GWDMall working scraper...');
    
    try {
      // Get product links from homepage
      const productLinks = await this.getProductLinksFromHomepage();
      
      console.log(`Found ${productLinks.length} product links`);
      
      // Process first batch of products (limit to avoid overwhelming)
      const limitedLinks = productLinks.slice(0, 50); // Process first 50 products
      
      for (let i = 0; i < limitedLinks.length; i++) {
        const productUrl = limitedLinks[i];
        const productId = this.extractProductId(productUrl);
        
        if (productId && !this.processedProductIds.has(productId)) {
          try {
            const product = await this.scrapeProductDetails(productUrl);
            if (product) {
              this.products.push(product);
              this.processedProductIds.add(productId);
              console.log(`✅ ${i + 1}/${limitedLinks.length} Scraped: ${product.title} - ${product.price}`);
            } else {
              console.log(`⚠️  ${i + 1}/${limitedLinks.length} Failed to extract product data from ${productUrl}`);
            }
          } catch (error) {
            console.error(`❌ ${i + 1}/${limitedLinks.length} Error scraping ${productUrl}:`, error.message);
          }
          
          // Add delay between requests
          await this.delay(1000);
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

  private async getProductLinksFromHomepage(): Promise<string[]> {
    console.log('🏠 Getting product links from homepage...');
    
    const response = await axios.get(this.baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    const productLinks: string[] = [];
    const seenIds = new Set<string>();
    
    $('a[href*="/goods/view?no="]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        const productId = this.extractProductId(fullUrl);
        
        if (productId && !seenIds.has(productId)) {
          seenIds.add(productId);
          productLinks.push(fullUrl);
        }
      }
    });
    
    return productLinks;
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/no=(\d+)/);
    return match ? match[1] : null;
  }

  private async scrapeProductDetails(productUrl: string): Promise<GwdMallProduct | null> {
    try {
      const response = await axios.get(productUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract product ID
      const productId = this.extractProductId(productUrl);
      if (!productId) return null;
      
      // Extract title - based on the HTML analysis
      const title = $('h3.name').text().trim() ||
                   $('.goods_name').text().trim() ||
                   $('h1').text().trim();
      
      // Extract price - based on the HTML analysis
      let price = '';
      let originalPrice = '';
      
      // Look for sale price
      const salePrice = $('.sale_price .num').text().trim();
      const orgPrice = $('.org_price .num').text().trim();
      
      if (salePrice) {
        price = salePrice + '원';
        if (orgPrice) {
          originalPrice = orgPrice + '원';
        }
      } else {
        // Try other price selectors
        const priceText = $('.price, .goods_price, .item_price').first().text().trim();
        if (priceText) {
          price = priceText;
        }
      }
      
      // Extract image
      const imageUrl = $('.goods_image img, .item_photo img, .product_image img').first().attr('src') ||
                      $('img[src*="goods"], img[src*="product"]').first().attr('src') ||
                      $('.main img').first().attr('src') ||
                      '';
      
      // Extract vendor/brand
      const vendor = $('.brand, .vendor, .seller, .company').first().text().trim() ||
                    $('[class*="brand"], [class*="vendor"]').first().text().trim();
      
      // Skip if no essential info
      if (!title || !price) {
        return null;
      }
      
      return {
        id: productId,
        title: this.cleanText(title),
        price: this.cleanPrice(price),
        originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
        imageUrl: this.normalizeImageUrl(imageUrl),
        productUrl: productUrl,
        category: this.categorizeProduct(title),
        vendor: vendor,
        mallId: 'gwdmall',
        mallName: '강원더몰',
        mallUrl: this.baseUrl,
        region: '강원도'
      };
      
    } catch (error) {
      console.error(`Error fetching product details from ${productUrl}:`, error.message);
      return null;
    }
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
  
  private cleanPrice(priceStr: string): string {
    // Remove any non-numeric characters except comma
    let cleaned = priceStr.replace(/[^\d,]/g, '');
    
    // Add 원 if not present
    if (!priceStr.includes('원')) {
      cleaned += '원';
    } else {
      cleaned = priceStr.replace(/[^\d,원]/g, '');
    }
    
    return cleaned;
  }
  
  private normalizeImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('//')) return 'https:' + imageUrl;
    if (imageUrl.startsWith('/')) return this.baseUrl + imageUrl;
    return this.baseUrl + '/' + imageUrl;
  }

  private categorizeProduct(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('쌀') || lowerTitle.includes('곡물')) {
      return '곡물/쌀';
    } else if (lowerTitle.includes('과일') || lowerTitle.includes('사과') || lowerTitle.includes('배')) {
      return '과일';
    } else if (lowerTitle.includes('채소') || lowerTitle.includes('야채')) {
      return '채소';
    } else if (lowerTitle.includes('만두') || lowerTitle.includes('만들어')) {
      return '만두/간편식';
    } else if (lowerTitle.includes('고기') || lowerTitle.includes('육류') || lowerTitle.includes('축산')) {
      return '축산물';
    } else if (lowerTitle.includes('해산물') || lowerTitle.includes('수산')) {
      return '수산물';
    } else if (lowerTitle.includes('가공') || lowerTitle.includes('잼') || lowerTitle.includes('차')) {
      return '가공식품';
    } else {
      return '기타';
    }
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
    const productsFile = path.join(outputDir, 'gwdmall-working-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '강원더몰',
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
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.productUrl
      }))
    };
    
    const summaryFile = path.join(outputDir, 'gwdmall-working-summary.json');
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
  const scraper = new GwdMallWorkingScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}