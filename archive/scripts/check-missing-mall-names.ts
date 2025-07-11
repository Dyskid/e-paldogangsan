import fs from 'fs';
import path from 'path';

const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Group products by their status
const missingMallName: any[] = [];
const hasMallName: any[] = [];

products.forEach((product: any) => {
  if (!product.mallName || product.mallName === '' || product.mallName === '쇼핑몰') {
    missingMallName.push({
      id: product.id,
      title: product.title || product.name,
      mallId: product.mallId,
      mallName: product.mallName
    });
  } else {
    hasMallName.push(product);
  }
});

console.log(`Total products: ${products.length}`);
console.log(`Products with proper mall names: ${hasMallName.length}`);
console.log(`Products missing mall names: ${missingMallName.length}`);

if (missingMallName.length > 0) {
  console.log('\nFirst 10 products missing mall names:');
  missingMallName.slice(0, 10).forEach((p: any) => {
    console.log(`- ${p.id} (mallId: ${p.mallId}): ${p.title}`);
  });
  
  // Group by mallId to see patterns
  const byMallId = new Map<string, number>();
  missingMallName.forEach((p: any) => {
    const count = byMallId.get(p.mallId) || 0;
    byMallId.set(p.mallId, count + 1);
  });
  
  console.log('\nProducts missing mall names by mallId:');
  Array.from(byMallId.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([mallId, count]) => {
      console.log(`- ${mallId}: ${count} products`);
    });
}