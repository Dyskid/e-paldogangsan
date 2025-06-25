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
  
  if (name.includes('감자')) {
    tags.push('감자', '농산물', '전분류');
  }
  if (name.includes('만두')) {
    tags.push('만두', '냉동식품', '간편식');
  }
  if (name.includes('냉면')) {
    tags.push('냉면', '면류', '전통음식');
  }
  if (name.includes('닭발')) {
    tags.push('닭발', '육류', '간식');
  }
  if (name.includes('산채') || name.includes('나물')) {
    tags.push('산채', '나물', '산나물');
  }
  if (name.includes('찐빵')) {
    tags.push('찐빵', '전통과자', '간식');
  }
  if (name.includes('곶감')) {
    tags.push('곶감', '과일', '건과');
  }
  if (name.includes('도라지')) {
    tags.push('도라지', '건강식품', '정과');
  }
  if (name.includes('김치')) {
    tags.push('김치', '발효식품', '반찬');
  }
  if (name.includes('옹심이')) {
    tags.push('옹심이', '전통음식', '간편식');
  }
  if (name.includes('한우')) {
    tags.push('한우', '육류', '고급육');
  }
  if (name.includes('삼겹살') || name.includes('돼지')) {
    tags.push('돼지고기', '육류', '삼겹살');
  }
  if (name.includes('된장') || name.includes('고추장') || name.includes('쌈장')) {
    tags.push('장류', '발효식품', '전통장');
  }
  if (name.includes('청국장')) {
    tags.push('청국장', '발효식품', '건강식품');
  }
  if (name.includes('정과')) {
    tags.push('정과', '전통과자', '간식');
  }
  if (name.includes('수제비')) {
    tags.push('수제비', '전통음식', '밀키트');
  }
  if (name.includes('밀키트')) {
    tags.push('밀키트', '간편식', '전통음식');
  }
  if (name.includes('선물세트')) {
    tags.push('선물세트', '선물');
  }
  
  tags.push('강원도특산품', '태백특산품', '농특산물');
  
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

function registerTaebaekProducts(): void {
  try {
    console.log('🚀 Starting Taebaek Mall product registration...');
    
    const scriptsDir = path.dirname(__filename);
    const outputDir = path.join(scriptsDir, 'output');
    const scrapedProductsFile = path.join(outputDir, 'taebaek-products.json');
    
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
      mall: '태백몰',
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
    
    const summaryFile = path.join(outputDir, 'taebaek-registration-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(registrationSummary, null, 2), 'utf8');
    
    console.log('\n🎉 Taebaek Mall product registration completed!');
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
  registerTaebaekProducts();
}

export { registerTaebaekProducts };