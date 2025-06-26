import { readFileSync, writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
  isFood?: boolean;
}

function verifyOntongDaejeonRegistration() {
  console.log('🔍 Verifying Ontong Daejeon food products registration...\n');

  // Read the main products database
  const productsPath = './src/data/products.json';
  const allProducts: Product[] = JSON.parse(readFileSync(productsPath, 'utf-8'));

  // Filter Ontong Daejeon products
  const ontongdaejeonProducts = allProducts.filter(p => p.mallId === 'ontongdaejeon');
  const ontongdaejeonFoodProducts = ontongdaejeonProducts.filter(p => p.isFood === true);

  console.log(`📊 Database Statistics:`);
  console.log(`   - Total products in database: ${allProducts.length}`);
  console.log(`   - Ontong Daejeon products: ${ontongdaejeonProducts.length}`);
  console.log(`   - Ontong Daejeon food products: ${ontongdaejeonFoodProducts.length}`);

  // Analyze product quality
  const productsWithPrices = ontongdaejeonFoodProducts.filter(p => p.price && p.price !== '');
  const productsWithImages = ontongdaejeonFoodProducts.filter(p => p.imageUrl && p.imageUrl !== '');
  const productsWithDescriptions = ontongdaejeonFoodProducts.filter(p => p.description && p.description !== '');

  console.log(`\n📈 Quality Metrics:`);
  console.log(`   - With prices: ${productsWithPrices.length} (${(productsWithPrices.length / ontongdaejeonFoodProducts.length * 100).toFixed(1)}%)`);
  console.log(`   - With images: ${productsWithImages.length} (${(productsWithImages.length / ontongdaejeonFoodProducts.length * 100).toFixed(1)}%)`);
  console.log(`   - With descriptions: ${productsWithDescriptions.length} (${(productsWithDescriptions.length / ontongdaejeonFoodProducts.length * 100).toFixed(1)}%)`);

  // Category analysis
  const categories = [...new Set(ontongdaejeonFoodProducts.map(p => p.category))];
  console.log(`\n📂 Categories (${categories.length}):`);
  categories.forEach(cat => {
    const count = ontongdaejeonFoodProducts.filter(p => p.category === cat).length;
    console.log(`   - ${cat}: ${count} products`);
  });

  // Sample products
  console.log(`\n📦 Sample Food Products:`);
  ontongdaejeonFoodProducts.slice(0, 10).forEach((product, index) => {
    console.log(`\n${index + 1}. ${product.title}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Price: ${product.price || '가격정보없음'}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   URL: ${product.productUrl}`);
    console.log(`   Image: ${product.imageUrl ? '✅' : '❌'}`);
    console.log(`   Tags: ${product.tags.join(', ')}`);
  });

  // Issues and recommendations
  console.log(`\n⚠️ Issues Found:`);
  if (productsWithPrices.length === 0) {
    console.log(`   - No products have price information`);
  }
  if (productsWithDescriptions.length === 0) {
    console.log(`   - No products have descriptions`);
  }
  if (productsWithImages.length < ontongdaejeonFoodProducts.length) {
    console.log(`   - ${ontongdaejeonFoodProducts.length - productsWithImages.length} products missing images`);
  }

  // Save verification report
  const report = {
    timestamp: new Date().toISOString(),
    mall: 'ontongdaejeon',
    mallName: '대전사랑몰',
    statistics: {
      totalInDatabase: allProducts.length,
      mallProducts: ontongdaejeonProducts.length,
      foodProducts: ontongdaejeonFoodProducts.length,
      withPrices: productsWithPrices.length,
      withImages: productsWithImages.length,
      withDescriptions: productsWithDescriptions.length
    },
    categories: categories.map(cat => ({
      name: cat,
      count: ontongdaejeonFoodProducts.filter(p => p.category === cat).length
    })),
    issues: {
      missingPrices: ontongdaejeonFoodProducts.length - productsWithPrices.length,
      missingImages: ontongdaejeonFoodProducts.length - productsWithImages.length,
      missingDescriptions: ontongdaejeonFoodProducts.length - productsWithDescriptions.length
    },
    sampleProducts: ontongdaejeonFoodProducts.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price || '가격정보없음',
      hasImage: !!p.imageUrl,
      category: p.category
    }))
  };

  writeFileSync('./scripts/output/ontongdaejeon-verification-report.json', JSON.stringify(report, null, 2));

  console.log(`\n✅ Verification completed! Report saved to ontongdaejeon-verification-report.json`);
}

// Run verification
verifyOntongDaejeonRegistration();