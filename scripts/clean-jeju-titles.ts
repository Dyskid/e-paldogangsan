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

function cleanJejuTitles() {
  console.log('🧹 Cleaning Jeju product titles...');
  
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  let cleanedCount = 0;
  
  for (const product of products) {
    if (product.mallId === 'mall_100_이제주몰') {
      const originalTitle = product.name;
      
      // Clean the title by removing price information and extra whitespace
      let cleanedTitle = originalTitle
        // Remove price patterns like "25,000원", "36,000원29,900원"
        .replace(/\d{1,3}(,\d{3})*원/g, '')
        // Remove multiple spaces and newlines
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
      
      if (cleanedTitle !== originalTitle) {
        console.log(`🔄 Cleaning ${product.id}:`);
        console.log(`   Old: "${originalTitle}"`);
        console.log(`   New: "${cleanedTitle}"`);
        
        product.name = cleanedTitle;
        cleanedCount++;
      }
    }
  }
  
  if (cleanedCount > 0) {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    console.log(`\n✅ Cleaned ${cleanedCount} product titles`);
    console.log('📁 Updated products.json');
  } else {
    console.log('\n📊 No titles needed cleaning');
  }
}

cleanJejuTitles();