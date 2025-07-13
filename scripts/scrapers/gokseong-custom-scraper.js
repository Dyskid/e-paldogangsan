const puppeteer = require('puppeteer');

/**
 * Gokseong custom scraper (S012)
 * Custom puppeteer scraper for Gokseong Mall
 */
async function scrapeGokseongCustom(mall) {
  const startTime = Date.now();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const products = await page.evaluate(() => {
      const items = [];
      
      // Gokseong-specific selectors
      const productSelectors = [
        '.gokseong-product li',
        '.agricultural-product',
        '.product-list li',
        '.goods-list li',
        '.item-list li'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(elem => {
            const name = elem.querySelector('.name, .product-name, .goods-name, .title')?.textContent?.trim();
            const priceElem = elem.querySelector('.price, .product-price, .cost');
            const priceText = priceElem?.textContent || '';
            const price = parseInt(priceText.replace(/[^\d]/g, '') || '0');
            const link = elem.querySelector('a')?.href;
            const img = elem.querySelector('img');
            const imageUrl = img?.src || img?.getAttribute('data-src');

            if (name && link) {
              items.push({ name, price, url: link, imageUrl });
            }
          });
          
          if (items.length > 0) break;
        }
      }

      return items.slice(0, 100);
    });

    return {
      success: products.length >= 3,
      productCount: products.length,
      products,
      error: products.length < 3 ? `Only ${products.length} products found` : null,
      executionTime: Date.now() - startTime,
      scraperId: 'S012'
    };
  } catch (error) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      scraperId: 'S012'
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrape: scrapeGokseongCustom
};