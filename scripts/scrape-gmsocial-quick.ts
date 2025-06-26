import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ProductData {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  name: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified: string;
}

async function quickScrapeGmsocial() {
  console.log('🚀 Quick scraping of 광명가치몰...');
  
  const baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  const products: ProductData[] = [];
  
  // Only focus on the known working products
  const testIds = [121, 81, 80, 79, 75];
  
  for (const productId of testIds) {
    try {
      console.log(`🔍 Testing product ${productId}...`);
      
      const productUrl = `${baseUrl}goods/view.php?product_id=${productId}`;
      
      const response = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`⏭️ Product ${productId} not available`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title from page title
      const pageTitle = $('title').text().trim();
      let title = '';
      
      if (pageTitle && pageTitle.includes('>')) {
        title = pageTitle.split('>')[0].trim();
      }
      
      if (!title || title.length < 5) {
        console.log(`⚠️ No valid title for product ${productId}`);
        continue;
      }
      
      // Extract price from page content
      const bodyText = $('body').text();
      let price = '';
      
      const priceMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
      if (priceMatch) {
        price = priceMatch[0];
      }
      
      if (!price) {
        console.log(`⚠️ No price found for product ${productId}`);
        continue;
      }
      
      // Simple category logic
      let category = '기타';
      if (title.includes('도자기') || title.includes('클래스')) category = '공예품';
      if (title.includes('코딩') || title.includes('교육')) category = '교육/체험';
      if (title.includes('청소') || title.includes('방역')) category = '서비스';
      if (title.includes('식품') || title.includes('음식')) category = '식품';
      
      // Simple vendor extraction
      let vendor: string | undefined;
      if (title.includes('시니온협동조합')) vendor = '시니온협동조합';
      if (title.includes('크린환경')) vendor = '크린환경';
      
      const product: ProductData = {
        id: `gmsocial_${productId}`,
        title: title,
        name: title,
        price: price,
        imageUrl: '', // Skip image for now to be faster
        productUrl: productUrl,
        category: category,
        vendor: vendor,
        mallId: 'gmsocial',
        mallName: '광명가치몰',
        mallUrl: baseUrl,
        region: '경기도 광명시',
        description: title,
        tags: vendor ? [vendor, category] : [category],
        featured: false,
        isNew: false,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      products.push(product);
      console.log(`✅ Extracted: ${title} - ${price}`);
      
    } catch (error) {
      console.error(`❌ Error scraping product ${productId}:`, error);
    }
  }
  
  console.log(`\n🎉 Quick scraping complete! Found ${products.length} products`);
  
  // Save results
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'gmsocial-quick-scraped.json');
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`💾 Results saved to: ${outputFile}`);
  
  return products;
}

if (require.main === module) {
  quickScrapeGmsocial();
}

export { quickScrapeGmsocial };