const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Load mall status report
const statusReport = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'mall-scraping-status-report.json'), 'utf8')
);

// Filter unscraped malls
const unscrapedMalls = statusReport.mall_details.filter(mall => !mall.scraped);

// Categorize malls by platform
const naverMalls = unscrapedMalls.filter(mall => mall.url.includes('smartstore.naver.com'));
const cysoMalls = unscrapedMalls.filter(mall => mall.url.includes('cyso.co.kr'));
const otherMalls = unscrapedMalls.filter(
  mall => !mall.url.includes('smartstore.naver.com') && !mall.url.includes('cyso.co.kr')
);

// Base scraper class
class BaseScraper {
  constructor(mall) {
    this.mall = mall;
    this.products = [];
    this.errors = [];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching: ${url} (attempt ${i + 1})`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
          },
          timeout: 15000
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        if (i === retries - 1) throw error;
        await this.delay(2000);
      }
    }
  }

  extractPrice(priceText) {
    if (!priceText) return null;
    const priceMatch = priceText.match(/[\d,]+/);
    if (priceMatch) {
      return parseInt(priceMatch[0].replace(/,/g, ''));
    }
    return null;
  }

  async saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `${this.mall.id}-${this.mall.engname}-products.json`;
    const filepath = path.join(outputDir, filename);
    
    const output = {
      mall: {
        id: this.mall.id,
        name: this.mall.name,
        engname: this.mall.engname,
        url: this.mall.url,
        region: this.mall.region
      },
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      products: this.products,
      errors: this.errors
    };

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${this.products.length} products to ${filename}`);
    return filepath;
  }
}

// Naver Smart Store Scraper
class NaverScraper extends BaseScraper {
  async scrape() {
    console.log(`🛍️ Scraping Naver Smart Store: ${this.mall.name}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Go to store page
      await page.goto(this.mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.delay(2000);
      
      // Scroll to load products
      let previousHeight = 0;
      let currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      while (previousHeight !== currentHeight && this.products.length < 500) {
        previousHeight = currentHeight;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.delay(2000);
        currentHeight = await page.evaluate(() => document.body.scrollHeight);
        
        // Extract products
        const newProducts = await page.evaluate(() => {
          const products = [];
          const items = document.querySelectorAll('[class*="product_item"], [class*="ProductItem"], li[class*="item"]');
          
          items.forEach(item => {
            try {
              const nameEl = item.querySelector('[class*="name"], [class*="title"], h3, h4');
              const priceEl = item.querySelector('[class*="price"] span, [class*="price"]');
              const imgEl = item.querySelector('img');
              const linkEl = item.querySelector('a');
              
              if (nameEl && priceEl) {
                products.push({
                  name: nameEl.textContent.trim(),
                  price: priceEl.textContent.trim(),
                  image: imgEl ? imgEl.src : null,
                  url: linkEl ? linkEl.href : null
                });
              }
            } catch (e) {}
          });
          
          return products;
        });
        
        // Process new products
        for (const product of newProducts) {
          const price = this.extractPrice(product.price);
          if (price && !this.products.find(p => p.name === product.name)) {
            this.products.push({
              name: product.name,
              price: price,
              image: product.image,
              url: product.url,
              mall: this.mall.name,
              category: '기타',
              scrapedAt: new Date().toISOString()
            });
          }
        }
        
        console.log(`Found ${this.products.length} products so far...`);
      }
      
    } catch (error) {
      console.error(`Error scraping ${this.mall.name}:`, error.message);
      this.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      if (browser) await browser.close();
    }
    
    return this.products;
  }
}

// CYSO Platform Scraper
class CysoScraper extends BaseScraper {
  async scrape() {
    console.log(`🛒 Scraping CYSO mall: ${this.mall.name}`);
    
    try {
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= 50) {
        const url = `${this.mall.url}/shop/shopbrand.html?page=${page}`;
        const html = await this.fetchPage(url);
        
        if (!html) {
          hasMorePages = false;
          break;
        }
        
        const $ = cheerio.load(html);
        
        // Extract products
        const productElements = $('.item, .prd-item, .product-item, li[class*="item"]');
        
        if (productElements.length === 0) {
          // Try alternative selectors
          const altProducts = $('[class*="product"]').filter(function() {
            return $(this).find('[class*="name"]').length > 0;
          });
          
          if (altProducts.length === 0) {
            hasMorePages = false;
            break;
          }
          
          altProducts.each((i, el) => {
            const $el = $(el);
            const name = $el.find('[class*="name"], .prd-name, .item-name').text().trim();
            const priceText = $el.find('[class*="price"], .prd-price, .item-price').text().trim();
            const img = $el.find('img').first();
            const link = $el.find('a').first();
            
            const price = this.extractPrice(priceText);
            if (name && price) {
              this.products.push({
                name: name,
                price: price,
                image: img.attr('src') ? this.makeAbsoluteUrl(img.attr('src'), this.mall.url) : null,
                url: link.attr('href') ? this.makeAbsoluteUrl(link.attr('href'), this.mall.url) : null,
                mall: this.mall.name,
                category: '기타',
                scrapedAt: new Date().toISOString()
              });
            }
          });
        } else {
          productElements.each((i, el) => {
            const $el = $(el);
            const name = $el.find('.prd-brand, .item-name, [class*="name"]').text().trim();
            const priceText = $el.find('.prd-price, .item-price, [class*="price"]').text().trim();
            const img = $el.find('img').first();
            const link = $el.find('a').first();
            
            const price = this.extractPrice(priceText);
            if (name && price) {
              this.products.push({
                name: name,
                price: price,
                image: img.attr('src') ? this.makeAbsoluteUrl(img.attr('src'), this.mall.url) : null,
                url: link.attr('href') ? this.makeAbsoluteUrl(link.attr('href'), this.mall.url) : null,
                mall: this.mall.name,
                category: '기타',
                scrapedAt: new Date().toISOString()
              });
            }
          });
        }
        
        console.log(`Page ${page}: Found ${productElements.length} items, total: ${this.products.length}`);
        
        // Check for next page
        const nextButton = $('.paging a:contains("다음"), .next-page, a[href*="page=' + (page + 1) + '"]');
        hasMorePages = nextButton.length > 0;
        
        page++;
        await this.delay(1000);
      }
      
    } catch (error) {
      console.error(`Error scraping ${this.mall.name}:`, error.message);
      this.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.products;
  }
  
  makeAbsoluteUrl(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return new URL(url, baseUrl).href;
    return new URL(url, baseUrl).href;
  }
}

// Generic Website Scraper
class GenericScraper extends BaseScraper {
  async scrape() {
    console.log(`🌐 Scraping generic website: ${this.mall.name}`);
    
    try {
      // Try common product listing patterns
      const patterns = [
        '/shop', '/product', '/goods', '/item', '/mall', '/store',
        '/category', '/list', '/상품', '/쇼핑', '/products'
      ];
      
      let foundProducts = false;
      
      for (const pattern of patterns) {
        if (foundProducts) break;
        
        try {
          const testUrl = this.mall.url.endsWith('/') 
            ? this.mall.url + pattern.substring(1)
            : this.mall.url + pattern;
            
          const html = await this.fetchPage(testUrl);
          if (!html) continue;
          
          const $ = cheerio.load(html);
          
          // Look for product-like elements
          const productSelectors = [
            '.product', '.item', '.goods', '[class*="product"]', '[class*="item"]',
            'li[class*="prd"]', 'div[class*="prd"]', 'article[class*="product"]'
          ];
          
          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 3) { // Likely found products
              elements.each((i, el) => {
                if (i >= 100) return; // Limit to 100 products per page
                
                const $el = $(el);
                const name = $el.find('[class*="name"], [class*="title"], h3, h4, h5').first().text().trim();
                const priceText = $el.find('[class*="price"], [class*="cost"]').first().text().trim();
                const img = $el.find('img').first();
                const link = $el.find('a').first();
                
                const price = this.extractPrice(priceText);
                if (name && price && name.length > 2) {
                  this.products.push({
                    name: name,
                    price: price,
                    image: img.attr('src') ? this.makeAbsoluteUrl(img.attr('src'), this.mall.url) : null,
                    url: link.attr('href') ? this.makeAbsoluteUrl(link.attr('href'), this.mall.url) : null,
                    mall: this.mall.name,
                    category: this.guessCategory(name),
                    scrapedAt: new Date().toISOString()
                  });
                  foundProducts = true;
                }
              });
            }
          }
          
          if (this.products.length > 0) {
            console.log(`Found ${this.products.length} products using pattern: ${pattern}`);
            break;
          }
        } catch (e) {
          // Try next pattern
        }
        
        await this.delay(1000);
      }
      
      // If no products found with patterns, try homepage
      if (this.products.length === 0) {
        const html = await this.fetchPage(this.mall.url);
        if (html) {
          const $ = cheerio.load(html);
          
          // Look for any links that might lead to products
          $('a[href*="product"], a[href*="item"], a[href*="goods"]').each((i, el) => {
            if (i >= 50) return;
            
            const $el = $(el);
            const name = $el.text().trim() || $el.find('img').attr('alt') || '';
            const priceText = $el.parent().find('[class*="price"]').text().trim();
            const img = $el.find('img').first();
            
            const price = this.extractPrice(priceText);
            if (name && price && name.length > 2) {
              this.products.push({
                name: name,
                price: price,
                image: img.attr('src') ? this.makeAbsoluteUrl(img.attr('src'), this.mall.url) : null,
                url: $el.attr('href') ? this.makeAbsoluteUrl($el.attr('href'), this.mall.url) : null,
                mall: this.mall.name,
                category: this.guessCategory(name),
                scrapedAt: new Date().toISOString()
              });
            }
          });
        }
      }
      
    } catch (error) {
      console.error(`Error scraping ${this.mall.name}:`, error.message);
      this.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.products;
  }
  
  makeAbsoluteUrl(url, baseUrl) {
    if (!url) return null;
    try {
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return 'https:' + url;
      return new URL(url, baseUrl).href;
    } catch (e) {
      return null;
    }
  }
  
  guessCategory(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('쌀') || lowerName.includes('현미') || lowerName.includes('보리')) return '곡류';
    if (lowerName.includes('김치') || lowerName.includes('장아찌') || lowerName.includes('절임')) return '김치/절임';
    if (lowerName.includes('고기') || lowerName.includes('육류') || lowerName.includes('한우')) return '축산물';
    if (lowerName.includes('과일') || lowerName.includes('사과') || lowerName.includes('배') || lowerName.includes('포도')) return '과일';
    if (lowerName.includes('채소') || lowerName.includes('야채') || lowerName.includes('상추') || lowerName.includes('토마토')) return '채소';
    if (lowerName.includes('수산') || lowerName.includes('생선') || lowerName.includes('해산물')) return '수산물';
    if (lowerName.includes('차') || lowerName.includes('음료') || lowerName.includes('주스')) return '음료';
    if (lowerName.includes('장') || lowerName.includes('된장') || lowerName.includes('고추장')) return '전통식품';
    return '기타';
  }
}

// Main batch scraping function
async function scrapeAllUnscrapedMalls() {
  console.log('🚀 Starting batch scraping of unscraped malls');
  console.log(`📊 Total unscraped malls: ${unscrapedMalls.length}`);
  console.log(`   - Naver Smart Store: ${naverMalls.length}`);
  console.log(`   - CYSO Platform: ${cysoMalls.length}`);
  console.log(`   - Other websites: ${otherMalls.length}`);
  
  const results = [];
  const startTime = Date.now();
  
  // Create summary report
  const summaryReport = {
    startTime: new Date().toISOString(),
    totalMalls: unscrapedMalls.length,
    results: []
  };
  
  // Scrape Naver malls
  console.log('\n📱 Scraping Naver Smart Store malls...');
  for (const mall of naverMalls) {
    console.log(`\n--- Processing ${mall.name} (ID: ${mall.id}) ---`);
    const scraper = new NaverScraper(mall);
    
    try {
      await scraper.scrape();
      const filepath = await scraper.saveResults();
      
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'naver',
        status: 'success',
        productsCount: scraper.products.length,
        filepath: filepath
      });
    } catch (error) {
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'naver',
        status: 'failed',
        error: error.message
      });
    }
    
    // Delay between malls
    await scraper.delay(3000);
  }
  
  // Scrape CYSO malls
  console.log('\n🛒 Scraping CYSO platform malls...');
  for (const mall of cysoMalls) {
    console.log(`\n--- Processing ${mall.name} (ID: ${mall.id}) ---`);
    const scraper = new CysoScraper(mall);
    
    try {
      await scraper.scrape();
      const filepath = await scraper.saveResults();
      
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'cyso',
        status: 'success',
        productsCount: scraper.products.length,
        filepath: filepath
      });
    } catch (error) {
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'cyso',
        status: 'failed',
        error: error.message
      });
    }
    
    // Delay between malls
    await scraper.delay(2000);
  }
  
  // Scrape other malls
  console.log('\n🌐 Scraping other website malls...');
  for (const mall of otherMalls) {
    console.log(`\n--- Processing ${mall.name} (ID: ${mall.id}) ---`);
    const scraper = new GenericScraper(mall);
    
    try {
      await scraper.scrape();
      const filepath = await scraper.saveResults();
      
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'generic',
        status: 'success',
        productsCount: scraper.products.length,
        filepath: filepath
      });
    } catch (error) {
      summaryReport.results.push({
        mall: mall.name,
        id: mall.id,
        platform: 'generic',
        status: 'failed',
        error: error.message
      });
    }
    
    // Delay between malls
    await scraper.delay(2000);
  }
  
  // Complete summary report
  summaryReport.endTime = new Date().toISOString();
  summaryReport.duration = Math.round((Date.now() - startTime) / 1000);
  summaryReport.successCount = summaryReport.results.filter(r => r.status === 'success').length;
  summaryReport.failedCount = summaryReport.results.filter(r => r.status === 'failed').length;
  summaryReport.totalProducts = summaryReport.results
    .filter(r => r.status === 'success')
    .reduce((sum, r) => sum + r.productsCount, 0);
  
  // Save summary report
  const summaryPath = path.join(__dirname, 'output', `batch-scrape-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH SCRAPING COMPLETE');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${summaryReport.duration} seconds`);
  console.log(`✅ Successful: ${summaryReport.successCount} malls`);
  console.log(`❌ Failed: ${summaryReport.failedCount} malls`);
  console.log(`📦 Total products scraped: ${summaryReport.totalProducts}`);
  console.log(`📄 Summary report: ${summaryPath}`);
  
  return summaryReport;
}

// Run if called directly
if (require.main === module) {
  scrapeAllUnscrapedMalls()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  scrapeAllUnscrapedMalls,
  NaverScraper,
  CysoScraper,
  GenericScraper
};