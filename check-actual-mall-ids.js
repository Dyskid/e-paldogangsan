const fs = require('fs');

try {
  console.log('🔍 Checking actual mall IDs in products...\n');
  
  const productsData = fs.readFileSync('./src/data/products.json', 'utf-8');
  const products = JSON.parse(productsData);
  
  // Get unique mall IDs and their counts
  const mallCounts = products.reduce((acc, product) => {
    const mallId = product.mallId;
    if (!acc[mallId]) {
      acc[mallId] = {
        count: 0,
        mallName: product.mallName,
        sampleId: product.id
      };
    }
    acc[mallId].count++;
    return acc;
  }, {});
  
  // Sort by count (descending)
  const sortedMalls = Object.entries(mallCounts)
    .sort(([,a], [,b]) => b.count - a.count);
  
  console.log('📊 All mall IDs in products data:');
  console.log('=====================================');
  
  sortedMalls.forEach(([mallId, data]) => {
    console.log(`${mallId}: ${data.count} products (${data.mallName})`);
  });
  
  console.log(`\n🎯 Total unique malls: ${sortedMalls.length}`);
  console.log(`📦 Total products: ${products.length}`);
  
  // Find malls with Korean names mentioned by user
  console.log('\n🔍 Looking for malls mentioned by user:');
  const userMentionedMalls = [
    '동해몰', '강원더몰', '광명가치몰', '대전사랑몰', '우리몰', 
    '양주농부마켓', '진천몰', '괴산장터', '농사랑', '당진팜', 'e홍성장터'
  ];
  
  userMentionedMalls.forEach(mallName => {
    const found = sortedMalls.find(([mallId, data]) => 
      data.mallName.includes(mallName) || mallName.includes(data.mallName)
    );
    if (found) {
      const [mallId, data] = found;
      console.log(`✅ ${mallName} → ${mallId} (${data.count} products)`);
    } else {
      console.log(`❌ ${mallName} → Not found in products`);
    }
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}