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

class GmsocialVerifier {
  async run() {
    console.log('🔍 Verifying Gmsocial product registration...');
    
    try {
      const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
      const productsData = fs.readFileSync(productsFile, 'utf-8');
      const allProducts: Product[] = JSON.parse(productsData);
      
      const gmsocialProducts = allProducts.filter(p => p.mallId === 'gmsocial');
      
      console.log(`📊 Found ${gmsocialProducts.length} Gmsocial products in database`);
      
      const categories = [...new Set(gmsocialProducts.map(p => p.category))];
      const vendors = [...new Set(gmsocialProducts.map(p => p.vendor).filter(v => v))];
      const priceRange = {
        min: Math.min(...gmsocialProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...gmsocialProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      };
      
      const productsByCategory = gmsocialProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const productsByVendor = gmsocialProducts.reduce((acc, product) => {
        const vendor = product.vendor || 'Unknown';
        acc[vendor] = (acc[vendor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const validationResults = {
        productsWithTitles: gmsocialProducts.filter(p => p.title && p.title.length > 0).length,
        productsWithPrices: gmsocialProducts.filter(p => p.price && this.parsePrice(p.price) > 0).length,
        productsWithImages: gmsocialProducts.filter(p => p.imageUrl && p.imageUrl.length > 0).length,
        productsWithUrls: gmsocialProducts.filter(p => p.productUrl && p.productUrl.length > 0).length,
        productsWithVendors: gmsocialProducts.filter(p => p.vendor && p.vendor.length > 0).length
      };
      
      const report = {
        mallName: '광명가치몰',
        mallUrl: 'https://gmsocial.or.kr/mall/',
        verificationDate: new Date().toISOString(),
        totalProducts: gmsocialProducts.length,
        categories: categories,
        vendors: vendors,
        productsByCategory: productsByCategory,
        productsByVendor: productsByVendor,
        priceRange: priceRange,
        validationResults: validationResults,
        dataQualityScore: {
          titles: (validationResults.productsWithTitles / gmsocialProducts.length * 100).toFixed(1) + '%',
          prices: (validationResults.productsWithPrices / gmsocialProducts.length * 100).toFixed(1) + '%',
          images: (validationResults.productsWithImages / gmsocialProducts.length * 100).toFixed(1) + '%',
          urls: (validationResults.productsWithUrls / gmsocialProducts.length * 100).toFixed(1) + '%',
          vendors: (validationResults.productsWithVendors / gmsocialProducts.length * 100).toFixed(1) + '%'
        },
        sampleProducts: gmsocialProducts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          category: p.category,
          vendor: p.vendor,
          imageUrl: p.imageUrl ? 'Yes' : 'No',
          productUrl: p.productUrl.substring(0, 50) + '...'
        })),
        issues: []
      };
      
      if (validationResults.productsWithTitles < gmsocialProducts.length) {
        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithTitles} products missing titles`);
      }
      
      if (validationResults.productsWithPrices < gmsocialProducts.length) {
        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithPrices} products missing valid prices`);
      }
      
      if (validationResults.productsWithImages < gmsocialProducts.length) {
        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithImages} products missing images`);
      }
      
      const outputDir = path.join(__dirname, 'output');
      const reportFile = path.join(outputDir, 'gmsocial-verification-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`\n📊 Verification Results:`);
      console.log(`   Total Products: ${report.totalProducts}`);
      console.log(`   Categories: ${report.categories.length} (${report.categories.join(', ')})`);
      console.log(`   Vendors: ${report.vendors.length}`);
      console.log(`   Price Range: ₩${report.priceRange.min.toLocaleString()} - ₩${report.priceRange.max.toLocaleString()}`);
      
      console.log(`\n📈 Data Quality:`);
      console.log(`   Titles: ${report.dataQualityScore.titles}`);
      console.log(`   Prices: ${report.dataQualityScore.prices}`);
      console.log(`   Images: ${report.dataQualityScore.images}`);
      console.log(`   URLs: ${report.dataQualityScore.urls}`);
      console.log(`   Vendors: ${report.dataQualityScore.vendors}`);
      
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
}

async function main() {
  const verifier = new GmsocialVerifier();
  await verifier.run();
}

if (require.main === module) {
  main().catch(console.error);
}