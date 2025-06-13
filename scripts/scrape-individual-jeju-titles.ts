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

class IndividualJejuTitleScraper {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeIndividualProductTitles(): Promise<void> {
    console.log('🔍 Scraping individual Jeju product pages for real titles...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Find products with generic titles
    const genericProducts = products.filter(p => 
      p.mallId === 'mall_100_이제주몰' && 
      (p.name.includes('제주 상품') || 
       p.name.includes('Jeju Specialty Products') ||
       p.name.includes('Direct Delivery from Jeju Mall'))
    );
    
    console.log(`📦 Found ${genericProducts.length} products with generic titles`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < genericProducts.length; i++) {
      const product = genericProducts[i];
      console.log(`\n${i + 1}/${genericProducts.length}. Processing: ${product.name}`);
      console.log(`   URL: ${product.productUrl}`);
      
      try {
        const realTitle = await this.scrapeProductPage(product.productUrl);
        
        if (realTitle && realTitle !== product.name) {
          console.log(`   ✅ Found real title: ${realTitle}`);
          product.name = realTitle;
          updatedCount++;
        } else {
          console.log(`   ❌ Could not find real title, keeping current`);
          failedCount++;
        }
        
        // Rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedCount++;
        await this.delay(3000); // Longer delay on error
      }
    }
    
    // Save updated products
    if (updatedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Successfully updated ${updatedCount} product titles`);
    }
    
    console.log(`❌ Failed to update ${failedCount} products`);
    console.log(`📁 Updated products.json`);
  }

  private async scrapeProductPage(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple selectors to find the product title
      const titleSelectors = [
        '.goods-title',
        '.goods_title', 
        '.product-title',
        '.product_title',
        '.item-title',
        '.item_title',
        '.title',
        'h1',
        'h2',
        '.name',
        '.goods-name',
        '.goods_name',
        '.product-name',
        '.product_name'
      ];

      for (const selector of titleSelectors) {
        const titleElement = $(selector);
        if (titleElement.length > 0) {
          let title = titleElement.first().text().trim();
          
          if (title && title.length > 3) {
            // Clean up the title
            title = this.cleanTitle(title);
            
            if (this.isValidTitle(title)) {
              return title;
            }
          }
        }
      }
      
      // Try to extract from page title as fallback
      const pageTitle = $('title').text().trim();
      if (pageTitle) {
        let cleanedPageTitle = pageTitle
          .replace(/이제주몰.*$/, '')
          .replace(/\s*-\s*.*$/, '')
          .replace(/\s*\|\s*.*$/, '')
          .trim();
        
        if (cleanedPageTitle && cleanedPageTitle.length > 3 && this.isValidTitle(cleanedPageTitle)) {
          return cleanedPageTitle;
        }
      }
      
      return null;
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown scraping error');
    }
  }

  private cleanTitle(title: string): string {
    return title
      // Remove price patterns
      .replace(/\d{1,3}(,\d{3})*원/g, '')
      // Remove site name
      .replace(/이제주몰.*$/, '')
      // Remove common separators and what follows
      .replace(/\s*-\s*.*$/, '')
      .replace(/\s*\|\s*.*$/, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove common unwanted phrases
      .replace(/더보기|상세보기|자세히보기|구매하기/g, '')
      .trim();
  }

  private isValidTitle(title: string): boolean {
    return title.length > 3 && 
           !title.includes('더보기') && 
           !title.includes('상세보기') && 
           !title.includes('undefined') &&
           !title.includes('null') &&
           !title.includes('404') &&
           !title.includes('Error') &&
           title !== '이제주몰' &&
           !title.toLowerCase().includes('not found');
  }
}

async function main() {
  const scraper = new IndividualJejuTitleScraper();
  await scraper.scrapeIndividualProductTitles();
}

if (require.main === module) {
  main().catch(console.error);
}