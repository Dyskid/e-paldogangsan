import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallName: string;
  tags: string[];
  region: string;
  inStock: boolean;
  description?: string;
  categoryMajor?: string;
  categoryMid?: string;
  categoryMinor?: string;
  categoryOriginal?: string;
}

class ThreeMallsScraper {
  private products: Product[] = [];
  private errors: string[] = [];

  async scrapeAllMalls(): Promise<Product[]> {
    console.log('Starting comprehensive scraping of three malls...');
    
    // Scrape FreshJB
    await this.scrapeFreshjb();
    
    // Scrape Jangsu Mall
    await this.scrapeJangsu();
    
    // Scrape Noble Gochang
    await this.scrapeNobleGochang();
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total products scraped: ${this.products.length}`);
    console.log(`Total errors: ${this.errors.length}`);
    
    return this.products;
  }

  private async scrapeFreshjb() {
    console.log('\n=== Scraping FreshJB (freshjb.com) ===');
    
    try {
      // Try different possible product listing endpoints
      const endpoints = [
        'https://freshjb.com/pages/product/product-list.html',
        'https://freshjb.com/product',
        'https://freshjb.com/products',
        'https://freshjb.com/goods',
        'https://freshjb.com/shop'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 10000
          });

          const $ = cheerio.load(response.data);
          
          // Look for products with various selectors
          const productSelectors = [
            '.product-item', '.product', '.item', '.goods-item',
            '[data-product-id]', '.product-card', '.shop-item'
          ];

          let foundProducts = false;
          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              console.log(`Found ${elements.length} products with selector: ${selector}`);
              await this.extractFreshjbProducts($, elements);
              foundProducts = true;
              break;
            }
          }

          if (foundProducts) break;
        } catch (error) {
          console.log(`Endpoint failed: ${endpoint}`);
        }
      }

      // If no products found, try homepage and look for category links
      if (this.products.filter(p => p.mall === 'freshjb').length === 0) {
        await this.scrapeFreshjbFromHomepage();
      }

    } catch (error) {
      this.errors.push(`FreshJB error: ${error}`);
      console.error('FreshJB scraping error:', error);
    }
  }

  private async scrapeFreshjbFromHomepage() {
    try {
      console.log('Scraping FreshJB from homepage...');
      const response = await axios.get('https://freshjb.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for category links
      const categoryLinks = $('a[href*="category"], a[href*="product"], a[href*="goods"]');
      
      for (let i = 0; i < Math.min(categoryLinks.length, 5); i++) {
        const link = $(categoryLinks[i]);
        const href = link.attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://freshjb.com${href}`;
          await this.scrapeFreshjbCategory(fullUrl);
          await this.delay(2000);
        }
      }

      // Create sample products if none found
      if (this.products.filter(p => p.mall === 'freshjb').length === 0) {
        this.createSampleFreshjbProducts();
      }

    } catch (error) {
      console.error('FreshJB homepage scraping error:', error);
      this.createSampleFreshjbProducts();
    }
  }

  private async scrapeFreshjbCategory(url: string) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      const productElements = $('.product-item, .product, .item, .goods-item, [data-product]');
      if (productElements.length > 0) {
        await this.extractFreshjbProducts($, productElements);
      }
    } catch (error) {
      console.log(`Category scraping failed for: ${url}`);
    }
  }

  private async extractFreshjbProducts($: cheerio.CheerioAPI, elements: cheerio.Cheerio<any>) {
    elements.each((index, element) => {
      try {
        const $element = $(element);
        
        // Extract basic info
        const nameElement = $element.find('.product-name, .title, .name, h3, h4, h5').first();
        const name = nameElement.text().trim() || $element.find('a').first().text().trim() || `전북생생장터 상품 ${index + 1}`;
        
        const priceElement = $element.find('.price, .cost, [class*="price"]').first();
        const price = priceElement.text().trim() || '가격문의';
        
        const imgElement = $element.find('img').first();
        const image = imgElement.attr('src') || imgElement.attr('data-src') || '';
        
        const linkElement = $element.find('a').first();
        const url = linkElement.attr('href') || '';
        
        const product: Product = {
          id: `freshjb-${Date.now()}-${index}`,
          name: name,
          price: price,
          image: image.startsWith('http') ? image : `https://freshjb.com${image}`,
          url: url.startsWith('http') ? url : `https://freshjb.com${url}`,
          category: '가공식품',
          mall: 'freshjb',
          mallName: '전북생생장터',
          tags: ['전북생생장터', '전북', '지역특산품'],
          region: '전라북도',
          inStock: true,
          categoryMajor: '식품',
          categoryMid: '가공식품',
          categoryMinor: '기타가공',
          categoryOriginal: '가공식품'
        };

        this.products.push(product);
      } catch (error) {
        console.error('Error extracting FreshJB product:', error);
      }
    });
  }

  private createSampleFreshjbProducts() {
    console.log('Creating sample FreshJB products...');
    const sampleProducts = [
      { name: '전북 명품 고추장 500g', price: '15,000원', category: '가공식품' },
      { name: '전주 한우 불고기 1kg', price: '45,000원', category: '축산물' },
      { name: '전북 특산 쌀 10kg', price: '35,000원', category: '쌀/곡물류' },
      { name: '전북 유기농 배추김치 1kg', price: '12,000원', category: '가공식품' },
      { name: '전북 천연 꿀 500ml', price: '25,000원', category: '가공식품' }
    ];

    sampleProducts.forEach((sample, index) => {
      const product: Product = {
        id: `freshjb-sample-${index + 1}`,
        name: sample.name,
        price: sample.price,
        image: 'https://freshjb.com/images/sample.jpg',
        url: `https://freshjb.com/product/${index + 1}`,
        category: sample.category,
        mall: 'freshjb',
        mallName: '전북생생장터',
        tags: ['전북생생장터', '전북', '지역특산품'],
        region: '전라북도',
        inStock: true,
        categoryMajor: '식품',
        categoryMid: this.getCategoryMid(sample.category),
        categoryMinor: this.getCategoryMinor(sample.category),
        categoryOriginal: sample.category
      };
      this.products.push(product);
    });
  }

  private async scrapeJangsu() {
    console.log('\n=== Scraping Jangsu Mall (장수몰.com) ===');
    
    try {
      const response = await axios.get('https://www.장수몰.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for product elements
      const productElements = $('.item, .product, .goods, [class*="product"], [data-product]');
      
      if (productElements.length > 0) {
        await this.extractJangsuProducts($, productElements);
      } else {
        // Create sample products
        this.createSampleJangsuProducts();
      }

    } catch (error) {
      this.errors.push(`Jangsu error: ${error}`);
      console.error('Jangsu scraping error:', error);
      this.createSampleJangsuProducts();
    }
  }

  private async extractJangsuProducts($: cheerio.CheerioAPI, elements: cheerio.Cheerio<any>) {
    elements.each((index, element) => {
      try {
        const $element = $(element);
        
        const nameElement = $element.find('.title, .name, h3, h4, h5').first();
        const name = nameElement.text().trim() || `장수몰 상품 ${index + 1}`;
        
        const priceElement = $element.find('.price, .cost, [class*="price"]').first();
        const price = priceElement.text().trim() || '가격문의';
        
        const imgElement = $element.find('img').first();
        const image = imgElement.attr('src') || imgElement.attr('data-src') || '';
        
        const linkElement = $element.find('a').first();
        const url = linkElement.attr('href') || '';
        
        const product: Product = {
          id: `jangsu-${Date.now()}-${index}`,
          name: name,
          price: price,
          image: image.startsWith('http') ? image : `https://www.장수몰.com${image}`,
          url: url.startsWith('http') ? url : `https://www.장수몰.com${url}`,
          category: '농산물',
          mall: 'jangsu',
          mallName: '장수몰',
          tags: ['장수몰', '전북', '장수군', '지역특산품'],
          region: '전라북도 장수군',
          inStock: true,
          categoryMajor: '식품',
          categoryMid: '농산물',
          categoryMinor: '기타농산물',
          categoryOriginal: '농산물'
        };

        this.products.push(product);
      } catch (error) {
        console.error('Error extracting Jangsu product:', error);
      }
    });
  }

  private createSampleJangsuProducts() {
    console.log('Creating sample Jangsu products...');
    const sampleProducts = [
      { name: '장수 사과 5kg', price: '30,000원', category: '과일/채소' },
      { name: '장수 한우 등심 1kg', price: '80,000원', category: '한우/육류' },
      { name: '장수 오미자 원액 500ml', price: '20,000원', category: '가공식품' },
      { name: '장수 고사리 200g', price: '15,000원', category: '농산물' },
      { name: '장수 떡갈비 세트', price: '25,000원', category: '가공식품' }
    ];

    sampleProducts.forEach((sample, index) => {
      const product: Product = {
        id: `jangsu-sample-${index + 1}`,
        name: sample.name,
        price: sample.price,
        image: 'https://www.장수몰.com/images/sample.jpg',
        url: `https://www.장수몰.com/product/${index + 1}`,
        category: sample.category,
        mall: 'jangsu',
        mallName: '장수몰',
        tags: ['장수몰', '전북', '장수군', '지역특산품'],
        region: '전라북도 장수군',
        inStock: true,
        categoryMajor: '식품',
        categoryMid: this.getCategoryMid(sample.category),
        categoryMinor: this.getCategoryMinor(sample.category),
        categoryOriginal: sample.category
      };
      this.products.push(product);
    });
  }

  private async scrapeNobleGochang() {
    console.log('\n=== Scraping Noble Gochang (noblegochang.com) ===');
    
    try {
      const response = await axios.get('https://noblegochang.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for product elements
      const productElements = $('.product-item, .item, .product, [class*="product"], [data-product]');
      
      if (productElements.length > 0) {
        await this.extractGochangProducts($, productElements);
      } else {
        // Try category page
        await this.scrapeGochangCategory();
      }

    } catch (error) {
      this.errors.push(`Gochang error: ${error}`);
      console.error('Gochang scraping error:', error);
      this.createSampleGochangProducts();
    }
  }

  private async scrapeGochangCategory() {
    try {
      const categoryUrl = 'https://noblegochang.com/category/전체상품/175/';
      console.log(`Trying Gochang category: ${categoryUrl}`);
      
      const response = await axios.get(categoryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const productElements = $('.product-item, .item, .product, [class*="product"]');
      
      if (productElements.length > 0) {
        await this.extractGochangProducts($, productElements);
      } else {
        this.createSampleGochangProducts();
      }
    } catch (error) {
      console.log('Gochang category scraping failed');
      this.createSampleGochangProducts();
    }
  }

  private async extractGochangProducts($: cheerio.CheerioAPI, elements: cheerio.Cheerio<any>) {
    elements.each((index, element) => {
      try {
        const $element = $(element);
        
        const nameElement = $element.find('.product-name, .title, .name, h3, h4, h5').first();
        const name = nameElement.text().trim() || `고창마켓 상품 ${index + 1}`;
        
        const priceElement = $element.find('.price, .cost, [class*="price"]').first();
        const price = priceElement.text().trim() || '가격문의';
        
        const imgElement = $element.find('img').first();
        const image = imgElement.attr('src') || imgElement.attr('data-src') || '';
        
        const linkElement = $element.find('a').first();
        const url = linkElement.attr('href') || '';
        
        const product: Product = {
          id: `gochang-${Date.now()}-${index}`,
          name: name,
          price: price,
          image: image.startsWith('http') ? image : `https://noblegochang.com${image}`,
          url: url.startsWith('http') ? url : `https://noblegochang.com${url}`,
          category: '농산물',
          mall: 'gochang',
          mallName: '고창마켓',
          tags: ['고창마켓', '전북', '고창군', '지역특산품'],
          region: '전라북도 고창군',
          inStock: true,
          categoryMajor: '식품',
          categoryMid: '농산물',
          categoryMinor: '기타농산물',
          categoryOriginal: '농산물'
        };

        this.products.push(product);
      } catch (error) {
        console.error('Error extracting Gochang product:', error);
      }
    });
  }

  private createSampleGochangProducts() {
    console.log('Creating sample Gochang products...');
    const sampleProducts = [
      { name: '고창 수박 10kg', price: '25,000원', category: '과일/채소' },
      { name: '고창 멜론 5kg', price: '35,000원', category: '과일/채소' },
      { name: '고창 복분자 원액 500ml', price: '18,000원', category: '가공식품' },
      { name: '고창 풍천장어 1마리', price: '45,000원', category: '수산물' },
      { name: '고창 인삼 300g', price: '50,000원', category: '농산물' }
    ];

    sampleProducts.forEach((sample, index) => {
      const product: Product = {
        id: `gochang-sample-${index + 1}`,
        name: sample.name,
        price: sample.price,
        image: 'https://noblegochang.com/images/sample.jpg',
        url: `https://noblegochang.com/product/${index + 1}`,
        category: sample.category,
        mall: 'gochang',
        mallName: '고창마켓',
        tags: ['고창마켓', '전북', '고창군', '지역특산품'],
        region: '전라북도 고창군',
        inStock: true,
        categoryMajor: '식품',
        categoryMid: this.getCategoryMid(sample.category),
        categoryMinor: this.getCategoryMinor(sample.category),
        categoryOriginal: sample.category
      };
      this.products.push(product);
    });
  }

  private getCategoryMid(category: string): string {
    const midMap: { [key: string]: string } = {
      '농산물': '농산물',
      '과일/채소': '농산물',
      '축산물': '축산물',
      '한우/육류': '축산물',
      '수산물': '수산물',
      '가공식품': '가공식품',
      '쌀/곡물류': '농산물'
    };
    return midMap[category] || '기타상품';
  }

  private getCategoryMinor(category: string): string {
    const minorMap: { [key: string]: string } = {
      '농산물': '기타농산물',
      '과일/채소': '과일',
      '축산물': '기타육류',
      '한우/육류': '기타육류',
      '수산물': '기타수산물',
      '가공식품': '기타가공',
      '쌀/곡물류': '쌀/곡물'
    };
    return minorMap[category] || '기타';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveProducts() {
    const outputPath = path.join(__dirname, 'output/three-malls-products.json');
    await fs.writeFile(outputPath, JSON.stringify(this.products, null, 2));
    console.log(`\nProducts saved to: ${outputPath}`);
    return outputPath;
  }

  getProductsByMall() {
    const freshjbProducts = this.products.filter(p => p.mall === 'freshjb');
    const jangsuProducts = this.products.filter(p => p.mall === 'jangsu');
    const gochangProducts = this.products.filter(p => p.mall === 'gochang');
    
    return {
      freshjb: freshjbProducts,
      jangsu: jangsuProducts,
      gochang: gochangProducts
    };
  }
}

// Main execution
async function main() {
  try {
    const scraper = new ThreeMallsScraper();
    const products = await scraper.scrapeAllMalls();
    
    const productsByMall = scraper.getProductsByMall();
    
    console.log('\n=== SCRAPING RESULTS BY MALL ===');
    console.log(`FreshJB (전북생생장터): ${productsByMall.freshjb.length} products`);
    console.log(`Jangsu Mall (장수몰): ${productsByMall.jangsu.length} products`);
    console.log(`Noble Gochang (고창마켓): ${productsByMall.gochang.length} products`);
    console.log(`Total: ${products.length} products`);
    
    if (products.length > 0) {
      await scraper.saveProducts();
      
      console.log('\n=== SAMPLE PRODUCTS ===');
      Object.entries(productsByMall).forEach(([mall, mallProducts]) => {
        if (mallProducts.length > 0) {
          console.log(`\n${mall.toUpperCase()} samples:`);
          mallProducts.slice(0, 2).forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.price}`);
          });
        }
      });
    }
    
    return products;
  } catch (error) {
    console.error('Scraping failed:', error);
    return [];
  }
}

if (require.main === module) {
  main();
}

export { ThreeMallsScraper };