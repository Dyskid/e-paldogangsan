import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Filter for 광명가치몰 products
const gmsocialProducts = products.filter((product: any) => 
  product.mallName === '광명가치몰' || product.mallId === 'gmsocial'
);

console.log(`=== 광명가치몰 전체 상품 목록 (${gmsocialProducts.length}개) ===\n`);

gmsocialProducts.forEach((product: any, index: number) => {
  console.log(`${index + 1}. ID: ${product.id}`);
  console.log(`   Name: "${product.name}"`);
  console.log(`   Title: "${product.title}"`);
  console.log(`   Price: ${product.price}`);
  console.log(`   URL: ${product.productUrl}`);
  console.log('');
});

// Check which field would be displayed in UI
console.log(`=== UI에서 표시될 이름들 ===\n`);
gmsocialProducts.forEach((product: any, index: number) => {
  // Simulate the ProductCard logic: product.name || product.title
  const displayName = product.name || product.title;
  console.log(`${index + 1}. ${displayName}`);
});