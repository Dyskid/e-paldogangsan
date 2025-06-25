/**
 * Test individual Yangyang Mall product page to improve selectors
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testYangyangProduct(): Promise<void> {
  console.log('🔍 Testing Yangyang Mall product page...');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
  };

  try {
    // Test a specific product URL
    const testUrl = 'https://yangyang-mall.com/goods/view?no=20156';
    console.log(`📦 Testing: ${testUrl}`);
    
    const response = await axios.get(testUrl, { headers, timeout: 30000 });
    
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save the full HTML for analysis
    await fs.writeFile(path.join(outputDir, 'yangyang-test-product.html'), response.data);
    
    const $ = cheerio.load(response.data);
    
    console.log('\n📋 Page Title:', $('title').text());
    
    // Test various selectors for product name
    console.log('\n🏷️ Testing name selectors:');
    const nameSelectors = [
      'h1',
      '.goods-name',
      '.product-name', 
      '.subject',
      '.title',
      'h2',
      '.item-name',
      '[class*="name"]',
      '.detail-title',
      '.goods-title'
    ];
    
    nameSelectors.forEach(selector => {
      const element = $(selector);
      if (element.length > 0) {
        console.log(`  ${selector}: "${element.first().text().trim()}"`);
      }
    });

    // Test price selectors
    console.log('\n💰 Testing price selectors:');
    const priceSelectors = [
      '.price',
      '.cost',
      '.amount',
      '.sale-price',
      '.selling-price',
      '.money',
      '[class*="price"]',
      '.goods-price'
    ];
    
    priceSelectors.forEach(selector => {
      const element = $(selector);
      if (element.length > 0) {
        console.log(`  ${selector}: "${element.first().text().trim()}"`);
      }
    });

    // Test image selectors
    console.log('\n🖼️ Testing image selectors:');
    const imageSelectors = [
      '.goods-image img',
      '.product-image img',
      '.main-image img',
      '.detail-image img',
      '.thumb img',
      'img[src*="goods"]'
    ];
    
    imageSelectors.forEach(selector => {
      const element = $(selector);
      if (element.length > 0) {
        const src = element.first().attr('src');
        console.log(`  ${selector}: "${src}"`);
      }
    });

    // Print all text content to find the real product name
    console.log('\n📝 All text content (first 500 chars):');
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    console.log(bodyText.substring(0, 500));

    // Look for specific patterns
    console.log('\n🔍 Looking for specific patterns:');
    
    // Find elements with specific Korean product-related keywords
    $('*').each((index, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 3 && text.length < 100 && 
          (text.includes('양양') || text.includes('특산') || text.includes('농산') || 
           text.includes('수산') || text.includes('김') || text.includes('미역') ||
           text.includes('쌀') || text.includes('고구마') || text.includes('대게'))) {
        console.log(`  Found relevant text: "${text}" in ${element.tagName}.${$(element).attr('class') || ''}`);
      }
    });

  } catch (error) {
    console.error('❌ Error testing product:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testYangyangProduct().catch(console.error);
}

export { testYangyangProduct };