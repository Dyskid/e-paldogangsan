import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function testJnmallStructure() {
  try {
    // First, let's try the recommend page which should have products
    const url = 'https://www.jnmall.kr/category/recommend';
    console.log('Fetching:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      timeout: 30000
    });
    
    const html = response.data;
    await fs.writeFile('scripts/output/jnmall-recommend-page.html', html);
    
    const $ = cheerio.load(html);
    
    console.log('\nLooking for product containers...');
    
    // Try to find product containers
    const containerSelectors = [
      '[class*="product"]',
      '[class*="item"]',
      '[class*="goods"]',
      '[class*="card"]',
      '.box',
      '.list-item',
      'article',
      'li[data-product]',
      'div[data-product]'
    ];
    
    for (const selector of containerSelectors) {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`${selector}: ${count} elements found`);
        
        // Look at the first few elements
        $(selector).slice(0, 3).each((i, elem) => {
          const $elem = $(elem);
          const text = $elem.text().trim().substring(0, 100);
          const classes = $elem.attr('class');
          console.log(`  [${i}] class="${classes}" text="${text}..."`);
        });
      }
    }
    
    // Look for links with specific patterns
    console.log('\nLooking for product links...');
    const links = new Map();
    
    $('a').each((_, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      const text = $elem.text().trim();
      
      if (href && href.includes('/product/') && href.includes('/detail')) {
        const productInfo = {
          href,
          text: text.substring(0, 50),
          imgSrc: $elem.find('img').attr('src'),
          price: $elem.parent().find('[class*="price"]').text()
        };
        links.set(href, productInfo);
      }
    });
    
    console.log(`\nFound ${links.size} product detail links`);
    
    // Show first few products
    let count = 0;
    for (const [url, info] of links) {
      if (count++ < 5) {
        console.log(`\nProduct ${count}:`);
        console.log(`  URL: ${url}`);
        console.log(`  Text: ${info.text}`);
        console.log(`  Image: ${info.imgSrc}`);
        console.log(`  Price: ${info.price}`);
      }
    }
    
    // Try to understand the data structure
    console.log('\nChecking for JavaScript data...');
    const scripts = $('script').map((_, script) => $(script).html()).get();
    
    for (const script of scripts) {
      if (script && (script.includes('products') || script.includes('items') || script.includes('goods'))) {
        console.log('\nFound potential product data in script:');
        const preview = script.substring(0, 500);
        console.log(preview);
        
        // Try to extract JSON data
        const jsonMatch = script.match(/(\{[^}]*products[^}]*\}|\[[^\]]*\])/);
        if (jsonMatch) {
          console.log('\nExtracted JSON:', jsonMatch[1].substring(0, 200));
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testJnmallStructure();