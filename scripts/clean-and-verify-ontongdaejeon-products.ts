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
}

interface ValidationIssue {
  productId: string;
  field: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
}

function cleanAndVerifyOntongDaejeonProducts() {
  console.log('🔍 Starting data cleaning and verification for Ontong Daejeon products...');

  // Read the main products database
  const productsPath = './src/data/products.json';
  const allProducts: Product[] = JSON.parse(readFileSync(productsPath, 'utf-8'));

  // Filter Ontong Daejeon products
  const ontongdaejeonProducts = allProducts.filter(p => p.mallId === 'ontongdaejeon');
  console.log(`📦 Found ${ontongdaejeonProducts.length} Ontong Daejeon products in database`);

  const cleanedProducts: Product[] = [];
  const validationIssues: ValidationIssue[] = [];
  let cleaned = 0;

  ontongdaejeonProducts.forEach(product => {
    const cleanedProduct = { ...product };
    let wasModified = false;

    // 1. Clean and validate title
    if (!product.title || product.title.trim() === '') {
      validationIssues.push({
        productId: product.id,
        field: 'title',
        issue: 'Missing title',
        severity: 'error'
      });
    } else {
      // Clean title
      let cleanTitle = product.title.trim();
      
      // Remove duplicate spaces
      cleanTitle = cleanTitle.replace(/\s+/g, ' ');
      
      // Remove common prefixes/suffixes that shouldn't be there
      cleanTitle = cleanTitle.replace(/^\[로컬상품관\]\s*/g, '');
      cleanTitle = cleanTitle.replace(/\s*\[로컬상품관\]$/g, '');
      
      if (cleanTitle !== product.title) {
        cleanedProduct.title = cleanTitle;
        wasModified = true;
      }
    }

    // 2. Validate and clean price
    if (!product.price || product.price.trim() === '') {
      validationIssues.push({
        productId: product.id,
        field: 'price',
        issue: 'Missing price',
        severity: 'error'
      });
    } else {
      // Validate price format
      const priceMatch = product.price.match(/^(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원$/);
      if (!priceMatch) {
        validationIssues.push({
          productId: product.id,
          field: 'price',
          issue: `Invalid price format: ${product.price}`,
          severity: 'warning'
        });
      } else {
        // Check if price is reasonable
        const priceNum = parseInt(product.price.replace(/[^\d]/g, ''));
        if (priceNum < 100) {
          validationIssues.push({
            productId: product.id,
            field: 'price',
            issue: `Price seems too low: ${product.price}`,
            severity: 'warning'
          });
        } else if (priceNum > 1000000) {
          validationIssues.push({
            productId: product.id,
            field: 'price',
            issue: `Price seems too high: ${product.price}`,
            severity: 'warning'
          });
        }
      }
    }

    // 3. Validate image URL
    if (!product.imageUrl || product.imageUrl.trim() === '') {
      validationIssues.push({
        productId: product.id,
        field: 'imageUrl',
        issue: 'Missing image URL',
        severity: 'warning'
      });
    } else if (!product.imageUrl.startsWith('http')) {
      validationIssues.push({
        productId: product.id,
        field: 'imageUrl',
        issue: 'Invalid image URL format',
        severity: 'error'
      });
    }

    // 4. Validate product URL
    if (!product.productUrl || !product.productUrl.includes('goodsCd=')) {
      validationIssues.push({
        productId: product.id,
        field: 'productUrl',
        issue: 'Invalid or missing product URL',
        severity: 'error'
      });
    }

    // 5. Clean and validate category
    if (!product.category || product.category.trim() === '') {
      cleanedProduct.category = '지역특산품';
      wasModified = true;
    } else {
      let cleanCategory = product.category.trim();
      
      // Standardize common categories
      if (cleanCategory === '로컬상품관' || cleanCategory === '로컬상품') {
        cleanCategory = '로컬상품';
      }
      
      if (cleanCategory !== product.category) {
        cleanedProduct.category = cleanCategory;
        wasModified = true;
      }
    }

    // 6. Clean and validate tags
    if (!product.tags || !Array.isArray(product.tags)) {
      cleanedProduct.tags = [...ontongdaejeonProducts[0].tags]; // Use default tags
      wasModified = true;
    } else {
      // Remove duplicate tags and empty strings
      const cleanTags = [...new Set(product.tags.filter(tag => tag && tag.trim() !== ''))];
      
      // Ensure essential tags are present
      const essentialTags = ['대전특산품', '지역상품', '온통대전'];
      essentialTags.forEach(tag => {
        if (!cleanTags.includes(tag)) {
          cleanTags.push(tag);
        }
      });
      
      if (cleanTags.length !== product.tags.length || 
          cleanTags.some((tag, i) => tag !== product.tags[i])) {
        cleanedProduct.tags = cleanTags;
        wasModified = true;
      }
    }

    // 7. Validate mall information
    if (product.mallId !== 'ontongdaejeon') {
      validationIssues.push({
        productId: product.id,
        field: 'mallId',
        issue: 'Incorrect mall ID',
        severity: 'error'
      });
    }

    if (product.region !== '대전광역시') {
      cleanedProduct.region = '대전광역시';
      wasModified = true;
    }

    if (wasModified) {
      cleaned++;
    }

    cleanedProducts.push(cleanedProduct);
  });

  // Update the main products array with cleaned Ontong Daejeon products
  const updatedAllProducts = allProducts.map(product => {
    if (product.mallId === 'ontongdaejeon') {
      return cleanedProducts.find(cp => cp.id === product.id) || product;
    }
    return product;
  });

  // Save cleaned products
  writeFileSync('./src/data/products.json', JSON.stringify(updatedAllProducts, null, 2));

  // Generate statistics
  const stats = {
    total: ontongdaejeonProducts.length,
    withPrices: cleanedProducts.filter(p => p.price && p.price !== '').length,
    withImages: cleanedProducts.filter(p => p.imageUrl && p.imageUrl !== '').length,
    withDescriptions: cleanedProducts.filter(p => p.description && p.description !== '').length,
    categories: [...new Set(cleanedProducts.map(p => p.category))],
    priceStats: {
      min: Math.min(...cleanedProducts
        .filter(p => p.price)
        .map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
      max: Math.max(...cleanedProducts
        .filter(p => p.price)
        .map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
      avg: Math.round(cleanedProducts
        .filter(p => p.price)
        .reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) /
        cleanedProducts.filter(p => p.price).length)
    }
  };

  // Create verification report
  const report = {
    timestamp: new Date().toISOString(),
    mall: 'ontongdaejeon',
    mallName: '온통대전몰 대전사랑몰',
    summary: {
      totalProducts: stats.total,
      cleanedProducts: cleaned,
      validationIssues: validationIssues.length,
      errors: validationIssues.filter(i => i.severity === 'error').length,
      warnings: validationIssues.filter(i => i.severity === 'warning').length
    },
    statistics: stats,
    validationIssues: validationIssues,
    sampleCleanedProducts: cleanedProducts.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      tags: p.tags
    }))
  };

  writeFileSync('./scripts/output/ontongdaejeon-cleaning-verification-report.json', JSON.stringify(report, null, 2));

  console.log('\n📊 Cleaning and Verification Summary:');
  console.log(`✅ Total products processed: ${stats.total}`);
  console.log(`🧹 Products cleaned: ${cleaned}`);
  console.log(`💰 Products with prices: ${stats.withPrices} (${(stats.withPrices/stats.total*100).toFixed(1)}%)`);
  console.log(`🖼️ Products with images: ${stats.withImages} (${(stats.withImages/stats.total*100).toFixed(1)}%)`);
  console.log(`📝 Products with descriptions: ${stats.withDescriptions} (${(stats.withDescriptions/stats.total*100).toFixed(1)}%)`);
  
  console.log('\n💰 Price Statistics:');
  console.log(`   - Minimum: ${stats.priceStats.min.toLocaleString()}원`);
  console.log(`   - Maximum: ${stats.priceStats.max.toLocaleString()}원`);
  console.log(`   - Average: ${stats.priceStats.avg.toLocaleString()}원`);
  
  console.log('\n📂 Categories:');
  stats.categories.forEach(cat => {
    const count = cleanedProducts.filter(p => p.category === cat).length;
    console.log(`   - ${cat}: ${count} products`);
  });

  console.log('\n⚠️ Validation Issues:');
  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Warnings: ${warningCount}`);

  if (validationIssues.length > 0) {
    console.log('\n🔍 Sample Issues:');
    validationIssues.slice(0, 5).forEach(issue => {
      console.log(`   ${issue.severity.toUpperCase()}: ${issue.productId} - ${issue.field}: ${issue.issue}`);
    });
  }

  console.log('\n✅ Data cleaning and verification completed!');
  console.log(`📄 Report saved to ontongdaejeon-cleaning-verification-report.json`);
}

// Run the cleaning and verification
cleanAndVerifyOntongDaejeonProducts();