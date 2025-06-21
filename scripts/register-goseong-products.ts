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
  
  // Seafood products (primary specialty of Goseong)
  if (lowerTitle.includes('장어') || lowerTitle.includes('민물장어')) {
    return { category: '수산물/장어', tags: ['장어', '민물장어', '수산물', '고성특산', '동해특산'] };
  }
  
  if (lowerTitle.includes('황태') || lowerTitle.includes('코다리') || lowerTitle.includes('명태')) {
    return { category: '수산물/건어물', tags: ['황태', '코다리', '명태', '건어물', '고성특산', '동해특산'] };
  }
  
  if (lowerTitle.includes('성게') || lowerTitle.includes('우니')) {
    return { category: '수산물/성게', tags: ['성게', '우니', '수산물', '고성특산', '동해특산', '이스방'] };
  }
  
  if (lowerTitle.includes('문어') || lowerTitle.includes('해삼') || lowerTitle.includes('가자미') || 
      lowerTitle.includes('양미리') || lowerTitle.includes('먹태')) {
    return { category: '수산물/해산물', tags: ['문어', '해삼', '가자미', '양미리', '먹태', '수산물', '고성특산', '동해특산'] };
  }
  
  if (lowerTitle.includes('젓갈') || lowerTitle.includes('명란')) {
    return { category: '수산물/젓갈', tags: ['젓갈', '명란', '발효식품', '수산물', '고성특산'] };
  }
  
  // Agricultural products
  if (lowerTitle.includes('쌀') || lowerTitle.includes('찹쌀') || lowerTitle.includes('미')) {
    return { category: '농산물/곡류', tags: ['쌀', '찹쌀', '곡류', '고성농협', '오대미', '농산물'] };
  }
  
  if (lowerTitle.includes('생강') || lowerTitle.includes('진저')) {
    return { category: '농산물/생강', tags: ['생강', '생강청', '농산물', '건강식품', '고성특산'] };
  }
  
  if (lowerTitle.includes('블루베리') || lowerTitle.includes('잼')) {
    return { category: '농산물/가공식품', tags: ['블루베리', '잼', '가공식품', '농산물', '유기농'] };
  }
  
  if (lowerTitle.includes('들기름') || lowerTitle.includes('기름')) {
    return { category: '농산물/기름', tags: ['들기름', '저온압착', '농산물', '건강식품'] };
  }
  
  if (lowerTitle.includes('꿀') || lowerTitle.includes('아카시아')) {
    return { category: '농산물/꿀', tags: ['꿀', '아카시아', '야생화', '천연감미료', '농산물'] };
  }
  
  if (lowerTitle.includes('계란') || lowerTitle.includes('란') || lowerTitle.includes('청란')) {
    return { category: '농산물/축산', tags: ['계란', '청란', '자연방사', '축산물', '농산물'] };
  }
  
  // Pet products
  if (lowerTitle.includes('강아지') || lowerTitle.includes('반려') || lowerTitle.includes('간식')) {
    return { category: '반려동물용품', tags: ['강아지간식', '반려동물', '수제간식', '건조간식'] };
  }
  
  // Chocolate/desserts
  if (lowerTitle.includes('초코') || lowerTitle.includes('살라미') || lowerTitle.includes('초콜릿')) {
    return { category: '디저트/간식', tags: ['초코', '살라미', '디저트', '간식', '수입식품'] };
  }
  
  return { category: '고성특산품', tags: ['고성특산', '강원도특산'] };
}

async function registerGoseongProducts() {
  console.log('🚀 Starting Goseong Mall product registration...');
  
  try {
    // Read scraped products
    const goseongDataPath = path.join(__dirname, 'output/goseong-products.json');
    if (!fs.existsSync(goseongDataPath)) {
      throw new Error('Goseong products file not found. Please run the scraper first.');
    }
    
    const goseongData = fs.readFileSync(goseongDataPath, 'utf-8');
    const goseongProducts: Product[] = JSON.parse(goseongData);
    console.log(`📋 Found ${goseongProducts.length} scraped Goseong products`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: MainProduct[] = [];
    
    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf-8');
      existingProducts = JSON.parse(productsData);
      console.log(`📦 Found ${existingProducts.length} existing products`);
    }
    
    // Remove existing Goseong products
    const nonGoseongProducts = existingProducts.filter(p => p.mallId !== 'goseong');
    console.log(`🗑️ Removed ${existingProducts.length - nonGoseongProducts.length} existing Goseong products`);
    
    // Process and register new products
    const newProducts: MainProduct[] = [];
    let registeredCount = 0;
    let skippedCount = 0;
    
    for (const product of goseongProducts) {
      const price = parsePrice(product.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${product.title} - ${product.price}`);
        skippedCount++;
        continue;
      }
      
      const { category, tags } = categorizeProduct(product.title);
      
      const newProduct: MainProduct = {
        id: `goseong-${product.id}`,
        title: product.title,
        price: price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        category: category,
        description: product.description,
        mallId: 'goseong',
        mallName: '고성몰',
        mallUrl: 'https://gwgoseong-mall.com',
        region: '강원도 고성군',
        tags: tags,
        featured: registeredCount < 3, // First 3 products as featured
        isNew: true,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      registeredCount++;
      
      console.log(`✅ ${registeredCount}/${goseongProducts.length} Registered: ${newProduct.title} - ${price.toLocaleString()}원 (${category})`);
    }
    
    // Combine with existing non-Goseong products
    const allProducts = [...nonGoseongProducts, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2), 'utf-8');
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '고성몰',
      mallId: 'goseong',
      totalProcessed: goseongProducts.length,
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
        seafood: newProducts.filter(p => p.category.includes('수산물')).length,
        agriculture: newProducts.filter(p => p.category.includes('농산물')).length,
        fermented: newProducts.filter(p => p.title.includes('젓갈') || p.title.includes('생강청')).length
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    const summaryPath = path.join(__dirname, 'output/goseong-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredCount} products`);
    console.log(`⏭️ Skipped: ${skippedCount} products`);
    console.log(`📦 Total products in database: ${allProducts.length}`);
    console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`🐟 Seafood products: ${summary.specialties.seafood}`);
    console.log(`🌾 Agricultural products: ${summary.specialties.agriculture}`);
    console.log(`🥒 Fermented products: ${summary.specialties.fermented}`);
    console.log(`💾 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerGoseongProducts()
  .then(() => {
    console.log('🎉 Goseong Mall product registration completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });