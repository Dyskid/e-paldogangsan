import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  link: string;
  mall: {
    name: string;
    logo?: string;
  };
  tags?: string[];
}

async function verifyHaegaramRegistration() {
  try {
    console.log('Verifying Haegaram product registration...\n');
    
    // Read products data
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    const productsData = await fs.readFile(productsPath, 'utf-8');
    const allProducts: Product[] = JSON.parse(productsData);
    
    // Filter Haegaram products
    const haegaramProducts = allProducts.filter(p => p.id.startsWith('haegaram_'));
    
    console.log(`Total products in database: ${allProducts.length}`);
    console.log(`Haegaram products found: ${haegaramProducts.length}`);
    
    // Verification checks
    const verificationResults = {
      totalProducts: haegaramProducts.length,
      validProducts: 0,
      issues: {
        missingTitle: [] as string[],
        missingPrice: [] as string[],
        missingImage: [] as string[],
        missingLink: [] as string[],
        invalidPrice: [] as string[],
        duplicateIds: [] as string[]
      },
      categoryBreakdown: {} as { [key: string]: number },
      priceAnalysis: {
        min: Infinity,
        max: -Infinity,
        average: 0,
        priceRanges: {
          under10k: 0,
          '10k-30k': 0,
          '30k-50k': 0,
          '50k-100k': 0,
          over100k: 0
        }
      },
      sampleProducts: [] as any[]
    };
    
    // Check for duplicate IDs
    const idCounts = new Map<string, number>();
    haegaramProducts.forEach(p => {
      idCounts.set(p.id, (idCounts.get(p.id) || 0) + 1);
    });
    
    idCounts.forEach((count, id) => {
      if (count > 1) {
        verificationResults.issues.duplicateIds.push(`${id} (${count} occurrences)`);
      }
    });
    
    // Verify each product
    let totalPrice = 0;
    haegaramProducts.forEach(product => {
      let isValid = true;
      
      // Check required fields
      if (!product.name || product.name.trim() === '') {
        verificationResults.issues.missingTitle.push(product.id);
        isValid = false;
      }
      
      if (!product.price || product.price === 0) {
        verificationResults.issues.missingPrice.push(product.id);
        isValid = false;
      } else if (product.price < 0 || product.price > 1000000) {
        verificationResults.issues.invalidPrice.push(`${product.id} (${product.price}원)`);
        isValid = false;
      }
      
      if (!product.image || product.image.trim() === '') {
        verificationResults.issues.missingImage.push(product.id);
        isValid = false;
      }
      
      if (!product.link || product.link.trim() === '') {
        verificationResults.issues.missingLink.push(product.id);
        isValid = false;
      }
      
      if (isValid) {
        verificationResults.validProducts++;
        
        // Category breakdown
        const category = product.category || '기타';
        verificationResults.categoryBreakdown[category] = 
          (verificationResults.categoryBreakdown[category] || 0) + 1;
        
        // Price analysis
        totalPrice += product.price;
        verificationResults.priceAnalysis.min = Math.min(verificationResults.priceAnalysis.min, product.price);
        verificationResults.priceAnalysis.max = Math.max(verificationResults.priceAnalysis.max, product.price);
        
        // Price ranges
        if (product.price < 10000) {
          verificationResults.priceAnalysis.priceRanges.under10k++;
        } else if (product.price < 30000) {
          verificationResults.priceAnalysis.priceRanges['10k-30k']++;
        } else if (product.price < 50000) {
          verificationResults.priceAnalysis.priceRanges['30k-50k']++;
        } else if (product.price < 100000) {
          verificationResults.priceAnalysis.priceRanges['50k-100k']++;
        } else {
          verificationResults.priceAnalysis.priceRanges.over100k++;
        }
      }
    });
    
    // Calculate average price
    if (verificationResults.validProducts > 0) {
      verificationResults.priceAnalysis.average = Math.round(totalPrice / verificationResults.validProducts);
    }
    
    // Get sample products
    verificationResults.sampleProducts = haegaramProducts
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        hasImage: !!p.image,
        hasLink: !!p.link
      }));
    
    // Save verification report
    const report = {
      timestamp: new Date().toISOString(),
      mall: '해가람',
      verificationResults,
      summary: {
        totalProducts: haegaramProducts.length,
        validProducts: verificationResults.validProducts,
        invalidProducts: haegaramProducts.length - verificationResults.validProducts,
        validationRate: `${((verificationResults.validProducts / haegaramProducts.length) * 100).toFixed(1)}%`
      }
    };
    
    await fs.writeFile(
      'scripts/output/haegaram-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Valid products: ${verificationResults.validProducts}/${haegaramProducts.length} (${report.summary.validationRate})`);
    
    console.log('\nCategory Breakdown:');
    Object.entries(verificationResults.categoryBreakdown).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} products`);
    });
    
    console.log('\nPrice Analysis:');
    console.log(`  - Min: ${verificationResults.priceAnalysis.min.toLocaleString()}원`);
    console.log(`  - Max: ${verificationResults.priceAnalysis.max.toLocaleString()}원`);
    console.log(`  - Average: ${verificationResults.priceAnalysis.average.toLocaleString()}원`);
    
    console.log('\nPrice Ranges:');
    console.log(`  - Under 10,000원: ${verificationResults.priceAnalysis.priceRanges.under10k}`);
    console.log(`  - 10,000-30,000원: ${verificationResults.priceAnalysis.priceRanges['10k-30k']}`);
    console.log(`  - 30,000-50,000원: ${verificationResults.priceAnalysis.priceRanges['30k-50k']}`);
    console.log(`  - 50,000-100,000원: ${verificationResults.priceAnalysis.priceRanges['50k-100k']}`);
    console.log(`  - Over 100,000원: ${verificationResults.priceAnalysis.priceRanges.over100k}`);
    
    // Report issues if any
    const hasIssues = Object.values(verificationResults.issues).some(arr => arr.length > 0);
    if (hasIssues) {
      console.log('\n⚠️  ISSUES FOUND:');
      
      if (verificationResults.issues.missingTitle.length > 0) {
        console.log(`\nMissing titles: ${verificationResults.issues.missingTitle.length}`);
        console.log(verificationResults.issues.missingTitle.slice(0, 5).join(', '));
      }
      
      if (verificationResults.issues.missingPrice.length > 0) {
        console.log(`\nMissing prices: ${verificationResults.issues.missingPrice.length}`);
        console.log(verificationResults.issues.missingPrice.slice(0, 5).join(', '));
      }
      
      if (verificationResults.issues.invalidPrice.length > 0) {
        console.log(`\nInvalid prices: ${verificationResults.issues.invalidPrice.length}`);
        console.log(verificationResults.issues.invalidPrice.slice(0, 5).join(', '));
      }
      
      if (verificationResults.issues.duplicateIds.length > 0) {
        console.log(`\nDuplicate IDs: ${verificationResults.issues.duplicateIds.length}`);
        console.log(verificationResults.issues.duplicateIds.join(', '));
      }
    } else {
      console.log('\n✅ All products passed verification!');
    }
    
    console.log('\nSample Products:');
    verificationResults.sampleProducts.forEach(p => {
      console.log(`  - ${p.id}: ${p.name} (${p.price.toLocaleString()}원)`);
    });
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Run verification
verifyHaegaramRegistration().catch(console.error);