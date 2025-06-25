import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

let fixedCount = 0;

// Fix products
const fixedProducts = products.map((product: any) => {
  // Check if this is a 광명가치몰 product
  if (product.mallName === '광명가치몰' || product.mallId === 'gmsocial') {
    // If name is missing but title exists, copy title to name
    if ((!product.name || product.name === '') && product.title) {
      product.name = product.title;
      fixedCount++;
    }
    // If title is missing but name exists, copy name to title
    else if ((!product.title || product.title === '') && product.name) {
      product.title = product.name;
      fixedCount++;
    }
  }
  
  return product;
});

// Write the fixed products back
fs.writeFileSync(productsPath, JSON.stringify(fixedProducts, null, 2));

console.log(`Fixed ${fixedCount} 광명가치몰 products`);

// Verify the fix
const gmsocialProducts = fixedProducts.filter((product: any) => 
  product.mallName === '광명가치몰' || product.mallId === 'gmsocial'
);

const stillMissing = gmsocialProducts.filter((product: any) => 
  (!product.name || product.name === '') && (!product.title || product.title === '')
);

console.log(`광명가치몰 products still missing names: ${stillMissing.length}`);

if (stillMissing.length > 0) {
  console.log('Products still missing names:');
  stillMissing.forEach((product: any) => {
    console.log(`- ${product.id}: title="${product.title || 'NONE'}" name="${product.name || 'NONE'}"`);
  });
}