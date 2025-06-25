/**
 * Register Yeongwol Mall Products to Database
 * Reads scraped products and adds them to the main products.json file
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  mall: string;
  mallId: string;
  category: string;
  description?: string;
  inStock?: boolean;
  lastUpdated: string;
  createdAt: string;
}

interface RegistrationResult {
  totalScrapedProducts: number;
  validProducts: number;
  duplicatesFound: number;
  newProductsAdded: number;
  errors: number;
  registrationSummary: {
    mallId: string;
    mallName: string;
    categories: string[];
    priceRange: {
      min: number;
      max: number;
      average: number;
    };
  };
}

async function registerYeongwolProducts(): Promise<void> {
  console.log('📝 Starting Yeongwol Mall product registration...');
  
  const result: RegistrationResult = {
    totalScrapedProducts: 0,
    validProducts: 0,
    duplicatesFound: 0,
    newProductsAdded: 0,
    errors: 0,
    registrationSummary: {
      mallId: 'mall_23',
      mallName: '영월몰',
      categories: [],
      priceRange: { min: 0, max: 0, average: 0 }
    }
  };

  try {
    // Read scraped products
    const scrapedProductsPath = path.join(__dirname, 'output', 'yeongwol-products.json');
    const scrapedProductsData = await fs.readFile(scrapedProductsPath, 'utf-8');
    const scrapedProducts: Product[] = JSON.parse(scrapedProductsData);
    
    console.log(`📦 Found ${scrapedProducts.length} scraped products`);
    result.totalScrapedProducts = scrapedProducts.length;

    if (scrapedProducts.length === 0) {
      throw new Error('No scraped products found');
    }

    // Read existing products database
    const productsDbPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    let existingProducts: Product[] = [];
    
    try {
      const existingProductsData = await fs.readFile(productsDbPath, 'utf-8');
      existingProducts = JSON.parse(existingProductsData);
      console.log(`🗄️ Found ${existingProducts.length} existing products in database`);
    } catch (error) {
      console.log('📄 No existing products file found, will create new one');
      existingProducts = [];
    }

    // Create backup of existing products
    const backupPath = path.join(__dirname, 'output', `products-backup-${Date.now()}.json`);
    if (existingProducts.length > 0) {
      await fs.writeFile(backupPath, JSON.stringify(existingProducts, null, 2));
      console.log(`💾 Backup created: ${backupPath}`);
    }

    // Filter and validate scraped products
    const validProducts = scrapedProducts.filter(product => {
      // Check if product has essential data
      if (!product.name || product.name.length < 3) {
        result.errors++;
        return false;
      }
      
      if (!product.price || product.price <= 0) {
        result.errors++;
        return false;
      }

      // Check for duplicates by name and mall
      const isDuplicate = existingProducts.some(existing => 
        existing.name && existing.name.toLowerCase() === product.name.toLowerCase() && 
        existing.mallId === product.mallId
      );
      
      if (isDuplicate) {
        result.duplicatesFound++;
        return false;
      }

      return true;
    });

    result.validProducts = validProducts.length;
    console.log(`✅ ${validProducts.length} valid products after filtering`);
    console.log(`🔄 ${result.duplicatesFound} duplicates found and skipped`);
    console.log(`❌ ${result.errors} products with invalid data skipped`);

    // Add valid products to database
    const updatedProducts = [...existingProducts, ...validProducts];
    
    // Save updated products database
    await fs.writeFile(productsDbPath, JSON.stringify(updatedProducts, null, 2));
    result.newProductsAdded = validProducts.length;

    // Calculate summary statistics
    if (validProducts.length > 0) {
      result.registrationSummary.categories = [...new Set(validProducts.map(p => p.category))];
      const prices = validProducts.map(p => p.price);
      result.registrationSummary.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      };
    }

    // Save registration summary
    const outputDir = path.join(__dirname, 'output');
    const summaryFile = path.join(outputDir, 'yeongwol-registration-summary.json');
    
    const registrationSummary = {
      ...result,
      registeredAt: new Date().toISOString(),
      sampleProducts: validProducts.slice(0, 10).map(p => ({
        name: p.name,
        price: p.price,
        category: p.category
      }))
    };

    await fs.writeFile(summaryFile, JSON.stringify(registrationSummary, null, 2));

    console.log('\n🎉 Yeongwol Mall product registration completed!');
    console.log(`📊 Registration Summary:`);
    console.log(`   Total scraped products: ${result.totalScrapedProducts}`);
    console.log(`   Valid products: ${result.validProducts}`);
    console.log(`   Duplicates skipped: ${result.duplicatesFound}`);
    console.log(`   Errors/Invalid: ${result.errors}`);
    console.log(`   New products added: ${result.newProductsAdded}`);
    console.log(`   Total products in database: ${updatedProducts.length}`);

    if (validProducts.length > 0) {
      console.log(`\n📂 Categories: ${result.registrationSummary.categories.join(', ')}`);
      console.log(`💰 Price range: ${result.registrationSummary.priceRange.min.toLocaleString()}원 - ${result.registrationSummary.priceRange.max.toLocaleString()}원`);
      console.log(`📊 Average price: ${result.registrationSummary.priceRange.average.toLocaleString()}원`);
      
      console.log(`\n🛍️ Sample registered products:`);
      validProducts.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price.toLocaleString()}원`);
      });
    }

    console.log(`\n📁 Files updated:`);
    console.log(`   Products database: ${productsDbPath}`);
    console.log(`   Registration summary: ${summaryFile}`);
    if (existingProducts.length > 0) {
      console.log(`   Backup: ${backupPath}`);
    }

  } catch (error) {
    console.error('❌ Error during product registration:', error);
    result.errors++;
    
    // Save error summary
    const errorSummary = {
      error: error.message,
      registrationResults: result,
      timestamp: new Date().toISOString()
    };
    
    const errorFile = path.join(__dirname, 'output', 'yeongwol-registration-error.json');
    await fs.writeFile(errorFile, JSON.stringify(errorSummary, null, 2));
  }
}

// Run the registration
if (require.main === module) {
  registerYeongwolProducts().catch(console.error);
}

export { registerYeongwolProducts };