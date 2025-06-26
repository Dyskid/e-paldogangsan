import * as fs from 'fs';
import * as path from 'path';

async function checkLiveProducts() {
  console.log('🔍 Checking for potential deployment issues...\n');
  
  try {
    // Check products.json file
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    const gmsocialProducts = products.filter((p: any) => p.id && p.id.startsWith('gmsocial_'));
    
    console.log(`📊 Local products.json has ${gmsocialProducts.length} 광명가치몰 products`);
    
    // Check first few products in detail
    console.log('\n🔍 Sample product structures:');
    gmsocialProducts.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`\n${i + 1}. Product ${p.id}:`);
      console.log(`   name: "${p.name}"`);
      console.log(`   title: "${p.title}"`);
      console.log(`   mallId: "${p.mallId}"`);
      console.log(`   mallName: "${p.mallName}"`);
      console.log(`   price: "${p.price}"`);
      console.log(`   category: "${p.category}"`);
    });
    
    // Check if the structure matches what the frontend expects
    console.log('\n🎯 Frontend compatibility check:');
    const firstProduct = gmsocialProducts[0];
    
    // Check if it matches ProductCard expectations
    const hasRequiredFields = {
      name: !!firstProduct.name,
      title: !!firstProduct.title,
      imageUrl: !!firstProduct.imageUrl,
      productUrl: !!firstProduct.productUrl,
      mallName: !!firstProduct.mallName,
      category: !!firstProduct.category,
      price: !!firstProduct.price
    };
    
    console.log('   Required fields present:');
    Object.entries(hasRequiredFields).forEach(([field, present]) => {
      console.log(`   ${field}: ${present ? '✅' : '❌'}`);
    });
    
    // Check if there are any null or undefined names
    const invalidNames = gmsocialProducts.filter((p: any) => !p.name || p.name === null || p.name === undefined);
    if (invalidNames.length > 0) {
      console.log('\n❌ Products with invalid names:');
      invalidNames.forEach((p: any) => {
        console.log(`   ${p.id}: name="${p.name}" (type: ${typeof p.name})`);
      });
    } else {
      console.log('\n✅ All products have valid names');
    }
    
    // Generate deployment trigger file
    const triggerFile = path.join(__dirname, 'trigger-rebuild.json');
    const triggerData = {
      timestamp: new Date().toISOString(),
      reason: 'Check 광명가치몰 product names display issue',
      gmsocialProductCount: gmsocialProducts.length,
      sampleProduct: {
        id: firstProduct.id,
        name: firstProduct.name,
        hasName: !!firstProduct.name
      }
    };
    
    fs.writeFileSync(triggerFile, JSON.stringify(triggerData, null, 2));
    console.log(`\n💾 Created deployment trigger: ${triggerFile}`);
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  }
}

// Run the check
if (require.main === module) {
  checkLiveProducts().catch(console.error);
}