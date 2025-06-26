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

interface CategoryInfo {
  name: string;
  url: string;
  isFood: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function isPageAccessible(url: string, httpsAgent: https.Agent): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      httpsAgent,
      timeout: 10000,
      maxRedirects: 5
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function scrapeProductDetails(productId: string, baseUrl: string, httpsAgent: https.Agent): Promise<Partial<Product> | null> {
  try {
    const detailUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`;
    
    const response = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': baseUrl
      },
      httpsAgent,
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract detailed information
    let title = $('.goods_name, .product_name, .item_name, h2.name, h3.name').first().text().trim();
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || '';
    }
    
    // Extract price information
    let price = '';
    let originalPrice = '';
    
    // Look for sale price
    const salePriceElem = $('.sale_price, .discount_price, .now_price');
    if (salePriceElem.length > 0) {
      const priceMatch = salePriceElem.text().match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
      if (priceMatch) {
        price = priceMatch[1] + '원';
      }
    }
    
    // Look for original price
    const originalPriceElem = $('.original_price, .before_price, .normal_price');
    if (originalPriceElem.length > 0) {
      const priceMatch = originalPriceElem.text().match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
      if (priceMatch) {
        originalPrice = priceMatch[1] + '원';
      }
    }
    
    // If no specific price elements, look for general price info
    if (!price) {
      const priceArea = $('.price_area, .price_info, .price_wrap, .item_price');
      const priceText = priceArea.text();
      
      // Check for discount pattern
      const discountMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원.*?→.*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
      if (discountMatch) {
        originalPrice = discountMatch[1] + '원';
        price = discountMatch[2] + '원';
      } else {
        // Single price
        const singlePriceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
        if (singlePriceMatch) {
          price = singlePriceMatch[1] + '원';
        }
      }
    }
    
    // Extract image
    let imageUrl = '';
    const mainImg = $('.goods_img img, .main_img img, .product_img img, #mainImage, .detail_img img').first();
    if (mainImg.length > 0) {
      imageUrl = mainImg.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : baseUrl + imageUrl;
      }
    }
    
    // Extract description
    let description = '';
    const descElem = $('.goods_desc, .product_desc, .item_desc, .detail_info');
    if (descElem.length > 0) {
      description = descElem.text().trim().substring(0, 200);
    }
    
    // Extract category from breadcrumb or navigation
    let category = '';
    const breadcrumb = $('.breadcrumb, .location, .navi_location');
    if (breadcrumb.length > 0) {
      const crumbs = breadcrumb.find('a, span').map((i, el) => $(el).text().trim()).get();
      category = crumbs.filter(c => c && !c.includes('홈')).join(' > ');
    }
    
    return {
      title: title || '',
      description: description,
      price: price,
      originalPrice: originalPrice || undefined,
      imageUrl: imageUrl,
      category: category || '지역특산품'
    };
    
  } catch (error) {
    console.log(`⚠️ Error fetching product details for ${productId}:`, error.message);
    return null;
  }
}

async function searchForCategories(baseUrl: string, httpsAgent: https.Agent): Promise<CategoryInfo[]> {
  const categories: CategoryInfo[] = [];
  
  try {
    console.log('🔍 Searching for category pages...');
    
    // Try the main store page
    const mainResponse = await axios.get(`${baseUrl}/onnuri/main`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      httpsAgent,
      timeout: 15000
    });
    
    const $ = cheerio.load(mainResponse.data);
    
    // Look for category links
    const categorySelectors = [
      '.category_list a',
      '.gnb_menu a',
      '.lnb_menu a',
      '.nav_category a',
      '[class*="category"] a',
      '.menu_list a'
    ];
    
    for (const selector of categorySelectors) {
      $(selector).each((i, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        if (href && text && !href.includes('javascript:')) {
          const fullUrl = href.startsWith('http') ? href : baseUrl + href;
          
          // Check if it's likely a food/agricultural category
          const foodKeywords = ['식품', '농산물', '축산물', '수산물', '가공식품', '특산물', '먹거리', '과일', '채소', '육류', '떡', '빵', '김치', '장류', '음료'];
          const isFood = foodKeywords.some(keyword => text.includes(keyword));
          
          categories.push({
            name: text,
            url: fullUrl,
            isFood: isFood
          });
        }
      });
    }
    
    // Try the local product page
    const localProductUrl = `${baseUrl}/onnuri/mall/localGoods`;
    if (await isPageAccessible(localProductUrl, httpsAgent)) {
      categories.push({
        name: '로컬상품',
        url: localProductUrl,
        isFood: true
      });
    }
    
    // Try store-specific pages
    const storeUrls = [
      { url: `${baseUrl}/onnuri/mall/goodsList?localGoodYn=Y`, name: '지역상품', isFood: true },
      { url: `${baseUrl}/onnuri/mall/goodsList?ctgryCd=10`, name: '식품', isFood: true },
      { url: `${baseUrl}/onnuri/mall/goodsList?ctgryCd=20`, name: '농산물', isFood: true }
    ];
    
    for (const store of storeUrls) {
      if (await isPageAccessible(store.url, httpsAgent)) {
        categories.push(store);
      }
    }
    
  } catch (error) {
    console.log('⚠️ Error searching for categories:', error.message);
  }
  
  return categories;
}

async function scrapeOntongDaejeonEnhanced(): Promise<void> {
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  const mallInfo = {
    id: 'ontongdaejeon',
    name: '대전사랑몰',
    region: '대전광역시',
    tags: ['대전특산품', '지역상품', '로컬푸드', '대전사랑몰', '온통대전']
  };

  const allProducts: Product[] = [];
  const seenProductIds = new Set<string>();
  let totalErrors = 0;

  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  console.log('🚀 Starting enhanced Ontong Daejeon scraping...');
  
  // Step 1: Find categories
  const categories = await searchForCategories(baseUrl, httpsAgent);
  console.log(`📂 Found ${categories.length} potential categories`);
  
  // Step 2: Scrape products from main page and categories
  const pagesToScrape = [
    { url: `${baseUrl}/onnuri/main`, name: 'Main Page' },
    ...categories.map(cat => ({ url: cat.url, name: cat.name }))
  ];
  
  for (const page of pagesToScrape) {
    try {
      console.log(`\n📋 Scraping ${page.name}...`);
      
      const response = await axios.get(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': baseUrl
        },
        httpsAgent,
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      
      // Find all product elements
      const productSelectors = [
        '.goods_list li',
        '.goods_4ea li',
        '[class*="goods"] li',
        '.product_item',
        '.item_box',
        '[class*="product_list"] li'
      ];
      
      let productElements = $();
      for (const selector of productSelectors) {
        productElements = productElements.add($(selector));
      }
      
      console.log(`Found ${productElements.length} product elements`);
      
      // Extract basic product info
      const productIds: string[] = [];
      
      productElements.each((index, element) => {
        try {
          const $elem = $(element);
          
          // Extract product ID
          let productId = '';
          
          // Method 1: onclick attribute
          const onclickElem = $elem.find('[onclick*="fn_goGoodsDetail"]');
          if (onclickElem.length > 0) {
            const onclick = onclickElem.attr('onclick');
            const match = onclick?.match(/fn_goGoodsDetail\('(\d+)'/);
            if (match) {
              productId = match[1];
            }
          }
          
          // Method 2: href attribute
          if (!productId) {
            const linkElem = $elem.find('a[href*="goodsCd="]');
            if (linkElem.length > 0) {
              const href = linkElem.attr('href');
              const match = href?.match(/goodsCd=(\d+)/);
              if (match) {
                productId = match[1];
              }
            }
          }
          
          if (productId && !seenProductIds.has(productId)) {
            productIds.push(productId);
            seenProductIds.add(productId);
          }
          
        } catch (error) {
          console.log(`⚠️ Error parsing product element: ${error}`);
          totalErrors++;
        }
      });
      
      console.log(`Extracted ${productIds.length} unique product IDs`);
      
      // Step 3: Fetch detailed information for each product
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];
        
        console.log(`  📦 Fetching product ${i + 1}/${productIds.length}: ${productId}`);
        
        const details = await scrapeProductDetails(productId, baseUrl, httpsAgent);
        
        if (details && details.title) {
          const product: Product = {
            id: `ontongdaejeon-${productId}`,
            title: details.title,
            description: details.description || '',
            price: details.price || '',
            originalPrice: details.originalPrice,
            imageUrl: details.imageUrl || '',
            productUrl: `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`,
            category: details.category || page.name,
            mallId: mallInfo.id,
            mallName: mallInfo.name,
            region: mallInfo.region,
            tags: [...mallInfo.tags],
            isFood: false
          };
          
          // Determine if product is food/agricultural
          const foodKeywords = [
            '쌀', '김치', '장', '된장', '고추장', '간장', '젓갈', '떡', '빵', '과자', '음료', 
            '차', '커피', '과일', '채소', '육류', '계란', '우유', '치즈', '수산물', '건어물',
            '나물', '버섯', '견과류', '꿀', '잼', '소스', '양념', '오일', '식초', '설탕', '소금',
            '국수', '라면', '파스타', '밀가루', '곡물', '콩', '두부', '묵', '어묵', '햄', '소시지',
            '통조림', '즉석식품', '냉동식품', '아이스크림', '요구르트', '주스', '탄산음료',
            '전통주', '막걸리', '소주', '맥주', '와인', '과채', '농산물', '축산물', '가공식품',
            '건강식품', '영양제', '비타민', '홍삼', '인삼', '한약재', '약초', '허브', '향신료'
          ];
          
          const titleLower = product.title.toLowerCase();
          const categoryLower = product.category.toLowerCase();
          
          product.isFood = foodKeywords.some(keyword => 
            titleLower.includes(keyword) || categoryLower.includes(keyword)
          );
          
          if (product.isFood) {
            product.tags.push('식품');
          }
          
          allProducts.push(product);
        }
        
        // Add delay to avoid overwhelming the server
        await delay(500);
      }
      
      // Add delay between pages
      await delay(1000);
      
    } catch (error) {
      console.error(`❌ Error scraping ${page.name}:`, error.message);
      totalErrors++;
    }
  }
  
  // Filter only food/agricultural products
  const foodProducts = allProducts.filter(p => p.isFood);
  
  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-enhanced-all-products.json', JSON.stringify(allProducts, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-enhanced-food-products.json', JSON.stringify(foodProducts, null, 2));
  
  const summary = {
    totalProducts: allProducts.length,
    foodProducts: foodProducts.length,
    uniqueProducts: seenProductIds.size,
    errors: totalErrors,
    timestamp: new Date().toISOString(),
    categories: [...new Set(allProducts.map(p => p.category))],
    priceInfo: {
      totalWithPrices: allProducts.filter(p => p.price).length,
      foodWithPrices: foodProducts.filter(p => p.price).length,
      withDiscounts: allProducts.filter(p => p.originalPrice).length
    }
  };
  
  writeFileSync('./scripts/output/ontongdaejeon-enhanced-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Enhanced Scraping Summary:');
  console.log(`✅ Total products scraped: ${allProducts.length}`);
  console.log(`🍎 Food/Agricultural products: ${foodProducts.length}`);
  console.log(`💰 Products with prices: ${summary.priceInfo.totalWithPrices}`);
  console.log(`🏷️ Products with discounts: ${summary.priceInfo.withDiscounts}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  
  if (foodProducts.length > 0) {
    console.log('\n🍎 Sample food products:');
    foodProducts.slice(0, 10).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price || '가격정보없음'}`);
    });
  }
}

// Run the enhanced scraper
scrapeOntongDaejeonEnhanced().then(() => {
  console.log('\n✅ Ontong Daejeon enhanced scraping completed!');
}).catch(console.error);