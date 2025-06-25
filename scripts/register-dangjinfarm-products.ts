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

interface DangjinfarmProduct {
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

async function registerDangjinfarmProducts() {
  try {
    console.log('Starting 당진팜 product registration...');
    
    // Read scraped 당진팜 products
    const dangjinfarmProductsPath = path.join(__dirname, 'output', 'dangjinfarm-products.json');
    if (!fs.existsSync(dangjinfarmProductsPath)) {
      throw new Error('당진팜 products file not found');
    }
    
    const dangjinfarmProducts: DangjinfarmProduct[] = JSON.parse(fs.readFileSync(dangjinfarmProductsPath, 'utf-8'));
    
    console.log(`Found ${dangjinfarmProducts.length} 당진팜 products to register`);
    
    // Read existing products
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const existingProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    console.log(`Current product count: ${existingProducts.length}`);
    
    // Convert 당진팜 products to standard format
    const newProducts: Product[] = dangjinfarmProducts.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      url: product.url,
      mall: product.mall,
      tags: [...product.tags, 'dangjinfarm', 'chungnam', 'local', 'government'],
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
      mall: '당진팜',
      totalScrapedProducts: dangjinfarmProducts.length,
      duplicateProducts: duplicates.length,
      newProductsRegistered: uniqueNewProducts.length,
      finalProductCount: updatedProducts.length,
      categories: [...new Set(uniqueNewProducts.map(p => p.category))],
      priceRange: uniqueNewProducts.length > 0 ? {
        min: Math.min(...uniqueNewProducts.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        max: Math.max(...uniqueNewProducts.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        average: Math.round(uniqueNewProducts.reduce((sum, p) => sum + (parseInt(p.price.replace(/[^0-9]/g, '')) || 0), 0) / uniqueNewProducts.length)
      } : null,
      sampleProducts: uniqueNewProducts.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    // Save registration summary
    const summaryPath = path.join(__dirname, 'output', 'dangjinfarm-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== 당진팜 REGISTRATION SUMMARY ===');
    console.log(`Total scraped products: ${summary.totalScrapedProducts}`);
    console.log(`Duplicate products skipped: ${summary.duplicateProducts}`);
    console.log(`New products registered: ${summary.newProductsRegistered}`);
    console.log(`Final product count: ${summary.finalProductCount}`);
    console.log(`Categories found: ${summary.categories.join(', ')}`);
    
    if (summary.priceRange) {
      console.log(`Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
      console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
    }
    
    if (summary.sampleProducts.length > 0) {
      console.log('\nSample registered products:');
      summary.sampleProducts.forEach(product => {
        console.log(`- ${product.title} (${product.price}) [${product.category}]`);
      });
    }
    
    console.log(`\nRegistration summary saved to: ${summaryPath}`);
    console.log('당진팜 product registration completed successfully!');
    
  } catch (error) {
    console.error('Error during 당진팜 product registration:', error);
    process.exit(1);
  }
}

registerDangjinfarmProducts();