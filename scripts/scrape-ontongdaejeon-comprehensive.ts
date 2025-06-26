import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync } from 'fs';
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
}

async function scrapeOntongDaejeonComprehensive(): Promise<void> {
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

  console.log('🔍 Starting comprehensive scraping of 대전사랑몰...');

  // First, get all products from the main page
  try {
    console.log('📋 Fetching products from main page...');
    
    const mainResponse = await axios.get(`${baseUrl}/onnuri/main`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': baseUrl
      },
      httpsAgent,
      timeout: 20000
    });

    const $ = cheerio.load(mainResponse.data);
    
    // Extract products from the main page
    const productElements = $('.goods_list li, .goods_4ea li, [class*="goods"] li');
    
    console.log(`Found ${productElements.length} product elements on main page`);

    productElements.each((index, element) => {
      try {
        const $elem = $(element);
        
        // Extract product ID from onclick
        const onclickElem = $elem.find('[onclick*="fn_goGoodsDetail"]');
        let productId = '';
        if (onclickElem.length > 0) {
          const onclick = onclickElem.attr('onclick');
          const match = onclick?.match(/fn_goGoodsDetail\('(\d+)'/);
          if (match) {
            productId = match[1];
          }
        }
        
        if (!productId || seenProductIds.has(productId)) {
          return;
        }
        
        seenProductIds.add(productId);
        
        // Extract title
        let title = $elem.find('.goods_tit, .tit, .title, [class*="tit"]').text().trim();
        if (!title) {
          title = $elem.find('a').text().trim();
        }
        // Clean title - remove tags like [로컬상품관]
        title = title.replace(/\[.*?\]/g, '').trim();
        
        // Extract price
        let price = '';
        let originalPrice = '';
        const priceElem = $elem.find('.price, .cost, [class*="price"]');
        if (priceElem.length > 0) {
          const priceText = priceElem.text();
          // Extract discounted price and original price
          const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원.*?→.*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
          if (priceMatch) {
            originalPrice = priceMatch[1] + '원';
            price = priceMatch[2] + '원';
          } else {
            // Try to find regular price
            const singlePriceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)원/);
            if (singlePriceMatch) {
              price = singlePriceMatch[1] + '원';
            }
          }
        }
        
        // Extract image URL
        let imageUrl = '';
        const imgElem = $elem.find('img');
        if (imgElem.length > 0) {
          imageUrl = imgElem.attr('src') || '';
          // Clean up image URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : baseUrl + imageUrl;
          }
        }
        
        // Extract category/location
        let category = '지역특산품';
        const categoryElem = $elem.find('.location, .category, [class*="cate"]');
        if (categoryElem.length > 0) {
          const catText = categoryElem.text().trim();
          if (catText) {
            category = catText;
          }
        }
        
        // Build product URL
        const productUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`;
        
        const product: Product = {
          id: `ontongdaejeon-${productId}`,
          title: title || `상품 ${productId}`,
          description: '',
          price: price,
          originalPrice: originalPrice || undefined,
          imageUrl: imageUrl,
          productUrl: productUrl,
          category: category,
          mallId: mallInfo.id,
          mallName: mallInfo.name,
          region: mallInfo.region,
          tags: [...mallInfo.tags, category]
        };
        
        allProducts.push(product);
        
      } catch (error) {
        console.log(`⚠️ Error parsing product ${index}: ${error}`);
        totalErrors++;
      }
    });

  } catch (error) {
    console.error('❌ Error fetching main page:', error);
    totalErrors++;
  }

  // Try to fetch additional products from the store page
  try {
    console.log('\n📋 Checking 대전스토어 page...');
    
    const storeResponse = await axios.get(`${baseUrl}/asp/asp_main.ez?cspCd=mk-sijang`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': `${baseUrl}/onnuri/main`
      },
      httpsAgent,
      timeout: 20000,
      maxRedirects: 5
    });

    if (storeResponse.status === 200) {
      const $ = cheerio.load(storeResponse.data);
      // Look for additional products
      const storeProducts = $('.goods_list li, .product-item, [class*="goods"]');
      console.log(`Found ${storeProducts.length} potential products in store page`);
    }
    
  } catch (error) {
    console.log('⚠️ Could not access store page:', error);
  }

  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-products.json', JSON.stringify(allProducts, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-scrape-summary.json', JSON.stringify({
    totalProducts: allProducts.length,
    uniqueProducts: seenProductIds.size,
    errors: totalErrors,
    timestamp: new Date().toISOString(),
    categories: [...new Set(allProducts.map(p => p.category))],
    priceRange: {
      withPrices: allProducts.filter(p => p.price).length,
      withOriginalPrices: allProducts.filter(p => p.originalPrice).length
    }
  }, null, 2));

  console.log('\n📊 Scraping Summary:');
  console.log(`✅ Total products scraped: ${allProducts.length}`);
  console.log(`📦 Unique products: ${seenProductIds.size}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  console.log(`💰 Products with prices: ${allProducts.filter(p => p.price).length}`);
  console.log(`🏷️ Products with discounts: ${allProducts.filter(p => p.originalPrice).length}`);
  
  if (allProducts.length > 0) {
    console.log('\n📦 Sample products:');
    allProducts.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price || '가격정보없음'}`);
    });
  }
}

// Run the comprehensive scraper
scrapeOntongDaejeonComprehensive().then(() => {
  console.log('✅ 대전사랑몰 comprehensive scraping completed!');
}).catch(console.error);