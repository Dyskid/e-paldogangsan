const puppeteer = require('puppeteer');

/**
 * Enhanced CYSO platform scraper (S003)
 * Uses puppeteer for CYSO e-commerce platform sites
 */
async function scrapeCysoEnhanced(mall) {
  const startTime = Date.now();
  
  if (!mall.url.includes('cyso.co.kr')) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: 'Not a CYSO platform mall',
      executionTime: Date.now() - startTime,
      scraperId: 'S003'
    };
  }

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
      const categoryLinks = document.querySelectorAll('.category a, .menu a, .gnb a');
      for (const link of categoryLinks) {
        if (link.textContent.includes('상품') || link.textContent.includes('쇼핑')) {
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
      
      // Try multiple selectors for CYSO platform
      const productSelectors = [
        '.goods_list li',
        '.item_list li',
        '.product_list li',
        '.list_v li',
        '.item-list .item',
        'a[href*="/shop/item.php"]'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(elem => {
            // For direct item links
            if (elem.tagName === 'A') {
              const link = elem.href;
              const name = elem.textContent?.trim() || elem.title || '';
              const img = elem.querySelector('img');
              const imageUrl = img?.src || img?.getAttribute('data-src') || '';
              
              if (name && link && link.includes('item.php')) {
                items.push({ name, price: 0, url: link, imageUrl });
              }
            } else {
              // For list items
              const name = elem.querySelector('.goods_name, .item_name, .prd_name, .name, .title')?.textContent?.trim();
              const priceElem = elem.querySelector('.goods_price, .item_price, .price');
              const priceText = priceElem?.textContent || '';
              const price = parseInt(priceText.replace(/[^\d]/g, '') || '0');
              const link = elem.querySelector('a')?.href;
              const img = elem.querySelector('.goods_img img, .item_img img, img');
              const imageUrl = img?.src || img?.getAttribute('data-src');

              if (name && link) {
                items.push({ name, price, url: link, imageUrl });
              }
            }
          });
          
          if (items.length > 0) break;
        }
      }
      
      // If no products found in lists, try to find any product links
      if (items.length === 0) {
        const links = document.querySelectorAll('a[href*="/shop/item.php"]');
        const uniqueUrls = new Set();
        
        links.forEach(link => {
          const href = link.href;
          
          // Skip javascript links and social media shares
          if (href.startsWith('javascript:') || href.includes('facebook.com') || href.includes('line.me')) {
            return;
          }
          
          // Skip if we already have this URL
          if (uniqueUrls.has(href)) {
            return;
          }
          
          let name = '';
          let imageUrl = '';
          
          // Try to get product name from image alt/title
          const img = link.querySelector('img');
          if (img) {
            name = img.alt || img.title || '';
            imageUrl = img.src || img.getAttribute('data-src') || '';
          }
          
          // If no name from img, try text content
          if (!name) {
            name = link.textContent?.trim() || '';
          }
          
          // Clean up the name
          name = name.replace(/\s+/g, ' ').trim();
          
          // Skip if name is empty, too short, or looks like a button/label
          if (name && name.length > 2 && name.length < 200 && 
              !name.match(/^(\d+%|새창|카카오톡|페이스북|라인|\+|-)$/)) {
            uniqueUrls.add(href);
            items.push({ name: name, price: 0, url: href, imageUrl });
          }
        });
      }

      return items.slice(0, 100); // Limit to 100 products
    });

    return {
      success: products.length >= 3,
      productCount: products.length,
      products,
      error: products.length < 3 ? `Only ${products.length} products found` : null,
      executionTime: Date.now() - startTime,
      scraperId: 'S003'
    };
  } catch (error) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      scraperId: 'S003'
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrape: scrapeCysoEnhanced
};