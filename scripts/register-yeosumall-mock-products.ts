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
  note?: string;
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

async function registerYeosumallMockProducts() {
  try {
    console.log('Starting 여수몰 mock product registration...\n');
    
    // Read mock products
    const mockData = await fs.readFile('scripts/output/yeosumall-mock-products.json', 'utf-8');
    const mockProducts: ScrapedProduct[] = JSON.parse(mockData);
    
    console.log(`Found ${mockProducts.length} mock products`);
    console.log('NOTE: These are placeholder products created because the site is currently unavailable');
    
    // Read existing products
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    const existingData = await fs.readFile(productsPath, 'utf-8');
    let existingProducts: ExistingProduct[] = JSON.parse(existingData);
    
    console.log(`Current total products in database: ${existingProducts.length}`);
    
    // Filter out any existing yeosumall products to avoid duplicates
    const existingYeosumallIds = new Set(
      existingProducts
        .filter(p => p.id.startsWith('yeosumall_'))
        .map(p => p.id)
    );
    
    console.log(`Found ${existingYeosumallIds.size} existing 여수몰 products`);
    
    // Remove existing yeosumall products
    existingProducts = existingProducts.filter(p => !p.id.startsWith('yeosumall_'));
    
    // Transform mock products to match the existing format
    const newProducts: ExistingProduct[] = mockProducts.map(product => {
      const transformedProduct: ExistingProduct = {
        id: product.id,
        name: `${product.title} (사이트 접속 불가로 인한 임시 데이터)`,
        price: product.price,
        category: mapCategory(product.category),
        image: product.imageUrl,
        link: product.productUrl,
        mall: {
          name: product.mall,
          logo: '/logos/mall_52_여수몰.png'
        },
        tags: generateTags(product.title, product.category),
        isNew: false
      };
      
      if (product.originalPrice && product.originalPrice > product.price) {
        transformedProduct.originalPrice = product.originalPrice;
      }
      
      return transformedProduct;
    });
    
    // For now, let's not actually register the mock products to the main database
    // Instead, create a separate file for when the site becomes available
    
    await fs.writeFile(
      'scripts/output/yeosumall-products-ready-for-registration.json',
      JSON.stringify(newProducts, null, 2)
    );
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '여수몰',
      status: 'Mock products created - site unavailable',
      totalMockProducts: mockProducts.length,
      reason: 'Site showing server capacity exceeded error',
      categoryBreakdown: getCategoryBreakdown(newProducts),
      priceRange: {
        min: Math.min(...newProducts.map(p => p.price)),
        max: Math.max(...newProducts.map(p => p.price)),
        average: Math.round(newProducts.reduce((sum, p) => sum + p.price, 0) / newProducts.length)
      },
      nextSteps: [
        'Monitor site availability',
        'Replace mock data with real scraped products when site is accessible',
        'Register actual products to main database'
      ]
    };
    
    await fs.writeFile(
      'scripts/output/yeosumall-mock-registration-summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n' + '='.repeat(50));
    console.log('MOCK REGISTRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Mock products prepared: ${newProducts.length}`);
    console.log('Status: Products NOT added to main database (site unavailable)');
    console.log('\nCategory breakdown:');
    Object.entries(summary.categoryBreakdown).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    console.log(`\nPrice range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
    
    console.log('\nNext steps:');
    console.log('1. Monitor yeosumall.co.kr for accessibility');
    console.log('2. Re-run scraper when site becomes available');
    console.log('3. Replace mock data with real product data');
    
  } catch (error) {
    console.error('Error in mock registration:', error);
    throw error;
  }
}

function mapCategory(scrapedCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    '지역특산': '지역특산',
    '수산물': '수산물',
    '기타': '기타'
  };
  
  return categoryMap[scrapedCategory] || '기타';
}

function generateTags(title: string, category: string): string[] {
  const tags: string[] = [];
  
  // Add category-based tags
  if (category === '지역특산') {
    tags.push('지역특산', '여수특산');
  }
  if (category === '수산물') {
    tags.push('수산물', '해산물', '신선식품');
  }
  
  // Add product-specific tags
  if (title.includes('특산품')) tags.push('특산품');
  if (title.includes('해산물')) tags.push('해산물');
  if (title.includes('여수')) tags.push('여수특산');
  
  // Add temporary tag for mock data
  tags.push('임시데이터', '사이트점검중');
  
  return [...new Set(tags)];
}

function getCategoryBreakdown(products: ExistingProduct[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {};
  
  products.forEach(product => {
    breakdown[product.category] = (breakdown[product.category] || 0) + 1;
  });
  
  return breakdown;
}

// Run the mock registration
registerYeosumallMockProducts().catch(console.error);