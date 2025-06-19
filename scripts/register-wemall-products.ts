import { readFileSync, writeFileSync } from 'fs';

interface WemallProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercent?: string;
  imageUrl: string;
  externalUrl: string;
  category: string;
  isNew: boolean;
  isBest: boolean;
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

function cleanPrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols, commas, and non-numeric characters except periods
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function normalizeCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    '식품/농산품': '농축수산물',
    '생활용품': '생활용품',
    '가구/인테리어': '가구/인테리어',
    '청소용품': '생활용품',
    '관공서구매상품': '생활용품',
    '장애인 기업 제품': '생활용품',
    '장애인기업 시공업체': '서비스',
    '토너.복사용지.사무용품.제지류.청소용품': '사무용품',
    '차/음료/과자/가공식품': '가공식품',
    '침구/커튼/소품': '가구/인테리어',
    '주방/생활/수납용품': '생활용품',
    '사무용품': '사무용품',
    '공사/인쇄': '서비스',
    '마대': '생활용품',
    '세제/제지/일용잡화': '생활용품',
    'BEST상품': '기타'
  };
  
  return categoryMap[category] || '기타';
}

async function registerWemallProducts(): Promise<void> {
  try {
    console.log('🔄 Starting 우리몰 product registration...');

    // Read scraped products
    const wemallProductsData = readFileSync('./scripts/output/wemall-products.json', 'utf8');
    const wemallProducts: WemallProduct[] = JSON.parse(wemallProductsData);
    
    console.log(`📦 Found ${wemallProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: DatabaseProduct[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Convert and register new products
    const newProducts: DatabaseProduct[] = [];
    const now = new Date().toISOString();
    
    for (const wemallProduct of wemallProducts) {
      // Check if product already exists
      const existingProduct = existingProducts.find(p => p.id === wemallProduct.id);
      
      if (existingProduct) {
        console.log(`⏭️ Product already exists: ${wemallProduct.id}`);
        continue;
      }

      // Convert to database format
      const dbProduct: DatabaseProduct = {
        id: wemallProduct.id,
        title: wemallProduct.title,
        description: wemallProduct.description || '',
        price: cleanPrice(wemallProduct.price),
        originalPrice: wemallProduct.originalPrice ? cleanPrice(wemallProduct.originalPrice) : undefined,
        currency: 'KRW',
        imageUrl: wemallProduct.imageUrl,
        productUrl: wemallProduct.externalUrl || `https://wemall.kr/product/product.html?mode=view&id=${wemallProduct.id.replace('wemall-', '')}`,
        mallId: wemallProduct.mallId,
        mallName: wemallProduct.mallName,
        mallUrl: 'https://wemall.kr',
        region: wemallProduct.region,
        category: normalizeCategory(wemallProduct.category),
        tags: wemallProduct.tags,
        isActive: true,
        isFeatured: wemallProduct.isBest || wemallProduct.isNew,
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
        id: 'wemall',
        name: '우리몰',
        url: 'https://wemall.kr',
        region: '대구광역시'
      },
      products: {
        scraped: wemallProducts.length,
        new: newProducts.length,
        existing: wemallProducts.length - newProducts.length,
        total: updatedProducts.length
      },
      categories: [...new Set(newProducts.map(p => p.category))],
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title.substring(0, 50) + '...',
        price: p.price,
        category: p.category
      }))
    };

    writeFileSync('./scripts/output/wemall-registration-summary.json', JSON.stringify(summary, null, 2));

    console.log('\\n📊 Registration Summary:');
    console.log(`🏪 Mall: ${summary.mall.name} (${summary.mall.region})`);
    console.log(`📦 Products scraped: ${summary.products.scraped}`);
    console.log(`✅ New products added: ${summary.products.new}`);
    console.log(`⏭️ Products already existed: ${summary.products.existing}`);
    console.log(`📚 Total products in database: ${summary.products.total}`);
    console.log(`📂 Categories: ${summary.categories.join(', ')}`);

    if (summary.products.new > 0) {
      console.log('\\n🎯 Sample products added:');
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
registerWemallProducts().then(() => {
  console.log('✅ 우리몰 product registration completed!');
}).catch(console.error);