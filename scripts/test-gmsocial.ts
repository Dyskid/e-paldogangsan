import * as cheerio from 'cheerio';

async function testGmsocialTitleExtraction() {
  const testIds = ['121', '81', '80'];
  
  for (const productId of testIds) {
    try {
      const productUrl = `https://gmsocial.or.kr/mall/goods/view.php?product_id=${productId}`;
      console.log(`\n🔍 Testing product ${productId}: ${productUrl}`);
      
      const response = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title using the new method
      const pageTitle = $('title').text().trim();
      let title = '';
      
      if (pageTitle && pageTitle.includes('>')) {
        title = pageTitle.split('>')[0].trim();
      }
      
      console.log(`📄 Page title: ${pageTitle}`);
      console.log(`✨ Extracted title: ${title}`);
      
      // Test price extraction
      const priceSelectors = [
        '.price', '.cost', '.sale-price', '[class*="price"]', 
        '[class*="cost"]', '.goods_price', '.product_price'
      ];
      
      let price = '';
      for (const selector of priceSelectors) {
        const element = $(selector).first();
        if (element.length && /[0-9,]+원?/.test(element.text())) {
          price = element.text().trim();
          break;
        }
      }
      
      if (!price) {
        const bodyText = $('body').text();
        const priceMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)원/);
        if (priceMatch) {
          price = priceMatch[0];
        }
      }
      
      console.log(`💰 Price: ${price}`);
      
    } catch (error) {
      console.error(`❌ Error testing product ${productId}:`, error);
    }
  }
}

testGmsocialTitleExtraction();