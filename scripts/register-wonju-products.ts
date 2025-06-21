import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

interface MainProduct {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  clickCount: number;
  lastVerified: string;
}

// Working products from console output with proper titles
const workingProducts: Partial<Product>[] = [
  { id: "108341", title: "스톤크릭 마일드롭 캡슐 크릭 [네스프레소 호환]", price: "6,000원" },
  { id: "108340", title: "스톤크릭 마일드롭 캡슐 스톤 [네스프레소 호환]", price: "6,000원" },
  { id: "108362", title: "CVG 셀레늄 동충하초찻죽", price: "35,000원" },
  { id: "108361", title: "GVC셀레늄 충초 미네랄(2개묶음할인적용)", price: "65,000원" },
  { id: "108398", title: "사시사철 미술 DIY", price: "2,500원" },
  { id: "108405", title: "그때 그 추억여행-옛놀이 속 숨은다른그림찾기", price: "3,500원" },
  { id: "108406", title: "동화 속 비밀찾기 대작전", price: "3,500원" },
  { id: "108407", title: "사계절 꽃다발 만들기 키트", price: "6,800원" },
  { id: "11884", title: "[나린뜰]싱싱구이란 (1판x30알)", price: "8,000원" },
  { id: "24177", title: "원주축협 치악산한우 등심 300g [1+등급/1++등급]", price: "33,000원" },
  { id: "42947", title: "[시골재래식품]시골재래 우렁버섯된장 2kg", price: "25,000원" },
  { id: "24955", title: "만낭포 곤드레 감자고기만두", price: "16,000원" },
  { id: "103486", title: "강원한우 불고기 300g, 1+등급 이상", price: "10,500원" },
  { id: "101314", title: "강원곳간 김치 고기 손만두 냉동 만두 1.2kg", price: "8,800원" },
  { id: "37", title: "만낭포 감자김치 손만두(1.4kg)", price: "16,000원" },
  { id: "103483", title: "강원한우 국거리 300g, 1+등급 이상", price: "10,500원" },
  { id: "107022", title: "네오플램 노블레스 3종세트 18편수+20양수+24전골", price: "90,000원" },
  { id: "106998", title: "휴플러스 목 승모근 어깨 마사지기 630 (CORDZERO-630)", price: "89,000원" },
  { id: "106893", title: "베터핑거 원더핸즈 쿡웨어+스토브 세트", price: "220,000원" },
  { id: "106815", title: "[에버스]동결건조 강원도나물 선물세트(곤드레3, 시래기 9개입)", price: "29,900원" },
  { id: "39361", title: "박장대소영농조합 강원도 복숭아잼 280gx3개", price: "25,000원" },
  { id: "103207", title: "[원주맛집 민병선식당] 묵은지닭볶음탕국내산 밀키트 1~2인", price: "23,900원" },
  { id: "101023", title: "[미라클5.5 ]한달커피 5종 드립백커피 선물세트(20개입)", price: "38,000원" },
  { id: "103845", title: "[상호맘]쫄깃한돈편육 300g(냉장)", price: "6,900원" },
  { id: "103851", title: "[상호맘]보양왕족발400g(냉장)", price: "9,900원" },
  { id: "40668", title: "[혜성식품]오마니국산생감자옹심이 1kg", price: "9,900원" },
  { id: "27989", title: "돈덕 60년찹쌀순대 500g", price: "6,300원" },
  { id: "32329", title: "[돈덕]돈덕한 고구마 국산순대 500g", price: "9,400원" },
  { id: "24943", title: "만낭포감자떡(1.7kg)", price: "19,000원" },
  { id: "106987", title: "대통령표창 호박고지 시루떡 팥 시루떡 개별포장 1kg", price: "15,900원" },
  { id: "27468", title: "나나니스캔디 아가씨사탕", price: "1,500원" },
  { id: "105031", title: "내몸날다 현미찹쌀유과 500g", price: "10,000원" },
  { id: "106985", title: "대통령표창 쑥설기 10개 설기 낱개 포장 냉동 떡 주문 택배 1kg", price: "13,000원" },
  { id: "106984", title: "대통령표창 꿀설기 10개 설기 낱개 포장 냉동 떡 주문 택배 1kg", price: "12,000원" },
  { id: "107085", title: "대통령표창 가래떡 떡국떡 당일생산 무설탕 개별포장 국내산 2.5kg", price: "16,900원" },
  { id: "103988", title: "[삼양식품] 짱구 115g x 12입", price: "16,500원" },
  { id: "106045", title: "[로로멜로] 프로즌스모어 구워먹는 마시멜로 프로즌크림", price: "4,000원" },
  { id: "100045", title: "보약 건대추 무게1kg 크기 초리(소자)", price: "13,000원" },
  { id: "41151", title: "보약 건대추 무게 1kg, 크기 상(소자)", price: "19,000원" },
  { id: "41149", title: "보약 건대추 무게 1kg, 크기 특(중자)", price: "29,000원" },
  { id: "41147", title: "보약 건대추 무게 1kg, 크기 별(대자)", price: "35,000원" },
  { id: "41146", title: "보약 건대추 무게 1kg, 크기 왕별(대)", price: "38,000원" },
  { id: "31122", title: "보약 건대추 무게 1kg 크기 왕별(특대자) 별(대자) 특(중자) 상(소자) 초리(소자)", price: "19,000원" },
  { id: "107077", title: "청강원 오미자청 700ml / 900ml", price: "18,000원" },
  { id: "44750", title: "횡성더덕,도라지 농가 직송 나물용도라지 상품1kg", price: "12,000원" },
  { id: "44303", title: "횡성더덕 특품 1kg", price: "25,000원" },
  { id: "103501", title: "횡성더덕농가 깐더덕 300g", price: "15,000원" },
  { id: "44751", title: "횡성더덕,도라지 농가 직송 나물용도라지 특품 1kg", price: "18,000원" },
  { id: "106737", title: "동결건조 강원도 나물 시래기, 곤드레 15개 골라담기", price: "43,800원" },
  { id: "2615", title: "횡성더덕등바구니기획세트(1.4kg)", price: "60,000원" },
  { id: "44314", title: "횡성더덕 상품 1kg", price: "22,000원" },
  { id: "103256", title: "[건강을그리다]2024년 국내산 저당 혼합5곡잡곡(1kg)", price: "7,260원" },
  { id: "103255", title: "[건강을그리다]2024년 국내산 유기농 귀리(1kg)", price: "7,430원" },
  { id: "103258", title: "[건강을그리다]2024년 국내산 서리태(500g, 1kg)", price: "6,980원" },
  { id: "103393", title: "[건강을그리다]2024년 국내산 유기농현미(4kg)", price: "19,160원" },
  { id: "103253", title: "[건강을그리다]2024년 국내산 유기농 찰보리(1kg)", price: "6,290원" },
  { id: "103259", title: "[건강을그리다]2024년 국내산 무농약 영양혼합15곡 (1kg)", price: "8,800원" },
  { id: "103250", title: "[건강을그리다]2024년 국내산 저당 호라산밀(1kg)", price: "6,470원" },
  { id: "103254", title: "[건강을그리다]2024년 국내산 찰기장(500g, 1kg)", price: "6,840원" }
];

function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/[,원]/g, ''), 10) || 0;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const lowerTitle = title.toLowerCase();
  
  // Food categories
  if (lowerTitle.includes('한우') || lowerTitle.includes('쇠고기') || lowerTitle.includes('등심') || lowerTitle.includes('불고기') || lowerTitle.includes('국거리')) {
    return { category: '한우/육류', tags: ['한우', '육류', '강원도특산', '고급육', '1+등급'] };
  }
  
  if (lowerTitle.includes('만두') || lowerTitle.includes('곤드레') || lowerTitle.includes('감자')) {
    return { category: '만두/떡류', tags: ['만두', '곤드레', '감자', '강원도특산', '냉동식품'] };
  }
  
  if (lowerTitle.includes('대추') || lowerTitle.includes('건대추')) {
    return { category: '건과류', tags: ['대추', '건과류', '보양식품', '강원도특산', '건강식품'] };
  }
  
  if (lowerTitle.includes('더덕') || lowerTitle.includes('도라지')) {
    return { category: '나물/산채', tags: ['더덕', '도라지', '나물', '산채', '횡성특산', '건강식품'] };
  }
  
  if (lowerTitle.includes('떡') || lowerTitle.includes('시루떡') || lowerTitle.includes('설기') || lowerTitle.includes('가래떡')) {
    return { category: '떡류', tags: ['떡', '시루떡', '설기', '전통떡', '대통령표창', '원주특산'] };
  }
  
  if (lowerTitle.includes('순대')) {
    return { category: '순대/가공육', tags: ['순대', '찹쌀순대', '돈덕', '60년전통', '가공육'] };
  }
  
  if (lowerTitle.includes('잡곡') || lowerTitle.includes('현미') || lowerTitle.includes('귀리') || lowerTitle.includes('보리') || lowerTitle.includes('기장') || lowerTitle.includes('서리태')) {
    return { category: '곡류/잡곡', tags: ['잡곡', '건강곡류', '유기농', '국내산', '건강식품'] };
  }
  
  if (lowerTitle.includes('커피') || lowerTitle.includes('캡슐') || lowerTitle.includes('드립백')) {
    return { category: '커피/음료', tags: ['커피', '캡슐커피', '네스프레소', '드립백', '원주특산'] };
  }
  
  if (lowerTitle.includes('된장') || lowerTitle.includes('잼') || lowerTitle.includes('오미자청')) {
    return { category: '장류/가공식품', tags: ['장류', '잼', '청', '발효식품', '전통식품'] };
  }
  
  if (lowerTitle.includes('동충하초') || lowerTitle.includes('셀레늄')) {
    return { category: '건강식품', tags: ['동충하초', '셀레늄', '건강식품', '면역력', '보양식품'] };
  }
  
  // Non-food categories
  if (lowerTitle.includes('마사지') || lowerTitle.includes('쿡웨어') || lowerTitle.includes('세트')) {
    return { category: '생활용품', tags: ['생활용품', '마사지기', '쿡웨어', '주방용품'] };
  }
  
  if (lowerTitle.includes('diy') || lowerTitle.includes('교보재') || lowerTitle.includes('키트')) {
    return { category: '교육/취미', tags: ['교육', '취미', 'DIY', '키트', '교보재'] };
  }
  
  if (lowerTitle.includes('사탕') || lowerTitle.includes('캔디') || lowerTitle.includes('유과') || lowerTitle.includes('마시멜로')) {
    return { category: '과자/간식', tags: ['과자', '간식', '사탕', '전통과자', '디저트'] };
  }
  
  return { category: '원주특산품', tags: ['원주특산', '강원도특산'] };
}

async function registerWonjuProducts() {
  console.log('🚀 Starting Wonju Mall product registration...');
  
  try {
    // Read existing products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts: MainProduct[] = [];
    
    if (fs.existsSync(productsPath)) {
      const productsData = fs.readFileSync(productsPath, 'utf-8');
      existingProducts = JSON.parse(productsData);
      console.log(`📦 Found ${existingProducts.length} existing products`);
    }
    
    // Read original Wonju products for additional data
    const wonjuDataPath = path.join(__dirname, 'output/wonju-products.json');
    let originalWonjuProducts: Product[] = [];
    
    if (fs.existsSync(wonjuDataPath)) {
      const wonjuData = fs.readFileSync(wonjuDataPath, 'utf-8');
      originalWonjuProducts = JSON.parse(wonjuData);
      console.log(`📋 Found ${originalWonjuProducts.length} original Wonju products`);
    }
    
    // Remove existing Wonju products
    const nonWonjuProducts = existingProducts.filter(p => p.mallId !== 'wonju');
    console.log(`🗑️ Removed ${existingProducts.length - nonWonjuProducts.length} existing Wonju products`);
    
    // Process working products
    const newProducts: MainProduct[] = [];
    let registeredCount = 0;
    let skippedCount = 0;
    
    for (const workingProduct of workingProducts) {
      if (!workingProduct.id || !workingProduct.title || !workingProduct.price) {
        skippedCount++;
        continue;
      }
      
      // Find original product data
      const originalProduct = originalWonjuProducts.find(p => p.id === workingProduct.id);
      
      const { category, tags } = categorizeProduct(workingProduct.title);
      const price = parsePrice(workingProduct.price);
      
      if (price === 0) {
        console.log(`⚠️ Skipping product with invalid price: ${workingProduct.title}`);
        skippedCount++;
        continue;
      }
      
      const newProduct: MainProduct = {
        id: `wonju-${workingProduct.id}`,
        title: workingProduct.title,
        price: price,
        imageUrl: originalProduct?.imageUrl || '',
        productUrl: originalProduct?.productUrl || `https://wonju-mall.co.kr/goods/view?no=${workingProduct.id}`,
        category: category,
        description: originalProduct?.description || '',
        mallId: 'wonju',
        mallName: '원주몰',
        mallUrl: 'https://wonju-mall.co.kr',
        region: '강원도 원주시',
        tags: tags,
        featured: registeredCount < 5, // First 5 products as featured
        isNew: true,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      newProducts.push(newProduct);
      registeredCount++;
      
      console.log(`✅ ${registeredCount}/59 Registered: ${newProduct.title} - ${workingProduct.price} (${category})`);
    }
    
    // Combine with existing non-Wonju products
    const allProducts = [...nonWonjuProducts, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2), 'utf-8');
    
    // Create registration summary
    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '원주몰',
      mallId: 'wonju',
      totalProcessed: workingProducts.length,
      successfullyRegistered: registeredCount,
      skipped: skippedCount,
      totalProducts: allProducts.length,
      categories: [...new Set(newProducts.map(p => p.category))],
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category,
        tags: p.tags
      }))
    };
    
    const summaryPath = path.join(__dirname, 'output/wonju-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Successfully registered: ${registeredCount} products`);
    console.log(`⏭️ Skipped: ${skippedCount} products`);
    console.log(`📦 Total products in database: ${allProducts.length}`);
    console.log(`🏷️ Categories: ${summary.categories.join(', ')}`);
    console.log(`💾 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerWonjuProducts()
  .then(() => {
    console.log('🎉 Wonju Mall product registration completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Registration failed:', error);
    process.exit(1);
  });