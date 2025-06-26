import fs from 'fs';
import path from 'path';

// Malls marked with @ (non-existent) - to be completely removed
const nonExistentMalls = [
  '온서울마켓',
  '부산브랜드몰', 
  '인천e몰',
  '울산몰',
  '세종로컬푸드',
  '제천로컬푸드'
];

// Malls marked with @@ (compatibility issues) - to be commented out
const problematicMalls = [
  '마켓경기',
  '지평선몰(김제)',
  '진안고원몰',
  '임실몰',
  '순창로컬푸드쇼핑몰',
  '해피굿팜',
  '해남미소',
  '안동장터',
  '김천노다지장터'
];

// Map mall names to their likely IDs for matching
const mallNameToId: { [key: string]: string[] } = {
  '온서울마켓': ['mall_1_온서울마켓', 'onseoul'],
  '부산브랜드몰': ['mall_2_부산브랜드몰', 'busanbrand'],
  '인천e몰': ['mall_5_인천e몰', 'incheone'],
  '울산몰': ['ulsan', 'ulsanmall'],
  '세종로컬푸드': ['sejong', 'sjlocal'],
  '제천로컬푸드': ['jecheon', 'jclocal'],
  '마켓경기': ['mall_14_마켓경기', 'marketgyeonggi'],
  '지평선몰(김제)': ['jpsmall', 'gimje'],
  '진안고원몰': ['jinan'],
  '임실몰': ['imsil'],
  '순창로컬푸드쇼핑몰': ['sunchang'],
  '해피굿팜': ['hgoodfarm'],
  '해남미소': ['haenam'],
  '안동장터': ['andong'],
  '김천노다지장터': ['gimcheon', 'gcnodaji']
};

async function cleanupMallData() {
  const mallsFile = path.join(__dirname, '../src/data/malls.json');
  const productsFile = path.join(__dirname, '../src/data/products.json');
  
  try {
    console.log('🧹 Starting mall data cleanup...');
    
    // Read current data
    const mallsData = JSON.parse(fs.readFileSync(mallsFile, 'utf-8'));
    const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
    
    console.log(`📊 Original data: ${mallsData.length} malls, ${productsData.length} products`);
    
    // Step 1: Remove non-existent malls (@ prefix)
    console.log('\n🗑️  Removing non-existent malls...');
    
    let removedMalls = 0;
    let removedProducts = 0;
    
    const filteredMalls = mallsData.filter((mall: any) => {
      for (const nonExistentMall of nonExistentMalls) {
        const possibleIds = mallNameToId[nonExistentMall] || [];
        
        // Check if mall matches by name or ID
        if (mall.name === nonExistentMall || 
            possibleIds.includes(mall.id) ||
            possibleIds.some(id => mall.id.includes(id))) {
          console.log(`   ❌ Removing mall: ${mall.name} (${mall.id})`);
          removedMalls++;
          return false;
        }
      }
      return true;
    });
    
    const filteredProducts = productsData.filter((product: any) => {
      for (const nonExistentMall of nonExistentMalls) {
        const possibleIds = mallNameToId[nonExistentMall] || [];
        
        // Check product's mall reference
        const productMallId = product.mallId || product.mall?.mallId;
        const productMallName = product.mallName || product.mall?.mallName;
        
        if (productMallName === nonExistentMall ||
            possibleIds.includes(productMallId) ||
            possibleIds.some(id => productMallId?.includes(id))) {
          removedProducts++;
          return false;
        }
      }
      return true;
    });
    
    // Step 2: Comment out problematic malls (@@ prefix)
    console.log('\n💤 Commenting out problematic malls...');
    
    let commentedMalls = 0;
    let commentedProducts = 0;
    
    const processedMalls = filteredMalls.map((mall: any) => {
      for (const problematicMall of problematicMalls) {
        const possibleIds = mallNameToId[problematicMall] || [];
        
        if (mall.name === problematicMall ||
            possibleIds.includes(mall.id) ||
            possibleIds.some(id => mall.id.includes(id))) {
          console.log(`   💤 Commenting out mall: ${mall.name} (${mall.id})`);
          commentedMalls++;
          return {
            ...mall,
            _commented: true,
            _reason: 'Compatibility issues - temporarily disabled',
            featured: false,
            isNew: false
          };
        }
      }
      return mall;
    });
    
    const processedProducts = filteredProducts.map((product: any) => {
      for (const problematicMall of problematicMalls) {
        const possibleIds = mallNameToId[problematicMall] || [];
        
        const productMallId = product.mallId || product.mall?.mallId;
        const productMallName = product.mallName || product.mall?.mallName;
        
        if (productMallName === problematicMall ||
            possibleIds.includes(productMallId) ||
            possibleIds.some(id => productMallId?.includes(id))) {
          commentedProducts++;
          return {
            ...product,
            _commented: true,
            _reason: 'Mall has compatibility issues - temporarily disabled'
          };
        }
      }
      return product;
    });
    
    // Write updated data
    fs.writeFileSync(mallsFile, JSON.stringify(processedMalls, null, 2));
    fs.writeFileSync(productsFile, JSON.stringify(processedProducts, null, 2));
    
    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Final data: ${processedMalls.length} malls, ${processedProducts.length} products`);
    console.log(`🗑️  Removed: ${removedMalls} malls, ${removedProducts} products`);
    console.log(`💤 Commented: ${commentedMalls} malls, ${commentedProducts} products`);
    
    // Create backup of original mergedmalls.txt with cleaned version
    const mergedMallsFile = path.join(__dirname, '../backup/mergedmalls.txt');
    const mergedMallsContent = fs.readFileSync(mergedMallsFile, 'utf-8');
    
    // Remove @ entries and comment out @@ entries
    const cleanedContent = mergedMallsContent
      .split('\n')
      .filter(line => !line.trim().startsWith('@온서울마켓:'))
      .filter(line => !line.trim().startsWith('@부산브랜드몰:'))
      .filter(line => !line.trim().startsWith('@인천e몰:'))
      .filter(line => !line.trim().startsWith('@울산몰:'))
      .filter(line => !line.trim().startsWith('@세종로컬푸드:'))
      .filter(line => !line.trim().startsWith('@제천로컬푸드:'))
      .map(line => {
        if (line.trim().startsWith('@@')) {
          return `# ${line} (temporarily disabled due to compatibility issues)`;
        }
        return line;
      })
      .join('\n');
    
    fs.writeFileSync(mergedMallsFile, cleanedContent);
    console.log(`📝 Updated mergedmalls.txt`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupMallData();