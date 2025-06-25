import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  mall: string;
  region: string;
  category: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  description?: string;
  source?: string;
}

interface ScrapedProduct {
  title: string;
  price: string;
  image: string;
  url: string;
  description?: string;
}

function generateProductId(title: string, mall: string): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const timestamp = Date.now();
  return `${mall}-${cleanTitle.substring(0, 20)}-${timestamp}`;
}

function categorizeProduct(title: string, description: string = ''): { category: string; tags: string[] } {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('한우') || text.includes('소고기') || text.includes('쇠고기')) {
    return { category: '육류', tags: ['한우', '소고기', '정육'] };
  }
  
  if (text.includes('감자') || text.includes('햇감자')) {
    return { category: '농산물', tags: ['감자', '햇감자', '채소'] };
  }
  
  if (text.includes('오미자')) {
    return { category: '농산물', tags: ['오미자', '건강식품', '전통차'] };
  }
  
  if (text.includes('김치') || text.includes('절임') || text.includes('젓갈')) {
    return { category: '가공식품', tags: ['김치', '젓갈', '발효식품'] };
  }
  
  if (text.includes('쌀') || text.includes('현미') || text.includes('잡곡')) {
    return { category: '농산물', tags: ['쌀', '곡물'] };
  }
  
  if (text.includes('배') || text.includes('사과') || text.includes('과일')) {
    return { category: '농산물', tags: ['과일', '신선식품'] };
  }
  
  if (text.includes('콩') || text.includes('두부') || text.includes('된장')) {
    return { category: '가공식품', tags: ['콩', '두부', '전통식품'] };
  }
  
  return { category: '기타', tags: ['장수특산품'] };
}

function hasValidPrice(product: ScrapedProduct): boolean {
  if (!product.price) return false;
  
  const price = product.price.replace(/[^\d]/g, '');
  const numPrice = parseInt(price);
  
  return !isNaN(numPrice) && numPrice > 0 && numPrice < 10000000;
}

async function registerJangsuProducts() {
  console.log('🚀 Starting 장수몰 product registration...');

  const scrapedDataPath = path.join(__dirname, 'output', 'jangsu-products.json');
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');

  if (!fs.existsSync(scrapedDataPath)) {
    console.error('❌ Scraped data file not found:', scrapedDataPath);
    return;
  }

  const scrapedProducts: ScrapedProduct[] = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));
  console.log(`📦 Found ${scrapedProducts.length} scraped products`);

  const validProducts = scrapedProducts.filter(hasValidPrice);
  console.log(`✅ ${validProducts.length} products have valid prices`);

  if (validProducts.length === 0) {
    console.log('⚠️  No products with valid prices found. Registration skipped.');
    return;
  }

  let existingProducts: Product[] = [];
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const existingJangsuProducts = existingProducts.filter(p => p.mall === '장수몰');
  console.log(`🔍 Found ${existingJangsuProducts.length} existing 장수몰 products`);

  const newProducts: Product[] = [];
  let duplicateCount = 0;
  let processedCount = 0;

  for (const scrapedProduct of validProducts) {
    processedCount++;
    
    const isDuplicate = existingProducts.some(existing => 
      existing.title === scrapedProduct.title && existing.mall === '장수몰'
    );

    if (isDuplicate) {
      duplicateCount++;
      console.log(`⏭️  Skipping duplicate: ${scrapedProduct.title}`);
      continue;
    }

    const { category, tags } = categorizeProduct(scrapedProduct.title, scrapedProduct.description);
    
    const newProduct: Product = {
      id: generateProductId(scrapedProduct.title, 'jangsu'),
      title: scrapedProduct.title,
      price: scrapedProduct.price,
      image: scrapedProduct.image,
      url: scrapedProduct.url,
      mall: '장수몰',
      region: '전북',
      category,
      tags,
      inStock: true,
      featured: false,
      description: scrapedProduct.description,
      source: 'scraper'
    };

    newProducts.push(newProduct);
    
    if (processedCount % 10 === 0) {
      console.log(`📈 Processed ${processedCount}/${validProducts.length} products...`);
    }
  }

  console.log(`\n📊 Registration Summary:`);
  console.log(`   - Scraped products: ${scrapedProducts.length}`);
  console.log(`   - Products with valid prices: ${validProducts.length}`);
  console.log(`   - Duplicates skipped: ${duplicateCount}`);
  console.log(`   - New products to register: ${newProducts.length}`);

  if (newProducts.length === 0) {
    console.log('⚠️  No new products to register.');
    return;
  }

  const updatedProducts = [...existingProducts, ...newProducts];

  fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));

  const summaryPath = path.join(__dirname, 'output', 'jangsu-registration-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    mall: '장수몰',
    scrapedCount: scrapedProducts.length,
    validPriceCount: validProducts.length,
    duplicatesSkipped: duplicateCount,
    newProductsRegistered: newProducts.length,
    totalProductsAfterRegistration: updatedProducts.length,
    categories: newProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleProducts: newProducts.slice(0, 3).map(p => ({
      title: p.title,
      price: p.price,
      category: p.category,
      tags: p.tags
    }))
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\n✅ Successfully registered ${newProducts.length} products from 장수몰`);
  console.log(`📁 Registration summary saved to: ${summaryPath}`);
  console.log(`📊 Total products in database: ${updatedProducts.length}`);
  
  console.log(`\n🏷️  Category Distribution:`);
  Object.entries(summary.categories).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} products`);
  });
}

registerJangsuProducts().catch(console.error);