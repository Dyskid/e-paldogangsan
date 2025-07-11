const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Remaining missing malls with specific scraping configurations
const targetedMalls = [
  {
    id: 92,
    name: '김해온몰',
    url: 'https://gimhaemall.kr',
    region: '경남',
    searchUrls: [
      'https://gimhaemall.kr/product/list.html',
      'https://gimhaemall.kr/shop/goods/goods_list.php',
      'https://gimhaemall.kr/goods',
      'https://gimhaemall.kr/product'
    ]
  },
  {
    id: 88,
    name: '공룡나라',
    url: 'https://www.edinomall.com',
    region: '경남',
    searchUrls: [
      'https://www.edinomall.com/shop/smain/index.php',
      'https://www.edinomall.com/shop/goods/goods_list.php',
      'https://www.edinomall.com/shop/goods/goods_list.php?category=001'
    ]
  },
  {
    id: 91,
    name: '함안몰',
    url: 'https://hamanmall.com',
    region: '경남',
    searchUrls: [
      'https://hamanmall.com/product/list.html',
      'https://hamanmall.com/goods',
      'https://hamanmall.com/shop'
    ]
  },
  {
    id: 93,
    name: '이제주몰',
    url: 'https://mall.ejeju.net',
    region: '제주',
    searchUrls: [
      'https://mall.ejeju.net/main/index.do',
      'https://mall.ejeju.net/goods/goodsList.do',
      'https://mall.ejeju.net/product/list.do'
    ]
  },
  {
    id: 53,
    name: '기찬들영암몰',
    url: 'https://yeongammall.co.kr',
    region: '전남',
    searchUrls: [
      'https://yeongammall.co.kr/product/list.html',
      'https://yeongammall.co.kr/goods',
      'https://yeongammall.co.kr/shop'
    ]
  },
  {
    id: 50,
    name: '순천로컬푸드함께가게',
    url: 'https://sclocal.kr',
    region: '전남',
    searchUrls: [
      'https://sclocal.kr/product/list.html',
      'https://sclocal.kr/goods',
      'https://sclocal.kr/shop/goods/goods_list.php'
    ]
  },
  {
    id: 52,
    name: '장흥몰',
    url: 'https://okjmall.com',
    region: '전남',
    searchUrls: [
      'https://okjmall.com/product/list.html',
      'https://okjmall.com/goods',
      'https://okjmall.com/shop'
    ]
  },
  {
    id: 65,
    name: '영주장날',
    url: 'https://yjmarket.cyso.co.kr',
    region: '경북',
    searchUrls: [
      'https://yjmarket.cyso.co.kr/shop/goods_list.php',
      'https://yjmarket.cyso.co.kr/goods/goods_list.php',
      'https://yjmarket.cyso.co.kr/product/list.php'
    ]
  },
  {
    id: 30,
    name: '농사랑',
    url: 'https://nongsarang.co.kr',
    region: '충남',
    searchUrls: [
      'https://nongsarang.co.kr/product/list.html',
      'https://nongsarang.co.kr/goods',
      'https://nongsarang.co.kr/shop/goods/goods_list.php'
    ]
  }
];

// Common product selectors across different mall platforms
const commonSelectors = {
  productList: [
    '.xans-product-normalpackage .xans-record-',
    '.prd_list > li',
    '.goods_list > li',
    '.product-list .product-item',
    '.item-list .item',
    '.goods-list-item',
    '.product_list_area li',
    '.item_list .item',
    '.list_goods > li',
    '.goods_wrap .goods',
    'ul.prdList > li',
    '.productList .product',
    '.ec-base-product li',
    '.shopList li',
    '.goodsList li'
  ],
  name: [
    '.name',
    '.prd_name',
    '.goods_name',
    '.item_name',
    '.product-name',
    '.item-name a',
    '.description .name a',
    '.prdName',
    '.title',
    '.goods-name',
    'p.name',
    '.info_name',
    '.txt_info strong'
  ],
  price: [
    '.price',
    '.prd_price',
    '.goods_price',
    '.item_price',
    '.product-price',
    '.xans-product-listitem',
    '.prdPrice',
    '.cost',
    '.sell_price',
    '.consumer',
    '.info_price',
    '.txt_price'
  ],
  image: [
    '.thumb img',
    '.prd_img img',
    '.goods_img img',
    '.item_img img',
    '.thumbnail img',
    '.prdImg img',
    '.box_thumb img',
    'img.MS_prod_img_s',
    '.thumb_img img',
    '.list_img img'
  ]
};

async function fetchPage(url, timeout = 15000) {
  try {
    console.log(`📡 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept any status code less than 500
      }
    });
    
    if (response.status !== 200) {
      console.log(`⚠️  Status ${response.status} for ${url}`);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error.message);
    return null;
  }
}

function extractText($element) {
  if (!$element || $element.length === 0) return '';
  
  // Get text and clean it
  let text = $element.text().trim();
  
  // Remove common prefixes
  text = text.replace(/^(상품명|제품명|품명)\s*:\s*/i, '');
  text = text.replace(/\s+/g, ' ');
  
  return text;
}

function extractPrice(priceElement) {
  if (!priceElement || priceElement.length === 0) return 0;
  
  let priceText = priceElement.text();
  
  // Also check for data attributes
  const dataPrice = priceElement.attr('data-price') || 
                   priceElement.attr('data-sell-price') ||
                   priceElement.find('[data-price]').attr('data-price');
  
  if (dataPrice) {
    const price = parseInt(dataPrice.replace(/[^0-9]/g, ''));
    if (price > 0) return price;
  }
  
  // Clean price text
  priceText = priceText.replace(/[^0-9]/g, '');
  const price = parseInt(priceText);
  
  return price > 0 ? price : 0;
}

function extractImage($element, $container, baseUrl) {
  // Try multiple ways to find image
  let img = $element;
  if (!img || img.length === 0) {
    img = $container.find('img').first();
  }
  
  let src = img.attr('src') || 
           img.attr('data-src') || 
           img.attr('data-original') ||
           img.attr('data-lazy-src') || '';
           
  if (!src) return '';
  
  // Handle relative URLs
  if (src.startsWith('//')) {
    src = 'https:' + src;
  } else if (src.startsWith('/')) {
    src = new URL(src, baseUrl).href;
  } else if (!src.startsWith('http')) {
    src = new URL(src, baseUrl).href;
  }
  
  return src;
}

async function scrapeWithSelectors(html, baseUrl, mallName) {
  const $ = cheerio.load(html);
  const products = [];
  
  // Try each product list selector
  for (const listSelector of commonSelectors.productList) {
    const productElements = $(listSelector);
    
    if (productElements.length > 0) {
      console.log(`🎯 Found ${productElements.length} products using selector: ${listSelector}`);
      
      productElements.slice(0, 30).each((index, element) => {
        const $product = $(element);
        
        // Extract name
        let name = '';
        for (const nameSelector of commonSelectors.name) {
          const nameElement = $product.find(nameSelector).first();
          name = extractText(nameElement);
          if (name && name.length > 2) break;
        }
        
        // Extract price
        let price = 0;
        for (const priceSelector of commonSelectors.price) {
          const priceElement = $product.find(priceSelector).first();
          price = extractPrice(priceElement);
          if (price > 0) break;
        }
        
        // Extract image
        let image = '';
        for (const imgSelector of commonSelectors.image) {
          const imgElement = $product.find(imgSelector).first();
          image = extractImage(imgElement, $product, baseUrl);
          if (image) break;
        }
        
        // Extract link
        let link = '';
        const linkElement = $product.find('a').first();
        const href = linkElement.attr('href');
        if (href) {
          if (href.startsWith('http')) {
            link = href;
          } else if (href.startsWith('//')) {
            link = 'https:' + href;
          } else if (href.startsWith('/')) {
            link = new URL(href, baseUrl).href;
          } else {
            link = new URL(href, baseUrl).href;
          }
        }
        
        // Add product if we have at least a name
        if (name && name.length > 2) {
          const product = {
            name,
            price: price || 0,
            image: image || '',
            url: link || baseUrl,
            mall: mallName,
            category: '기타',
            scrapedAt: new Date().toISOString()
          };
          
          // Skip if it's likely not a real product
          if (!name.includes('상품준비중') && !name.includes('준비중') && !name.includes('품절')) {
            products.push(product);
          }
        }
      });
      
      // If we found products, stop trying other selectors
      if (products.length > 0) break;
    }
  }
  
  return products;
}

async function scrapeMall(mall) {
  console.log(`\n🛒 Scraping ${mall.name} (${mall.url})`);
  
  let allProducts = [];
  
  // Try main URL first
  const mainHtml = await fetchPage(mall.url);
  if (mainHtml) {
    const mainProducts = await scrapeWithSelectors(mainHtml, mall.url, mall.name);
    allProducts = allProducts.concat(mainProducts);
  }
  
  // If no products found, try search URLs
  if (allProducts.length === 0 && mall.searchUrls) {
    for (const searchUrl of mall.searchUrls) {
      const html = await fetchPage(searchUrl);
      if (html) {
        const products = await scrapeWithSelectors(html, mall.url, mall.name);
        if (products.length > 0) {
          allProducts = allProducts.concat(products);
          break; // Stop if we found products
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Remove duplicates by name
  const uniqueProducts = [];
  const seenNames = new Set();
  
  for (const product of allProducts) {
    if (!seenNames.has(product.name)) {
      seenNames.add(product.name);
      uniqueProducts.push({
        ...product,
        region: mall.region
      });
    }
  }
  
  console.log(`✅ Scraped ${uniqueProducts.length} unique products from ${mall.name}`);
  return uniqueProducts;
}

async function saveProducts(mall, products) {
  const outputDir = path.join(__dirname, 'output', 'targeted-malls');
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
    products
  };
  
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved to ${filename}`);
}

async function main() {
  console.log('🚀 Starting targeted scraper for remaining missing malls');
  console.log(`📋 Total malls to scrape: ${targetedMalls.length}`);
  
  const results = [];
  
  for (const mall of targetedMalls) {
    try {
      const products = await scrapeMall(mall);
      
      if (products.length > 0) {
        await saveProducts(mall, products);
        results.push({
          mall: mall.name,
          success: true,
          productCount: products.length
        });
      } else {
        results.push({
          mall: mall.name,
          success: false,
          productCount: 0,
          error: 'No products found'
        });
      }
      
      // Delay between malls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error scraping ${mall.name}:`, error.message);
      results.push({
        mall: mall.name,
        success: false,
        productCount: 0,
        error: error.message
      });
    }
  }
  
  // Save summary
  const summaryPath = path.join(__dirname, 'output', 'targeted-malls', 'scrape-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalMalls: targetedMalls.length,
    successfulMalls: results.filter(r => r.success).length,
    totalProducts: results.reduce((sum, r) => sum + r.productCount, 0),
    results
  }, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`Total malls: ${targetedMalls.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`Total products: ${results.reduce((sum, r) => sum + r.productCount, 0)}`);
  
  // Print detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.mall}: ${r.productCount} products ${r.error ? `(${r.error})` : ''}`);
  });
}

// Run the scraper
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeMall, targetedMalls };