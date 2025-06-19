import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSpecificUrl() {
  const testUrls = [
    'https://mall.ejeju.net/goods/detail.do?gno=30321&cate=26',
    'https://mall.ejeju.net/goods/detail.do?gno=11321&cate=31008',
    'https://mall.ejeju.net/goods/detail.do?gno=30293&cate=31004'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔍 Testing: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      console.log(`📄 Status: ${response.status}`);
      console.log(`📄 Title: ${$('title').text().trim()}`);
      console.log(`📄 URL after redirects: ${response.request.res.responseUrl || url}`);
      
      // Look for any product-like text
      const bodyText = $('body').text();
      if (bodyText.includes('애플망고') || bodyText.includes('표고버섯') || bodyText.includes('카라향')) {
        console.log('✅ Found product-related content in page');
        
        // Extract some relevant text
        $('*').each((i, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 10 && text.length < 100 && 
              (text.includes('애플망고') || text.includes('표고버섯') || text.includes('카라향'))) {
            console.log(`   Found: ${text}`);
          }
        });
      } else {
        console.log('❌ No product-specific content found');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testSpecificUrl().catch(console.error);