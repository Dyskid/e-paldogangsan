import puppeteer from 'puppeteer';
import { writeFileSync, readFileSync, existsSync } from 'fs';

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

async function scrapeWithPuppeteer(): Promise<void> {
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  const mallInfo = {
    id: 'ontongdaejeon',
    name: '온통대전몰 대전사랑몰',
    region: '대전광역시',
    tags: ['대전특산품', '지역상품', '로컬푸드', '대전사랑몰', '온통대전']
  };

  const allProducts: Product[] = [];
  const seenProductIds = new Set<string>();
  let totalErrors = 0;

  console.log('🚀 Starting Ontong Daejeon detailed scraping with Puppeteer...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to main page
    console.log('📋 Navigating to main page...');
    await page.goto(`${baseUrl}/onnuri/main`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for products to load
    await page.waitForSelector('.goods_list, .product-item, [class*="goods"]', { timeout: 10000 }).catch(() => {});

    // Extract product information from the page
    const products = await page.evaluate(() => {
      const productData: any[] = [];
      
      // Multiple selectors for different product list layouts
      const productSelectors = [
        '.goods_list li',
        '.goods_4ea li',
        '[class*="goods"] li',
        '.product_item',
        '.item_box'
      ];
      
      const allProducts = new Set<Element>();
      productSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(elem => allProducts.add(elem));
      });
      
      allProducts.forEach((elem: Element) => {
        try {
          // Extract product ID
          let productId = '';
          const onclickElem = elem.querySelector('[onclick*="fn_goGoodsDetail"]');
          if (onclickElem) {
            const onclick = onclickElem.getAttribute('onclick') || '';
            const match = onclick.match(/fn_goGoodsDetail\('(\d+)'/);
            if (match) {
              productId = match[1];
            }
          }
          
          if (!productId) {
            const linkElem = elem.querySelector('a[href*="goodsCd="]');
            if (linkElem) {
              const href = linkElem.getAttribute('href') || '';
              const match = href.match(/goodsCd=(\d+)/);
              if (match) {
                productId = match[1];
              }
            }
          }
          
          if (!productId) return;
          
          // Extract title
          let title = '';
          const titleSelectors = ['.goods_tit', '.tit', '.title', '[class*="tit"]', 'a'];
          for (const selector of titleSelectors) {
            const titleElem = elem.querySelector(selector);
            if (titleElem && titleElem.textContent) {
              title = titleElem.textContent.trim();
              if (title) break;
            }
          }
          
          // Clean title
          title = title.replace(/\[.*?\]/g, '').trim();
          
          // Extract price
          let price = '';
          let originalPrice = '';
          const priceElem = elem.querySelector('.price, .cost, [class*="price"]');
          if (priceElem && priceElem.textContent) {
            const priceText = priceElem.textContent;
            const discountMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원.*?→.*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
            if (discountMatch) {
              originalPrice = discountMatch[1] + '원';
              price = discountMatch[2] + '원';
            } else {
              const singlePriceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
              if (singlePriceMatch) {
                price = singlePriceMatch[1] + '원';
              }
            }
          }
          
          // Extract image URL
          let imageUrl = '';
          const imgElem = elem.querySelector('img');
          if (imgElem) {
            imageUrl = imgElem.getAttribute('src') || '';
          }
          
          // Extract category
          let category = '지역특산품';
          const categoryElem = elem.querySelector('.location, .category, [class*="cate"]');
          if (categoryElem && categoryElem.textContent) {
            category = categoryElem.textContent.trim();
          }
          
          productData.push({
            productId,
            title,
            price,
            originalPrice,
            imageUrl,
            category
          });
          
        } catch (error) {
          console.error('Error parsing product:', error);
        }
      });
      
      return productData;
    });

    console.log(`📦 Found ${products.length} products on main page`);

    // Now fetch detailed information for each product
    for (let i = 0; i < products.length; i++) {
      const productInfo = products[i];
      
      if (!productInfo.productId || seenProductIds.has(productInfo.productId)) {
        continue;
      }
      
      seenProductIds.add(productInfo.productId);
      
      console.log(`  📦 Fetching details for product ${i + 1}/${products.length}: ${productInfo.productId}`);
      
      try {
        const detailUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productInfo.productId}`;
        
        await page.goto(detailUrl, { 
          waitUntil: 'networkidle2',
          timeout: 20000 
        });

        // Wait for content to load
        await page.waitForSelector('.goods_name, .product_name, .price_area, .item_price', { timeout: 5000 }).catch(() => {});

        // Extract detailed information
        const details = await page.evaluate(() => {
          // Title
          let title = '';
          const titleSelectors = ['.goods_name', '.product_name', '.item_name', 'h2.name', 'h3.name'];
          for (const selector of titleSelectors) {
            const elem = document.querySelector(selector);
            if (elem && elem.textContent) {
              title = elem.textContent.trim();
              break;
            }
          }
          
          // Price
          let price = '';
          let originalPrice = '';
          
          // Check for sale price
          const salePriceElem = document.querySelector('.sale_price, .discount_price, .now_price');
          if (salePriceElem && salePriceElem.textContent) {
            const match = salePriceElem.textContent.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
            if (match) price = match[1] + '원';
          }
          
          // Check for original price
          const originalPriceElem = document.querySelector('.original_price, .before_price, .normal_price');
          if (originalPriceElem && originalPriceElem.textContent) {
            const match = originalPriceElem.textContent.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
            if (match) originalPrice = match[1] + '원';
          }
          
          // If no specific price elements, check general price area
          if (!price) {
            const priceArea = document.querySelector('.price_area, .price_info, .price_wrap, .item_price');
            if (priceArea && priceArea.textContent) {
              const priceText = priceArea.textContent;
              const discountMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원.*?→.*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
              if (discountMatch) {
                originalPrice = discountMatch[1] + '원';
                price = discountMatch[2] + '원';
              } else {
                const singleMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
                if (singleMatch) price = singleMatch[1] + '원';
              }
            }
          }
          
          // Image
          let imageUrl = '';
          const mainImg = document.querySelector('.goods_img img, .main_img img, .product_img img, #mainImage');
          if (mainImg) {
            imageUrl = mainImg.getAttribute('src') || '';
          }
          
          // Description
          let description = '';
          const descElem = document.querySelector('.goods_desc, .product_desc, .item_desc');
          if (descElem && descElem.textContent) {
            description = descElem.textContent.trim().substring(0, 200);
          }
          
          // Category from breadcrumb
          let category = '';
          const breadcrumb = document.querySelector('.breadcrumb, .location, .navi_location');
          if (breadcrumb) {
            const crumbs = Array.from(breadcrumb.querySelectorAll('a, span'))
              .map(el => el.textContent?.trim() || '')
              .filter(text => text && !text.includes('홈'));
            category = crumbs.join(' > ');
          }
          
          return {
            title: title || '',
            price: price || '',
            originalPrice: originalPrice || '',
            imageUrl: imageUrl || '',
            description: description || '',
            category: category || ''
          };
        });

        // Use extracted details or fallback to main page info
        const finalTitle = details.title || productInfo.title;
        const finalPrice = details.price || productInfo.price;
        const finalImageUrl = details.imageUrl || productInfo.imageUrl;
        
        if (!finalImageUrl.startsWith('http')) {
          details.imageUrl = finalImageUrl.startsWith('//') ? 'https:' + finalImageUrl : baseUrl + finalImageUrl;
        }

        // Determine if product is food/agricultural
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
          '옥수수', '감자', '고구마', '양파', '마늘', '파', '배추', '무', '당근', '오이'
        ];
        
        const titleLower = finalTitle.toLowerCase();
        const categoryLower = (details.category || productInfo.category || '').toLowerCase();
        
        const isFood = foodKeywords.some(keyword => 
          titleLower.includes(keyword) || categoryLower.includes(keyword)
        );

        const product: Product = {
          id: `ontongdaejeon-${productInfo.productId}`,
          title: finalTitle,
          description: details.description || '',
          price: finalPrice,
          originalPrice: details.originalPrice || productInfo.originalPrice || undefined,
          imageUrl: details.imageUrl,
          productUrl: detailUrl,
          category: details.category || productInfo.category || '지역특산품',
          mallId: mallInfo.id,
          mallName: mallInfo.name,
          region: mallInfo.region,
          tags: [...mallInfo.tags],
          isFood: isFood
        };
        
        if (isFood) {
          product.tags.push('식품');
        }
        
        allProducts.push(product);
        
      } catch (error) {
        console.log(`⚠️ Error fetching details for ${productInfo.productId}:`, error.message);
        totalErrors++;
      }
      
      // Add delay to avoid overwhelming the server
      await delay(1000);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }

  // Filter only food/agricultural products
  const foodProducts = allProducts.filter(p => p.isFood);
  
  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-detailed-all-products.json', JSON.stringify(allProducts, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-detailed-food-products.json', JSON.stringify(foodProducts, null, 2));
  
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
  
  writeFileSync('./scripts/output/ontongdaejeon-detailed-summary.json', JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Detailed Scraping Summary:');
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

// Run the scraper
scrapeWithPuppeteer().then(() => {
  console.log('\n✅ Ontong Daejeon detailed scraping completed!');
}).catch(console.error);