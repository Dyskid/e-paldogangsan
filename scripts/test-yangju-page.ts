import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testYangjuPage() {
  console.log('🔍 Testing Yangju Market page structure...');
  
  try {
    // Test agricultural products category
    const testUrl = 'https://market.yangju.go.kr/shop/shopbrand.html?xcode=001&type=X';
    console.log(`Testing URL: ${testUrl}`);
    
    const response = await axios.get(testUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Referer': 'https://market.yangju.go.kr/'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Content length: ${response.data.length}`);
    
    const $ = cheerio.load(response.data);
    
    // Save the page for analysis
    const outputDir = path.join(__dirname, 'output');
    fs.writeFileSync(path.join(outputDir, 'yangju-test-category.html'), response.data);
    
    // Try different selectors to find products
    const selectors = [
      '.item-list',
      '.prd-list',
      '.product-list',
      '.goods-list',
      '[class*="item"]',
      '[class*="product"]',
      '[class*="goods"]',
      'dl.item-list',
      'div.item-list',
      'li[class*="item"]',
      'div[class*="product"]'
    ];
    
    console.log('\n🔍 Looking for products with various selectors:');
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
        
        // Try to extract product info from first element
        const $first = elements.first();
        console.log('   Sample element HTML (first 200 chars):');
        console.log('   ' + $first.html()?.substring(0, 200) + '...');
        
        // Look for product links
        const links = $first.find('a[href*="shopdetail"]');
        if (links.length > 0) {
          console.log(`   Found ${links.length} product links`);
          console.log(`   First link: ${links.first().attr('href')}`);
        }
        
        // Look for product names
        const names = $first.find('.prd-name, .name, .product-name, .title');
        if (names.length > 0) {
          console.log(`   Product name: ${names.first().text().trim()}`);
        }
        
        // Look for prices
        const prices = $first.find('.prd-price, .price, .product-price');
        if (prices.length > 0) {
          console.log(`   Product price: ${prices.first().text().trim()}`);
        }
        
        break;
      }
    }
    
    // Also check for any links to product detail pages
    console.log('\n🔍 Looking for product detail links:');
    const detailLinks = $('a[href*="shopdetail.html"]');
    console.log(`Found ${detailLinks.length} product detail links`);
    
    if (detailLinks.length > 0) {
      console.log('\nFirst 5 product links:');
      detailLinks.slice(0, 5).each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim() || $(el).find('img').attr('alt') || 'No text';
        console.log(`${i + 1}. ${href} - ${text}`);
      });
    }
    
    // Check page structure
    console.log('\n📄 Page structure analysis:');
    console.log(`- Title: ${$('title').text()}`);
    console.log(`- H1 tags: ${$('h1').length}`);
    console.log(`- H2 tags: ${$('h2').length}`);
    console.log(`- Images: ${$('img').length}`);
    console.log(`- Links: ${$('a').length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testYangjuPage();