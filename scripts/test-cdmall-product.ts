import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function testCdmallProduct() {
  const testUrl = 'https://cdmall.cyso.co.kr/shop/item.php?it_id=1597310035';
  
  console.log(`Testing product page: ${testUrl}`);
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save the page for inspection
    const outputDir = path.join(process.cwd(), 'scripts/output');
    fs.writeFileSync(
      path.join(outputDir, 'cdmall-test-product.html'),
      response.data
    );
    
    console.log('\n=== Page Structure Analysis ===');
    
    // Look for title in various places
    console.log('\nTitle search:');
    const titleSelectors = [
      'h1',
      'h2',
      'h3',
      '.it_name',
      '.product_name',
      '.goods_name',
      '[itemprop="name"]',
      'meta[property="og:title"]',
      'title'
    ];
    
    titleSelectors.forEach(selector => {
      const element = $(selector);
      if (element.length > 0) {
        const text = selector.includes('meta') ? element.attr('content') : element.first().text().trim();
        if (text) {
          console.log(`  ${selector}: "${text.substring(0, 80)}..."`);
        }
      }
    });
    
    // Look for price
    console.log('\nPrice search:');
    const priceRegex = /(\d{1,3}(?:,\d{3})*)\s*원/g;
    
    // Search in text nodes
    $('*').each((i, el) => {
      const text = $(el).text();
      const matches = text.match(priceRegex);
      if (matches && matches.length > 0) {
        const tagName = el.tagName;
        const className = $(el).attr('class') || 'no-class';
        const id = $(el).attr('id') || 'no-id';
        
        // Only show unique price containers
        if (!text.includes('script') && text.length < 100) {
          console.log(`  ${tagName}#${id}.${className}: ${matches[0]}`);
        }
      }
    });
    
    // Look for images
    console.log('\nImage search:');
    const imageSelectors = [
      'img[src*="item"]',
      'img[src*="product"]',
      '.it_image img',
      '.product_image img',
      '[itemprop="image"]'
    ];
    
    imageSelectors.forEach(selector => {
      const img = $(selector).first();
      if (img.length > 0) {
        const src = img.attr('src');
        console.log(`  ${selector}: ${src}`);
      }
    });
    
    // Check page structure
    console.log('\n=== Raw HTML Snippets ===');
    
    // Look for product info container
    const containers = [
      '.2017_renewal_itemform',
      '.sit_info',
      '.item_info',
      '#sit_ov',
      '.product_detail'
    ];
    
    containers.forEach(selector => {
      const container = $(selector);
      if (container.length > 0) {
        console.log(`\n${selector} content (first 200 chars):`);
        console.log(container.html()?.substring(0, 200));
      }
    });
    
  } catch (error) {
    console.error('Error testing product:', error);
  }
}

// Run the test
testCdmallProduct().catch(console.error);