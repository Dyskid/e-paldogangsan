import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testGangneungProduct() {
  console.log('🧪 Testing Gangneung Mall product page structure...');
  
  // Test multiple product URLs from the analysis
  const testUrls = [
    'https://gangneung-mall.com/goods/view?no=38080',
    'https://gangneung-mall.com/goods/view?no=38079',
    'https://gangneung-mall.com/goods/view?no=107659'
  ];

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`\n🔍 Testing product ${i + 1}: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Test various selectors for title
      const titleSelectors = [
        '.product-name', '.goods-name', '.item-name',
        'h1', 'h2', '.title', '.name',
        '[class*="name"]', '[class*="title"]',
        '.product_name', '.goods_name'
      ];
      
      console.log('🏷️ Testing title selectors:');
      for (const selector of titleSelectors) {
        const title = $(selector).first().text().trim();
        if (title && title.length > 3) {
          console.log(`  ✅ ${selector}: "${title}"`);
        }
      }
      
      // Test various selectors for price
      const priceSelectors = [
        '.price', '.cost', '.amount', '.value',
        '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
        '.product-price', '.goods-price', '.item-price'
      ];
      
      console.log('\n💰 Testing price selectors:');
      for (const selector of priceSelectors) {
        const price = $(selector).first().text().trim();
        if (price && (price.includes('원') || price.includes(',') || /\d+/.test(price))) {
          console.log(`  ✅ ${selector}: "${price}"`);
        }
      }
      
      // Test various selectors for image
      const imageSelectors = [
        '.product-image img', '.goods-image img', '.item-image img',
        '.main-image img', '.big-image img', '.detail-image img',
        'img[src*="goods"]', 'img[src*="product"]', 'img[src*="item"]'
      ];
      
      console.log('\n🖼️ Testing image selectors:');
      for (const selector of imageSelectors) {
        const imgSrc = $(selector).first().attr('src');
        if (imgSrc) {
          console.log(`  ✅ ${selector}: "${imgSrc}"`);
        }
      }

      // Look for any text that might be the product name
      console.log('\n🔍 Searching for potential product names in text:');
      const allText = $('body').text();
      const lines = allText.split('\n').map(line => line.trim()).filter(line => 
        line.length > 5 && line.length < 100 && 
        !line.includes('Copyright') && 
        !line.includes('©') &&
        !line.includes('로그인') &&
        !line.includes('회원가입')
      );
      
      for (let j = 0; j < Math.min(10, lines.length); j++) {
        console.log(`  "${lines[j]}"`);
      }

      // Save this specific product page for analysis
      const outputPath = path.join(__dirname, 'output', `gangneung-product-${i + 1}.html`);
      fs.writeFileSync(outputPath, response.data, 'utf-8');
      console.log(`💾 Saved to: ${outputPath}`);
      
      if (i === 0) break; // Test only first URL for now

    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testGangneungProduct()
  .then(() => {
    console.log('\n🎉 Product testing completed!');
  })
  .catch((error) => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  });