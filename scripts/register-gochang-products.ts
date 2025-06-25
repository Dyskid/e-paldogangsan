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
  category?: string;
}

function generateProductId(title: string, mall: string): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const timestamp = Date.now();
  return `${mall}-${cleanTitle.substring(0, 20)}-${timestamp}`;
}

function categorizeProduct(title: string, description: string = '', scrapedCategory: string = ''): { category: string; tags: string[] } {
  const text = `${title} ${description}`.toLowerCase();
  
  // Use scraped category first if available
  if (scrapedCategory && scrapedCategory !== '기타') {
    const categoryMap: Record<string, { category: string; tags: string[] }> = {
      '과일': { category: '농산물', tags: ['과일', '신선식품'] },
      '채소': { category: '농산물', tags: ['채소', '신선식품'] },
      '쌀·잡곡·견과': { category: '농산물', tags: ['쌀', '잡곡', '견과류'] },
      '해산·수산·육류': { category: '육류', tags: ['해산물', '수산물', '육류'] },
      '차·음료': { category: '가공식품', tags: ['차', '음료', '건강차'] },
      '가공식품': { category: '가공식품', tags: ['가공식품'] },
      '건강식품': { category: '가공식품', tags: ['건강식품', '건강관리'] }
    };
    
    if (categoryMap[scrapedCategory]) {
      return categoryMap[scrapedCategory];
    }
  }
  
  // Detailed categorization based on content
  if (text.includes('복분자') || text.includes('딸기') || text.includes('블루베리') || text.includes('오디')) {
    return { category: '농산물', tags: ['복분자', '딸기', '과일', '고창특산품'] };
  }
  
  if (text.includes('수박') || text.includes('멜론')) {
    return { category: '농산물', tags: ['수박', '멜론', '과일', '고창특산품'] };
  }
  
  if (text.includes('쌀') || text.includes('콩') || text.includes('깨') || text.includes('견과')) {
    return { category: '농산물', tags: ['쌀', '콩', '잡곡', '견과류'] };
  }
  
  if (text.includes('장어') || text.includes('풍천장어')) {
    return { category: '육류', tags: ['장어', '풍천장어', '고창특산품', '수산물'] };
  }
  
  if (text.includes('작두콩차') || text.includes('우엉차') || text.includes('초석잠차')) {
    return { category: '가공식품', tags: ['차', '건강차', '전통차', '고창특산품'] };
  }
  
  if (text.includes('즙') || text.includes('원액')) {
    return { category: '가공식품', tags: ['즙', '원액', '건강음료', '고창특산품'] };
  }
  
  if (text.includes('기름') || text.includes('참기름') || text.includes('들기름')) {
    return { category: '가공식품', tags: ['기름', '참기름', '들기름', '전통식품'] };
  }
  
  if (text.includes('소금') || text.includes('구운소금') || text.includes('황토')) {
    return { category: '가공식품', tags: ['소금', '구운소금', '황토', '고창특산품'] };
  }
  
  if (text.includes('간장') || text.includes('명인간장')) {
    return { category: '가공식품', tags: ['간장', '전통장류', '조미료'] };
  }
  
  if (text.includes('국수') || text.includes('오방국수')) {
    return { category: '가공식품', tags: ['국수', '면류', '전통식품'] };
  }
  
  if (text.includes('땅콩버터') || text.includes('버터')) {
    return { category: '가공식품', tags: ['땅콩버터', '견과류', '가공식품'] };
  }
  
  if (text.includes('환') || text.includes('보감') || text.includes('홍삼')) {
    return { category: '가공식품', tags: ['건강식품', '건강보조식품', '홍삼'] };
  }
  
  if (text.includes('콜라겐') || text.includes('식초') || text.includes('발사믹')) {
    return { category: '가공식품', tags: ['건강식품', '식초', '발사믹'] };
  }
  
  return { category: '기타', tags: ['고창특산품'] };
}

function hasValidPrice(product: ScrapedProduct): boolean {
  if (!product.price || product.price === '가격문의') return false;
  
  const price = product.price.replace(/[^\d]/g, '');
  const numPrice = parseInt(price);
  
  return !isNaN(numPrice) && numPrice > 0 && numPrice < 10000000;
}

async function registerGochangProducts() {
  console.log('🚀 Starting 고창마켓 product registration...');

  const scrapedDataPath = path.join(__dirname, 'output', 'gochang-products.json');
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

  const existingGochangProducts = existingProducts.filter(p => p.mall === '고창마켓');
  console.log(`🔍 Found ${existingGochangProducts.length} existing 고창마켓 products`);

  const newProducts: Product[] = [];
  let duplicateCount = 0;
  let processedCount = 0;

  for (const scrapedProduct of validProducts) {
    processedCount++;
    
    const isDuplicate = existingProducts.some(existing => 
      existing.title === scrapedProduct.title && existing.mall === '고창마켓'
    );

    if (isDuplicate) {
      duplicateCount++;
      console.log(`⏭️  Skipping duplicate: ${scrapedProduct.title}`);
      continue;
    }

    const { category, tags } = categorizeProduct(
      scrapedProduct.title, 
      scrapedProduct.description, 
      scrapedProduct.category
    );
    
    const newProduct: Product = {
      id: generateProductId(scrapedProduct.title, 'gochang'),
      title: scrapedProduct.title,
      price: scrapedProduct.price,
      image: scrapedProduct.image,
      url: scrapedProduct.url,
      mall: '고창마켓',
      region: '전북',
      category,
      tags,
      inStock: true,
      featured: false,
      description: scrapedProduct.description,
      source: 'scraper'
    };

    newProducts.push(newProduct);
    
    if (processedCount % 5 === 0) {
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

  const summaryPath = path.join(__dirname, 'output', 'gochang-registration-summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    mall: '고창마켓',
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

  console.log(`\n✅ Successfully registered ${newProducts.length} products from 고창마켓`);
  console.log(`📁 Registration summary saved to: ${summaryPath}`);
  console.log(`📊 Total products in database: ${updatedProducts.length}`);
  
  console.log(`\n🏷️  Category Distribution:`);
  Object.entries(summary.categories).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} products`);
  });
}

registerGochangProducts().catch(console.error);