import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

async function testNongsarangProduct() {
  try {
    console.log('Testing 농사랑 product page structure...');
    
    // Test a specific product
    const testUrl = 'https://nongsarang.co.kr/shop/shopdetail.html?branduid=1364542&search=&xcode=005&mcode=001&scode=&special=2&GfDT=bmx4W1w%3D';
    
    console.log(`Fetching: ${testUrl}`);
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 30000,
      responseType: 'arraybuffer'
    });
    
    const html = iconv.decode(Buffer.from(response.data), 'euc-kr');
    const $ = cheerio.load(html);
    
    // Save HTML for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'nongsarang-product-sample.html'),
      html
    );
    
    console.log('Analyzing product page structure...');
    
    // Try multiple title selectors
    const titleSelectors = [
      '.item_detail_tit',
      '.product-title',
      '.prd-name',
      'h1',
      '.productname',
      '.goods_name',
      '.item_name',
      '.product_name',
      'title',
      '.prd-brand a',
      '.product-brand a',
      '.brand a'
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
      '.item_detail_price b',
      '.price',
      '.cost',
      '.amount',
      '.sale-price',
      '.prd-price b',
      '.productprice',
      '.price-sale',
      '.discount-price',
      'b'
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
      '.item_detail_tit img',
      '.product-image img',
      '.prd-img img',
      '.productimg img',
      '.goods_img img',
      '.item_img img',
      'img[src*="shopimages"]'
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
    console.log('\nLooking for elements with product names...');
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 10 && text.length < 100 && !text.includes('\n') && 
          (text.includes('농원') || text.includes('농장') || text.includes('kg') || text.includes('g') || text.includes('개'))) {
        console.log(`Potential product name: "${text}" (${element.tagName})`);
      }
    });
    
    console.log('\nHTML structure analysis saved to: nongsarang-product-sample.html');
    
  } catch (error) {
    console.error('Error testing product:', error);
  }
}

testNongsarangProduct();