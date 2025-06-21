import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface WonjuProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  description?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class WonjuWorkingScraper {
  private baseUrl = 'https://wonju-mall.co.kr';
  private products: WonjuProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting Wonju Mall working scraper...');
    
    try {
      // Get product links from homepage
      const productLinks = await this.getProductLinksFromHomepage();
      
      console.log(`Found ${productLinks.length} product links`);
      
      // Process first batch of products (limit to avoid overwhelming)
      const limitedLinks = productLinks.slice(0, 60); // Process first 60 products
      
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

  private async scrapeProductDetails(productUrl: string): Promise<WonjuProduct | null> {
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
      
      // Extract title - based on the test results
      const title = $('h3.name').text().trim() ||
                   $('.detail_title_area').text().trim().split('\n')[1]?.trim() ||
                   $('.goods_name').text().trim() ||
                   $('title').text().replace('원주몰 / ', '').trim();
      
      // Extract price - based on the test results  
      let price = '';
      let originalPrice = '';
      
      // Look for sale price
      const salePrice = $('.sale_price').text().trim().replace('₩', '원');
      
      // Try to find original price
      const priceText = $('[class*="price"]').text();
      const priceMatches = priceText.match(/(\d{1,3}(?:,\d{3})*)\s*₩/g);
      
      if (priceMatches && priceMatches.length >= 2) {
        originalPrice = priceMatches[0].replace('₩', '원');
        price = priceMatches[1].replace('₩', '원');
      } else if (salePrice) {
        price = salePrice;
      } else {
        // Fallback to any price found
        const fallbackPrice = $('.price, .goods_price, .product_price').first().text().trim();
        if (fallbackPrice) {
          price = fallbackPrice.includes('원') ? fallbackPrice : fallbackPrice + '원';
        }
      }
      
      // Extract image - based on the test results
      const imageUrl = $('img[src*="goods"]').first().attr('src') ||
                      $('.goods_image img').first().attr('src') ||
                      $('.product_image img').first().attr('src') ||
                      $('.main_image img').first().attr('src') ||
                      '';
      
      // Extract vendor/brand from title or other elements
      let vendor = '';
      if (title.includes('스톤크릭')) {
        vendor = '스톤크릭';
      } else {
        vendor = $('.brand, .vendor, .seller, .company, .manufacturer').first().text().trim();
      }
      
      // Extract description
      const description = $('.detail_title_area').text().trim().split('\n')[2]?.trim() ||
                         $('.goods_summary, .product_summary, .description').first().text().trim();
      
      // Skip if no essential info
      if (!title || !price || title === '추천 상품') {
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
        description: description ? description.substring(0, 200) : '',
        mallId: 'wonju',
        mallName: '원주몰',
        mallUrl: this.baseUrl,
        region: '강원도 원주시'
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
    
    if (lowerTitle.includes('커피') || lowerTitle.includes('캡슐') || lowerTitle.includes('원두') || 
        lowerTitle.includes('드립') || lowerTitle.includes('블렌드')) {
      return '커피/원두';
    } else if (lowerTitle.includes('감자') || lowerTitle.includes('옹심이') || lowerTitle.includes('떡')) {
      return '전통음식';
    } else if (lowerTitle.includes('다래') || lowerTitle.includes('과일')) {
      return '과일';
    } else if (lowerTitle.includes('부꾸미') || lowerTitle.includes('빵') || lowerTitle.includes('과자')) {
      return '빵/과자';
    } else if (lowerTitle.includes('건강') || lowerTitle.includes('영양') || lowerTitle.includes('보조') || 
               lowerTitle.includes('비타민') || lowerTitle.includes('미네랄')) {
      return '건강식품';
    } else if (lowerTitle.includes('diy') || lowerTitle.includes('미술') || lowerTitle.includes('만들기')) {
      return 'DIY/만들기';
    } else if (lowerTitle.includes('셀레늄') || lowerTitle.includes('동충하초') || lowerTitle.includes('차')) {
      return '차/건강차';
    } else if (lowerTitle.includes('치킨') || lowerTitle.includes('육류') || lowerTitle.includes('고기')) {
      return '육류/가공식품';
    } else if (lowerTitle.includes('해산물') || lowerTitle.includes('수산')) {
      return '수산물';
    } else {
      return '원주특산품';
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
    const productsFile = path.join(outputDir, 'wonju-working-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '원주몰',
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
    
    const summaryFile = path.join(outputDir, 'wonju-working-summary.json');
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
  const scraper = new WonjuWorkingScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}