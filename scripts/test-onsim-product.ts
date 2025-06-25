import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function testOnsiProduct() {
  console.log('Testing 영양온심마켓 product page structure...');
  
  const testUrl = 'https://onsim.cyso.co.kr/shop/item.php?it_id=1629339708';
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('\n=== Basic Product Info ===');
    
    // Test different title selectors
    const titleSelectors = [
      '#sit_title',
      'h2#sit_title', 
      '#sit_desc',
      'p#sit_desc',
      '.item_title',
      '.product_title',
      'h1',
      'h2',
      'title'
    ];
    
    console.log('Title extraction tests:');
    titleSelectors.forEach(selector => {
      const text = $(selector).text().trim();
      if (text) {
        console.log(`  ${selector}: "${text}"`);
      }
    });
    
    console.log('\n=== Price Extraction Tests ===');
    
    // Test different price selectors
    const priceSelectors = [
      '.price',
      '.item_price', 
      '#sit_price',
      '.shop_price',
      '.product_price',
      '.cost',
      '.amount',
      '.won',
      '[class*="price"]',
      '[id*="price"]',
      'span:contains("원")',
      'div:contains("원")',
      'td:contains("원")',
      'strong:contains("원")'
    ];
    
    console.log('Price selector tests:');
    priceSelectors.forEach(selector => {
      try {
        const elements = $(selector);
        elements.each((i, elem) => {
          const text = $(elem).text().trim();
          if (text && text.includes('원') || /\d+/.test(text)) {
            console.log(`  ${selector}: "${text}"`);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });
    
    console.log('\n=== All text containing "원" ===');
    $('*').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.includes('원') && text.length < 100) {
        const tagName = elem.name;
        const className = $(elem).attr('class') || '';
        const idName = $(elem).attr('id') || '';
        console.log(`  ${tagName}${idName ? '#' + idName : ''}${className ? '.' + className.split(' ').join('.') : ''}: "${text}"`);
      }
    });
    
    console.log('\n=== Table structure analysis ===');
    $('table').each((i, table) => {
      console.log(`Table ${i + 1}:`);
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
        if (cells.some(cell => cell.includes('원') || cell.includes('가격') || cell.includes('판매가'))) {
          console.log(`  Row ${j + 1}: [${cells.join(' | ')}]`);
        }
      });
    });
    
    console.log('\n=== JavaScript price detection ===');
    const scripts = $('script').map((i, script) => $(script).html()).get();
    scripts.forEach((script, i) => {
      if (script && (script.includes('원') || script.includes('price') || script.includes('cost'))) {
        console.log(`Script ${i + 1} contains price-related content (truncated):`, script.substring(0, 200));
      }
    });
    
    // Save the full HTML for manual inspection
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const htmlFile = path.join(outputDir, 'onsim-product-test.html');
    fs.writeFileSync(htmlFile, response.data);
    console.log(`\n✅ Full HTML saved to: ${htmlFile}`);
    
    // Try to find price patterns in the entire HTML
    console.log('\n=== Price pattern matching ===');
    const pricePatterns = [
      /[\d,]+\s*원/g,
      /가격[:\s]*[\d,]+/g,
      /판매가[:\s]*[\d,]+/g,
      /정가[:\s]*[\d,]+/g,
      /price[:\s]*[\d,]+/gi
    ];
    
    pricePatterns.forEach((pattern, i) => {
      const matches = response.data.match(pattern);
      if (matches) {
        console.log(`Pattern ${i + 1} matches:`, matches.slice(0, 5));
      }
    });
    
  } catch (error) {
    console.error('Error testing product:', error);
  }
}

if (require.main === module) {
  testOnsiProduct().catch(console.error);
}

export { testOnsiProduct };