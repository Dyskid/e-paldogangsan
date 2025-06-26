const fs = require('fs');

const problematicMalls = [
  'gangwon-plus', // 강원더몰
  'gmsocial', // 광명가치몰
  'daejeon-sarang', // 대전사랑몰
  'woorimall', // 우리몰
  'yangjufarm', // 양주농부마켓
  'jincheon', // 진천몰
  'goesanjangter', // 괴산장터
  'nongsarang', // 농사랑
  'dangjinfarm', // 당진팜
  'ehongseong' // e홍성장터
];

const workingMall = 'donghae'; // 동해몰 (정상 작동)

try {
  console.log('🔍 Debugging specific mall product names...\n');
  
  const productsData = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsData);
  
  console.log(`📊 Total products loaded: ${products.length}\n`);
  
  // Check working mall first
  const workingProducts = products.filter(p => p.mallId === workingMall);
  console.log(`✅ ${workingMall.toUpperCase()} (Working mall):`);
  console.log(`   Products: ${workingProducts.length}`);
  if (workingProducts.length > 0) {
    const sample = workingProducts[0];
    console.log(`   Sample product:`, {
      id: sample.id,
      name: sample.name,
      nameExists: !!sample.name,
      nameLength: sample.name?.length || 0,
      hasTitle: !!sample.title,
      mallName: sample.mallName
    });
  }
  console.log('');
  
  // Check problematic malls
  problematicMalls.forEach(mallId => {
    const mallProducts = products.filter(p => p.mallId === mallId);
    console.log(`❓ ${mallId.toUpperCase()}:`);
    console.log(`   Products: ${mallProducts.length}`);
    
    if (mallProducts.length > 0) {
      const sample = mallProducts[0];
      console.log(`   Sample product:`, {
        id: sample.id,
        name: sample.name,
        nameExists: !!sample.name,
        nameLength: sample.name?.length || 0,
        hasTitle: !!sample.title,
        mallName: sample.mallName
      });
      
      // Check if all products in this mall have names
      const productsWithoutName = mallProducts.filter(p => !p.name);
      const productsWithEmptyName = mallProducts.filter(p => p.name === '' || p.name === null || p.name === undefined);
      
      if (productsWithoutName.length > 0) {
        console.log(`   ❌ ${productsWithoutName.length} products missing name field`);
      }
      if (productsWithEmptyName.length > 0) {
        console.log(`   ❌ ${productsWithEmptyName.length} products with empty name`);
      }
      if (productsWithoutName.length === 0 && productsWithEmptyName.length === 0) {
        console.log(`   ✅ All products have valid names`);
      }
    } else {
      console.log(`   ❌ No products found for this mall`);
    }
    console.log('');
  });
  
  // Check if any products still have title field
  const productsWithTitle = products.filter(p => p.title);
  console.log(`🔍 Products with title field: ${productsWithTitle.length}`);
  
  if (productsWithTitle.length > 0) {
    console.log('First few products with title field:');
    productsWithTitle.slice(0, 3).forEach(p => {
      console.log(`  - ${p.id}: title="${p.title}", name="${p.name}"`);
    });
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}