#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string | number;
  image: string;
  category: string;
  mall: string;
  url: string;
}

const dataPath = path.join(__dirname, '../src/data/products.json');

async function removeUnknownMallProducts() {
  console.log('🗑️ Removing products from unknown/dangjin-farm mall...');
  
  // Read current products
  const productsData = fs.readFileSync(dataPath, 'utf8');
  const products: Product[] = JSON.parse(productsData);
  
  console.log(`📊 Current total products: ${products.length}`);
  
  // Create backup
  const backupPath = path.join(__dirname, `../src/data/products-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, productsData);
  console.log(`💾 Backup created: ${backupPath}`);
  
  // Count products by mall
  const mallCounts = products.reduce((acc, product) => {
    const mall = product.mall || 'unknown';
    acc[mall] = (acc[mall] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Products by mall before removal:');
  Object.entries(mallCounts).forEach(([mall, count]) => {
    console.log(`   ${mall}: ${count} products`);
  });
  
  // Identify products to remove (unknown mall or dangjin-farm related)
  const productsToRemove = products.filter(product => {
    const mall = product.mall || 'unknown';
    const isDangjinFarm = product.id?.includes('dangjin-farm');
    const isUnknown = mall === 'unknown';
    
    return isUnknown || isDangjinFarm;
  });
  
  console.log(`\n🎯 Removing ${productsToRemove.length} products from unknown/dangjin-farm sources`);
  
  // Keep only products from verified malls
  const cleanProducts = products.filter(product => {
    const mall = product.mall || 'unknown';
    const isDangjinFarm = product.id?.includes('dangjin-farm');
    const isUnknown = mall === 'unknown';
    
    return !isUnknown && !isDangjinFarm;
  });
  
  console.log(`✅ Keeping ${cleanProducts.length} products from verified malls`);
  
  // Count final products by mall
  const finalMallCounts = cleanProducts.reduce((acc, product) => {
    const mall = product.mall || 'unknown';
    acc[mall] = (acc[mall] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n📊 Products by mall after removal:');
  Object.entries(finalMallCounts).forEach(([mall, count]) => {
    console.log(`   ${mall}: ${count} products`);
  });
  
  // Save cleaned products
  fs.writeFileSync(dataPath, JSON.stringify(cleanProducts, null, 2));
  
  console.log(`\n✅ Removed ${products.length - cleanProducts.length} products`);
  console.log(`📊 Database now contains ${cleanProducts.length} verified products`);
  
  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    action: 'remove_unknown_mall_products',
    removedCount: products.length - cleanProducts.length,
    remainingCount: cleanProducts.length,
    backupFile: backupPath,
    mallsRemaining: Object.keys(finalMallCounts),
    productsByMall: finalMallCounts
  };
  
  const summaryPath = path.join(__dirname, './output/unknown-mall-removal-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📝 Summary saved to: ${summaryPath}`);
}

removeUnknownMallProducts().catch(console.error);