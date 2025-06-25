import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function testCategoryPage() {
  const url = 'https://hampyeongm.com/product/list.html?cate_no=81';
  
  try {
    console.log('Fetching category page:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save the HTML for inspection
    writeFileSync('./scripts/output/hampyeong-category-sample.html', response.data);
    
    console.log('\nSearching for product containers...');
    
    // Try various selectors
    const selectors = [
      '.xans-product-listmain .xans-record-',
      '.xans-product-normalpackage .xans-record-',
      '.prdList .xans-record-',
      '.xans-record-',
      '.prd-item',
      '.item',
      '.product-item',
      'li[id^="anchorBoxId"]',
      '.ec-base-product li',
      '.prdList li',
      '[class*="product"] li',
      '[class*="item"]'
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length} elements found`);
        
        // Get first element details
        const first = elements.first();
        console.log('First element HTML preview:', first.html()?.substring(0, 200) + '...');
      }
    }
    
    // Look for specific patterns
    console.log('\nLooking for price patterns...');
    $('*:contains("원")').each((i, el) => {
      const text = $(el).text().trim();
      if (text.match(/[\d,]+원/) && text.length < 50) {
        console.log(`Price found: "${text}"`);
        if (i >= 5) return false; // Only show first 5
      }
    });
    
    // Look for image patterns
    console.log('\nLooking for product images...');
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (src.includes('product') || src.includes('goods') || alt) {
        console.log(`Image: alt="${alt}", src="${src}"`);
        if (i >= 5) return false; // Only show first 5
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCategoryPage();