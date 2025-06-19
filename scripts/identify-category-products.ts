import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

function identifyCategoryProducts() {
  console.log('🔍 Identifying category names registered as products...\n');
  
  // Read products from database
  const productsData = readFileSync('./src/data/products.json', 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  console.log(`📊 Total products in database: ${products.length}`);
  
  // Common category patterns that should NOT be registered as products
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
    
    // Very short generic names (likely categories)
    /^[가-힣]{1,3}$/,
    
    // Category-like patterns with slashes
    /^[가-힣\/\s]+\/[가-힣\/\s]+$/,
    
    // Empty or very generic names
    /^상품$/,
    /^제품$/,
    /^물품$/,
    /^품목$/
  ];
  
  // Find potential category products
  const potentialCategories: Product[] = [];
  const definiteProducts: Product[] = [];
  
  products.forEach(product => {
    const name = product.name || '';
    const isCategory = categoryPatterns.some(pattern => pattern.test(name.trim()));
    
    // Additional checks for category-like characteristics
    const hasNoQuantity = !/\d+\s*(g|kg|ml|L|개|포|병|통|팩|리터|그램|킬로|미터|센치|인치)/.test(name);
    const hasNoPrice = product.price === 0;
    const isTooGeneric = name.length < 5 && !/\d/.test(name);
    const hasSlashPattern = /\//.test(name) && !name.includes('[') && !name.includes('(');
    
    if (isCategory || (hasNoQuantity && hasNoPrice && isTooGeneric) || hasSlashPattern) {
      potentialCategories.push(product);
    } else {
      definiteProducts.push(product);
    }
  });
  
  // Group by mall to see which malls have category issues
  const categoryByMall: { [mall: string]: Product[] } = {};
  potentialCategories.forEach(product => {
    const mallId = product.mall?.mallId || 'unknown';
    if (!categoryByMall[mallId]) {
      categoryByMall[mallId] = [];
    }
    categoryByMall[mallId].push(product);
  });
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalProducts: products.length,
    potentialCategories: potentialCategories.length,
    definiteProducts: definiteProducts.length,
    categoryByMall: Object.entries(categoryByMall).map(([mallId, categories]) => ({
      mallId,
      categoryCount: categories.length,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        category: c.category
      }))
    })),
    sampleCategories: potentialCategories.slice(0, 20).map(c => ({
      id: c.id,
      name: c.name,
      price: c.price,
      mall: c.mall?.mallName || 'Unknown'
    }))
  };
  
  writeFileSync('./scripts/output/category-products-analysis.json', JSON.stringify(report, null, 2));
  
  // Display results
  console.log('\n📋 Category Analysis Results:');
  console.log(`❌ Potential categories registered as products: ${potentialCategories.length}`);
  console.log(`✅ Actual products: ${definiteProducts.length}`);
  console.log(`📊 Percentage of categories: ${((potentialCategories.length / products.length) * 100).toFixed(1)}%`);
  
  console.log('\n🏪 Categories by Mall:');
  Object.entries(categoryByMall).forEach(([mallId, categories]) => {
    console.log(`  ${mallId}: ${categories.length} categories`);
  });
  
  if (potentialCategories.length > 0) {
    console.log('\n❌ Sample Category Names Found:');
    potentialCategories.slice(0, 10).forEach((cat, i) => {
      console.log(`  ${i + 1}. "${cat.name}" (${cat.mall?.mallName || 'Unknown'}) - ₩${cat.price}`);
    });
  }
  
  console.log('\n✅ Analysis saved to: ./scripts/output/category-products-analysis.json');
  
  return {
    potentialCategories,
    definiteProducts,
    categoryByMall
  };
}

// Run analysis
const result = identifyCategoryProducts();
export { result };