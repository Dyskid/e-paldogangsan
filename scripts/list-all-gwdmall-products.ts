import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  name?: string;
  price: string | number;
  mallId: string;
  mallName: string;
  vendor?: string;
  category?: string;
}

async function listAllGwdmallProducts() {
  console.log('📋 Complete list of 강원더몰 products:\n');
  
  try {
    // Read products database
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Filter and sort gwdmall products
    const gwdmallProducts = products
      .filter(p => p.id && (p.id.startsWith('gwdmall_') || p.mallId === 'gwdmall' || p.mallName === '강원더몰'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('gwdmall_', ''));
        const bNum = parseInt(b.id.replace('gwdmall_', ''));
        return aNum - bNum;
      });
    
    console.log(`Total: ${gwdmallProducts.length} products\n`);
    console.log('No. | ID | Name | Category | Price');
    console.log('----|----|----|----------|------');
    
    gwdmallProducts.forEach((p, index) => {
      const hasName = p.name ? '✅' : '❌';
      const name = p.name || p.title || 'NO NAME';
      const category = p.category || '-';
      const price = typeof p.price === 'number' ? `${p.price.toLocaleString()}원` : p.price;
      console.log(`${(index + 1).toString().padStart(2, '0')} | ${p.id} | ${hasName} ${name.substring(0, 40)}${name.length > 40 ? '...' : ''} | ${category} | ${price}`);
    });
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total products: ${gwdmallProducts.length}`);
    console.log(`   Products with names: ${gwdmallProducts.filter(p => p.name).length}`);
    console.log(`   Products without names: ${gwdmallProducts.filter(p => !p.name).length}`);
    
    // Category breakdown
    const categories = gwdmallProducts.reduce((acc, p) => {
      const cat = p.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📂 Categories:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });
    
    // Missing names detail
    const missingNames = gwdmallProducts.filter(p => !p.name);
    if (missingNames.length > 0) {
      console.log('\n❌ Products missing names:');
      missingNames.forEach(p => {
        console.log(`   ${p.id}: ${p.title || 'NO TITLE'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing products:', error);
  }
}

// Run the listing
if (require.main === module) {
  listAllGwdmallProducts().catch(console.error);
}