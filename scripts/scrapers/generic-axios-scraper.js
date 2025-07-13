const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Generic axios scraper (S001)
 * Uses axios and cheerio for basic HTTP scraping
 */
async function scrapeWithAxios(mall) {
  const startTime = Date.now();
  try {
    const response = await axios.get(mall.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    const $ = cheerio.load(response.data);
    const products = [];

    const selectors = [
      '.product-item', '.goods-item', '.item',
      '.product_list li', '.goods_list li',
      'ul.products li', '.prd-item', '.prd_item'
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, elem) => {
          const $elem = $(elem);
          const name = $elem.find('.product-name, .goods-name, .name, .title, .prd_name').first().text().trim();
          const priceText = $elem.find('.price, .product-price, .cost, .prd_price').first().text();
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
      scraperId: 'S001'
    };
  } catch (error) {
    return {
      success: false,
      productCount: 0,
      products: [],
      error: error.message,
      executionTime: Date.now() - startTime,
      scraperId: 'S001'
    };
  }
}

module.exports = {
  scrape: scrapeWithAxios
};