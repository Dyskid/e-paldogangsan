import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  mallId: string;
  mallName: string;
  name: string;
  price: number;
  category: string;
  [key: string]: any;
}

async function removeWemallWonjuProducts() {
  try {
    console.log('=== Removing 우리몰 and 원주몰 Products ===');
    
    // Read current products database
    const databasePath = path.join(__dirname, '../src/data/products.json');
    const products: Product[] = JSON.parse(
      fs.readFileSync(databasePath, 'utf8')
    );
    
    console.log(`Current database has ${products.length} products`);
    
    // Count products to be removed
    const wemallProducts = products.filter(p => p.mallId === 'wemall');
    const wonjuProducts = products.filter(p => p.mallId === 'wonju');
    
    console.log(`Found ${wemallProducts.length} 우리몰 products to remove`);
    console.log(`Found ${wonjuProducts.length} 원주몰 products to remove`);
    
    // Show sample products being removed
    console.log('\\n=== Sample Products to Remove ===');
    if (wemallProducts.length > 0) {
      console.log('\\n우리몰 samples:');
      wemallProducts.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.price.toLocaleString()}원`);
      });
    }
    
    if (wonjuProducts.length > 0) {
      console.log('\\n원주몰 samples:');
      wonjuProducts.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ${product.price.toLocaleString()}원`);
      });
    }
    
    // Filter out wemall and wonju products
    const filteredProducts = products.filter(p => 
      p.mallId !== 'wemall' && p.mallId !== 'wonju'
    );
    
    const totalRemoved = wemallProducts.length + wonjuProducts.length;
    console.log(`\\nRemoving ${totalRemoved} products total`);
    console.log(`Remaining products: ${filteredProducts.length}`);
    
    // Create backup before removal
    const backupPath = path.join(__dirname, '../src/data/products-backup-before-wemall-wonju-removal.json');
    fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
    console.log(`\\n✓ Created backup at: ${backupPath}`);
    
    // Write updated database
    fs.writeFileSync(databasePath, JSON.stringify(filteredProducts, null, 2));
    console.log(`✓ Updated database with ${filteredProducts.length} products`);
    
    // Create removal summary
    const summary = {
      timestamp: new Date().toISOString(),
      originalProductCount: products.length,
      productsRemoved: {
        wemall: wemallProducts.length,
        wonju: wonjuProducts.length,
        total: totalRemoved
      },
      finalProductCount: filteredProducts.length,
      backupCreated: backupPath,
      removedProducts: {
        wemall: wemallProducts.slice(0, 5).map(p => ({ id: p.id, name: p.name, mallName: p.mallName })),
        wonju: wonjuProducts.slice(0, 5).map(p => ({ id: p.id, name: p.name, mallName: p.mallName }))
      },
      notes: 'Successfully removed all products from 우리몰 and 원주몰 as requested'
    };
    
    const summaryPath = path.join(__dirname, 'output/wemall-wonju-removal-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`✓ Removal summary saved to: ${summaryPath}`);
    
    console.log('\\n=== Removal Complete ===');
    console.log(`Products removed: ${totalRemoved}`);
    console.log(`- 우리몰: ${wemallProducts.length} products`);
    console.log(`- 원주몰: ${wonjuProducts.length} products`);
    console.log(`Remaining products in database: ${filteredProducts.length}`);
    
    return summary;
    
  } catch (error) {
    console.error('Product removal failed:', error);
    throw error;
  }
}

if (require.main === module) {
  removeWemallWonjuProducts();
}

export { removeWemallWonjuProducts };