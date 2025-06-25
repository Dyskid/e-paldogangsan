import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

function verifyRegistration() {
  try {
    // Read products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    const products: Product[] = JSON.parse(readFileSync(productsPath, 'utf-8'));
    
    // Filter 담양장터 products
    const damyangProducts = products.filter(p => p.mall && p.mall.mallName === '담양장터');
    
    console.log(`Found ${damyangProducts.length} products from 담양장터`);
    
    // Verification checks
    const issues: string[] = [];
    
    // Check for invalid prices
    const invalidPrices = damyangProducts.filter(p => !p.price || p.price <= 0);
    if (invalidPrices.length > 0) {
      issues.push(`${invalidPrices.length} products with invalid prices`);
      console.log('\nProducts with invalid prices:');
      invalidPrices.forEach(p => console.log(`- ${p.name}: ${p.price}`));
    }
    
    // Check for missing images
    const missingImages = damyangProducts.filter(p => !p.image);
    if (missingImages.length > 0) {
      issues.push(`${missingImages.length} products with missing images`);
    }
    
    // Check for missing URLs
    const missingUrls = damyangProducts.filter(p => !p.url);
    if (missingUrls.length > 0) {
      issues.push(`${missingUrls.length} products with missing URLs`);
    }
    
    // Check for duplicate URLs
    const urlCounts = damyangProducts.reduce((acc, p) => {
      acc[p.url] = (acc[p.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicateUrls = Object.entries(urlCounts).filter(([url, count]) => count > 1);
    if (duplicateUrls.length > 0) {
      issues.push(`${duplicateUrls.length} duplicate URLs found`);
      console.log('\nDuplicate URLs:');
      duplicateUrls.forEach(([url, count]) => console.log(`- ${url}: ${count} times`));
    }
    
    // Check for products that might be categories
    const suspiciousProducts = damyangProducts.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes('전체') || name.includes('카테고리') || 
             name.includes('메뉴') || name.includes('category') ||
             name.length < 3 || p.price > 10000000;
    });
    
    if (suspiciousProducts.length > 0) {
      issues.push(`${suspiciousProducts.length} suspicious products that might be categories`);
      console.log('\nSuspicious products:');
      suspiciousProducts.forEach(p => console.log(`- ${p.name}: ${p.price}원`));
    }
    
    // Category distribution
    const categoryDistribution = damyangProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nCategory distribution:');
    Object.entries(categoryDistribution).forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count} products`);
    });
    
    // Price range analysis
    const prices = damyangProducts.map(p => p.price).filter(p => p > 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    console.log('\nPrice analysis:');
    console.log(`- Min price: ${minPrice.toLocaleString()}원`);
    console.log(`- Max price: ${maxPrice.toLocaleString()}원`);
    console.log(`- Average price: ${Math.round(avgPrice).toLocaleString()}원`);
    
    // Sample products
    console.log('\nSample products (first 10):');
    damyangProducts.slice(0, 10).forEach(p => {
      console.log(`- ${p.name}: ${p.price.toLocaleString()}원`);
    });
    
    // Summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '담양장터',
      totalProducts: damyangProducts.length,
      issues: issues,
      categoryDistribution: categoryDistribution,
      priceAnalysis: {
        min: minPrice,
        max: maxPrice,
        average: Math.round(avgPrice)
      },
      verificationPassed: issues.length === 0
    };
    
    writeFileSync('./scripts/output/damyang-verification-report.json', JSON.stringify(summary, null, 2));
    
    if (issues.length === 0) {
      console.log('\n✅ All verification checks passed!');
    } else {
      console.log('\n⚠️ Verification issues found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    }
    
    return summary;
    
  } catch (error) {
    console.error('Error during verification:', error);
    return null;
  }
}

// Run verification
const result = verifyRegistration();
if (result) {
  console.log('\nVerification completed. Report saved to damyang-verification-report.json');
}