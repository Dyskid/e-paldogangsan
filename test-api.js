const fs = require('fs');
const path = require('path');

// Simulate API behavior
const PRODUCTS_FILE = path.join(__dirname, 'src/data/products.json');

async function testAPI() {
  try {
    console.log('🔍 Testing API behavior...');
    
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const products = JSON.parse(data);
    
    console.log(`📊 Total products loaded: ${products.length}`);
    
    // Find gmsocial products
    const gmsocialProducts = products.filter(p => {
      const mallId = p.mallId || p.mall?.mallId;
      return mallId === 'gmsocial';
    });
    
    console.log(`\n🏪 GMSocial (광명가치몰) products: ${gmsocialProducts.length}`);
    
    if (gmsocialProducts.length > 0) {
      console.log('\n📋 First 3 gmsocial products:');
      gmsocialProducts.slice(0, 3).forEach((product, index) => {
        console.log(`\n${index + 1}. Product ID: ${product.id}`);
        console.log(`   Name: "${product.name}"`);
        console.log(`   Name exists: ${!!product.name}`);
        console.log(`   Name type: ${typeof product.name}`);
        console.log(`   Name length: ${product.name?.length || 0}`);
        console.log(`   Mall ID: ${product.mallId}`);
        console.log(`   Mall Name: ${product.mallName}`);
        console.log(`   Has title: ${!!(product.title)}`);
        console.log(`   Title: "${product.title || 'N/A'}"`);
        console.log(`   Object keys: ${Object.keys(product).join(', ')}`);
      });
    } else {
      console.log('❌ No gmsocial products found!');
    }
    
    // Check a few other malls
    const otherMalls = ['gwdmall', 'ontongdaejeon', 'wemall', 'yangju'];
    otherMalls.forEach(mallId => {
      const mallProducts = products.filter(p => {
        const pMallId = p.mallId || p.mall?.mallId;
        return pMallId === mallId;
      });
      console.log(`\n🏪 ${mallId}: ${mallProducts.length} products`);
      if (mallProducts.length > 0) {
        const sample = mallProducts[0];
        console.log(`   Sample name: "${sample.name}"`);
        console.log(`   Name exists: ${!!sample.name}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();