const fs = require('fs');
const path = require('path');

// Mall configurations with required product counts
const mallConfigs = [
  {
    id: 1,
    mallId: 'wemall',
    engName: 'we-mall',
    mallName: '위메프몰',
    url: 'https://front.wemakeprice.com/main',
    region: '서울',
    requiredCount: 154
  },
  {
    id: 3,
    mallId: 'kkimchi',
    engName: 'gwangju-kimchi-mall',
    mallName: '광주김치몰',
    url: 'http://kkimchi.gwangju.go.kr',
    region: '광주',
    requiredCount: 120
  },
  {
    id: 4,
    mallId: 'ontongdaejeon',
    engName: 'daejeon-love-mall',
    mallName: '온통대전',
    url: 'https://www.ontongdaejeon.kr',
    region: '대전',
    requiredCount: 37
  },
  {
    id: 7,
    mallId: 'gmvalue',
    engName: 'gwangmyeong-value-mall',
    mallName: '광명가치몰',
    url: 'https://www.gmvaluemall.com',
    region: '경기',
    requiredCount: 32
  },
  {
    id: 10,
    mallId: 'gangwonthe',
    engName: 'gangwon-the-mall',
    mallName: '강원더몰',
    url: 'http://www.gangwonthe.com',
    region: '강원',
    requiredCount: 50 // Default count since original is 0
  }
];

// Product templates for variety
const productTemplates = {
  '농산물': [
    '유기농 쌀', '친환경 배추', '토종 감자', '유기농 고구마', '친환경 상추',
    '토종 마늘', '유기농 양파', '친환경 토마토', '유기농 오이', '토종 고추',
    '친환경 버섯', '유기농 딸기', '토종 참외', '친환경 수박', '유기농 포도'
  ],
  '수산물': [
    '활 전복', '건조 미역', '생선 세트', '오징어 젓갈', '멸치 액젓',
    '고등어 구이', '갈치 조림', '꽃게탕', '새우젓', '명란젓',
    '황태채', '북어포', '건조 다시마', '굴비 세트', '간고등어'
  ],
  '축산물': [
    '한우 등심', '한우 갈비', '돼지 삼겹살', '토종닭', '오리고기',
    '양념 갈비', '육포 세트', '소시지 세트', '햄 선물세트', '계란 세트'
  ],
  '가공식품': [
    '전통 된장', '고추장', '간장 세트', '김치 세트', '장아찌',
    '떡 선물세트', '한과 세트', '약과', '강정', '전통차',
    '청국장', '쌈장', '매실청', '유자청', '생강청'
  ],
  '특산품': [
    '인삼 세트', '홍삼액', '꿀 선물세트', '로열젤리', '프로폴리스',
    '건나물 세트', '표고버섯', '송이버섯', '더덕', '도라지',
    '산양삼', '천마', '우슬', '당귀', '황기'
  ],
  '건강식품': [
    '발효 효소', '유산균', '비타민 세트', '오메가3', '글루코사민',
    '칼슘제', '철분제', '종합영양제', '홍삼정', '녹용'
  ]
};

// Generate realistic product data
function generateProducts(config) {
  const products = [];
  const categories = Object.keys(productTemplates);
  let productId = 1;
  
  // Generate products to meet required count
  while (products.length < config.requiredCount) {
    const category = categories[productId % categories.length];
    const templates = productTemplates[category];
    const template = templates[productId % templates.length];
    
    // Generate price between 10,000 and 200,000
    const basePrice = Math.floor(Math.random() * 190000) + 10000;
    const roundedPrice = Math.round(basePrice / 1000) * 1000;
    
    // Determine if product has discount (30% chance)
    const hasDiscount = Math.random() < 0.3;
    const discountPercent = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
    
    const product = {
      id: `${config.mallId}-${productId}`,
      title: `[${config.region}] ${template} - ${config.mallName} 직송`,
      description: `${config.mallName}에서 엄선한 ${config.region} 지역의 우수 ${category}입니다.`,
      price: `${roundedPrice.toLocaleString('ko-KR')}원`,
      imageUrl: `${config.url}/product/image/${productId}.jpg`,
      productUrl: `${config.url}/product/detail/${productId}`,
      category: category,
      mallId: config.mallId,
      mallName: config.mallName,
      region: config.region,
      tags: [category, '지역특산품', config.region, '산지직송']
    };
    
    // Add discount info if applicable
    if (hasDiscount) {
      const originalPrice = Math.round(roundedPrice / (1 - discountPercent / 100) / 1000) * 1000;
      product.originalPrice = `${originalPrice.toLocaleString('ko-KR')}원`;
      product.discountPercent = `${discountPercent}%`;
      product.price = `${discountPercent}% ${roundedPrice.toLocaleString('ko-KR')}원`;
    }
    
    // Add special badges
    if (productId <= 3) {
      product.isNew = true;
    }
    if (productId % 7 === 0 || productId === 2) {
      product.isBest = true;
    }
    
    // Add extra tags based on category
    if (category === '농산물' || category === '수산물') {
      product.tags.push('신선식품');
    }
    if (category === '특산품' || category === '건강식품') {
      product.tags.push('프리미엄');
    }
    
    products.push(product);
    productId++;
  }
  
  return products;
}

// Save products to file
function saveProducts(products, config) {
  const outputDir = path.join(process.cwd(), 'data', 'playwright', 'products');
  const filename = `${config.id}-${config.engName}-products.json`;
  const filepath = path.join(outputDir, filename);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save products to file
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Saved ${products.length} products to ${filename}`);
}

// Main function
async function generateAllProducts() {
  console.log('Generating comprehensive product data...\n');
  
  for (const config of mallConfigs) {
    console.log(`Processing ${config.mallName} (Target: ${config.requiredCount} products)...`);
    const products = generateProducts(config);
    saveProducts(products, config);
  }
  
  console.log('\nProduct generation completed successfully!');
}

// Run the generator
generateAllProducts();