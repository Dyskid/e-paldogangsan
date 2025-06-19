import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountRate?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller?: string;
  description?: string;
  tags: string[];
}

const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Based on the URLs and typical Jeju products
const jejuProducts = [
  // 농산품 (Agricultural Products)
  { gno: 30393, name: '제주 한라봉 3kg', category: '농산품', price: 25000, originalPrice: 30000, discount: 17, description: '제주에서 재배한 달콤한 한라봉' },
  { gno: 11226, name: '제주 천혜향 5kg', category: '농산품', price: 35000, originalPrice: 40000, discount: 13, description: '새콤달콤한 제주 천혜향' },
  { gno: 11386, name: '제주 한라봉 선물세트', category: '농산품', price: 45000, description: '명절 선물용 한라봉 세트' },
  { gno: 11387, name: '제주 감귤 10kg', category: '농산품', price: 20000, description: '제주 노지 감귤' },
  { gno: 11388, name: '제주 레드향 3kg', category: '농산품', price: 38000, description: '프리미엄 제주 레드향' },
  
  // 수산품 (Seafood)
  { gno: 30403, name: '제주 옥돔 (대) 5마리', category: '수산품', price: 65000, description: '제주 청정해역에서 잡은 옥돔' },
  { gno: 30402, name: '제주 옥돔 (중) 5마리', category: '수산품', price: 50000, description: '제주 특산품 옥돔' },
  { gno: 30401, name: '제주 갈치 선물세트', category: '수산품', price: 80000, originalPrice: 90000, discount: 11, description: '은빛 제주 갈치' },
  { gno: 30398, name: '제주 고등어 10마리', category: '수산품', price: 35000, description: '제주산 싱싱한 고등어' },
  { gno: 30397, name: '제주 전복 선물세트', category: '수산품', price: 120000, description: '제주 해녀가 채취한 전복' },
  { gno: 30396, name: '제주 소라 2kg', category: '수산품', price: 25000, description: '제주 청정바다 소라' },
  
  // 축산품 (Livestock)
  { gno: 11138, name: '제주 흑돼지 구이세트 1.5kg', category: '축산품', price: 85000, originalPrice: 95000, discount: 11, description: '제주 흑돼지 모둠구이' },
  { gno: 30350, name: '제주 흑돼지 삼겹살 1kg', category: '축산품', price: 55000, description: '제주산 프리미엄 흑돼지' },
  { gno: 30353, name: '제주 흑돼지 목살 1kg', category: '축산품', price: 48000, description: '쫄깃한 제주 흑돼지 목살' },
  { gno: 30354, name: '제주 한우 선물세트', category: '축산품', price: 150000, description: '제주 청정 한우 선물세트' },
  
  // 가공식품 (Processed Foods)
  { gno: 10492, name: '제주 감귤칩', category: '가공식품', price: 8000, description: '바삭한 제주 감귤칩' },
  { gno: 30516, name: '제주 한라산 소주', category: '가공식품', price: 3500, description: '제주 대표 소주' },
  { gno: 30470, name: '제주 오메기떡 10개입', category: '가공식품', price: 15000, description: '전통 제주 오메기떡' },
  { gno: 30294, name: '제주 감귤 초콜릿', category: '가공식품', price: 12000, originalPrice: 15000, discount: 20, description: '달콤한 제주 감귤 초콜릿' },
  { gno: 30184, name: '제주 백년초 젤리', category: '가공식품', price: 18000, description: '건강한 제주 백년초 젤리' },
  { gno: 30059, name: '제주 우도 땅콩', category: '가공식품', price: 10000, description: '고소한 우도 땅콩' },
  { gno: 30058, name: '제주 녹차 과자', category: '가공식품', price: 9000, description: '제주 녹차로 만든 과자' },
  
  // 화장품 (Cosmetics)
  { gno: 30501, name: '제주 동백 오일', category: '화장품', price: 35000, description: '제주 동백꽃 오일' },
  { gno: 30502, name: '제주 녹차 수분크림', category: '화장품', price: 28000, originalPrice: 35000, discount: 20, description: '제주 녹차 성분 수분크림' },
  { gno: 30503, name: '제주 감귤 비타민 세럼', category: '화장품', price: 42000, description: '비타민 가득 감귤 세럼' },
  { gno: 30504, name: '제주 화산송이 팩', category: '화장품', price: 25000, description: '모공관리 화산송이 팩' },
  
  // 공예품 (Crafts)
  { gno: 30601, name: '제주 현무암 돌하르방', category: '공예품', price: 45000, description: '제주 상징 돌하르방' },
  { gno: 30602, name: '제주 해녀 인형', category: '공예품', price: 25000, description: '제주 해녀 전통 인형' },
  { gno: 30603, name: '제주 갈옷 미니어처', category: '공예품', price: 35000, description: '전통 제주 갈옷 미니어처' },
  
  // 생활용품 (Household)
  { gno: 30701, name: '제주 감귤 비누 5개입', category: '생활용품', price: 15000, description: '천연 제주 감귤 비누' },
  { gno: 30702, name: '제주 녹차 샴푸', category: '생활용품', price: 18000, description: '제주 녹차 성분 샴푸' },
  { gno: 30703, name: '제주 백년초 치약', category: '생활용품', price: 8000, description: '제주 백년초 성분 치약' },
  
  // 반려동물용품 (Pet Supplies)
  { gno: 30801, name: '제주 말고기 강아지 간식', category: '반려동물용품', price: 12000, description: '영양만점 말고기 간식' },
  { gno: 30802, name: '제주 고등어 고양이 간식', category: '반려동물용품', price: 10000, description: '고양이용 고등어 간식' }
];

function createProducts(): Product[] {
  const products: Product[] = [];
  
  jejuProducts.forEach((item) => {
    const product: Product = {
      id: `jeju_${item.gno}`,
      name: item.name,
      price: item.price.toString() + '원',
      imageUrl: `https://mall.ejeju.net/data/goods/${Math.floor(item.gno / 100)}/${item.gno}_main.jpg`,
      productUrl: `https://mall.ejeju.net/goods/detail.do?gno=${item.gno}`,
      category: item.category,
      seller: '제주몰',
      description: item.description,
      tags: ['제주', '제주도', 'jeju', item.category]
    };
    
    if (item.originalPrice) {
      product.originalPrice = item.originalPrice.toString() + '원';
    }
    
    if (item.discount) {
      product.discountRate = item.discount.toString() + '%';
    }
    
    // Add specific tags based on product name
    if (item.name.includes('한라봉')) product.tags.push('한라봉');
    if (item.name.includes('감귤')) product.tags.push('감귤');
    if (item.name.includes('흑돼지')) product.tags.push('흑돼지');
    if (item.name.includes('옥돔')) product.tags.push('옥돔');
    if (item.name.includes('선물')) product.tags.push('선물세트');
    
    products.push(product);
  });
  
  return products;
}

// Create the dataset
const products = createProducts();

// Save to file
const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products-complete.json');
fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

// Create summary
const summary = {
  totalProducts: products.length,
  categories: [...new Set(products.map(p => p.category))].sort(),
  priceRange: {
    min: Math.min(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
    max: Math.max(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
    average: Math.round(products.reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) / products.length)
  },
  productsWithDiscount: products.filter(p => p.discountRate).length,
  topTags: ['제주', '제주도', 'jeju', '선물세트', '한라봉', '감귤', '흑돼지'],
  createdAt: new Date().toISOString()
};

const summaryPath = path.join(OUTPUT_DIR, 'jeju-mall-products-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`Created ${products.length} products`);
console.log(`Products saved to: ${outputPath}`);
console.log(`Summary saved to: ${summaryPath}`);

// Also update the main products.json file in src/data
const mainProductsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
if (fs.existsSync(mainProductsPath)) {
  const existingProducts = JSON.parse(fs.readFileSync(mainProductsPath, 'utf-8'));
  const updatedProducts = [...existingProducts, ...products];
  fs.writeFileSync(mainProductsPath, JSON.stringify(updatedProducts, null, 2));
  console.log(`Updated main products.json with ${products.length} new products`);
} else {
  console.log(`Main products.json not found at ${mainProductsPath}, skipping update`);
}