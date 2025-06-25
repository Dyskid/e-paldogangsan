import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

let fixedCount = 0;
const mallsFixed = new Set<string>();

// Fix products
const fixedProducts = products.map((product: any) => {
  let fixed = false;
  
  // If name is missing but title exists, copy title to name
  if ((!product.name || product.name === '') && product.title) {
    product.name = product.title;
    fixed = true;
  }
  // If title is missing but name exists, copy name to title
  else if ((!product.title || product.title === '') && product.name) {
    product.title = product.name;
    fixed = true;
  }
  
  if (fixed) {
    fixedCount++;
    mallsFixed.add(product.mallName || product.mallId || 'unknown');
  }
  
  return product;
});

// Write the fixed products back
fs.writeFileSync(productsPath, JSON.stringify(fixedProducts, null, 2));

console.log(`Fixed ${fixedCount} products across ${mallsFixed.size} malls`);
console.log(`Malls fixed: ${Array.from(mallsFixed).join(', ')}`);

// Verify no products are missing both name and title
const stillMissing = fixedProducts.filter((product: any) => 
  (!product.name || product.name === '') && (!product.title || product.title === '')
);

console.log(`Products still missing both name and title: ${stillMissing.length}`);

if (stillMissing.length > 0) {
  console.log('Products still missing names:');
  stillMissing.slice(0, 10).forEach((product: any) => {
    console.log(`- ${product.id} (${product.mallName}): title="${product.title || 'NONE'}" name="${product.name || 'NONE'}"`);
  });
}