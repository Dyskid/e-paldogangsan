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

async function checkGwdmallNames() {
  console.log('🔍 Checking 강원더몰 product names...\n');
  
  try {
    // Read products database
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Filter gwdmall products
    const gwdmallProducts = products.filter(p => 
      p.id && (p.id.startsWith('gwdmall_') || p.mallId === 'gwdmall' || p.mallName === '강원더몰')
    );
    
    console.log(`📊 Found ${gwdmallProducts.length} 강원더몰 products\n`);
    
    // Check for missing names
    const missingNames = gwdmallProducts.filter(p => !p.name);
    const hasNames = gwdmallProducts.filter(p => p.name);
    
    if (missingNames.length > 0) {
      console.log(`❌ Products missing names: ${missingNames.length}`);
      console.log('\nProducts without names:');
      missingNames.forEach(p => {
        console.log(`  - ${p.id}: ${p.title || 'NO TITLE'}`);
      });
      
      // Save missing names for fixing
      const fixData = missingNames.map(p => ({
        id: p.id,
        title: p.title,
        suggestedName: p.title
      }));
      
      const outputFile = path.join(__dirname, 'output', 'gwdmall-missing-names.json');
      fs.writeFileSync(outputFile, JSON.stringify(fixData, null, 2));
      console.log(`\n💾 Saved missing names data to: ${outputFile}`);
      
    } else {
      console.log(`✅ All ${gwdmallProducts.length} products have names!`);
    }
    
    // Sample of products with names
    if (hasNames.length > 0) {
      console.log('\n📋 Sample products with names:');
      hasNames.slice(0, 5).forEach(p => {
        console.log(`  ✅ ${p.id}: ${p.name}`);
      });
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total products: ${gwdmallProducts.length}`);
    console.log(`   With names: ${hasNames.length}`);
    console.log(`   Missing names: ${missingNames.length}`);
    
  } catch (error) {
    console.error('❌ Error checking names:', error);
  }
}

// Run the check
if (require.main === module) {
  checkGwdmallNames().catch(console.error);
}