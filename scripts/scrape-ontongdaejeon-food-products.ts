import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import * as https from 'https';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
  isFood?: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeProductDetail(productId: string, baseUrl: string, httpsAgent: https.Agent): Promise<Partial<Product> | null> {
  try {
    const detailUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`;
    console.log(`    Fetching: ${detailUrl}`);
    
    const response = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': `${baseUrl}/onnuri/main`
      },
      httpsAgent,
      timeout: 20000
    });

    const $ = cheerio.load(response.data);
    
    // Extract title
    let title = '';
    const titleSelectors = [
      'h2.goods_detail_title',
      'h3.goods_detail_title',
      '.goods_detail_title',
      '.detail_title',
      '.product_title',
      'h2.title',
      'h3.title'
    ];
    
    for (const selector of titleSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0) {
        title = elem.text().trim();
        if (title) break;
      }
    }
    
    // Extract price - look for specific price patterns
    let price = '';
    let originalPrice = '';
    
    // Method 1: Look for price in script tags
    const scriptContents = $('script').text();
    const priceMatch = scriptContents.match(/goodsAmt["\s]*[:=]\s*["']?(\d+)["']?/);
    if (priceMatch) {
      const priceNum = parseInt(priceMatch[1]);
      if (priceNum > 0) {
        price = priceNum.toLocaleString('ko-KR') + '원';
      }
    }
    
    // Method 2: Look for price in specific elements
    if (!price) {
      const priceSelectors = [
        '.detail_price .price',
        '.goods_detail_price',
        '.detail_price',
        '.price_area .price',
        '.product_price',
        'dd.price',
        '.cost'
      ];
      
      for (const selector of priceSelectors) {
        const elem = $(selector).first();
        if (elem.length > 0) {
          const text = elem.text();
          const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
          if (match) {
            price = match[1] + '원';
            break;
          }
        }
      }
    }
    
    // Method 3: Look for price in table format
    if (!price) {
      $('table tr').each((i, row) => {
        const $row = $(row);
        const label = $row.find('th').text().trim();
        if (label.includes('판매가') || label.includes('가격')) {
          const value = $row.find('td').text();
          const match = value.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
          if (match) {
            price = match[1] + '원';
          }
        }
      });
    }
    
    // Extract image
    let imageUrl = '';
    const imageSelectors = [
      '.goods_detail_img img',
      '.detail_img img',
      '.product_img img',
      '.main_img img',
      '#mainImage'
    ];
    
    for (const selector of imageSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0) {
        imageUrl = elem.attr('src') || '';
        if (imageUrl) {
          if (!imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : baseUrl + imageUrl;
          }
          break;
        }
      }
    }
    
    // Extract description
    let description = '';
    const descSelectors = [
      '.goods_detail_desc',
      '.detail_desc',
      '.product_desc',
      '.goods_explain'
    ];
    
    for (const selector of descSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0) {
        description = elem.text().trim().substring(0, 200);
        if (description) break;
      }
    }
    
    return {
      title: title || '',
      price: price || '',
      originalPrice: originalPrice || undefined,
      imageUrl: imageUrl || '',
      description: description || ''
    };
    
  } catch (error) {
    console.log(`    ⚠️ Error: ${error.message}`);
    return null;
  }
}

async function scrapeOntongDaejeonFoodProducts(): Promise<void> {
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  const mallInfo = {
    id: 'ontongdaejeon',
    name: '대전사랑몰',
    region: '대전광역시',
    tags: ['대전특산품', '지역상품', '로컬푸드', '대전사랑몰', '온통대전']
  };

  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  console.log('🚀 Starting Ontong Daejeon food products scraping...');

  // Read existing products to get IDs
  let existingProducts: any[] = [];
  try {
    const data = readFileSync('./scripts/output/ontongdaejeon-products.json', 'utf-8');
    existingProducts = JSON.parse(data);
    console.log(`📦 Found ${existingProducts.length} existing products`);
  } catch (error) {
    console.error('❌ Could not read existing products');
    return;
  }

  // Food keywords for filtering
  const foodKeywords = [
    '쌀', '김치', '장', '된장', '고추장', '간장', '젓갈', '떡', '빵', '과자', '음료', 
    '차', '커피', '과일', '채소', '육류', '계란', '우유', '치즈', '수산물', '건어물',
    '나물', '버섯', '견과류', '꿀', '잼', '소스', '양념', '오일', '식초', '설탕', '소금',
    '국수', '라면', '파스타', '밀가루', '곡물', '콩', '두부', '묵', '어묵', '햄', '소시지',
    '통조림', '즉석식품', '냉동식품', '아이스크림', '요구르트', '주스', '탄산음료',
    '전통주', '막걸리', '소주', '맥주', '와인', '과채', '농산물', '축산물', '가공식품',
    '건강식품', '영양제', '비타민', '홍삼', '인삼', '한약재', '약초', '허브', '향신료',
    '먹거리', '식료품', '식자재', '반찬', '절임', '장아찌', '김', '미역', '다시마',
    '고기', '닭', '돼지', '소고기', '닭고기', '돼지고기', '생선', '새우', '오징어',
    '옥수수', '감자', '고구마', '양파', '마늘', '파', '배추', '무', '당근', '오이',
    '우동', '한우', '사과', '토마토', '당근', '장어', '프로폴리스', '아몬드', '견과',
    '배도라지', '갈비', '크래커', '알탕', '해물탕', '낙곱새'
  ];

  // Filter potential food products based on title
  const potentialFoodProducts = existingProducts.filter(product => {
    const titleLower = product.title.toLowerCase();
    return foodKeywords.some(keyword => titleLower.includes(keyword));
  });

  console.log(`🍎 Found ${potentialFoodProducts.length} potential food products`);

  const allProducts: Product[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Process each potential food product
  for (let i = 0; i < potentialFoodProducts.length; i++) {
    const product = potentialFoodProducts[i];
    const productId = product.id.replace('ontongdaejeon-', '');
    
    console.log(`\n📦 Processing ${i + 1}/${potentialFoodProducts.length}: ${product.title}`);
    
    try {
      const details = await scrapeProductDetail(productId, baseUrl, httpsAgent);
      
      if (details) {
        const finalProduct: Product = {
          ...product,
          title: details.title || product.title,
          description: details.description || product.description || '',
          price: details.price || product.price || '',
          originalPrice: details.originalPrice || product.originalPrice,
          imageUrl: details.imageUrl || product.imageUrl,
          isFood: true,
          tags: [...product.tags, '식품']
        };
        
        if (details.price) {
          console.log(`    ✅ Got price: ${details.price}`);
          successCount++;
        } else {
          console.log(`    ⚠️ No price found`);
        }
        
        allProducts.push(finalProduct);
      }
      
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      errorCount++;
    }
    
    // Add delay to avoid overwhelming the server
    await delay(1000);
  }

  // Save results
  const foodProductsWithPrices = allProducts.filter(p => p.price);
  
  writeFileSync('./scripts/output/ontongdaejeon-food-products.json', JSON.stringify(allProducts, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-food-products-with-prices.json', JSON.stringify(foodProductsWithPrices, null, 2));
  
  const summary = {
    totalProcessed: potentialFoodProducts.length,
    totalFoodProducts: allProducts.length,
    productsWithPrices: foodProductsWithPrices.length,
    successfulScrapes: successCount,
    errors: errorCount,
    timestamp: new Date().toISOString()
  };
  
  writeFileSync('./scripts/output/ontongdaejeon-food-scrape-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Food Products Scraping Summary:');
  console.log(`✅ Total processed: ${summary.totalProcessed}`);
  console.log(`🍎 Food products found: ${summary.totalFoodProducts}`);
  console.log(`💰 Products with prices: ${summary.productsWithPrices}`);
  console.log(`✅ Successful scrapes: ${summary.successfulScrapes}`);
  console.log(`❌ Errors: ${summary.errors}`);
  
  if (foodProductsWithPrices.length > 0) {
    console.log('\n🍎 Sample food products with prices:');
    foodProductsWithPrices.slice(0, 10).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price}`);
    });
  }
}

// Run the scraper
scrapeOntongDaejeonFoodProducts().then(() => {
  console.log('\n✅ Ontong Daejeon food products scraping completed!');
}).catch(console.error);