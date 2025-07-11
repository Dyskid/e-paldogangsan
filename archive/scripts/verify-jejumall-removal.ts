import * as fs from 'fs';
import * as path from 'path';

function verifyJejuMallRemoval() {
  console.log('✅ Verifying complete removal of 제주몰...\n');
  
  const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  
  const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  
  console.log(`📊 Current totals:`);
  console.log(`   Malls: ${malls.length}`);
  console.log(`   Products: ${products.length}`);
  
  // Check for any remaining 제주몰 references
  const jejuMallExists = malls.some((mall: any) => 
    mall.id === 'mall_99_제주몰' || 
    mall.url?.includes('jejumall.kr') ||
    mall.name === '제주몰'
  );
  
  const jejuMallProducts = products.filter((product: any) => 
    product.mallId === 'mall_99_제주몰'
  );
  
  console.log(`\n🔍 Verification results:`);
  console.log(`   제주몰 in malls.json: ${jejuMallExists ? '❌ FOUND' : '✅ NOT FOUND'}`);
  console.log(`   제주몰 products remaining: ${jejuMallProducts.length === 0 ? '✅ NONE' : `❌ ${jejuMallProducts.length} FOUND`}`);
  
  // Check remaining Jeju region malls
  const jejuMalls = malls.filter((mall: any) => mall.region === '제주');
  console.log(`\n🏝️ Remaining Jeju malls: ${jejuMalls.length}`);
  jejuMalls.forEach((mall: any, index: number) => {
    console.log(`   ${index + 1}. ${mall.name} (${mall.id}) - ${mall.url}`);
  });
  
  if (!jejuMallExists && jejuMallProducts.length === 0) {
    console.log(`\n🎉 SUCCESS: 제주몰 and all its products have been completely removed!`);
    console.log(`📈 Website now has ${malls.length} malls and ${products.length} products`);
  } else {
    console.log(`\n⚠️ WARNING: Some 제주몰 data may still remain`);
  }
}

verifyJejuMallRemoval();