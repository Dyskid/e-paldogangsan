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
  
  // Seafood products (primary specialty of Donghae)
  if (lowerTitle.includes('복어') || lowerTitle.includes('복')) {
    return { category: '수산물/복어', tags: ['복어', '수산물', '동해특산', '동해시수협', '손질복어'] };
  }
  
  if (lowerTitle.includes('명태') || lowerTitle.includes('묵호태') || lowerTitle.includes('코다리')) {
    return { category: '수산물/명태', tags: ['명태', '묵호태', '코다리', '수산물', '동해특산', '건어물'] };
  }
  
  if (lowerTitle.includes('가자미')) {
    return { category: '수산물/가자미', tags: ['가자미', '반건조', '수산물', '동해특산', '손질가자미'] };
  }
  
  if (lowerTitle.includes('오징어') || lowerTitle.includes('한치')) {
    return { category: '수산물/오징어', tags: ['오징어', '한치', '수산물', '동해특산', '건오징어', '반건조'] };
  }
  
  if (lowerTitle.includes('골뱅이') || lowerTitle.includes('소라')) {
    return { category: '수산물/골뱅이', tags: ['골뱅이', '소라', '수산물', '동해특산', '연체동물'] };
  }
  
  if (lowerTitle.includes('고등어')) {
    return { category: '수산물/고등어', tags: ['고등어', '수산물', '동해특산', '청어류'] };
  }
  
  if (lowerTitle.includes('임연수') || lowerTitle.includes('이면수')) {
    return { category: '수산물/임연수', tags: ['임연수', '이면수', '수산물', '동해특산', '손질생선'] };
  }
  
  if (lowerTitle.includes('홍게') || lowerTitle.includes('대게')) {
    return { category: '수산물/게류', tags: ['홍게', '대게', '수산물', '동해특산', '갑각류'] };
  }
  
  if (lowerTitle.includes('대구')) {
    return { category: '수산물/대구', tags: ['대구', '수산물', '동해특산', '생대구'] };
  }
  
  // Meat products
  if (lowerTitle.includes('갈비') || lowerTitle.includes('육')) {
    return { category: '축산물/한우', tags: ['갈비', 'LA갈비', '축산물', '한우', '고급육'] };
  }
  
  // Agricultural/health products
  if (lowerTitle.includes('꿀') || lowerTitle.includes('벌꿀') || lowerTitle.includes('허니')) {
    return { category: '농산물/꿀', tags: ['꿀', '벌꿀', '스틱벌꿀', '농산물', '천연감미료'] };
  }
  
  if (lowerTitle.includes('더덕')) {
    return { category: '농산물/더덕', tags: ['더덕', '더덕진액', '농산물', '건강식품', '산채'] };
  }
  
  // Fermented foods
  if (lowerTitle.includes('김치')) {
    return { category: '발효식품/김치', tags: ['김치', '배추김치', '발효식품', '전통식품'] };
  }
  
  if (lowerTitle.includes('막장') || lowerTitle.includes('고추장') || lowerTitle.includes('된장')) {
    return { category: '발효식품/장류', tags: ['막장', '고추장', '된장', '발효식품', '전통식품', '분토마을'] };
  }
  
  return { category: '동해특산품', tags: ['동해특산', '강원도특산'] };
}

async function registerDonghaeProducts() {
  console.log('🚀 Starting Donghae Mall product registration...');
  
  try {
    // Read scraped products
    const donghaeDataPath = path.join(__dirname, 'output/donghae-products.json');
    if (!fs.existsSync(donghaeDataPath)) {
      throw new Error('Donghae products file not found. Please run the scraper first.');
    }
    
    const donghaeData = fs.readFileSync(donghaeDataPath, 'utf-8');
    const donghaeProducts: Product[] = JSON.parse(donghaeData);
    console.log(`📋 Found ${donghaeProducts.length} scraped Donghae products`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: MainProduct[] = [];
    
    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf-8');
      existingProducts = JSON.parse(productsData);
      console.log(`📦 Found ${existingProducts.length} existing products`);
    }
    
    // Remove existing Donghae products
    const nonDonghaeProducts = existingProducts.filter(p => p.mallId !== 'donghae');
    console.log(`🗑️ Removed ${existingProducts.length - nonDonghaeProducts.length} existing Donghae products`);
    
    // Process and register new products
    const newProducts: MainProduct[] = [];
    let registeredCount = 0;
    let skippedCount = 0;
    
    for (const product of donghaeProducts) {
      const price = parsePrice(product.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${product.title} - ${product.price}`);
        skippedCount++;
        continue;
      }
      
      const { category, tags } = categorizeProduct(product.title);
      
      const newProduct: MainProduct = {
        id: `donghae-${product.id}`,
        title: product.title,
        price: price,
        imageUrl: product.imageUrl,
        productUrl: product.productUrl,
        category: category,
        description: product.description,
        mallId: 'donghae',
        mallName: '동해몰',
        mallUrl: 'https://donghae-mall.com',
        region: '강원도 동해시',
        tags: tags,
        featured: registeredCount < 3, // First 3 products as featured
        isNew: true,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      registeredCount++;
      
      console.log(`✅ ${registeredCount}/${donghaeProducts.length} Registered: ${newProduct.title} - ${price.toLocaleString()}원 (${category})`);
    }
    
    // Combine with existing non-Donghae products
    const allProducts = [...nonDonghaeProducts, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2), 'utf-8');
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '동해몰',
      mallId: 'donghae',
      totalProcessed: donghaeProducts.length,
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
        fermented: newProducts.filter(p => p.category.includes('발효식품')).length,
        agricultural: newProducts.filter(p => p.category.includes('농산물')).length
      },
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    const summaryPath = path.join(__dirname, 'output/donghae-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredCount} products`);
    console.log(`⏭️ Skipped: ${skippedCount} products`);
    console.log(`📦 Total products in database: ${allProducts.length}`);
    console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
    console.log(`💰 Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`🐟 Seafood products: ${summary.specialties.seafood}`);
    console.log(`🥒 Fermented products: ${summary.specialties.fermented}`);
    console.log(`🌾 Agricultural products: ${summary.specialties.agricultural}`);
    console.log(`💾 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerDonghaeProducts()
  .then(() => {
    console.log('🎉 Donghae Mall product registration completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });