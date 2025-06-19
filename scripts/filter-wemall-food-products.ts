import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercent?: string;
  imageUrl: string;
  externalUrl: string;
  category: string;
  isNew: boolean;
  isBest: boolean;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

// Food/Agricultural categories from wemall
const FOOD_CATEGORIES = [
  '식품/농산품',
  '쌀/농축산물',
  '차/음료/과자/가공식품',
  '건강식품/다이어트',
  '농축수산물',
  '가공식품'
];

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters except comma
  const cleanPrice = priceStr.replace(/[^0-9,]/g, '');
  
  // Remove commas and convert to number
  return parseInt(cleanPrice.replace(/,/g, ''), 10) || 0;
}

function filterWemallFoodProducts() {
  console.log('🔍 Filtering 우리몰 food/agricultural products...');
  
  // Read existing products
  const existingProductsData = readFileSync('./src/data/products.json', 'utf-8');
  const existingProducts: Product[] = JSON.parse(existingProductsData);
  
  // Read scraped wemall products
  const scrapedData = readFileSync('./scripts/output/wemall-products.json', 'utf-8');
  const scrapedProducts: ScrapedProduct[] = JSON.parse(scrapedData);
  
  console.log(`📊 Total scraped products: ${scrapedProducts.length}`);
  
  // Filter for food/agricultural products only
  const foodProducts = scrapedProducts.filter(product => 
    FOOD_CATEGORIES.includes(product.category)
  );
  
  console.log(`🥕 Food/agricultural products found: ${foodProducts.length}`);
  
  // Remove all existing wemall products
  const nonWemallProducts = existingProducts.filter(p => !p.id.startsWith('wemall-'));
  console.log(`📦 Non-wemall products in database: ${nonWemallProducts.length}`);
  console.log(`🗑️ Removing ${existingProducts.length - nonWemallProducts.length} existing wemall products`);
  
  // Process and add only food products
  let addedCount = 0;
  let productsWithPrices = 0;
  let productsWithDiscounts = 0;
  
  const mallInfo = {
    mallId: 'wemall',
    mallName: '우리몰',
    mallUrl: 'https://wemall.kr',
    region: '대구광역시'
  };
  
  foodProducts.forEach(scraped => {
    const price = parsePrice(scraped.price);
    const originalPrice = scraped.originalPrice ? parsePrice(scraped.originalPrice) : undefined;
    
    if (price > 0) productsWithPrices++;
    if (originalPrice && originalPrice > price) productsWithDiscounts++;
    
    const product: Product = {
      id: scraped.id,
      name: scraped.title,
      price: price,
      originalPrice: originalPrice,
      image: scraped.imageUrl,
      category: scraped.category === '농축수산물' ? '농축수산물' : '가공식품',
      region: scraped.region,
      url: scraped.externalUrl || `https://wemall.kr/product/product.html?id=${scraped.id.replace('wemall-', '')}`,
      description: scraped.description || '',
      tags: scraped.tags,
      isFeatured: scraped.isBest || false,
      isNew: scraped.isNew || false,
      mall: mallInfo
    };
    
    nonWemallProducts.push(product);
    addedCount++;
  });
  
  // Sort products by ID
  nonWemallProducts.sort((a, b) => a.id.localeCompare(b.id));
  
  // Write updated products back to file
  writeFileSync('./src/data/products.json', JSON.stringify(nonWemallProducts, null, 2));
  
  // Generate summary
  const summary = {
    timestamp: new Date().toISOString(),
    mall: mallInfo,
    filtering: {
      totalScraped: scrapedProducts.length,
      foodProductsOnly: foodProducts.length,
      nonFoodRemoved: scrapedProducts.length - foodProducts.length
    },
    products: {
      added: addedCount,
      totalInDatabase: nonWemallProducts.length
    },
    categories: {
      foodCategories: FOOD_CATEGORIES,
      distribution: foodProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    priceAnalysis: {
      withPrices: productsWithPrices,
      withoutPrices: foodProducts.length - productsWithPrices,
      withDiscounts: productsWithDiscounts,
      averagePrice: productsWithPrices > 0 
        ? Math.round(foodProducts.reduce((sum, p) => sum + parsePrice(p.price), 0) / productsWithPrices)
        : 0
    },
    sampleProducts: foodProducts.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      price: parsePrice(p.price),
      originalPrice: p.originalPrice ? parsePrice(p.originalPrice) : undefined,
      category: p.category
    }))
  };
  
  writeFileSync('./scripts/output/wemall-food-filter-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Filtering Summary:');
  console.log(`✅ Food products registered: ${addedCount}`);
  console.log(`🗑️ Non-food products removed: ${scrapedProducts.length - foodProducts.length}`);
  console.log(`📦 Total products in database: ${nonWemallProducts.length}`);
  console.log(`💰 Products with prices: ${productsWithPrices}`);
  console.log(`🏷️ Products with discounts: ${productsWithDiscounts}`);
  
  console.log('\n📂 Food category distribution:');
  Object.entries(summary.categories.distribution).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} products`);
  });
}

// Run the filter
filterWemallFoodProducts();