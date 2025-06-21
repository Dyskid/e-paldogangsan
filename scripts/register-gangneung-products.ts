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
  const cleanPrice = priceStr.replace(/[^0-9,₩]/g, '');
  const numbers = cleanPrice.match(/[\d,]+/g);
  
  if (!numbers || numbers.length === 0) return 0;
  
  // If multiple prices (discount scenario), take the last one (final price)
  const finalPriceStr = numbers[numbers.length - 1];
  const price = parseInt(finalPriceStr.replace(/,/g, ''), 10);
  
  return isNaN(price) ? 0 : price;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const lowerTitle = title.toLowerCase();
  
  // Pet products
  if (lowerTitle.includes('강아지') || lowerTitle.includes('반려견') || lowerTitle.includes('펫')) {
    return { category: '반려동물용품', tags: ['반려동물', '강아지', '반려견', '펫', '영양제'] };
  }
  
  if (lowerTitle.includes('고양이') || lowerTitle.includes('반려묘')) {
    return { category: '반려동물용품', tags: ['반려동물', '고양이', '반려묘', '펫', '영양제'] };
  }
  
  // Traditional Korean sweets
  if (lowerTitle.includes('한과') || lowerTitle.includes('강정') || lowerTitle.includes('유과') || lowerTitle.includes('과즐')) {
    return { category: '전통한과', tags: ['한과', '전통과자', '강정', '유과', '강릉특산', '디저트'] };
  }
  
  // Seafood
  if (lowerTitle.includes('아귀') || lowerTitle.includes('오다리') || lowerTitle.includes('황태') || 
      lowerTitle.includes('먹태') || lowerTitle.includes('노가리') || lowerTitle.includes('쥐포')) {
    return { category: '수산물/건어물', tags: ['수산물', '건어물', '강릉특산', '동해특산', '건조식품'] };
  }
  
  // Traditional foods/fermented foods
  if (lowerTitle.includes('김치') || lowerTitle.includes('청국장') || lowerTitle.includes('고추지') || lowerTitle.includes('된장')) {
    return { category: '전통발효식품', tags: ['발효식품', '김치', '청국장', '전통식품', '건강식품'] };
  }
  
  // Coffee
  if (lowerTitle.includes('커피') || lowerTitle.includes('원두')) {
    return { category: '커피/음료', tags: ['커피', '원두', '음료', '강릉특산'] };
  }
  
  return { category: '강릉특산품', tags: ['강릉특산', '강원도특산'] };
}

async function registerGangneungProducts() {
  console.log('🚀 Starting Gangneung Mall product registration...');
  
  try {
    // Read scraped products
    const gangneungDataPath = path.join(__dirname, 'output/gangneung-products.json');
    if (!fs.existsSync(gangneungDataPath)) {
      throw new Error('Gangneung products file not found. Please run the scraper first.');
    }
    
    const gangneungData = fs.readFileSync(gangneungDataPath, 'utf-8');
    const gangneungProducts: Product[] = JSON.parse(gangneungData);
    console.log(`📋 Found ${gangneungProducts.length} scraped Gangneung products`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: MainProduct[] = [];
    
    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf-8');
      existingProducts = JSON.parse(productsData);
      console.log(`📦 Found ${existingProducts.length} existing products`);
    }
    
    // Remove existing Gangneung products
    const nonGangneungProducts = existingProducts.filter(p => p.mallId !== 'gangneung');
    console.log(`🗑️ Removed ${existingProducts.length - nonGangneungProducts.length} existing Gangneung products`);
    
    // Process and register new products
    const newProducts: MainProduct[] = [];
    let registeredCount = 0;
    let skippedCount = 0;
    
    for (const product of gangneungProducts) {
      const price = parsePrice(product.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${product.title} - ${product.price}`);
        skippedCount++;
        continue;
      }
      
      const { category, tags } = categorizeProduct(product.title);
      
      const newProduct: MainProduct = {
        id: `gangneung-${product.id}`,
        title: product.title,
        price: price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        category: category,
        description: product.description,
        mallId: 'gangneung',
        mallName: '강릉몰',
        mallUrl: 'https://gangneung-mall.com',
        region: '강원도 강릉시',
        tags: tags,
        featured: registeredCount < 3, // First 3 products as featured
        isNew: true,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      registeredCount++;
      
      console.log(`✅ ${registeredCount}/${gangneungProducts.length} Registered: ${newProduct.title} - ${price.toLocaleString()}원 (${category})`);
    }
    
    // Combine with existing non-Gangneung products
    const allProducts = [...nonGangneungProducts, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2), 'utf-8');
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '강릉몰',
      mallId: 'gangneung',
      totalProcessed: gangneungProducts.length,
      successfullyRegistered: registeredCount,
      skipped: skippedCount,
      totalProducts: allProducts.length,
      categories: [...new Set(newProducts.map(p => p.category))],
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    const summaryPath = path.join(__dirname, 'output/gangneung-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredCount} products`);
    console.log(`⏭️ Skipped: ${skippedCount} products`);
    console.log(`📦 Total products in database: ${allProducts.length}`);
    console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`💾 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerGangneungProducts()
  .then(() => {
    console.log('🎉 Gangneung Mall product registration completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });