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

function cleanExtractedTitles() {
  console.log('🧹 Cleaning extracted Jeju product titles...');
  
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  let cleanedCount = 0;
  
  for (const product of products) {
    if (product.mallId === 'mall_100_이제주몰') {
      const originalTitle = product.name;
      
      // Clean the title by removing hashtags and extra content
      let cleanedTitle = originalTitle
        // Remove hashtag content and everything after first #
        .replace(/#.*$/, '')
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        // Remove trailing whitespace
        .trim();
      
      if (cleanedTitle !== originalTitle && cleanedTitle.length > 5) {
        console.log(`🔄 Cleaning product title:`);
        console.log(`   Old: "${originalTitle}"`);
        console.log(`   New: "${cleanedTitle}"`);
        
        product.name = cleanedTitle;
        // Also update description to match
        product.description = cleanedTitle;
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

cleanExtractedTitles();