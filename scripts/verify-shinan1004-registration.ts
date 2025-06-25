import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  mall: string;
  url: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  isAvailable: boolean;
}

async function verifyShinan1004Registration() {
  try {
    console.log('🔍 Starting Shinan 1004 Mall registration verification...');

    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
    const summaryPath = path.join(outputDir, 'shinan1004-registration-summary.json');

    if (!fs.existsSync(productsPath)) {
      throw new Error(`Products file not found: ${productsPath}`);
    }

    if (!fs.existsSync(summaryPath)) {
      throw new Error(`Registration summary not found: ${summaryPath}`);
    }

    const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    console.log(`📊 Total products in database: ${products.length}`);
    console.log(`📋 Registration summary: ${summary.new} new products added`);

    const shinan1004Products = products.filter(p => p.mall === '신안1004몰');
    console.log(`🏪 Total Shinan 1004 Mall products: ${shinan1004Products.length}`);

    let validProducts = 0;
    let invalidProducts = 0;
    const issues: string[] = [];

    for (const product of shinan1004Products) {
      try {
        if (!product.id || !product.title || !product.price || !product.url || !product.mall) {
          issues.push(`Missing required fields: ${product.title || 'Unknown'}`);
          invalidProducts++;
          continue;
        }

        if (product.price <= 0) {
          issues.push(`Invalid price (${product.price}): ${product.title}`);
          invalidProducts++;
          continue;
        }

        if (!product.url.includes('shinan1004mall.kr')) {
          issues.push(`Invalid URL domain: ${product.title}`);
          invalidProducts++;
          continue;
        }

        // Check for suspiciously high prices (likely from our auto-correction)
        if (product.price > 100000) {
          console.log(`⚠️  High price detected (may need manual review): ${product.price.toLocaleString()}원 - ${product.title.substring(0, 50)}...`);
        }

        validProducts++;
      } catch (error) {
        issues.push(`Error validating product: ${product.title || 'Unknown'} - ${error}`);
        invalidProducts++;
      }
    }

    console.log(`✅ Valid products: ${validProducts}`);
    console.log(`❌ Invalid products: ${invalidProducts}`);

    if (issues.length > 0) {
      console.log(`⚠️  Issues found:`);
      issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more issues`);
      }
    }

    const categoryDistribution = shinan1004Products.reduce((acc, p) => {
      const category = p.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Category distribution:`);
    Object.entries(categoryDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} products`);
      });

    const priceRanges = {
      'Under 10,000': shinan1004Products.filter(p => p.price < 10000).length,
      '10,000-50,000': shinan1004Products.filter(p => p.price >= 10000 && p.price < 50000).length,
      '50,000-100,000': shinan1004Products.filter(p => p.price >= 50000 && p.price < 100000).length,
      'Over 100,000': shinan1004Products.filter(p => p.price >= 100000).length
    };

    console.log(`💰 Price ranges:`);
    Object.entries(priceRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} products`);
    });

    const sampleProducts = shinan1004Products.slice(0, 5);
    console.log(`📝 Sample products:`);
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title}`);
      console.log(`     Price: ${product.price.toLocaleString()}원`);
      console.log(`     Category: ${product.category}`);
      console.log(`     URL: ${product.url}`);
    });

    // Check for products that might need price review
    const highPriceProducts = shinan1004Products.filter(p => p.price > 100000);
    if (highPriceProducts.length > 0) {
      console.log(`\n🔍 Products with high prices (may need manual review):`);
      highPriceProducts.slice(0, 5).forEach(p => {
        console.log(`  - ${p.price.toLocaleString()}원: ${p.title.substring(0, 80)}...`);
      });
      if (highPriceProducts.length > 5) {
        console.log(`  ... and ${highPriceProducts.length - 5} more high-priced products`);
      }
    }

    const verificationReport = {
      timestamp: new Date().toISOString(),
      mall: '신안1004몰',
      totalProducts: shinan1004Products.length,
      validProducts,
      invalidProducts,
      issues: issues.slice(0, 20),
      categoryDistribution,
      priceRanges,
      highPriceProducts: highPriceProducts.length,
      sampleProducts: sampleProducts.map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.url
      })),
      registrationSummary: summary,
      notes: [
        'Price auto-correction was applied to fix truncated prices',
        'Products with prices over 100,000원 may need manual review',
        'All products are from Shinan (신안) region specializing in sea salt and seafood'
      ]
    };

    const reportPath = path.join(outputDir, 'shinan1004-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`📋 Verification report saved to ${path.basename(reportPath)}`);

    if (invalidProducts === 0) {
      console.log(`🎉 All ${validProducts} Shinan 1004 Mall products are valid!`);
    } else {
      console.log(`⚠️  Found ${invalidProducts} invalid products out of ${shinan1004Products.length} total`);
    }

    console.log(`🔍 Verification completed successfully!`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyShinan1004Registration();