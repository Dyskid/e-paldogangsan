import * as fs from 'fs';
import * as path from 'path';

async function debugGmsocialProducts() {
  console.log('🔍 Debugging gmsocial product display issue...\n');
  
  try {
    const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    // Find gmsocial products
    const gmsocialProducts = products.filter((p: any) => 
      p.id && p.id.startsWith('gmsocial_')
    );
    
    console.log(`📊 Found ${gmsocialProducts.length} gmsocial products\n`);
    
    // Check each gmsocial product structure
    gmsocialProducts.forEach((product: any, index: number) => {
      console.log(`${index + 1}. Product ${product.id}:`);
      console.log(`   name: "${product.name}" (${typeof product.name})`);
      console.log(`   title: "${product.title}" (${typeof product.title})`);
      console.log(`   price: "${product.price}" (${typeof product.price})`);
      console.log(`   mallName: "${product.mallName}" (${typeof product.mallName})`);
      console.log(`   category: "${product.category}" (${typeof product.category})`);
      
      // Check for potential issues
      if (!product.name) {
        console.log(`   ❌ ISSUE: name field is missing or empty!`);
      }
      if (typeof product.price === 'string' && product.price.includes('원')) {
        console.log(`   ⚠️  NOTICE: price is string format "${product.price}"`);
      }
      if (!product.mallName) {
        console.log(`   ❌ ISSUE: mallName field is missing!`);
      }
      
      console.log('');
    });
    
    // Compare with other products
    const otherProducts = products.filter((p: any) => 
      p.mallId === 'donghae'
    ).slice(0, 2);
    
    console.log('🔍 Comparing with donghae products:');
    otherProducts.forEach((product: any, index: number) => {
      console.log(`${index + 1}. Product ${product.id}:`);
      console.log(`   name: "${product.name}" (${typeof product.name})`);
      console.log(`   title: "${product.title}" (${typeof product.title})`);
      console.log(`   price: "${product.price}" (${typeof product.price})`);
      console.log(`   mallName: "${product.mallName}" (${typeof product.mallName})`);
      console.log('');
    });
    
    // Check for encoding issues
    console.log('🔍 Checking for encoding issues in gmsocial names:');
    gmsocialProducts.slice(0, 3).forEach((product: any) => {
      if (product.name) {
        console.log(`Name: "${product.name}"`);
        console.log(`Length: ${product.name.length}`);
        console.log(`First 10 chars: "${product.name.substring(0, 10)}"`);
        console.log(`UTF-8 bytes: ${Buffer.from(product.name, 'utf8').length}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging products:', error);
  }
}

if (require.main === module) {
  debugGmsocialProducts().catch(console.error);
}