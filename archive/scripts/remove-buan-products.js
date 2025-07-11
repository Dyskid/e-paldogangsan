const fs = require('fs');

// Read products.json
const products = JSON.parse(fs.readFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', 'utf8'));

// Filter out 부안 텃밭할매 products
const filtered = products.filter(p => p.mall !== '부안 텃밭할매');

console.log('Original products:', products.length);
console.log('Products to remove:', products.length - filtered.length);
console.log('Remaining products:', filtered.length);

// Write back to products.json
fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/src/data/products.json', JSON.stringify(filtered, null, 2));

console.log('✅ Successfully removed all 부안 텃밭할매 products');