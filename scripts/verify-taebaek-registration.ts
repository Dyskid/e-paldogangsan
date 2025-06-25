import * as fs from 'fs';
import * as path from 'path';

interface DatabaseProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  mall: string;
  region: string;
  category: string;
  tags: string[];
  inStock: boolean;
  lastUpdated: string;
}

interface VerificationResult {
  mall: string;
  totalProductsInDatabase: number;
  taebaekProducts: number;
  productsWithPrices: number;
  productsWithImages: number;
  productsWithTags: number;
  uniqueCategories: string[];
  uniqueTags: string[];
  priceDistribution: {
    under10000: number;
    between10000and30000: number;
    between30000and50000: number;
    over50000: number;
  };
  sampleProducts: Array<{
    id: string;
    name: string;
    price: string;
    tags: string[];
  }>;
  issues: string[];
  timestamp: string;
}

function verifyTaebaekRegistration(): void {
  try {
    console.log('🔍 Starting Taebaek Mall registration verification...');
    
    const scriptsDir = path.dirname(__filename);
    const dataDir = path.join(scriptsDir, '..', 'src', 'data');
    const productsFile = path.join(dataDir, 'products.json');
    
    if (!fs.existsSync(productsFile)) {
      throw new Error(`Products database not found: ${productsFile}`);
    }
    
    const allProducts: DatabaseProduct[] = JSON.parse(
      fs.readFileSync(productsFile, 'utf8')
    );
    
    console.log(`📊 Total products in database: ${allProducts.length}`);
    
    const taebaekProducts = allProducts.filter(product => 
      product.mall === '태백몰' || 
      product.id.startsWith('taebaek_') ||
      (product.url && product.url.includes('taebaek-mall.com'))
    );
    
    console.log(`🏪 Taebaek Mall products found: ${taebaekProducts.length}`);
    
    if (taebaekProducts.length === 0) {
      console.log('❌ No Taebaek Mall products found in database!');
      return;
    }
    
    const productsWithPrices = taebaekProducts.filter(p => p.price && p.price.trim() !== '');
    const productsWithImages = taebaekProducts.filter(p => p.image && p.image.trim() !== '');
    const productsWithTags = taebaekProducts.filter(p => p.tags && p.tags.length > 0);
    
    const uniqueCategories = [...new Set(taebaekProducts.map(p => p.category))];
    const allTags = taebaekProducts.flatMap(p => p.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    const priceDistribution = {
      under10000: 0,
      between10000and30000: 0,
      between30000and50000: 0,
      over50000: 0
    };
    
    const issues: string[] = [];
    
    taebaekProducts.forEach(product => {
      if (!product.price || product.price.trim() === '') {
        issues.push(`Product ${product.id} missing price`);
      }
      
      if (!product.image || product.image.trim() === '') {
        issues.push(`Product ${product.id} missing image`);
      }
      
      if (!product.tags || product.tags.length === 0) {
        issues.push(`Product ${product.id} missing tags`);
      }
      
      if (!product.name || product.name.trim() === '') {
        issues.push(`Product ${product.id} missing name`);
      }
      
      if (product.price) {
        const priceNumber = parseInt(product.price.replace(/[^0-9]/g, ''));
        if (priceNumber < 10000) {
          priceDistribution.under10000++;
        } else if (priceNumber < 30000) {
          priceDistribution.between10000and30000++;
        } else if (priceNumber < 50000) {
          priceDistribution.between30000and50000++;
        } else {
          priceDistribution.over50000++;
        }
      }
    });
    
    const verificationResult: VerificationResult = {
      mall: '태백몰',
      totalProductsInDatabase: allProducts.length,
      taebaekProducts: taebaekProducts.length,
      productsWithPrices: productsWithPrices.length,
      productsWithImages: productsWithImages.length,
      productsWithTags: productsWithTags.length,
      uniqueCategories,
      uniqueTags,
      priceDistribution,
      sampleProducts: taebaekProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        tags: p.tags
      })),
      issues,
      timestamp: new Date().toISOString()
    };
    
    const outputDir = path.join(scriptsDir, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const verificationFile = path.join(outputDir, 'taebaek-verification-report.json');
    fs.writeFileSync(verificationFile, JSON.stringify(verificationResult, null, 2), 'utf8');
    
    console.log('\n✅ Taebaek Mall registration verification completed!');
    console.log(`\n📈 Verification Results:`);
    console.log(`   • Total products in database: ${verificationResult.totalProductsInDatabase}`);
    console.log(`   • Taebaek Mall products: ${verificationResult.taebaekProducts}`);
    console.log(`   • Products with prices: ${verificationResult.productsWithPrices}`);
    console.log(`   • Products with images: ${verificationResult.productsWithImages}`);
    console.log(`   • Products with tags: ${verificationResult.productsWithTags}`);
    
    console.log(`\n📊 Data Quality:`);
    console.log(`   • Categories: ${uniqueCategories.join(', ')}`);
    console.log(`   • Total unique tags: ${uniqueTags.length}`);
    console.log(`   • Popular tags: ${uniqueTags.slice(0, 10).join(', ')}`);
    
    console.log(`\n💰 Price Distribution:`);
    console.log(`   • Under 10,000원: ${priceDistribution.under10000} products`);
    console.log(`   • 10,000-30,000원: ${priceDistribution.between10000and30000} products`);
    console.log(`   • 30,000-50,000원: ${priceDistribution.between30000and50000} products`);
    console.log(`   • Over 50,000원: ${priceDistribution.over50000} products`);
    
    if (issues.length > 0) {
      console.log(`\n⚠️  Issues found (${issues.length}):`);
      issues.slice(0, 5).forEach(issue => console.log(`   • ${issue}`));
      if (issues.length > 5) {
        console.log(`   • ... and ${issues.length - 5} more issues`);
      }
    } else {
      console.log(`\n✅ No data quality issues found!`);
    }
    
    console.log(`\n🔍 Sample Products:`);
    verificationResult.sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ${product.price}`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Tags: ${product.tags.join(', ')}`);
    });
    
    console.log(`\n📁 Verification report saved: ${verificationFile}`);
    
    if (verificationResult.taebaekProducts >= 30 && issues.length === 0) {
      console.log('\n🎉 Registration verification PASSED! All products successfully registered.');
    } else if (issues.length > 0) {
      console.log('\n⚠️  Registration verification completed with issues. Please review.');
    } else {
      console.log('\n⚠️  Fewer products than expected. Please verify scraping completeness.');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

if (require.main === module) {
  verifyTaebaekRegistration();
}

export { verifyTaebaekRegistration };