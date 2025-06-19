import { readFileSync, writeFileSync } from 'fs';

interface KkimchiProduct {
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

function extractPriceFromString(priceStr: string): { price: number; originalPrice?: number } {
  if (!priceStr) return { price: 0 };

  // Pattern: "10%18,600원→ 16,740원" (discount percentage, original price → discounted price)
  const discountPattern = /(\d+)%?([\d,]+)원→\s*([\d,]+)원/;
  const match = priceStr.match(discountPattern);
  
  if (match) {
    const originalPrice = parseInt(match[2].replace(/,/g, ''));
    const price = parseInt(match[3].replace(/,/g, ''));
    return { price, originalPrice };
  }

  // Simple price pattern: "12,000원"
  const simplePattern = /([\d,]+)원/;
  const simpleMatch = priceStr.match(simplePattern);
  
  if (simpleMatch) {
    const price = parseInt(simpleMatch[1].replace(/,/g, ''));
    return { price };
  }

  return { price: 0 };
}

function normalizeCategory(category: string): string {
  const categoryMap: { [key: string]: string } = {
    '포기김치': '가공식품',
    '30%할인전': '가공식품',
    '포기김치(할인)': '가공식품',
    '묵은지(할인)': '가공식품',
    '별미김치(할인)': '가공식품',
    '별미김치': '가공식품',
    '깍두기': '가공식품',
    '명인명품김치': '가공식품'
  };
  
  return categoryMap[category] || '가공식품';
}

async function registerKkimchiProducts(): Promise<void> {
  try {
    console.log('🔄 Starting 광주김치몰 product registration...');

    // Read scraped products
    const kkimchiProductsData = readFileSync('./scripts/output/kkimchi-products.json', 'utf8');
    const kkimchiProducts: KkimchiProduct[] = JSON.parse(kkimchiProductsData);
    
    console.log(`📦 Found ${kkimchiProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: DatabaseProduct[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Convert and register new products
    const newProducts: DatabaseProduct[] = [];
    const now = new Date().toISOString();
    
    for (const kkimchiProduct of kkimchiProducts) {
      // Check if product already exists
      const existingProduct = existingProducts.find(p => p.id === kkimchiProduct.id);
      
      if (existingProduct) {
        console.log(`⏭️ Product already exists: ${kkimchiProduct.id}`);
        continue;
      }

      // Extract prices
      const { price, originalPrice } = extractPriceFromString(kkimchiProduct.price);

      // Convert to database format
      const dbProduct: DatabaseProduct = {
        id: kkimchiProduct.id,
        title: kkimchiProduct.title,
        description: kkimchiProduct.description,
        price: price,
        originalPrice: originalPrice,
        currency: 'KRW',
        imageUrl: kkimchiProduct.imageUrl,
        productUrl: kkimchiProduct.productUrl,
        mallId: kkimchiProduct.mallId,
        mallName: kkimchiProduct.mallName,
        mallUrl: 'https://www.k-kimchi.kr',
        region: kkimchiProduct.region,
        category: normalizeCategory(kkimchiProduct.category),
        tags: kkimchiProduct.tags,
        isActive: true,
        isFeatured: kkimchiProduct.category.includes('명인') || kkimchiProduct.category.includes('할인'),
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
        id: 'kkimchi',
        name: '광주김치몰',
        url: 'https://www.k-kimchi.kr',
        region: '광주광역시'
      },
      products: {
        scraped: kkimchiProducts.length,
        new: newProducts.length,
        existing: kkimchiProducts.length - newProducts.length,
        total: updatedProducts.length
      },
      categories: [...new Set(newProducts.map(p => p.category))],
      priceAnalysis: {
        withPrices: newProducts.filter(p => p.price > 0).length,
        withoutPrices: newProducts.filter(p => p.price === 0).length,
        withDiscounts: newProducts.filter(p => p.originalPrice !== undefined).length,
        averagePrice: newProducts.length > 0 ? 
          Math.round(newProducts.filter(p => p.price > 0).reduce((sum, p) => sum + p.price, 0) / newProducts.filter(p => p.price > 0).length) : 0
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title.substring(0, 50) + (p.title.length > 50 ? '...' : ''),
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.category
      }))
    };

    writeFileSync('./scripts/output/kkimchi-registration-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Registration Summary:');
    console.log(`🏪 Mall: ${summary.mall.name} (${summary.mall.region})`);
    console.log(`📦 Products scraped: ${summary.products.scraped}`);
    console.log(`✅ New products added: ${summary.products.new}`);
    console.log(`⏭️ Products already existed: ${summary.products.existing}`);
    console.log(`📚 Total products in database: ${summary.products.total}`);
    console.log(`📂 Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Products with prices: ${summary.priceAnalysis.withPrices}/${newProducts.length}`);
    console.log(`🏷️ Products with discounts: ${summary.priceAnalysis.withDiscounts}`);
    console.log(`📈 Average price: ₩${summary.priceAnalysis.averagePrice.toLocaleString()}`);

    if (summary.products.new > 0) {
      console.log('\n🎯 Sample products added:');
      summary.sampleProducts.forEach((product, index) => {
        const priceStr = product.originalPrice 
          ? `₩${product.originalPrice.toLocaleString()} → ₩${product.price.toLocaleString()}`
          : `₩${product.price.toLocaleString()}`;
        console.log(`  ${index + 1}. ${product.title} - ${priceStr} (${product.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run registration
registerKkimchiProducts().then(() => {
  console.log('✅ 광주김치몰 product registration completed!');
}).catch(console.error);