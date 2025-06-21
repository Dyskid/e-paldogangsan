import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testWonjuProduct() {
  console.log('🔍 Testing Wonju Mall product page...');
  
  try {
    // Test a specific product page
    const productUrl = 'https://wonju-mall.co.kr/goods/view?no=108341';
    console.log(`Testing URL: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Content length: ${response.data.length}`);
    
    const $ = cheerio.load(response.data);
    
    // Save the page for analysis
    const outputDir = path.join(__dirname, 'output');
    fs.writeFileSync(path.join(outputDir, 'wonju-test-product.html'), response.data);
    
    // Try different selectors to find product title
    console.log('\n🔍 Looking for product title:');
    const titleSelectors = [
      '.goods_name',
      '.product_name',
      '.item_name',
      'h1',
      '.detail_info .title',
      '.info_area .title',
      '[class*="title"]',
      '.goods_info h1',
      '.product_info h1',
      '.item_detail_tit',
      '.good_name',
      '.goods-name',
      'h2',
      'h3'
    ];
    
    for (const selector of titleSelectors) {
      const title = $(selector).text().trim();
      if (title && title.length > 0) {
        console.log(`✅ Found title with ${selector}: "${title}"`);
      }
    }
    
    // Try different selectors to find product price
    console.log('\n💰 Looking for product price:');
    const priceSelectors = [
      '.sale_price',
      '.discount_price',
      '.current_price',
      '.original_price',
      '.normal_price', 
      '.list_price',
      '.price',
      '.goods_price',
      '.product_price',
      '[class*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const price = $(selector).text().trim();
      if (price && price.length > 0) {
        console.log(`✅ Found price with ${selector}: "${price}"`);
      }
    }
    
    // Look for images
    console.log('\n🖼️  Looking for product images:');
    const imageSelectors = [
      '.goods_image img',
      '.product_image img',
      '.main_image img',
      'img[src*="goods"]',
      'img[src*="product"]',
      '.item_photo img'
    ];
    
    for (const selector of imageSelectors) {
      const imageSrc = $(selector).attr('src');
      if (imageSrc) {
        console.log(`✅ Found image with ${selector}: "${imageSrc}"`);
        break;
      }
    }
    
    // Check page structure
    console.log('\n📄 Page structure analysis:');
    console.log(`- Title: ${$('title').text()}`);
    console.log(`- H1 tags: ${$('h1').length}`);
    console.log(`- H2 tags: ${$('h2').length}`);
    console.log(`- H3 tags: ${$('h3').length}`);
    console.log(`- Images: ${$('img').length}`);
    console.log(`- Links: ${$('a').length}`);
    
    // Try to find all text content that might be the product name
    console.log('\n📝 All text content analysis:');
    $('h1, h2, h3, .title, [class*="name"], [class*="title"]').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 3 && text.length < 100) {
        console.log(`   Text: "${text}" (${element.tagName}.${$(element).attr('class') || 'no-class'})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWonjuProduct();