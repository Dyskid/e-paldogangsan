import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

// Category mapping for 대전사랑몰
const categoryMapping: { [key: string]: string } = {
  '로컬상품관': '가공식품',
  '무료배송': '가공식품',
  '자활기업': '가공식품',
  '대전 로컬상품관': '가공식품',
  '지역특산품': '가공식품'
};

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters except comma and period
  const cleanPrice = priceStr.replace(/[^0-9,]/g, '');
  
  // Remove commas and convert to number
  return parseInt(cleanPrice.replace(/,/g, ''), 10) || 0;
}

function registerOntongDaejeonProducts() {
  console.log('📦 Starting 대전사랑몰 product registration...');
  
  // Read existing products
  const existingProductsData = readFileSync('./src/data/products.json', 'utf-8');
  const existingProducts: Product[] = JSON.parse(existingProductsData);
  
  // Read scraped products
  const scrapedData = readFileSync('./scripts/output/ontongdaejeon-products.json', 'utf-8');
  const scrapedProducts: ScrapedProduct[] = JSON.parse(scrapedData);
  
  console.log(`📊 Found ${scrapedProducts.length} scraped products`);
  console.log(`📊 Existing products in database: ${existingProducts.length}`);
  
  // Create a map of existing product IDs for quick lookup
  const existingIds = new Set(existingProducts.map(p => p.id));
  
  // Process scraped products
  let newProductsCount = 0;
  let updatedProductsCount = 0;
  let productsWithPrices = 0;
  let productsWithDiscounts = 0;
  
  const mallInfo = {
    mallId: 'ontongdaejeon',
    mallName: '대전사랑몰',
    mallUrl: 'https://ontongdaejeon.ezwel.com',
    region: '대전광역시'
  };
  
  scrapedProducts.forEach(scraped => {
    const category = categoryMapping[scraped.category] || '기타';
    const price = parsePrice(scraped.price);
    const originalPrice = scraped.originalPrice ? parsePrice(scraped.originalPrice) : undefined;
    
    if (price > 0) productsWithPrices++;
    if (originalPrice && originalPrice > price) productsWithDiscounts++;
    
    const product: Product = {
      id: scraped.id,
      name: scraped.title || `대전사랑몰 상품 ${scraped.id}`,
      price: price,
      originalPrice: originalPrice,
      image: scraped.imageUrl,
      category: category,
      region: scraped.region,
      url: scraped.productUrl,
      description: scraped.description || '',
      tags: scraped.tags,
      isFeatured: false, // Can be updated based on criteria
      isNew: !existingIds.has(scraped.id),
      mall: mallInfo
    };
    
    if (existingIds.has(scraped.id)) {
      // Update existing product
      const index = existingProducts.findIndex(p => p.id === scraped.id);
      if (index !== -1) {
        existingProducts[index] = product;
        updatedProductsCount++;
      }
    } else {
      // Add new product
      existingProducts.push(product);
      newProductsCount++;
    }
  });
  
  // Sort products by ID
  existingProducts.sort((a, b) => a.id.localeCompare(b.id));
  
  // Write updated products back to file
  writeFileSync('./src/data/products.json', JSON.stringify(existingProducts, null, 2));
  
  // Generate registration summary
  const summary = {
    timestamp: new Date().toISOString(),
    mall: mallInfo,
    products: {
      scraped: scrapedProducts.length,
      new: newProductsCount,
      existing: updatedProductsCount,
      total: existingProducts.length
    },
    categories: [...new Set(scrapedProducts.map(p => categoryMapping[p.category] || '기타'))],
    priceAnalysis: {
      withPrices: productsWithPrices,
      withoutPrices: scrapedProducts.length - productsWithPrices,
      withDiscounts: productsWithDiscounts,
      averagePrice: productsWithPrices > 0 
        ? Math.round(scrapedProducts.reduce((sum, p) => sum + parsePrice(p.price), 0) / productsWithPrices)
        : 0
    },
    sampleProducts: scrapedProducts.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      price: parsePrice(p.price),
      originalPrice: p.originalPrice ? parsePrice(p.originalPrice) : undefined,
      category: categoryMapping[p.category] || '기타'
    }))
  };
  
  writeFileSync('./scripts/output/ontongdaejeon-registration-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Registration Summary:');
  console.log(`✅ New products added: ${newProductsCount}`);
  console.log(`🔄 Existing products updated: ${updatedProductsCount}`);
  console.log(`📦 Total products in database: ${existingProducts.length}`);
  console.log(`💰 Products with prices: ${productsWithPrices}`);
  console.log(`🏷️ Products with discounts: ${productsWithDiscounts}`);
  console.log(`📂 Categories: ${summary.categories.join(', ')}`);
  
  if (productsWithPrices === 0) {
    console.log('\n⚠️ WARNING: No products have valid prices!');
  }
}

// Run registration
registerOntongDaejeonProducts();