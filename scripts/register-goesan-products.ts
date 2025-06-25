import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  mall: string;
  tags: string[];
  category: string;
  featured: boolean;
}

interface GoesanProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  region: string;
  tags: string[];
  inStock: boolean;
}

async function registerGoesanProducts() {
  try {
    console.log('Starting Goesan Marketplace product registration...');
    
    // Read scraped Goesan products
    const goesanProductsPath = path.join(__dirname, 'output', 'goesan-products.json');
    if (!fs.existsSync(goesanProductsPath)) {
      throw new Error('Goesan products file not found');
    }
    
    const goesanProducts: GoesanProduct[] = JSON.parse(fs.readFileSync(goesanProductsPath, 'utf-8'));
    
    console.log(`Found ${goesanProducts.length} Goesan products to register`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const existingProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    console.log(`Current product count: ${existingProducts.length}`);
    
    // Convert Goesan products to standard format
    const newProducts: Product[] = goesanProducts.map(product => ({
      id: product.id.startsWith('goesan_') ? product.id : `goesan_${product.id}`,
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url,
      mall: product.mall,
      tags: [...product.tags, 'goesan', 'marketplace', 'local', 'government', 'korean'],
      category: product.category,
      featured: false
    }));
    
    // Check for duplicates
    const existingIds = new Set(existingProducts.map(p => p.id));
    const duplicates = newProducts.filter(p => existingIds.has(p.id));
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate products, skipping...`);
    }
    
    // Filter out duplicates
    const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
    
    // Add new products
    const updatedProducts = [...existingProducts, ...uniqueNewProducts];
    
    // Create backup
    const backupPath = path.join(__dirname, '..', 'src', 'data', `products-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`Backup created: ${backupPath}`);
    
    // Write updated products
    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: 'Goesan Marketplace',
      totalScrapedProducts: goesanProducts.length,
      duplicateProducts: duplicates.length,
      newProductsRegistered: uniqueNewProducts.length,
      finalProductCount: updatedProducts.length,
      categories: [...new Set(uniqueNewProducts.map(p => p.category))],
      sampleProducts: uniqueNewProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    // Save registration summary
    const summaryPath = path.join(__dirname, 'output', 'goesan-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== GOESAN MARKETPLACE REGISTRATION SUMMARY ===');
    console.log(`Total scraped products: ${summary.totalScrapedProducts}`);
    console.log(`Duplicate products skipped: ${summary.duplicateProducts}`);
    console.log(`New products registered: ${summary.newProductsRegistered}`);
    console.log(`Final product count: ${summary.finalProductCount}`);
    console.log(`Categories found: ${summary.categories.join(', ')}`);
    
    if (summary.sampleProducts.length > 0) {
      console.log('\nSample registered products:');
      summary.sampleProducts.forEach(product => {
        console.log(`- ${product.title} (${product.price}) [${product.category}]`);
      });
    }
    
    console.log(`\nRegistration summary saved to: ${summaryPath}`);
    console.log('Goesan Marketplace product registration completed successfully!');
    
  } catch (error) {
    console.error('Error during Goesan product registration:', error);
    process.exit(1);
  }
}

registerGoesanProducts();