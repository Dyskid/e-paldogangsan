/**
 * Verify Yangyang Mall Product Registration
 * Checks if products were correctly added to the database
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

interface VerificationResult {
  totalProductsInDb: number;
  yangyangProductsFound: number;
  sampleProducts: Product[];
  categories: string[];
  priceStatistics: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  dataQualityChecks: {
    productsWithImages: number;
    productsWithValidPrices: number;
    productsWithDescriptions: number;
    productsInStock: number;
  };
  issues: string[];
}

async function verifyYangyangRegistration(): Promise<void> {
  console.log('🔍 Starting Yangyang Mall registration verification...');
  
  const result: VerificationResult = {
    totalProductsInDb: 0,
    yangyangProductsFound: 0,
    sampleProducts: [],
    categories: [],
    priceStatistics: { min: 0, max: 0, average: 0, median: 0 },
    dataQualityChecks: {
      productsWithImages: 0,
      productsWithValidPrices: 0,
      productsWithDescriptions: 0,
      productsInStock: 0
    },
    issues: []
  };

  try {
    // Read products database
    const productsDbPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const productsData = await fs.readFile(productsDbPath, 'utf-8');
    const allProducts: Product[] = JSON.parse(productsData);
    
    result.totalProductsInDb = allProducts.length;
    console.log(`📊 Total products in database: ${result.totalProductsInDb}`);

    // Filter Yangyang Mall products
    const yangyangProducts = allProducts.filter(product => 
      product.mallId === 'mall_22' || product.mall === '양양몰'
    );
    
    result.yangyangProductsFound = yangyangProducts.length;
    console.log(`🏪 Yangyang Mall products found: ${result.yangyangProductsFound}`);

    if (yangyangProducts.length === 0) {
      result.issues.push('No Yangyang Mall products found in database');
      throw new Error('No Yangyang Mall products found');
    }

    // Sample products for verification
    result.sampleProducts = yangyangProducts.slice(0, 10);

    // Category analysis
    result.categories = [...new Set(yangyangProducts.map(p => p.category))];
    console.log(`📂 Categories found: ${result.categories.join(', ')}`);

    // Price statistics
    const prices = yangyangProducts.map(p => p.price).filter(p => p > 0);
    if (prices.length > 0) {
      const sortedPrices = prices.sort((a, b) => a - b);
      result.priceStatistics = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        median: sortedPrices[Math.floor(sortedPrices.length / 2)]
      };
    }

    // Data quality checks
    result.dataQualityChecks = {
      productsWithImages: yangyangProducts.filter(p => p.image && p.image.length > 0).length,
      productsWithValidPrices: yangyangProducts.filter(p => p.price && p.price > 0).length,
      productsWithDescriptions: yangyangProducts.filter(p => p.description && p.description.length > 0).length,
      productsInStock: yangyangProducts.filter(p => p.inStock === true).length
    };

    // Check for potential issues
    const productsWithoutNames = yangyangProducts.filter(p => !p.name || p.name.length < 3);
    if (productsWithoutNames.length > 0) {
      result.issues.push(`${productsWithoutNames.length} products have invalid names`);
    }

    const productsWithoutPrices = yangyangProducts.filter(p => !p.price || p.price <= 0);
    if (productsWithoutPrices.length > 0) {
      result.issues.push(`${productsWithoutPrices.length} products have invalid prices`);
    }

    const productsWithoutLinks = yangyangProducts.filter(p => !p.link || !p.link.includes('yangyang-mall.com'));
    if (productsWithoutLinks.length > 0) {
      result.issues.push(`${productsWithoutLinks.length} products have invalid links`);
    }

    // Check for duplicate products
    const productNames = yangyangProducts.map(p => p.name.toLowerCase());
    const duplicateNames = productNames.filter((name, index) => productNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      result.issues.push(`${new Set(duplicateNames).size} potential duplicate product names found`);
    }

    // Save verification results
    const outputDir = path.join(__dirname, 'output');
    const verificationFile = path.join(outputDir, 'yangyang-verification-report.json');
    
    const verificationReport = {
      ...result,
      verifiedAt: new Date().toISOString(),
      status: result.issues.length === 0 ? 'SUCCESS' : 'WARNING'
    };

    await fs.writeFile(verificationFile, JSON.stringify(verificationReport, null, 2));

    // Display results
    console.log('\n✅ Yangyang Mall registration verification completed!');
    console.log(`📊 Verification Results:`);
    console.log(`   Total products in database: ${result.totalProductsInDb}`);
    console.log(`   Yangyang Mall products: ${result.yangyangProductsFound}`);
    console.log(`   Categories: ${result.categories.join(', ')}`);
    
    console.log(`\n💰 Price Statistics:`);
    console.log(`   Range: ${result.priceStatistics.min.toLocaleString()}원 - ${result.priceStatistics.max.toLocaleString()}원`);
    console.log(`   Average: ${result.priceStatistics.average.toLocaleString()}원`);
    console.log(`   Median: ${result.priceStatistics.median.toLocaleString()}원`);

    console.log(`\n🔍 Data Quality:`);
    console.log(`   Products with images: ${result.dataQualityChecks.productsWithImages}/${result.yangyangProductsFound} (${Math.round(result.dataQualityChecks.productsWithImages / result.yangyangProductsFound * 100)}%)`);
    console.log(`   Products with valid prices: ${result.dataQualityChecks.productsWithValidPrices}/${result.yangyangProductsFound} (${Math.round(result.dataQualityChecks.productsWithValidPrices / result.yangyangProductsFound * 100)}%)`);
    console.log(`   Products with descriptions: ${result.dataQualityChecks.productsWithDescriptions}/${result.yangyangProductsFound} (${Math.round(result.dataQualityChecks.productsWithDescriptions / result.yangyangProductsFound * 100)}%)`);
    console.log(`   Products in stock: ${result.dataQualityChecks.productsInStock}/${result.yangyangProductsFound} (${Math.round(result.dataQualityChecks.productsInStock / result.yangyangProductsFound * 100)}%)`);

    if (result.issues.length > 0) {
      console.log(`\n⚠️ Issues Found:`);
      result.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log(`\n🎉 No issues found! All products are properly registered.`);
    }

    console.log(`\n🛍️ Sample registered products:`);
    result.sampleProducts.slice(0, 5).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Price: ${product.price.toLocaleString()}원`);
      console.log(`      Category: ${product.category}`);
      console.log(`      Image: ${product.image ? 'Yes' : 'No'}`);
      console.log(`      Link: ${product.link.substring(0, 60)}...`);
      console.log('');
    });

    console.log(`📁 Verification report saved: ${verificationFile}`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
    result.issues.push(`Verification failed: ${error.message}`);
    
    const errorFile = path.join(__dirname, 'output', 'yangyang-verification-error.json');
    await fs.writeFile(errorFile, JSON.stringify({
      error: error.message,
      partialResults: result,
      timestamp: new Date().toISOString()
    }, null, 2));
  }
}

// Run the verification
if (require.main === module) {
  verifyYangyangRegistration().catch(console.error);
}

export { verifyYangyangRegistration };