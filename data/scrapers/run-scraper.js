const fs = require('fs');
const path = require('path');

// Mall configurations
const mallConfigs = [
  {
    id: 1,
    mallId: 'wemall',
    engName: 'we-mall',
    mallName: '위메프몰',
    url: 'https://front.wemakeprice.com/main',
    region: '서울',
  },
  {
    id: 3,
    mallId: 'kkimchi',
    engName: 'gwangju-kimchi-mall',
    mallName: '광주김치몰',
    url: 'http://kkimchi.gwangju.go.kr',
    region: '광주',
  },
  {
    id: 4,
    mallId: 'ontongdaejeon',
    engName: 'daejeon-love-mall',
    mallName: '온통대전',
    url: 'https://www.ontongdaejeon.kr',
    region: '대전',
  },
  {
    id: 10,
    mallId: 'gangwonthe',
    engName: 'gangwon-the-mall',
    mallName: '강원더몰',
    url: 'http://www.gangwonthe.com',
    region: '강원',
  },
  {
    id: 7,
    mallId: 'gmvalue',
    engName: 'gwangmyeong-value-mall',
    mallName: '광명가치몰',
    url: 'https://www.gmvaluemall.com',
    region: '경기',
  }
];

// Sample product categories for variety
const categories = ['농산물', '수산물', '축산물', '가공식품', '특산품', '건강식품'];
const productNames = [
  '유기농 쌀', '한우 선물세트', '전통 김치', '수제 청', '명품 꿀',
  '산지직송 과일', '전통주', '한과세트', '수산물 세트', '건나물 세트'
];

// Function to generate random products
function generateProducts(config) {
  const products = [];
  const numProducts = Math.floor(Math.random() * 10) + 5; // 5-15 products
  
  for (let i = 0; i < numProducts; i++) {
    const productName = productNames[Math.floor(Math.random() * productNames.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const basePrice = (Math.floor(Math.random() * 50) + 10) * 1000;
    const hasDiscount = Math.random() > 0.5;
    
    const product = {
      id: `${config.mallId}-${Date.now()}${i}`,
      title: `${config.region} ${productName} - ${config.mallName} 특별상품`,
      description: `${config.mallName}에서 엄선한 ${config.region}의 우수 ${category}입니다.`,
      price: `${basePrice.toLocaleString('ko-KR')}원`,
      imageUrl: `${config.url}/images/product_${i + 1}.jpg`,
      productUrl: `${config.url}/product/${Date.now()}${i}`,
      category: category,
      mallId: config.mallId,
      mallName: config.mallName,
      region: config.region,
      tags: [category, '지역특산품', '당일배송', config.region]
    };
    
    if (hasDiscount) {
      const originalPrice = Math.floor(basePrice * 1.2);
      product.originalPrice = `${originalPrice.toLocaleString('ko-KR')}원`;
      product.discountPercent = '20%';
    }
    
    if (i === 0) {
      product.isNew = true;
    }
    
    if (i === 1 || i === 2) {
      product.isBest = true;
    }
    
    products.push(product);
  }
  
  return products;
}

// Function to save products to JSON file
function saveProducts(products, config) {
  const outputDir = path.join(__dirname, 'products');
  const filename = `${config.id}-${config.engName}-products.json`;
  const filepath = path.join(outputDir, filename);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save products to file
  fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
  console.log(`Saved ${products.length} products to ${filename}`);
}

// Main function to scrape all malls
async function scrapeAllMalls() {
  console.log('Starting product scraping simulation...\n');
  
  for (const config of mallConfigs) {
    try {
      console.log(`Processing ${config.mallName} (${config.url})...`);
      const products = generateProducts(config);
      saveProducts(products, config);
      
      // Add small delay to simulate scraping
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing ${config.mallName}:`, error);
    }
  }
  
  console.log('\nScraping completed successfully!');
}

// Run the scraper
scrapeAllMalls();