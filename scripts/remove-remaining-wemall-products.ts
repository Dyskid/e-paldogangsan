import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  mallId?: string;
  mall?: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
  mallName: string;
  name: string;
  price: number;
  category: string;
  [key: string]: any;
}

function isMallProduct(product: Product, mallIds: string[]): boolean {
  // Check direct mallId field
  if (product.mallId && mallIds.includes(product.mallId)) {
    return true;
  }
  
  // Check nested mall.mallId field
  if (product.mall && product.mall.mallId && mallIds.includes(product.mall.mallId)) {
    return true;
  }
  
  return false;
}

async function removeRemainingWemallProducts() {
  try {
    console.log('=== Removing Remaining 우리몰 Products (All Formats) ===');
    
    // Read current products database
    const databasePath = path.join(__dirname, '../src/data/products.json');
    const products: Product[] = JSON.parse(
      fs.readFileSync(databasePath, 'utf8')
    );
    
    console.log(`Current database has ${products.length} products`);
    
    // Find all products that match wemall in any format
    const wemallProducts = products.filter(p => isMallProduct(p, ['wemall']));
    const wonjuProducts = products.filter(p => isMallProduct(p, ['wonju']));
    
    console.log(`Found ${wemallProducts.length} remaining 우리몰 products to remove`);
    console.log(`Found ${wonjuProducts.length} remaining 원주몰 products to remove`);
    
    // Show sample products being removed
    console.log('\\n=== Sample Remaining Products to Remove ===');
    if (wemallProducts.length > 0) {
      console.log('\\n우리몰 samples:');
      wemallProducts.slice(0, 5).forEach((product, index) => {
        const price = typeof product.price === 'number' ? product.price : parseInt(product.price) || 0;
        console.log(`${index + 1}. ${product.name} - ${price.toLocaleString()}원`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Structure: ${product.mallId ? 'direct mallId' : 'nested mall.mallId'}`);
      });
    }
    
    if (wonjuProducts.length > 0) {
      console.log('\\n원주몰 samples:');
      wonjuProducts.slice(0, 3).forEach((product, index) => {
        const price = typeof product.price === 'number' ? product.price : parseInt(product.price) || 0;
        console.log(`${index + 1}. ${product.name} - ${price.toLocaleString()}원`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Structure: ${product.mallId ? 'direct mallId' : 'nested mall.mallId'}`);
      });
    }
    
    // Filter out all wemall and wonju products regardless of structure
    const filteredProducts = products.filter(p => 
      !isMallProduct(p, ['wemall', 'wonju'])
    );
    
    const totalRemoved = wemallProducts.length + wonjuProducts.length;
    console.log(`\\nRemoving ${totalRemoved} products total`);
    console.log(`- 우리몰: ${wemallProducts.length} products`);
    console.log(`- 원주몰: ${wonjuProducts.length} products`);
    console.log(`Remaining products: ${filteredProducts.length}`);
    
    // Create backup before removal
    const backupPath = path.join(__dirname, '../src/data/products-backup-before-final-wemall-wonju-removal.json');
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
      removedProductSamples: {
        wemall: wemallProducts.slice(0, 5).map(p => ({ 
          id: p.id, 
          name: p.name, 
          mallName: p.mallName,
          structure: p.mallId ? 'direct' : 'nested'
        })),
        wonju: wonjuProducts.slice(0, 3).map(p => ({ 
          id: p.id, 
          name: p.name, 
          mallName: p.mallName,
          structure: p.mallId ? 'direct' : 'nested'
        }))
      },
      notes: 'Final cleanup: removed all remaining 우리몰 and 원주몰 products regardless of data structure'
    };
    
    const summaryPath = path.join(__dirname, 'output/final-wemall-wonju-removal-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`✓ Final removal summary saved to: ${summaryPath}`);
    
    console.log('\\n=== Final Cleanup Complete ===');
    console.log(`Total products removed: ${totalRemoved}`);
    console.log(`- 우리몰: ${wemallProducts.length} products`);
    console.log(`- 원주몰: ${wonjuProducts.length} products`);
    console.log(`Final products in database: ${filteredProducts.length}`);
    
    // Verify no products remain
    const verifyWemall = filteredProducts.filter(p => isMallProduct(p, ['wemall']));
    const verifyWonju = filteredProducts.filter(p => isMallProduct(p, ['wonju']));
    
    if (verifyWemall.length === 0 && verifyWonju.length === 0) {
      console.log('\\n✅ Verification successful: No 우리몰 or 원주몰 products remain');
    } else {
      console.log(`\\n⚠️  Warning: ${verifyWemall.length} 우리몰 and ${verifyWonju.length} 원주몰 products still remain`);
    }
    
    return summary;
    
  } catch (error) {
    console.error('Final product removal failed:', error);
    throw error;
  }
}

if (require.main === module) {
  removeRemainingWemallProducts();
}

export { removeRemainingWemallProducts };