const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Specialized scrapers for specific malls that need custom handling

// 안동장터 (ID: 66) - Government site with unique structure
class AndongMarketScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
    this.baseUrl = 'https://andongjang.andong.go.kr';
  }

  async scrape() {
    console.log(`🏛️ Scraping 안동장터 (government site)`);
    
    try {
      // This site might have categories
      const categories = [
        '/shop/goods/goods_list.php?&category=001',
        '/shop/goods/goods_list.php?&category=002',
        '/shop/goods/goods_list.php?&category=003',
        '/shop/goods/goods_list.php?&category=004'
      ];
      
      for (const categoryPath of categories) {
        const url = this.baseUrl + categoryPath;
        const html = await this.fetchPage(url);
        if (!html) continue;
        
        const $ = cheerio.load(html);
        
        // Extract products
        $('.goods_list li, .item_list li').each((i, el) => {
          const $el = $(el);
          const name = $el.find('.goods_name, .item_name').text().trim();
          const priceText = $el.find('.goods_price, .item_price').text().trim();
          const img = $el.find('img').first();
          const link = $el.find('a').first();
          
          const price = this.extractPrice(priceText);
          if (name && price) {
            this.products.push({
              name: name,
              price: price,
              image: img.attr('src') ? this.baseUrl + img.attr('src') : null,
              url: link.attr('href') ? this.baseUrl + link.attr('href') : null,
              mall: this.mall.name,
              category: this.getCategoryFromPath(categoryPath),
              scrapedAt: new Date().toISOString()
            });
          }
        });
        
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Error scraping 안동장터:', error.message);
    }
    
    return this.products;
  }
  
  getCategoryFromPath(path) {
    if (path.includes('001')) return '농산물';
    if (path.includes('002')) return '축산물';
    if (path.includes('003')) return '수산물';
    if (path.includes('004')) return '가공식품';
    return '기타';
  }
  
  async fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });
        return response.data;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(2000);
      }
    }
  }
  
  extractPrice(text) {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : null;
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// e경남몰 (ID: 84) - Complex modern e-commerce site
class EGyeongnamMallScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
    this.baseUrl = 'https://egnmall.kr';
  }

  async scrape() {
    console.log(`🛍️ Scraping e경남몰 (modern e-commerce)`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to products page
      await page.goto(this.baseUrl + '/product/list.html', { waitUntil: 'networkidle2' });
      await this.delay(2000);
      
      // Scroll to load lazy-loaded products
      let previousHeight = 0;
      let currentHeight = await page.evaluate(() => document.body.scrollHeight);
      let scrollCount = 0;
      
      while (previousHeight !== currentHeight && scrollCount < 10) {
        previousHeight = currentHeight;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.delay(2000);
        currentHeight = await page.evaluate(() => document.body.scrollHeight);
        scrollCount++;
      }
      
      // Extract products
      this.products = await page.evaluate(() => {
        const products = [];
        const items = document.querySelectorAll('.prdList li, .item, .product-item');
        
        items.forEach(item => {
          const name = item.querySelector('.name, .prdName, .product-name')?.textContent?.trim();
          const priceEl = item.querySelector('.price, .prdPrice, .product-price');
          const img = item.querySelector('img');
          const link = item.querySelector('a');
          
          if (name && priceEl) {
            const priceText = priceEl.textContent.trim();
            const priceMatch = priceText.match(/[\d,]+/);
            const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
            
            if (price) {
              products.push({
                name: name,
                price: price,
                image: img ? img.src : null,
                url: link ? link.href : null
              });
            }
          }
        });
        
        return products;
      });
      
      // Add mall info and timestamp
      this.products = this.products.map(p => ({
        ...p,
        mall: this.mall.name,
        category: '기타',
        scrapedAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error scraping e경남몰:', error.message);
    } finally {
      if (browser) await browser.close();
    }
    
    return this.products;
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 김천노다지장터 (ID: 72) - Older style mall
class GimcheonNodajiScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
    this.baseUrl = 'http://gcnodaji.com';
  }

  async scrape() {
    console.log(`🏪 Scraping 김천노다지장터 (older style mall)`);
    
    try {
      // Try multiple possible shop URLs
      const shopUrls = [
        '/shop/shopbrand.html',
        '/shop/goods_list.php',
        '/product/list.html',
        '/mall/product_list.php'
      ];
      
      for (const shopPath of shopUrls) {
        try {
          const url = this.baseUrl + shopPath;
          const html = await this.fetchPage(url);
          if (!html) continue;
          
          const $ = cheerio.load(html);
          
          // Look for product elements
          const productSelectors = [
            '.item_list li',
            '.prd_list li',
            '.goods_list li',
            'table.goods_list tr',
            '.product_list .item'
          ];
          
          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              elements.each((i, el) => {
                const $el = $(el);
                const name = $el.find('.goods_name, .prd_name, .name').text().trim() ||
                           $el.find('a').first().text().trim();
                const priceText = $el.find('.price, .goods_price').text().trim();
                const img = $el.find('img').first();
                const link = $el.find('a').first();
                
                const price = this.extractPrice(priceText);
                if (name && price) {
                  this.products.push({
                    name: name,
                    price: price,
                    image: img.attr('src') ? this.makeAbsoluteUrl(img.attr('src')) : null,
                    url: link.attr('href') ? this.makeAbsoluteUrl(link.attr('href')) : null,
                    mall: this.mall.name,
                    category: '기타',
                    scrapedAt: new Date().toISOString()
                  });
                }
              });
              
              if (this.products.length > 0) break;
            }
          }
          
          if (this.products.length > 0) break;
        } catch (e) {
          // Try next URL
        }
        
        await this.delay(1000);
      }
    } catch (error) {
      console.error('Error scraping 김천노다지장터:', error.message);
    }
    
    return this.products;
  }
  
  makeAbsoluteUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'http:' + url;
    return this.baseUrl + (url.startsWith('/') ? '' : '/') + url;
  }
  
  async fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });
        return response.data;
      } catch (error) {
        if (i === retries - 1) return null;
        await this.delay(2000);
      }
    }
  }
  
  extractPrice(text) {
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : null;
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export specialized scrapers
module.exports = {
  AndongMarketScraper,
  EGyeongnamMallScraper,
  GimcheonNodajiScraper,
  
  // Factory function to get the right scraper
  getSpecializedScraper: (mall) => {
    switch (mall.id) {
      case 66:
        return new AndongMarketScraper(mall);
      case 84:
        return new EGyeongnamMallScraper(mall);
      case 72:
        return new GimcheonNodajiScraper(mall);
      default:
        return null;
    }
  }
};