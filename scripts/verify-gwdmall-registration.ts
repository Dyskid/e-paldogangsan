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

class GwdMallVerifier {
  async run() {
    console.log('🔍 Verifying GWDMall product registration...');
    
    try {
      const productsFile = path.join(__dirname, '..', 'src', 'data', 'products.json');
      const productsData = fs.readFileSync(productsFile, 'utf-8');
      const allProducts: Product[] = JSON.parse(productsData);
      
      const gwdmallProducts = allProducts.filter(p => p.mallId === 'gwdmall');
      
      console.log(`📊 Found ${gwdmallProducts.length} GWDMall products in database`);
      
      const categories = [...new Set(gwdmallProducts.map(p => p.category))];
      const priceRange = {
        min: Math.min(...gwdmallProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0)),
        max: Math.max(...gwdmallProducts.map(p => this.parsePrice(p.price)).filter(p => p > 0))
      };
      
      const productTypes = this.categorizeProducts(gwdmallProducts);
      
      const validationResults = {
        productsWithTitles: gwdmallProducts.filter(p => p.title && p.title.length > 0).length,
        productsWithPrices: gwdmallProducts.filter(p => p.price && this.parsePrice(p.price) > 0).length,
        productsWithImages: gwdmallProducts.filter(p => p.imageUrl && p.imageUrl.length > 0).length,
        productsWithUrls: gwdmallProducts.filter(p => p.productUrl && p.productUrl.length > 0).length,
        productsWithCategories: gwdmallProducts.filter(p => p.category && p.category.length > 0).length
      };
      
      const report = {
        mallName: '강원더몰',
        mallUrl: 'https://gwdmall.kr',
        verificationDate: new Date().toISOString(),
        totalProducts: gwdmallProducts.length,
        categories: categories,
        categoryCount: categories.length,
        productTypes: productTypes,
        priceRange: priceRange,
        validationResults: validationResults,
        dataQualityScore: {
          titles: (validationResults.productsWithTitles / gwdmallProducts.length * 100).toFixed(1) + '%',
          prices: (validationResults.productsWithPrices / gwdmallProducts.length * 100).toFixed(1) + '%',
          images: (validationResults.productsWithImages / gwdmallProducts.length * 100).toFixed(1) + '%',
          urls: (validationResults.productsWithUrls / gwdmallProducts.length * 100).toFixed(1) + '%',
          categories: (validationResults.productsWithCategories / gwdmallProducts.length * 100).toFixed(1) + '%'
        },
        specialties: this.identifySpecialties(gwdmallProducts),
        sampleProducts: gwdmallProducts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl ? 'Yes' : 'No'
        })),
        issues: []
      };
      
      if (validationResults.productsWithTitles < gwdmallProducts.length) {
        report.issues.push(`${gwdmallProducts.length - validationResults.productsWithTitles} products missing titles`);
      }
      
      if (validationResults.productsWithPrices < gwdmallProducts.length) {
        report.issues.push(`${gwdmallProducts.length - validationResults.productsWithPrices} products missing valid prices`);
      }
      
      if (validationResults.productsWithImages < gwdmallProducts.length) {
        report.issues.push(`${gwdmallProducts.length - validationResults.productsWithImages} products missing images`);
      }
      
      const outputDir = path.join(__dirname, 'output');
      const reportFile = path.join(outputDir, 'gwdmall-verification-report.json');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      console.log(`\n📊 Verification Results:`);
      console.log(`   Total Products: ${report.totalProducts}`);
      console.log(`   Categories: ${report.categoryCount} categories`);
      console.log(`   Price Range: ₩${report.priceRange.min.toLocaleString()} - ₩${report.priceRange.max.toLocaleString()}`);
      
      console.log(`\n🏷️  Product Categories:`);
      Object.entries(report.productTypes).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count} products`);
      });
      
      console.log(`\n📈 Data Quality:`);
      console.log(`   Titles: ${report.dataQualityScore.titles}`);
      console.log(`   Prices: ${report.dataQualityScore.prices}`);
      console.log(`   Images: ${report.dataQualityScore.images}`);
      console.log(`   URLs: ${report.dataQualityScore.urls}`);
      console.log(`   Categories: ${report.dataQualityScore.categories}`);
      
      console.log(`\n🌟 Gangwon Specialties:`);
      Object.entries(report.specialties).forEach(([specialty, count]) => {
        console.log(`   - ${specialty}: ${count} products`);
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
      const category = product.category || 'Unknown';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }
  
  private identifySpecialties(products: Product[]): Record<string, number> {
    const specialties: Record<string, number> = {};
    
    products.forEach(product => {
      const title = product.title.toLowerCase();
      
      if (title.includes('춘천') || title.includes('닭갈비')) {
        specialties['춘천 닭갈비'] = (specialties['춘천 닭갈비'] || 0) + 1;
      }
      if (title.includes('철원') || title.includes('현무암')) {
        specialties['철원 특산품'] = (specialties['철원 특산품'] || 0) + 1;
      }
      if (title.includes('횡성') || title.includes('한우')) {
        specialties['횡성 한우'] = (specialties['횡성 한우'] || 0) + 1;
      }
      if (title.includes('강릉') || title.includes('커피') || title.includes('바다')) {
        specialties['강릉 특산품'] = (specialties['강릉 특산품'] || 0) + 1;
      }
      if (title.includes('속초') || title.includes('명란') || title.includes('젓갈')) {
        specialties['속초 해산물'] = (specialties['속초 해산물'] || 0) + 1;
      }
      if (title.includes('정선') || title.includes('곤드레') || title.includes('산채')) {
        specialties['정선 산채'] = (specialties['정선 산채'] || 0) + 1;
      }
      if (title.includes('영월') || title.includes('곤드레')) {
        specialties['영월 특산품'] = (specialties['영월 특산품'] || 0) + 1;
      }
      if (title.includes('홍천') || title.includes('잣')) {
        specialties['홍천 특산품'] = (specialties['홍천 특산품'] || 0) + 1;
      }
      if (title.includes('양양') || title.includes('기름')) {
        specialties['양양 특산품'] = (specialties['양양 특산품'] || 0) + 1;
      }
    });
    
    return specialties;
  }
}

async function main() {
  const verifier = new GwdMallVerifier();
  await verifier.run();
}

if (require.main === module) {
  main().catch(console.error);
}