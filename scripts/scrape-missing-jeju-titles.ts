import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  mallId: string;
  productUrl: string;
}

class MissingTitleScraper {
  private baseUrl = 'https://mall.ejeju.net';

  async scrapeMissingTitles(): Promise<void> {
    console.log('🔍 Searching for missing Jeju product titles...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    const jejuProducts = products.filter(p => 
      p.mallId === 'mall_100_이제주몰' && 
      p.name.includes('제주 상품')
    );
    
    console.log(`Found ${jejuProducts.length} products with generic titles`);
    
    // Try to scrape from different sections of the main page
    const searchUrls = [
      'https://mall.ejeju.net/main/index.do',
      'https://mall.ejeju.net/main/index.do?page=2',
      'https://mall.ejeju.net/main/index.do?page=3',
    ];

    let foundTitles = new Map<string, string>();

    for (const url of searchUrls) {
      console.log(`\n📄 Searching: ${url}`);
      const titles = await this.scrapePage(url);
      titles.forEach((title, gno) => foundTitles.set(gno, title));
      await this.delay(2000);
    }

    // Try to find products by searching
    for (const product of jejuProducts.slice(0, 10)) { // Limit to first 10 to avoid rate limiting
      const gnoMatch = product.productUrl.match(/gno=(\d+)/);
      if (gnoMatch) {
        const gno = gnoMatch[1];
        if (!foundTitles.has(gno)) {
          console.log(`\n🔍 Searching for product ${gno} on search pages...`);
          await this.searchForProduct(gno, foundTitles);
          await this.delay(2000);
        }
      }
    }

    // Update products with found titles
    await this.updateProductTitles(foundTitles);
  }

  private async scrapePage(url: string): Promise<Map<string, string>> {
    const titleMap = new Map<string, string>();
    
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
      
      // Look for product links
      $('a[href*="goods/detail.do"]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('gno=')) {
          const match = href.match(/gno=(\d+)/);
          if (match) {
            const gno = match[1];
            
            // Get title from link text or nearby elements
            let title = $(elem).text().trim();
            
            // Try to find title in parent container
            if (!title || title.length < 5) {
              const container = $(elem).closest('.product-item, .goods-item, .item, div, li');
              title = container.find('.title, .name, .product-name, .goods-name').first().text().trim();
            }

            // Clean up title
            if (title && title.length > 5) {
              title = title.replace(/\d{1,3}(,\d{3})*원/g, '').replace(/\s+/g, ' ').trim();
              if (!title.includes('더보기') && !title.includes('상세보기')) {
                titleMap.set(gno, title);
                console.log(`   ✅ Found: ${gno} - ${title}`);
              }
            }
          }
        }
      });

    } catch (error) {
      console.log(`   ❌ Error scraping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return titleMap;
  }

  private async searchForProduct(gno: string, foundTitles: Map<string, string>): Promise<void> {
    try {
      // Try search with product number
      const searchUrl = `${this.baseUrl}/search/searchResult.do?searchKeyword=${gno}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Look for the specific product in search results
      $(`a[href*="gno=${gno}"]`).each((i, elem) => {
        let title = $(elem).text().trim();
        
        if (!title || title.length < 5) {
          const container = $(elem).closest('.search-item, .product-item, .item, div, li');
          title = container.find('.title, .name').first().text().trim();
        }

        if (title && title.length > 5) {
          title = title.replace(/\d{1,3}(,\d{3})*원/g, '').replace(/\s+/g, ' ').trim();
          foundTitles.set(gno, title);
          console.log(`   ✅ Found via search: ${gno} - ${title}`);
        }
      });

    } catch (error) {
      console.log(`   ❌ Search failed for ${gno}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateProductTitles(foundTitles: Map<string, string>): Promise<void> {
    if (foundTitles.size === 0) {
      console.log('\n📊 No new titles found');
      return;
    }

    console.log(`\n🔄 Updating ${foundTitles.size} product titles...`);
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    let updatedCount = 0;
    
    for (const product of products) {
      if (product.mallId === 'mall_100_이제주몰') {
        const gnoMatch = product.productUrl.match(/gno=(\d+)/);
        if (gnoMatch) {
          const gno = gnoMatch[1];
          const newTitle = foundTitles.get(gno);
          
          if (newTitle && newTitle !== product.name) {
            console.log(`🔄 Updating ${gno}:`);
            console.log(`   Old: ${product.name}`);
            console.log(`   New: ${newTitle}`);
            
            product.name = newTitle;
            updatedCount++;
          }
        }
      }
    }
    
    if (updatedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Updated ${updatedCount} product titles`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new MissingTitleScraper();
  await scraper.scrapeMissingTitles();
}

if (require.main === module) {
  main().catch(console.error);
}