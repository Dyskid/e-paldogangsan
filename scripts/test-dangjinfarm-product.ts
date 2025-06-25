import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function testDangjinfarmProduct() {
  try {
    console.log('Testing 당진팜 product page structure...');
    
    // Test a specific product
    const testUrl = 'https://dangjinfarm.com/product/detail.html?product_no=417&cate_no=1&display_group=2';
    
    console.log(`Fetching: ${testUrl}`);
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save HTML for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'dangjinfarm-product-sample.html'),
      response.data
    );
    
    console.log('Analyzing product page structure...');
    
    // Try multiple title selectors
    const titleSelectors = [
      '.xans-product-detail .itemname',
      '.product-name',
      '.product_name',
      '.goods_name',
      '.item_name',
      'h1',
      '.product-title',
      '.detail .itemname',
      '.item-name',
      'title'
    ];
    
    console.log('\nTesting title selectors:');
    for (const selector of titleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        console.log(`${selector}: "${text}" (${element.length} elements)`);
      } else {
        console.log(`${selector}: (not found)`);
      }
    }
    
    // Try price selectors
    const priceSelectors = [
      '.xans-product-detail .price',
      '.product-price',
      '.price',
      '.cost',
      '.amount',
      '.sale-price',
      '.selling-price',
      '.item-price',
      'span[class*="price"]',
      'strong[class*="price"]'
    ];
    
    console.log('\nTesting price selectors:');
    for (const selector of priceSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.includes('원')) {
          console.log(`${selector}: "${text}" (${element.length} elements)`);
        }
      }
    }
    
    // Try image selectors
    const imageSelectors = [
      '.xans-product-detail img',
      '.product-image img',
      '.product_image img',
      '.goods_image img',
      '.item-image img',
      '#bigimg img',
      '.big_img img'
    ];
    
    console.log('\nTesting image selectors:');
    for (const selector of imageSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const src = element.attr('src');
        console.log(`${selector}: "${src}" (${element.length} elements)`);
      }
    }
    
    // Look for any element that might contain product name
    console.log('\nLooking for elements with potential product names...');
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 5 && text.length < 100 && !text.includes('\n') && 
          !text.includes('게시글') && !text.includes('신고') &&
          (text.includes('kg') || text.includes('g') || text.includes('개') || text.includes('포'))) {
        console.log(`Potential product name: "${text}" (${element.tagName})`);
      }
    });
    
    console.log('\nHTML structure analysis saved to: dangjinfarm-product-sample.html');
    
  } catch (error) {
    console.error('Error testing product:', error);
  }
}

testDangjinfarmProduct();