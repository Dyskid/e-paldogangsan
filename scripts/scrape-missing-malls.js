const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Target malls with their IDs and information
const missingMalls = [
  // 경남 (7개)
  {
    id: 92,
    name: '김해온몰',
    region: '경남',
    urls: [
      'https://gimhaemall.kr',
      'https://www.gimhaemall.kr',
      'http://gimhaemall.kr',
      'https://gimhaemall.co.kr'
    ]
  },
  {
    id: 86,
    name: '남해몰',
    region: '경남',
    urls: [
      'https://enamhae.co.kr',
      'https://www.enamhae.co.kr',
      'https://namhaemall.co.kr',
      'https://namhaemall.com'
    ]
  },
  {
    id: 90,
    name: '진주드림',
    region: '경남',
    urls: [
      'https://jinjudream.com',
      'https://www.jinjudream.com',
      'https://jinjudream.co.kr',
      'https://jinjumall.com'
    ]
  },
  {
    id: 87,
    name: '산엔청',
    region: '경남',
    urls: [
      'https://sanencheong.com',
      'https://www.sanencheong.com',
      'https://sancheongmall.com',
      'https://sancheong.co.kr'
    ]
  },
  {
    id: 88,
    name: '공룡나라',
    region: '경남',
    urls: [
      'https://www.edinomall.com/shop/smain/index.php',
      'https://edinomall.com',
      'https://goseongmall.com',
      'https://dinosaurmall.co.kr'
    ]
  },
  {
    id: 89,
    name: '함양몰',
    region: '경남',
    urls: [
      'https://2900.co.kr',
      'https://www.2900.co.kr',
      'https://hamyangmall.co.kr',
      'https://hamyang.co.kr'
    ]
  },
  {
    id: 91,
    name: '함안몰',
    region: '경남',
    urls: [
      'https://hamanmall.com',
      'https://www.hamanmall.com',
      'https://hamanmall.co.kr',
      'https://haman.co.kr'
    ]
  },
  // 제주 (1개)
  {
    id: 93,
    name: '이제주몰',
    region: '제주',
    urls: [
      'https://ejejumall.co.kr',
      'https://www.ejejumall.co.kr',
      'https://ejejumall.com',
      'https://ejeju.net'
    ]
  },
  // 전남 (3개)
  {
    id: 53,
    name: '기찬들영암몰',
    region: '전남',
    urls: [
      'https://yeongammall.co.kr',
      'https://kichandul.co.kr',
      'https://yeongam.co.kr',
      'https://kichandulmall.com'
    ]
  },
  {
    id: 50,
    name: '순천로컬푸드함께가게',
    region: '전남',
    urls: [
      'https://sclocal.co.kr',
      'https://suncheonlocal.co.kr',
      'https://suncheonfood.co.kr',
      'https://suncheon.localfood.co.kr'
    ]
  },
  {
    id: 52,
    name: '장흥몰',
    region: '전남',
    urls: [
      'https://jangheungmall.co.kr',
      'https://sandeulhaerang.co.kr',
      'https://jangheung.co.kr',
      'https://jhmall.co.kr'
    ]
  },
  // 경북 (1개)
  {
    id: 65,
    name: '영주장날',
    region: '경북',
    urls: [
      'https://yeongjumall.co.kr',
      'https://yeongjujangnal.co.kr',
      'https://yeongju.co.kr',
      'https://yjmarket.co.kr'
    ]
  },
  // 충남 (1개) - 이미 scraped로 표시되어 있지만 요청에 포함됨
  {
    id: 30,
    name: '농사랑',
    region: '충남',
    urls: [
      'https://nongsarang.co.kr',
      'https://www.nongsarang.co.kr',
      'https://nongsarang.com',
      'https://farm-love.co.kr'
    ]
  }
];

// Product selectors to try
const productSelectors = [
  // Common Korean mall patterns
  'a[href*="/product/"]',
  'a[href*="/goods/"]',
  'a[href*="/item/"]',
  'a[href*="/shop/"]',
  '.product-link',
  '.goods-link',
  '.item-link',
  '.product-item',
  '.goods-item',
  'li.product',
  'div.product',
  '.prd-item',
  '.item-list a',
  '.goods_list a',
  '.product_list a',
  '.list_item a',
  // More specific patterns
  'a[href*="goods_view"]',
  'a[href*="product_detail"]',
  'a[href*="item_detail"]',
  '.thumb a',
  '.thumbnail a',
  '.img_box a',
  '.product_thumb a'
];

// Category URLs to check
const categoryPaths = [
  '/category',
  '/product',
  '/products',
  '/goods',
  '/shop',
  '/list',
  '/mall',
  '/store',
  '/market',
  '/category/all',
  '/product/list',
  '/goods/list',
  '/shop/list',
  '/product_list',
  '/goods_list.php',
  '/shop/goods/goods_list.php',
  '/front/productlist',
  '/product/list.html',
  '/html/product_list.php'
];

// Headers to use
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Helper function to extract product info
function extractProductInfo($, elem, baseUrl, mallInfo) {
  try {
    const $elem = $(elem);
    const href = $elem.attr('href') || $elem.find('a').first().attr('href');
    
    if (!href) return null;
    
    // Get product URL
    const productUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    
    // Skip if it's not a product URL
    if (productUrl.includes('#') || productUrl.includes('javascript:') || 
        productUrl.includes('category') || productUrl.includes('board')) {
      return null;
    }
    
    // Extract product ID from URL
    const idMatch = productUrl.match(/(?:no|id|idx|seq|code|pid|gno)=(\d+)/i) ||
                    productUrl.match(/\/(?:product|goods|item)\/(\d+)/);
    const id = idMatch ? idMatch[1] : Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Get product name
    let name = '';
    
    // Try various methods to get the name
    const nameSelectors = [
      '.name', '.title', '.product-name', '.goods-name', '.item-name',
      '.prd-name', '.prd_name', 'h3', 'h4', 'h5', 'strong', '.subject',
      '.product_name', '.goods_name', '.item_title'
    ];
    
    for (const selector of nameSelectors) {
      const found = $elem.find(selector).first().text().trim();
      if (found && found.length > 2) {
        name = found;
        break;
      }
    }
    
    // If no name found in child elements, try the element itself
    if (!name) {
      name = $elem.text().trim();
      // Clean up the name
      name = name.split('\n')[0].trim();
    }
    
    // Try to get from image alt
    if (!name || name.length < 3) {
      name = $elem.find('img').first().attr('alt') || '';
    }
    
    // Try to get from title attribute
    if (!name || name.length < 3) {
      name = $elem.attr('title') || $elem.find('a').first().attr('title') || '';
    }
    
    if (!name || name.length < 3) {
      return null;
    }
    
    // Clean up name
    name = name.replace(/\s+/g, ' ').trim();
    
    // Get image URL
    let imageUrl = '';
    const imgElem = $elem.find('img').first();
    if (imgElem.length) {
      imageUrl = imgElem.attr('src') || imgElem.attr('data-src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = new URL(imageUrl, baseUrl).href;
      }
    }
    
    // Extract price
    let price = '';
    const priceSelectors = [
      '.price', '.cost', '.amount', '.prd-price', '.product-price',
      '.goods-price', '.item-price', '.sell_price', '.consumer'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $elem.find(selector).first().text();
      const priceMatch = priceText.match(/[\d,]+/);
      if (priceMatch) {
        price = priceMatch[0].replace(/,/g, '') + '원';
        break;
      }
    }
    
    return {
      id: `${mallInfo.id}_${id}`,
      name: name,
      price: price || '가격문의',
      imageUrl: imageUrl || '',
      productUrl: productUrl,
      mallId: mallInfo.id,
      mallName: mallInfo.name,
      region: mallInfo.region
    };
    
  } catch (error) {
    return null;
  }
}

// Scrape a single URL
async function scrapeUrl(url, mallInfo) {
  console.log(`\n  🔍 Trying URL: ${url}`);
  const products = [];
  
  try {
    // First, try to access the main page
    const response = await axios.get(url, {
      headers,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    const $ = cheerio.load(response.data);
    console.log(`  ✅ Page loaded: ${$('title').text().trim()}`);
    
    // Try all product selectors
    for (const selector of productSelectors) {
      $(selector).each((i, elem) => {
        const product = extractProductInfo($, elem, url, mallInfo);
        if (product && !products.find(p => p.productUrl === product.productUrl)) {
          products.push(product);
        }
      });
    }
    
    console.log(`  📦 Found ${products.length} products on main page`);
    
    // If few products found, try category pages
    if (products.length < 5) {
      console.log(`  📂 Checking category pages...`);
      
      for (const categoryPath of categoryPaths) {
        try {
          const categoryUrl = new URL(categoryPath, url).href;
          const catResponse = await axios.get(categoryUrl, {
            headers,
            timeout: 15000
          });
          
          const $cat = cheerio.load(catResponse.data);
          
          for (const selector of productSelectors) {
            $cat(selector).each((i, elem) => {
              const product = extractProductInfo($cat, elem, categoryUrl, mallInfo);
              if (product && !products.find(p => p.productUrl === product.productUrl)) {
                products.push(product);
              }
            });
          }
          
          if (products.length > 10) break; // Stop if we have enough products
          
        } catch (catError) {
          // Skip failed category pages
        }
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  
  return products;
}

// Main scraping function
async function scrapeMissingMalls() {
  console.log('🚀 Starting focused scraping of 13 missing malls...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    totalMalls: missingMalls.length,
    successfulMalls: 0,
    totalProducts: 0,
    mallResults: []
  };
  
  for (const mall of missingMalls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏪 Scraping ${mall.name} (ID: ${mall.id}, Region: ${mall.region})`);
    console.log(`${'='.repeat(60)}`);
    
    const mallResult = {
      id: mall.id,
      name: mall.name,
      region: mall.region,
      products: [],
      triedUrls: [],
      success: false
    };
    
    // Try each URL for the mall
    for (const url of mall.urls) {
      mallResult.triedUrls.push(url);
      const products = await scrapeUrl(url, mall);
      
      if (products.length > 0) {
        // Remove duplicates
        products.forEach(product => {
          if (!mallResult.products.find(p => p.productUrl === product.productUrl)) {
            mallResult.products.push(product);
          }
        });
        
        console.log(`  ✅ Total unique products found: ${mallResult.products.length}`);
        
        // If we found products, mark as success
        if (mallResult.products.length > 0) {
          mallResult.success = true;
        }
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary for this mall
    console.log(`\n📊 ${mall.name} Summary:`);
    console.log(`  - URLs tried: ${mallResult.triedUrls.length}`);
    console.log(`  - Products found: ${mallResult.products.length}`);
    console.log(`  - Status: ${mallResult.success ? '✅ Success' : '❌ Failed'}`);
    
    if (mallResult.success) {
      results.successfulMalls++;
      results.totalProducts += mallResult.products.length;
      
      // Save individual mall products
      const outputDir = path.join(__dirname, 'output', 'missing-malls');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `${mall.id}-${mall.name.replace(/\s+/g, '-')}-products.json`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify({
        mall: mall,
        products: mallResult.products,
        scrapedAt: new Date().toISOString()
      }, null, 2), 'utf-8');
      
      console.log(`  💾 Saved to: ${filename}`);
    }
    
    results.mallResults.push(mallResult);
  }
  
  // Final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total malls attempted: ${results.totalMalls}`);
  console.log(`Successful malls: ${results.successfulMalls}`);
  console.log(`Failed malls: ${results.totalMalls - results.successfulMalls}`);
  console.log(`Total products scraped: ${results.totalProducts}`);
  console.log(`Average products per successful mall: ${results.successfulMalls > 0 ? Math.round(results.totalProducts / results.successfulMalls) : 0}`);
  
  // Save summary report
  const summaryPath = path.join(__dirname, 'output', 'missing-malls', 'scraping-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log(`\n📁 Summary report saved to: ${summaryPath}`);
  
  // List failed malls
  const failedMalls = results.mallResults.filter(m => !m.success);
  if (failedMalls.length > 0) {
    console.log('\n❌ Failed malls:');
    failedMalls.forEach(mall => {
      console.log(`  - ${mall.name} (ID: ${mall.id})`);
    });
  }
}

// Run the scraper
if (require.main === module) {
  scrapeMissingMalls().catch(console.error);
}

module.exports = { scrapeMissingMalls };