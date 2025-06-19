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

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

class PriorityMallsFixer {
  private priorityMalls = [
    'mall_19_동해몰',
    'mall_27_태백몰', 
    'mall_70_청도_청리브',
    'mall_26_정선몰',
    'mall_75_울릉도',
    'mall_95_함양몰',
    'mall_99_제주몰',
    'mall_46_장수몰',
    'mall_50_해가람',
    'mall_84_영덕장터'
  ];

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fixPriorityMalls(): Promise<void> {
    console.log('🎯 Fixing priority malls with generic titles and URL issues...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
    
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const malls: Mall[] = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
    
    let totalUpdated = 0;
    
    for (const mallId of this.priorityMalls) {
      const mall = malls.find(m => m.id === mallId);
      if (!mall) {
        console.log(`❌ Mall ${mallId} not found`);
        continue;
      }
      
      const mallProducts = products.filter(p => p.mallId === mallId);
      if (mallProducts.length === 0) {
        console.log(`⚠️ No products found for ${mall.name}`);
        continue;
      }
      
      console.log(`\n🏪 Processing ${mall.name} (${mallProducts.length} products)`);
      console.log(`   Mall URL: ${mall.url}`);
      
      const updated = await this.fixMallProducts(mall, mallProducts);
      totalUpdated += updated;
      
      // Rate limiting between malls
      await this.delay(3000);
    }
    
    if (totalUpdated > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Total products updated: ${totalUpdated}`);
      console.log('📁 Updated products.json');
    } else {
      console.log('\n📊 No products needed updates');
    }
  }

  private async fixMallProducts(mall: Mall, products: Product[]): Promise<number> {
    let updatedCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n   ${i + 1}/${products.length}. ${product.name}`);
      
      // Check if product needs fixing
      const needsTitleFix = this.needsTitleFix(product);
      const needsUrlFix = this.needsUrlFix(product, mall);
      
      if (!needsTitleFix && !needsUrlFix) {
        console.log(`     ✅ Already correct`);
        continue;
      }
      
      try {
        // Try to scrape real product info
        const realInfo = await this.scrapeRealProductInfo(mall, product);
        
        if (realInfo) {
          if (needsTitleFix && realInfo.title) {
            console.log(`     📝 Title: ${product.name} → ${realInfo.title}`);
            product.name = realInfo.title;
            product.description = realInfo.title;
          }
          
          if (needsUrlFix && realInfo.url) {
            console.log(`     🔗 URL: ${product.productUrl} → ${realInfo.url}`);
            product.productUrl = realInfo.url;
          }
          
          if (realInfo.imageUrl) {
            console.log(`     🖼️ Image updated`);
            product.imageUrl = realInfo.imageUrl;
          }
          
          updatedCount++;
        } else {
          console.log(`     ❌ Could not scrape real info`);
        }
        
        await this.delay(2000);
        
      } catch (error) {
        console.log(`     ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await this.delay(3000);
      }
    }
    
    return updatedCount;
  }

  private needsTitleFix(product: Product): boolean {
    return product.name.includes('상품') && /\d+/.test(product.name) ||
           product.name.includes('특산품') ||
           product.name.includes('직배송') ||
           product.name.length < 10;
  }

  private needsUrlFix(product: Product, mall: Mall): boolean {
    try {
      const productDomain = new URL(product.productUrl).hostname;
      const mallDomain = new URL(mall.url).hostname;
      return !mall.url.includes(productDomain) && !productDomain.includes(mallDomain.replace('www.', ''));
    } catch (e) {
      return true; // Invalid URL needs fix
    }
  }

  private async scrapeRealProductInfo(mall: Mall, product: Product): Promise<{title?: string, url?: string, imageUrl?: string} | null> {
    try {
      // Try multiple strategies to find real product info
      
      // Strategy 1: Try the mall's main page to find similar products
      const mainPageInfo = await this.scrapeFromMainPage(mall);
      if (mainPageInfo.length > 0) {
        // Find best match for this product
        const match = this.findBestMatch(product, mainPageInfo);
        if (match) return match;
      }
      
      // Strategy 2: Try to access the product's current URL and extract info
      if (product.productUrl) {
        const directInfo = await this.scrapeFromDirectUrl(product.productUrl);
        if (directInfo) return directInfo;
      }
      
      // Strategy 3: Try constructing URL based on mall pattern
      const constructedInfo = await this.scrapeFromConstructedUrl(mall, product);
      if (constructedInfo) return constructedInfo;
      
      return null;
      
    } catch (error) {
      throw error;
    }
  }

  private async scrapeFromMainPage(mall: Mall): Promise<Array<{title: string, url: string, imageUrl?: string}>> {
    try {
      const response = await axios.get(mall.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const products: Array<{title: string, url: string, imageUrl?: string}> = [];
      
      // Look for product links
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && (href.includes('product') || href.includes('goods') || href.includes('item'))) {
          const title = $(elem).text().trim() || 
                       $(elem).find('img').attr('alt') || 
                       $(elem).attr('title') || '';
          
          if (title && title.length > 5) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, mall.url).href;
            const imageUrl = $(elem).find('img').attr('src');
            
            products.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: fullUrl,
              imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : new URL(imageUrl, mall.url).href) : undefined
            });
          }
        }
      });
      
      return products.slice(0, 20); // Limit to first 20 products
      
    } catch (error) {
      return [];
    }
  }

  private async scrapeFromDirectUrl(url: string): Promise<{title?: string, url?: string, imageUrl?: string} | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Extract title
      let title = '';
      const titleSelectors = ['h1', '.product-title', '.goods-title', '.item-title', 'title'];
      
      for (const selector of titleSelectors) {
        const text = $(selector).first().text().trim();
        if (text && text.length > 5 && !text.includes('404') && !text.includes('Error')) {
          title = text.replace(/\s+/g, ' ').trim();
          break;
        }
      }
      
      // Extract image
      let imageUrl = '';
      const imageSelectors = ['.product-image img', '.goods-image img', '.main-image img', 'img[alt*="product"]', 'img[alt*="상품"]'];
      
      for (const selector of imageSelectors) {
        const src = $(selector).first().attr('src');
        if (src) {
          imageUrl = src.startsWith('http') ? src : new URL(src, url).href;
          break;
        }
      }
      
      return title || imageUrl ? { title, url, imageUrl } : null;
      
    } catch (error) {
      return null;
    }
  }

  private async scrapeFromConstructedUrl(mall: Mall, product: Product): Promise<{title?: string, url?: string, imageUrl?: string} | null> {
    // This would attempt to construct URLs based on common patterns
    // For now, return null as this requires mall-specific logic
    return null;
  }

  private findBestMatch(product: Product, candidates: Array<{title: string, url: string, imageUrl?: string}>): {title: string, url: string, imageUrl?: string} | null {
    // Simple matching - find candidate with similar keywords
    const productKeywords = product.name.toLowerCase().split(/\s+/);
    
    let bestMatch: {title: string, url: string, imageUrl?: string} | null = null;
    let bestScore = 0;
    
    for (const candidate of candidates) {
      let score = 0;
      const candidateText = candidate.title.toLowerCase();
      
      for (const keyword of productKeywords) {
        if (keyword.length > 2 && candidateText.includes(keyword)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }
    
    return bestScore > 0 ? bestMatch : candidates[0] || null; // Return first if no good match
  }
}

async function main() {
  const fixer = new PriorityMallsFixer();
  await fixer.fixPriorityMalls();
}

if (require.main === module) {
  main().catch(console.error);
}