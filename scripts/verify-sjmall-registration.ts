import fs from 'fs';
import path from 'path';
import { Product } from '../src/types';

async function verifySjmallRegistration() {
  const timestamp = Date.now();
  console.log('Starting 상주몰 registration verification...');

  try {
    // Load products from main database
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

    // Filter 상주몰 products
    const sjmallProducts = products.filter(p => p.mallId === 'sjmall');
    
    console.log(`\n=== VERIFICATION RESULTS ===`);
    console.log(`Total 상주몰 products in database: ${sjmallProducts.length}`);

    if (sjmallProducts.length === 0) {
      console.log('❌ No 상주몰 products found in database!');
      return;
    }

    // Analyze the registered products
    const categoryBreakdown = sjmallProducts.reduce((acc, product) => {
      const category = product.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for products with missing data
    const productsWithoutTitles = sjmallProducts.filter(p => !p.title || p.title.trim() === '');
    const productsWithoutImages = sjmallProducts.filter(p => !p.imageUrl && !p.image);
    const productsWithoutPrices = sjmallProducts.filter(p => !p.price || p.price === 0);
    const productsWithoutUrls = sjmallProducts.filter(p => !p.url);

    console.log(`\n=== DATA QUALITY ANALYSIS ===`);
    console.log(`Products without titles: ${productsWithoutTitles.length}`);
    console.log(`Products without images: ${productsWithoutImages.length}`);
    console.log(`Products without prices: ${productsWithoutPrices.length}`);
    console.log(`Products without URLs: ${productsWithoutUrls.length}`);

    console.log(`\n=== CATEGORY BREAKDOWN ===`);
    Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} products`);
      });

    // Check for duplicate products (same URL)
    const urlCounts = sjmallProducts.reduce((acc, product) => {
      acc[product.url] = (acc[product.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicateUrls = Object.entries(urlCounts).filter(([, count]) => count > 1);
    console.log(`\n=== DUPLICATE CHECK ===`);
    console.log(`Duplicate URLs found: ${duplicateUrls.length}`);

    if (duplicateUrls.length > 0) {
      console.log('Duplicate URLs:');
      duplicateUrls.forEach(([url, count]) => {
        console.log(`  ${url} (${count} times)`);
      });
    }

    // Sample some products for manual review
    console.log(`\n=== SAMPLE PRODUCTS ===`);
    const sampleProducts = sjmallProducts.slice(0, 3);
    sampleProducts.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  Title: ${product.title}`);
      console.log(`  Category: ${product.category}`);
      console.log(`  Price: ${product.price ? (typeof product.price === 'string' ? product.price : product.price.toLocaleString() + '원') : 'N/A'}`);
      console.log(`  URL: ${product.url}`);
      console.log(`  Image: ${product.imageUrl || product.image ? 'Yes' : 'No'}`);
    });

    // Price range analysis - convert string prices to numbers
    const validPrices = sjmallProducts
      .filter(p => p.price)
      .map(p => {
        if (typeof p.price === 'string') {
          // Extract number from Korean price string like "7,000원"
          const match = p.price.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, '')) : 0;
        }
        return p.price as number;
      })
      .filter(price => price > 0);
    let minPrice, maxPrice, avgPrice;
    if (validPrices.length > 0) {
      minPrice = Math.min(...validPrices);
      maxPrice = Math.max(...validPrices);
      avgPrice = Math.round(validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length);

      console.log(`\n=== PRICE ANALYSIS ===`);
      console.log(`Products with valid prices: ${validPrices.length}`);
      console.log(`Price range: ${minPrice.toLocaleString()}원 ~ ${maxPrice.toLocaleString()}원`);
      console.log(`Average price: ${avgPrice.toLocaleString()}원`);
    }

    // Create verification report
    const verificationReport = {
      timestamp,
      mallId: 'sjmall',
      mallName: '상주몰',
      totalProducts: sjmallProducts.length,
      dataQuality: {
        withoutTitles: productsWithoutTitles.length,
        withoutImages: productsWithoutImages.length,
        withoutPrices: productsWithoutPrices.length,
        withoutUrls: productsWithoutUrls.length
      },
      categoryBreakdown,
      duplicates: duplicateUrls.length,
      priceAnalysis: validPrices.length > 0 ? {
        productsWithPrices: validPrices.length,
        minPrice,
        maxPrice,
        avgPrice
      } : null,
      sampleProducts: sampleProducts.map(p => ({
        title: p.title,
        category: p.category,
        price: p.price,
        hasImage: !!(p.imageUrl || p.image)
      })),
      status: 'completed',
      issues: [
        ...(productsWithoutTitles.length > 0 ? [`${productsWithoutTitles.length} products without titles`] : []),
        ...(productsWithoutImages.length > 0 ? [`${productsWithoutImages.length} products without images`] : []),
        ...(productsWithoutPrices.length > 0 ? [`${productsWithoutPrices.length} products without prices`] : []),
        ...(duplicateUrls.length > 0 ? [`${duplicateUrls.length} duplicate URLs`] : [])
      ]
    };

    // Save verification report
    const outputPath = path.join(process.cwd(), 'scripts/output/sjmall-verification-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(verificationReport, null, 2));

    console.log(`\n=== VERIFICATION COMPLETE ===`);
    console.log(`✅ Registration verification completed successfully`);
    console.log(`📄 Report saved: ${outputPath}`);

    if (verificationReport.issues.length === 0) {
      console.log(`🎉 No data quality issues found!`);
    } else {
      console.log(`⚠️  Issues found: ${verificationReport.issues.length}`);
      verificationReport.issues.forEach(issue => console.log(`   - ${issue}`));
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the verification
verifySjmallRegistration().catch(console.error);