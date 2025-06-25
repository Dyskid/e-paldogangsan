import * as fs from 'fs';
import * as path from 'path';

interface ScrapedProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  mall: string;
  region: string;
  category: string;
  inStock: boolean;
  scrapedAt: string;
}

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

function generateTags(product: ScrapedProduct): string[] {
  const tags: string[] = [];
  
  const name = product.name.toLowerCase();
  
  if (name.includes('오미자')) {
    tags.push('오미자', '건강식품', '음료');
  }
  if (name.includes('황태')) {
    tags.push('황태', '건어물', '생선');
  }
  if (name.includes('산채') || name.includes('곤드레') || name.includes('시래기')) {
    tags.push('산채', '나물', '산나물');
  }
  if (name.includes('장아찌')) {
    tags.push('장아찌', '반찬', '젓갈');
  }
  if (name.includes('부각')) {
    tags.push('부각', '과자', '간식');
  }
  if (name.includes('잡곡')) {
    tags.push('잡곡', '쌀', '곡물');
  }
  if (name.includes('꽃차')) {
    tags.push('차', '음료', '건강식품');
  }
  if (name.includes('선물세트')) {
    tags.push('선물세트', '선물');
  }
  if (name.includes('애견') || name.includes('간식')) {
    tags.push('애견용품', '펫푸드');
  }
  
  tags.push('강원도특산품', '인제특산품', '농특산물');
  
  return [...new Set(tags)];
}

function convertToProductFormat(scrapedProduct: ScrapedProduct): DatabaseProduct {
  return {
    id: scrapedProduct.id,
    name: scrapedProduct.name,
    price: scrapedProduct.price,
    originalPrice: scrapedProduct.originalPrice,
    image: scrapedProduct.image,
    url: scrapedProduct.url,
    mall: scrapedProduct.mall,
    region: scrapedProduct.region,
    category: scrapedProduct.category,
    tags: generateTags(scrapedProduct),
    inStock: scrapedProduct.inStock,
    lastUpdated: new Date().toISOString()
  };
}

function registerInjeProducts(): void {
  try {
    console.log('🚀 Starting Inje Mall product registration...');
    
    const scriptsDir = path.dirname(__filename);
    const outputDir = path.join(scriptsDir, 'output');
    const scrapedProductsFile = path.join(outputDir, 'inje-products.json');
    
    if (!fs.existsSync(scrapedProductsFile)) {
      throw new Error(`Scraped products file not found: ${scrapedProductsFile}`);
    }
    
    const scrapedProducts: ScrapedProduct[] = JSON.parse(
      fs.readFileSync(scrapedProductsFile, 'utf8')
    );
    
    console.log(`📂 Found ${scrapedProducts.length} scraped products`);
    
    const productsWithPrices = scrapedProducts.filter(product => 
      product.price && product.price.trim() !== ''
    );
    
    console.log(`💰 Products with prices: ${productsWithPrices.length}`);
    
    if (productsWithPrices.length === 0) {
      console.log('❌ No products with prices found. Registration aborted.');
      return;
    }
    
    const dataDir = path.join(scriptsDir, '..', 'src', 'data');
    const productsFile = path.join(dataDir, 'products.json');
    
    let existingProducts: DatabaseProduct[] = [];
    if (fs.existsSync(productsFile)) {
      existingProducts = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
      console.log(`📊 Current database has ${existingProducts.length} products`);
    }
    
    const existingIds = new Set(existingProducts.map(p => p.id));
    const newProducts: DatabaseProduct[] = [];
    const updatedProducts: DatabaseProduct[] = [];
    
    for (const scrapedProduct of productsWithPrices) {
      const databaseProduct = convertToProductFormat(scrapedProduct);
      
      if (existingIds.has(databaseProduct.id)) {
        const existingIndex = existingProducts.findIndex(p => p.id === databaseProduct.id);
        if (existingIndex !== -1) {
          existingProducts[existingIndex] = databaseProduct;
          updatedProducts.push(databaseProduct);
        }
      } else {
        existingProducts.push(databaseProduct);
        newProducts.push(databaseProduct);
      }
    }
    
    const backupFile = path.join(dataDir, `products-backup-${Date.now()}.json`);
    if (fs.existsSync(productsFile)) {
      fs.copyFileSync(productsFile, backupFile);
      console.log(`💾 Backup created: ${path.basename(backupFile)}`);
    }
    
    fs.writeFileSync(productsFile, JSON.stringify(existingProducts, null, 2), 'utf8');
    
    const registrationSummary = {
      mall: '인제몰',
      region: '강원도',
      scrapedProducts: scrapedProducts.length,
      productsWithPrices: productsWithPrices.length,
      newProducts: newProducts.length,
      updatedProducts: updatedProducts.length,
      totalProductsAfter: existingProducts.length,
      timestamp: new Date().toISOString(),
      backupFile: path.basename(backupFile),
      sampleNewProducts: newProducts.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        tags: p.tags
      })),
      categories: [...new Set(newProducts.map(p => p.category))],
      priceRange: {
        min: Math.min(...productsWithPrices.map(p => parseInt(p.price.replace(/[^0-9]/g, '')))),
        max: Math.max(...productsWithPrices.map(p => parseInt(p.price.replace(/[^0-9]/g, ''))))
      }
    };
    
    const summaryFile = path.join(outputDir, 'inje-registration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(registrationSummary, null, 2), 'utf8');
    
    console.log('\n🎉 Inje Mall product registration completed!');
    console.log(`📊 Registration Summary:`);
    console.log(`   • Scraped products: ${scrapedProducts.length}`);
    console.log(`   • Products with prices: ${productsWithPrices.length}`);
    console.log(`   • New products added: ${newProducts.length}`);
    console.log(`   • Updated products: ${updatedProducts.length}`);
    console.log(`   • Total products in database: ${existingProducts.length}`);
    console.log(`   • Price range: ${registrationSummary.priceRange.min.toLocaleString()}원 - ${registrationSummary.priceRange.max.toLocaleString()}원`);
    
    if (newProducts.length > 0) {
      console.log(`\n🔍 Sample new products:`);
      newProducts.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price}`);
        console.log(`      Tags: ${product.tags.join(', ')}`);
      });
    }
    
    console.log(`\n📁 Files updated:`);
    console.log(`   • Products database: ${productsFile}`);
    console.log(`   • Registration summary: ${summaryFile}`);
    console.log(`   • Backup: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

if (require.main === module) {
  registerInjeProducts();
}

export { registerInjeProducts };