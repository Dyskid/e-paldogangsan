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

async function listAllGmsocialProducts() {
  console.log('📋 Complete list of 광명가치몰 products:\n');
  
  try {
    // Read products database
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Filter and sort gmsocial products
    const gmsocialProducts = products
      .filter(p => p.id && p.id.startsWith('gmsocial_'))
      .sort((a, b) => {
        const aNum = parseInt(a.id.replace('gmsocial_', ''));
        const bNum = parseInt(b.id.replace('gmsocial_', ''));
        return aNum - bNum;
      });
    
    console.log(`Total: ${gmsocialProducts.length} products\n`);
    console.log('ID | Name | Category | Vendor | Price');
    console.log('---|------|----------|--------|------');
    
    gmsocialProducts.forEach(p => {
      const hasName = p.name ? '✅' : '❌';
      const name = p.name || p.title || 'NO NAME';
      const category = p.category || '-';
      const vendor = p.vendor || '-';
      console.log(`${p.id} | ${hasName} ${name.substring(0, 50)}${name.length > 50 ? '...' : ''} | ${category} | ${vendor} | ${p.price}`);
    });
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total products: ${gmsocialProducts.length}`);
    console.log(`   Products with names: ${gmsocialProducts.filter(p => p.name).length}`);
    console.log(`   Products without names: ${gmsocialProducts.filter(p => !p.name).length}`);
    
    // Category breakdown
    const categories = gmsocialProducts.reduce((acc, p) => {
      const cat = p.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📂 Categories:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error listing products:', error);
  }
}

// Run the listing
if (require.main === module) {
  listAllGmsocialProducts().catch(console.error);
}