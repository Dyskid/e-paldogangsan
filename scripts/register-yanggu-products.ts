import fs from 'fs/promises';
import path from 'path';

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const SCRAPED_FILE = path.join(__dirname, 'output', 'yanggu-products.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

interface RegistrationResult {
  totalScrapedProducts: number;
  newProductsAdded: number;
  duplicatesSkipped: number;
  errors: number;
  registeredProducts: Product[];
  duplicateIds: string[];
}

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

async function loadExistingProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('기존 products.json 파일을 읽을 수 없습니다:', error.message);
    return [];
  }
}

async function loadScrapedProducts(): Promise<Product[]> {
  try {
    const data = await fs.readFile(SCRAPED_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('스크래핑된 products 파일을 읽을 수 없습니다:', error.message);
    throw error;
  }
}

async function saveProducts(products: Product[]): Promise<void> {
  try {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`✅ ${products.length}개 상품이 ${PRODUCTS_FILE}에 저장되었습니다.`);
  } catch (error) {
    console.error('상품 저장 실패:', error);
    throw error;
  }
}

async function main() {
  try {
    await ensureOutputDir();
    
    console.log('🚀 양구몰 상품 등록 시작...');
    
    // Load existing products
    const existingProducts = await loadExistingProducts();
    console.log(`📦 기존 상품 수: ${existingProducts.length}개`);
    
    // Load scraped products
    const scrapedProducts = await loadScrapedProducts();
    console.log(`🆕 스크래핑된 상품 수: ${scrapedProducts.length}개`);
    
    // Create result object
    const result: RegistrationResult = {
      totalScrapedProducts: scrapedProducts.length,
      newProductsAdded: 0,
      duplicatesSkipped: 0,
      errors: 0,
      registeredProducts: [],
      duplicateIds: []
    };
    
    // Get existing product IDs for duplicate checking
    const existingIds = new Set(existingProducts.map(p => p.id));
    
    // Process scraped products
    console.log('\\n🔍 상품 등록 처리 중...');
    
    for (const product of scrapedProducts) {
      try {
        if (existingIds.has(product.id)) {
          console.log(`⚠️ 중복 상품 스킵: ${product.name} (${product.id})`);
          result.duplicatesSkipped++;
          result.duplicateIds.push(product.id);
        } else {
          // Add product to existing products
          existingProducts.push(product);
          result.registeredProducts.push(product);
          result.newProductsAdded++;
          console.log(`✅ 상품 추가: ${product.name} (${product.price.toLocaleString()}원)`);
        }
      } catch (error) {
        console.error(`❌ 상품 처리 실패: ${product.name} -`, error.message);
        result.errors++;
      }
    }
    
    // Save updated products
    if (result.newProductsAdded > 0) {
      await saveProducts(existingProducts);
    }
    
    // Save registration summary
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-registration-summary.json'),
      JSON.stringify(result, null, 2)
    );
    
    // Display summary
    console.log('\\n📊 등록 완료!');
    console.log(`✅ 새로 추가된 상품: ${result.newProductsAdded}개`);
    console.log(`⚠️ 중복으로 스킵된 상품: ${result.duplicatesSkipped}개`);
    console.log(`❌ 오류 발생 상품: ${result.errors}개`);
    console.log(`📦 총 상품 수: ${existingProducts.length}개`);
    
    // Show category breakdown
    if (result.registeredProducts.length > 0) {
      console.log('\\n📋 카테고리별 등록 상품:');
      const categoryCount: Record<string, number> = {};
      result.registeredProducts.forEach(product => {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      });
      
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}개`);
      });
      
      console.log('\\n🛍️ 등록된 상품 샘플:');
      result.registeredProducts.slice(0, 5).forEach(product => {
        console.log(`  - ${product.name}: ${product.price.toLocaleString()}원 (${product.category})`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 등록 실패:', error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;