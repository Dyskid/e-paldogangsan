import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  subcategory?: string;
  tags: string[];
  region: string;
  mall: string;
  inStock: boolean;
  url: string;
}

async function verifyEHongseongRegistration() {
  try {
    console.log('Loading products database...');
    const products: Product[] = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf-8'));
    
    // Filter e홍성장터 products
    const ehongseongProducts = products.filter(p => p.mall === 'e홍성장터');
    
    console.log(`\n=== e홍성장터 VERIFICATION REPORT ===`);
    console.log(`Total products in database: ${products.length}`);
    console.log(`e홍성장터 products: ${ehongseongProducts.length}`);
    
    // Verify data quality
    let validProducts = 0;
    let issuesFound = 0;
    const issues: string[] = [];
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    
    ehongseongProducts.forEach((product, index) => {
      let hasIssues = false;
      
      // Check required fields
      if (!product.title || product.title.length < 3) {
        issues.push(`${product.id}: Invalid or missing title`);
        hasIssues = true;
      }
      
      if (!product.price || !product.price.includes('원')) {
        issues.push(`${product.id}: Invalid price format`);
        hasIssues = true;
      }
      
      if (!product.category) {
        issues.push(`${product.id}: Missing category`);
        hasIssues = true;
      }
      
      if (!product.region || product.region !== '충청남도 홍성군') {
        issues.push(`${product.id}: Invalid region`);
        hasIssues = true;
      }
      
      if (!product.url || !product.url.includes('ehongseong.com')) {
        issues.push(`${product.id}: Invalid URL`);
        hasIssues = true;
      }
      
      // Check for category name as product (should not happen)
      const titleLower = product.title.toLowerCase();
      if (titleLower === product.category.toLowerCase() || 
          titleLower.includes('카테고리') || 
          titleLower.includes('분류') ||
          product.title.length < 3) {
        issues.push(`${product.id}: Product title appears to be a category name: "${product.title}"`);
        hasIssues = true;
      }
      
      if (!hasIssues) {
        validProducts++;
      } else {
        issuesFound++;
      }
      
      // Count categories and tags
      if (product.category) {
        categories.set(product.category, (categories.get(product.category) || 0) + 1);
      }
      
      product.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });
    
    console.log(`\n=== DATA QUALITY ===`);
    console.log(`Valid products: ${validProducts}`);
    console.log(`Products with issues: ${issuesFound}`);
    console.log(`Data quality: ${((validProducts / ehongseongProducts.length) * 100).toFixed(1)}%`);
    
    if (issues.length > 0) {
      console.log(`\n=== ISSUES FOUND ===`);
      issues.slice(0, 10).forEach(issue => console.log(`- ${issue}`));
      if (issues.length > 10) {
        console.log(`... and ${issues.length - 10} more issues`);
      }
    } else {
      console.log(`\n✅ No data quality issues found!`);
    }
    
    console.log(`\n=== CATEGORY DISTRIBUTION ===`);
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`${category}: ${count} products`);
      });
    
    console.log(`\n=== TOP TAGS ===`);
    Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([tag, count]) => {
        console.log(`${tag}: ${count} products`);
      });
    
    console.log(`\n=== SAMPLE PRODUCTS ===`);
    ehongseongProducts.slice(0, 5).forEach(product => {
      console.log(`- ${product.title}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Category: ${product.category}${product.subcategory ? ` > ${product.subcategory}` : ''}`);
      console.log(`  Tags: ${product.tags.slice(0, 5).join(', ')}`);
      console.log(`  URL: ${product.url}`);
      console.log('');
    });
    
    // Check for adult verification products that might have been skipped
    console.log(`\n=== ADULT VERIFICATION CHECK ===`);
    const adultProducts = ehongseongProducts.filter(p => 
      p.title.includes('홍주') || 
      p.title.includes('술') || 
      p.title.includes('주류') ||
      p.url.includes('branduid=10975366') ||
      p.url.includes('branduid=10955516') ||
      p.url.includes('branduid=10955517') ||
      p.url.includes('branduid=10955515') ||
      p.url.includes('branduid=10975365')
    );
    
    console.log(`Products that may require adult verification: ${adultProducts.length}`);
    adultProducts.slice(0, 3).forEach(product => {
      console.log(`- ${product.title} (${product.id})`);
    });
    
    // Save verification report
    const report = {
      timestamp: Date.now(),
      mall: 'e홍성장터',
      totalProducts: ehongseongProducts.length,
      validProducts,
      issuesFound,
      dataQuality: ((validProducts / ehongseongProducts.length) * 100),
      categoryDistribution: Object.fromEntries(categories.entries()),
      topTags: Object.fromEntries(Array.from(tags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)),
      issues: issues.slice(0, 20),
      sampleProducts: ehongseongProducts.slice(0, 3)
    };
    
    fs.writeFileSync('./scripts/output/ehongseong-verification-report.json', JSON.stringify(report, null, 2));
    
    console.log(`\nVerification report saved to ehongseong-verification-report.json`);
    
    return {
      success: issues.length === 0,
      totalProducts: ehongseongProducts.length,
      validProducts,
      issues
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

verifyEHongseongRegistration().catch(console.error);