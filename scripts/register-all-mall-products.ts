import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  region?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
  inStock: boolean;
  lastUpdated: string;
  createdAt: string;
}

interface MallInfo {
  name: string;
  url: string;
  region: string;
}

class ComprehensiveMallScraper {
  private scrapedProducts: Product[] = [];
  private processedMalls: MallInfo[] = [];
  private failedMalls: MallInfo[] = [];
  private totalProducts = 0;

  constructor() {}

  async scrapeAllMalls(): Promise<void> {
    console.log('🚀 Starting comprehensive mall product registration...\n');
    
    // Extract all mall URLs from mergedmalls.txt
    const malls = this.extractMallsFromFile();
    console.log(`📊 Found ${malls.length} shopping malls to process\n`);
    
    // Process each mall
    for (let i = 0; i < malls.length; i++) {
      const mall = malls[i];
      console.log(`\n[${i + 1}/${malls.length}] Processing: ${mall.name}`);
      console.log(`🌐 URL: ${mall.url}`);
      console.log(`📍 Region: ${mall.region}`);
      
      try {
        await this.scrapeMallProducts(mall);
        this.processedMalls.push(mall);
        console.log(`✅ Successfully processed ${mall.name}`);
      } catch (error) {
        console.log(`❌ Failed to process ${mall.name}: ${error}`);
        this.failedMalls.push(mall);
      }
      
      // Delay between requests to be respectful
      await this.delay(3000);
    }
    
    // Save results and integrate into website
    await this.saveResults();
    await this.integrateIntoWebsite();
    
    // Print final summary
    this.printSummary();
  }

  private extractMallsFromFile(): MallInfo[] {
    const filePath = path.join(__dirname, '..', 'backup', 'mergedmalls.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const malls: MallInfo[] = [];
    const lines = content.split('\n');
    let currentRegion = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and header
      if (!trimmedLine || trimmedLine.includes('통합 온라인')) continue;
      
      // Check if it's a region header (no colon)
      if (!trimmedLine.includes(':') && !trimmedLine.includes('http')) {
        currentRegion = trimmedLine;
        continue;
      }
      
      // Parse mall entry
      if (trimmedLine.includes(':') && trimmedLine.includes('http')) {
        const [nameAndDescription, url] = trimmedLine.split(': ');
        
        // Extract mall name (remove parenthetical descriptions)
        const mallName = nameAndDescription.split(' (')[0].trim();
        
        malls.push({
          name: mallName,
          url: url.trim(),
          region: currentRegion
        });
      }
    }
    
    return malls;
  }

  private async scrapeMallProducts(mall: MallInfo): Promise<void> {
    try {
      // Get the main page
      const response = await axios.get(mall.url, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      const $ = cheerio.load(response.data);
      
      // Different strategies for different mall types
      let products: Product[] = [];
      
      if (mall.url.includes('smartstore.naver.com')) {
        products = await this.scrapeNaverSmartstore(mall, $);
      } else if (mall.url.includes('cyso.co.kr')) {
        products = await this.scrapeCysoMall(mall, $);
      } else if (mall.url.includes('jejumall.kr')) {
        products = await this.scrapeJejuMall(mall, $);
      } else {
        products = await this.scrapeGenericMall(mall, $);
      }
      
      // Add products to main collection
      for (const product of products) {
        if (!this.isDuplicate(product)) {
          this.scrapedProducts.push(product);
          this.totalProducts++;
        }
      }
      
      console.log(`📦 Scraped ${products.length} products from ${mall.name}`);
      
    } catch (error) {
      throw new Error(`Failed to scrape ${mall.name}: ${error}`);
    }
  }

  private async scrapeNaverSmartstore(mall: MallInfo, $: cheerio.CheerioAPI): Promise<Product[]> {
    // Naver Smartstore has a specific structure
    const products: Product[] = [];
    
    // Look for product links
    const productLinks = $('.ProductList_item__2BpPC a, .product-item a, [href*="/products/"]').toArray();
    
    for (let i = 0; i < Math.min(productLinks.length, 50); i++) {
      const link = productLinks[i];
      const product = this.extractNaverProduct(mall, $, link);
      if (product) products.push(product);
    }
    
    return products;
  }

  private async scrapeCysoMall(mall: MallInfo, $: cheerio.CheerioAPI): Promise<Product[]> {
    // Cyso malls have a specific structure
    const products: Product[] = [];
    
    // Look for product containers
    const productElements = $('.product-item, .goods-item, .item, [class*="product"]').toArray();
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = this.extractCysoProduct(mall, $, element);
      if (product) products.push(product);
    }
    
    return products;
  }

  private async scrapeJejuMall(mall: MallInfo, $: cheerio.CheerioAPI): Promise<Product[]> {
    // Jeju mall specific scraping
    const products: Product[] = [];
    
    // Look for product links or containers
    const productElements = $('.product, .item, .goods, a[href*="/shop/"], a[href*="/product/"]').toArray();
    
    for (let i = 0; i < Math.min(productElements.length, 50); i++) {
      const element = productElements[i];
      const product = this.extractJejuProduct(mall, $, element);
      if (product) products.push(product);
    }
    
    return products;
  }

  private async scrapeGenericMall(mall: MallInfo, $: cheerio.CheerioAPI): Promise<Product[]> {
    // Generic scraping strategy for various mall types
    const products: Product[] = [];
    
    // Common selectors for products
    const selectors = [
      'a[href*="/product/"]',
      'a[href*="/goods/"]',
      'a[href*="/shop/"]',
      'a[href*="/item/"]',
      '.product-item a',
      '.goods-item a',
      '.item a',
      '.product a'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector).toArray();
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(elements.length, 50); i++) {
          const element = elements[i];
          const product = this.extractGenericProduct(mall, $, element);
          if (product) products.push(product);
        }
        break; // Use first successful selector
      }
    }
    
    return products;
  }

  private extractNaverProduct(mall: MallInfo, $: cheerio.CheerioAPI, element: any): Product | null {
    try {
      const $elem = $(element);
      const href = $elem.attr('href');
      
      if (!href) return null;
      
      const productUrl = href.startsWith('http') ? href : new URL(href, mall.url).href;
      const name = $elem.find('.ProductList_name__3k7PQ, .product-name').text().trim() || 
                   $elem.text().trim() || 
                   $elem.find('img').attr('alt') || '';
      
      if (!name || name.length < 3) return null;
      
      const imageUrl = $elem.find('img').attr('src') || '';
      const price = $elem.find('.ProductList_price__3k7PQ, .price').text().trim() || '가격문의';
      
      return this.createProduct(mall, name, productUrl, imageUrl, price);
    } catch (error) {
      return null;
    }
  }

  private extractCysoProduct(mall: MallInfo, $: cheerio.CheerioAPI, element: any): Product | null {
    try {
      const $elem = $(element);
      const href = $elem.find('a').attr('href') || $elem.attr('href');
      
      if (!href) return null;
      
      const productUrl = href.startsWith('http') ? href : new URL(href, mall.url).href;
      const name = $elem.find('.title, .name, h3, h4').text().trim() || 
                   $elem.text().trim().split('\n')[0] || '';
      
      if (!name || name.length < 3) return null;
      
      const imageUrl = $elem.find('img').attr('src') || '';
      const price = $elem.find('.price, .cost').text().trim() || '가격문의';
      
      return this.createProduct(mall, name, productUrl, imageUrl, price);
    } catch (error) {
      return null;
    }
  }

  private extractJejuProduct(mall: MallInfo, $: cheerio.CheerioAPI, element: any): Product | null {
    try {
      const $elem = $(element);
      const href = $elem.attr('href') || $elem.find('a').attr('href');
      
      if (!href) return null;
      
      const productUrl = href.startsWith('http') ? href : new URL(href, mall.url).href;
      const name = $elem.find('.subject, .title, .name').text().trim() || 
                   $elem.text().trim() || '';
      
      if (!name || name.length < 3) return null;
      
      const imageUrl = $elem.find('img').attr('src') || '';
      const price = $elem.find('.price, .cost').text().trim() || '가격문의';
      
      return this.createProduct(mall, name, productUrl, imageUrl, price);
    } catch (error) {
      return null;
    }
  }

  private extractGenericProduct(mall: MallInfo, $: cheerio.CheerioAPI, element: any): Product | null {
    try {
      const $elem = $(element);
      const href = $elem.attr('href');
      
      if (!href) return null;
      
      const productUrl = href.startsWith('http') ? href : new URL(href, mall.url).href;
      
      // Try multiple ways to get product name
      let name = $elem.text().trim() || 
                $elem.find('img').attr('alt') || 
                $elem.attr('title') || '';
      
      // If no name from link, try surrounding elements
      if (!name || name.length < 3) {
        const container = $elem.closest('.product, .item, .goods, div, li');
        name = container.find('.title, .name, h3, h4, strong').first().text().trim() ||
               container.text().trim().split('\n')[0];
      }
      
      if (!name || name.length < 3) return null;
      
      // Clean up name
      name = name.replace(/\s+/g, ' ').trim();
      
      const imageUrl = $elem.find('img').attr('src') || 
                      $elem.closest('.product, .item').find('img').attr('src') || '';
      
      const price = $elem.closest('.product, .item').find('.price, .cost, .amount').text().trim() || '가격문의';
      
      return this.createProduct(mall, name, productUrl, imageUrl, price);
    } catch (error) {
      return null;
    }
  }

  private createProduct(mall: MallInfo, name: string, productUrl: string, imageUrl: string, price: string): Product {
    const mallId = this.generateMallId(mall);
    const productId = this.generateProductId(mallId, name);
    
    // Fix relative image URLs
    let finalImageUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      finalImageUrl = new URL(imageUrl, mall.url).href;
    }
    
    return {
      id: productId,
      name: name.trim(),
      description: `${mall.name}에서 직접 판매하는 ${name.trim()}`,
      price: price || '가격문의',
      imageUrl: finalImageUrl || `${mall.url}/default-product.jpg`,
      productUrl,
      mallId,
      mallName: mall.name,
      region: mall.region,
      category: this.categorizeProduct(name),
      tags: this.generateTags(name, mall.region),
      inStock: true,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }

  private generateMallId(mall: MallInfo): string {
    return `mall_${mall.name.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')}_${Date.now()}`;
  }

  private generateProductId(mallId: string, name: string): string {
    const nameHash = name.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '').substring(0, 10);
    return `prod_${mallId}_${nameHash}_${Date.now()}`;
  }

  private categorizeProduct(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('쌀') || nameLower.includes('곡물') || nameLower.includes('농산물')) {
      return 'agricultural';
    } else if (nameLower.includes('멸치') || nameLower.includes('새우') || nameLower.includes('수산물')) {
      return 'seafood';
    } else if (nameLower.includes('청국장') || nameLower.includes('된장') || nameLower.includes('발효')) {
      return 'processed';
    } else if (nameLower.includes('과자') || nameLower.includes('특산품') || nameLower.includes('선물')) {
      return 'specialty';
    } else {
      return 'other';
    }
  }

  private generateTags(name: string, region: string): string[] {
    const tags = [region];
    
    const nameWords = name.split(' ');
    nameWords.forEach(word => {
      if (word.length > 1 && !tags.includes(word)) {
        tags.push(word);
      }
    });
    
    return tags.slice(0, 8);
  }

  private isDuplicate(product: Product): boolean {
    return this.scrapedProducts.some(existing => 
      existing.name === product.name || 
      existing.productUrl === product.productUrl
    );
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(__dirname, 'output', 'all-malls-products.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = {
      totalProducts: this.totalProducts,
      processedMalls: this.processedMalls.length,
      failedMalls: this.failedMalls.length,
      products: this.scrapedProducts,
      processedMallsList: this.processedMalls,
      failedMallsList: this.failedMalls,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${outputPath}`);
  }

  private async integrateIntoWebsite(): Promise<void> {
    console.log('\n🔄 Integrating products into website...');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    
    // Read existing products
    let existingProducts: Product[] = [];
    if (fs.existsSync(productsPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    }
    
    // Remove old products from processed malls to avoid duplicates
    const processedMallIds = this.processedMalls.map(mall => this.generateMallId(mall));
    const filteredProducts = existingProducts.filter(p => 
      !processedMallIds.some(mallId => p.mallId.includes(mallId.split('_')[1]))
    );
    
    // Add new products
    const finalProducts = [...filteredProducts, ...this.scrapedProducts];
    
    fs.writeFileSync(productsPath, JSON.stringify(finalProducts, null, 2));
    
    console.log(`✅ Integrated ${this.scrapedProducts.length} new products`);
    console.log(`📊 Total products in website: ${finalProducts.length}`);
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE MALL SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${this.processedMalls.length} malls`);
    console.log(`❌ Failed to process: ${this.failedMalls.length} malls`);
    console.log(`📦 Total products scraped: ${this.totalProducts}`);
    console.log(`🌐 Total unique products: ${this.scrapedProducts.length}`);
    
    if (this.failedMalls.length > 0) {
      console.log('\n❌ Failed malls:');
      this.failedMalls.forEach(mall => {
        console.log(`   • ${mall.name} (${mall.url})`);
      });
    }
    
    console.log('\n✅ Successfully processed malls:');
    this.processedMalls.forEach(mall => {
      console.log(`   • ${mall.name} (${mall.region})`);
    });
    
    console.log('\n🎉 All mall product registration completed!');
  }

  private getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new ComprehensiveMallScraper();
  await scraper.scrapeAllMalls();
}

if (require.main === module) {
  main().catch(console.error);
}

export { ComprehensiveMallScraper };