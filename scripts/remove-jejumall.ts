import * as fs from 'fs';
import * as path from 'path';

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  region?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified?: string;
  inStock?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  subcategory?: string;
}

function removeJejuMall() {
  console.log('🗑️ Removing 제주몰 (jejumall.kr) and all its products...\n');
  
  const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  
  // Load current data
  const malls: Mall[] = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  console.log(`📊 Current state:`);
  console.log(`   Total malls: ${malls.length}`);
  console.log(`   Total products: ${products.length}`);
  
  // Find and remove 제주몰 from malls
  const jejuMallIndex = malls.findIndex(mall => mall.id === 'mall_99_제주몰');
  
  if (jejuMallIndex === -1) {
    console.log('❌ 제주몰 not found in malls.json');
    return;
  }
  
  const jejuMall = malls[jejuMallIndex];
  console.log(`\n🏪 Found 제주몰:`);
  console.log(`   ID: ${jejuMall.id}`);
  console.log(`   Name: ${jejuMall.name}`);
  console.log(`   URL: ${jejuMall.url}`);
  console.log(`   Region: ${jejuMall.region}`);
  
  // Find products associated with 제주몰
  const jejuProducts = products.filter(product => product.mallId === 'mall_99_제주몰');
  console.log(`\n📦 Found ${jejuProducts.length} products from 제주몰:`);
  
  jejuProducts.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name} (${product.id})`);
  });
  
  // Remove 제주몰 from malls array
  malls.splice(jejuMallIndex, 1);
  console.log(`\n✅ Removed 제주몰 from malls.json`);
  
  // Remove all products from 제주몰
  const filteredProducts = products.filter(product => product.mallId !== 'mall_99_제주몰');
  console.log(`✅ Removed ${jejuProducts.length} products from products.json`);
  
  // Save updated files
  fs.writeFileSync(mallsPath, JSON.stringify(malls, null, 2));
  fs.writeFileSync(productsPath, JSON.stringify(filteredProducts, null, 2));
  
  console.log(`\n📊 Updated state:`);
  console.log(`   Total malls: ${malls.length} (reduced by 1)`);
  console.log(`   Total products: ${filteredProducts.length} (reduced by ${jejuProducts.length})`);
  
  console.log('\n🎯 Successfully removed 제주몰 and all its products!');
  console.log('📁 Updated malls.json and products.json');
}

removeJejuMall();