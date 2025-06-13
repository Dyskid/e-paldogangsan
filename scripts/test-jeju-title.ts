import axios from 'axios';
import * as cheerio from 'cheerio';

async function testJejuTitle() {
  const testUrl = 'https://mall.ejeju.net/goods/detail.do?gno=30516&cate=31006';
  
  console.log(`Testing URL: ${testUrl}`);
  
  try {
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    console.log('\n📄 Page title:', $('title').text());
    
    // Try to find all potential title elements
    const potentialTitles = [
      { selector: 'h1', text: $('h1').text().trim() },
      { selector: 'h2', text: $('h2').text().trim() },
      { selector: '.goods-title', text: $('.goods-title').text().trim() },
      { selector: '.goods_title', text: $('.goods_title').text().trim() },
      { selector: '.product-title', text: $('.product-title').text().trim() },
      { selector: '.product_title', text: $('.product_title').text().trim() },
      { selector: '.item-name', text: $('.item-name').text().trim() },
      { selector: '.item_name', text: $('.item_name').text().trim() },
      { selector: '.name', text: $('.name').text().trim() },
      { selector: '.title', text: $('.title').text().trim() },
    ];
    
    console.log('\n🔍 All potential titles found:');
    potentialTitles.forEach(item => {
      if (item.text) {
        console.log(`${item.selector}: "${item.text}"`);
      }
    });
    
    // Also check for any elements with text that looks like a product name
    console.log('\n🔍 Looking for elements containing product-like text:');
    $('*').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 10 && text.length < 100 && 
          (text.includes('오메기') || text.includes('블루탐') || text.includes('떡'))) {
        console.log(`Element: "${text}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

testJejuTitle().catch(console.error);