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
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class GmsocialCategoryScraper {
  private baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  private products: GmsocialProduct[] = [];
  private processedProductIds = new Set<string>();

  async run() {
    console.log('🚀 Starting Gmsocial category-based scraping...');
    
    try {
      // Define categories to scrape
      const categories = [
        { code: "0006", name: "식품" },
        { code: "0001", name: "생활/리빙" },
        { code: "0002", name: "패션/뷰티" },
        { code: "0003", name: "디지털/가전" },
        { code: "0004", name: "가구/인테리어" },
        { code: "0005", name: "스포츠/레저" }
      ];
      
      for (const category of categories) {
        console.log(`\n📂 Processing category: ${category.name} (${category.code})`);
        await this.scrapeCategoryListings(category);
        await this.delay(3000); // Delay between categories
      }
      
      console.log(`\n✅ Scraping completed! Found ${this.products.length} products`);
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      if (this.products.length > 0) {
        await this.saveResults();
      }
      throw error;
    }
  }

  private async scrapeCategoryListings(category: any) {
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage && page <= 5) { // Limit pages for safety
      try {
        const categoryUrl = `${this.baseUrl}goods/list.php?category_code=${category.code}&page=${page}`;
        console.log(`    📄 Scraping page ${page}: ${categoryUrl}`);
        
        const response = await axios.get(categoryUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const productsOnPage = this.extractProductsFromListing($, category);
        
        if (productsOnPage.length === 0) {
          console.log(`    ⚠️  No products found on page ${page}`);
          hasNextPage = false;
        } else {
          console.log(`    ✅ Found ${productsOnPage.length} products on page ${page}`);
          
          // Add products to our collection
          for (const product of productsOnPage) {
            if (!this.processedProductIds.has(product.id)) {
              this.products.push(product);
              this.processedProductIds.add(product.id);
              console.log(`      ✅ Added: ${product.title} - ${product.price}`);
            }
          }
        }
        
        // Check for next page by looking for pagination
        const nextButton = $('.pagination .next, .paging .next, a[href*="page=' + (page + 1) + '"]');
        if (nextButton.length === 0) {
          hasNextPage = false;
        }
        
        page++;
        await this.delay(2000);
        
      } catch (error) {
        console.error(`    ❌ Error scraping page ${page} of category ${category.name}:`, error.message);
        hasNextPage = false;
      }
    }
  }

  private extractProductsFromListing($: cheerio.CheerioAPI, category: any): GmsocialProduct[] {
    const products: GmsocialProduct[] = [];
    
    // Look for product containers - try multiple selectors
    const productSelectors = [
      '.goods_item',
      '.product_item', 
      '.item',
      '.list_goods .goods',
      '.goods_list .goods',
      '.product_list .product'
    ];
    
    let $productElements: cheerio.Cheerio<cheerio.Element> | null = null;
    
    for (const selector of productSelectors) {
      $productElements = $(selector);
      if ($productElements.length > 0) {
        console.log(`    Using selector: ${selector} (found ${$productElements.length} elements)`);
        break;
      }
    }
    
    // If no products found with standard selectors, look for any links with product_id
    if (!$productElements || $productElements.length === 0) {
      console.log(`    No products found with standard selectors, looking for product links...`);
      
      const productLinks: string[] = [];
      $('a[href*="product_id="]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('product_id=')) {
          productLinks.push(href);
        }
      });
      
      console.log(`    Found ${productLinks.length} product links directly`);
      
      // For each product link, try to extract basic info from the surrounding elements
      $('a[href*="product_id="]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        
        if (href && href.includes('product_id=')) {
          const productId = this.extractProductId(href);
          if (productId) {
            // Try to find product info in the link's parent or nearby elements
            const $container = $link.closest('div, li, td').length > 0 ? 
                              $link.closest('div, li, td') : $link.parent();
            
            const title = this.extractTitleFromContainer($, $container, $link);
            const price = this.extractPriceFromContainer($, $container);
            const imageUrl = this.extractImageFromContainer($, $container, $link);
            const vendor = this.extractVendorFromContainer($, $container);
            
            if (title && price) {
              const product: GmsocialProduct = {
                id: productId,
                title: title.trim(),
                price: price.trim(),
                imageUrl: imageUrl || '',
                productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                category: category.name,
                categoryCode: category.code,
                vendor: vendor || '',
                mallId: 'gmsocial',
                mallName: '광명가치몰',
                mallUrl: this.baseUrl,
                region: '경기도 광명시'
              };
              
              products.push(product);
            }
          }
        }
      });
      
      return products;
    }
    
    // Process each product element
    $productElements.each((_, element) => {
      const $element = $(element);
      
      // Extract product link
      const $link = $element.find('a[href*="product_id="]').first();
      const href = $link.attr('href');
      
      if (!href || !href.includes('product_id=')) {
        return; // Skip if no valid product link
      }
      
      const productId = this.extractProductId(href);
      if (!productId) return;
      
      // Extract product information
      const title = this.extractTitleFromContainer($, $element, $link);
      const price = this.extractPriceFromContainer($, $element);
      const imageUrl = this.extractImageFromContainer($, $element, $link);
      const vendor = this.extractVendorFromContainer($, $element);
      
      if (title && price) {
        const product: GmsocialProduct = {
          id: productId,
          title: title.trim(),
          price: price.trim(),
          imageUrl: imageUrl || '',
          productUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
          category: category.name,
          categoryCode: category.code,
          vendor: vendor || '',
          mallId: 'gmsocial',
          mallName: '광명가치몰',
          mallUrl: this.baseUrl,
          region: '경기도 광명시'
        };
        
        products.push(product);
      }
    });
    
    return products;
  }

  private extractProductId(url: string): string | null {
    const match = url.match(/product_id=(\d+)/);
    return match ? match[1] : null;
  }

  private extractTitleFromContainer($: cheerio.CheerioAPI, $container: cheerio.Cheerio<cheerio.Element>, $link: cheerio.Cheerio<cheerio.Element>): string {
    // Try to get title from link text first
    let title = $link.text().trim();
    if (title && title.length > 3) {
      return title;
    }
    
    // Try various selectors within the container
    const titleSelectors = [
      '.goods_name',
      '.product_name',
      '.goods_title',
      '.product_title',
      '.title',
      '.name',
      'h3',
      'h4',
      '.item_name'
    ];
    
    for (const selector of titleSelectors) {
      title = $container.find(selector).first().text().trim();
      if (title && title.length > 3) {
        return title;
      }
    }
    
    // Try to get title from image alt text
    const $img = $container.find('img').first();
    const altText = $img.attr('alt');
    if (altText && altText.length > 3) {
      return altText;
    }
    
    return '';
  }

  private extractPriceFromContainer($: cheerio.CheerioAPI, $container: cheerio.Cheerio<cheerio.Element>): string {
    const priceSelectors = [
      '.price',
      '.goods_price',
      '.product_price',
      '.sale_price',
      '.final_price',
      '.current_price'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $container.find(selector).first().text().trim();
      if (priceText && (priceText.includes('원') || priceText.includes('₩') || /\d+/.test(priceText))) {
        return priceText;
      }
    }
    
    // Try to find any text that looks like a price
    const allText = $container.text();
    const priceMatch = allText.match(/[\d,]+원|₩[\d,]+/);
    if (priceMatch) {
      return priceMatch[0];
    }
    
    return '';
  }

  private extractImageFromContainer($: cheerio.CheerioAPI, $container: cheerio.Cheerio<cheerio.Element>, $link: cheerio.Cheerio<cheerio.Element>): string {
    // Look for images in the container
    const $img = $container.find('img').first();
    const src = $img.attr('src');
    
    if (src) {
      if (src.startsWith('http')) {
        return src;
      } else if (src.startsWith('/')) {
        return 'http://gmsocial.mangotree.co.kr' + src;
      } else {
        return `${this.baseUrl}${src}`;
      }
    }
    
    return '';
  }

  private extractVendorFromContainer($: cheerio.CheerioAPI, $container: cheerio.Cheerio<cheerio.Element>): string {
    const vendorSelectors = [
      '.seller_name',
      '.vendor_name',
      '.shop_name',
      '.brand_name',
      '.company_name'
    ];
    
    for (const selector of vendorSelectors) {
      const vendorText = $container.find(selector).first().text().trim();
      if (vendorText && vendorText.length > 0) {
        return vendorText;
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
    const productsFile = path.join(outputDir, 'gmsocial-all-products.json');
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
      priceRange: this.products.length > 0 ? {
        min: Math.min(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...this.products.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      } : { min: 0, max: 0 },
      sampleProducts: this.products.slice(0, 10).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.productUrl
      }))
    };
    
    const summaryFile = path.join(outputDir, 'gmsocial-category-scrape-summary.json');
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
  const scraper = new GmsocialCategoryScraper();
  await scraper.run();
}

if (require.main === module) {
  main().catch(console.error);
}