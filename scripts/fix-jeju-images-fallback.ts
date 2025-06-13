import fs from 'fs/promises';
import path from 'path';

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
  category: string;
  tags: string[];
  inStock: boolean;
  lastUpdated: string;
  createdAt: string;
}

// Fallback image URLs - using reliable placeholder images or generic product images
function getFallbackImageUrl(product: Product): string {
  // Get category-specific placeholder image
  const categoryImages: Record<string, string> = {
    'traditional': 'https://images.unsplash.com/photo-1584622781584-8e0d0c9a7365?w=300&h=300&fit=crop', // Traditional food
    'agricultural': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop', // Fruits/vegetables
    'seafood': 'https://images.unsplash.com/photo-1544651945-90c5c44d7aa8?w=300&h=300&fit=crop', // Seafood
    'processed': 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=300&h=300&fit=crop', // Processed food
    'health': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop', // Health products
    'livestock': 'https://images.unsplash.com/photo-1588347818483-f55e6b5e7f8e?w=300&h=300&fit=crop', // Meat products
    'crafts': 'https://images.unsplash.com/photo-1576888450016-1b9ed07a50d0?w=300&h=300&fit=crop', // Crafts
    'other': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=300&fit=crop' // Generic
  };
  
  // Use category-specific image or default
  const fallbackUrl = categoryImages[product.category] || categoryImages['other'];
  
  // Add specific logic for known products
  if (product.name.includes('오메기떡')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop'; // Korean rice cake
  } else if (product.name.includes('한라봉')) {
    return 'https://images.unsplash.com/photo-1577003833619-2d84ce16ddd3?w=300&h=300&fit=crop'; // Citrus
  } else if (product.name.includes('흑돼지')) {
    return 'https://images.unsplash.com/photo-1588347818483-f55e6b5e7f8e?w=300&h=300&fit=crop'; // Pork
  } else if (product.name.includes('감귤')) {
    return 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=300&h=300&fit=crop'; // Citrus
  } else if (product.name.includes('땅콩')) {
    return 'https://images.unsplash.com/photo-1581947175668-3b8bf9c0fd19?w=300&h=300&fit=crop'; // Peanuts
  } else if (product.name.includes('갈치')) {
    return 'https://images.unsplash.com/photo-1544651945-90c5c44d7aa8?w=300&h=300&fit=crop'; // Fish
  } else if (product.name.includes('꿀')) {
    return 'https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=300&h=300&fit=crop'; // Honey
  }
  
  return fallbackUrl;
}

async function fixJejuImagesWithFallback() {
  console.log('🖼️ Updating Jeju mall product images with fallback URLs...');
  
  // Read current products
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const productsData = await fs.readFile(productsPath, 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Find Jeju mall products
  const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
  
  console.log(`📦 Found ${jejuProducts.length} Jeju products to update`);
  
  const updatedProducts = [...products];
  let updateCount = 0;
  
  // Update each Jeju product with a fallback image
  jejuProducts.forEach(product => {
    const fallbackImageUrl = getFallbackImageUrl(product);
    
    // Find the product in the main array and update it
    const productIndex = updatedProducts.findIndex(p => p.id === product.id);
    if (productIndex !== -1) {
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        imageUrl: fallbackImageUrl,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`${updateCount + 1}. ${product.name.substring(0, 50)}...`);
      console.log(`   Updated image: ${fallbackImageUrl}`);
      updateCount++;
    }
  });
  
  // Save updated products
  await fs.writeFile(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  // Create summary
  const summary = {
    totalUpdated: updateCount,
    updatedAt: new Date().toISOString(),
    imageMapping: {
      traditional: 'Korean traditional food',
      agricultural: 'Fruits and vegetables',
      seafood: 'Fresh seafood',
      processed: 'Processed foods',
      health: 'Health products',
      livestock: 'Meat products',
      crafts: 'Traditional crafts',
      other: 'General products'
    },
    sampleUpdatedProducts: updatedProducts
      .filter(p => p.mallId === 'mall_100_이제주몰')
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      }))
  };
  
  const summaryPath = path.join(__dirname, 'output/jeju-image-fallback-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Image update complete!');
  console.log(`📊 Updated ${updateCount} product images`);
  console.log('🎯 All images now use reliable placeholder URLs from Unsplash');
  console.log(`📁 Updated products.json`);
  console.log(`📋 Summary saved to: ${summaryPath}`);
  
  console.log('\n📝 Image sources:');
  console.log('- Traditional foods: Korean rice cake images');
  console.log('- Fruits/citrus: Fresh fruit images');
  console.log('- Seafood: Fresh fish images');
  console.log('- Meat: Premium meat images');
  console.log('- Processed: Packaged food images');
  console.log('- Others: Category-appropriate placeholders');
}

// Run the fallback image updater
fixJejuImagesWithFallback().catch(console.error);