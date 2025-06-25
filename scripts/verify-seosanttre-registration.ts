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

async function verifySeosanttreRegistration() {
  try {
    console.log('Loading products database...');
    const products: Product[] = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf-8'));
    
    // Filter 서산뜨레 products
    const seosanttreProducts = products.filter(p => p.mall === '서산뜨레');
    
    console.log(`\n=== 서산뜨레 VERIFICATION REPORT ===`);
    console.log(`Total products in database: ${products.length}`);
    console.log(`서산뜨레 products: ${seosanttreProducts.length}`);
    
    // Verify data quality
    let validProducts = 0;
    let issuesFound = 0;
    const issues: string[] = [];
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    
    seosanttreProducts.forEach((product, index) => {
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
      
      if (!product.region || product.region !== '충청남도 서산시') {
        issues.push(`${product.id}: Invalid region`);
        hasIssues = true;
      }
      
      if (!product.url || !product.url.includes('seosanttre.com')) {
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
    console.log(`Data quality: ${((validProducts / seosanttreProducts.length) * 100).toFixed(1)}%`);
    
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
    seosanttreProducts.slice(0, 5).forEach(product => {
      console.log(`- ${product.title}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Category: ${product.category}${product.subcategory ? ` > ${product.subcategory}` : ''}`);
      console.log(`  Tags: ${product.tags.slice(0, 5).join(', ')}`);
      console.log(`  URL: ${product.url}`);
      console.log('');
    });
    
    // Check for high-value products (한우)
    console.log(`\n=== PRODUCT HIGHLIGHTS ===`);
    const hanwooProducts = seosanttreProducts.filter(p => 
      p.tags.includes('한우') || p.tags.includes('서산한우')
    );
    console.log(`서산한우 products: ${hanwooProducts.length}`);
    
    const premiumProducts = seosanttreProducts.filter(p => {
      const priceNum = parseInt(p.price.replace(/[^\d]/g, ''));
      return priceNum >= 100000;
    });
    console.log(`Premium products (≥100,000원): ${premiumProducts.length}`);
    
    // Save verification report
    const report = {
      timestamp: Date.now(),
      mall: '서산뜨레',
      totalProducts: seosanttreProducts.length,
      validProducts,
      issuesFound,
      dataQuality: ((validProducts / seosanttreProducts.length) * 100),
      categoryDistribution: Object.fromEntries(categories.entries()),
      topTags: Object.fromEntries(Array.from(tags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)),
      issues: issues.slice(0, 20),
      sampleProducts: seosanttreProducts.slice(0, 3),
      highlights: {
        hanwooProducts: hanwooProducts.length,
        premiumProducts: premiumProducts.length
      }
    };
    
    fs.writeFileSync('./scripts/output/seosanttre-verification-report.json', JSON.stringify(report, null, 2));
    
    console.log(`\nVerification report saved to seosanttre-verification-report.json`);
    
    return {
      success: issues.length === 0,
      totalProducts: seosanttreProducts.length,
      validProducts,
      issues
    };
    
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  }
}

verifySeosanttreRegistration().catch(console.error);