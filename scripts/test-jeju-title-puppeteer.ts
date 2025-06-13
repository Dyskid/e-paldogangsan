import puppeteer from 'puppeteer';

async function testJejuTitleWithPuppeteer() {
  const testUrl = 'https://mall.ejeju.net/goods/detail.do?gno=30516&cate=31006';
  
  console.log(`Testing URL with Puppeteer: ${testUrl}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('📄 Navigating to page...');
    await page.goto(testUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit more for any dynamic content
    await page.waitForTimeout(3000);
    
    console.log('📄 Page title:', await page.title());
    
    // Try to find the product title using various selectors
    const titleSelectors = [
      'h1',
      'h2', 
      '.goods-title',
      '.goods_title',
      '.product-title',
      '.product_title',
      '.item-name',
      '.item_name',
      '.name',
      '.title'
    ];
    
    console.log('\n🔍 Searching for product title...');
    
    for (const selector of titleSelectors) {
      try {
        const elements = await page.$$(selector);
        for (let i = 0; i < elements.length; i++) {
          const text = await page.evaluate(el => el.textContent?.trim(), elements[i]);
          if (text && text.length > 3) {
            console.log(`${selector}[${i}]: "${text}"`);
          }
        }
      } catch (e) {
        // Skip if selector fails
      }
    }
    
    // Also try to find any text that looks like a product name
    console.log('\n🔍 Looking for any text containing product keywords...');
    const productKeywords = ['오메기', '블루탐', '떡', '제주', '상품'];
    
    for (const keyword of productKeywords) {
      try {
        const elements = await page.$x(`//*[contains(text(), '${keyword}')]`);
        for (let i = 0; i < Math.min(elements.length, 5); i++) {
          const text = await page.evaluate(el => el.textContent?.trim(), elements[i]);
          if (text && text.length > 5 && text.length < 200) {
            console.log(`Contains "${keyword}": "${text}"`);
          }
        }
      } catch (e) {
        // Skip if fails
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testJejuTitleWithPuppeteer().catch(console.error);