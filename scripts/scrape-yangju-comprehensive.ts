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
  categoryCode: string;
  vendor?: string;
  description?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

interface CategoryInfo {
  code: string;
  name: string;
  url: string;
}

class YangjuMarketScraper {
  private baseUrl = 'https://market.yangju.go.kr';
  private products: YangjuProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting Yangju Market comprehensive scraping...');
    
    try {
      // Define categories based on the HTML analysis
      const categories: CategoryInfo[] = [
        { code: '001', name: '농산물', url: '/shop/shopbrand.html?xcode=001&type=X' },
        { code: '002', name: '축산물', url: '/shop/shopbrand.html?xcode=002&type=X' },
        { code: '003', name: '농산물 가공품', url: '/shop/shopbrand.html?xcode=003&type=X' },
        { code: '004', name: '공예품', url: '/shop/shopbrand.html?xcode=004&type=X' },
        { code: '005', name: '기타상품', url: '/shop/shopbrand.html?xcode=005&type=X' },
        { code: '006', name: '직거래장터', url: '/shop/shopbrand.html?xcode=006&type=X' },
        { code: '007', name: '정기배송상품', url: '/shop/shopbrand.html?xcode=007&type=X' }
      ];
      
      // Also check subcategories
      const subcategories: CategoryInfo[] = [
        { code: '001-001', name: '곡류', url: '/shop/shopbrand.html?type=M&xcode=001&mcode=001' },
        { code: '001-002', name: '쌀', url: '/shop/shopbrand.html?type=M&xcode=001&mcode=002' },
        { code: '001-003', name: '과일', url: '/shop/shopbrand.html?type=M&xcode=001&mcode=003' },
        { code: '001-004', name: '채소', url: '/shop/shopbrand.html?type=M&xcode=001&mcode=004' },
        { code: '001-014', name: '농산물꾸러미', url: '/shop/shopbrand.html?type=M&xcode=001&mcode=014' }
      ];
      
      // Scrape all categories
      for (const category of [...categories, ...subcategories]) {
        console.log(`\n📂 Processing category: ${category.name} (${category.code})`);
        await this.scrapeCategoryProducts(category);
        await this.delay(2000);
      }
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async scrapeCategoryProducts(category: CategoryInfo) {
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage && page <= 10) { // Safety limit
      try {
        const categoryUrl = `${this.baseUrl}${category.url}&page=${page}`;
        console.log(`    📄 Scraping page ${page}: ${categoryUrl}`);
        
        const response = await axios.get(categoryUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract products from the page
        const productElements = $('.item-list');
        
        if (productElements.length === 0) {
          console.log(`    ⚠️  No products found on page ${page}`);
          hasNextPage = false;
          continue;
        }
        
        console.log(`    Found ${productElements.length} products on page ${page}`);
        
        // Process each product
        for (let i = 0; i < productElements.length; i++) {
          const $product = $(productElements[i]);
          await this.extractProductFromListing($, $product, category);
        }
        
        // Check for next page - look for pagination
        const nextPageLink = $(`.paging a:contains(${page + 1}), .pagination a:contains(${page + 1})`);
        hasNextPage = nextPageLink.length > 0;
        
        page++;
        await this.delay(1500);
        
      } catch (error) {
        console.error(`    ❌ Error scraping page ${page} of category ${category.name}:`, error.message);
        hasNextPage = false;
      }
    }
  }

  private async extractProductFromListing($: cheerio.CheerioAPI, $product: cheerio.Cheerio<cheerio.Element>, category: CategoryInfo) {
    try {
      // Extract product link
      const $link = $product.find('a[href*="shopdetail.html"]').first();
      const href = $link.attr('href');
      
      if (!href) return;
      
      // Extract product ID from URL
      const branduidMatch = href.match(/branduid=(\d+)/);
      if (!branduidMatch) return;
      
      const productId = branduidMatch[1];
      
      // Skip if already processed
      if (this.processedProductIds.has(productId)) {
        return;
      }
      
      // Extract basic info from listing
      const title = $product.find('.prd-name').text().trim() || 
                   $product.find('.name').text().trim() ||
                   $product.find('.product-name').text().trim();
      
      const price = $product.find('.prd-price').text().trim() ||
                   $product.find('.price').text().trim() ||
                   $product.find('.product-price').text().trim();
      
      const imageUrl = $product.find('img').first().attr('src') || '';
      
      // Construct full product URL
      const productUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
      
      // If we have basic info, try to get more details
      if (title || price) {
        try {
          const detailedProduct = await this.scrapeProductDetails(productUrl, category);
          if (detailedProduct) {
            this.products.push(detailedProduct);
            this.processedProductIds.add(productId);
            console.log(`      ✅ Scraped: ${detailedProduct.title} - ${detailedProduct.price}`);
          }
        } catch (error) {
          // If detailed scraping fails, use basic info
          if (title && price) {
            const product: YangjuProduct = {
              id: productId,
              title: title,
              price: price,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`,
              productUrl: productUrl,
              category: category.name,
              categoryCode: category.code,
              mallId: 'yangju',
              mallName: '양주농부마켓',
              mallUrl: this.baseUrl,
              region: '경기도 양주시'
            };
            
            this.products.push(product);
            this.processedProductIds.add(productId);
            console.log(`      ✅ Added from listing: ${product.title} - ${product.price}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`      ❌ Error extracting product:`, error.message);
    }
  }

  private async scrapeProductDetails(productUrl: string, category: CategoryInfo): Promise<YangjuProduct | null> {
    try {
      const response = await axios.get(productUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract product ID
      const branduidMatch = productUrl.match(/branduid=(\d+)/);
      const productId = branduidMatch ? branduidMatch[1] : '';
      
      // Extract title
      const title = $('.goods-title').text().trim() ||
                   $('.product-title').text().trim() ||
                   $('h1').text().trim() ||
                   $('[class*="title"]').first().text().trim();
      
      // Extract price
      let price = '';
      let originalPrice = '';
      
      // Look for sale price first
      const salePrice = $('.sale-price, .price-sale, .discount-price').first().text().trim();
      const normalPrice = $('.normal-price, .price-normal, .original-price').first().text().trim();
      
      if (salePrice && normalPrice) {
        price = salePrice;
        originalPrice = normalPrice;
      } else {
        // Single price
        price = $('.price, .product-price, .goods-price').first().text().trim() ||
               $('[class*="price"]').first().text().trim();
      }
      
      // Extract image
      const imageUrl = $('.goods-image img, .product-image img, .main-image img').first().attr('src') ||
                      $('img[id*="product"], img[class*="product"]').first().attr('src') || '';
      
      // Extract vendor
      const vendor = $('.vendor, .seller, .brand, .maker').first().text().trim() ||
                    $('[class*="vendor"], [class*="seller"]').first().text().trim();
      
      // Extract description
      const description = $('.description, .product-desc, .goods-desc').first().text().trim() ||
                         $('[class*="description"]').first().text().trim();
      
      if (!title || !price) {
        return null;
      }
      
      return {
        id: productId,
        title: title,
        price: this.cleanPrice(price),
        originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
        imageUrl: imageUrl.startsWith('http') ? imageUrl : `${this.baseUrl}${imageUrl}`,
        productUrl: productUrl,
        category: category.name,
        categoryCode: category.code,
        vendor: vendor,
        description: description ? description.substring(0, 200) : '',
        mallId: 'yangju',
        mallName: '양주농부마켓',
        mallUrl: this.baseUrl,
        region: '경기도 양주시'
      };
      
    } catch (error) {
      console.error(`      ❌ Error fetching product details from ${productUrl}:`, error.message);
      return null;
    }
  }

  private cleanPrice(priceStr: string): string {
    // Remove any non-numeric characters except comma and won symbol
    let cleaned = priceStr.replace(/[^\d,원₩]/g, '');
    
    // Ensure it ends with 원
    if (!cleaned.includes('원')) {
      cleaned += '원';
    }
    
    return cleaned;
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
    const productsFile = path.join(outputDir, 'yangju-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '양주농부마켓',
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
    
    const summaryFile = path.join(outputDir, 'yangju-scrape-summary.json');
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
  const scraper = new YangjuMarketScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}