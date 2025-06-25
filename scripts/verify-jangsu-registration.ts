import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  mall: string;
  region: string;
  category: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  description?: string;
  source?: string;
}

interface VerificationResult {
  totalProducts: number;
  jangsuProducts: number;
  categoriesFound: Record<string, number>;
  tagsFound: Record<string, number>;
  dataQualityIssues: string[];
  sampleProducts: any[];
  qualityScore: number;
}

function verifyJangsuProducts(): VerificationResult {
  console.log('🔍 Starting 장수몰 product registration verification...');

  const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  
  if (!fs.existsSync(productsPath)) {
    throw new Error('Products file not found');
  }

  const allProducts: Product[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const jangsuProducts = allProducts.filter(p => p.mall === '장수몰');

  console.log(`📊 Total products in database: ${allProducts.length}`);
  console.log(`🏪 장수몰 products: ${jangsuProducts.length}`);

  const categoriesFound: Record<string, number> = {};
  const tagsFound: Record<string, number> = {};
  const dataQualityIssues: string[] = [];

  jangsuProducts.forEach((product, index) => {
    categoriesFound[product.category] = (categoriesFound[product.category] || 0) + 1;
    
    product.tags.forEach(tag => {
      tagsFound[tag] = (tagsFound[tag] || 0) + 1;
    });

    if (!product.title || product.title.length < 2) {
      dataQualityIssues.push(`Product ${index + 1}: Invalid title "${product.title}"`);
    }

    if (!product.price || !product.price.match(/\d/)) {
      dataQualityIssues.push(`Product ${index + 1}: Invalid price "${product.price}"`);
    }

    if (!product.image || (!product.image.startsWith('http') && !product.image.startsWith('/'))) {
      dataQualityIssues.push(`Product ${index + 1}: Invalid image URL "${product.image}"`);
    }

    if (!product.url || !product.url.startsWith('http')) {
      dataQualityIssues.push(`Product ${index + 1}: Invalid product URL "${product.url}"`);
    }

    if (product.region !== '전북') {
      dataQualityIssues.push(`Product ${index + 1}: Incorrect region "${product.region}" (should be "전북")`);
    }

    const suspiciousCategories = ['전체', '카테고리', '목록', '리스트', '상품', '분류'];
    if (suspiciousCategories.some(cat => product.title.includes(cat))) {
      dataQualityIssues.push(`Product ${index + 1}: Possible category registered as product "${product.title}"`);
    }

    const priceNum = parseInt(product.price.replace(/[^\d]/g, ''));
    if (isNaN(priceNum) || priceNum <= 0 || priceNum > 10000000) {
      dataQualityIssues.push(`Product ${index + 1}: Unrealistic price "${product.price}"`);
    }
  });

  const qualityScore = Math.max(0, 100 - (dataQualityIssues.length * 2));

  const sampleProducts = jangsuProducts.slice(0, 5).map(p => ({
    title: p.title,
    price: p.price,
    category: p.category,
    tags: p.tags,
    url: p.url
  }));

  const result: VerificationResult = {
    totalProducts: allProducts.length,
    jangsuProducts: jangsuProducts.length,
    categoriesFound,
    tagsFound,
    dataQualityIssues,
    sampleProducts,
    qualityScore
  };

  console.log('\n📈 Verification Results:');
  console.log(`   Quality Score: ${qualityScore}%`);
  console.log(`   Data Issues Found: ${dataQualityIssues.length}`);
  
  console.log('\n🏷️  Categories Distribution:');
  Object.entries(categoriesFound).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count} products`);
  });

  console.log('\n🔖 Top Tags:');
  const sortedTags = Object.entries(tagsFound)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  sortedTags.forEach(([tag, count]) => {
    console.log(`   - ${tag}: ${count} products`);
  });

  if (dataQualityIssues.length > 0) {
    console.log('\n⚠️  Data Quality Issues:');
    dataQualityIssues.slice(0, 10).forEach(issue => {
      console.log(`   - ${issue}`);
    });
    if (dataQualityIssues.length > 10) {
      console.log(`   ... and ${dataQualityIssues.length - 10} more issues`);
    }
  }

  console.log('\n✅ Sample Products:');
  sampleProducts.forEach((product, i) => {
    console.log(`   ${i + 1}. ${product.title} - ${product.price} (${product.category})`);
  });

  const outputPath = path.join(__dirname, 'output', 'jangsu-verification-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Verification report saved to: ${outputPath}`);

  return result;
}

verifyJangsuProducts();