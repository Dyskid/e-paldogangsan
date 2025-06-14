import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  categoryId?: string;
  isAvailable: boolean;
  brand?: string;
  description?: string;
  mallName: string;
  mallUrl: string;
  scrapedAt: string;
}

// Category mapping based on product titles and mall types
function determineCategory(product: ScrapedProduct): string {
  const title = product.title.toLowerCase();
  
  // Food categories
  if (title.includes('김치') || title.includes('농산') || title.includes('과일') || 
      title.includes('채소') || title.includes('쌀') || title.includes('곡물')) {
    return 'food';
  }
  
  // Beauty/cosmetics
  if (title.includes('화장품') || title.includes('크림') || title.includes('로션') || 
      title.includes('에센스') || title.includes('마스크')) {
    return 'beauty';
  }
  
  // Health products
  if (title.includes('건강') || title.includes('홍삼') || title.includes('비타민') || 
      title.includes('영양제')) {
    return 'health';
  }
  
  // Crafts
  if (title.includes('공예') || title.includes('도자기') || title.includes('수공예')) {
    return 'crafts';
  }
  
  // Default
  return 'etc';
}

// Extract tags from product data
function extractTags(product: ScrapedProduct): string[] {
  const tags = new Set<string>();
  
  // Add mall name as tag
  tags.add(product.mallName);
  
  // Add region-based tags
  if (product.mallName.includes('지평선')) tags.add('전라북도');
  
  // Extract from title
  const keywords = ['유기농', '프리미엄', '선물세트', '특산품', '지역특산', '수제', '전통'];
  keywords.forEach(keyword => {
    if (product.title.includes(keyword)) {
      tags.add(keyword);
    }
  });
  
  return Array.from(tags);
}

async function registerRetryProducts() {
  console.log('Starting retry product registration...');
  
  // Load scraped products
  const retryDir = path.join(__dirname, 'output', 'retry-scrape');
  const summaryPath = path.join(retryDir, 'retry-scrape-summary.json');
  
  if (!fs.existsSync(summaryPath)) {
    console.error('Retry scrape summary not found. Please run retry scraper first.');
    return;
  }
  
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  console.log(`Found ${summary.totalProducts} products from ${summary.successful} malls`);
  
  // Load existing products
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  let existingProducts: Product[] = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    console.log(`Loaded ${existingProducts.length} existing products`);
  }
  
  // Process each mall's products
  const newProducts: Product[] = [];
  const processedMalls: string[] = [];
  
  for (const result of summary.results) {
    if (result.status === 'success' && result.productCount > 0) {
      console.log(`\nProcessing ${result.mall} (${result.productCount} products)`);
      processedMalls.push(result.mall);
      
      const mallProducts: ScrapedProduct[] = result.products;
      
      // Convert to Product format
      mallProducts.forEach((scrapedProduct, index) => {
        const product: Product = {
          id: scrapedProduct.id,
          name: scrapedProduct.title,
          description: scrapedProduct.description,
          price: scrapedProduct.price.toString(),
          originalPrice: scrapedProduct.originalPrice?.toString(),
          imageUrl: scrapedProduct.imageUrl,
          productUrl: scrapedProduct.url,
          mallId: scrapedProduct.id.split('_')[0], // Extract mall ID from product ID
          mallName: scrapedProduct.mallName,
          category: determineCategory(scrapedProduct),
          tags: extractTags(scrapedProduct),
          inStock: scrapedProduct.isAvailable,
          lastUpdated: scrapedProduct.scrapedAt,
          createdAt: scrapedProduct.scrapedAt
        };
        
        newProducts.push(product);
      });
    }
  }
  
  console.log(`\nConverted ${newProducts.length} products to website format`);
  
  // Remove any existing products from the processed malls
  const beforeCount = existingProducts.length;
  existingProducts = existingProducts.filter(p => !processedMalls.includes(p.mallName));
  const removedCount = beforeCount - existingProducts.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} existing products from updated malls`);
  }
  
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
  console.log(`Saved ${allProducts.length} total products`);
  
  // Create registration summary
  const registrationSummary = {
    registrationDate: new Date().toISOString(),
    mallsProcessed: processedMalls,
    totalProductsRegistered: newProducts.length,
    totalProductsInDatabase: allProducts.length,
    categoriesBreakdown: newProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    mallBreakdown: processedMalls.map(mall => ({
      mall,
      count: newProducts.filter(p => p.mallName === mall).length
    })),
    failedMalls: summary.results.filter((r: any) => r.status === 'failed').map((r: any) => ({
      mall: r.mall,
      error: r.error
    }))
  };
  
  fs.writeFileSync(
    path.join(retryDir, 'retry-registration-summary.json'),
    JSON.stringify(registrationSummary, null, 2)
  );
  
  console.log('\n=== Registration Complete ===');
  console.log(`Successfully registered ${newProducts.length} products from ${processedMalls.length} malls`);
  console.log('\nMall breakdown:');
  registrationSummary.mallBreakdown.forEach(({ mall, count }) => {
    console.log(`  ${mall}: ${count} products`);
  });
  
  console.log('\nFailed malls (need manual intervention):');
  registrationSummary.failedMalls.forEach(({ mall, error }) => {
    console.log(`  ${mall}: ${error}`);
  });
  
  return registrationSummary;
}

// Run the registration
if (require.main === module) {
  registerRetryProducts().catch(console.error);
}

export { registerRetryProducts };