const fs = require('fs');

const products = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf8'));
const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
const withCorrectPrices = jejuProducts.filter(p => p.price !== '0' && p.price !== '가격문의');
const withBadPrices = jejuProducts.filter(p => p.price === '0' || p.price === '가격문의');

console.log('📊 Jeju Mall Product Price Status:');
console.log('=' .repeat(40));
console.log('✅ Products with correct prices:', withCorrectPrices.length);
console.log('❌ Products still needing fixes:', withBadPrices.length);
console.log('📦 Total Jeju products:', jejuProducts.length);
console.log('');
console.log('💰 Sample corrected prices:');
withCorrectPrices.slice(0, 10).forEach((p, i) => {
  const price = p.price.includes('원') ? p.price : p.price + '원';
  console.log(`${i+1}. ${p.name.substring(0, 50)}... - ${price}`);
});

if (withBadPrices.length > 0) {
  console.log('\n❌ Products still needing price fixes:');
  withBadPrices.slice(0, 5).forEach((p, i) => {
    console.log(`${i+1}. ${p.name.substring(0, 50)}... - ${p.price}`);
  });
}