import * as fs from 'fs';
import * as path from 'path';

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

function findRemainingIssue() {
  console.log('🔍 Finding the remaining generic title issue...\n');
  
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  // Find products with generic titles using the same logic as verification
  const genericPatterns = [
    /상품\s*\d+/,
    /특산품.*직배송/,
    /지역.*특산품.*세트/,
    /최근본.*상품/,
    /오늘본상품/,
    /대표.*농특산물/
  ];
  
  const problematicProducts = products.filter(product => {
    return genericPatterns.some(pattern => pattern.test(product.name)) ||
           product.name.length < 8;
  });
  
  console.log(`Found ${problematicProducts.length} products with potential generic title issues:\n`);
  
  problematicProducts.forEach((product, index) => {
    console.log(`${index + 1}. Mall: ${product.mallName} (${product.mallId})`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Title: "${product.name}"`);
    console.log(`   Description: "${product.description}"`);
    console.log(`   URL: ${product.productUrl}`);
    console.log(`   Title length: ${product.name.length} characters`);
    
    // Check which pattern matches
    const matchingPatterns = genericPatterns.filter(pattern => pattern.test(product.name));
    if (matchingPatterns.length > 0) {
      console.log(`   Matches patterns: ${matchingPatterns.map(p => p.source).join(', ')}`);
    }
    if (product.name.length < 8) {
      console.log(`   Issue: Title too short (< 8 characters)`);
    }
    console.log('');
  });
  
  if (problematicProducts.length === 0) {
    console.log('✅ No generic title issues found! All products have authentic titles.');
  }
}

findRemainingIssue();