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

class GwdMallScraper {
  private baseUrl = 'https://gwdmall.kr';
  private products: GwdMallProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting GWDMall comprehensive scraping...');
    
    try {
      // First get homepage to extract categories
      await this.extractCategoriesFromHomepage();
      
      // Also scrape products from homepage
      await this.scrapeHomepageProducts();
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw error;
    }
  }

  private async extractCategoriesFromHomepage() {
    console.log('🏠 Extracting categories from homepage...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract category links from the homepage
      const categories: CategoryInfo[] = [];
      const seenCodes = new Set<string>();
      
      // Look for category links
      $('a[href*="/goods/catalog?code="]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        if (href && text) {
          const codeMatch = href.match(/code=([^&]+)/);
          if (codeMatch) {
            const code = codeMatch[1];
            if (!seenCodes.has(code)) {
              seenCodes.add(code);
              categories.push({
                code: code,
                name: text,
                url: href.startsWith('http') ? href : `${this.baseUrl}${href}`
              });
            }
          }
        }
      });
      
      console.log(`Found ${categories.length} categories`);
      
      // Scrape first few categories to get products
      for (let i = 0; i < Math.min(5, categories.length); i++) {
        const category = categories[i];
        console.log(`\n📂 Processing category: ${category.name} (${category.code})`);
        await this.scrapeCategoryProducts(category);
        await this.delay(2000);
      }
      
    } catch (error) {
      console.error('Error extracting categories:', error.message);
    }
  }

  private async scrapeHomepageProducts() {
    console.log('\n🏠 Scraping products from homepage...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Save homepage content for analysis
      const outputDir = path.join(__dirname, 'output');
      fs.writeFileSync(path.join(outputDir, 'gwdmall-homepage-content.html'), response.data);
      
      // Look for product links on homepage
      const productLinks = new Map<string, any>();
      
      $('a[href*="/goods/view?no="]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        if (href) {
          const noMatch = href.match(/no=(\d+)/);
          if (noMatch) {
            const productId = noMatch[1];
            
            // Find parent container for more info
            const $container = $link.closest('div, li, dl').length > 0 ? 
                              $link.closest('div, li, dl') : $link.parent();
            
            // Extract product info
            const title = $container.find('.item_name, .goods_name, .product_name, .name').text().trim() ||
                         $link.attr('title') ||
                         $link.find('img').attr('alt') ||
                         '';
            
            const price = $container.find('.item_price, .goods_price, .product_price, .price').text().trim() ||
                         $container.find('[class*="price"]').text().trim() ||
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
        if (productInfo.title && productInfo.price && !this.processedProductIds.has(productId)) {
          const product: GwdMallProduct = {
            id: productId,
            title: this.cleanText(productInfo.title),
            price: this.cleanPrice(productInfo.price),
            imageUrl: this.normalizeImageUrl(productInfo.imageUrl),
            productUrl: productInfo.productUrl,
            category: productInfo.category,
            categoryCode: 'homepage',
            mallId: 'gwdmall',
            mallName: '강원더몰',
            mallUrl: this.baseUrl,
            region: '강원도'
          };
          
          this.products.push(product);
          this.processedProductIds.add(productId);
          console.log(`✅ Added: ${product.title} - ${product.price}`);
        }
      }
      
    } catch (error) {
      console.error('Error scraping homepage:', error.message);
    }
  }

  private async scrapeCategoryProducts(category: CategoryInfo) {
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage && page <= 5) { // Safety limit
      try {
        const categoryUrl = `${category.url}&page=${page}`;
        console.log(`    📄 Scraping page ${page}: ${categoryUrl}`);
        
        const response = await axios.get(categoryUrl, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract products from the page
        const productLinks: string[] = [];
        
        $('a[href*="/goods/view?no="]').each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            productLinks.push(fullUrl);
          }
        });
        
        if (productLinks.length === 0) {
          console.log(`    ⚠️  No products found on page ${page}`);
          hasNextPage = false;
          continue;
        }
        
        console.log(`    Found ${productLinks.length} products on page ${page}`);
        
        // Process each product
        for (const productUrl of productLinks) {
          const noMatch = productUrl.match(/no=(\d+)/);
          if (noMatch) {
            const productId = noMatch[1];
            
            if (!this.processedProductIds.has(productId)) {
              try {
                const product = await this.scrapeProductDetails(productUrl, category);
                if (product) {
                  this.products.push(product);
                  this.processedProductIds.add(productId);
                  console.log(`      ✅ Scraped: ${product.title} - ${product.price}`);
                }
              } catch (error) {
                console.error(`      ❌ Error scraping product ${productId}:`, error.message);
              }
              
              await this.delay(800);
            }
          }
        }
        
        // Check for next page
        const nextPageLink = $('.pagination .next, .paging .next, a[href*="page=' + (page + 1) + '"]');
        hasNextPage = nextPageLink.length > 0;
        
        page++;
        await this.delay(1500);
        
      } catch (error) {
        console.error(`    ❌ Error scraping page ${page} of category ${category.name}:`, error.message);
        hasNextPage = false;
      }
    }
  }

  private async scrapeProductDetails(productUrl: string, category: CategoryInfo): Promise<GwdMallProduct | null> {
    try {
      const response = await axios.get(productUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract product ID
      const noMatch = productUrl.match(/no=(\d+)/);
      const productId = noMatch ? noMatch[1] : '';
      
      // Extract title
      const title = $('.item_detail_tit, .goods_name, .product_name').first().text().trim() ||
                   $('h1').first().text().trim() ||
                   $('.detail_info .tit, .info_area .tit').first().text().trim();
      
      // Extract price
      let price = '';
      let originalPrice = '';
      
      // Look for sale price first
      const salePrice = $('.item_price .discount, .price_sale, .sale_price').first().text().trim();
      const normalPrice = $('.item_price .consumer, .price_normal, .original_price').first().text().trim();
      
      if (salePrice && normalPrice) {
        price = salePrice;
        originalPrice = normalPrice;
      } else {
        // Single price
        price = $('.item_price, .goods_price, .product_price, .price').first().text().trim() ||
               $('[class*="price"]').first().text().trim();
      }
      
      // Extract image
      const imageUrl = $('.item_photo_big img, .goods_image img, .product_image img').first().attr('src') ||
                      $('.main_image img, img[id*="product"]').first().attr('src') || '';
      
      // Extract vendor
      const vendor = $('.item_brand, .brand, .vendor, .seller').first().text().trim() ||
                    $('[class*="brand"], [class*="vendor"]').first().text().trim();
      
      // Extract description
      const description = $('.item_summary, .product_summary, .goods_summary').first().text().trim() ||
                         $('.description').first().text().trim();
      
      if (!title || !price) {
        return null;
      }
      
      return {
        id: productId,
        title: title,
        price: this.cleanPrice(price),
        originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
        imageUrl: this.normalizeImageUrl(imageUrl),
        productUrl: productUrl,
        category: category.name,
        categoryCode: category.code,
        vendor: vendor,
        description: description ? description.substring(0, 200) : '',
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
    // Remove any non-numeric characters except comma and won symbol
    let cleaned = priceStr.replace(/[^\d,원₩]/g, '');
    
    // Ensure it ends with 원
    if (!cleaned.includes('원')) {
      cleaned += '원';
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

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save products
    const productsFile = path.join(outputDir, 'gwdmall-products.json');
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
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.productUrl
      }))
    };
    
    const summaryFile = path.join(outputDir, 'gwdmall-scrape-summary.json');
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
  const scraper = new GwdMallScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}