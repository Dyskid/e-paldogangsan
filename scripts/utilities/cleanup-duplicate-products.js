#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, '../../data/products');

// List of duplicate files to remove (keeping the more descriptive versions)
const filesToRemove = [
  '30-products.json',  // Keep 30-farm-love-products.json
  '50-products.json',  // Keep 50-suncheon-local-food-together-store-products.json
  '52-products.json',  // Keep 52-jangheung-mall-mountain-sea-jangheung-mall-products.json
  '53-products.json',  // Keep 53-gichandeul-yeongam-mall-products.json
  '65-products.json',  // Keep 65-yeongju-market-day-products.json
  '86-products.json',  // Keep 86-namhae-mall-products.json
  '88-products.json',  // Keep 88-dinosaur-land-goseong-products.json
  '89-products.json',  // Keep 89-hamyang-mall-products.json
  '90-products.json',  // Keep 90-jinju-dream-products.json
  '91-products.json',  // No English version found, will need to check
  '92-products.json',  // Keep 92-gimhae-on-mall-real-products.json
  '93-products.json',  // Keep 93-e-jeju-mall-mall-products.json or 93-e-jeju-mall-mall-final-products.json
];

console.log('🧹 Cleaning up duplicate product files...\n');

let removedCount = 0;
let errorCount = 0;

filesToRemove.forEach(file => {
  const filePath = path.join(productsDir, file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.error(`❌ Error removing ${file}: ${error.message}`);
      errorCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n📊 Cleanup Complete!');
console.log('================================');
console.log(`✅ Files removed: ${removedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log('================================\n');