import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name?: string;
  title?: string;
  mallId?: string;
  mallName?: string;
}

async function testApiProducts() {
  console.log('🔍 Testing products API data structure...\n');
  
  try {
    // Read products file directly (same as API does)
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Filter gmsocial products  
    const gmsocialProducts = products.filter(p => 
      p.id && p.id.startsWith('gmsocial_')
    );
    
    console.log(`📊 Found ${gmsocialProducts.length} 광명가치몰 products in API data\n`);
    
    // Check first 5 products
    console.log('🔍 Sample products data structure:');
    console.log('ID | Has Name | Has Title | Name Value | Title Value');
    console.log('---|----------|-----------|------------|------------');
    
    gmsocialProducts.slice(0, 5).forEach(p => {
      const hasName = p.name ? '✅' : '❌';
      const hasTitle = p.title ? '✅' : '❌';
      const nameValue = p.name ? p.name.substring(0, 30) + '...' : 'NONE';
      const titleValue = p.title ? p.title.substring(0, 30) + '...' : 'NONE';
      
      console.log(`${p.id} | ${hasName} | ${hasTitle} | ${nameValue} | ${titleValue}`);
    });
    
    // Check for products missing names
    const missingNames = gmsocialProducts.filter(p => !p.name);
    const missingTitles = gmsocialProducts.filter(p => !p.title);
    
    console.log('\n📊 Data completeness:');
    console.log(`   Products with name field: ${gmsocialProducts.length - missingNames.length}/${gmsocialProducts.length}`);
    console.log(`   Products with title field: ${gmsocialProducts.length - missingTitles.length}/${gmsocialProducts.length}`);
    
    if (missingNames.length > 0) {
      console.log('\n❌ Products missing name field:');
      missingNames.forEach(p => {
        console.log(`   ${p.id}: title="${p.title}"`);
      });
    }
    
    // Check what the API search logic would find
    console.log('\n🔍 API search test (line 47 in route.ts):');
    try {
      const testProduct = gmsocialProducts[0];
      console.log(`   Testing product: ${testProduct.id}`);
      console.log(`   product.name: "${testProduct.name}"`);
      console.log(`   product.name exists: ${!!testProduct.name}`);
      console.log(`   search would work: ${testProduct.name ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   Error testing search: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
if (require.main === module) {
  testApiProducts().catch(console.error);
}