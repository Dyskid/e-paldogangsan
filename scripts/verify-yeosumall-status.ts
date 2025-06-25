import fs from 'fs/promises';
import axios from 'axios';

async function verifyYeosumallStatus() {
  try {
    console.log('Verifying 여수몰 status and mock data...\n');
    
    // Check if site is accessible
    console.log('Testing site accessibility...');
    try {
      const response = await axios.get('http://www.yeosumall.co.kr/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });
      
      if (response.data.includes('서버 용량을 초과') || response.data.includes('서버용량')) {
        console.log('❌ Site still showing server capacity exceeded error');
      } else {
        console.log('✅ Site may be accessible now - recommend re-running scraper');
      }
    } catch (error) {
      console.log(`❌ Site access failed: ${error.message}`);
    }
    
    // Verify mock data structure
    console.log('\nVerifying mock data structure...');
    
    const mockProducts = JSON.parse(
      await fs.readFile('scripts/output/yeosumall-mock-products.json', 'utf-8')
    );
    
    const verificationResults = {
      totalMockProducts: mockProducts.length,
      validProducts: 0,
      issues: {
        missingTitle: [] as string[],
        missingPrice: [] as string[],
        missingImage: [] as string[],
        missingLink: [] as string[]
      },
      sampleProducts: [] as any[]
    };
    
    // Verify each mock product
    mockProducts.forEach((product: any) => {
      let isValid = true;
      
      if (!product.title || product.title.trim() === '') {
        verificationResults.issues.missingTitle.push(product.id);
        isValid = false;
      }
      
      if (!product.price || product.price === 0) {
        verificationResults.issues.missingPrice.push(product.id);
        isValid = false;
      }
      
      if (!product.imageUrl || product.imageUrl.trim() === '') {
        verificationResults.issues.missingImage.push(product.id);
        isValid = false;
      }
      
      if (!product.productUrl || product.productUrl.trim() === '') {
        verificationResults.issues.missingLink.push(product.id);
        isValid = false;
      }
      
      if (isValid) {
        verificationResults.validProducts++;
      }
    });
    
    // Get sample products
    verificationResults.sampleProducts = mockProducts.slice(0, 5).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      note: p.note
    }));
    
    // Save verification report
    const report = {
      timestamp: new Date().toISOString(),
      mall: '여수몰',
      siteStatus: 'Unavailable - Server capacity exceeded',
      verificationResults,
      summary: {
        totalMockProducts: mockProducts.length,
        validMockProducts: verificationResults.validProducts,
        validationRate: `${((verificationResults.validProducts / mockProducts.length) * 100).toFixed(1)}%`,
        recommendation: 'Monitor site availability and re-scrape when accessible'
      }
    };
    
    await fs.writeFile(
      'scripts/output/yeosumall-verification-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(50));
    console.log(`Site Status: Unavailable (Server capacity exceeded)`);
    console.log(`Mock products: ${verificationResults.validProducts}/${mockProducts.length} valid (${report.summary.validationRate})`);
    
    // Report issues if any
    const hasIssues = Object.values(verificationResults.issues).some(arr => arr.length > 0);
    if (hasIssues) {
      console.log('\n⚠️  MOCK DATA ISSUES:');
      
      if (verificationResults.issues.missingTitle.length > 0) {
        console.log(`Missing titles: ${verificationResults.issues.missingTitle.length}`);
      }
      if (verificationResults.issues.missingPrice.length > 0) {
        console.log(`Missing prices: ${verificationResults.issues.missingPrice.length}`);
      }
    } else {
      console.log('\n✅ All mock products are structurally valid');
    }
    
    console.log('\nSample Mock Products:');
    verificationResults.sampleProducts.forEach(p => {
      console.log(`  - ${p.id}: ${p.title} (${p.price.toLocaleString()}원)`);
      console.log(`    Note: ${p.note}`);
    });
    
    console.log('\n📋 Next Steps:');
    console.log('1. Periodically check if yeosumall.co.kr becomes accessible');
    console.log('2. When site is available, run the actual scraper');
    console.log('3. Replace mock data with real product data');
    console.log('4. Register real products to the main database');
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

// Run verification
verifyYeosumallStatus().catch(console.error);