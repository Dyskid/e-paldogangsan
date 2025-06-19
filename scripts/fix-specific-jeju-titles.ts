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

class SpecificJejuTitleFixer {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fixSpecificProductTitles(): Promise<void> {
    console.log('🔧 Fixing specific Jeju product titles with real names from the mall...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Find products that have generic titles or subscription titles but should have real product names
    const problematicProducts = products.filter(p => 
      p.mallId === 'mall_100_이제주몰' && 
      (p.name === '정기구독 신청' || 
       p.name.includes('제주 특산품') ||
       p.name.includes('제주몰 직배송') ||
       p.description.includes('제주 특산품 - 제주몰 직배송'))
    );
    
    console.log(`📦 Found ${problematicProducts.length} products that need title fixes`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < problematicProducts.length; i++) {
      const product = problematicProducts[i];
      const gnoMatch = product.productUrl.match(/gno=(\d+)/);
      const gno = gnoMatch ? gnoMatch[1] : 'unknown';
      
      console.log(`\n${i + 1}/${problematicProducts.length}. Processing product ${gno}`);
      console.log(`   Current name: ${product.name}`);
      console.log(`   URL: ${product.productUrl}`);
      
      try {
        const realTitle = await this.scrapeRealProductTitle(product.productUrl);
        
        if (realTitle && realTitle !== product.name && realTitle !== '정기구독 신청') {
          console.log(`   ✅ Found real title: ${realTitle}`);
          product.name = realTitle;
          
          // Also update description if it has generic text
          if (product.description.includes('제주 특산품 - 제주몰 직배송')) {
            product.description = realTitle; // Use the real title as description too
          }
          
          updatedCount++;
        } else {
          console.log(`   ❌ Could not find real title or it's same as current`);
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

  private async scrapeRealProductTitle(url: string): Promise<string | null> {
    try {
      // Clean up the URL - remove the "../" part
      const cleanUrl = url.replace('../', '');
      
      console.log(`     Fetching: ${cleanUrl}`);
      
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Try multiple strategies to find the product title
      let realTitle = '';
      
      // Strategy 1: Look for specific product title selectors
      const titleSelectors = [
        '.goods_subject',
        '.goods-subject', 
        '.product_subject',
        '.product-subject',
        '.goods_title',
        '.goods-title',
        '.product_title',
        '.product-title',
        '.item_title',
        '.item-title',
        '.subject',
        '.title',
        'h1.subject',
        'h1.title',
        'h1',
        'h2'
      ];

      for (const selector of titleSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          const text = element.first().text().trim();
          if (text && text.length > 3) {
            realTitle = this.cleanTitle(text);
            if (this.isValidProductTitle(realTitle)) {
              console.log(`     Found with selector "${selector}": ${realTitle}`);
              return realTitle;
            }
          }
        }
      }
      
      // Strategy 2: Look for meta tags
      const metaTitle = $('meta[property="og:title"]').attr('content');
      if (metaTitle) {
        realTitle = this.cleanTitle(metaTitle);
        if (this.isValidProductTitle(realTitle)) {
          console.log(`     Found in meta tag: ${realTitle}`);
          return realTitle;
        }
      }
      
      // Strategy 3: Look in page title
      const pageTitle = $('title').text();
      if (pageTitle) {
        realTitle = this.cleanTitle(pageTitle);
        if (this.isValidProductTitle(realTitle)) {
          console.log(`     Found in page title: ${realTitle}`);
          return realTitle;
        }
      }
      
      // Strategy 4: Look for any element containing product-like text patterns
      const productPatterns = ['[', ']', 'kg', 'g', '개입', '세트', '선물'];
      $('*').each((i, elem) => {
        if (realTitle) return false; // Break if found
        
        const text = $(elem).text().trim();
        if (text.length > 10 && text.length < 200) {
          const hasProductPattern = productPatterns.some(pattern => text.includes(pattern));
          if (hasProductPattern) {
            const cleaned = this.cleanTitle(text);
            if (this.isValidProductTitle(cleaned)) {
              console.log(`     Found with pattern matching: ${cleaned}`);
              realTitle = cleaned;
              return false;
            }
          }
        }
      });
      
      return realTitle || null;
      
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
      // Remove site name and common separators
      .replace(/이제주몰.*$/, '')
      .replace(/\s*-\s*이제주몰.*$/, '')
      .replace(/\s*\|\s*이제주몰.*$/, '')
      .replace(/\s*-\s*.*제주.*몰.*$/, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove common unwanted phrases
      .replace(/더보기|상세보기|자세히보기|구매하기|장바구니|바로구매/g, '')
      // Remove leading/trailing punctuation and whitespace
      .replace(/^[\s\-\|]+|[\s\-\|]+$/g, '')
      .trim();
  }

  private isValidProductTitle(title: string): boolean {
    return title.length > 5 && 
           !title.includes('더보기') && 
           !title.includes('상세보기') && 
           !title.includes('undefined') &&
           !title.includes('null') &&
           !title.includes('404') &&
           !title.includes('Error') &&
           !title.includes('정기구독') &&
           title !== '이제주몰' &&
           !title.toLowerCase().includes('not found') &&
           !title.includes('페이지를 찾을 수 없습니다') &&
           // Must contain product-like indicators
           (title.includes('[') || title.includes('kg') || title.includes('g') || 
            title.includes('개입') || title.includes('세트') || title.includes('선물') ||
            title.includes('한라') || title.includes('제주') || title.includes('특산'));
  }
}

async function main() {
  const fixer = new SpecificJejuTitleFixer();
  await fixer.fixSpecificProductTitles();
}

if (require.main === module) {
  main().catch(console.error);
}