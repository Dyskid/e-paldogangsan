import * as fs from 'fs';
import * as path from 'path';

interface OsansemallProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

interface ExistingProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall?: any;
  mallId?: string;
  mallName?: string;
  mallUrl?: string;
}

function cleanProductData(products: OsansemallProduct[]): OsansemallProduct[] {
  console.log('🧹 Cleaning product data...');
  
  const cleanedProducts = products.map(product => {
    // Clean product name - remove extra whitespace and product numbers
    let cleanName = product.name
      .replace(/\n\t+/g, ' ') // Remove newlines and tabs
      .replace(/상품번호\s*:\s*\d+/g, '') // Remove product number
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If name is too short after cleaning, keep original
    if (cleanName.length < 3) {
      cleanName = product.name;
    }
    
    // Clean description
    let cleanDescription = product.description
      .replace(/\n\t+/g, ' ')
      .replace(/상품번호\s*:\s*\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanDescription.length < cleanName.length) {
      cleanDescription = cleanName;
    }
    
    // Clean and improve categorization
    let category = product.category;
    const nameText = cleanName.toLowerCase();
    
    if (nameText.includes('두부') || nameText.includes('두유') || nameText.includes('콩')) {
      category = '농수산물';
    } else if (nameText.includes('막걸리') || nameText.includes('전통주') || nameText.includes('소주') || nameText.includes('독산')) {
      category = '전통주';
    } else if (nameText.includes('고추장') || nameText.includes('된장') || nameText.includes('청') || nameText.includes('미숫가루')) {
      category = '가공식품';
    } else if (nameText.includes('찹쌀파이') || nameText.includes('과자') || nameText.includes('쿠키') || nameText.includes('오란다')) {
      category = '과자류';
    } else if (nameText.includes('비누') || nameText.includes('캔들') || nameText.includes('디퓨저')) {
      category = '생활용품';
    } else if (nameText.includes('마스크') || nameText.includes('팩')) {
      category = '위생용품';
    } else if (nameText.includes('체험') || nameText.includes('교육') || nameText.includes('프로그램')) {
      category = '체험/교육';
    } else if (nameText.includes('소독') || nameText.includes('서비스')) {
      category = '서비스';
    }
    
    // Clean tags
    const cleanTags = [...new Set([
      '오산함께장터',
      '전통시장',
      '경기도',
      '오산시',
      category,
      '사회적경제'
    ])];
    
    // Validate price
    const validPrice = product.price > 0 ? product.price : 0;
    
    return {
      ...product,
      name: cleanName,
      description: cleanDescription,
      category,
      tags: cleanTags,
      price: validPrice
    };
  });
  
  // Remove duplicates based on name similarity
  const uniqueProducts: OsansemallProduct[] = [];
  const seenNames = new Set<string>();
  
  for (const product of cleanedProducts) {
    const normalizedName = product.name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^가-힣a-z0-9]/g, '');
    
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueProducts.push(product);
    }
  }
  
  console.log(`✅ Cleaned data: ${products.length} → ${uniqueProducts.length} products`);
  return uniqueProducts;
}

function registerOsansemallProducts() {
  console.log('📦 Starting osansemall product registration...');
  
  // Load scraped products
  const productsPath = path.join(__dirname, 'output', 'osansemall-products.json');
  if (!fs.existsSync(productsPath)) {
    throw new Error('osansemall-products.json not found. Run scraper first.');
  }
  
  const rawProducts: OsansemallProduct[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log(`📋 Loaded ${rawProducts.length} products from scraper`);
  
  // Clean the data
  const cleanedProducts = cleanProductData(rawProducts);
  
  // Filter products with valid prices
  const validProducts = cleanedProducts.filter(product => 
    product.price > 0 && 
    product.name.trim().length > 0 &&
    !product.name.toLowerCase().includes('undefined')
  );
  
  console.log(`✅ ${validProducts.length} products have valid prices and names`);
  
  // Load existing products
  const existingProductsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  let existingProducts: ExistingProduct[] = [];
  
  if (fs.existsSync(existingProductsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(existingProductsPath, 'utf-8'));
    console.log(`📋 Found ${existingProducts.length} existing products`);
  }
  
  // Check for duplicates
  const existingIds = new Set(existingProducts.map(p => p.id));
  const existingNames = new Set(existingProducts.map(p => p.name?.toLowerCase()).filter(Boolean));
  
  const newProducts = validProducts.filter(product => 
    !existingIds.has(product.id) && 
    !existingNames.has(product.name.toLowerCase())
  );
  
  console.log(`🆕 ${newProducts.length} new products to register`);
  
  if (newProducts.length === 0) {
    console.log('ℹ️ No new products to register');
    return { newCount: 0, totalCount: existingProducts.length };
  }
  
  // Add new products to existing ones
  const updatedProducts = [...existingProducts, ...newProducts];
  
  // Create backup
  const backupPath = path.join(__dirname, 'output', `products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
  console.log(`💾 Backup created: ${path.basename(backupPath)}`);
  
  // Write updated products
  fs.writeFileSync(existingProductsPath, JSON.stringify(updatedProducts, null, 2));
  console.log(`✅ Updated products.json with ${newProducts.length} new osansemall products`);
  
  // Create registration summary
  const summary = {
    mallName: '오산함께장터',
    mallId: 'osansemall',
    mallUrl: 'http://www.osansemall.com',
    registrationDate: new Date().toISOString(),
    totalScraped: rawProducts.length,
    totalCleaned: cleanedProducts.length,
    totalValid: validProducts.length,
    totalNew: newProducts.length,
    totalAfterRegistration: updatedProducts.length,
    categories: [...new Set(newProducts.map(p => p.category))],
    priceRange: {
      min: Math.min(...newProducts.map(p => p.price)),
      max: Math.max(...newProducts.map(p => p.price)),
      average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
    },
    sampleProducts: newProducts.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'osansemall-registration-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return {
    newCount: newProducts.length,
    totalCount: updatedProducts.length,
    summary
  };
}

// Run the registration
try {
  const result = registerOsansemallProducts();
  console.log('\n🎉 Registration complete!');
  console.log(`📊 New products: ${result.newCount}`);
  console.log(`📊 Total products: ${result.totalCount}`);
  console.log('📄 Summary saved to: osansemall-registration-summary.json');
} catch (error) {
  console.error('❌ Registration failed:', error);
}