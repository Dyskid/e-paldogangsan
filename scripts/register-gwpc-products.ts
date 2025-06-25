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
  const tags: string[] = ['평창특산품', '강원도특산'];
  const lowerName = productName.toLowerCase();
  
  // Beef products
  if (lowerName.includes('한우') || lowerName.includes('대관령')) {
    tags.push('한우', '축산물', '대관령한우', '프리미엄육류');
    if (lowerName.includes('육포')) tags.push('육포', '건조식품');
    if (lowerName.includes('불고기')) tags.push('불고기');
    if (lowerName.includes('등심')) tags.push('등심');
    if (lowerName.includes('채끝')) tags.push('채끝');
  }
  
  // Dairy products
  if (lowerName.includes('치즈')) {
    tags.push('치즈', '유제품', '발효식품');
  }
  if (lowerName.includes('요거트') || lowerName.includes('요구르트')) {
    tags.push('요거트', '유제품', '발효식품');
  }
  
  // Organic products
  if (lowerName.includes('유기농')) {
    tags.push('유기농', '친환경', '건강식품');
  }
  
  // Beverages and teas
  if (lowerName.includes('차') || lowerName.includes('tea')) {
    tags.push('차', '음료', '건강차');
  }
  if (lowerName.includes('커피')) {
    tags.push('커피', '음료', '원두');
  }
  if (lowerName.includes('즙')) {
    tags.push('건강즙', '음료', '건강식품');
  }
  
  // Traditional foods
  if (lowerName.includes('들기름')) {
    tags.push('들기름', '전통식품', '조미료', '건강식품');
  }
  if (lowerName.includes('오미자')) {
    tags.push('오미자', '전통식품', '건강식품', '과실청');
  }
  if (lowerName.includes('두유')) {
    tags.push('두유', '음료', '콩제품', '건강식품');
  }
  
  // Gift sets
  if (lowerName.includes('선물세트') || lowerName.includes('세트')) {
    tags.push('선물세트', '기념품');
  }
  
  // Highland specialties
  if (lowerName.includes('고랭지') || lowerName.includes('평창')) {
    tags.push('고랭지농산물', '평창특산');
  }
  
  // Olympic connection
  if (lowerName.includes('올림픽')) {
    tags.push('올림픽기념품');
  }
  
  // Quality certifications
  if (lowerName.includes('품질인증')) {
    tags.push('품질인증');
  }
  
  // Traditional or local
  if (lowerName.includes('시골') || lowerName.includes('전통')) {
    tags.push('전통식품');
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Normalize category based on product type
function normalizeCategory(productName: string): string {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('한우') || lowerName.includes('육포')) {
    return '축산물';
  }
  if (lowerName.includes('치즈') || lowerName.includes('요거트')) {
    return '유제품';
  }
  if (lowerName.includes('차') || lowerName.includes('커피') || lowerName.includes('즙') || lowerName.includes('두유')) {
    return '음료';
  }
  if (lowerName.includes('들기름') || lowerName.includes('오미자')) {
    return '가공식품';
  }
  if (lowerName.includes('선물세트')) {
    return '선물세트';
  }
  
  return '기타특산품';
}

// Parse price from string
function parsePrice(priceStr: string): number {
  const numericPrice = parseInt(priceStr.replace(/[^0-9]/g, ''));
  return isNaN(numericPrice) ? 0 : numericPrice;
}

async function registerGwpcProducts() {
  console.log('🚀 Starting 평창몰 product registration...');
  
  try {
    // Read scraped products
    const gwpcProductsData = readFileSync('./scripts/output/gwpc-products.json', 'utf8');
    const gwpcProducts: ScrapedProduct[] = JSON.parse(gwpcProductsData);
    
    console.log(`📦 Found ${gwpcProducts.length} products to register`);

    // Read existing products database
    const productsData = readFileSync('./src/data/products.json', 'utf8');
    const existingProducts: Product[] = JSON.parse(productsData);
    
    console.log(`📚 Current database has ${existingProducts.length} products`);

    // Remove any existing GWPC products to avoid duplicates
    const nonGwpcProducts = existingProducts.filter(p => p.mall?.mallId !== 'gwpc-mall');
    console.log(`🗑️ Removed ${existingProducts.length - nonGwpcProducts.length} existing GWPC products`);

    // Process and register new products
    const newProducts: Product[] = [];
    let productsWithPrices = 0;
    let skippedProducts = 0;
    
    const mallInfo = {
      mallId: 'gwpc-mall',
      mallName: '평창몰',
      mallUrl: 'https://gwpc-mall.com',
      region: '강원도'
    };
    
    for (const scrapedProduct of gwpcProducts) {
      // Parse price
      const price = parsePrice(scrapedProduct.price);
      
      if (price <= 0) {
        console.log(`⚠️ Skipping product with invalid price: ${scrapedProduct.name}`);
        skippedProducts++;
        continue;
      }
      
      productsWithPrices++;
      
      // Generate tags and category
      const tags = generateTags(scrapedProduct.name);
      const category = normalizeCategory(scrapedProduct.name);
      
      // Create product object
      const product: Product = {
        id: scrapedProduct.id,
        name: scrapedProduct.name,
        price: price,
        image: scrapedProduct.image,
        category: category,
        region: '강원도',
        url: scrapedProduct.url,
        description: '',
        tags: tags,
        isFeatured: Math.random() < 0.15, // 15% chance to be featured
        isNew: true,
        mall: mallInfo
      };
      
      newProducts.push(product);
      console.log(`✅ ${productsWithPrices}/${gwpcProducts.length} Registered: ${product.name} - ₩${price.toLocaleString()} (${category})`);
    }
    
    // Combine all products
    const allProducts = [...nonGwpcProducts, ...newProducts];
    
    // Save updated products database
    writeFileSync('./src/data/products.json', JSON.stringify(allProducts, null, 2), 'utf8');
    
    // Calculate statistics
    const totalProducts = allProducts.length;
    const categoryStats = newProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const tagStats = newProducts.reduce((acc, product) => {
      product.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    const averagePrice = newProducts.length > 0 ? 
      Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length) : 0;
    
    const priceRange = {
      min: newProducts.length > 0 ? Math.min(...newProducts.map(p => p.price)) : 0,
      max: newProducts.length > 0 ? Math.max(...newProducts.map(p => p.price)) : 0
    };
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: {
        name: '평창몰',
        url: 'https://gwpc-mall.com',
        region: '강원도'
      },
      registration: {
        totalProductsScraped: gwpcProducts.length,
        successfullyRegistered: newProducts.length,
        skipped: skippedProducts,
        totalInDatabase: totalProducts
      },
      statistics: {
        averagePrice,
        priceRange,
        categoryDistribution: categoryStats,
        topTags: Object.entries(tagStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }))
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        name: p.name,
        price: `₩${p.price.toLocaleString()}`,
        category: p.category,
        tags: p.tags.slice(0, 5)
      }))
    };
    
    // Save registration summary
    writeFileSync('./scripts/output/gwpc-registration-summary.json', JSON.stringify(summary, null, 2), 'utf8');
    
    // Console summary
    console.log('\n📊 Registration Summary:');
    console.log(`🏪 Mall: 평창몰 (강원도)`);
    console.log(`📦 Products scraped: ${gwpcProducts.length}`);
    console.log(`✅ Successfully registered: ${newProducts.length}`);
    console.log(`⏭️ Skipped (no price): ${skippedProducts}`);
    console.log(`📚 Total products in database: ${totalProducts}`);
    console.log(`💰 Average price: ₩${averagePrice.toLocaleString()}`);
    console.log(`💵 Price range: ₩${priceRange.min.toLocaleString()} - ₩${priceRange.max.toLocaleString()}`);
    
    console.log('\n📂 Category breakdown:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}개`);
      });
    
    console.log('\n🏷️ Top 10 tags:');
    summary.statistics.topTags.forEach(({ tag, count }) => {
      console.log(`  ${tag}: ${count}개`);
    });
    
    console.log('\n🎯 Sample products registered:');
    summary.sampleProducts.forEach((product, i) => {
      console.log(`  ${i + 1}. ${product.name}`);
      console.log(`     ${product.price} - ${product.category}`);
      console.log(`     Tags: ${product.tags.join(', ')}`);
    });
    
    console.log(`\n💾 Registration summary saved to: ./scripts/output/gwpc-registration-summary.json`);
    
    console.log('\n🎉 평창몰 product registration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run registration
registerGwpcProducts()
  .then(() => {
    console.log('✅ Registration process completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });