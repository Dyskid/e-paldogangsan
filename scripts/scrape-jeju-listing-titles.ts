import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface JejuProductFromListing {
  gno: string;
  title: string;
  url: string;
}

class JejuListingScraper {
  private baseUrl = 'https://mall.ejeju.net';
  private products: JejuProductFromListing[] = [];

  async scrapeProductTitlesFromListings(): Promise<void> {
    console.log('🏷️ Starting to scrape product titles from Jeju mall listings...');
    
    // Try different category pages and main page
    const urlsToScrape = [
      'https://mall.ejeju.net/main/index.do',
      'https://mall.ejeju.net/goods/list.do?cate=31', // Traditional food
      'https://mall.ejeju.net/goods/list.do?cate=31004', // Rice cakes
      'https://mall.ejeju.net/goods/list.do?cate=31006', // Snacks
      'https://mall.ejeju.net/goods/list.do?cate=31008', // Traditional sweets
      'https://mall.ejeju.net/goods/list.do?cate=31009', // Bread/bakery
      'https://mall.ejeju.net/goods/list.do?cate=22', // Seafood
      'https://mall.ejeju.net/goods/list.do?cate=32', // Meat
    ];

    for (const url of urlsToScrape) {
      console.log(`\n📄 Scraping: ${url}`);
      await this.scrapeListingPage(url);
      await this.delay(2000); // Rate limiting
    }

    await this.saveResults();
    await this.updateProductTitles();
  }

  private async scrapeListingPage(url: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Look for product links and titles in various formats
      const productLinkSelectors = [
        'a[href*="goods/detail.do"]',
        'a[href*="gno="]',
        '.product-link',
        '.goods-link',
        '.item-link'
      ];

      let foundProducts = 0;

      for (const selector of productLinkSelectors) {
        $(selector).each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('gno=')) {
            const match = href.match(/gno=(\d+)/);
            if (match) {
              const gno = match[1];
              
              // Try to get title from the link text or nearby elements
              let title = $(elem).text().trim();
              
              // If link text is empty, try to find title in parent or sibling elements
              if (!title || title.length < 3) {
                title = $(elem).closest('.product-item, .goods-item, .item').find('.title, .name, .product-name, .goods-name').first().text().trim();
              }
              
              // If still no title, try alternative selectors
              if (!title || title.length < 3) {
                title = $(elem).siblings('.title, .name, .product-name, .goods-name').first().text().trim();
              }
              
              // If we found a meaningful title
              if (title && title.length > 3 && !title.includes('더보기') && !title.includes('상세보기')) {
                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                
                // Check if we already have this product
                const existing = this.products.find(p => p.gno === gno);
                if (!existing) {
                  this.products.push({ gno, title, url: fullUrl });
                  console.log(`   ✅ Found: ${gno} - ${title}`);
                  foundProducts++;
                }
              }
            }
          }
        });
      }

      console.log(`   📊 Found ${foundProducts} new products on this page`);

    } catch (error) {
      console.log(`   ❌ Error scraping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(__dirname, 'output', 'jeju-listing-titles.json');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(this.products, null, 2));
    console.log(`\n📁 Found ${this.products.length} products with titles`);
    console.log(`📁 Results saved to: ${outputPath}`);
  }

  private async updateProductTitles(): Promise<void> {
    console.log('\n🔄 Updating product titles in products.json...');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    let updatedCount = 0;
    
    for (const product of products) {
      if (product.mallId === 'mall_100_이제주몰') {
        const match = product.productUrl.match(/gno=(\d+)/);
        if (match) {
          const gno = match[1];
          const scrapedProduct = this.products.find(p => p.gno === gno);
          
          if (scrapedProduct && scrapedProduct.title !== product.name) {
            console.log(`🔄 Updating ${gno}:`);
            console.log(`   Old: ${product.name}`);
            console.log(`   New: ${scrapedProduct.title}`);
            
            product.name = scrapedProduct.title;
            updatedCount++;
          }
        }
      }
    }
    
    if (updatedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Updated ${updatedCount} product titles in products.json`);
    } else {
      console.log('\n📊 No titles needed updating');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new JejuListingScraper();
  await scraper.scrapeProductTitlesFromListings();
}

if (require.main === module) {
  main().catch(console.error);
}