import * as fs from 'fs';
import * as path from 'path';

interface Chack3Product {
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

function cleanProductData(products: Chack3Product[]): Chack3Product[] {
  console.log('🧹 Cleaning product data...');
  
  const cleanedProducts = products.map(product => {
    // Clean product name
    let cleanName = product.name
      .replace(/\[.*?\]/g, '') // Remove brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If name is too short after cleaning, keep original
    if (cleanName.length < 3) {
      cleanName = product.name;
    }
    
    // Clean and categorize
    let category = product.category;
    if (cleanName.includes('김치')) {
      category = '김치';
    } else if (cleanName.includes('반찬') || cleanName.includes('나물')) {
      category = '반찬';
    } else if (cleanName.includes('장아찌') || cleanName.includes('절임')) {
      category = '장아찌';
    } else if (cleanName.includes('세트') || cleanName.includes('선물')) {
      category = '선물세트';
    }
    
    // Clean tags
    const cleanTags = [...new Set([
      '착3몰',
      '사회적기업',
      '김치',
      category,
      '경기도',
      '전통식품'
    ])];
    
    // Validate price
    const validPrice = product.price > 0 ? product.price : 0;
    
    return {
      ...product,
      name: cleanName,
      category,
      tags: cleanTags,
      price: validPrice,
      description: cleanName.length > product.description.length ? cleanName : product.description
    };
  });
  
  // Remove duplicates based on name similarity
  const uniqueProducts: Chack3Product[] = [];
  const seenNames = new Set<string>();
  
  for (const product of cleanedProducts) {
    const normalizedName = product.name.toLowerCase().replace(/\s+/g, '');
    
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueProducts.push(product);
    }
  }
  
  console.log(`✅ Cleaned data: ${products.length} → ${uniqueProducts.length} products`);
  return uniqueProducts;
}

function registerChack3Products() {
  console.log('📦 Starting chack3 product registration...');
  
  // Load scraped products
  const productsPath = path.join(__dirname, 'output', 'chack3-products.json');
  if (!fs.existsSync(productsPath)) {
    throw new Error('chack3-products.json not found. Run scraper first.');
  }
  
  const rawProducts: Chack3Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
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
  console.log(`✅ Updated products.json with ${newProducts.length} new chack3 products`);
  
  // Create registration summary
  const summary = {
    mallName: '착3몰',
    mallId: 'chack3',
    mallUrl: 'https://www.chack3.com',
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
    path.join(__dirname, 'output', 'chack3-registration-summary.json'),
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
  const result = registerChack3Products();
  console.log('\n🎉 Registration complete!');
  console.log(`📊 New products: ${result.newCount}`);
  console.log(`📊 Total products: ${result.totalCount}`);
  console.log('📄 Summary saved to: chack3-registration-summary.json');
} catch (error) {
  console.error('❌ Registration failed:', error);
}