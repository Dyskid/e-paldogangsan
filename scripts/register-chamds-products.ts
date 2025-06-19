import { readFileSync, writeFileSync } from 'fs';

interface ChamdsProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

interface DatabaseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

function extractPriceFromDescription(description: string): number {
  // Look for price patterns in Korean format
  const pricePatterns = [
    /판매가\s*:\s*([\d,]+)원/,
    /([\d,]+)원/,
    /가격\s*:\s*([\d,]+)원/,
    /(\d{1,3}(?:,\d{3})*)/
  ];

  for (const pattern of pricePatterns) {
    const match = description.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseInt(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  return 0;
}

function normalizeCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    '음료': '가공식품',
    '차': '가공식품', 
    '분말가루': '가공식품',
    '가공식품': '가공식품'
  };
  
  return categoryMap[category] || '기타';
}

function cleanDescription(description: string): string {
  return description
    .replace(/상품명\s*:\s*/g, '')
    .replace(/판매가\s*:\s*[\d,]+원/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function registerChamdsProducts(): Promise<void> {
  try {
    console.log('🔄 Starting 참달성 product registration...');

    // Read scraped products
    const chamdsProductsData = readFileSync('./scripts/output/chamds-products.json', 'utf8');
    const chamdsProducts: ChamdsProduct[] = JSON.parse(chamdsProductsData);
    
    console.log(`📦 Found ${chamdsProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: DatabaseProduct[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Convert and register new products
    const newProducts: DatabaseProduct[] = [];
    const now = new Date().toISOString();
    
    for (const chamdsProduct of chamdsProducts) {
      // Check if product already exists
      const existingProduct = existingProducts.find(p => p.id === chamdsProduct.id);
      
      if (existingProduct) {
        console.log(`⏭️ Product already exists: ${chamdsProduct.id}`);
        continue;
      }

      // Extract price from description
      const price = extractPriceFromDescription(chamdsProduct.description);
      
      // Clean description
      const cleanedDescription = cleanDescription(chamdsProduct.description);

      // Convert to database format
      const dbProduct: DatabaseProduct = {
        id: chamdsProduct.id,
        title: chamdsProduct.title,
        description: cleanedDescription,
        price: price,
        currency: 'KRW',
        imageUrl: chamdsProduct.imageUrl,
        productUrl: chamdsProduct.productUrl,
        mallId: chamdsProduct.mallId,
        mallName: chamdsProduct.mallName,
        mallUrl: 'https://chamds.com',
        region: chamdsProduct.region,
        category: normalizeCategory(chamdsProduct.category),
        tags: chamdsProduct.tags,
        isActive: true,
        isFeatured: false,
        clickCount: 0,
        createdAt: now,
        updatedAt: now
      };

      newProducts.push(dbProduct);
    }

    console.log(`✅ Prepared ${newProducts.length} new products for registration`);

    if (newProducts.length === 0) {
      console.log('ℹ️ No new products to add - all products already exist in database');
      return;
    }

    // Add new products to existing database
    const updatedProducts = [...existingProducts, ...newProducts];
    
    // Sort by updated date (newest first)
    updatedProducts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Write updated products database
    writeFileSync('./src/data/products.json', JSON.stringify(updatedProducts, null, 2));

    // Generate registration summary
    const summary = {
      timestamp: now,
      mall: {
        id: 'chamds',
        name: '참달성',
        url: 'https://chamds.com',
        region: '대구광역시'
      },
      products: {
        scraped: chamdsProducts.length,
        new: newProducts.length,
        existing: chamdsProducts.length - newProducts.length,
        total: updatedProducts.length
      },
      categories: [...new Set(newProducts.map(p => p.category))],
      priceAnalysis: {
        withPrices: newProducts.filter(p => p.price > 0).length,
        withoutPrices: newProducts.filter(p => p.price === 0).length,
        averagePrice: newProducts.length > 0 ? 
          Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.filter(p => p.price > 0).length) : 0
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title.substring(0, 50) + '...',
        price: p.price,
        category: p.category
      }))
    };

    writeFileSync('./scripts/output/chamds-registration-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Registration Summary:');
    console.log(`🏪 Mall: ${summary.mall.name} (${summary.mall.region})`);
    console.log(`📦 Products scraped: ${summary.products.scraped}`);
    console.log(`✅ New products added: ${summary.products.new}`);
    console.log(`⏭️ Products already existed: ${summary.products.existing}`);
    console.log(`📚 Total products in database: ${summary.products.total}`);
    console.log(`📂 Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Products with prices: ${summary.priceAnalysis.withPrices}/${newProducts.length}`);
    console.log(`📈 Average price: ₩${summary.priceAnalysis.averagePrice.toLocaleString()}`);

    if (summary.products.new > 0) {
      console.log('\n🎯 Sample products added:');
      summary.sampleProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.title} - ₩${product.price.toLocaleString()} (${product.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run registration
registerChamdsProducts().then(() => {
  console.log('✅ 참달성 product registration completed!');
}).catch(console.error);