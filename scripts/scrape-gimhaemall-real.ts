import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

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

class GimhaeMallRealScraper {
  private baseUrl = 'https://gimhaemall.kr';
  private scrapedProducts: GimhaeProduct[] = [];

  async scrapeRealProducts(): Promise<void> {
    console.log('🏪 Scraping real products from gimhaemall.kr using actual structure...\n');
    
    try {
      // Based on the analysis, scrape category pages
      await this.scrapeCategoryProducts();
      
      console.log(`\n📊 Total products scraped: ${this.scrapedProducts.length}`);
      
      if (this.scrapedProducts.length > 0) {
        await this.saveResults();
        await this.integrateIntoWebsite();
      } else {
        console.log('❌ No products found');
      }
      
    } catch (error) {
      console.error('❌ Error during scraping:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async scrapeCategoryProducts(): Promise<void> {
    console.log('📂 Scraping category pages with real URLs...');
    
    // Categories found in the analysis
    const categories = [
      { id: '1012', name: '쌀·잡곡·견과', category: 'agricultural' },
      { id: '1003', name: '정육·계란·꿀', category: 'meat' },
      { id: '1011', name: '수산·해산·건어물', category: 'seafood' },
      { id: '1013', name: '과일·채소', category: 'fruit' },
      { id: '1015', name: '국·요리·반찬', category: 'processed' },
      { id: '1016', name: '양념·오일', category: 'processed' },
      { id: '1008', name: '신상품', category: 'other' },
      { id: '1019', name: '음료·유제품·간식류', category: 'processed' }
    ];
    
    for (const cat of categories) {
      console.log(`\n📂 Scraping category: ${cat.name} (${cat.id})`);
      
      const categoryUrl = `${this.baseUrl}/kwa-ABS_goods_l-${cat.id}`;
      
      try {
        const response = await axios.get(categoryUrl, {
          headers: this.getHeaders(),
          timeout: 30000
        });

        const $ = cheerio.load(response.data);
        console.log(`   📄 Loaded category page: ${$('title').text().trim()}`);
        
        // Look for product links with the pattern kwa-ABS_goods_v
        let foundProducts = 0;
        
        $('a[href*="kwa-ABS_goods_v"]').each((i, elem) => {
          const product = this.extractProductFromGoodsLink($, elem, cat.category);
          if (product && !this.isDuplicate(product)) {
            this.scrapedProducts.push(product);
            foundProducts++;
            console.log(`     ✅ Found: ${product.name}`);
          }
        });
        
        // Also look for any other product-like links
        $('a').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('goods_v')) {
            const product = this.extractProductFromGoodsLink($, elem, cat.category);
            if (product && !this.isDuplicate(product)) {
              this.scrapedProducts.push(product);
              foundProducts++;
              console.log(`     ✅ Found: ${product.name}`);
            }
          }
        });
        
        console.log(`   📊 Found ${foundProducts} products in ${cat.name}`);
        
        await this.delay(3000); // Rate limiting
        
      } catch (error) {
        console.log(`   ❌ Error loading category ${cat.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await this.delay(5000);
      }
    }
  }

  private extractProductFromGoodsLink($: cheerio.CheerioAPI, elem: cheerio.Element, category: string): GimhaeProduct | null {
    try {
      const $elem = $(elem);
      const href = $elem.attr('href');
      
      if (!href || !href.includes('goods_v')) return null;
      
      // Construct full product URL
      const productUrl = href.startsWith('http') ? href : `${this.baseUrl}/${href}`;
      
      // Extract product ID from URL (e.g., kwa-ABS_goods_v-15719-1006007)
      const idMatch = href.match(/goods_v-(\d+)/);
      const id = idMatch ? idMatch[1] : Date.now().toString();
      
      // Get product name - try multiple approaches
      let name = '';
      
      // Method 1: Direct text from link
      name = $elem.text().trim();
      
      // Method 2: Image alt text
      if (!name || name.length < 3) {
        const img = $elem.find('img');
        name = img.attr('alt') || img.attr('title') || '';
      }
      
      // Method 3: Look in parent container
      if (!name || name.length < 3) {
        const container = $elem.closest('.goods-item, .product-item, div, li, td');
        name = container.find('.title, .name, h3, h4, strong').first().text().trim();
      }
      
      // Method 4: Look for text in surrounding elements
      if (!name || name.length < 3) {
        const parent = $elem.parent();
        const siblings = parent.find('*').addBack();
        siblings.each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 5 && text.length < 100 && !text.includes('원') && !name) {
            name = text;
          }
        });
      }
      
      if (!name || name.length < 3) {
        return null;
      }
      
      // Clean up name
      name = name.replace(/\s+/g, ' ').replace(/^\[.*?\]\s*/, '').trim();
      
      // Get image URL
      let imageUrl = '';
      const img = $elem.find('img').first();
      if (img.length) {
        imageUrl = img.attr('src') || img.attr('data-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : new URL(imageUrl, this.baseUrl).href;
        }
      }
      
      // Get price if available in surrounding elements
      let price = '가격문의';
      const container = $elem.closest('div, li, td, tr');
      const priceText = container.text();
      const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
      if (priceMatch) {
        price = priceMatch[0];
      }
      
      return {
        id: `gimhae_${id}`,
        name,
        price,
        imageUrl: imageUrl || `${this.baseUrl}/images/no-image.jpg`,
        productUrl,
        description: `김해온몰에서 직접 판매하는 ${name}`,
        category,
        tags: this.generateTags(name, category)
      };
      
    } catch (error) {
      return null;
    }
  }

  private generateTags(name: string, category: string): string[] {
    const tags = ['김해', '김해온몰', '경남'];
    
    // Add category-specific tags
    const categoryTags: {[key: string]: string[]} = {
      'agricultural': ['농산물', '곡물', '견과'],
      'meat': ['축산물', '정육', '계란', '꿀'],
      'seafood': ['수산물', '해산물', '건어물'],
      'fruit': ['과일', '채소', '농산물'],
      'processed': ['가공식품', '반찬', '양념'],
      'other': ['특산품']
    };
    
    if (categoryTags[category]) {
      tags.push(...categoryTags[category]);
    }
    
    // Add name-based tags
    const nameWords = name.split(/[\s\(\)\[\]]+/).filter(word => word.length > 1);
    nameWords.forEach(word => {
      if (!tags.includes(word) && word.length <= 10) {
        tags.push(word);
      }
    });
    
    return tags.slice(0, 8);
  }

  private isDuplicate(product: GimhaeProduct): boolean {
    return this.scrapedProducts.some(existing => 
      existing.name === product.name || 
      existing.productUrl === product.productUrl ||
      existing.id === product.id
    );
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(__dirname, 'output', 'gimhaemall-real-products.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: this.scrapedProducts.length,
      categories: this.scrapedProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number}),
      products: this.scrapedProducts
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`📁 Results saved to: ${outputPath}`);
  }

  private async integrateIntoWebsite(): Promise<void> {
    console.log('\n🔄 Integrating scraped products into website...');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Remove existing gimhaemall products
    const filteredProducts = existingProducts.filter((p: any) => p.mallId !== 'mall_98_김해온몰');
    const removedCount = existingProducts.length - filteredProducts.length;
    console.log(`🗑️ Removed ${removedCount} existing gimhaemall products`);
    
    // Transform scraped products to website format
    const newProducts = this.scrapedProducts.map((scrapedProduct, index) => ({
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
    console.log(`📊 Total website products: ${finalProducts.length}`);
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
      'Referer': 'https://gimhaemall.kr/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new GimhaeMallRealScraper();
  await scraper.scrapeRealProducts();
}

if (require.main === module) {
  main().catch(console.error);
}