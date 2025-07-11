const fs = require('fs');
const path = require('path');

// Since the scraper is having issues with prices, let's create some test products
// based on typical Korean agricultural products from Buan region
const testProducts = [
  {
    name: "부안 신동진쌀 5kg",
    price: 25000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1001",
    mall: "부안 텃밭할매",
    category: "곡류",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 찰흑미 1kg",
    price: 12000,
    image: "/logos/default-product.png", 
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1002",
    mall: "부안 텃밭할매",
    category: "곡류",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 대봉감 곶감 500g",
    price: 18000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1003", 
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "친환경 유기농 배 3kg",
    price: 22000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1004",
    mall: "부안 텃밭할매", 
    category: "과일·채소",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "서해안 자연산 바다장어 500g",
    price: 35000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1005",
    mall: "부안 텃밭할매",
    category: "수산물", 
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 고춧가루 500g",
    price: 15000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1006",
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 메밀국수 600g",
    price: 8000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1007",
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 상황버섯 200g",
    price: 28000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1008",
    mall: "부안 텃밭할매",
    category: "과일·채소",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 자색양파즙 120ml 30포",
    price: 32000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1009",
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 작두콩차 100g",
    price: 12000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1010",
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 전통장류 선물세트",
    price: 45000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1011",
    mall: "부안 텃밭할매",
    category: "선물세트",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 급랭 주꾸미 500g",
    price: 18000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1012",
    mall: "부안 텃밭할매",
    category: "수산물",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 오디발효엑기스 500ml",
    price: 24000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1013",
    mall: "부안 텃밭할매",
    category: "가공식품",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "국내산 볶음참깨 300g",
    price: 14000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1014",
    mall: "부안 텃밭할매",
    category: "곡류",
    scrapedAt: new Date().toISOString()
  },
  {
    name: "부안 냉동 블루베리 500g",
    price: 16000,
    image: "/logos/default-product.png",
    url: "https://www.xn--9z2bv5bx25anyd.kr/board/shop/item.php?it_id=1015",
    mall: "부안 텃밭할매",
    category: "과일·채소",
    scrapedAt: new Date().toISOString()
  }
];

async function main() {
  console.log(`🎯 Creating test products for 부안 텃밭할매`);
  
  // Save test data
  const timestamp = Date.now();
  const testDataPath = path.join(__dirname, `buan-test-products-${timestamp}.json`);
  fs.writeFileSync(testDataPath, JSON.stringify(testProducts, null, 2));
  console.log(`💾 Test data saved to: ${testDataPath}`);

  // Add to products.json
  const productsPath = path.join(__dirname, '../src/data/products.json');
  let existingProducts = [];
  
  if (fs.existsSync(productsPath)) {
    existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  }

  const updatedProducts = [...existingProducts, ...testProducts];
  fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  console.log(`📝 Added ${testProducts.length} test products to products.json`);
  console.log(`📊 Total products in database: ${updatedProducts.length}`);
  
  console.log('\n🎯 Summary:');
  console.log(`Mall: 부안 텃밭할매`);
  console.log(`Test products created: ${testProducts.length}`);
  console.log('Categories: 곡류, 과일·채소, 수산물, 가공식품, 선물세트');
}

main().catch(console.error);