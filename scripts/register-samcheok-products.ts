import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

interface MainProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

function parsePrice(priceStr: string): number {
  // Clean the price string and extract the final price
  const cleanPrice = priceStr.replace(/[^0-9,₩%]/g, '');
  const numbers = cleanPrice.match(/[\d,]+/g);
  
  if (!numbers || numbers.length === 0) return 0;
  
  // If multiple prices (discount scenario), take the last one (final price)
  const finalPriceStr = numbers[numbers.length - 1];
  const price = parseInt(finalPriceStr.replace(/,/g, ''), 10);
  
  return isNaN(price) ? 0 : price;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const lowerTitle = title.toLowerCase();
  
  // Traditional Korean sweets and snacks
  if (lowerTitle.includes('약과') || lowerTitle.includes('왕기')) {
    return { category: '전통과자/약과', tags: ['약과', '왕기약과', '전통과자', '삼척특산', '전통제과'] };
  }
  
  // Seafood/marine products
  if (lowerTitle.includes('미역') || lowerTitle.includes('돌미역')) {
    return { category: '수산물/미역', tags: ['미역', '돌미역', '자연산', '동해안', '수산물', '삼척특산'] };
  }
  
  if (lowerTitle.includes('게장') || lowerTitle.includes('간장게장')) {
    return { category: '수산물/게장', tags: ['게장', '간장게장', '일미어담', '수산물', '삼척특산', '발효식품'] };
  }
  
  if (lowerTitle.includes('열기') || lowerTitle.includes('구이')) {
    return { category: '수산물/구이', tags: ['열기구이', '생선구이', '수산물', '삼척특산', '일미어담'] };
  }
  
  // Honey and bee products
  if (lowerTitle.includes('꿀') || lowerTitle.includes('벌꿀') || lowerTitle.includes('아카시아')) {
    return { category: '농산물/꿀', tags: ['꿀', '벌꿀', '아카시아꿀', '두메꿀', '오미벌꿀', '천연감미료'] };
  }
  
  // Health drinks and extracts
  if (lowerTitle.includes('도라지') && (lowerTitle.includes('청') || lowerTitle.includes('즙'))) {
    return { category: '건강식품/도라지', tags: ['도라지', '도라지청', '도라지즙', '건강식품', '삼척특산', '친환경'] };
  }
  
  if (lowerTitle.includes('오미자') && lowerTitle.includes('청')) {
    return { category: '건강식품/오미자', tags: ['오미자', '오미자청', '건강식품', '삼척특산', '육백산'] };
  }
  
  if (lowerTitle.includes('사과즙') || lowerTitle.includes('돌배즙')) {
    return { category: '건강식품/과즙', tags: ['사과즙', '돌배즙', '과즙', '건강식품', '자연그린', '저온착즙'] };
  }
  
  // Fermented foods
  if (lowerTitle.includes('청국장') || lowerTitle.includes('천국장')) {
    return { category: '발효식품/청국장', tags: ['청국장', '천국장', '발효식품', '국산콩', '전통식품'] };
  }
  
  // Premium Korean beef
  if (lowerTitle.includes('한우') || lowerTitle.includes('등심') || lowerTitle.includes('불고기') || lowerTitle.includes('양지')) {
    return { category: '축산물/한우', tags: ['한우', '강원한우', '등심', '불고기', '양지', '1+등급', '프리미엄'] };
  }
  
  // Traditional alcoholic drinks
  if (lowerTitle.includes('막걸리') && lowerTitle.includes('파우더')) {
    return { category: '음료/막걸리', tags: ['막걸리', '도라지막걸리', '파우더', '전통주', '건강음료'] };
  }
  
  // Traditional rice cakes
  if (lowerTitle.includes('떡') || lowerTitle.includes('기정떡')) {
    return { category: '전통떡', tags: ['떡', '기정떡', '석이기정떡', '전통떡', '삼척특산'] };
  }
  
  // Health supplements and snacks
  if (lowerTitle.includes('꾸러미') || lowerTitle.includes('사과랑') || lowerTitle.includes('딸기랑')) {
    return { category: '건강간식', tags: ['건강간식', '두타롱', '사과', '딸기', '국산', '해썹인증'] };
  }
  
  // Gift sets
  if (lowerTitle.includes('기운내바') || lowerTitle.includes('종합')) {
    return { category: '선물세트', tags: ['선물세트', '기운내바', '종합세트', '삼척특산', '선물용'] };
  }
  
  return { category: '삼척특산품', tags: ['삼척특산', '강원도특산'] };
}

async function registerSamcheokProducts() {
  console.log('🚀 Starting Samcheok Mall product registration...');
  
  try {
    // Read scraped products
    const samcheokDataPath = path.join(__dirname, 'output/samcheok-products.json');
    if (!fs.existsSync(samcheokDataPath)) {
      throw new Error('Samcheok products file not found. Please run the scraper first.');
    }
    
    const samcheokData = fs.readFileSync(samcheokDataPath, 'utf-8');
    const samcheokProducts: Product[] = JSON.parse(samcheokData);
    console.log(`📋 Found ${samcheokProducts.length} scraped Samcheok products`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: MainProduct[] = [];
    
    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf-8');
      existingProducts = JSON.parse(productsData);
      console.log(`📦 Found ${existingProducts.length} existing products`);
    }
    
    // Remove existing Samcheok products
    const nonSamcheokProducts = existingProducts.filter(p => p.mallId !== 'samcheok');
    console.log(`🗑️ Removed ${existingProducts.length - nonSamcheokProducts.length} existing Samcheok products`);
    
    // Process and register new products
    const newProducts: MainProduct[] = [];
    let registeredCount = 0;
    let skippedCount = 0;
    
    for (const product of samcheokProducts) {
      const price = parsePrice(product.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${product.title} - ${product.price}`);
        skippedCount++;
        continue;
      }
      
      const { category, tags } = categorizeProduct(product.title);
      
      const newProduct: MainProduct = {
        id: `samcheok-${product.id}`,
        title: product.title,
        price: price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        category: category,
        description: product.description,
        mallId: 'samcheok',
        mallName: '삼척몰',
        mallUrl: 'https://samcheok-mall.com',
        region: '강원도 삼척시',
        tags: tags,
        featured: registeredCount < 3, // First 3 products as featured
        isNew: true,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      registeredCount++;
      
      console.log(`✅ ${registeredCount}/${samcheokProducts.length} Registered: ${newProduct.title} - ${price.toLocaleString()}원 (${category})`);
    }
    
    // Combine with existing non-Samcheok products
    const allProducts = [...nonSamcheokProducts, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2), 'utf-8');
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '삼척몰',
      mallId: 'samcheok',
      totalProcessed: samcheokProducts.length,
      successfullyRegistered: registeredCount,
      skipped: skippedCount,
      totalProducts: allProducts.length,
      categories: [...new Set(newProducts.map(p => p.category))],
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
      },
      specialties: {
        traditional: newProducts.filter(p => p.category.includes('전통')).length,
        health: newProducts.filter(p => p.category.includes('건강식품')).length,
        hanwoo: newProducts.filter(p => p.category.includes('한우')).length,
        seafood: newProducts.filter(p => p.category.includes('수산물')).length
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    const summaryPath = path.join(__dirname, 'output/samcheok-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredCount} products`);
    console.log(`⏭️ Skipped: ${skippedCount} products`);
    console.log(`📦 Total products in database: ${allProducts.length}`);
    console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`🏛️ Traditional products: ${summary.specialties.traditional}`);
    console.log(`💊 Health products: ${summary.specialties.health}`);
    console.log(`🥩 Hanwoo products: ${summary.specialties.hanwoo}`);
    console.log(`🐟 Seafood products: ${summary.specialties.seafood}`);
    console.log(`💾 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerSamcheokProducts()
  .then(() => {
    console.log('🎉 Samcheok Mall product registration completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });