const axios = require('axios');
const cheerio = require('cheerio');

async function testMall1() {
  try {
    const response = await axios.get('https://wemall.kr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for product links
    const productLinks = [];
    $('a[href*="/goods/"], a[href*="/product/"], a[href*="/item/"], a[href*="detail"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text && text.length > 2) {
        productLinks.push({ href, text });
      }
    });
    
    console.log('Found product links:', productLinks.length);
    productLinks.slice(0, 5).forEach(link => {
      console.log(' -', link.text, ':', link.href);
    });
    
    // Look for common product containers
    const selectors = [
      '.product-item', '.goods-item', '.item', '.product_list li', '.goods_list li',
      '.prd-item', '.prd_list li', '.shop_list li', '.list_item',
      '[class*="product"] li', '[class*="goods"] li', '[class*="item"] li'
    ];
    
    for (const selector of selectors) {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`Found ${count} elements with selector: ${selector}`);
        
        // Try to extract product info from first element
        const $first = $(selector).first();
        const name = $first.find('a, .name, .title, h3, h4').first().text().trim();
        const price = $first.find('.price, [class*="price"]').first().text().trim();
        
        if (name) {
          console.log(`  Sample: name="${name}", price="${price}"`);
        }
      }
    }
    
    // Look for any images that might be products
    const productImages = [];
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      const alt = $(elem).attr('alt') || '';
      const parent = $(elem).parent();
      const parentHref = parent.is('a') ? parent.attr('href') : '';
      
      if (src && (alt.length > 5 || parentHref.includes('/goods/') || parentHref.includes('/product/'))) {
        productImages.push({ src, alt, href: parentHref });
      }
    });
    
    console.log('\nFound product images:', productImages.length);
    productImages.slice(0, 3).forEach(img => {
      console.log(' - Image:', img.alt || 'No alt', ', href:', img.href);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMall1();