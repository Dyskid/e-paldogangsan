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

async function registerHaegaramProducts() {
  try {
    console.log('Starting Haegaram product registration...\n');
    
    // Read scraped products
    const scrapedData = await fs.readFile('scripts/output/haegaram-products.json', 'utf-8');
    const scrapedProducts: ScrapedProduct[] = JSON.parse(scrapedData);
    
    console.log(`Found ${scrapedProducts.length} scraped products`);
    
    // Read existing products
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    const existingData = await fs.readFile(productsPath, 'utf-8');
    let existingProducts: ExistingProduct[] = JSON.parse(existingData);
    
    console.log(`Current total products in database: ${existingProducts.length}`);
    
    // Filter out any existing Haegaram products to avoid duplicates
    const existingHaegaramIds = new Set(
      existingProducts
        .filter(p => p.id.startsWith('haegaram_'))
        .map(p => p.id)
    );
    
    console.log(`Found ${existingHaegaramIds.size} existing Haegaram products`);
    
    // Remove existing Haegaram products
    existingProducts = existingProducts.filter(p => !p.id.startsWith('haegaram_'));
    
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
          logo: '/logos/mall_해가람.png' // Logo will need to be added
        },
        tags: generateTags(product.title, product.category),
        isNew: true
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
      mall: '해가람',
      totalScraped: scrapedProducts.length,
      totalRegistered: newProducts.length,
      existingProductsRemoved: existingHaegaramIds.size,
      categoryBreakdown: getCategoryBreakdown(newProducts),
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
      }
    };
    
    await fs.writeFile(
      'scripts/output/haegaram-registration-summary.json',
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
    '생선/어패': '수산물',
    '건어물': '수산물',
    '해조류': '수산물',
    '젓갈/액젓': '수산물'
  };
  
  return categoryMap[scrapedCategory] || '기타';
}

function generateTags(title: string, category: string): string[] {
  const tags: string[] = [];
  
  // Category-based tags
  if (category.includes('생선') || category.includes('어패')) {
    tags.push('신선식품', '수산물');
  }
  if (category.includes('건어물')) {
    tags.push('건어물', '수산가공품');
  }
  if (category.includes('해조류')) {
    tags.push('해조류', '김', '미역');
  }
  if (category.includes('젓갈') || category.includes('액젓')) {
    tags.push('젓갈', '발효식품', '전통식품');
  }
  
  // Product-specific tags
  if (title.includes('고등어')) tags.push('고등어');
  if (title.includes('갈치')) tags.push('갈치');
  if (title.includes('장어')) tags.push('장어', '보양식');
  if (title.includes('오징어')) tags.push('오징어');
  if (title.includes('새우')) tags.push('새우');
  if (title.includes('멸치')) tags.push('멸치');
  if (title.includes('김')) tags.push('김');
  if (title.includes('선물')) tags.push('선물세트');
  if (title.includes('프리미엄')) tags.push('프리미엄');
  
  // Regional tags
  if (title.includes('부안')) tags.push('부안특산');
  if (title.includes('군산')) tags.push('군산특산');
  if (title.includes('고창')) tags.push('고창특산');
  if (title.includes('풍천')) tags.push('풍천장어');
  
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
registerHaegaramProducts().catch(console.error);