import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Filter for 광명가치몰 products
const gmsocialProducts = products.filter((product: any) => 
  product.mallName === '광명가치몰' || product.mallId === 'gmsocial'
);

console.log(`Total 광명가치몰 products: ${gmsocialProducts.length}`);

// Check for missing or empty name fields
const missingName = gmsocialProducts.filter((product: any) => 
  !product.name || product.name === '' || product.name === null || product.name === undefined
);

console.log(`Products missing name field: ${missingName.length}`);

if (missingName.length > 0) {
  console.log('\nProducts missing name field:');
  missingName.forEach((product: any, index: number) => {
    console.log(`${index + 1}. ID: ${product.id}`);
    console.log(`   Title: "${product.title || 'MISSING'}"`);
    console.log(`   Name: "${product.name || 'MISSING'}"`);
    console.log(`   Type of name: ${typeof product.name}`);
    console.log('');
  });
}

// Check for problematic name values
const problematicNames = gmsocialProducts.filter((product: any) => {
  const name = product.name;
  return name === null || name === undefined || name === '' || 
         (typeof name === 'string' && name.trim() === '');
});

console.log(`Products with problematic names: ${problematicNames.length}`);

if (problematicNames.length > 0) {
  console.log('\nProducts with problematic names:');
  problematicNames.forEach((product: any, index: number) => {
    console.log(`${index + 1}. ID: ${product.id}`);
    console.log(`   Title: "${product.title}"`);
    console.log(`   Name: "${product.name}"`);
    console.log(`   Name type: ${typeof product.name}`);
    console.log(`   Has title: ${!!product.title}`);
    console.log('');
  });
}

// Show sample of good products
const goodProducts = gmsocialProducts.filter((product: any) => 
  product.name && typeof product.name === 'string' && product.name.trim() !== ''
);

console.log(`\nProducts with proper names: ${goodProducts.length}`);
console.log(`Sample of good products:`);
goodProducts.slice(0, 5).forEach((product: any, index: number) => {
  console.log(`${index + 1}. ${product.name}`);
});