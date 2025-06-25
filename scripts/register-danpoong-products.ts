import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  description: string;
  category: string;
  subcategory?: string;
  mall: string;
  url: string;
  region: string;
  tags: string[];
}

interface RegistrationSummary {
  timestamp: string;
  mall: string;
  totalNewProducts: number;
  registeredProducts: number;
  skippedProducts: number;
  duplicateProducts: number;
  categoryBreakdown: { [key: string]: number };
  priceRanges: { [key: string]: number };
  sampleRegistered: Product[];
}

function main() {
  console.log('=== Registering 단풍미인 Products ===');

  // Read scraped products
  const scrapedProducts: Product[] = JSON.parse(
    fs.readFileSync('scripts/output/danpoong-products.json', 'utf8')
  );

  console.log(`Found ${scrapedProducts.length} scraped products to register`);

  // Read existing products
  let existingProducts: Product[] = [];
  try {
    existingProducts = JSON.parse(
      fs.readFileSync('src/data/products.json', 'utf8')
    );
    console.log(`Found ${existingProducts.length} existing products in database`);
  } catch (error) {
    console.log('No existing products file found, starting fresh');
  }

  // Filter out duplicates and products without prices
  const existingUrls = new Set(existingProducts.map(p => p.url));
  const newProducts = scrapedProducts.filter(product => {
    // Skip if already exists
    if (existingUrls.has(product.url)) {
      return false;
    }
    
    // Skip if no price
    if (!product.price || product.price === '0') {
      return false;
    }

    // Skip categories that look like actual products
    const lowerTitle = product.title.toLowerCase();
    if (lowerTitle.includes('category') || lowerTitle.includes('카테고리') || 
        lowerTitle.includes('분류') || lowerTitle.length < 3) {
      return false;
    }

    return true;
  });

  console.log(`After filtering: ${newProducts.length} new products to register`);

  // Add new products to existing ones
  const allProducts = [...existingProducts, ...newProducts];

  // Create registration summary
  const categoryBreakdown: { [key: string]: number } = {};
  const priceRanges = {
    'under_10k': 0,    // < 10,000원
    '10k_50k': 0,      // 10,000-50,000원
    '50k_100k': 0,     // 50,000-100,000원
    'over_100k': 0     // > 100,000원
  };

  newProducts.forEach(product => {
    // Count by category
    categoryBreakdown[product.category] = (categoryBreakdown[product.category] || 0) + 1;
    
    // Count by price range
    const price = parseInt(product.price);
    if (price < 10000) {
      priceRanges.under_10k++;
    } else if (price < 50000) {
      priceRanges['10k_50k']++;
    } else if (price < 100000) {
      priceRanges['50k_100k']++;
    } else {
      priceRanges.over_100k++;
    }
  });

  const summary: RegistrationSummary = {
    timestamp: new Date().toISOString(),
    mall: '단풍미인',
    totalNewProducts: scrapedProducts.length,
    registeredProducts: newProducts.length,
    skippedProducts: scrapedProducts.length - newProducts.length,
    duplicateProducts: scrapedProducts.filter(p => existingUrls.has(p.url)).length,
    categoryBreakdown,
    priceRanges,
    sampleRegistered: newProducts.slice(0, 5)
  };

  // Save updated products
  fs.writeFileSync(
    'src/data/products.json',
    JSON.stringify(allProducts, null, 2),
    'utf8'
  );

  // Save registration summary
  fs.writeFileSync(
    'scripts/output/danpoong-registration-summary.json',
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  // Display results
  console.log('\n=== REGISTRATION COMPLETE ===');
  console.log(`Total products in database: ${allProducts.length}`);
  console.log(`New products registered: ${newProducts.length}`);
  console.log(`Skipped products: ${summary.skippedProducts}`);
  console.log(`Duplicate products: ${summary.duplicateProducts}`);

  console.log('\nCategory breakdown:');
  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} products`);
  });

  console.log('\nPrice range distribution:');
  console.log(`  Under 10,000원: ${priceRanges.under_10k} products`);
  console.log(`  10,000-50,000원: ${priceRanges['10k_50k']} products`);
  console.log(`  50,000-100,000원: ${priceRanges['50k_100k']} products`);
  console.log(`  Over 100,000원: ${priceRanges.over_100k} products`);

  console.log('\nSample registered products:');
  newProducts.slice(0, 5).forEach((product, index) => {
    console.log(`${index + 1}. ${product.title} - ₩${product.price} (${product.category})`);
  });

  console.log(`\n✓ Registration summary saved to danpoong-registration-summary.json`);
}

if (require.main === module) {
  main();
}