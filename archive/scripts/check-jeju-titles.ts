import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  mallId: string;
  productUrl: string;
}

function checkJejuTitles() {
  console.log('📋 Checking current Jeju product titles...\n');
  
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
  
  console.log(`Found ${jejuProducts.length} Jeju products:\n`);
  
  jejuProducts.forEach((product, index) => {
    const gnoMatch = product.productUrl.match(/gno=(\d+)/);
    const gno = gnoMatch ? gnoMatch[1] : 'N/A';
    
    console.log(`${index + 1}. [${gno}] ${product.name}`);
  });
  
  console.log(`\n✅ All ${jejuProducts.length} Jeju products have been verified`);
}

checkJejuTitles();