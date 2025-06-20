import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

interface Product {
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

function registerOntongDaejeonProductsWithPrices() {
  console.log('📦 Starting Ontong Daejeon products with prices registration...');

  // Read the scraped products with prices
  const productsWithPricesPath = './scripts/output/ontongdaejeon-products-with-prices.json';
  if (!existsSync(productsWithPricesPath)) {
    console.error('❌ Products with prices file not found!');
    return;
  }

  const scrapedProducts: Product[] = JSON.parse(readFileSync(productsWithPricesPath, 'utf-8'));
  console.log(`📦 Found ${scrapedProducts.length} products with prices to register`);

  // Validate that all products have prices
  const productsWithValidPrices = scrapedProducts.filter(p => p.price && p.price !== '');
  console.log(`💰 ${productsWithValidPrices.length} products have valid prices`);

  if (productsWithValidPrices.length === 0) {
    console.error('❌ No products with valid prices found!');
    return;
  }

  // Read existing products database
  const productsPath = './src/data/products.json';
  let existingProducts: Product[] = [];
  
  if (existsSync(productsPath)) {
    existingProducts = JSON.parse(readFileSync(productsPath, 'utf-8'));
    console.log(`📂 Found ${existingProducts.length} existing products in database`);
  }

  // Create a map of existing product IDs for quick lookup
  const existingIds = new Set(existingProducts.map(p => p.id));

  // Filter out products that already exist and update them
  const newProducts = productsWithValidPrices.filter(p => !existingIds.has(p.id));
  const existingProductsToUpdate = productsWithValidPrices.filter(p => existingIds.has(p.id));

  console.log(`🆕 ${newProducts.length} new products to add`);
  console.log(`🔄 ${existingProductsToUpdate.length} existing products to update`);

  // Update existing products with new price information
  if (existingProductsToUpdate.length > 0) {
    existingProducts = existingProducts.map(existing => {
      const update = existingProductsToUpdate.find(u => u.id === existing.id);
      if (update) {
        // Update with new price and other information
        return {
          ...existing,
          price: update.price,
          originalPrice: update.originalPrice,
          title: update.title,
          imageUrl: update.imageUrl,
          category: update.category,
          tags: update.tags
        };
      }
      return existing;
    });
  }

  // Add new products
  const allProducts = [...existingProducts, ...newProducts];

  // Sort products by mall and title
  allProducts.sort((a, b) => {
    if (!a || !b) return 0;
    if (a.mallId !== b.mallId) {
      return (a.mallId || '').localeCompare(b.mallId || '');
    }
    return (a.title || '').localeCompare(b.title || '');
  });

  // Save updated products
  writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));

  // Create detailed analysis
  const priceAnalysis = {
    priceRanges: {
      under10k: productsWithValidPrices.filter(p => {
        const priceNum = parseInt(p.price.replace(/[^\d]/g, ''));
        return priceNum < 10000;
      }).length,
      between10k50k: productsWithValidPrices.filter(p => {
        const priceNum = parseInt(p.price.replace(/[^\d]/g, ''));
        return priceNum >= 10000 && priceNum < 50000;
      }).length,
      over50k: productsWithValidPrices.filter(p => {
        const priceNum = parseInt(p.price.replace(/[^\d]/g, ''));
        return priceNum >= 50000;
      }).length
    },
    avgPrice: Math.round(
      productsWithValidPrices.reduce((sum, p) => {
        const priceNum = parseInt(p.price.replace(/[^\d]/g, ''));
        return sum + priceNum;
      }, 0) / productsWithValidPrices.length
    ),
    categories: [...new Set(productsWithValidPrices.map(p => p.category))].map(cat => ({
      name: cat,
      count: productsWithValidPrices.filter(p => p.category === cat).length,
      avgPrice: Math.round(
        productsWithValidPrices
          .filter(p => p.category === cat)
          .reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) /
        productsWithValidPrices.filter(p => p.category === cat).length
      )
    }))
  };

  // Create registration summary
  const summary = {
    timestamp: new Date().toISOString(),
    mall: 'ontongdaejeon',
    mallName: '온통대전몰 대전사랑몰',
    totalScrapedProducts: scrapedProducts.length,
    productsWithPrices: productsWithValidPrices.length,
    newProducts: newProducts.length,
    updatedProducts: existingProductsToUpdate.length,
    totalInDatabase: allProducts.length,
    priceAnalysis,
    sampleProducts: productsWithValidPrices.slice(0, 10).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      priceNum: parseInt(p.price.replace(/[^\d]/g, ''))
    })).sort((a, b) => a.priceNum - b.priceNum)
  };

  writeFileSync('./scripts/output/ontongdaejeon-with-prices-registration-summary.json', JSON.stringify(summary, null, 2));

  console.log('\n✅ Registration completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total scraped products: ${summary.totalScrapedProducts}`);
  console.log(`   - Products with valid prices: ${summary.productsWithPrices}`);
  console.log(`   - New products added: ${summary.newProducts}`);
  console.log(`   - Products updated: ${summary.updatedProducts}`);
  console.log(`   - Total in database: ${summary.totalInDatabase}`);
  console.log(`   - Average price: ${summary.priceAnalysis.avgPrice.toLocaleString()}원`);
  
  console.log('\n💰 Price Distribution:');
  console.log(`   - Under 10,000원: ${summary.priceAnalysis.priceRanges.under10k} products`);
  console.log(`   - 10,000-50,000원: ${summary.priceAnalysis.priceRanges.between10k50k} products`);
  console.log(`   - Over 50,000원: ${summary.priceAnalysis.priceRanges.over50k} products`);
  
  console.log('\n📂 Categories:');
  summary.priceAnalysis.categories.forEach(cat => {
    console.log(`   - ${cat.name}: ${cat.count} products (avg: ${cat.avgPrice.toLocaleString()}원)`);
  });
  
  if (summary.sampleProducts.length > 0) {
    console.log('\n📦 Sample products (sorted by price):');
    summary.sampleProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - ${p.price}`);
    });
  }
}

// Run the registration
registerOntongDaejeonProductsWithPrices();