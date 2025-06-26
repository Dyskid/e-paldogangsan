const fs = require('fs');

try {
  console.log('🔍 Debugging products from problematic malls...\n');
  
  const productsData = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsData);
  
  const mallMapping = {
    'donghae': '동해몰',
    'gwdmall': '강원더몰', 
    'gmsocial': '광명가치몰',
    'ontongdaejeon': '대전사랑몰',
    'wemall': '우리몰',
    'yangju': '양주농부마켓',
    'undefined': '진천몰'
  };
  
  Object.entries(mallMapping).forEach(([mallId, mallName]) => {
    const mallProducts = products.filter(p => {
      if (mallId === 'undefined') {
        return p.mallId === undefined;
      }
      return p.mallId === mallId;
    });
    
    console.log(`\n🏪 ${mallName} (${mallId}):`);
    console.log(`   Products: ${mallProducts.length}`);
    
    if (mallProducts.length > 0) {
      const sampleProducts = mallProducts.slice(0, 3);
      sampleProducts.forEach((product, index) => {
        console.log(`   Sample ${index + 1}:`, {
          id: product.id,
          name: product.name,
          nameExists: !!product.name,
          nameLength: product.name?.length || 0,
          namePreview: product.name?.substring(0, 30) + (product.name?.length > 30 ? '...' : ''),
          mallName: product.mallName
        });
      });
      
      // Check for products without names
      const noNameProducts = mallProducts.filter(p => !p.name || p.name.trim() === '');
      if (noNameProducts.length > 0) {
        console.log(`   ❌ ${noNameProducts.length} products without proper names`);
        console.log(`   Sample without name:`, {
          id: noNameProducts[0].id,
          name: noNameProducts[0].name,
          description: noNameProducts[0].description?.substring(0, 50)
        });
      } else {
        console.log(`   ✅ All products have names`);
      }
    }
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}