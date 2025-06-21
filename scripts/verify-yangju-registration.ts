import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

class YangjuVerifier {
  async run() {
    console.log('🔍 Verifying Yangju product registration...');
    
    try {
      const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
      const productsData = fs.readFileSync(productsFile, 'utf-8');
      const allProducts: Product[] = JSON.parse(productsData);
      
      const yangjuProducts = allProducts.filter(p => p.mallId === 'yangju');
      
      console.log(`📊 Found ${yangjuProducts.length} Yangju products in database`);
      
      const vendors = [...new Set(yangjuProducts.map(p => p.vendor).filter(v => v))];
      const priceRange = {
        min: Math.min(...yangjuProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...yangjuProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      };
      
      const productTypes = this.categorizeProducts(yangjuProducts);
      
      const validationResults = {
        productsWithTitles: yangjuProducts.filter(p => p.title && p.title.length > 0).length,
        productsWithPrices: yangjuProducts.filter(p => p.price && this.parsePrice(p.price) > 0).length,
        productsWithImages: yangjuProducts.filter(p => p.imageUrl && p.imageUrl.length > 0).length,
        productsWithUrls: yangjuProducts.filter(p => p.productUrl && p.productUrl.length > 0).length,
        productsWithVendors: yangjuProducts.filter(p => p.vendor && p.vendor.length > 0).length
      };
      
      const report = {
        mallName: '양주농부마켓',
        mallUrl: 'https://market.yangju.go.kr',
        verificationDate: new Date().toISOString(),
        totalProducts: yangjuProducts.length,
        vendors: vendors,
        vendorCount: vendors.length,
        productTypes: productTypes,
        priceRange: priceRange,
        validationResults: validationResults,
        dataQualityScore: {
          titles: (validationResults.productsWithTitles / yangjuProducts.length * 100).toFixed(1) + '%',
          prices: (validationResults.productsWithPrices / yangjuProducts.length * 100).toFixed(1) + '%',
          images: (validationResults.productsWithImages / yangjuProducts.length * 100).toFixed(1) + '%',
          urls: (validationResults.productsWithUrls / yangjuProducts.length * 100).toFixed(1) + '%',
          vendors: (validationResults.productsWithVendors / yangjuProducts.length * 100).toFixed(1) + '%'
        },
        sampleProducts: yangjuProducts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          vendor: p.vendor,
          imageUrl: p.imageUrl ? 'Yes' : 'No'
        })),
        issues: []
      };
      
      if (validationResults.productsWithTitles < yangjuProducts.length) {
        report.issues.push(`${yangjuProducts.length - validationResults.productsWithTitles} products missing titles`);
      }
      
      if (validationResults.productsWithPrices < yangjuProducts.length) {
        report.issues.push(`${yangjuProducts.length - validationResults.productsWithPrices} products missing valid prices`);
      }
      
      if (validationResults.productsWithImages < yangjuProducts.length) {
        report.issues.push(`${yangjuProducts.length - validationResults.productsWithImages} products missing images`);
      }
      
      const outputDir = path.join(__dirname, 'output');
      const reportFile = path.join(outputDir, 'yangju-verification-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`\n📊 Verification Results:`);
      console.log(`   Total Products: ${report.totalProducts}`);
      console.log(`   Vendors: ${report.vendorCount} unique vendors`);
      console.log(`   Price Range: ₩${report.priceRange.min.toLocaleString()} - ₩${report.priceRange.max.toLocaleString()}`);
      
      console.log(`\n🏷️  Product Types:`);
      Object.entries(report.productTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} products`);
      });
      
      console.log(`\n📈 Data Quality:`);
      console.log(`   Titles: ${report.dataQualityScore.titles}`);
      console.log(`   Prices: ${report.dataQualityScore.prices}`);
      console.log(`   Images: ${report.dataQualityScore.images}`);
      console.log(`   URLs: ${report.dataQualityScore.urls}`);
      console.log(`   Vendors: ${report.dataQualityScore.vendors}`);
      
      console.log(`\n🏢 Top Vendors:`);
      const vendorCounts = this.getVendorCounts(yangjuProducts);
      Object.entries(vendorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([vendor, count]) => {
          console.log(`   - ${vendor}: ${count} products`);
        });
      
      if (report.issues.length > 0) {
        console.log(`\n⚠️  Issues Found:`);
        report.issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log(`\n✅ No data quality issues found!`);
      }
      
      console.log(`\n📝 Report saved: ${reportFile}`);
      
    } catch (error) {
      console.error('❌ Error during verification:', error);
      throw error;
    }
  }

  private parsePrice(priceStr: string): number {
    const cleanPrice = priceStr.replace(/[^0-9]/g, '');
    return parseInt(cleanPrice) || 0;
  }
  
  private categorizeProducts(products: Product[]): Record<string, number> {
    const categories: Record<string, number> = {};
    
    products.forEach(product => {
      const title = product.title.toLowerCase();
      
      if (title.includes('쌀') || title.includes('곡류')) {
        categories['곡류/쌀'] = (categories['곡류/쌀'] || 0) + 1;
      } else if (title.includes('과일') || title.includes('배') || title.includes('사과')) {
        categories['과일'] = (categories['과일'] || 0) + 1;
      } else if (title.includes('채소') || title.includes('부추') || title.includes('버섯')) {
        categories['채소'] = (categories['채소'] || 0) + 1;
      } else if (title.includes('축산') || title.includes('한우') || title.includes('한돈')) {
        categories['축산물'] = (categories['축산물'] || 0) + 1;
      } else if (title.includes('가공') || title.includes('잼') || title.includes('차') || title.includes('치즈')) {
        categories['가공식품'] = (categories['가공식품'] || 0) + 1;
      } else if (title.includes('꿀') || title.includes('벌꿀')) {
        categories['양봉제품'] = (categories['양봉제품'] || 0) + 1;
      } else if (title.includes('막걸리') || title.includes('주')) {
        categories['전통주'] = (categories['전통주'] || 0) + 1;
      } else if (title.includes('선물') || title.includes('세트')) {
        categories['선물세트'] = (categories['선물세트'] || 0) + 1;
      } else {
        categories['기타'] = (categories['기타'] || 0) + 1;
      }
    });
    
    return categories;
  }
  
  private getVendorCounts(products: Product[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    products.forEach(product => {
      const vendor = product.vendor || 'Unknown';
      counts[vendor] = (counts[vendor] || 0) + 1;
    });
    
    return counts;
  }
}

async function main() {
  const verifier = new YangjuVerifier();
  await verifier.run();
}

if (require.main === module) {
  main().catch(console.error);
}