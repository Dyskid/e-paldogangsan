const puppeteer = require('puppeteer');

/**
 * Generic puppeteer scraper (S014)
 * Generic puppeteer-based scraper for dynamic content
 */
async function scrapePuppeteer(mall) {
  const startTime = Date.now();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to find and click on a product category
    const categoryClicked = await page.evaluate(() => {
      const categoryLinks = document.querySelectorAll('.category a, .menu a, .gnb a, .nav a');
      for (const link of categoryLinks) {
        const text = link.textContent.toLowerCase();
        if (text.includes('상품') || text.includes('쇼핑') || text.includes('product') || text.includes('shop')) {
          link.click();
          return true;
        }
      }
      return false;
    });

    if (categoryClicked) {
      await page.waitForTimeout(3000);
    }

    const products = await page.evaluate(() => {
      const items = [];
      
      // Generic selectors for product items
      const productSelectors = [
        '.product-item',
        '.goods-item', 
        '.item',
        '.product_list li',
        '.goods_list li',
        'ul.products li',
        '.prd-item',
        '.prd_item',
        '.product-list li',
        '.goods-list li',
        '.item-list li'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(elem => {
            const name = elem.querySelector('.product-name, .goods-name, .name, .title, .prd_name')?.textContent?.trim();
            const priceElem = elem.querySelector('.price, .product-price, .cost, .prd_price');
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
      scraperId: 'S014'
    };
  } catch (error) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      scraperId: 'S014'
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrape: scrapePuppeteer
};