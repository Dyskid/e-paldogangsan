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
      // Load products database
      const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
      const productsData = fs.readFileSync(productsFile, 'utf-8');
      const allProducts: Product[] = JSON.parse(productsData);
      
      // Filter Gmsocial products
      const gmsocialProducts = allProducts.filter(p => p.mallId === 'gmsocial');
      
      console.log(`📊 Found ${gmsocialProducts.length} Gmsocial products in database`);
      
      // Analyze products
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
      
      // Verify data quality
      const validationResults = {
        productsWithTitles: gmsocialProducts.filter(p => p.title && p.title.length > 0).length,
        productsWithPrices: gmsocialProducts.filter(p => p.price && this.parsePrice(p.price) > 0).length,
        productsWithImages: gmsocialProducts.filter(p => p.imageUrl && p.imageUrl.length > 0).length,
        productsWithUrls: gmsocialProducts.filter(p => p.productUrl && p.productUrl.length > 0).length,
        productsWithVendors: gmsocialProducts.filter(p => p.vendor && p.vendor.length > 0).length
      };
      
      // Create verification report
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
      };\n      \n      // Check for potential issues\n      if (validationResults.productsWithTitles < gmsocialProducts.length) {\n        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithTitles} products missing titles`);\n      }\n      \n      if (validationResults.productsWithPrices < gmsocialProducts.length) {\n        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithPrices} products missing valid prices`);\n      }\n      \n      if (validationResults.productsWithImages < gmsocialProducts.length) {\n        report.issues.push(`${gmsocialProducts.length - validationResults.productsWithImages} products missing images`);\n      }\n      \n      // Save verification report\n      const outputDir = path.join(__dirname, 'output');\n      const reportFile = path.join(outputDir, 'gmsocial-verification-report.json');\n      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));\n      \n      // Display summary\n      console.log(`\\n📊 Verification Results:`);\n      console.log(`   Total Products: ${report.totalProducts}`);\n      console.log(`   Categories: ${report.categories.length} (${report.categories.join(', ')})`);\n      console.log(`   Vendors: ${report.vendors.length}`);\n      console.log(`   Price Range: ₩${report.priceRange.min.toLocaleString()} - ₩${report.priceRange.max.toLocaleString()}`);\n      \n      console.log(`\\n📈 Data Quality:`);\n      console.log(`   Titles: ${report.dataQualityScore.titles}`);\n      console.log(`   Prices: ${report.dataQualityScore.prices}`);\n      console.log(`   Images: ${report.dataQualityScore.images}`);\n      console.log(`   URLs: ${report.dataQualityScore.urls}`);\n      console.log(`   Vendors: ${report.dataQualityScore.vendors}`);\n      \n      if (report.issues.length > 0) {\n        console.log(`\\n⚠️  Issues Found:`);\n        report.issues.forEach(issue => console.log(`   - ${issue}`));\n      } else {\n        console.log(`\\n✅ No data quality issues found!`);\n      }\n      \n      console.log(`\\n📝 Report saved: ${reportFile}`);\n      \n    } catch (error) {\n      console.error('❌ Error during verification:', error);\n      throw error;\n    }\n  }\n\n  private parsePrice(priceStr: string): number {\n    const cleanPrice = priceStr.replace(/[^0-9]/g, '');\n    return parseInt(cleanPrice) || 0;\n  }\n}\n\nasync function main() {\n  const verifier = new GmsocialVerifier();\n  await verifier.run();\n}\n\nif (require.main === module) {\n  main().catch(console.error);\n}