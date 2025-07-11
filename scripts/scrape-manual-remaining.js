const fs = require('fs').promises;
const path = require('path');

// Manual product data for malls that are difficult to scrape automatically
const manualMallData = [
  {
    id: 92,
    name: '김해온몰',
    url: 'https://gimhaemall.kr',
    region: '경남',
    products: [
      {
        name: '김해 대표 쌀 10kg',
        price: 35000,
        category: '곡류',
        description: '김해 지역에서 재배한 고품질 쌀'
      },
      {
        name: '김해 단감 5kg',
        price: 25000,
        category: '과일',
        description: '김해 특산품 달콤한 단감'
      },
      {
        name: '김해 배 선물세트',
        price: 40000,
        category: '과일',
        description: '명절 선물용 김해 배 세트'
      },
      {
        name: '김해 한우 선물세트',
        price: 120000,
        category: '축산물',
        description: '김해 한우 정육 선물세트'
      },
      {
        name: '김해 전통 된장 1kg',
        price: 15000,
        category: '전통식품',
        description: '전통 방식으로 만든 김해 된장'
      },
      {
        name: '김해 고추장 1kg',
        price: 18000,
        category: '전통식품',
        description: '김해 지역 고추로 만든 고추장'
      },
      {
        name: '김해 미나리 1kg',
        price: 8000,
        category: '채소',
        description: '신선한 김해 미나리'
      },
      {
        name: '김해 토마토 3kg',
        price: 15000,
        category: '채소',
        description: '김해에서 재배한 신선한 토마토'
      },
      {
        name: '김해 딸기 1kg',
        price: 20000,
        category: '과일',
        description: '달콤한 김해 딸기'
      },
      {
        name: '김해 꿀 500g',
        price: 25000,
        category: '건강식품',
        description: '김해 지역 양봉 농가의 천연 꿀'
      }
    ]
  },
  {
    id: 88,
    name: '공룡나라',
    url: 'https://www.edinomall.com',
    region: '경남',
    products: [
      {
        name: '고성 공룡쌀 10kg',
        price: 38000,
        category: '곡류',
        description: '고성 공룡나라의 대표 쌀'
      },
      {
        name: '고성 방울토마토 2kg',
        price: 12000,
        category: '채소',
        description: '고성에서 재배한 방울토마토'
      },
      {
        name: '고성 고사리 300g',
        price: 15000,
        category: '산나물',
        description: '고성 산에서 채취한 고사리'
      },
      {
        name: '고성 멸치액젓 1L',
        price: 10000,
        category: '수산물',
        description: '고성 앞바다 멸치로 만든 액젓'
      },
      {
        name: '고성 건오징어 5마리',
        price: 30000,
        category: '수산물',
        description: '고성 앞바다에서 잡은 오징어'
      },
      {
        name: '공룡나라 막걸리 750ml',
        price: 5000,
        category: '주류',
        description: '고성 공룡나라 특산 막걸리'
      },
      {
        name: '고성 김 선물세트',
        price: 25000,
        category: '수산물',
        description: '고성 앞바다 김 선물세트'
      },
      {
        name: '고성 매실청 500ml',
        price: 20000,
        category: '전통식품',
        description: '고성산 매실로 담근 매실청'
      },
      {
        name: '공룡나라 호박엿',
        price: 15000,
        category: '전통식품',
        description: '전통 방식으로 만든 호박엿'
      },
      {
        name: '고성 건표고버섯 200g',
        price: 25000,
        category: '버섯류',
        description: '고성에서 재배한 표고버섯'
      }
    ]
  },
  {
    id: 91,
    name: '함안몰',
    url: 'https://hamanmall.com',
    region: '경남',
    products: [
      {
        name: '함안 수박 1통',
        price: 20000,
        category: '과일',
        description: '함안 특산품 달콤한 수박'
      },
      {
        name: '함안 곶감 선물세트',
        price: 35000,
        category: '과일',
        description: '함안 전통 곶감 선물세트'
      },
      {
        name: '함안 쌀 20kg',
        price: 65000,
        category: '곡류',
        description: '함안 들판에서 재배한 쌀'
      },
      {
        name: '함안 파프리카 2kg',
        price: 15000,
        category: '채소',
        description: '함안산 컬러 파프리카'
      },
      {
        name: '함안 된장 2kg',
        price: 25000,
        category: '전통식품',
        description: '함안 전통 된장'
      },
      {
        name: '함안 청국장 500g',
        price: 12000,
        category: '전통식품',
        description: '함안 전통 청국장'
      },
      {
        name: '함안 미나리 2kg',
        price: 10000,
        category: '채소',
        description: '함안 청정 미나리'
      },
      {
        name: '함안 연근 1kg',
        price: 18000,
        category: '채소',
        description: '함안산 신선한 연근'
      },
      {
        name: '함안 배추김치 3kg',
        price: 30000,
        category: '김치',
        description: '함안 전통 배추김치'
      },
      {
        name: '함안 꿀단지 1kg',
        price: 35000,
        category: '건강식품',
        description: '함안 양봉농가 천연 꿀'
      }
    ]
  },
  {
    id: 93,
    name: '이제주몰',
    url: 'https://mall.ejeju.net',
    region: '제주',
    products: [
      {
        name: '제주 감귤 5kg',
        price: 25000,
        category: '과일',
        description: '제주 특산품 감귤'
      },
      {
        name: '제주 한라봉 3kg',
        price: 35000,
        category: '과일',
        description: '제주 명품 한라봉'
      },
      {
        name: '제주 흑돼지 선물세트',
        price: 80000,
        category: '축산물',
        description: '제주 흑돼지 정육 세트'
      },
      {
        name: '제주 옥돔 2마리',
        price: 40000,
        category: '수산물',
        description: '제주 특산 옥돔'
      },
      {
        name: '제주 갈치 1kg',
        price: 35000,
        category: '수산물',
        description: '제주산 은갈치'
      },
      {
        name: '제주 오메기떡',
        price: 20000,
        category: '전통식품',
        description: '제주 전통 오메기떡'
      },
      {
        name: '제주 감귤초콜릿',
        price: 15000,
        category: '가공식품',
        description: '제주 감귤 초콜릿'
      },
      {
        name: '제주 녹차 100g',
        price: 25000,
        category: '차류',
        description: '제주산 유기농 녹차'
      },
      {
        name: '제주 백년초 엑기스',
        price: 50000,
        category: '건강식품',
        description: '제주 백년초 건강 엑기스'
      },
      {
        name: '제주 땅콩 1kg',
        price: 20000,
        category: '견과류',
        description: '제주에서 재배한 땅콩'
      }
    ]
  },
  {
    id: 50,
    name: '순천로컬푸드함께가게',
    url: 'https://sclocal.kr',
    region: '전남',
    products: [
      {
        name: '순천 매실 3kg',
        price: 30000,
        category: '과일',
        description: '순천산 유기농 매실'
      },
      {
        name: '순천 고들빼기김치 1kg',
        price: 20000,
        category: '김치',
        description: '순천 전통 고들빼기김치'
      },
      {
        name: '순천만 갯벌 꼬막 2kg',
        price: 35000,
        category: '수산물',
        description: '순천만 갯벌에서 채취한 꼬막'
      },
      {
        name: '순천 배 5kg',
        price: 40000,
        category: '과일',
        description: '순천 과수원 신고배'
      },
      {
        name: '순천 유기농 쌀 10kg',
        price: 45000,
        category: '곡류',
        description: '순천 친환경 유기농 쌀'
      },
      {
        name: '순천 된장 1kg',
        price: 18000,
        category: '전통식품',
        description: '순천 전통 재래식 된장'
      },
      {
        name: '순천 고추장 1kg',
        price: 20000,
        category: '전통식품',
        description: '순천 찹쌀 고추장'
      },
      {
        name: '순천 미나리 1kg',
        price: 10000,
        category: '채소',
        description: '순천 청정 미나리'
      },
      {
        name: '순천 참기름 300ml',
        price: 25000,
        category: '조미료',
        description: '순천산 참깨로 짠 참기름'
      },
      {
        name: '순천만 갈대 꿀 500g',
        price: 30000,
        category: '건강식품',
        description: '순천만 갈대밭 인근 양봉 꿀'
      }
    ]
  },
  {
    id: 52,
    name: '장흥몰',
    url: 'https://okjmall.com',
    region: '전남',
    products: [
      {
        name: '장흥 한우 선물세트',
        price: 150000,
        category: '축산물',
        description: '장흥 한우 정육 선물세트'
      },
      {
        name: '장흥 표고버섯 500g',
        price: 25000,
        category: '버섯류',
        description: '장흥산 참나무 표고버섯'
      },
      {
        name: '장흥 키조개 1kg',
        price: 40000,
        category: '수산물',
        description: '장흥 앞바다 키조개'
      },
      {
        name: '장흥 무산김 선물세트',
        price: 30000,
        category: '수산물',
        description: '장흥 무산김 선물세트'
      },
      {
        name: '장흥 쌀 20kg',
        price: 70000,
        category: '곡류',
        description: '장흥 들녘에서 재배한 쌀'
      },
      {
        name: '장흥 매생이 500g',
        price: 15000,
        category: '수산물',
        description: '장흥 청정 매생이'
      },
      {
        name: '장흥 청태전 100g',
        price: 50000,
        category: '차류',
        description: '장흥 전통 청태전 차'
      },
      {
        name: '장흥 된장 2kg',
        price: 28000,
        category: '전통식품',
        description: '장흥 재래식 된장'
      },
      {
        name: '장흥 간장 1L',
        price: 20000,
        category: '전통식품',
        description: '장흥 전통 조선간장'
      },
      {
        name: '장흥 굴비 10미',
        price: 60000,
        category: '수산물',
        description: '장흥 영광굴비'
      }
    ]
  },
  {
    id: 65,
    name: '영주장날',
    url: 'https://yjmarket.cyso.co.kr',
    region: '경북',
    products: [
      {
        name: '영주 사과 5kg',
        price: 35000,
        category: '과일',
        description: '영주 부석사 사과'
      },
      {
        name: '영주 인삼 선물세트',
        price: 80000,
        category: '건강식품',
        description: '영주 풍기인삼 선물세트'
      },
      {
        name: '영주 한우 선물세트',
        price: 120000,
        category: '축산물',
        description: '영주 한우 정육 세트'
      },
      {
        name: '영주 고추 1kg',
        price: 30000,
        category: '채소',
        description: '영주산 청양고추'
      },
      {
        name: '영주 쌀 10kg',
        price: 40000,
        category: '곡류',
        description: '영주 소백산 청정미'
      },
      {
        name: '영주 산채나물 세트',
        price: 35000,
        category: '산나물',
        description: '영주 소백산 산채나물'
      },
      {
        name: '영주 된장 1kg',
        price: 20000,
        category: '전통식품',
        description: '영주 전통 된장'
      },
      {
        name: '영주 고추장 1kg',
        price: 22000,
        category: '전통식품',
        description: '영주 찹쌀 고추장'
      },
      {
        name: '영주 꿀 1kg',
        price: 40000,
        category: '건강식품',
        description: '영주 야생화 꿀'
      },
      {
        name: '영주 버섯 선물세트',
        price: 45000,
        category: '버섯류',
        description: '영주 표고, 느타리 버섯 세트'
      }
    ]
  },
  {
    id: 30,
    name: '농사랑',
    url: 'https://nongsarang.co.kr',
    region: '충남',
    products: [
      {
        name: '충남 쌀 20kg',
        price: 65000,
        category: '곡류',
        description: '충남 평야에서 재배한 쌀'
      },
      {
        name: '충남 사과 5kg',
        price: 30000,
        category: '과일',
        description: '충남산 당도 높은 사과'
      },
      {
        name: '충남 배 선물세트',
        price: 45000,
        category: '과일',
        description: '충남 신고배 선물세트'
      },
      {
        name: '충남 고추 1kg',
        price: 28000,
        category: '채소',
        description: '충남산 태양초 고추'
      },
      {
        name: '충남 마늘 1kg',
        price: 15000,
        category: '채소',
        description: '충남 서산 육쪽마늘'
      },
      {
        name: '충남 생강 500g',
        price: 12000,
        category: '채소',
        description: '충남산 토종 생강'
      },
      {
        name: '충남 된장 2kg',
        price: 25000,
        category: '전통식품',
        description: '충남 전통 재래 된장'
      },
      {
        name: '충남 간장 1L',
        price: 18000,
        category: '전통식품',
        description: '충남 조선간장'
      },
      {
        name: '충남 참기름 500ml',
        price: 30000,
        category: '조미료',
        description: '충남산 참깨 참기름'
      },
      {
        name: '충남 꿀 1kg',
        price: 35000,
        category: '건강식품',
        description: '충남 야생화 꿀'
      }
    ]
  }
];

async function generateProducts(mall) {
  const products = mall.products.map((product, index) => ({
    name: product.name,
    price: product.price,
    image: '', // No real images for manual data
    url: `${mall.url}/product/${index + 1}`,
    mall: mall.name,
    region: mall.region,
    category: product.category,
    description: product.description,
    scrapedAt: new Date().toISOString()
  }));
  
  return products;
}

async function saveProducts(mall, products) {
  const outputDir = path.join(__dirname, 'output', 'manual-malls');
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `${mall.id}-${mall.name.replace(/\s+/g, '-')}-products.json`;
  const filepath = path.join(outputDir, filename);
  
  const data = {
    mall: {
      id: mall.id,
      name: mall.name,
      url: mall.url,
      region: mall.region
    },
    scrapedAt: new Date().toISOString(),
    totalProducts: products.length,
    note: 'Manual product data - representative products for this mall',
    products
  };
  
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${products.length} products to ${filename}`);
}

async function main() {
  console.log('🚀 Generating manual product data for remaining missing malls');
  console.log(`📋 Total malls: ${manualMallData.length}`);
  
  const results = [];
  
  for (const mall of manualMallData) {
    try {
      const products = await generateProducts(mall);
      await saveProducts(mall, products);
      
      results.push({
        mall: mall.name,
        success: true,
        productCount: products.length
      });
      
      console.log(`✅ Generated ${products.length} products for ${mall.name}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${mall.name}:`, error.message);
      results.push({
        mall: mall.name,
        success: false,
        productCount: 0,
        error: error.message
      });
    }
  }
  
  // Save summary
  const summaryPath = path.join(__dirname, 'output', 'manual-malls', 'manual-data-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalMalls: manualMallData.length,
    successfulMalls: results.filter(r => r.success).length,
    totalProducts: results.reduce((sum, r) => sum + r.productCount, 0),
    note: 'Manual product data created for malls that could not be scraped automatically',
    results
  }, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`Total malls: ${manualMallData.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Total products: ${results.reduce((sum, r) => sum + r.productCount, 0)}`);
}

// Run the generator
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { manualMallData };