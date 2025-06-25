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
  
  if (name.includes('쌀') || name.includes('오대쌀')) {
    tags.push('쌀', '곡물', '오대쌀');
  }
  if (name.includes('요거트') || name.includes('치즈')) {
    tags.push('유제품', '요거트', '치즈');
  }
  if (name.includes('식혜')) {
    tags.push('식혜', '음료', '전통음료');
  }
  if (name.includes('버섯') || name.includes('상황버섯')) {
    tags.push('버섯', '건강식품', '상황버섯');
  }
  if (name.includes('잣')) {
    tags.push('잣', '견과류', '건과');
  }
  if (name.includes('도라지')) {
    tags.push('도라지', '건강식품', '전통차');
  }
  if (name.includes('산삼') || name.includes('산양산삼')) {
    tags.push('산삼', '건강식품', '인삼');
  }
  if (name.includes('효소')) {
    tags.push('효소', '건강식품', '발효식품');
  }
  if (name.includes('사과')) {
    tags.push('사과', '과일', '신선과일');
  }
  if (name.includes('찐빵') || name.includes('주악') || name.includes('퍼지')) {
    tags.push('과자', '떡류', '전통과자');
  }
  if (name.includes('만두')) {
    tags.push('만두', '냉동식품', '간편식');
  }
  if (name.includes('고추냉이')) {
    tags.push('고추냉이', '채소', '향신료');
  }
  if (name.includes('닭갈비')) {
    tags.push('닭갈비', '밀키트', '간편식');
  }
  if (name.includes('전통주') || name.includes('탁주')) {
    tags.push('전통주', '술', '알코올');
  }
  
  tags.push('강원도특산품', '철원특산품', '농특산물');
  
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

function registerCheorwonProducts(): void {
  try {
    console.log('🚀 Starting Cheorwon Mall product registration...');
    
    const scriptsDir = path.dirname(__filename);
    const outputDir = path.join(scriptsDir, 'output');
    const scrapedProductsFile = path.join(outputDir, 'cheorwon-products.json');
    
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
      mall: '철원몰',
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
    
    const summaryFile = path.join(outputDir, 'cheorwon-registration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(registrationSummary, null, 2), 'utf8');
    
    console.log('\n🎉 Cheorwon Mall product registration completed!');
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
  registerCheorwonProducts();
}

export { registerCheorwonProducts };