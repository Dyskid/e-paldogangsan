const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
const mallName = '부안 텃밭할매';

// Focus on main listing pages
const mainUrls = [
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1010', // 곡류
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1020', // 과일·채소
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1030', // 수산물
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1040', // 가공식품
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1050', // 선물세트
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1060', // 축산물
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1070', // 반찬류
  'https://www.xn--9z2bv5bx25anyd.kr/board/shop/list.php?ca_id=1080'  // 기타 먹거리
];

const categoryNames = {
  '1010': '곡류',
  '1020': '과일·채소', 
  '1030': '수산물',
  '1040': '가공식품',
  '1050': '선물세트',
  '1060': '축산물',
  '1070': '반찬류',
  '1080': '기타 먹거리'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function scrapeProductsFromListingPage(listingUrl) {
  const html = await fetchPage(listingUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const products = [];
  
  // Extract category ID from URL
  const categoryId = listingUrl.match(/ca_id=(\d+)/)?.[1];
  const categoryName = categoryNames[categoryId] || 'Unknown';

  // Look for product listings in the page
  $('.shop_item, .item, [class*="item"]').each((i, element) => {
    try {
      const $item = $(element);
      
      // Extract product name
      const name = $item.find('.shop_item_name, .item_name, [class*="name"]').text().trim() ||
                  $item.find('a').attr('title') ||
                  $item.find('img').attr('alt');
      
      // Extract price 
      const priceText = $item.find('.shop_item_price, .item_price, [class*="price"]').text();
      let price = null;
      if (priceText) {
        const priceMatch = priceText.match(/[\d,]+/);
        if (priceMatch) {
          price = parseInt(priceMatch[0].replace(/,/g, ''));
        }
      }
      
      // Extract image
      const imgSrc = $item.find('img').attr('src');
      let imageUrl = null;
      if (imgSrc) {
        imageUrl = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`;
      }
      
      // Extract product URL
      const productLink = $item.find('a[href*="item.php"]').attr('href');
      let productUrl = null;
      if (productLink) {
        if (productLink.startsWith('http')) {
          productUrl = productLink;
        } else if (productLink.startsWith('/')) {
          productUrl = `${baseUrl}${productLink}`;
        } else if (productLink.startsWith('..')) {
          productUrl = `${baseUrl}/board/shop/${productLink.replace('../', '')}`;
        } else {
          productUrl = `${baseUrl}/board/shop/${productLink}`;
        }
      }
      
      if (name && name.length > 2 && price && price > 0) {
        products.push({
          name: name,
          price: price,
          image: imageUrl,
          url: productUrl,
          mall: mallName,
          category: categoryName,
          scrapedAt: new Date().toISOString()
        });
        console.log(`✅ Found: ${name} - ${price}원`);
      }
      
    } catch (error) {
      console.error('Error parsing product item:', error);
    }
  });

  return products;
}

async function main() {
  console.log(`🚀 Starting simple scraper for ${mallName}`);
  const allProducts = [];
  
  for (const url of mainUrls) {
    console.log(`\n📂 Scraping: ${url}`);
    
    const products = await scrapeProductsFromListingPage(url);
    console.log(`Found ${products.length} products`);
    
    allProducts.push(...products);
    
    await delay(2000); // Be respectful
  }
  
  console.log(`\n🎉 Total products found: ${allProducts.length}`);
  
  if (allProducts.length > 0) {
    // Save scraped data
    const timestamp = Date.now();
    const scrapedDataPath = path.join(__dirname, `buan-simple-scraped-${timestamp}.json`);
    fs.writeFileSync(scrapedDataPath, JSON.stringify(allProducts, null, 2));
    console.log(`💾 Scraped data saved to: ${scrapedDataPath}`);

    // Add to products.json
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts = [];
    
    if (fs.existsSync(productsPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    const updatedProducts = [...existingProducts, ...allProducts];
    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    
    console.log(`📝 Added ${allProducts.length} products to products.json`);
    console.log(`📊 Total products in database: ${updatedProducts.length}`);
  } else {
    console.log('❌ No products found');
  }
}

main().catch(console.error);