import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
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

async function scrapeOntongDaejeonFixed(): Promise<void> {
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

  console.log('🔍 Starting fixed scraping of 대전사랑몰...');

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
      timeout: 30000
    });

    const $ = cheerio.load(mainResponse.data);
    
    // Find all product containers
    const productContainers = $('.goods_list li, .goods_4ea li');
    
    console.log(`Found ${productContainers.length} product containers`);

    productContainers.each((index, element) => {
      try {
        const $elem = $(element);
        
        // Extract product ID from onclick
        const onclickElem = $elem.find('[onclick*="fn_goGoodsDetail"]').first();
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
        
        // Extract title from dd.ellipsis_2 tag
        let title = '';
        const titleElem = $elem.find('dd.ellipsis_2');
        if (titleElem.length > 0) {
          title = titleElem.text().trim();
        } else {
          // Fallback to other selectors
          const altTitleElem = $elem.find('.goods_tit, .goods_name, figcaption');
          if (altTitleElem.length > 0) {
            title = altTitleElem.text().trim();
          }
        }
        
        // Clean title - remove tags like [로컬상품관]
        title = title.replace(/\[로컬상품관\]\s*/g, '').trim();
        
        // Extract location from span.location
        let location = '';
        const locationElem = $elem.find('span.location');
        if (locationElem.length > 0) {
          location = locationElem.text().trim();
        }
        
        // Extract price from span.price_wrap
        let price = '';
        let originalPrice = '';
        const priceWrapElem = $elem.find('span.price_wrap');
        if (priceWrapElem.length > 0) {
          const priceText = priceWrapElem.text();
          
          // Look for original price (crossed out)
          const originalPriceElem = priceWrapElem.find('del');
          if (originalPriceElem.length > 0) {
            const origPriceMatch = originalPriceElem.text().match(/(\d{1,3}(?:,\d{3})*)원/);
            if (origPriceMatch) {
              originalPrice = origPriceMatch[1] + '원';
            }
          }
          
          // Look for current price
          const currentPriceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)원(?!.*원)/);
          if (currentPriceMatch) {
            price = currentPriceMatch[1] + '원';
          }
        }
        
        // Extract image URL
        let imageUrl = '';
        const imgElem = $elem.find('img').first();
        if (imgElem.length > 0) {
          imageUrl = imgElem.attr('src') || '';
          // Clean up image URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : baseUrl + imageUrl;
          }
        }
        
        // Extract hashtags for additional categorization
        const hashtags: string[] = [];
        $elem.find('.hash_tag').each((i, tag) => {
          const tagText = $(tag).text().trim();
          if (tagText) {
            hashtags.push(tagText);
          }
        });
        
        // Determine category
        let category = '지역특산품';
        if (hashtags.includes('로컬상품관')) {
          category = '로컬상품관';
        } else if (hashtags.length > 0) {
          category = hashtags[0];
        }
        
        // Build product URL
        const productUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`;
        
        const product: Product = {
          id: `ontongdaejeon-${productId}`,
          title: title || `상품 ${productId}`,
          description: location || '',
          price: price,
          originalPrice: originalPrice || undefined,
          imageUrl: imageUrl,
          productUrl: productUrl,
          category: category,
          mallId: mallInfo.id,
          mallName: mallInfo.name,
          region: mallInfo.region,
          tags: [...mallInfo.tags, category, ...hashtags].filter((v, i, a) => a.indexOf(v) === i)
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

  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-products.json', JSON.stringify(allProducts, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-scrape-summary.json', JSON.stringify({
    totalProducts: allProducts.length,
    uniqueProducts: seenProductIds.size,
    errors: totalErrors,
    timestamp: new Date().toISOString(),
    categories: [...new Set(allProducts.map(p => p.category))],
    locations: [...new Set(allProducts.map(p => p.description).filter(Boolean))],
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
  console.log(`📂 Categories: ${[...new Set(allProducts.map(p => p.category))].join(', ')}`);
  
  if (allProducts.length > 0) {
    console.log('\n📦 Sample products:');
    allProducts.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price || '가격정보없음'}`);
      if (product.description) {
        console.log(`     📍 ${product.description}`);
      }
    });
  }
}

// Run the fixed scraper
scrapeOntongDaejeonFixed().then(() => {
  console.log('✅ 대전사랑몰 fixed scraping completed!');
}).catch(console.error);