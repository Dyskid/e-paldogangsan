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
  clickCount?: number;
  lastVerified?: string;
  inStock?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  subcategory?: string;
}

interface GimhaeProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  description: string;
  category: string;
  tags: string[];
}

class GimhaeMallScraper {
  private baseUrl = 'https://gimhaemall.kr';
  private scrapedProducts: GimhaeProduct[] = [];

  async scrapeAllProducts(): Promise<void> {
    console.log('🏪 Starting comprehensive scraping of gimhaemall.kr...\n');
    
    try {
      // Try multiple approaches to find products
      await this.scrapeMainPage();
      await this.scrapeCategoryPages();
      await this.scrapeSearchResults();
      
      console.log(`\n📊 Total products scraped: ${this.scrapedProducts.length}`);
      
      if (this.scrapedProducts.length > 0) {
        await this.saveResults();
        await this.integrateIntoWebsite();
      } else {
        console.log('❌ No products found. The site might require different scraping approach.');
      }
      
    } catch (error) {
      console.error('❌ Error during scraping:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async scrapeMainPage(): Promise<void> {
    console.log('📄 Scraping main page...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        headers: this.getHeaders(),
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      console.log(`📄 Main page title: "${$('title').text().trim()}"`);
      
      // Look for various product link patterns
      const productSelectors = [
        'a[href*="/product/"]',
        'a[href*="/goods/"]',
        'a[href*="/item/"]',
        'a[href*="/shop/"]',
        '.product-link',
        '.goods-link',
        '.item-link'
      ];

      let foundProducts = 0;
      
      for (const selector of productSelectors) {
        $(selector).each((i, elem) => {
          const product = this.extractProductFromElement($, elem);
          if (product) {
            this.scrapedProducts.push(product);
            foundProducts++;
            console.log(`   ✅ Found: ${product.name}`);
          }
        });
      }
      
      console.log(`📊 Found ${foundProducts} products on main page\n`);
      
    } catch (error) {
      console.log(`❌ Error scraping main page: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  private async scrapeCategoryPages(): Promise<void> {
    console.log('📂 Scraping category pages...');
    
    // Common category URL patterns for Korean shopping malls
    const categoryUrls = [
      '/category/agricultural',
      '/category/seafood', 
      '/category/processed',
      '/category/specialty',
      '/products',
      '/goods',
      '/shop/all',
      '/list',
      '/category.php',
      '/goods/list.php'
    ];
    
    for (const categoryPath of categoryUrls) {
      const url = `${this.baseUrl}${categoryPath}`;
      console.log(`   Checking: ${url}`);
      
      try {
        const response = await axios.get(url, {
          headers: this.getHeaders(),
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        let foundProducts = 0;
        
        $('a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && (href.includes('product') || href.includes('goods') || href.includes('item'))) {
            const product = this.extractProductFromElement($, elem);
            if (product && !this.isDuplicate(product)) {
              this.scrapedProducts.push(product);
              foundProducts++;
              console.log(`     ✅ Found: ${product.name}`);
            }
          }
        });
        
        if (foundProducts > 0) {
          console.log(`   📊 Found ${foundProducts} products in ${categoryPath}`);
        }
        
        await this.delay(2000);
        
      } catch (error) {
        // Skip failed category pages
        continue;
      }
    }
    
    console.log('');
  }

  private async scrapeSearchResults(): Promise<void> {
    console.log('🔍 Trying search functionality...');
    
    const searchTerms = ['김해', '특산품', '농산물', '수산물'];
    
    for (const term of searchTerms) {
      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(term)}`;
      console.log(`   Searching for: ${term}`);
      
      try {
        const response = await axios.get(searchUrl, {
          headers: this.getHeaders(),
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        let foundProducts = 0;
        
        $('a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && (href.includes('product') || href.includes('goods'))) {
            const product = this.extractProductFromElement($, elem);
            if (product && !this.isDuplicate(product)) {
              this.scrapedProducts.push(product);
              foundProducts++;
              console.log(`     ✅ Found: ${product.name}`);
            }
          }
        });
        
        if (foundProducts > 0) {
          console.log(`   📊 Found ${foundProducts} products for "${term}"`);
        }
        
        await this.delay(2000);
        
      } catch (error) {
        continue;
      }
    }
    
    console.log('');
  }

  private extractProductFromElement($: cheerio.CheerioAPI, elem: cheerio.Element): GimhaeProduct | null {
    try {
      const $elem = $(elem);
      const href = $elem.attr('href');
      
      if (!href) return null;
      
      // Get product URL
      const productUrl = href.startsWith('http') ? href : new URL(href, this.baseUrl).href;
      
      // Extract product ID from URL
      const idMatch = productUrl.match(/\/(?:product|goods|item)\/(\d+)/);
      const id = idMatch ? idMatch[1] : Date.now().toString();
      
      // Get product title
      let name = $elem.text().trim() || 
                $elem.find('img').attr('alt') || 
                $elem.attr('title') || '';
      
      // If no title from link, try to find in surrounding elements
      if (!name || name.length < 5) {
        const container = $elem.closest('.product, .item, .goods, div, li');
        name = container.find('.title, .name, h3, h4, strong').first().text().trim() ||
               container.text().trim().split('\n')[0];
      }
      
      if (!name || name.length < 3) {
        return null;
      }
      
      // Clean up title
      name = name.replace(/\s+/g, ' ').trim();
      
      // Get image URL
      let imageUrl = $elem.find('img').attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, this.baseUrl).href;
      }
      
      // Extract price if available
      let price = '';
      const priceText = $elem.closest('.product, .item, .goods, div').find('.price, .cost, .amount').text();
      const priceMatch = priceText.match(/[\d,]+원?/);
      if (priceMatch) {
        price = priceMatch[0].replace(/[^\d,]/g, '') + '원';
      }
      
      // Determine category based on name
      const category = this.categorizeProduct(name);
      
      return {
        id: `gimhae_${id}`,
        name,
        price: price || '가격문의',
        imageUrl: imageUrl || `${this.baseUrl}/default-product.jpg`,
        productUrl,
        description: `김해온몰에서 직접 판매하는 ${name}`,
        category,
        tags: this.generateTags(name, category)
      };
      
    } catch (error) {
      return null;
    }
  }

  private categorizeProduct(name: string): string {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('쌀') || nameLower.includes('곡물') || nameLower.includes('농산물')) {
      return 'agricultural';
    } else if (nameLower.includes('멸치') || nameLower.includes('새우') || nameLower.includes('수산물') || nameLower.includes('갑각류')) {
      return 'seafood';
    } else if (nameLower.includes('청국장') || nameLower.includes('된장') || nameLower.includes('발효')) {
      return 'processed';
    } else if (nameLower.includes('과자') || nameLower.includes('특산품') || nameLower.includes('선물')) {
      return 'specialty';
    } else {
      return 'other';
    }
  }

  private generateTags(name: string, category: string): string[] {
    const tags = ['김해', '김해온몰', '경남'];
    
    // Add category-specific tags
    if (category === 'agricultural') {
      tags.push('농산물', '농업');
    } else if (category === 'seafood') {
      tags.push('수산물', '해산물');
    } else if (category === 'processed') {
      tags.push('가공식품', '발효');
    } else if (category === 'specialty') {
      tags.push('특산품', '선물');
    }
    
    // Add name-based tags
    const nameWords = name.split(' ');
    nameWords.forEach(word => {
      if (word.length > 1 && !tags.includes(word)) {
        tags.push(word);
      }
    });
    
    return tags.slice(0, 8); // Limit to 8 tags
  }

  private isDuplicate(product: GimhaeProduct): boolean {
    return this.scrapedProducts.some(existing => 
      existing.name === product.name || existing.productUrl === product.productUrl
    );
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(__dirname, 'output', 'gimhaemall-products.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(this.scrapedProducts, null, 2));
    console.log(`📁 Scraped products saved to: ${outputPath}`);
  }

  private async integrateIntoWebsite(): Promise<void> {
    console.log('\n🔄 Integrating products into website...');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const existingProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Remove existing gimhaemall products
    const filteredProducts = existingProducts.filter(p => p.mallId !== 'mall_98_김해온몰');
    console.log(`🗑️ Removed ${existingProducts.length - filteredProducts.length} existing gimhaemall products`);
    
    // Transform scraped products to website format
    const newProducts: Product[] = this.scrapedProducts.map((scrapedProduct, index) => ({
      id: `prod_mall_98_김해온몰_${index + 1}`,
      name: scrapedProduct.name,
      description: scrapedProduct.description,
      price: scrapedProduct.price,
      imageUrl: scrapedProduct.imageUrl,
      productUrl: scrapedProduct.productUrl,
      mallId: 'mall_98_김해온몰',
      mallName: '김해온몰',
      region: '경남',
      category: scrapedProduct.category,
      tags: scrapedProduct.tags,
      inStock: true,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }));
    
    // Add new products
    const finalProducts = [...filteredProducts, ...newProducts];
    
    fs.writeFileSync(productsPath, JSON.stringify(finalProducts, null, 2));
    
    console.log(`✅ Added ${newProducts.length} new gimhaemall products`);
    console.log(`📊 Total products: ${finalProducts.length}`);
    console.log('📁 Updated products.json');
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
  const scraper = new GimhaeMallScraper();
  await scraper.scrapeAllProducts();
}

if (require.main === module) {
  main().catch(console.error);
}