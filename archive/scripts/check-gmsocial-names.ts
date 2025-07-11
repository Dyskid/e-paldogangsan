import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  name?: string;
  price: string | number;
  mallId: string;
  mallName: string;
}

async function checkGmsocialNames() {
  console.log('🔍 Checking 광명가치몰 product names...\n');
  
  try {
    // Read products database
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Filter gmsocial products
    const gmsocialProducts = products.filter(p => 
      p.id && p.id.startsWith('gmsocial_')
    );
    
    console.log(`📊 Found ${gmsocialProducts.length} 광명가치몰 products\n`);
    
    // Check for missing names
    const missingNames = gmsocialProducts.filter(p => !p.name);
    const hasNames = gmsocialProducts.filter(p => p.name);
    
    if (missingNames.length > 0) {
      console.log(`❌ Products missing names: ${missingNames.length}`);
      console.log('\nProducts without names:');
      missingNames.forEach(p => {
        console.log(`  - ${p.id}: ${p.title}`);
      });
    } else {
      console.log(`✅ All ${gmsocialProducts.length} products have names!`);
    }
    
    // Check if name matches title
    const mismatchedNames = gmsocialProducts.filter(p => p.name && p.title && p.name !== p.title);
    if (mismatchedNames.length > 0) {
      console.log(`\n⚠️  Products with different name and title: ${mismatchedNames.length}`);
      mismatchedNames.forEach(p => {
        console.log(`  - ${p.id}:`);
        console.log(`    Title: ${p.title}`);
        console.log(`    Name:  ${p.name}`);
      });
    }
    
    // Sample of products with names
    console.log('\n📋 Sample products with names:');
    hasNames.slice(0, 5).forEach(p => {
      console.log(`  ✅ ${p.id}: ${p.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking names:', error);
  }
}

// Run the check
if (require.main === module) {
  checkGmsocialNames().catch(console.error);
}