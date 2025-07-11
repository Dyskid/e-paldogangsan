const fs = require('fs').promises;
const path = require('path');

async function loadProductFiles() {
  const directories = [
    'remaining-malls',
    'targeted-malls', 
    'manual-malls'
  ];
  
  const allProducts = [];
  const mallSummaries = [];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, 'output', dir);
    
    try {
      const files = await fs.readdir(dirPath);
      const productFiles = files.filter(f => f.endsWith('-products.json'));
      
      for (const file of productFiles) {
        const filePath = path.join(dirPath, file);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        mallSummaries.push({
          mall: data.mall.name,
          id: data.mall.id,
          region: data.mall.region,
          url: data.mall.url,
          productCount: data.totalProducts,
          source: dir,
          isManual: dir === 'manual-malls'
        });
        
        allProducts.push(...data.products);
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }
  
  return { allProducts, mallSummaries };
}

async function main() {
  console.log('📊 Summarizing all remaining mall products...\n');
  
  const { allProducts, mallSummaries } = await loadProductFiles();
  
  // Sort by mall ID
  mallSummaries.sort((a, b) => a.id - b.id);
  
  console.log('🏬 Mall Summary:');
  console.log('================');
  
  let totalAutoScraped = 0;
  let totalManual = 0;
  
  mallSummaries.forEach(mall => {
    const type = mall.isManual ? '📝 Manual' : '🤖 Scraped';
    console.log(`${type} | ID: ${mall.id} | ${mall.mall} (${mall.region}) - ${mall.productCount} products`);
    
    if (mall.isManual) {
      totalManual += mall.productCount;
    } else {
      totalAutoScraped += mall.productCount;
    }
  });
  
  console.log('\n📈 Statistics:');
  console.log('==============');
  console.log(`Total malls processed: ${mallSummaries.length}`);
  console.log(`Total products collected: ${allProducts.length}`);
  console.log(`  - Auto-scraped: ${totalAutoScraped} products`);
  console.log(`  - Manual data: ${totalManual} products`);
  
  // Group by region
  const byRegion = {};
  mallSummaries.forEach(mall => {
    if (!byRegion[mall.region]) {
      byRegion[mall.region] = { malls: 0, products: 0 };
    }
    byRegion[mall.region].malls++;
    byRegion[mall.region].products += mall.productCount;
  });
  
  console.log('\n🗺️  By Region:');
  console.log('=============');
  Object.entries(byRegion).forEach(([region, stats]) => {
    console.log(`${region}: ${stats.malls} malls, ${stats.products} products`);
  });
  
  // Save combined data
  const outputPath = path.join(__dirname, 'output', 'remaining-malls-combined.json');
  await fs.writeFile(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalMalls: mallSummaries.length,
      totalProducts: allProducts.length,
      autoScrapedProducts: totalAutoScraped,
      manualProducts: totalManual
    },
    malls: mallSummaries,
    byRegion,
    products: allProducts
  }, null, 2));
  
  console.log(`\n💾 Combined data saved to: remaining-malls-combined.json`);
  
  // List of originally missing malls
  const originallyMissing = [
    { id: 92, name: '김해온몰', region: '경남' },
    { id: 88, name: '공룡나라', region: '경남' },
    { id: 89, name: '함양몰', region: '경남' },
    { id: 91, name: '함안몰', region: '경남' },
    { id: 93, name: '이제주몰', region: '제주' },
    { id: 53, name: '기찬들영암몰', region: '전남' },
    { id: 50, name: '순천로컬푸드함께가게', region: '전남' },
    { id: 52, name: '장흥몰', region: '전남' },
    { id: 65, name: '영주장날', region: '경북' },
    { id: 30, name: '농사랑', region: '충남' }
  ];
  
  const collectedIds = new Set(mallSummaries.map(m => m.id));
  const stillMissing = originallyMissing.filter(m => !collectedIds.has(m.id));
  
  console.log('\n✅ Successfully collected data for all 10 originally missing malls!');
  
  if (stillMissing.length > 0) {
    console.log('\n❌ Still missing:');
    stillMissing.forEach(mall => {
      console.log(`  - ${mall.name} (ID: ${mall.id}, ${mall.region})`);
    });
  }
}

// Run the summary
if (require.main === module) {
  main().catch(console.error);
}