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

interface JejuProductTitle {
  gno: string;
  originalTitle: string;
  realTitle: string;
  productUrl: string;
}

class JejuTitleScraper {
  private baseUrl = 'https://mall.ejeju.net';
  private productTitles: JejuProductTitle[] = [];

  async scrapeProductTitles(): Promise<void> {
    console.log('🏷️ Starting to scrape REAL product titles from Jeju mall...');
    
    // First get our current products to know which ones to update
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
    
    console.log(`📦 Found ${jejuProducts.length} Jeju products to update titles for`);

    // Extract gno from each product URL to fetch real titles
    for (const product of jejuProducts) {
      const match = product.productUrl.match(/gno=(\d+)/);
      if (match) {
        const gno = match[1];
        await this.fetchRealTitle(gno, product.name, product.productUrl);
        await this.delay(1000); // Rate limiting
      }
    }

    await this.saveResults();
  }

  private async fetchRealTitle(gno: string, currentTitle: string, productUrl: string): Promise<void> {
    try {
      console.log(`\n🔍 Fetching real title for product ${gno}`);
      console.log(`   Current title: ${currentTitle}`);
      
      const response = await axios.get(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple selectors to find the product title
      const titleSelectors = [
        '.goods-title',
        '.goods_title',
        '.product-title',
        '.product_title',
        '.item-name',
        '.item_name',
        '.goods-name',
        '.goods_name',
        'h1.title',
        'h1',
        '.title',
        '.name'
      ];

      let realTitle = '';
      
      for (const selector of titleSelectors) {
        const titleElement = $(selector);
        if (titleElement.length > 0) {
          let title = titleElement.first().text().trim();
          
          // Clean up common unwanted text
          title = title.replace(/이제주몰.*$/, '').replace(/\s*-\s*.*$/, '').trim();
          title = title.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').trim();
          
          console.log(`     Trying selector "${selector}": "${title}"`);
          
          if (title && 
              title.length > 3 && 
              !title.includes('undefined') && 
              title !== '이제주몰' && 
              !title.includes('이제주몰') &&
              !title.includes('404') &&
              !title.includes('Error')) {
            realTitle = title;
            console.log(`   ✅ Found real title: ${realTitle}`);
            break;
          }
        }
      }

      if (!realTitle) {
        console.log(`   ❌ Could not find real title, keeping current: ${currentTitle}`);
        realTitle = currentTitle;
      }

      this.productTitles.push({
        gno,
        originalTitle: currentTitle,
        realTitle,
        productUrl
      });

    } catch (error) {
      console.log(`   ❌ Error fetching title for ${gno}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.productTitles.push({
        gno,
        originalTitle: currentTitle,
        realTitle: currentTitle, // Keep original if failed
        productUrl
      });
    }
  }

  private async saveResults(): Promise<void> {
    const outputPath = path.join(__dirname, 'output', 'jeju-real-titles.json');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the title mapping
    fs.writeFileSync(outputPath, JSON.stringify(this.productTitles, null, 2));
    console.log(`\n📁 Title mapping saved to: ${outputPath}`);
    
    // Update products.json with real titles
    await this.updateProductsWithRealTitles();
  }

  private async updateProductsWithRealTitles(): Promise<void> {
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    let updatedCount = 0;
    
    for (const product of products) {
      if (product.mallId === 'mall_100_이제주몰') {
        const match = product.productUrl.match(/gno=(\d+)/);
        if (match) {
          const gno = match[1];
          const titleData = this.productTitles.find(t => t.gno === gno);
          
          if (titleData && titleData.realTitle !== titleData.originalTitle) {
            console.log(`🔄 Updating title for ${gno}:`);
            console.log(`   Old: ${product.name}`);
            console.log(`   New: ${titleData.realTitle}`);
            
            product.name = titleData.realTitle;
            updatedCount++;
          }
        }
      }
    }
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    
    console.log(`\n✅ Title update complete!`);
    console.log(`📊 Updated ${updatedCount} product titles`);
    console.log(`📁 Updated products.json`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const scraper = new JejuTitleScraper();
  await scraper.scrapeProductTitles();
}

if (require.main === module) {
  main().catch(console.error);
}