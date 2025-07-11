const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Remaining missing malls with simple scraping patterns
const missingMalls = [
  {
    id: 92,
    name: '김해온몰',
    url: 'https://gimhaemall.kr',
    region: '경남',
    patterns: {
      productList: ['.product-item', '.item', '.goods', '.product'],
      name: ['.name', '.title', '.product-name', 'h3', 'h4'],
      price: ['.price', '.cost', '.product-price'],
      image: ['img', '.thumb img', '.product-image img'],
      link: ['a', '.link', '.product-link']
    }
  },
  {
    id: 88,
    name: '공룡나라',
    url: 'https://www.edinomall.com/shop/smain/index.php',
    region: '경남',
    patterns: {
      productList: ['.item', '.goods_list li', '.product'],
      name: ['.goods_name', '.name', '.title'],
      price: ['.price', '.goods_price'],
      image: ['img', '.goods_img img'],
      link: ['a', '.goods_link']
    }
  },
  {
    id: 89,
    name: '함양몰',
    url: 'https://2900.co.kr/',
    region: '경남',
    patterns: {
      productList: ['.product', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  },
  {
    id: 91,
    name: '함안몰',
    url: 'https://hamanmall.com',
    region: '경남',
    patterns: {
      productList: ['.product-item', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  },
  {
    id: 93,
    name: '이제주몰',
    url: 'https://mall.ejeju.net/main/index.do',
    region: '제주',
    patterns: {
      productList: ['.goods', '.item', '.product'],
      name: ['.goods_name', '.name', '.title'],
      price: ['.price', '.goods_price'],
      image: ['img', '.goods_img img'],
      link: ['a']
    }
  },
  {
    id: 53,
    name: '기찬들영암몰',
    url: 'https://yeongammall.co.kr/',
    region: '전남',
    patterns: {
      productList: ['.product', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  },
  {
    id: 50,
    name: '순천로컬푸드함께가게',
    url: 'https://sclocal.kr/',
    region: '전남',
    patterns: {
      productList: ['.product', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  },
  {
    id: 52,
    name: '장흥몰',
    url: 'https://okjmall.com/',
    region: '전남',
    patterns: {
      productList: ['.product', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  },
  {
    id: 65,
    name: '영주장날',
    url: 'https://yjmarket.cyso.co.kr/',
    region: '경북',
    patterns: {
      productList: ['.product', '.item', '.goods', '.prd_list li'],
      name: ['.name', '.title', '.prd_name'],
      price: ['.price', '.prd_price'],
      image: ['img', '.prd_img img'],
      link: ['a']
    }
  },
  {
    id: 30,
    name: '농사랑',
    url: 'https://nongsarang.co.kr/',
    region: '충남',
    patterns: {
      productList: ['.product', '.item', '.goods'],
      name: ['.name', '.title', '.product-name'],
      price: ['.price', '.cost'],
      image: ['img', '.thumb img'],
      link: ['a']
    }
  }
];

async function fetchPage(url, timeout = 10000) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout,
      maxRedirects: 5
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

function extractText($element) {
  if (!$element || $element.length === 0) return '';
  return $element.text().trim().replace(/\s+/g, ' ');
}

function extractPrice(priceText) {
  if (!priceText) return 0;
  const numbers = priceText.replace(/[^0-9]/g, '');
  return parseInt(numbers) || 0;
}

function extractImage($element, baseUrl) {
  if (!$element || $element.length === 0) return '';
  
  let src = $element.attr('src') || $element.attr('data-src') || '';
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

async function scrapeMall(mall) {
  console.log(`\n🛒 Scraping ${mall.name} (${mall.url})`);
  
  const products = [];
  const html = await fetchPage(mall.url);
  
  if (!html) {
    console.log(`❌ Failed to fetch ${mall.name}`);
    return products;
  }
  
  const $ = cheerio.load(html);
  
  // Try different product list selectors
  let productElements = null;
  for (const selector of mall.patterns.productList) {
    productElements = $(selector);
    if (productElements.length > 0) {
      console.log(`Found ${productElements.length} products using selector: ${selector}`);
      break;
    }
  }
  
  if (!productElements || productElements.length === 0) {
    console.log(`❌ No products found for ${mall.name}`);
    return products;
  }
  
  // Extract products
  productElements.slice(0, 20).each((index, element) => {
    const $product = $(element);
    
    // Try to find name
    let name = '';
    for (const selector of mall.patterns.name) {
      const $name = $product.find(selector).first();
      name = extractText($name);
      if (name) break;
    }
    
    // Try to find price
    let price = 0;
    for (const selector of mall.patterns.price) {
      const $price = $product.find(selector).first();
      const priceText = extractText($price);
      price = extractPrice(priceText);
      if (price > 0) break;
    }
    
    // Try to find image
    let image = '';
    for (const selector of mall.patterns.image) {
      const $img = $product.find(selector).first();
      image = extractImage($img, mall.url);
      if (image) break;
    }
    
    // Try to find link
    let link = '';
    for (const selector of mall.patterns.link) {
      const $link = $product.find(selector).first();
      const href = $link.attr('href');
      if (href) {
        if (href.startsWith('http')) {
          link = href;
        } else if (href.startsWith('//')) {
          link = 'https:' + href;
        } else if (href.startsWith('/')) {
          link = new URL(href, mall.url).href;
        } else {
          link = new URL(href, mall.url).href;
        }
        break;
      }
    }
    
    // Only add if we have at least a name
    if (name) {
      products.push({
        name,
        price,
        image,
        url: link || mall.url,
        mall: mall.name,
        region: mall.region,
        category: '기타',
        scrapedAt: new Date().toISOString()
      });
    }
  });
  
  console.log(`✅ Scraped ${products.length} products from ${mall.name}`);
  return products;
}

async function saveProducts(mall, products) {
  const outputDir = path.join(__dirname, 'output', 'remaining-malls');
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
  console.log('🚀 Starting simple scraper for remaining missing malls');
  console.log(`📋 Total malls to scrape: ${missingMalls.length}`);
  
  const results = [];
  
  for (const mall of missingMalls) {
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
      
      // Small delay between malls
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
  const summaryPath = path.join(__dirname, 'output', 'remaining-malls', 'scrape-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalMalls: missingMalls.length,
    successfulMalls: results.filter(r => r.success).length,
    totalProducts: results.reduce((sum, r) => sum + r.productCount, 0),
    results
  }, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`Total malls: ${missingMalls.length}`);
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

module.exports = { scrapeMall, missingMalls };