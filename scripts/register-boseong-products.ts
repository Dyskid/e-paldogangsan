import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  category: string;
  description?: string;
  inStock?: boolean;
  mall: string;
  region: string;
  tags: string[];
}

async function registerBoseongProducts() {
  try {
    console.log('🚀 Starting Boseong Mall product registration...');
    
    // Read scraped products
    const scrapedProducts: Product[] = JSON.parse(
      fs.readFileSync('./scripts/output/boseong-products.json', 'utf-8')
    );
    
    console.log(`📦 Found ${scrapedProducts.length} products to register`);
    
    // Read existing products
    const existingProducts = JSON.parse(
      fs.readFileSync('./src/data/products.json', 'utf-8')
    );
    
    // Create backup
    const timestamp = Date.now();
    fs.writeFileSync(
      `./src/data/products-backup-${timestamp}.json`,
      JSON.stringify(existingProducts, null, 2)
    );
    console.log(`💾 Created backup: products-backup-${timestamp}.json`);
    
    // Filter out duplicates and invalid products
    const validProducts = scrapedProducts.filter((product, index, array) => {
      // Check if product has required fields
      if (!product.title || !product.price || !product.image || !product.url) {
        console.log(`⚠️ Skipping invalid product: ${product.title || 'No title'}`);
        return false;
      }
      
      // Check if price is valid
      if (!product.price.includes('원') || product.price === '원') {
        console.log(`⚠️ Skipping product with invalid price: ${product.title} - ${product.price}`);
        return false;
      }
      
      // Check if it's a duplicate within scraped products
      const isDuplicate = array.findIndex(p => p.id === product.id) !== index;
      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate product: ${product.title}`);
        return false;
      }
      
      // Check if it already exists in the database
      const existsInDb = existingProducts.some((p: any) => 
        p.id === product.id || 
        p.url === product.url ||
        (p.title === product.title && p.mall === product.mall)
      );
      
      if (existsInDb) {
        console.log(`⚠️ Skipping existing product: ${product.title}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ ${validProducts.length} products are valid and new`);
    
    // Add products to the database
    const updatedProducts = [...existingProducts, ...validProducts];
    
    // Write updated products
    fs.writeFileSync('./src/data/products.json', JSON.stringify(updatedProducts, null, 2));
    
    // Generate summary
    const summary = {
      totalScraped: scrapedProducts.length,
      validProducts: validProducts.length,
      duplicatesSkipped: scrapedProducts.length - validProducts.length,
      totalProductsInDb: updatedProducts.length,
      registrationDate: new Date().toISOString(),
      mall: '보성몰',
      region: '전남',
      categories: [...new Set(validProducts.map(p => p.category))],
      sampleRegistered: validProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        id: p.id
      }))
    };
    
    fs.writeFileSync('./scripts/output/boseong-registration-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Registration Summary:');
    console.log(`Total scraped: ${summary.totalScraped}`);
    console.log(`Successfully registered: ${summary.validProducts}`);
    console.log(`Duplicates/Invalid skipped: ${summary.duplicatesSkipped}`);
    console.log(`Total products in database: ${summary.totalProductsInDb}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    
    console.log('\n✅ Sample registered products:');
    summary.sampleRegistered.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price} (${product.category})`);
    });
    
    console.log('\n🎉 Boseong Mall product registration completed successfully!');
    return summary;
    
  } catch (error) {
    console.error('❌ Error during product registration:', error);
    throw error;
  }
}

// Run the registration
registerBoseongProducts()
  .then((summary) => {
    console.log(`\n✅ Registration completed! Added ${summary.validProducts} products from Boseong Mall.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error.message);
    process.exit(1);
  });