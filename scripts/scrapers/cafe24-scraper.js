const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Cafe24 platform scraper (S005)
 * Scraper for Cafe24 e-commerce platform sites
 */
async function scrapeCafe24(mall) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(mall.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const products = [];

    // Cafe24 specific selectors
    const selectors = [
      '.xans-product-list li',
      '.xans-product-normalpackage li', 
      '.product-item',
      '.goods-item',
      '.item'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, elem) => {
          const $elem = $(elem);
          const name = $elem.find('.name, .product-name, .goods-name, .title').first().text().trim();
          const priceText = $elem.find('.price, .product-price, .cost').first().text();
          const price = parseInt(priceText.replace(/[^\d]/g, '') || '0');
          let url = $elem.find('a').first().attr('href') || '';
          if (url && !url.startsWith('http')) {
            url = new URL(url, mall.url).href;
          }
          let imageUrl = $elem.find('img').first().attr('src') || $elem.find('img').first().attr('data-src') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = new URL(imageUrl, mall.url).href;
          }

          if (name && url) {
            products.push({ name, price, url, imageUrl });
          }
        });
        if (products.length > 0) break;
      }
    }

    return {
      success: products.length >= 3,
      productCount: products.length,
      products,
      error: products.length < 3 ? `Only ${products.length} products found` : null,
      executionTime: Date.now() - startTime,
      scraperId: 'S005'
    };
  } catch (error) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      scraperId: 'S005'
    };
  }
}

module.exports = {
  scrape: scrapeCafe24
};