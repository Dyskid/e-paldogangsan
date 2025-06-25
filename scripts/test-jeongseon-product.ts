import axios from 'axios';
import * as cheerio from 'cheerio';

async function testJeongseonProduct(): Promise<void> {
  try {
    console.log('🧪 Testing Jeongseon Mall product page structure...');
    
    // Test an actual product URL
    const testUrl = 'https://jeongseon-mall.com/goods/view?no=37485';
    console.log(`Testing product page: ${testUrl}`);
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    console.log(`✅ Successfully loaded product page`);
    console.log(`Page title: ${$('title').text()}`);
    
    // Test different selectors for product name
    console.log('\n🏷️ Testing product name selectors:');
    const nameSelectors = [
      'h1',
      '.product_name',
      '.goods_name',
      '[class*="name"]',
      '.name',
      'h2',
      'h3',
      '.title'
    ];
    
    nameSelectors.forEach(selector => {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        console.log(`${selector}: "${element.text().trim()}"`);
      }
    });
    
    // Test price selectors
    console.log('\n💰 Testing price selectors:');
    const priceSelectors = [
      '[class*="price"]',
      '.price',
      '.product_price',
      '.goods_price',
      '[class*="cost"]',
      '[class*="amount"]'
    ];
    
    priceSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length} elements found`);
        elements.slice(0, 3).each((index, element) => {
          const text = $(element).text().trim();
          if (text) {
            console.log(`  ${index + 1}: "${text}"`);
          }
        });
      }
    });
    
    // Test image selectors
    console.log('\n🖼️ Testing image selectors:');
    const imageSelectors = [
      'img[src*="goods"]',
      'img[src*="product"]',
      '.product_image img',
      '.goods_image img',
      'img[src*="data"]',
      'img[src*="upload"]'
    ];
    
    imageSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length} images found`);
        elements.slice(0, 3).each((index, element) => {
          const src = $(element).attr('src');
          if (src) {
            console.log(`  ${index + 1}: "${src}"`);
          }
        });
      }
    });
    
    // Look at page structure
    console.log('\n🏗️ Page structure analysis:');
    console.log(`• Total images: ${$('img').length}`);
    console.log(`• Total links: ${$('a').length}`);
    console.log(`• Elements with class containing "product": ${$('[class*="product"]').length}`);
    console.log(`• Elements with class containing "goods": ${$('[class*="goods"]').length}`);
    console.log(`• Elements with class containing "price": ${$('[class*="price"]').length}`);
    console.log(`• Elements with class containing "name": ${$('[class*="name"]').length}`);
    
    // Sample text content for debugging
    console.log('\n📄 Sample page content:');
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();
    console.log(`First 300 characters: "${textContent.substring(0, 300)}..."`);
    
  } catch (error) {
    console.error('❌ Error testing product page:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    // Try alternative URLs
    console.log('\n🔄 Trying alternative product URLs...');
    const alternativeUrls = [
      'https://jeongseon-mall.com/goods/view?no=100069',
      'https://jeongseon-mall.com/goods/view?no=26479',
      'https://jeongseon-mall.com/goods/view?no=811'
    ];
    
    for (const url of alternativeUrls) {
      try {
        console.log(`Testing: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        console.log(`✅ ${url} - Title: "${title}"`);
        break;
      } catch (altError) {
        console.log(`❌ ${url} - Failed`);
      }
    }
  }
}

if (require.main === module) {
  testJeongseonProduct()
    .then(() => {
      console.log('✅ Product page testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Product page testing failed:', error);
      process.exit(1);
    });
}

export { testJeongseonProduct };