import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

interface ScrapedProduct {
  name: string;
  price: string;
  image: string;
  link: string;
  mall: string;
  category?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

function generateProductId(mallId: string, index: number): string {
  const timestamp = Date.now();
  return `${mallId}_${timestamp}_${index}`;
}

function extractPrice(priceString: string): number {
  const cleaned = priceString.replace(/[^\d]/g, '');
  return parseInt(cleaned) || 0;
}

function cleanProductName(name: string): string {
  // Remove unnecessary characters and trim
  return name
    .replace(/\s+/g, ' ')
    .replace(/[\[\]]/g, '')
    .trim();
}

function generateTags(product: ScrapedProduct): string[] {
  const tags: string[] = ['전남', '담양'];
  
  // Add category as tag
  if (product.category) {
    tags.push(product.category);
  }
  
  // Extract tags from product name
  const name = product.name.toLowerCase();
  
  if (name.includes('한우')) tags.push('한우');
  if (name.includes('죽순')) tags.push('죽순');
  if (name.includes('대나무')) tags.push('대나무');
  if (name.includes('한과')) tags.push('한과');
  if (name.includes('유기농')) tags.push('유기농');
  if (name.includes('무농약')) tags.push('무농약');
  if (name.includes('전통')) tags.push('전통식품');
  if (name.includes('선물')) tags.push('선물세트');
  if (name.includes('세트')) tags.push('선물세트');
  if (name.includes('참기름') || name.includes('들기름')) tags.push('참기름/들기름');
  if (name.includes('죽향')) tags.push('죽향');
  if (name.includes('매실')) tags.push('매실');
  if (name.includes('식초')) tags.push('식초');
  if (name.includes('약과')) tags.push('약과');
  if (name.includes('유과')) tags.push('유과');
  if (name.includes('벌꿀')) tags.push('벌꿀');
  if (name.includes('딸기')) tags.push('딸기');
  if (name.includes('토마토')) tags.push('토마토');
  if (name.includes('쌀')) tags.push('쌀');
  if (name.includes('된장') || name.includes('고추장') || name.includes('간장')) tags.push('장류');
  
  // Remove duplicates
  return [...new Set(tags)];
}

function registerProducts() {
  try {
    // Read scraped products
    const scrapedData = JSON.parse(readFileSync('./scripts/output/damyang-products.json', 'utf-8'));
    const scrapedProducts: ScrapedProduct[] = scrapedData.products;
    
    console.log(`Found ${scrapedProducts.length} scraped products from 담양장터`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: Product[] = [];
    
    if (existsSync(productsPath)) {
      existingProducts = JSON.parse(readFileSync(productsPath, 'utf-8'));
      console.log(`Found ${existingProducts.length} existing products`);
    }
    
    // Check for existing products from this mall
    const existingMallProducts = existingProducts.filter(p => p.mall && p.mall.mallName === '담양장터');
    console.log(`Found ${existingMallProducts.length} existing products from 담양장터`);
    
    // Remove duplicates based on url
    const existingUrls = new Set(existingMallProducts.map(p => p.url));
    const newProducts = scrapedProducts.filter(p => !existingUrls.has(p.link));
    
    console.log(`${newProducts.length} new products to register`);
    
    // Convert and add new products
    let addedCount = 0;
    newProducts.forEach((scraped, index) => {
      const price = extractPrice(scraped.price);
      
      // Skip products with invalid prices
      if (price === 0) {
        console.log(`Skipping product with invalid price: ${scraped.name}`);
        return;
      }
      
      const product: Product = {
        id: generateProductId('damyang', addedCount),
        name: cleanProductName(scraped.name),
        price: price,
        image: scraped.image,
        category: scraped.category || '기타',
        region: '전남',
        url: scraped.link,
        description: cleanProductName(scraped.name),
        tags: generateTags(scraped),
        isFeatured: false,
        isNew: true,
        mall: {
          mallId: 'mall_64_담양장터',
          mallName: '담양장터',
          mallUrl: 'https://damyangmk.kr',
          region: '전남'
        }
      };
      
      existingProducts.push(product);
      addedCount++;
    });
    
    // Sort products by mall name for consistency
    existingProducts.sort((a, b) => {
      const mallNameA = a.mall?.mallName || '';
      const mallNameB = b.mall?.mallName || '';
      const nameA = a.name || '';
      const nameB = b.name || '';
      
      if (mallNameA === mallNameB) {
        return nameA.localeCompare(nameB);
      }
      return mallNameA.localeCompare(mallNameB);
    });
    
    // Save updated products
    writeFileSync(productsPath, JSON.stringify(existingProducts, null, 2));
    console.log(`\nSuccessfully added ${addedCount} new products from 담양장터`);
    console.log(`Total products in database: ${existingProducts.length}`);
    
    // Save registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '담양장터',
      totalScraped: scrapedProducts.length,
      existingProducts: existingMallProducts.length,
      newProducts: addedCount,
      skippedProducts: scrapedProducts.length - newProducts.length,
      totalInDatabase: existingProducts.length
    };
    
    writeFileSync('./scripts/output/damyang-registration-summary.json', JSON.stringify(summary, null, 2));
    console.log('\nRegistration summary saved to damyang-registration-summary.json');
    
  } catch (error) {
    console.error('Error registering products:', error);
  }
}

// Run registration
registerProducts();