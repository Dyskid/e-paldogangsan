import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function cleanCategoryProducts() {
  console.log('🧹 Cleaning category names from product database...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  console.log(`📊 Original products in database: ${products.length}`);
  
  // Category patterns to remove
  const categoryPatterns = [
    // Korean category names
    /^식품\/농산품$/,
    /^쌀\/농축산물$/,
    /^차\/음료\/과자\/가공식품$/,
    /^건강식품\/다이어트$/,
    /^생활용품$/,
    /^가구\/인테리어$/,
    /^침구\/커튼\/소품$/,
    /^주방\/생활\/수납용품$/,
    /^원예\/선물$/,
    /^건강\/미용$/,
    /^사무용품$/,
    /^복사용지\/토너류$/,
    /^문구\/팬시$/,
    /^사무지류$/,
    /^일반사무$/,
    /^사무기기$/,
    /^하드웨어$/,
    /^청소\/위생$/,
    /^디지털\/가전$/,
    /^생활가전$/,
    /^휴대폰\/스마트용품$/,
    /^컴퓨터\/주변기기$/,
    /^주방가전$/,
    /^공사\/인쇄$/,
    /^공사$/,
    /^광고\/디자인$/,
    /^인쇄$/,
    /^산업\/안전용품$/,
    /^청소용품$/,
    /^소독\/방역$/,
    /^마대$/,
    /^세제\/제지\/일용잡화$/,
    /^위생용품$/,
    /^스포츠\/건강$/,
    /^자전거\/헬스\/다이어트$/,
    /^등산\/아우도어\/캠핑$/,
    /^아동용품\/취미$/,
    /^유아\/간식$/,
    /^장난감\/유아교육\/인형$/,
    /^취미\/자동차\/공구$/,
    /^기타$/,
    /^BEST상품$/,
    /^관공서구매상품$/,
    /^공동구매상품$/,
    /^장애인\s*기업\s*제품$/,
    /^장애인기업\s*시공업체$/,
    /^토너\.?복사용지\.?사무용품\.?제지류\.?청소용품$/,
    
    // Generic category indicators
    /^카테고리$/,
    /^분류$/,
    /^목록$/,
    /^전체$/,
    /^더보기$/,
    /^리스트$/,
    /^상품목록$/,
    /^상품분류$/,
    
    // Empty or undefined names
    /^undefined$/,
    /^null$/,
    /^\s*$/
  ];
  
  // Products to keep
  const cleanProducts: Product[] = [];
  const removedProducts: Product[] = [];
  
  products.forEach(product => {
    const name = product.name || '';
    
    // Check if it matches category patterns
    const isCategory = categoryPatterns.some(pattern => pattern.test(name.trim()));
    
    // Additional checks for problematic entries
    const hasNoPrice = product.price === 0 || product.price === '0';
    const hasInvalidName = !name || name.trim() === '' || name === 'undefined' || name === 'null';
    const hasVariationPattern = /\//.test(name) && /\d+\w+\/\d+\w+/.test(name) && hasNoPrice; // Like "2kg/5kg"
    const hasUnknownMall = !product.mall?.mallId || product.mall.mallId === 'unknown';
    
    // Remove if it's clearly a category or problematic entry
    if (isCategory || hasInvalidName || (hasVariationPattern && hasUnknownMall && hasNoPrice)) {
      removedProducts.push(product);
    } else {
      cleanProducts.push(product);
    }
  });
  
  // Create backup before cleaning
  const backupFilename = `./scripts/output/products-backup-${Date.now()}.json`;
  writeFileSync(backupFilename, JSON.stringify(products, null, 2));
  console.log(`💾 Created backup: ${backupFilename}`);
  
  // Write cleaned products
  writeFileSync('./src/data/products.json', JSON.stringify(cleanProducts, null, 2));
  
  // Create removal report
  const removalReport = {
    timestamp: new Date().toISOString(),
    originalCount: products.length,
    cleanedCount: cleanProducts.length,
    removedCount: removedProducts.length,
    removedByMall: removedProducts.reduce((acc, product) => {
      const mallId = product.mall?.mallId || 'unknown';
      acc[mallId] = (acc[mallId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleRemovedProducts: removedProducts.slice(0, 20).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      mall: p.mall?.mallName || 'Unknown',
      reason: categoryPatterns.some(pattern => pattern.test(p.name || '')) ? 'Category pattern' :
              !p.name || p.name.trim() === '' ? 'Invalid name' :
              'Variation pattern'
    }))
  };
  
  writeFileSync('./scripts/output/category-cleanup-report.json', JSON.stringify(removalReport, null, 2));
  
  // Display results
  console.log('\n🧹 Cleanup Results:');
  console.log(`✅ Clean products kept: ${cleanProducts.length}`);
  console.log(`❌ Categories/invalid entries removed: ${removedProducts.length}`);
  console.log(`📊 Database size reduction: ${((removedProducts.length / products.length) * 100).toFixed(1)}%`);
  
  console.log('\n🗑️ Removed by Mall:');
  Object.entries(removalReport.removedByMall).forEach(([mallId, count]) => {
    console.log(`  ${mallId}: ${count} entries`);
  });
  
  console.log('\n❌ Sample Removed Entries:');
  removalReport.sampleRemovedProducts.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. "${item.name}" (${item.reason}) - ${item.mall}`);
  });
  
  console.log('\n✅ Cleanup complete!');
  console.log(`📁 Backup saved: ${backupFilename}`);
  console.log('📁 Report saved: ./scripts/output/category-cleanup-report.json');
}

// Run cleanup
cleanCategoryProducts();