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

async function verifyNajuMallRegistration() {
  try {
    console.log('🔍 Starting Naju Mall registration verification...');

    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
    const summaryPath = path.join(outputDir, 'najumall-registration-summary.json');

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

    const najuMallProducts = products.filter(p => p.mall === '나주몰');
    console.log(`🏪 Total Naju Mall products: ${najuMallProducts.length}`);

    let validProducts = 0;
    let invalidProducts = 0;
    const issues: string[] = [];

    for (const product of najuMallProducts) {
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

        if (!product.url.includes('najumall.kr')) {
          issues.push(`Invalid URL domain: ${product.title}`);
          invalidProducts++;
          continue;
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

    const categoryDistribution = najuMallProducts.reduce((acc, p) => {
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
      'Under 10,000': najuMallProducts.filter(p => p.price < 10000).length,
      '10,000-50,000': najuMallProducts.filter(p => p.price >= 10000 && p.price < 50000).length,
      '50,000-100,000': najuMallProducts.filter(p => p.price >= 50000 && p.price < 100000).length,
      'Over 100,000': najuMallProducts.filter(p => p.price >= 100000).length
    };

    console.log(`💰 Price ranges:`);
    Object.entries(priceRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} products`);
    });

    const sampleProducts = najuMallProducts.slice(0, 5);
    console.log(`📝 Sample products:`);
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title}`);
      console.log(`     Price: ${product.price.toLocaleString()}원`);
      console.log(`     Category: ${product.category}`);
      console.log(`     URL: ${product.url}`);
    });

    const verificationReport = {
      timestamp: new Date().toISOString(),
      mall: '나주몰',
      totalProducts: najuMallProducts.length,
      validProducts,
      invalidProducts,
      issues: issues.slice(0, 20),
      categoryDistribution,
      priceRanges,
      sampleProducts: sampleProducts.map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        url: p.url
      })),
      registrationSummary: summary
    };

    const reportPath = path.join(outputDir, 'najumall-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`📋 Verification report saved to ${path.basename(reportPath)}`);

    if (invalidProducts === 0) {
      console.log(`🎉 All ${validProducts} Naju Mall products are valid!`);
    } else {
      console.log(`⚠️  Found ${invalidProducts} invalid products out of ${najuMallProducts.length} total`);
    }

    console.log(`🔍 Verification completed successfully!`);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyNajuMallRegistration();