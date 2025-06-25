import { readFileSync, writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  price: string | number;
  image: string;
  url: string;
  category: string;
  tags: string[];
  mall: string;
}

function parsePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const cleaned = price.toString().replace(/[^\d,]/g, '');
  return parseInt(cleaned.replace(/,/g, '')) || 0;
}

async function verifyJindoArirangRegistration() {
  try {
    console.log('Verifying 진도아리랑몰 product registration...');
    
    // Read current products
    const allProducts: Product[] = JSON.parse(
      readFileSync('./src/data/products.json', 'utf-8')
    );
    
    // Filter 진도아리랑몰 products
    const jindoProducts = allProducts.filter(p => 
      p.mall === '진도아리랑몰' || 
      (p.title && p.title.includes('진도아리랑몰')) ||
      (p.url && p.url.includes('jindoarirangmall.com'))
    );
    
    console.log(`Found ${jindoProducts.length} 진도아리랑몰 products in database`);
    
    // Validation checks
    const issues: string[] = [];
    let validProducts = 0;
    let invalidProducts = 0;
    
    // Category distribution
    const categoryCount: Record<string, number> = {};
    
    // Price analysis
    const priceRanges = {
      'Under 10,000': 0,
      '10,000-50,000': 0,
      'Over 50,000': 0
    };
    
    jindoProducts.forEach((product, index) => {
      let isValid = true;
      
      // Check required fields
      if (!product.title || product.title.length < 3) {
        issues.push(`Product ${index}: Missing or invalid title`);
        isValid = false;
      }
      
      if (!product.price) {
        issues.push(`Product ${index}: Missing price`);
        isValid = false;
      }
      
      if (!product.url || !product.url.startsWith('http')) {
        issues.push(`Product ${index}: Invalid URL`);
        isValid = false;
      }
      
      // Check price validity
      const priceValue = parsePrice(product.price);
      if (priceValue <= 0 || priceValue > 10000000) {
        issues.push(`Product ${index}: Invalid price ${product.price}`);
        isValid = false;
      }
      
      // Price range analysis
      if (priceValue < 10000) {
        priceRanges['Under 10,000']++;
      } else if (priceValue <= 50000) {
        priceRanges['10,000-50,000']++;
      } else {
        priceRanges['Over 50,000']++;
      }
      
      // Category distribution
      const category = product.category || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      // Check for non-product items
      const title = product.title.toLowerCase();
      const nonProductTerms = [
        '공지사항', '문의하기', '고객센터', '이벤트', 
        '자주하는질문', '카테고리', 'icon', '더보기',
        '농산물', '수산물', '축산물', '전통주'
      ];
      
      if (nonProductTerms.some(term => title.includes(term))) {
        issues.push(`Product ${index}: Appears to be a category/navigation item: ${product.title}`);
        isValid = false;
      }
      
      if (isValid) {
        validProducts++;
      } else {
        invalidProducts++;
      }
    });
    
    // Sample products for inspection
    const sampleProducts = jindoProducts.slice(0, 5).map(p => ({
      title: p.title,
      price: parsePrice(p.price),
      category: p.category,
      url: p.url
    }));
    
    // Create verification report
    const report = {
      timestamp: new Date().toISOString(),
      mall: '진도아리랑몰',
      totalProducts: jindoProducts.length,
      validProducts,
      invalidProducts,
      issues,
      categoryDistribution: categoryCount,
      priceRanges,
      sampleProducts,
      registrationSummary: JSON.parse(
        readFileSync('./scripts/output/jindoarirang-registration-summary.json', 'utf-8')
      ),
      notes: [
        '진도는 울금, 구기자, 전복, 곱창김으로 유명한 지역',
        'Cafe24 플랫폼 사용',
        '진도홍주는 진도의 대표 전통주',
        '무항생제 한우와 해조류 특산품이 주요 상품'
      ]
    };
    
    writeFileSync('./scripts/output/jindoarirang-verification-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n=== Verification Results ===');
    console.log(`Mall: ${report.mall}`);
    console.log(`Total products: ${report.totalProducts}`);
    console.log(`Valid products: ${report.validProducts}`);
    console.log(`Invalid products: ${report.invalidProducts}`);
    console.log(`Issues found: ${report.issues.length}`);
    
    console.log('\nCategory Distribution:');
    Object.entries(report.categoryDistribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    console.log('\nPrice Ranges:');
    Object.entries(report.priceRanges).forEach(([range, count]) => {
      console.log(`  ${range}: ${count}`);
    });
    
    if (report.issues.length > 0) {
      console.log('\nIssues:');
      report.issues.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue}`);
      });
      if (report.issues.length > 10) {
        console.log(`  ... and ${report.issues.length - 10} more issues`);
      }
    }
    
    console.log('\nSample Products:');
    report.sampleProducts.forEach(p => {
      console.log(`  - ${p.title} (${p.price.toLocaleString()}원) [${p.category}]`);
    });
    
    return report;
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

verifyJindoArirangRegistration().then(report => {
  console.log('\nVerification completed successfully!');
  if (report.invalidProducts === 0) {
    console.log('✅ All products are valid!');
  } else {
    console.log(`⚠️  Found ${report.invalidProducts} invalid products`);
  }
}).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});