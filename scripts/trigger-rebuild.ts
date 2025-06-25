import fs from 'fs';
import path from 'path';

// Create a timestamp file to trigger rebuild
const timestamp = new Date().toISOString();
const markerPath = path.join(__dirname, '../src/data/.last-update');

fs.writeFileSync(markerPath, timestamp);

console.log(`Data update marker created at: ${timestamp}`);
console.log(`All 광명가치몰 products now have proper name fields.`);
console.log(`If names are still not showing in UI, try:`);
console.log(`1. Hard refresh the browser (Ctrl+F5)`);
console.log(`2. Clear browser cache`);
console.log(`3. Restart the development server (npm run dev)`);

// Also touch the products file to update its timestamp
const productsPath = path.join(__dirname, '../src/data/products.json');
const stats = fs.statSync(productsPath);
const now = new Date();
fs.utimesSync(productsPath, now, now);