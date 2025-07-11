const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const https = require('https');

// Create an axios instance with relaxed SSL for development
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// Enhanced Naver Scraper with dynamic content handling
class EnhancedNaverScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
    this.maxProducts = 100; // Limit for testing
  }

  async scrape() {
    console.log(`🛒 Scraping Naver Smart Store: ${this.mall.name}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the store
      console.log(`Navigating to: ${this.mall.url}`);
      await page.goto(this.mall.url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      // Wait for initial content
      await page.waitForTimeout(3000);
      
      // Click on products tab if exists
      try {
        await page.click('a[href*="/category/ALL"], a[role="tab"]:has-text("전체상품"), button:has-text("전체상품")', { timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('Products tab not found, continuing...');
      }
      
      // Scroll to load products
      let previousProductCount = 0;
      let currentProductCount = 0;
      let scrollAttempts = 0;
      const maxScrolls = 10;
      
      while (scrollAttempts < maxScrolls) {
        // Count current products
        currentProductCount = await page.evaluate(() => {
          const selectors = [
            'li[class*="ProductList"]',
            'div[class*="ProductCard"]',
            'a[class*="product_item"]',
            'div[class*="item_inner"]',
            'li.item',
            'div.goods_item'
          ];
          
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) return elements.length;
          }
          return 0;
        });
        
        console.log(`Found ${currentProductCount} products after scroll ${scrollAttempts + 1}`);
        
        if (currentProductCount >= this.maxProducts || currentProductCount === previousProductCount) {
          break;
        }
        
        // Scroll down
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        // Try clicking "더보기" button if exists
        try {
          const moreButton = await page.$('button:has-text("더보기"), button:has-text("더 보기"), a:has-text("더보기")');
          if (moreButton) {
            await moreButton.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          // No more button, continue scrolling
        }
        
        previousProductCount = currentProductCount;
        scrollAttempts++;
      }
      
      // Extract products
      this.products = await page.evaluate((mallName) => {
        const products = [];
        
        // Try multiple selectors
        const productSelectors = [
          'li[class*="ProductList"]',
          'div[class*="ProductCard"]',
          'a[class*="product_item"]',
          'div[class*="item_inner"]',
          'li.item',
          'div.goods_item'
        ];
        
        let productElements = [];
        for (const selector of productSelectors) {
          productElements = document.querySelectorAll(selector);
          if (productElements.length > 0) break;
        }
        
        productElements.forEach((item, index) => {
          if (index >= 100) return; // Limit for testing
          
          // Extract name
          const nameSelectors = [
            '[class*="name"]',
            '[class*="title"]',
            '.goods_name',
            'strong',
            'h3',
            'p'
          ];
          
          let name = '';
          for (const selector of nameSelectors) {
            const nameEl = item.querySelector(selector);
            if (nameEl && nameEl.textContent.trim()) {
              name = nameEl.textContent.trim();
              break;
            }
          }
          
          // Extract price
          const priceSelectors = [
            '[class*="price"]:not([class*="original"])',
            '[class*="sale"]',
            '.num',
            'span.num',
            'em'
          ];
          
          let priceText = '';
          for (const selector of priceSelectors) {
            const priceEl = item.querySelector(selector);
            if (priceEl && priceEl.textContent.match(/\d/)) {
              priceText = priceEl.textContent.trim();
              break;
            }
          }
          
          // Extract image
          const img = item.querySelector('img');
          const imgSrc = img ? (img.dataset.src || img.src) : null;
          
          // Extract link
          const link = item.querySelector('a');
          const href = link ? link.href : item.getAttribute('href');
          
          // Parse price
          const priceMatch = priceText.match(/[\d,]+/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
          
          if (name && price) {
            products.push({
              name: name.substring(0, 100), // Limit name length
              price: price,
              image: imgSrc,
              url: href,
              mall: mallName
            });
          }
        });
        
        return products;
      }, this.mall.name);
      
      // Add metadata
      this.products = this.products.map(p => ({
        ...p,
        category: '기타',
        scrapedAt: new Date().toISOString()
      }));
      
      console.log(`✅ Scraped ${this.products.length} products from Naver Smart Store`);
      
    } catch (error) {
      console.error('❌ Error scraping Naver Smart Store:', error.message);
    } finally {
      if (browser) await browser.close();
    }
    
    return this.products;
  }
}

// Enhanced CYSO Scraper with better URL handling
class EnhancedCYSOScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
  }

  async scrape() {
    console.log(`🏪 Scraping CYSO Mall: ${this.mall.name}`);
    
    try {
      // CYSO malls often have different URL structures
      const possiblePaths = [
        '/shop/shopbrand.html',
        '/shop/goods/goods_list.php',
        '/product/list.html',
        '/goods/catalog',
        '/product',
        '/shop',
        '/mall',
        '/store'
      ];
      
      let foundProducts = false;
      
      for (const path of possiblePaths) {
        try {
          const url = this.mall.url.replace(/\/$/, '') + path;
          console.log(`Trying URL: ${url}`);
          
          const response = await axiosInstance.get(url, {
            validateStatus: (status) => status < 500 // Accept redirects
          });
          
          // Check if we got redirected
          if (response.request && response.request.res && response.request.res.responseUrl) {
            console.log(`Redirected to: ${response.request.res.responseUrl}`);
          }
          
          const $ = cheerio.load(response.data);
          
          // CYSO specific selectors
          const productSelectors = [
            '.item-list .item',
            '.goods-list li',
            '.product-list .product',
            'ul.prdList li',
            '.goods_list_item',
            'table.goods-list tr',
            '.shop-item'
          ];
          
          for (const selector of productSelectors) {
            const items = $(selector);
            if (items.length > 0) {
              console.log(`Found ${items.length} items with selector: ${selector}`);
              
              items.each((i, el) => {
                if (i >= 50) return; // Limit for testing
                
                const $el = $(el);
                
                // Extract name
                const name = $el.find('.goods-name, .item-name, .name, h3, strong').first().text().trim() ||
                           $el.find('a').first().text().trim();
                
                // Extract price
                const priceText = $el.find('.price, .item-price, .goods-price').first().text().trim();
                const priceMatch = priceText.match(/[\d,]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
                
                // Extract image
                const img = $el.find('img').first();
                let imgSrc = img.attr('src') || img.attr('data-src');
                if (imgSrc && !imgSrc.startsWith('http')) {
                  imgSrc = new URL(imgSrc, this.mall.url).href;
                }
                
                // Extract link
                const link = $el.find('a').first();
                let href = link.attr('href');
                if (href && !href.startsWith('http')) {
                  href = new URL(href, this.mall.url).href;
                }
                
                if (name && price) {
                  this.products.push({
                    name: name.substring(0, 100),
                    price: price,
                    image: imgSrc,
                    url: href,
                    mall: this.mall.name,
                    category: '기타',
                    scrapedAt: new Date().toISOString()
                  });
                }
              });
              
              if (this.products.length > 0) {
                foundProducts = true;
                break;
              }
            }
          }
          
          if (foundProducts) break;
          
        } catch (error) {
          console.log(`Failed to fetch ${path}: ${error.message}`);
        }
        
        await this.delay(1000);
      }
      
      console.log(`✅ Scraped ${this.products.length} products from CYSO mall`);
      
    } catch (error) {
      console.error('❌ Error scraping CYSO mall:', error.message);
    }
    
    return this.products;
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Enhanced Generic Scraper with better error handling
class EnhancedGenericScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
  }

  async scrape() {
    console.log(`🌐 Scraping Generic Mall: ${this.mall.name}`);
    
    try {
      // Handle URL variations
      let workingUrl = this.mall.url;
      const urlsToTry = [workingUrl];
      
      // Add www if missing
      if (!workingUrl.includes('www.')) {
        const urlWithWww = workingUrl.replace('://', '://www.');
        urlsToTry.push(urlWithWww);
      }
      
      // Remove www if present
      if (workingUrl.includes('www.')) {
        const urlWithoutWww = workingUrl.replace('://www.', '://');
        urlsToTry.push(urlWithoutWww);
      }
      
      let response = null;
      let successUrl = null;
      
      // Try different URL variations
      for (const url of urlsToTry) {
        try {
          console.log(`Trying URL: ${url}`);
          response = await axiosInstance.get(url);
          successUrl = url;
          break;
        } catch (error) {
          console.log(`Failed to fetch ${url}: ${error.message}`);
        }
      }
      
      if (!response) {
        throw new Error('Failed to fetch any URL variation');
      }
      
      console.log(`Successfully fetched: ${successUrl}`);
      const $ = cheerio.load(response.data);
      
      // Look for common e-commerce patterns
      const possibleLinks = $('a[href*="product"], a[href*="shop"], a[href*="goods"], a[href*="mall"], a[href*="store"]');
      const shopLinks = [];
      
      possibleLinks.each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.includes('#') && !href.includes('javascript')) {
          const fullUrl = new URL(href, successUrl).href;
          if (!shopLinks.includes(fullUrl)) {
            shopLinks.push(fullUrl);
          }
        }
      });
      
      console.log(`Found ${shopLinks.length} potential shop links`);
      
      // Try to find product pages
      const productPages = shopLinks.slice(0, 5); // Limit for testing
      
      for (const pageUrl of productPages) {
        try {
          const pageResponse = await axiosInstance.get(pageUrl);
          const page$ = cheerio.load(pageResponse.data);
          
          // Generic product selectors
          const selectors = [
            '.product-item',
            '.goods-item',
            '.item',
            'li[class*="product"]',
            'div[class*="product"]',
            'article[class*="product"]',
            '.list-item',
            '.shop-item'
          ];
          
          for (const selector of selectors) {
            const items = page$(selector);
            if (items.length > 0) {
              console.log(`Found ${items.length} items on ${pageUrl}`);
              
              items.each((i, el) => {
                if (this.products.length >= 50) return; // Limit
                
                const $el = page$(el);
                
                // Extract product info
                const name = this.extractText($el, page$, [
                  '.name', '.title', 'h2', 'h3', 'h4', 'strong', '.product-name', '.goods-name'
                ]);
                
                const priceText = this.extractText($el, page$, [
                  '.price', '.cost', '.product-price', '.goods-price', 'span[class*="price"]'
                ]);
                
                const priceMatch = priceText.match(/[\d,]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : null;
                
                // Image
                const img = $el.find('img').first();
                let imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-original');
                if (imgSrc && !imgSrc.startsWith('http')) {
                  imgSrc = new URL(imgSrc, pageUrl).href;
                }
                
                // Link
                const link = $el.find('a').first();
                let href = link.attr('href');
                if (href && !href.startsWith('http')) {
                  href = new URL(href, pageUrl).href;
                }
                
                if (name && price) {
                  this.products.push({
                    name: name.substring(0, 100),
                    price: price,
                    image: imgSrc,
                    url: href || pageUrl,
                    mall: this.mall.name,
                    category: '기타',
                    scrapedAt: new Date().toISOString()
                  });
                }
              });
              
              if (this.products.length > 0) break;
            }
          }
          
          await this.delay(1000);
        } catch (error) {
          console.log(`Failed to scrape ${pageUrl}: ${error.message}`);
        }
      }
      
      console.log(`✅ Scraped ${this.products.length} products from generic mall`);
      
    } catch (error) {
      console.error('❌ Error scraping generic mall:', error.message);
    }
    
    return this.products;
  }
  
  extractText($el, $, selectors) {
    for (const selector of selectors) {
      const text = $el.find(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }
  
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function to get the appropriate scraper
function getEnhancedScraper(mall) {
  if (mall.url.includes('smartstore.naver.com')) {
    return new EnhancedNaverScraper(mall);
  } else if (mall.scraperType === 'cyso' || mall.url.includes('.cyso.co.kr')) {
    return new EnhancedCYSOScraper(mall);
  } else {
    return new EnhancedGenericScraper(mall);
  }
}

module.exports = {
  EnhancedNaverScraper,
  EnhancedCYSOScraper,
  EnhancedGenericScraper,
  getEnhancedScraper
};