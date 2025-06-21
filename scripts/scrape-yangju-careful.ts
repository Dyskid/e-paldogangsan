import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface YangjuProduct {
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

class YangjuCarefulScraper {
  private baseUrl = 'https://market.yangju.go.kr';
  private products: YangjuProduct[] = [];
  private cookies: string = '';
  
  async run() {
    console.log('🚀 Starting careful Yangju Market scraping with rate limiting...');
    
    try {
      // First, get homepage to obtain cookies
      await this.getHomepageAndCookies();
      await this.delay(3000); // Wait 3 seconds
      
      // Scrape products from homepage first
      await this.scrapeHomepageProducts();
      await this.delay(5000); // Wait 5 seconds
      
      // Try one category carefully
      await this.scrapeCategory();
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      if (this.products.length > 0) {
        await this.saveResults();
      }
    }
  }
  
  private async getHomepageAndCookies() {
    console.log('🏠 Getting homepage and cookies...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      });
      
      // Extract cookies from response
      const setCookies = response.headers['set-cookie'];
      if (setCookies) {
        this.cookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('✅ Obtained cookies');
      }
      
      console.log(`Homepage loaded successfully (${response.data.length} bytes)`);
      
    } catch (error) {
      console.error('Error getting homepage:', error.message);
    }
  }
  
  private async scrapeHomepageProducts() {
    console.log('🏪 Scraping products from homepage...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': this.cookies,
          'Referer': this.baseUrl
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Save homepage for analysis
      const outputDir = path.join(__dirname, 'output');
      fs.writeFileSync(path.join(outputDir, 'yangju-homepage-content.html'), response.data);
      
      // Look for products on homepage - based on earlier analysis
      console.log('Looking for product listings on homepage...');
      
      // Find all product links from the homepage
      const productLinks = new Map<string, any>();
      
      // Method 1: Direct product links
      $('a[href*="/shop/shopdetail.html?branduid="]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        if (href) {
          const branduidMatch = href.match(/branduid=(\d+)/);
          if (branduidMatch) {
            const productId = branduidMatch[1];
            
            // Find parent container for more info
            const $container = $link.closest('dl, div, li').length > 0 ? 
                              $link.closest('dl, div, li') : $link.parent();
            
            // Extract product info
            const title = $container.find('.prd-name, li.prd-name').text().trim() ||
                         $link.attr('title') ||
                         $link.find('img').attr('alt') ||
                         '';
            
            const price = $container.find('.prd-price, li.prd-price').text().trim() ||
                         $container.find('.price').text().trim() ||
                         '';
            
            const imageUrl = $link.find('img').attr('src') ||
                           $container.find('img').first().attr('src') ||
                           '';
            
            if (!productLinks.has(productId) && (title || price)) {
              productLinks.set(productId, {
                id: productId,
                title: title,
                price: price,
                imageUrl: imageUrl,
                productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                category: '홈페이지 추천상품'
              });
            }
          }
        }
      });
      
      console.log(`Found ${productLinks.size} unique products on homepage`);
      
      // Process found products
      for (const [productId, productInfo] of productLinks) {
        if (productInfo.title && productInfo.price) {
          const product: YangjuProduct = {
            id: productId,
            title: this.cleanText(productInfo.title),
            price: this.cleanPrice(productInfo.price),
            imageUrl: this.normalizeImageUrl(productInfo.imageUrl),
            productUrl: productInfo.productUrl,
            category: productInfo.category,
            mallId: 'yangju',
            mallName: '양주농부마켓',
            mallUrl: this.baseUrl,
            region: '경기도 양주시'
          };
          
          this.products.push(product);
          console.log(`✅ Added: ${product.title} - ${product.price}`);
        }
        
        // Small delay between products
        await this.delay(500);
      }
      
    } catch (error) {
      console.error('Error scraping homepage:', error.message);
    }
  }
  
  private async scrapeCategory() {
    console.log('\n📂 Trying to scrape agricultural products category...');
    
    try {
      // Wait longer before attempting category
      await this.delay(10000);
      
      const categoryUrl = `${this.baseUrl}/shop/shopbrand.html?xcode=001&type=X`;
      console.log(`Requesting: ${categoryUrl}`);
      
      const response = await axios.get(categoryUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': this.cookies,
          'Referer': this.baseUrl,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        },
        maxRedirects: 0, // Don't follow redirects
        validateStatus: (status) => status < 400 // Accept 3xx responses
      });
      
      if (response.status === 302) {
        console.log('⚠️  Received redirect - site may still be blocking requests');
        return;
      }
      
      const $ = cheerio.load(response.data);
      console.log('✅ Category page loaded');
      
      // Look for products in category page
      // Similar extraction logic as homepage
      
    } catch (error) {
      console.error('Error scraping category:', error.message);
    }
  }
  
  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
  
  private cleanPrice(priceStr: string): string {
    // Extract numeric price and ensure it has 원
    const numbers = priceStr.match(/[\d,]+/);
    if (numbers) {
      return numbers[0] + '원';
    }
    return priceStr;
  }
  
  private normalizeImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('//')) return 'https:' + imageUrl;
    if (imageUrl.startsWith('/')) return this.baseUrl + imageUrl;
    return this.baseUrl + '/' + imageUrl;
  }
  
  private async delay(ms: number): Promise<void> {
    console.log(`⏳ Waiting ${ms/1000} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save products
    const productsFile = path.join(outputDir, 'yangju-careful-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '양주농부마켓',
      mallUrl: this.baseUrl,
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      categories: [...new Set(this.products.map(p => p.category))],
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
        category: p.category
      }))
    };
    
    const summaryFile = path.join(outputDir, 'yangju-careful-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`\n📊 Results saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);
    console.log(`   Total products: ${this.products.length}`);
  }
  
  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^\d]/g, '');
    return parseInt(cleanPrice) || 0;
  }
}

// Run the scraper
async function main() {
  const scraper = new YangjuCarefulScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}