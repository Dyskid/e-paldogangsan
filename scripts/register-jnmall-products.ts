import fs from 'fs/promises';
import path from 'path';

interface ScrapedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  mall: string;
  seller?: string;
}

interface ExistingProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  link: string;
  mall: {
    name: string;
    logo?: string;
  };
  tags?: string[];
  isNew?: boolean;
}

async function registerJnmallProducts() {
  try {
    console.log('Starting 남도장터 product registration...\n');
    
    // Read scraped products
    const scrapedData = await fs.readFile('scripts/output/jnmall-products.json', 'utf-8');
    const scrapedProducts: ScrapedProduct[] = JSON.parse(scrapedData);
    
    console.log(`Found ${scrapedProducts.length} scraped products`);
    
    // Read existing products
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    const existingData = await fs.readFile(productsPath, 'utf-8');
    let existingProducts: ExistingProduct[] = JSON.parse(existingData);
    
    console.log(`Current total products in database: ${existingProducts.length}`);
    
    // Filter out any existing jnmall products to avoid duplicates
    const existingJnmallIds = new Set(
      existingProducts
        .filter(p => p.id.startsWith('jnmall_'))
        .map(p => p.id)
    );
    
    console.log(`Found ${existingJnmallIds.size} existing 남도장터 products`);
    
    // Remove existing jnmall products
    existingProducts = existingProducts.filter(p => !p.id.startsWith('jnmall_'));
    
    // Transform scraped products to match the existing format
    const newProducts: ExistingProduct[] = scrapedProducts.map(product => {
      const transformedProduct: ExistingProduct = {
        id: product.id,
        name: product.title,
        price: product.price,
        category: mapCategory(product.category),
        image: product.imageUrl,
        link: product.productUrl,
        mall: {
          name: product.mall,
          logo: '/logos/mall_51_남도장터.png'
        },
        tags: generateTags(product.title, product.category, product.seller),
        isNew: product.category === '신상품'
      };
      
      if (product.originalPrice && product.originalPrice > product.price) {
        transformedProduct.originalPrice = product.originalPrice;
      }
      
      return transformedProduct;
    });
    
    // Combine with existing products
    const allProducts = [...existingProducts, ...newProducts];
    
    // Create backup
    const timestamp = Date.now();
    const backupPath = `src/data/products-backup-${timestamp}.json`;
    await fs.writeFile(backupPath, existingData);
    console.log(`\nCreated backup at: ${backupPath}`);
    
    // Save updated products
    await fs.writeFile(
      productsPath,
      JSON.stringify(allProducts, null, 2)
    );
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '남도장터',
      totalScraped: scrapedProducts.length,
      totalRegistered: newProducts.length,
      existingProductsRemoved: existingJnmallIds.size,
      categoryBreakdown: getCategoryBreakdown(newProducts),
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
      }
    };
    
    await fs.writeFile(
      'scripts/output/jnmall-registration-summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n' + '='.repeat(50));
    console.log('REGISTRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Products registered: ${newProducts.length}`);
    console.log(`Total products now: ${allProducts.length}`);
    console.log('\nCategory breakdown:');
    Object.entries(summary.categoryBreakdown).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    console.log(`\nPrice range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
    
  } catch (error) {
    console.error('Error registering products:', error);
    throw error;
  }
}

function mapCategory(scrapedCategory: string): string {
  // Map scraped categories to standard categories
  const categoryMap: { [key: string]: string } = {
    '추천상품': '추천상품',
    '시군몰': '지역특산',
    '신상품': '신상품',
    '로컬상품관': '지역특산',
    '기타': '기타'
  };
  
  return categoryMap[scrapedCategory] || '기타';
}

function generateTags(title: string, category: string, seller?: string): string[] {
  const tags: string[] = [];
  
  // Category-based tags
  if (category === '신상품') {
    tags.push('신상품', 'NEW');
  }
  if (category === '로컬상품관' || category === '시군몰') {
    tags.push('지역특산', '로컬푸드');
  }
  
  // Product-specific tags
  if (title.includes('누룽지')) tags.push('누룽지', '전통식품');
  if (title.includes('매실')) tags.push('매실', '과일');
  if (title.includes('쌀과자')) tags.push('과자', '간식');
  if (title.includes('선물세트')) tags.push('선물세트', '선물');
  if (title.includes('유기농')) tags.push('유기농', '친환경');
  if (title.includes('전통')) tags.push('전통식품');
  if (title.includes('수제')) tags.push('수제');
  if (title.includes('간장')) tags.push('간장', '장류');
  if (title.includes('된장')) tags.push('된장', '장류');
  if (title.includes('고추장')) tags.push('고추장', '장류');
  if (title.includes('김치')) tags.push('김치', '발효식품');
  if (title.includes('차')) tags.push('차', '음료');
  if (title.includes('꿀')) tags.push('꿀', '벌꿀');
  
  // Regional tags
  if (title.includes('전남') || title.includes('전라남도')) tags.push('전남특산');
  if (title.includes('순천')) tags.push('순천특산');
  if (title.includes('나주')) tags.push('나주특산');
  if (title.includes('담양')) tags.push('담양특산');
  if (title.includes('영광')) tags.push('영광특산');
  if (title.includes('무안')) tags.push('무안특산');
  
  // Seller tags
  if (seller && seller.includes('농업회사법인')) tags.push('농업법인');
  if (seller && seller.includes('영농조합')) tags.push('영농조합');
  
  // Remove duplicates
  return [...new Set(tags)];
}

function getCategoryBreakdown(products: ExistingProduct[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {};
  
  products.forEach(product => {
    breakdown[product.category] = (breakdown[product.category] || 0) + 1;
  });
  
  return breakdown;
}

// Run the registration
registerJnmallProducts().catch(console.error);