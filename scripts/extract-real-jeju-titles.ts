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

class RealJejuTitleExtractor {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async extractRealTitles(): Promise<void> {
    console.log('🎯 Extracting real product titles from Jeju mall pages...\n');
    
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    // Focus on products that currently have "제주특별자치도" as title (these are the problematic ones)
    const problemProducts = products.filter(p => 
      p.mallId === 'mall_100_이제주몰' && 
      p.name === '제주특별자치도'
    );
    
    console.log(`📦 Found ${problemProducts.length} products with generic "제주특별자치도" titles`);
    
    let updatedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < problemProducts.length; i++) {
      const product = problemProducts[i];
      const gnoMatch = product.productUrl.match(/gno=(\d+)/);
      const gno = gnoMatch ? gnoMatch[1] : 'unknown';
      
      console.log(`\n${i + 1}/${problemProducts.length}. Processing product ${gno}`);
      console.log(`   Current name: ${product.name}`);
      console.log(`   URL: ${product.productUrl}`);
      
      try {
        const realTitle = await this.extractProductTitle(product.productUrl);
        
        if (realTitle) {
          console.log(`   ✅ Found real title: ${realTitle}`);
          product.name = realTitle;
          
          // Also update description to match
          product.description = realTitle;
          
          updatedCount++;
        } else {
          console.log(`   ❌ Could not extract real title`);
          failedCount++;
        }
        
        // Rate limiting
        await this.delay(2000);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedCount++;
        await this.delay(3000);
      }
    }
    
    // Save updated products
    if (updatedCount > 0) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
      console.log(`\n✅ Successfully updated ${updatedCount} product titles`);
    } else {
      console.log(`\n📊 No products were updated`);
    }
    
    console.log(`❌ Failed to update ${failedCount} products`);
    console.log(`📁 Updated products.json`);
  }

  private async extractProductTitle(url: string): Promise<string | null> {
    try {
      // Clean the URL
      const cleanUrl = url.replace('../', '');
      
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 30000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Strategy: Find text that matches the pattern [brand] product name pattern
      let bestTitle = '';
      let maxScore = 0;
      
      // Look for elements containing bracket patterns [something]
      $('*').each((i, elem) => {
        const text = $(elem).text().trim();
        
        // Skip if too short or too long
        if (text.length < 10 || text.length > 150) return;
        
        // Calculate score based on product title characteristics
        let score = 0;
        
        // Higher score for bracket patterns [brand name]
        if (text.match(/\[.*?\]/)) score += 10;
        
        // Higher score for common product keywords
        if (text.includes('kg') || text.includes('g') || text.includes('개입')) score += 5;
        if (text.includes('선물용') || text.includes('세트') || text.includes('선물세트')) score += 5;
        if (text.includes('골라담기')) score += 5;
        
        // Higher score for Jeju-related terms
        if (text.includes('제주') || text.includes('한라')) score += 3;
        
        // Lower score for common unwanted phrases
        if (text.includes('상품구성') || text.includes('포장단위') || text.includes('#')) score -= 5;
        if (text.includes('제주특별자치도') || text.includes('이제주몰')) score -= 10;
        
        // Must have basic product indicators to be considered
        const hasProductIndicators = text.includes('[') || 
                                    text.includes('kg') || 
                                    text.includes('세트') || 
                                    text.includes('선물') ||
                                    text.includes('골라담기');
        
        if (score > maxScore && hasProductIndicators && score > 5) {
          maxScore = score;
          bestTitle = text;
        }
      });
      
      if (bestTitle) {
        // Clean up the title
        bestTitle = bestTitle
          .replace(/\s+/g, ' ')
          .replace(/^\s*[\d\.\-\s]*/, '') // Remove leading numbers/dots
          .trim();
          
        console.log(`     Best match (score: ${maxScore}): ${bestTitle}`);
        return bestTitle;
      }
      
      return null;
      
    } catch (error) {
      throw error;
    }
  }
}

async function main() {
  const extractor = new RealJejuTitleExtractor();
  await extractor.extractRealTitles();
}

if (require.main === module) {
  main().catch(console.error);
}