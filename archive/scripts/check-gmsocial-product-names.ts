import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Filter for 광명가치몰 products
const gmsocialProducts = products.filter((product: any) => 
  product.mallName === '광명가치몰' || product.mallId === 'gmsocial'
);

console.log(`Total 광명가치몰 products: ${gmsocialProducts.length}`);

// Check for missing or empty titles
const missingTitles = gmsocialProducts.filter((product: any) => 
  !product.title || product.title === '' || 
  !product.name || product.name === '' ||
  (product.title === product.name && (!product.title || product.title.trim() === ''))
);

console.log(`Products with missing titles: ${missingTitles.length}`);

if (missingTitles.length > 0) {
  console.log('\nProducts with missing titles:');
  missingTitles.forEach((product: any, index: number) => {
    console.log(`${index + 1}. ID: ${product.id}`);
    console.log(`   Title: "${product.title || 'MISSING'}"`);
    console.log(`   Name: "${product.name || 'MISSING'}"`);
    console.log(`   URL: ${product.productUrl}`);
    console.log('');
  });
}

// Check for generic or placeholder titles
const genericTitles = gmsocialProducts.filter((product: any) => {
  const title = product.title || product.name || '';
  return title.includes('상품') || 
         title.includes('제품') || 
         title.includes('아이템') ||
         title.length < 5 ||
         title === product.id;
});

console.log(`Products with generic titles: ${genericTitles.length}`);

if (genericTitles.length > 0) {
  console.log('\nProducts with generic/short titles:');
  genericTitles.slice(0, 10).forEach((product: any, index: number) => {
    console.log(`${index + 1}. ID: ${product.id}`);
    console.log(`   Title: "${product.title || product.name}"`);
    console.log('');
  });
}

// Show sample of good products
const goodProducts = gmsocialProducts.filter((product: any) => {
  const title = product.title || product.name || '';
  return title && title.length > 5 && !title.includes('상품');
});

console.log(`\nSample of products with good titles (${goodProducts.length} total):`);
goodProducts.slice(0, 5).forEach((product: any, index: number) => {
  console.log(`${index + 1}. ${product.title || product.name}`);
});