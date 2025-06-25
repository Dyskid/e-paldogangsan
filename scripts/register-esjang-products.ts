import fs from 'fs/promises';
import path from 'path';
import { Product } from '../src/types';

const PRODUCTS_FILE = path.join(__dirname, '..', 'src', 'data', 'products.json');
const SCRAPED_FILE = path.join(__dirname, 'output', 'esjang-products.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

interface ScrapedProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
}

interface RegistrationResult {
  totalScrapedProducts: number;
  newProductsAdded: number;
  duplicatesSkipped: number;
  errors: number;
  registeredProducts: Product[];
  duplicateIds: string[];
  categories: Record<string, number>;
  priceAnalysis: {
    withPrices: number;
    withoutPrices: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
  };
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

async function loadScrapedProducts(): Promise<ScrapedProduct[]> {
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

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove all non-numeric characters
  const cleanPrice = priceStr.replace(/[^0-9]/g, '');
  return parseInt(cleanPrice, 10) || 0;
}

function generateTags(productName: string): string[] {
  const tags: string[] = ['이천특산품', '경기도특산', '이천시장'];
  const nameLower = productName.toLowerCase();

  // Food and agricultural products
  if (nameLower.includes('쌀') || nameLower.includes('미')) {
    tags.push('쌀', '농산물', '이천쌀');
  }
  if (nameLower.includes('인삼') || nameLower.includes('홍삼') || nameLower.includes('수삼')) {
    tags.push('인삼', '홍삼', '건강식품', '음성특산');
  }
  if (nameLower.includes('한과')) {
    tags.push('한과', '전통과자', '수제한과', '전통식품');
  }
  if (nameLower.includes('표고버섯') || nameLower.includes('버섯')) {
    tags.push('표고버섯', '버섯', '유기농', '농산물');
  }
  if (nameLower.includes('곡') || nameLower.includes('잡곡')) {
    tags.push('잡곡', '혼합곡', '농산물', '건강식품');
  }
  if (nameLower.includes('음성')) {
    tags.push('음성', '음성특산', '충청북도');
  }
  
  // Non-food items
  if (nameLower.includes('다육') || nameLower.includes('화분')) {
    tags.push('다육식물', '화분', 'DIY', '원예');
  }

  // Price-based tags
  const price = parsePrice(productName);
  if (price >= 100000) {
    tags.push('프리미엄');
  }
  if (price >= 50000 && price < 100000) {
    tags.push('고급상품');
  }

  // Ensure unique tags
  return [...new Set(tags)];
}

function categorizeProduct(productName: string): string {
  const nameLower = productName.toLowerCase();

  // Priority categories
  if (nameLower.includes('인삼') || nameLower.includes('홍삼') || nameLower.includes('수삼')) {
    return '인삼/홍삼';
  }
  if (nameLower.includes('한과')) {
    return '전통과자';
  }
  if (nameLower.includes('표고버섯') || nameLower.includes('버섯')) {
    return '버섯류';
  }
  if (nameLower.includes('쌀') || nameLower.includes('미')) {
    return '쌀/곡류';
  }
  if (nameLower.includes('곡') || nameLower.includes('잡곡')) {
    return '잡곡류';
  }
  if (nameLower.includes('다육') || nameLower.includes('화분')) {
    return '원예/화훼';
  }
  if (nameLower.includes('음성장터') || nameLower.includes('명품작물')) {
    return '음성특산품';
  }

  return '이천특산품';
}

async function main() {
  try {
    await ensureOutputDir();
    
    console.log('🚀 이천시장(ESJang) 상품 등록 시작...');
    
    // Load existing products
    const existingProducts = await loadExistingProducts();
    console.log(`📦 기존 상품 수: ${existingProducts.length}개`);
    
    // Remove existing ESJang products to update them
    const nonEsjangProducts = existingProducts.filter(p => p.mall?.mallId !== 'esjang-mall');
    console.log(`🗑️ 기존 이천시장 상품 ${existingProducts.length - nonEsjangProducts.length}개 제거`);
    
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
      duplicateIds: [],
      categories: {},
      priceAnalysis: {
        withPrices: 0,
        withoutPrices: 0,
        averagePrice: 0,
        minPrice: Number.MAX_VALUE,
        maxPrice: 0
      }
    };
    
    // Process scraped products
    console.log('\n🔍 상품 등록 처리 중...');
    
    const processedProducts: Product[] = [];
    let totalPriceSum = 0;
    
    for (const scraped of scrapedProducts) {
      try {
        const price = parsePrice(scraped.price);
        
        if (price === 0) {
          console.log(`⚠️ 가격 정보 없음: ${scraped.name}`);
          result.priceAnalysis.withoutPrices++;
          result.errors++;
          continue;
        }
        
        // Update price analysis
        result.priceAnalysis.withPrices++;
        totalPriceSum += price;
        if (price < result.priceAnalysis.minPrice) result.priceAnalysis.minPrice = price;
        if (price > result.priceAnalysis.maxPrice) result.priceAnalysis.maxPrice = price;
        
        const category = categorizeProduct(scraped.name);
        const tags = generateTags(scraped.name);
        
        // Create product object
        const product: Product = {
          id: scraped.id,
          name: scraped.name,
          price: price,
          image: scraped.image,
          category: category,
          region: '경기도 이천시',
          url: scraped.url,
          description: `${scraped.name} - 이천시장 특산품`,
          tags: tags,
          isFeatured: price >= 50000, // Feature premium products
          isNew: true,
          mall: {
            mallId: 'esjang-mall',
            mallName: '이천시장',
            mallUrl: 'https://www.esjang.go.kr',
            region: '경기도 이천시'
          }
        };
        
        processedProducts.push(product);
        result.registeredProducts.push(product);
        result.newProductsAdded++;
        
        // Update category count
        result.categories[category] = (result.categories[category] || 0) + 1;
        
        console.log(`✅ 상품 추가: ${product.name} (${price.toLocaleString()}원, ${category})`);
        
      } catch (error) {
        console.error(`❌ 상품 처리 실패: ${scraped.name} -`, error.message);
        result.errors++;
      }
    }
    
    // Calculate average price
    if (result.priceAnalysis.withPrices > 0) {
      result.priceAnalysis.averagePrice = Math.round(totalPriceSum / result.priceAnalysis.withPrices);
    }
    
    // Combine with existing non-ESJang products
    const allProducts = [...nonEsjangProducts, ...processedProducts];
    
    // Save updated products
    if (result.newProductsAdded > 0) {
      await saveProducts(allProducts);
    }
    
    // Save registration summary
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'esjang-registration-summary.json'),
      JSON.stringify(result, null, 2)
    );
    
    // Display summary
    console.log('\n📊 등록 완료!');
    console.log(`✅ 새로 추가된 상품: ${result.newProductsAdded}개`);
    console.log(`⚠️ 중복으로 스킵된 상품: ${result.duplicatesSkipped}개`);
    console.log(`❌ 오류 발생 상품: ${result.errors}개`);
    console.log(`📦 총 상품 수: ${allProducts.length}개`);
    
    // Show price analysis
    console.log('\n💰 가격 분석:');
    console.log(`  가격 정보 있는 상품: ${result.priceAnalysis.withPrices}개`);
    console.log(`  가격 정보 없는 상품: ${result.priceAnalysis.withoutPrices}개`);
    console.log(`  평균 가격: ${result.priceAnalysis.averagePrice.toLocaleString()}원`);
    console.log(`  최저 가격: ${result.priceAnalysis.minPrice.toLocaleString()}원`);
    console.log(`  최고 가격: ${result.priceAnalysis.maxPrice.toLocaleString()}원`);
    
    // Show category breakdown
    if (Object.keys(result.categories).length > 0) {
      console.log('\n📋 카테고리별 등록 상품:');
      Object.entries(result.categories)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count}개`);
        });
    }
    
    // Show sample products
    if (result.registeredProducts.length > 0) {
      console.log('\n🛍️ 등록된 상품 샘플:');
      result.registeredProducts.slice(0, 5).forEach(product => {
        console.log(`  - ${product.name}: ${product.price.toLocaleString()}원 (${product.category})`);
        console.log(`    태그: ${product.tags.slice(0, 5).join(', ')}`);
      });
    }
    
    // Show featured products
    const featuredProducts = result.registeredProducts.filter(p => p.isFeatured);
    if (featuredProducts.length > 0) {
      console.log(`\n⭐ 추천 상품 (${featuredProducts.length}개):`);
      featuredProducts.slice(0, 3).forEach(product => {
        console.log(`  - ${product.name}: ${product.price.toLocaleString()}원`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 등록 실패:', error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 이천시장(ESJang) 상품 등록이 성공적으로 완료되었습니다!');
    })
    .catch((error) => {
      console.error('💥 등록 중 오류 발생:', error);
      process.exit(1);
    });
}

export default main;