import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall?: any;
  mallId?: string;
  mallName?: string;
  mallUrl?: string;
}

function verifyChack3Registration() {
  console.log('🔍 Verifying chack3 product registration...');
  
  // Load products.json
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('❌ products.json not found');
    return;
  }
  
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log(`📋 Total products in database: ${products.length}`);
  
  // Filter chack3 products
  const chack3Products = products.filter(p => 
    p.id?.startsWith('chack3-') || 
    (p.mall && p.mall.mallId === 'chack3') ||
    p.mallId === 'chack3'
  );
  
  console.log(`📋 Chack3 products found: ${chack3Products.length}`);
  
  // Analyze chack3 products
  const analysis = {
    totalProducts: chack3Products.length,
    productsWithPrice: chack3Products.filter(p => p.price > 0).length,
    productsWithImage: chack3Products.filter(p => p.image && p.image.trim() !== '').length,
    productsWithDescription: chack3Products.filter(p => p.description && p.description.trim() !== '').length,
    categories: [...new Set(chack3Products.map(p => p.category))],
    priceRange: {
      min: Math.min(...chack3Products.map(p => p.price)),
      max: Math.max(...chack3Products.map(p => p.price)),
      average: Math.round(chack3Products.reduce((sum, p) => sum + p.price, 0) / chack3Products.length)
    },
    regionDistribution: chack3Products.reduce((acc, p) => {
      const region = p.region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    malformattedProducts: chack3Products.filter(p => 
      !p.name || p.name.trim() === '' || 
      !p.price || p.price <= 0 ||
      !p.category || p.category.trim() === ''
    ),
    sampleProducts: chack3Products.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      hasImage: !!p.image,
      mallInfo: p.mall || { mallId: p.mallId, mallName: p.mallName }
    }))
  };
  
  console.log('\n📊 Verification Results:');
  console.log(`✅ Products with valid prices: ${analysis.productsWithPrice}/${analysis.totalProducts}`);
  console.log(`🖼️  Products with images: ${analysis.productsWithImage}/${analysis.totalProducts}`);
  console.log(`📝 Products with descriptions: ${analysis.productsWithDescription}/${analysis.totalProducts}`);
  console.log(`🏷️  Categories: ${analysis.categories.join(', ')}`);
  console.log(`💰 Price range: ₩${analysis.priceRange.min.toLocaleString()} - ₩${analysis.priceRange.max.toLocaleString()}`);
  console.log(`📍 Regions: ${Object.entries(analysis.regionDistribution).map(([k,v]) => `${k}(${v})`).join(', ')}`);
  
  if (analysis.malformattedProducts.length > 0) {
    console.log(`⚠️  Malformatted products: ${analysis.malformattedProducts.length}`);
    analysis.malformattedProducts.slice(0, 3).forEach(p => {
      console.log(`   - ${p.id}: ${p.name || 'NO NAME'} - ₩${p.price || 0}`);
    });
  } else {
    console.log('✅ All products are properly formatted');
  }
  
  console.log('\n📝 Sample products:');
  analysis.sampleProducts.forEach(p => {
    console.log(`   ${p.id}: ${p.name} - ₩${p.price.toLocaleString()} (${p.category})`);
  });
  
  // Save verification report
  const report = {
    verificationDate: new Date().toISOString(),
    mallName: '착3몰',
    mallId: 'chack3',
    ...analysis
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'chack3-verification-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Check mall registration in malls.json
  const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
  if (fs.existsSync(mallsPath)) {
    const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
    const chack3Mall = malls.find((m: any) => m.id === 'chack3');
    
    if (chack3Mall) {
      console.log(`\n🏪 Mall registration verified: ${chack3Mall.name}`);
    } else {
      console.log('\n⚠️  Mall not found in malls.json - may need to be added');
      
      // Create mall entry suggestion
      const mallSuggestion = {
        id: 'chack3',
        name: '착3몰',
        url: 'https://www.chack3.com',
        region: '경기도',
        tags: ['김치', '반찬', '사회적기업'],
        featured: false,
        isNew: false,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'output', 'chack3-mall-suggestion.json'),
        JSON.stringify(mallSuggestion, null, 2)
      );
      
      console.log('💡 Mall suggestion saved to: chack3-mall-suggestion.json');
    }
  }
  
  return report;
}

// Run verification
try {
  const report = verifyChack3Registration();
  console.log('\n✅ Verification complete!');
  console.log('📄 Report saved to: chack3-verification-report.json');
} catch (error) {
  console.error('❌ Verification failed:', error);
}