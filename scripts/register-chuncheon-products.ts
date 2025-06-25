import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  mall: string;
  region: string;
  category: string;
  inStock: boolean;
  scrapedAt: string;
}

// Generate tags based on product name and category
function generateTags(productName: string): string[] {
  const tags: string[] = ['춘천특산품', '강원도특산'];
  const lowerName = productName.toLowerCase();
  
  // Food tags
  if (lowerName.includes('닭갈비') || lowerName.includes('닭 갈비')) {
    tags.push('닭갈비', '춘천닭갈비', '육류');
  }
  if (lowerName.includes('김치')) {
    tags.push('김치', '발효식품', '전통식품');
  }
  if (lowerName.includes('두부')) {
    tags.push('두부', '콩제품', '건강식품');
  }
  if (lowerName.includes('빵') || lowerName.includes('파이')) {
    tags.push('베이커리', '빵', '디저트');
  }
  if (lowerName.includes('돼지') && (lowerName.includes('갈비') || lowerName.includes('고기'))) {
    tags.push('돼지고기', '육류', '갈비');
  }
  if (lowerName.includes('오리')) {
    tags.push('오리고기', '육류');
  }
  if (lowerName.includes('닭') && !lowerName.includes('닭갈비')) {
    tags.push('닭고기', '육류');
  }
  if (lowerName.includes('잣') || lowerName.includes('백잣')) {
    tags.push('잣', '견과류', '건강식품');
  }
  if (lowerName.includes('감자')) {
    tags.push('감자', '강원도특산');
  }
  
  // Meal kit tags
  if (lowerName.includes('밀키트') || lowerName.includes('세트')) {
    tags.push('밀키트', '간편식');
  }
  
  // Non-food items
  if (lowerName.includes('붓') || lowerName.includes('필방')) {
    tags.push('문구', '서예용품', '전통공예');
  }
  if (lowerName.includes('비누')) {
    tags.push('생활용품', '비누', '천연제품');
  }
  if (lowerName.includes('시계')) {
    tags.push('생활용품', '인테리어');
  }
  if (lowerName.includes('렌즈')) {
    tags.push('생활용품', '렌즈용품');
  }
  if (lowerName.includes('곰팡이') || lowerName.includes('결로')) {
    tags.push('생활용품', '청소용품');
  }
  if (lowerName.includes('칼') || lowerName.includes('커팅')) {
    tags.push('주방용품', '생활용품');
  }
  if (lowerName.includes('자개')) {
    tags.push('공예품', '전통공예');
  }
  
  // Organic/special tags
  if (lowerName.includes('국산')) {
    tags.push('국산');
  }
  if (lowerName.includes('수제')) {
    tags.push('수제품');
  }
  if (lowerName.includes('무료배송')) {
    tags.push('무료배송');
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Normalize category based on product name and description
function normalizeCategory(productName: string, originalCategory: string): string {
  const lowerName = productName.toLowerCase();
  
  // Food categories
  if (lowerName.includes('닭갈비') || lowerName.includes('돼지갈비') || 
      lowerName.includes('오리') || lowerName.includes('닭') && !lowerName.includes('렌즈')) {
    return '육류';
  }
  if (lowerName.includes('김치')) {
    return '김치/반찬';
  }
  if (lowerName.includes('두부')) {
    return '가공식품';
  }
  if (lowerName.includes('빵') || lowerName.includes('파이') || lowerName.includes('과자')) {
    return '베이커리/간식';
  }
  if (lowerName.includes('잣') || lowerName.includes('백잣')) {
    return '농산물';
  }
  if (lowerName.includes('감자')) {
    return '농산물';
  }
  if (lowerName.includes('밀키트')) {
    return '간편식';
  }
  
  // Non-food categories
  if (lowerName.includes('붓') || lowerName.includes('필방') || lowerName.includes('자개')) {
    return '공예품';
  }
  if (lowerName.includes('비누') || lowerName.includes('렌즈') || lowerName.includes('시계') ||
      lowerName.includes('곰팡이') || lowerName.includes('칼') || lowerName.includes('커팅')) {
    return '생활용품';
  }
  
  // Default to original category or '기타'
  return originalCategory === '농특산물' ? '가공식품' : '기타';
}

// Parse price string to number
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters except comma
  const cleanPrice = priceStr.replace(/[^0-9,]/g, '');
  
  // Remove commas and convert to number
  return parseInt(cleanPrice.replace(/,/g, ''), 10) || 0;
}

async function registerChuncheonProducts(): Promise<void> {
  try {
    console.log('🔄 Starting 춘천몰 product registration...');

    // Read scraped products
    const chuncheonProductsData = readFileSync('./scripts/output/chuncheon-products.json', 'utf8');
    const chuncheonProducts: ScrapedProduct[] = JSON.parse(chuncheonProductsData);
    
    console.log(`📦 Found ${chuncheonProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: Product[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Create a map of existing product IDs for quick lookup
    const existingIds = new Set(existingProducts.map(p => p.id));

    // Convert and register new products
    const newProducts: Product[] = [];
    const updatedProducts: Product[] = [];
    let productsWithPrices = 0;
    let productsWithDiscounts = 0;
    
    const mallInfo = {
      mallId: 'chuncheon-mall',
      mallName: '춘천몰',
      mallUrl: 'https://gwch-mall.com',
      region: '강원도'
    };
    
    for (const scrapedProduct of chuncheonProducts) {
      // Extract prices
      const price = parsePrice(scrapedProduct.price);
      const originalPrice = scrapedProduct.originalPrice ? parsePrice(scrapedProduct.originalPrice) : undefined;
      
      if (price > 0) productsWithPrices++;
      if (originalPrice && originalPrice > price) productsWithDiscounts++;
      
      // Generate tags and normalize category
      const tags = generateTags(scrapedProduct.name);
      const category = normalizeCategory(scrapedProduct.name, scrapedProduct.category);
      
      // Convert to database format
      const product: Product = {
        id: scrapedProduct.id,
        name: scrapedProduct.name,
        price: price,
        originalPrice: originalPrice,
        image: scrapedProduct.image,
        category: category,
        region: scrapedProduct.region,
        url: scrapedProduct.url,
        description: '', // No description in scraped data
        tags: tags,
        isFeatured: false,
        isNew: !existingIds.has(scrapedProduct.id),
        mall: mallInfo
      };
      
      if (existingIds.has(scrapedProduct.id)) {
        // Update existing product
        const index = existingProducts.findIndex(p => p.id === scrapedProduct.id);
        if (index !== -1) {
          existingProducts[index] = product;
          updatedProducts.push(product);
          console.log(`🔄 Updated existing product: ${scrapedProduct.id}`);
        }
      } else {
        // Add new product
        newProducts.push(product);
        console.log(`✅ Added new product: ${product.name} - ₩${price.toLocaleString()}`);
      }
    }

    // Add new products to existing database
    if (newProducts.length > 0) {
      existingProducts.push(...newProducts);
    }
    
    // Sort by product ID
    existingProducts.sort((a, b) => a.id.localeCompare(b.id));

    // Write updated products database
    writeFileSync('./src/data/products.json', JSON.stringify(existingProducts, null, 2));

    // Generate registration summary
    const categoryBreakdown: { [key: string]: number } = {};
    [...newProducts, ...updatedProducts].forEach(p => {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
    });
    
    const summary = {
      timestamp: new Date().toISOString(),
      mall: mallInfo,
      products: {
        scraped: chuncheonProducts.length,
        new: newProducts.length,
        updated: updatedProducts.length,
        total: existingProducts.length
      },
      categories: Object.keys(categoryBreakdown).sort(),
      categoryBreakdown: categoryBreakdown,
      priceAnalysis: {
        withPrices: productsWithPrices,
        withoutPrices: chuncheonProducts.length - productsWithPrices,
        withDiscounts: productsWithDiscounts,
        averagePrice: productsWithPrices > 0 ? 
          Math.round([...newProducts, ...updatedProducts].reduce((sum, p) => sum + p.price, 0) / productsWithPrices) : 0,
        priceRange: {
          min: Math.min(...[...newProducts, ...updatedProducts].filter(p => p.price > 0).map(p => p.price)),
          max: Math.max(...[...newProducts, ...updatedProducts].filter(p => p.price > 0).map(p => p.price))
        }
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.category,
        tags: p.tags
      }))
    };

    writeFileSync('./scripts/output/chuncheon-registration-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Registration Summary:');
    console.log(`🏪 Mall: ${summary.mall.mallName} (${summary.mall.region})`);
    console.log(`📦 Products scraped: ${summary.products.scraped}`);
    console.log(`✅ New products added: ${summary.products.new}`);
    console.log(`🔄 Products updated: ${summary.products.updated}`);
    console.log(`📚 Total products in database: ${summary.products.total}`);
    console.log(`💰 Products with prices: ${summary.priceAnalysis.withPrices}/${chuncheonProducts.length}`);
    console.log(`🏷️ Products with discounts: ${summary.priceAnalysis.withDiscounts}`);
    console.log(`📈 Average price: ₩${summary.priceAnalysis.averagePrice.toLocaleString()}`);
    console.log(`💵 Price range: ₩${summary.priceAnalysis.priceRange.min.toLocaleString()} - ₩${summary.priceAnalysis.priceRange.max.toLocaleString()}`);
    
    console.log('\n📂 Category breakdown:');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}개`);
    });

    if (newProducts.length > 0) {
      console.log('\n🎯 Sample products added:');
      summary.sampleProducts.forEach((product, index) => {
        const priceStr = product.originalPrice && product.originalPrice > product.price ? 
          `₩${product.price.toLocaleString()} (원가: ₩${product.originalPrice.toLocaleString()})` : 
          `₩${product.price.toLocaleString()}`;
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     ${priceStr} - ${product.category}`);
        console.log(`     Tags: ${product.tags.join(', ')}`);
      });
    }

    if (summary.priceAnalysis.withoutPrices > 0) {
      console.log(`\n⚠️ WARNING: ${summary.priceAnalysis.withoutPrices} products have no valid prices!`);
    }

  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run registration
registerChuncheonProducts().then(() => {
  console.log('\n✅ 춘천몰 product registration completed successfully!');
}).catch(error => {
  console.error('💥 Registration failed:', error);
  process.exit(1);
});