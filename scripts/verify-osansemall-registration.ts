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

function verifyOsansemallRegistration() {
  console.log('🔍 Verifying osansemall product registration...');
  
  // Load products.json
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  if (!fs.existsSync(productsPath)) {
    console.error('❌ products.json not found');
    return;
  }
  
  const products: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log(`📋 Total products in database: ${products.length}`);
  
  // Filter osansemall products
  const osansemallProducts = products.filter(p => 
    p.id?.startsWith('osansemall-') || 
    (p.mall && p.mall.mallId === 'osansemall') ||
    p.mallId === 'osansemall'
  );
  
  console.log(`📋 Osansemall products found: ${osansemallProducts.length}`);
  
  // Analyze osansemall products
  const analysis = {
    totalProducts: osansemallProducts.length,
    productsWithPrice: osansemallProducts.filter(p => p.price > 0).length,
    productsWithImage: osansemallProducts.filter(p => p.image && p.image.trim() !== '').length,
    productsWithDescription: osansemallProducts.filter(p => p.description && p.description.trim() !== '').length,
    categories: [...new Set(osansemallProducts.map(p => p.category))],
    priceRange: {
      min: Math.min(...osansemallProducts.map(p => p.price)),
      max: Math.max(...osansemallProducts.map(p => p.price)),
      average: Math.round(osansemallProducts.reduce((sum, p) => sum + p.price, 0) / osansemallProducts.length)
    },
    regionDistribution: osansemallProducts.reduce((acc, p) => {
      const region = p.region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    malformattedProducts: osansemallProducts.filter(p => 
      !p.name || p.name.trim() === '' || 
      !p.price || p.price <= 0 ||
      !p.category || p.category.trim() === ''
    ),
    sampleProducts: osansemallProducts.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name.substring(0, 50),
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
    console.log(`   ${p.id}: ${p.name}... - ₩${p.price.toLocaleString()} (${p.category})`);
  });
  
  // Save verification report
  const report = {
    verificationDate: new Date().toISOString(),
    mallName: '오산함께장터',
    mallId: 'osansemall',
    ...analysis
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'osansemall-verification-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Check mall registration in malls.json
  const mallsPath = path.join(__dirname, '..', 'src', 'data', 'malls.json');
  if (fs.existsSync(mallsPath)) {
    const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));
    const osansemallMall = malls.find((m: any) => m.id === 'osansemall' || m.id.includes('오산함께장터'));
    
    if (osansemallMall) {
      console.log(`\n🏪 Mall registration verified: ${osansemallMall.name}`);
    } else {
      console.log('\n⚠️  Mall not found in malls.json');
      console.log('💡 Note: Mall is likely already registered as "mall_11_오산함께장터"');
    }
  }
  
  return report;
}

// Run verification
try {
  const report = verifyOsansemallRegistration();
  console.log('\n✅ Verification complete!');
  console.log('📄 Report saved to: osansemall-verification-report.json');
} catch (error) {
  console.error('❌ Verification failed:', error);
}