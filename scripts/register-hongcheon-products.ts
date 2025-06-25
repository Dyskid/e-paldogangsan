import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
}

// Generate tags based on product name
function generateTags(productName: string): string[] {
  const tags: string[] = ['홍천특산품', '강원도특산'];
  const lowerName = productName.toLowerCase();
  
  // Kimchi and fermented foods
  if (lowerName.includes('김치')) {
    tags.push('김치', '발효식품', '전통식품');
    if (lowerName.includes('포기김치')) tags.push('포기김치');
    if (lowerName.includes('깍두기')) tags.push('깍두기');
    if (lowerName.includes('파김치')) tags.push('파김치');
    if (lowerName.includes('백김치')) tags.push('백김치');
  }
  
  // Hanwoo (Korean beef)
  if (lowerName.includes('한우') || lowerName.includes('소고기')) {
    tags.push('한우', '소고기', '축산물', '프리미엄');
    if (lowerName.includes('등심')) tags.push('등심');
    if (lowerName.includes('갈비')) tags.push('갈비');
    if (lowerName.includes('불고기')) tags.push('불고기');
  }
  
  // Pork
  if (lowerName.includes('한돈') || lowerName.includes('돼지고기') || lowerName.includes('삼겹살')) {
    tags.push('한돈', '돼지고기', '축산물');
    if (lowerName.includes('삼겹살')) tags.push('삼겹살');
    if (lowerName.includes('목살')) tags.push('목살');
  }
  
  // Ginseng and red ginseng
  if (lowerName.includes('홍삼') || lowerName.includes('인삼')) {
    tags.push('건강식품', '전통식품');
    if (lowerName.includes('홍삼')) tags.push('홍삼', '홍삼제품');
    if (lowerName.includes('인삼')) tags.push('인삼', '인삼제품');
    if (lowerName.includes('진액') || lowerName.includes('엑기스')) tags.push('건강음료');
  }
  
  // Agricultural products
  if (lowerName.includes('감자')) {
    tags.push('감자', '농산물', '강원도특산');
  }
  if (lowerName.includes('옥수수') || lowerName.includes('찰옥수수')) {
    tags.push('옥수수', '농산물', '강원도특산');
    if (lowerName.includes('찰옥수수')) tags.push('찰옥수수');
  }
  if (lowerName.includes('고추') || lowerName.includes('고춧가루')) {
    tags.push('고추', '양념', '농산물');
    if (lowerName.includes('고춧가루')) tags.push('고춧가루');
  }
  if (lowerName.includes('잣')) {
    tags.push('잣', '견과류', '건강식품', '홍천잣');
  }
  if (lowerName.includes('칡') || lowerName.includes('갈근')) {
    tags.push('칡', '건강식품', '약재', '전통식품');
  }
  
  // Honey and bee products
  if (lowerName.includes('꿀') || lowerName.includes('벌꿀')) {
    tags.push('꿀', '벌꿀', '건강식품', '천연식품');
    if (lowerName.includes('아카시아')) tags.push('아카시아꿀');
    if (lowerName.includes('밤꿀')) tags.push('밤꿀');
  }
  
  // Rice and grains
  if (lowerName.includes('쌀') || lowerName.includes('미')) {
    tags.push('쌀', '곡물', '농산물');
    if (lowerName.includes('찹쌀')) tags.push('찹쌀');
    if (lowerName.includes('현미')) tags.push('현미');
  }
  
  // Mushrooms
  if (lowerName.includes('버섯')) {
    tags.push('버섯', '농산물', '건강식품');
    if (lowerName.includes('표고')) tags.push('표고버섯');
    if (lowerName.includes('느타리')) tags.push('느타리버섯');
  }
  
  // Tea and beverages
  if (lowerName.includes('차') && (lowerName.includes('음료') || lowerName.includes('티'))) {
    tags.push('차', '음료', '건강음료');
  }
  
  // Traditional snacks and foods
  if (lowerName.includes('떡') || lowerName.includes('한과')) {
    tags.push('전통간식', '디저트');
    if (lowerName.includes('떡')) tags.push('떡');
    if (lowerName.includes('한과')) tags.push('한과');
  }
  
  // Special product attributes
  if (lowerName.includes('국내산') || lowerName.includes('국산')) {
    tags.push('국내산');
  }
  if (lowerName.includes('무농약') || lowerName.includes('유기농')) {
    tags.push('친환경', '무농약');
  }
  if (lowerName.includes('haccp')) {
    tags.push('HACCP인증');
  }
  if (lowerName.includes('수제') || lowerName.includes('전통')) {
    tags.push('수제품', '전통방식');
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Normalize category based on product name
function normalizeCategory(productName: string): string {
  const lowerName = productName.toLowerCase();
  
  // Meat products
  if (lowerName.includes('한우') || lowerName.includes('소고기')) {
    return '축산물';
  }
  if (lowerName.includes('한돈') || lowerName.includes('돼지고기') || lowerName.includes('삼겹살')) {
    return '축산물';
  }
  
  // Kimchi and fermented foods
  if (lowerName.includes('김치') || lowerName.includes('장아찌') || lowerName.includes('젓갈')) {
    return '김치/반찬';
  }
  
  // Health foods
  if (lowerName.includes('홍삼') || lowerName.includes('인삼') || lowerName.includes('건강')) {
    return '건강식품';
  }
  
  // Agricultural products
  if (lowerName.includes('쌀') || lowerName.includes('잡곡') || lowerName.includes('곡물')) {
    return '쌀/잡곡';
  }
  if (lowerName.includes('감자') || lowerName.includes('옥수수') || lowerName.includes('고구마')) {
    return '농산물';
  }
  if (lowerName.includes('고추') || lowerName.includes('마늘') || lowerName.includes('양파')) {
    return '농산물';
  }
  if (lowerName.includes('버섯')) {
    return '농산물';
  }
  
  // Nuts and dried foods
  if (lowerName.includes('잣') || lowerName.includes('견과')) {
    return '견과/건과';
  }
  
  // Honey and bee products
  if (lowerName.includes('꿀') || lowerName.includes('벌꿀')) {
    return '꿀/잼';
  }
  
  // Tea and beverages
  if (lowerName.includes('차') || lowerName.includes('음료') || lowerName.includes('즙')) {
    return '차/음료';
  }
  
  // Traditional foods and snacks
  if (lowerName.includes('떡') || lowerName.includes('한과') || lowerName.includes('과자')) {
    return '떡/한과';
  }
  
  // Processed foods
  if (lowerName.includes('칡') || lowerName.includes('갈근') || lowerName.includes('분말')) {
    return '가공식품';
  }
  
  // Default category
  return '기타특산품';
}

// Parse price string to number
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters
  const cleanPrice = priceStr.replace(/[^0-9]/g, '');
  
  // Convert to number
  return parseInt(cleanPrice, 10) || 0;
}

async function registerHongcheonProducts(): Promise<void> {
  try {
    console.log('🚀 Starting 홍천몰 product registration...');

    // Read scraped products
    const hongcheonProductsData = readFileSync('./scripts/output/hongcheon-products.json', 'utf8');
    const hongcheonProducts: ScrapedProduct[] = JSON.parse(hongcheonProductsData);
    
    console.log(`📦 Found ${hongcheonProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: Product[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Remove any existing Hongcheon products to avoid duplicates
    const nonHongcheonProducts = existingProducts.filter(p => p.mall?.mallId !== 'hongcheon-mall');
    console.log(`🗑️ Removed ${existingProducts.length - nonHongcheonProducts.length} existing Hongcheon products`);

    // Process and register new products
    const newProducts: Product[] = [];
    let productsWithPrices = 0;
    let skippedProducts = 0;
    
    const mallInfo = {
      mallId: 'hongcheon-mall',
      mallName: '홍천몰',
      mallUrl: 'https://hongcheon-mall.com',
      region: '강원도'
    };
    
    for (const scrapedProduct of hongcheonProducts) {
      // Parse price
      const price = parsePrice(scrapedProduct.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${scrapedProduct.name} - ${scrapedProduct.price}`);
        skippedProducts++;
        continue;
      }
      
      productsWithPrices++;
      
      // Generate tags and category
      const tags = generateTags(scrapedProduct.name);
      const category = normalizeCategory(scrapedProduct.name);
      
      // Convert to database format
      const product: Product = {
        id: scrapedProduct.id,
        name: scrapedProduct.name,
        price: price,
        image: scrapedProduct.image,
        category: category,
        region: '강원도',
        url: scrapedProduct.url,
        description: '', // No description in scraped data
        tags: tags,
        isFeatured: newProducts.length < 5, // Feature first 5 products
        isNew: true,
        mall: mallInfo
      };
      
      newProducts.push(product);
      console.log(`✅ ${newProducts.length}/${hongcheonProducts.length} Registered: ${product.name} - ₩${price.toLocaleString()} (${category})`);
    }

    // Combine with existing non-Hongcheon products
    const allProducts = [...nonHongcheonProducts, ...newProducts];
    
    // Sort by product ID
    allProducts.sort((a, b) => a.id.localeCompare(b.id));

    // Write updated products database
    writeFileSync('./src/data/products.json', JSON.stringify(allProducts, null, 2));

    // Generate registration summary
    const categoryBreakdown: { [key: string]: number } = {};
    const tagFrequency: { [key: string]: number } = {};
    
    newProducts.forEach(p => {
      categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
      p.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });
    
    // Sort tags by frequency
    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    
    const summary = {
      timestamp: new Date().toISOString(),
      mall: mallInfo,
      products: {
        scraped: hongcheonProducts.length,
        registered: newProducts.length,
        skipped: skippedProducts,
        totalInDatabase: allProducts.length
      },
      categories: Object.keys(categoryBreakdown).sort(),
      categoryBreakdown: categoryBreakdown,
      topTags: topTags,
      priceAnalysis: {
        withPrices: productsWithPrices,
        withoutPrices: skippedProducts,
        averagePrice: productsWithPrices > 0 ? 
          Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / productsWithPrices) : 0,
        priceRange: newProducts.length > 0 ? {
          min: Math.min(...newProducts.map(p => p.price)),
          max: Math.max(...newProducts.map(p => p.price))
        } : { min: 0, max: 0 }
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };

    writeFileSync('./scripts/output/hongcheon-registration-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Registration Summary:');
    console.log(`🏪 Mall: ${summary.mall.mallName} (${summary.mall.region})`);
    console.log(`📦 Products scraped: ${summary.products.scraped}`);
    console.log(`✅ Successfully registered: ${summary.products.registered}`);
    console.log(`⏭️ Skipped (no price): ${summary.products.skipped}`);
    console.log(`📚 Total products in database: ${summary.products.totalInDatabase}`);
    console.log(`💰 Average price: ₩${summary.priceAnalysis.averagePrice.toLocaleString()}`);
    if (newProducts.length > 0) {
      console.log(`💵 Price range: ₩${summary.priceAnalysis.priceRange.min.toLocaleString()} - ₩${summary.priceAnalysis.priceRange.max.toLocaleString()}`);
    }
    
    console.log('\n📂 Category breakdown:');
    Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}개`);
      });
    
    console.log('\n🏷️ Top 10 tags:');
    topTags.forEach(({ tag, count }) => {
      console.log(`  ${tag}: ${count}개`);
    });

    if (newProducts.length > 0) {
      console.log('\n🎯 Sample products registered:');
      summary.sampleProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     ₩${product.price.toLocaleString()} - ${product.category}`);
        console.log(`     Tags: ${product.tags.join(', ')}`);
      });
    }

    if (summary.products.skipped > 0) {
      console.log(`\n⚠️ WARNING: ${summary.products.skipped} products were skipped due to invalid prices!`);
    }

    console.log(`\n💾 Registration summary saved to: ./scripts/output/hongcheon-registration-summary.json`);

  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run registration
registerHongcheonProducts().then(() => {
  console.log('\n🎉 홍천몰 product registration completed successfully!');
}).catch(error => {
  console.error('💥 Registration failed:', error);
  process.exit(1);
});