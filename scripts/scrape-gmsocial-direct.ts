import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ProductData {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  name: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified: string;
}

class GmsocialDirectScraper {
  private baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  private mallInfo = {
    id: 'gmsocial',
    name: '광명가치몰',
    url: 'http://gmsocial.mangotree.co.kr/mall/',
    region: '경기도 광명시'
  };

  private async fetchWithRetry(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🌐 Fetching: ${url} (attempt ${i + 1})`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            return ''; // Product not found, return empty string
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Wait between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
        
        return html;
      } catch (error) {
        console.warn(`⚠️ Attempt ${i + 1} failed for ${url}:`, error);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1)));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  private parsePrice(priceText: string): string {
    // Clean and format price
    const cleanPrice = priceText.replace(/[^\d,원]/g, '');
    
    // If it already has 원, return as is
    if (cleanPrice.includes('원')) {
      return cleanPrice;
    }
    
    // If it's just numbers with commas, add 원
    if (cleanPrice.match(/^\d{1,3}(,\d{3})*$/)) {
      return cleanPrice + '원';
    }
    
    // Extract numbers and add 원
    const numbers = priceText.replace(/[^\d]/g, '');
    if (numbers) {
      return parseInt(numbers).toLocaleString() + '원';
    }
    
    return priceText;
  }

  private generateProductId(productId: string): string {
    return `gmsocial_${productId}`;
  }

  private extractCategoryFromTitle(title: string): string {
    const categories = {
      '복합기': '사무용품',
      '프린터': '사무용품', 
      '레이저': '사무용품',
      '고등어': '식품',
      '음식': '식품',
      '식품': '식품',
      '차': '식품',
      '청': '식품',
      '밥': '식품',
      '쿠키': '식품',
      '설탕': '식품',
      '시럽': '식품',
      '생강': '식품',
      '드립백': '식품',
      '브라': '의류',
      '속옷': '의류',
      '손수건': '의류',
      '앞치마': '의류',
      '교육': '교육/체험',
      '클래스': '교육/체험',
      '코딩': '교육/체험',
      '게임': '교육/체험',
      '키트': '교육/체험',
      '오케스트라': '서비스',
      '동행': '서비스',
      '청소': '서비스',
      '방역': '서비스',
      '리모델링': '서비스',
      '페인트': '서비스',
      '공사': '서비스',
      '도자기': '공예품',
      '옻칠': '공예품',
      '수저': '생활용품',
      '스푼': '생활용품',
      '방명록': '문구용품',
      '크레용': '문구용품'
    };

    for (const [keyword, category] of Object.entries(categories)) {
      if (title.includes(keyword)) {
        return category;
      }
    }

    return '기타';
  }

  private extractVendorFromTitle(title: string): string | undefined {
    const vendors = [
      '삼삼이', '캐논', '브라더', '담다', '청소년플러스끌림', '따동',
      '이웃컴퍼니', '늘품애협동조합', '재미있는생각씨앗코딩', '선옻칠',
      '미앤드', '제일디자인', '크린환경', '시니온협동조합'
    ];

    for (const vendor of vendors) {
      if (title.includes(vendor)) {
        return vendor;
      }
    }

    return undefined;
  }

  private async scrapeProductPage(productId: string): Promise<ProductData | null> {
    try {
      const productUrl = `${this.baseUrl}goods/view.php?product_id=${productId}`;
      const html = await this.fetchWithRetry(productUrl);
      
      if (!html) {
        return null; // Product not found
      }

      const $ = cheerio.load(html);

      // Extract title - first try page title, then other selectors
      const pageTitle = $('title').text().trim();
      let title = '';
      
      // Extract product name from page title (before the '>' separator)
      if (pageTitle && pageTitle.includes('>')) {
        title = pageTitle.split('>')[0].trim();
      }
      
      // If no title from page title, try other selectors
      if (!title) {
        const titleSelectors = [
          'h1', '.product-title', '.goods-title', '.title',
          '[class*="title"]', '[class*="name"]', '.product_name',
          '.goods_name'
        ];

        for (const selector of titleSelectors) {
          const element = $(selector).first();
          if (element.length && element.text().trim()) {
            const text = element.text().trim();
            // Skip generic titles
            if (!text.includes('광명가치몰') && !text.includes('Error') && text.length > 3) {
              title = text;
              break;
            }
          }
        }
      }

      // If no title from selectors, try extracting from page content
      if (!title) {
        // Look for any text that might be a product title
        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (const line of lines) {
          if (line.length > 10 && line.length < 200 && 
              !line.includes('광명가치몰') && 
              !line.includes('로그인') && 
              !line.includes('회원가입') &&
              !line.includes('검색') &&
              /[가-힣]/.test(line)) {
            title = line;
            break;
          }
        }
      }

      if (!title) {
        console.warn(`⚠️ No title found for product ${productId}`);
        return null;
      }

      // Extract price - try multiple approaches
      let price = '';
      
      const priceSelectors = [
        '.price', '.cost', '.sale-price', '[class*="price"]', 
        '[class*="cost"]', '.goods_price', '.product_price'
      ];

      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length && /[0-9,]+원?/.test(element.text())) {
          price = element.text().trim();
          break;
        }
      }

      // If no price from selectors, search in all text
      if (!price) {
        const bodyText = $('body').text();
        const priceMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
        if (priceMatch) {
          price = priceMatch[0];
        } else {
          // Look for price patterns without 원
          const numberMatch = bodyText.match(/(\d{1,3}(?:,\d{3})+)/);
          if (numberMatch) {
            price = numberMatch[0] + '원';
          }
        }
      }

      if (!price) {
        console.warn(`⚠️ No price found for product ${productId}: ${title}`);
        return null;
      }

      // Extract image
      let imageUrl = '';
      const imageSelectors = [
        'img[src*="goods"]', 'img[src*="product"]', '.product-image img', 
        '.goods-image img', 'img[src*="phinf"]', 'img[src*="naver"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector).first();
        if (element.length && element.attr('src')) {
          imageUrl = element.attr('src') || '';
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'http://gmsocial.mangotree.co.kr' + imageUrl;
          }
          
          // Validate image URL
          if (imageUrl.includes('phinf') || imageUrl.includes('image') || imageUrl.includes('photo')) {
            break;
          }
        }
      }

      // If no specific product image, get first reasonable image
      if (!imageUrl) {
        $('img').each((i, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('logo') && !src.includes('banner') && !src.includes('icon')) {
            imageUrl = src;
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'http://gmsocial.mangotree.co.kr' + imageUrl;
            }
            return false; // break
          }
        });
      }

      const category = this.extractCategoryFromTitle(title);
      const vendor = this.extractVendorFromTitle(title);

      const product: ProductData = {
        id: this.generateProductId(productId),
        title: title,
        name: title,
        price: this.parsePrice(price),
        imageUrl: imageUrl,
        productUrl: productUrl,
        category: category,
        vendor: vendor,
        mallId: this.mallInfo.id,
        mallName: this.mallInfo.name,
        mallUrl: this.mallInfo.url,
        region: this.mallInfo.region,
        description: title,
        tags: vendor ? [vendor, category] : [category],
        featured: false,
        isNew: false,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };

      console.log(`✅ Scraped product ${productId}: ${title.substring(0, 50)}...`);
      return product;

    } catch (error) {
      console.error(`❌ Error scraping product ${productId}:`, error);
      return null;
    }
  }

  public async scrapeAllProducts(): Promise<ProductData[]> {
    console.log('🚀 Starting direct scrape of 광명가치몰...');
    
    const products: ProductData[] = [];
    const errors: string[] = [];
    
    // Based on found products (121, 81, 80), scan comprehensive range
    const ranges = [
      { start: 70, end: 90 },      // Around ID 80-81
      { start: 100, end: 130 },    // Around ID 121
      { start: 1, end: 70 },       // Earlier range
      { start: 130, end: 200 }     // Extended range
    ];
    
    for (const range of ranges) {
      console.log(`📊 Scanning product IDs from ${range.start} to ${range.end}...`);
      
      for (let productId = range.start; productId <= range.end; productId++) {
        try {
          const product = await this.scrapeProductPage(productId.toString());
          
          if (product) {
            // Check for duplicates
            const existingProduct = products.find(p => p.title === product.title);
            if (!existingProduct) {
              products.push(product);
              console.log(`✅ Found product ${productId}: ${product.title.substring(0, 50)}...`);
            } else {
              console.log(`⏭️ Duplicate product ${productId}: ${product.title.substring(0, 30)}...`);
            }
          } else {
            console.log(`⏭️ Product ${productId} not found or invalid`);
          }
          
          // Progress indicator
          if (productId % 10 === 0) {
            console.log(`📈 Progress: ${productId}/${range.end} (${products.length} unique products found)`);
          }
          
        } catch (error) {
          const errorMsg = `Product ${productId}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          
          // Continue despite errors
          continue;
        }
      }
    }
    
    console.log(`\n🎉 Scraping complete!`);
    console.log(`✅ Successfully scraped: ${products.length} unique products`);
    console.log(`❌ Errors encountered: ${errors.length}`);
    
    // Save results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'gmsocial-direct-scraped.json');
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
    console.log(`💾 Results saved to: ${outputFile}`);
    
    // Save summary
    const summaryFile = path.join(outputDir, 'gmsocial-direct-summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      scrapingMethod: 'Direct product ID enumeration',
      rangesScanned: ranges,
      errors: errors.length,
      categories: [...new Set(products.map(p => p.category))],
      vendors: [...new Set(products.map(p => p.vendor).filter(Boolean))],
      priceRange: {
        min: Math.min(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '') || '0'))),
        max: Math.max(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '') || '0')))
      },
      sampleProducts: products.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category,
        vendor: p.vendor
      }))
    };
    
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary saved to: ${summaryFile}`);
    
    return products;
  }
}

// Run the scraper
async function main() {
  try {
    const scraper = new GmsocialDirectScraper();
    const products = await scraper.scrapeAllProducts();
    
    console.log(`\n🎯 Final Results:`);
    console.log(`- Total products scraped: ${products.length}`);
    console.log(`- Categories found: ${[...new Set(products.map(p => p.category))].join(', ')}`);
    console.log(`- Vendors found: ${[...new Set(products.map(p => p.vendor).filter(Boolean))].join(', ')}`);
    
    return products;
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { GmsocialDirectScraper };