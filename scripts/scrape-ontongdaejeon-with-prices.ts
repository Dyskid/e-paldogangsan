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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeOntongDaejeonWithPrices(): Promise<void> {
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
  let productsWithPrices = 0;

  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  console.log('🚀 Starting comprehensive Ontong Daejeon scraping with price extraction...');

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
        
        // Extract title
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
        
        // Extract price - this is key!
        let price = '';
        let originalPrice = '';
        
        // Look for price in dd.price_area > p.price structure
        const priceAreaElem = $elem.find('dd.price_area');
        if (priceAreaElem.length > 0) {
          const priceElem = priceAreaElem.find('p.price');
          if (priceElem.length > 0) {
            const priceText = priceElem.text().trim();
            // Extract price number and clean it
            const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
            if (priceMatch) {
              price = priceMatch[1] + '원';
            }
          }
        }
        
        // If no price found, try alternative selectors
        if (!price) {
          const altPriceElem = $elem.find('.price, .cost, [class*="price"]');
          if (altPriceElem.length > 0) {
            const priceText = altPriceElem.text().trim();
            const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
            if (priceMatch) {
              price = priceMatch[1] + '원';
            }
          }
        }
        
        // Skip products without extractable prices
        if (!price) {
          console.log(`  ⚠️ Skipping product ${productId} - no price found`);
          return;
        }
        
        // Extract location from span.location
        let location = '';
        const locationElem = $elem.find('span.location');
        if (locationElem.length > 0) {
          location = locationElem.text().trim();
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
        
        // Build product URL
        const productUrl = `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`;
        
        // Determine category
        let category = location || '지역특산품';
        
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
        productsWithPrices++;
        
        console.log(`  ✅ Product ${productId}: ${title} - ${price}`);
        
      } catch (error) {
        console.log(`⚠️ Error parsing product ${index}: ${error}`);
        totalErrors++;
      }
    });

    // Try to get more products from additional pages
    console.log('\n🔍 Looking for additional product pages...');
    
    // Try the local goods page
    try {
      const localGoodsUrl = `${baseUrl}/onnuri/mall/localGoods`;
      console.log(`📋 Checking local goods page: ${localGoodsUrl}`);
      
      const localResponse = await axios.get(localGoodsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': `${baseUrl}/onnuri/main`
        },
        httpsAgent,
        timeout: 30000
      });

      const $local = cheerio.load(localResponse.data);
      const localProducts = $local('.goods_list li, .goods_4ea li');
      
      console.log(`Found ${localProducts.length} products on local goods page`);
      
      localProducts.each((index, element) => {
        try {
          const $elem = $local(element);
          
          // Extract product ID
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
          
          // Extract title
          let title = '';
          const titleElem = $elem.find('dd.ellipsis_2');
          if (titleElem.length > 0) {
            title = titleElem.text().trim();
          }
          title = title.replace(/\[로컬상품관\]\s*/g, '').trim();
          
          // Extract price
          let price = '';
          const priceAreaElem = $elem.find('dd.price_area');
          if (priceAreaElem.length > 0) {
            const priceElem = priceAreaElem.find('p.price');
            if (priceElem.length > 0) {
              const priceText = priceElem.text().trim();
              const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
              if (priceMatch) {
                price = priceMatch[1] + '원';
              }
            }
          }
          
          if (!price) return; // Skip products without prices
          
          // Extract image URL
          let imageUrl = '';
          const imgElem = $elem.find('img');
          if (imgElem.length > 0) {
            imageUrl = imgElem.attr('src') || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = imageUrl.startsWith('//') ? 'https:' + imageUrl : baseUrl + imageUrl;
            }
          }
          
          const product: Product = {
            id: `ontongdaejeon-${productId}`,
            title: title || `상품 ${productId}`,
            description: '',
            price: price,
            imageUrl: imageUrl,
            productUrl: `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${productId}`,
            category: '로컬상품',
            mallId: mallInfo.id,
            mallName: mallInfo.name,
            region: mallInfo.region,
            tags: [...mallInfo.tags, '로컬상품']
          };
          
          allProducts.push(product);
          productsWithPrices++;
          
          console.log(`  ✅ Local Product ${productId}: ${title} - ${price}`);
          
        } catch (error) {
          console.log(`⚠️ Error parsing local product ${index}: ${error}`);
          totalErrors++;
        }
      });
      
    } catch (localError) {
      console.log(`⚠️ Could not access local goods page: ${localError.message}`);
    }

  } catch (error) {
    console.error('❌ Error fetching main page:', error);
    totalErrors++;
  }

  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-products-with-prices.json', JSON.stringify(allProducts, null, 2));
  
  const summary = {
    totalProducts: allProducts.length,
    productsWithPrices: productsWithPrices,
    uniqueProducts: seenProductIds.size,
    errors: totalErrors,
    timestamp: new Date().toISOString(),
    categories: [...new Set(allProducts.map(p => p.category))],
    priceRange: {
      withPrices: allProducts.filter(p => p.price).length,
      withOriginalPrices: allProducts.filter(p => p.originalPrice).length
    },
    sampleProducts: allProducts.slice(0, 10).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category
    }))
  };
  
  writeFileSync('./scripts/output/ontongdaejeon-with-prices-summary.json', JSON.stringify(summary, null, 2));

  console.log('\n📊 Scraping Summary:');
  console.log(`✅ Total products with prices: ${allProducts.length}`);
  console.log(`📦 Unique products: ${seenProductIds.size}`);
  console.log(`💰 Products with valid prices: ${summary.priceRange.withPrices}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  
  if (allProducts.length > 0) {
    console.log('\n📦 Sample products with prices:');
    allProducts.slice(0, 10).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price}`);
    });
  }
}

// Run the scraper
scrapeOntongDaejeonWithPrices().then(() => {
  console.log('✅ Ontong Daejeon scraping with prices completed!');
}).catch(console.error);