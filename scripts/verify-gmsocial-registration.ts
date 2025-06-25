import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  name: string;
  price: string | number;
  mallId: string;
  mallName: string;
}

async function verifyGmsocialRegistration() {
  console.log('🔍 Verifying 광명가치몰 product registration...\n');
  
  try {
    // Read main products database
    const mainProductsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const mainProducts: Product[] = JSON.parse(fs.readFileSync(mainProductsFile, 'utf-8'));
    
    // Read newly registered products
    const registeredFile = path.join(__dirname, 'output', 'gmsocial-registered-products.json');
    const registeredProducts: Product[] = JSON.parse(fs.readFileSync(registeredFile, 'utf-8'));
    
    // Filter existing gmsocial products
    const existingGmsocialProducts = mainProducts.filter(p => 
      p.mallId === 'mall_12_광명가치몰' || 
      p.mallId === 'gmsocial' ||
      p.id.startsWith('gmsocial_')
    );
    
    console.log(`📊 Current Status:`);
    console.log(`   Total products in database: ${mainProducts.length}`);
    console.log(`   Existing 광명가치몰 products: ${existingGmsocialProducts.length}`);
    console.log(`   Newly registered products: ${registeredProducts.length}\n`);
    
    // Check for duplicates
    const existingIds = new Set(existingGmsocialProducts.map(p => p.id));
    const newProducts = registeredProducts.filter(p => !existingIds.has(p.id));
    const duplicates = registeredProducts.filter(p => existingIds.has(p.id));
    
    console.log(`🔄 Duplicate Check:`);
    console.log(`   New products to add: ${newProducts.length}`);
    console.log(`   Duplicate products (already exist): ${duplicates.length}\n`);
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Duplicate products found:`);
      duplicates.forEach(p => {
        console.log(`   - ${p.id}: ${p.name}`);
      });
      console.log('');
    }
    
    // Check existing products by ID range
    const productIdNumbers = existingGmsocialProducts
      .map(p => {
        const match = p.id.match(/gmsocial_(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(n => n !== null) as number[];
    
    if (productIdNumbers.length > 0) {
      const minId = Math.min(...productIdNumbers);
      const maxId = Math.max(...productIdNumbers);
      console.log(`📈 Product ID Range:`);
      console.log(`   Min ID: gmsocial_${minId}`);
      console.log(`   Max ID: gmsocial_${maxId}`);
      console.log(`   Total unique IDs: ${new Set(productIdNumbers).size}\n`);
    }
    
    // Verify data quality
    console.log(`✅ Data Quality Check for Registered Products:`);
    const withPrices = registeredProducts.filter(p => p.price && p.price !== '0원');
    const withNames = registeredProducts.filter(p => p.name && p.name.length > 0);
    const withTitles = registeredProducts.filter(p => p.title && p.title.length > 0);
    
    console.log(`   Products with valid prices: ${withPrices.length}/${registeredProducts.length}`);
    console.log(`   Products with names: ${withNames.length}/${registeredProducts.length}`);
    console.log(`   Products with titles: ${withTitles.length}/${registeredProducts.length}`);
    
    // Save verification report
    const report = {
      verificationDate: new Date().toISOString(),
      totalMainProducts: mainProducts.length,
      existingGmsocialProducts: existingGmsocialProducts.length,
      newlyRegisteredProducts: registeredProducts.length,
      newProductsToAdd: newProducts.length,
      duplicateProducts: duplicates.length,
      productIdRange: productIdNumbers.length > 0 ? {
        min: Math.min(...productIdNumbers),
        max: Math.max(...productIdNumbers)
      } : null,
      dataQuality: {
        withPrices: withPrices.length,
        withNames: withNames.length,
        withTitles: withTitles.length
      },
      recommendation: newProducts.length > 0 
        ? 'New products found. Consider adding them to the main database.'
        : 'All registered products already exist in the database.'
    };
    
    const reportFile = path.join(__dirname, 'output', 'gmsocial-verification-final.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📁 Verification report saved: ${reportFile}`);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

// Run verification
if (require.main === module) {
  verifyGmsocialRegistration().catch(console.error);
}