import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types';

interface EjejuProduct {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  categoryId: string;
  isAvailable: boolean;
  brand?: string;
  description?: string;
  mallName: string;
  mallUrl: string;
  scrapedAt: string;
}

// Category mapping for 이제주몰
const categoryMapping: { [key: string]: string } = {
  '제주 농산품': 'food',
  '제주 수산품': 'food',
  '제주 축산품': 'food',
  '제주 가공식품': 'food',
  '제주 화장품': 'beauty',
  '제주 공예품': 'crafts',
  '농산품': 'food',
  '수산품': 'food',
  '축산품': 'food',
  '가공식품': 'food',
  '음료/주류': 'food',
  '공예품/생활용품': 'crafts',
  '건강식품': 'health',
  '기타': 'etc'
};

// Tag extraction from product data
function extractTags(product: EjejuProduct): string[] {
  const tags = new Set<string>();
  
  // Add mall tag
  tags.add('이제주몰');
  tags.add('제주도');
  
  // Add category-based tags
  if (product.category.includes('농산')) tags.add('농산물');
  if (product.category.includes('수산')) tags.add('수산물');
  if (product.category.includes('축산')) tags.add('축산물');
  if (product.category.includes('가공')) tags.add('가공식품');
  if (product.category.includes('화장품')) {
    tags.add('화장품');
    tags.add('뷰티');
  }
  if (product.category.includes('공예')) tags.add('공예품');
  if (product.category.includes('건강')) tags.add('건강식품');
  
  // Add brand as tag if exists
  if (product.brand) {
    tags.add(product.brand);
  }
  
  // Extract tags from title
  if (product.title.includes('선물')) tags.add('선물세트');
  if (product.title.includes('세트')) tags.add('세트상품');
  if (product.title.includes('프리미엄')) tags.add('프리미엄');
  if (product.title.includes('한정')) tags.add('한정판');
  
  // Extract tags from description
  if (product.description) {
    const descTags = product.description.match(/#[^\s#]+/g);
    if (descTags) {
      descTags.forEach(tag => {
        const cleanTag = tag.replace('#', '').trim();
        if (cleanTag && cleanTag.length > 1) {
          tags.add(cleanTag);
        }
      });
    }
  }
  
  return Array.from(tags);
}

async function registerEjejuProducts() {
  console.log('Starting 이제주몰 product registration...');
  
  // Load scraped products
  const scrapedProductsPath = path.join(__dirname, 'output', 'ejeju-mall-products-comprehensive.json');
  if (!fs.existsSync(scrapedProductsPath)) {
    console.error('Scraped products file not found. Please run the scraper first.');
    return;
  }
  
  const ejejuProducts: EjejuProduct[] = JSON.parse(fs.readFileSync(scrapedProductsPath, 'utf-8'));
  console.log(`Loaded ${ejejuProducts.length} products from 이제주몰`);
  
  // Load existing products
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  let existingProducts: Product[] = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`Loaded ${existingProducts.length} existing products`);
    
    // Remove any existing 이제주몰 products to prevent duplicates
    const beforeCount = existingProducts.length;
    existingProducts = existingProducts.filter(p => p.mallName !== '이제주몰');
    const removedCount = beforeCount - existingProducts.length;
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} existing 이제주몰 products`);
    }
  }
  
  // Convert 이제주몰 products to our product format
  const newProducts: Product[] = ejejuProducts.map((ejejuProduct, index) => {
    // Determine category
    let category = categoryMapping[ejejuProduct.category] || 'etc';
    
    // Create product ID with mall prefix
    const productId = `ejeju_${ejejuProduct.id}`;
    
    const product: Product = {
      id: productId,
      name: ejejuProduct.title,
      description: ejejuProduct.description,
      price: ejejuProduct.price.toString(),
      originalPrice: ejejuProduct.originalPrice?.toString(),
      imageUrl: ejejuProduct.imageUrl,
      productUrl: ejejuProduct.url,
      mallId: 'ejeju',
      mallName: ejejuProduct.mallName,
      category: category,
      tags: extractTags(ejejuProduct),
      inStock: ejejuProduct.isAvailable,
      lastUpdated: ejejuProduct.scrapedAt,
      createdAt: ejejuProduct.scrapedAt
    };
    
    return product;
  });
  
  console.log(`Converted ${newProducts.length} products to website format`);
  
  // Combine with existing products
  const allProducts = [...existingProducts, ...newProducts];
  
  // Sort by mall name and then by name for better organization
  allProducts.sort((a, b) => {
    if (a.mallName !== b.mallName) {
      return a.mallName.localeCompare(b.mallName);
    }
    return a.name.localeCompare(b.name);
  });
  
  // Save updated products
  fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));
  console.log(`Saved ${allProducts.length} total products (${newProducts.length} from 이제주몰)`);
  
  // Create summary report
  const summary = {
    registrationDate: new Date().toISOString(),
    mallName: '이제주몰',
    mallUrl: 'https://mall.ejeju.net',
    totalProductsRegistered: newProducts.length,
    totalProductsInDatabase: allProducts.length,
    categoriesBreakdown: newProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    brandsFound: newProducts.filter(p => p.name.includes('[')).length,
    priceRange: {
      min: Math.min(...newProducts.map(p => parseInt(p.price))),
      max: Math.max(...newProducts.map(p => parseInt(p.price))),
      average: Math.round(newProducts.reduce((sum, p) => sum + parseInt(p.price), 0) / newProducts.length)
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'ejeju-registration-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n=== Registration Complete ===');
  console.log(`Successfully registered ${newProducts.length} products from 이제주몰`);
  console.log('\nCategory breakdown:');
  Object.entries(summary.categoriesBreakdown).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} products`);
  });
  console.log(`\nPrice range: ₩${summary.priceRange.min.toLocaleString()} - ₩${summary.priceRange.max.toLocaleString()}`);
  console.log(`Average price: ₩${summary.priceRange.average.toLocaleString()}`);
  
  return { products: newProducts, summary };
}

// Run the registration
if (require.main === module) {
  registerEjejuProducts().catch(console.error);
}

export { registerEjejuProducts };