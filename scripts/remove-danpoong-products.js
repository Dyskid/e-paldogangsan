const fs = require('fs');

// Read products.json
const products = JSON.parse(fs.readFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'utf8'));

// Filter out 단풍미인 products (including variations like "단풍미인 (정읍)")
const filtered = products.filter(p => {
  if (!p.mall) return true;
  if (typeof p.mall !== 'string') return true;
  return !p.mall.includes('단풍미인');
});

console.log('Original products:', products.length);
console.log('Products to remove:', products.length - filtered.length);
console.log('Remaining products:', filtered.length);

// Write back to products.json
fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', JSON.stringify(filtered, null, 2));

console.log('✅ Successfully removed all 단풍미인 products');