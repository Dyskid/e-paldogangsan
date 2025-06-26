import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface GmsocialProduct {
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
  subcategories?: CategoryInfo[];
}

class GmsocialScraper {
  private baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  private products: GmsocialProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting Gmsocial.or.kr comprehensive scraping...');
    
    try {
      // Get categories from our analysis file
      const analysisFile = fs.readFileSync(
        path.join(__dirname, 'output', 'gmsocial-analysis.json'),
        'utf-8'
      );
      const analysis = JSON.parse(analysisFile);
      
      // Scrape all categories
      for (const mainCategory of analysis.categoryStructure) {
        console.log(`\n📂 Processing main category: ${mainCategory.name} (${mainCategory.code})`);
        
        // Process main category
        await this.scrapeCategoryProducts(mainCategory);
        
        // Process subcategories
        if (mainCategory.subcategories && mainCategory.subcategories.length > 0) {
          for (const subCategory of mainCategory.subcategories) {
            console.log(`  📁 Processing subcategory: ${subCategory.name} (${subCategory.code})`);
            await this.scrapeCategoryProducts(subCategory);
            
            // Add delay between categories
            await this.delay(1000);
          }
        }
        
        // Add delay between main categories
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
    
    while (hasNextPage) {
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
        const productElements = $('.item_list .item, .goods_list .goods_item, .product_list .product_item, .list_item, .goods_item');
        
        if (productElements.length === 0) {
          // Try alternative selectors
          const alternativeSelectors = [
            'a[href*="view.php?product_id="]',
            'a[href*="goods/view.php"]',
            '[data-product-id]',
            '.product a',
            '.goods a'
          ];
          
          let foundProducts = false;
          for (const selector of alternativeSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              console.log(`    Found ${elements.length} products using selector: ${selector}`);
              await this.extractProductsFromElements($, elements, category);
              foundProducts = true;
              break;
            }
          }
          
          if (!foundProducts) {
            console.log(`    ⚠️  No products found on page ${page}, checking if this is end of pagination`);
            hasNextPage = false;
          }
        } else {
          console.log(`    Found ${productElements.length} products on page ${page}`);
          await this.extractProductsFromElements($, productElements, category);
        }
        
        // Check for next page
        const nextButton = $('.pagination .next, .paging .next, a[href*="page=' + (page + 1) + '"]');
        if (nextButton.length === 0 || page > 20) { // Safety limit
          hasNextPage = false;
        }
        
        page++;
        await this.delay(1500); // Delay between pages
        
      } catch (error) {
        console.error(`    ❌ Error scraping page ${page} of category ${category.name}:`, error.message);
        hasNextPage = false;
      }
    }
  }

  private async extractProductsFromElements($: cheerio.CheerioAPI, elements: cheerio.Cheerio<cheerio.Element>, category: CategoryInfo) {
    const productUrls = new Set<string>();
    
    elements.each((_, element) => {
      const $element = $(element);
      let productUrl = '';
      
      // Extract product URL
      if ($element.is('a')) {
        productUrl = $element.attr('href') || '';
      } else {
        const link = $element.find('a[href*="view.php"], a[href*="product_id"]').first();
        productUrl = link.attr('href') || '';
      }
      
      if (productUrl && productUrl.includes('product_id=')) {
        // Convert relative URLs to absolute
        if (productUrl.startsWith('/')) {
          productUrl = 'http://gmsocial.mangotree.co.kr' + productUrl;
        } else if (productUrl.startsWith('goods/')) {
          productUrl = 'http://gmsocial.mangotree.co.kr/mall/' + productUrl;
        } else if (!productUrl.startsWith('http')) {
          productUrl = 'http://gmsocial.mangotree.co.kr/mall/goods/' + productUrl;
        }
        
        productUrls.add(productUrl);
      }
    });
    
    // Scrape individual products
    for (const productUrl of productUrls) {
      try {
        const productId = this.extractProductId(productUrl);
        if (productId && !this.processedProductIds.has(productId)) {
          const product = await this.scrapeProductPage(productUrl, category);
          if (product) {
            this.products.push(product);
            this.processedProductIds.add(productId);
            console.log(`      ✅ Scraped: ${product.title} - ${product.price}`);
          }
          await this.delay(800);
        }
      } catch (error) {
        console.error(`      ❌ Error scraping product ${productUrl}:`, error.message);
      }
    }
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/product_id=(\d+)/);
    return match ? match[1] : null;
  }

  private async scrapeProductPage(productUrl: string, category: CategoryInfo): Promise<GmsocialProduct | null> {
    try {
      const response = await axios.get(productUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const productId = this.extractProductId(productUrl);
      
      if (!productId) {
        console.log(`      ⚠️  Could not extract product ID from ${productUrl}`);
        return null;
      }
      
      // Extract product information
      const title = this.extractTitle($);
      const price = this.extractPrice($);
      const imageUrl = this.extractImageUrl($);
      const vendor = this.extractVendor($);
      const description = this.extractDescription($);
      
      if (!title || !price) {
        console.log(`      ⚠️  Missing essential data for product ${productId}: title=${!!title}, price=${!!price}`);
        return null;
      }
      
      return {
        id: productId,
        title: title.trim(),
        price: price.trim(),
        imageUrl: imageUrl || '',
        productUrl,
        category: category.name,
        categoryCode: category.code,
        vendor: vendor || '',
        description: description || '',
        mallId: 'gmsocial',
        mallName: '광명가치몰',
        mallUrl: this.baseUrl,
        region: '경기도 광명시'
      };
      
    } catch (error) {
      console.error(`      ❌ Error fetching product page ${productUrl}:`, error.message);
      return null;
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_name h1',
      '.product_name h1',
      '.goods_title h1',
      '.product_title h1',
      'h1.goods_name',
      'h1.product_name',
      '.product_info h1',
      '.goods_info h1',
      'h1',
      '.title h1',
      '.goods_name',
      '.product_name'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    }
    
    return '';
  }

  private extractPrice($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_price .price',
      '.product_price .price', 
      '.price_area .price',
      '.price_info .price',
      '.goods_price',
      '.product_price',
      '.price',
      '.sale_price',
      '.final_price',
      '.current_price'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && (text.includes('원') || text.includes('₩') || /\d+/.test(text))) {
          return text;
        }
      }
    }
    
    return '';
  }

  private extractImageUrl($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_image img',
      '.product_image img',
      '.goods_photo img',
      '.product_photo img',
      '.main_image img',
      '.product_main_image img',
      '.goods_main_image img',
      '.image_area img',
      '.photo_area img'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const src = element.attr('src');
        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('/')) {
            return 'http://gmsocial.mangotree.co.kr' + src;
          } else if (src.startsWith('http')) {
            return src;
          } else {
            return 'http://gmsocial.mangotree.co.kr/mall/' + src;
          }
        }
      }
    }
    
    return '';
  }

  private extractVendor($: cheerio.CheerioAPI): string {
    const selectors = [
      '.seller_info .seller_name',
      '.vendor_info .vendor_name',
      '.shop_info .shop_name',
      '.seller_name',
      '.vendor_name',
      '.shop_name',
      '.brand_name'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    }
    
    return '';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const selectors = [
      '.goods_description',
      '.product_description',
      '.goods_summary',
      '.product_summary',
      '.description',
      '.summary'
    ];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 0 && text.length < 500) {
          return text;
        }
      }
    }
    
    return '';
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
    const productsFile = path.join(outputDir, 'gmsocial-products.json');
    fs.writeFileSync(productsFile, JSON.stringify(this.products, null, 2));
    
    // Save summary
    const summary = {
      mallName: '광명가치몰',
      mallUrl: this.baseUrl,
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      categoriesScraped: [...new Set(this.products.map(p => p.category))],
      productsByCategory: this.products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      priceRange: {
        min: Math.min(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      },
      sampleProducts: this.products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.productUrl
      }))
    };
    
    const summaryFile = path.join(outputDir, 'gmsocial-scrape-summary.json');
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
  const scraper = new GmsocialScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}