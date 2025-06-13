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

interface JejuProductMapping {
  gno: string;
  realTitle: string;
  currentTitle: string;
  productUrl: string;
  found: boolean;
}

class ComprehensiveJejuTitleUpdater {
  private baseUrl = 'https://mall.ejeju.net';
  private productMappings: JejuProductMapping[] = [];

  async updateAllJejuTitles(): Promise<void> {
    console.log('🏷️ Starting comprehensive Jeju product title update...');
    
    // Load current products
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
    console.log(`📦 Found ${jejuProducts.length} Jeju products total`);
    
    // Initialize mappings for all Jeju products
    for (const product of jejuProducts) {
      const gnoMatch = product.productUrl.match(/gno=(\d+)/);
      if (gnoMatch) {
        this.productMappings.push({
          gno: gnoMatch[1],
          realTitle: '',
          currentTitle: product.name,
          productUrl: product.productUrl,
          found: false
        });
      }
    }

    console.log(`🔍 Need to find titles for ${this.productMappings.length} products`);
    
    // Scrape from multiple pages to find all products
    await this.scrapeAllPages();
    
    // Try to find missing products through pagination
    await this.scrapePaginatedPages();
    
    // Update products with found titles
    await this.updateProductTitles();
    
    // Generate report
    this.generateReport();
  }

  private async scrapeAllPages(): Promise<void> {
    console.log('\n📄 Scraping main pages...');
    
    const pagesToScrape = [
      'https://mall.ejeju.net/main/index.do',
      'https://mall.ejeju.net/', // Alternative main page
    ];

    for (const url of pagesToScrape) {
      console.log(`\n🔍 Scraping: ${url}`);
      await this.scrapePage(url);
      await this.delay(2000);
    }
  }

  private async scrapePaginatedPages(): Promise<void> {
    console.log('\n📄 Scraping paginated results...');
    
    // Try different page parameters
    const paginationUrls = [
      'https://mall.ejeju.net/main/index.do?page=1',
      'https://mall.ejeju.net/main/index.do?page=2',
      'https://mall.ejeju.net/main/index.do?page=3',
      'https://mall.ejeju.net/main/index.do?pageSize=50',
      'https://mall.ejeju.net/main/index.do?pageSize=100',
    ];

    for (const url of paginationUrls) {
      console.log(`\n🔍 Checking: ${url}`);
      await this.scrapePage(url);
      await this.delay(2000);
    }
  }

  private async scrapePage(url: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Look for product links with various selectors
      const productSelectors = [
        'a[href*="goods/detail.do"]',
        'a[href*="gno="]',
        '.product-link a',
        '.goods-link a',
        '.item-link a',
        '.product a',
        '.goods a'
      ];

      let foundOnThisPage = 0;

      for (const selector of productSelectors) {
        $(selector).each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('gno=')) {
            const match = href.match(/gno=(\d+)/);
            if (match) {
              const gno = match[1];
              
              // Find this product in our mappings
              const mapping = this.productMappings.find(m => m.gno === gno);
              if (mapping && !mapping.found) {
                // Try to get title from various sources
                let title = this.extractTitle($, elem);
                
                if (title && title.length > 3) {
                  // Clean up the title
                  title = this.cleanTitle(title);
                  
                  if (this.isValidTitle(title)) {
                    mapping.realTitle = title;
                    mapping.found = true;
                    foundOnThisPage++;
                    console.log(`   ✅ Found: ${gno} - ${title}`);
                  }
                }
              }
            }
          }
        });
      }

      console.log(`   📊 Found ${foundOnThisPage} new titles on this page`);

    } catch (error) {
      console.log(`   ❌ Error scraping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractTitle($: cheerio.CheerioAPI, elem: any): string {
    // Try multiple methods to extract title
    let title = '';
    
    // Method 1: Direct text content
    title = $(elem).text().trim();
    
    // Method 2: Look in parent container
    if (!title || title.length < 5) {
      const container = $(elem).closest('.product-item, .goods-item, .item, .product, .goods, div, li, td');
      title = container.find('.title, .name, .product-name, .goods-name, h3, h4, strong').first().text().trim();
    }
    
    // Method 3: Look in siblings
    if (!title || title.length < 5) {
      title = $(elem).siblings('.title, .name, .product-name, .goods-name').first().text().trim();
    }
    
    // Method 4: Look for alt text in images
    if (!title || title.length < 5) {
      const img = $(elem).find('img').first();
      if (img.length) {
        title = img.attr('alt') || img.attr('title') || '';
      }
    }
    
    // Method 5: Look in data attributes
    if (!title || title.length < 5) {
      title = $(elem).attr('data-name') || $(elem).attr('data-title') || '';
    }

    return title.trim();
  }

  private cleanTitle(title: string): string {
    return title
      // Remove price patterns
      .replace(/\d{1,3}(,\d{3})*원/g, '')
      // Remove extra whitespace and newlines
      .replace(/\s+/g, ' ')
      // Remove common unwanted phrases
      .replace(/더보기|상세보기|자세히보기/g, '')
      // Remove leading/trailing whitespace
      .trim();
  }

  private isValidTitle(title: string): boolean {
    return title.length > 3 && 
           !title.includes('더보기') && 
           !title.includes('상세보기') && 
           !title.includes('undefined') &&
           !title.includes('null') &&
           title !== '이제주몰';
  }

  private async updateProductTitles(): Promise<void> {
    console.log('\n🔄 Updating product titles in database...');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    let updatedCount = 0;
    let replacedGenericCount = 0;
    
    for (const product of products) {
      if (product.mallId === 'mall_100_이제주몰') {
        const gnoMatch = product.productUrl.match(/gno=(\d+)/);
        if (gnoMatch) {
          const gno = gnoMatch[1];
          const mapping = this.productMappings.find(m => m.gno === gno);
          
          if (mapping && mapping.found && mapping.realTitle !== product.name) {
            const isGeneric = product.name.includes('제주 상품') || 
                            product.name.includes('Jeju Specialty Products') ||
                            product.name.includes('Direct Delivery from Jeju Mall');
            
            console.log(`🔄 Updating ${gno}:`);
            console.log(`   Old: ${product.name}`);
            console.log(`   New: ${mapping.realTitle}`);
            
            product.name = mapping.realTitle;
            updatedCount++;
            
            if (isGeneric) {
              replacedGenericCount++;
            }
          }
        }
      }
    }
    
    if (updatedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Updated ${updatedCount} product titles`);
      console.log(`📊 Replaced ${replacedGenericCount} generic titles with real ones`);
    } else {
      console.log('\n📊 No title updates needed');
    }
  }

  private generateReport(): void {
    console.log('\n📋 FINAL REPORT');
    console.log('================');
    
    const foundCount = this.productMappings.filter(m => m.found).length;
    const missingCount = this.productMappings.filter(m => !m.found).length;
    
    console.log(`✅ Found real titles: ${foundCount}`);
    console.log(`❌ Still missing titles: ${missingCount}`);
    
    if (missingCount > 0) {
      console.log('\n🔍 Products still needing titles:');
      this.productMappings
        .filter(m => !m.found)
        .forEach(m => {
          console.log(`   - ${m.gno}: ${m.currentTitle}`);
        });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'output', 'jeju-title-update-report.json');
    const outputDir = path.dirname(reportPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      foundCount,
      missingCount,
      mappings: this.productMappings
    }, null, 2));
    
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const updater = new ComprehensiveJejuTitleUpdater();
  await updater.updateAllJejuTitles();
}

if (require.main === module) {
  main().catch(console.error);
}