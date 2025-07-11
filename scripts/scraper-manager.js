const { getEnhancedScraper } = require('./enhanced-scrapers');
const { getSpecializedScraper } = require('./specialized-mall-scrapers');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const https = require('https');

class ScraperManager {
  constructor() {
    this.results = [];
    this.errors = [];
    this.stats = {
      totalMalls: 0,
      successfulMalls: 0,
      failedMalls: 0,
      totalProducts: 0,
      scrapingTime: 0
    };
  }

  async scrapeMall(mall) {
    const startTime = Date.now();
    let products = [];
    let error = null;
    
    try {
      console.log(`\n🔍 Scraping ${mall.name} (ID: ${mall.id})`);
      console.log(`   URL: ${mall.url}`);
      
      // Try specialized scraper first if available
      const specializedScraper = getSpecializedScraper(mall);
      if (specializedScraper) {
        console.log(`   Using specialized scraper`);
        products = await specializedScraper.scrape();
      } else {
        // Use enhanced scraper based on URL pattern
        console.log(`   Using enhanced scraper`);
        const enhancedScraper = getEnhancedScraper(mall);
        products = await enhancedScraper.scrape();
      }
      
      // If no products found, try fallback scraper
      if (products.length === 0) {
        console.log(`   No products found, trying fallback scraper...`);
        products = await this.fallbackScraper(mall);
      }
      
      if (products.length > 0) {
        this.stats.successfulMalls++;
        this.stats.totalProducts += products.length;
        console.log(`   ✅ Found ${products.length} products`);
      } else {
        this.stats.failedMalls++;
        error = 'No products found';
        console.log(`   ⚠️ No products found`);
      }
      
    } catch (err) {
      this.stats.failedMalls++;
      error = err.message;
      console.error(`   ❌ Error: ${err.message}`);
    }
    
    const endTime = Date.now();
    const scrapingTime = (endTime - startTime) / 1000;
    
    this.results.push({
      mall,
      products,
      error,
      scrapingTime,
      timestamp: new Date().toISOString()
    });
    
    if (error) {
      this.errors.push({
        mall: mall.name,
        url: mall.url,
        error,
        timestamp: new Date().toISOString()
      });
    }
    
    return { products, error, scrapingTime };
  }

  async fallbackScraper(mall) {
    console.log(`   🔄 Attempting fallback scraper...`);
    const products = [];
    
    try {
      // Create axios instance with relaxed settings
      const instance = axios.create({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MallScraper/1.0)'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });
      
      // Try to fetch the homepage
      const response = await instance.get(mall.url);
      const $ = cheerio.load(response.data);
      
      // Look for any links that might lead to products
      const productLinks = new Set();
      
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && (
          href.includes('product') ||
          href.includes('goods') ||
          href.includes('shop') ||
          href.includes('item') ||
          href.includes('mall')
        )) {
          try {
            const fullUrl = new URL(href, mall.url).href;
            productLinks.add(fullUrl);
          } catch (e) {
            // Invalid URL, skip
          }
        }
      });
      
      // Try to scrape first few product links
      const linksToTry = Array.from(productLinks).slice(0, 3);
      
      for (const link of linksToTry) {
        try {
          const pageResponse = await instance.get(link);
          const page$ = cheerio.load(pageResponse.data);
          
          // Very broad selectors to catch any product-like elements
          const elements = page$('*').filter((i, el) => {
            const text = page$(el).text();
            return text.includes('원') && text.match(/\d/);
          });
          
          elements.each((i, el) => {
            if (products.length >= 10) return; // Limit
            
            const $parent = page$(el).parent();
            const text = $parent.text();
            
            // Try to extract name and price
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            let name = '';
            let price = null;
            
            for (const line of lines) {
              if (!price && line.includes('원')) {
                const match = line.match(/[\d,]+/);
                if (match) {
                  price = parseInt(match[0].replace(/,/g, ''));
                }
              } else if (!name && line.length > 5 && line.length < 100) {
                name = line;
              }
            }
            
            if (name && price && price > 100 && price < 10000000) {
              products.push({
                name: name.substring(0, 100),
                price,
                image: null,
                url: link,
                mall: mall.name,
                category: '기타',
                scrapedAt: new Date().toISOString()
              });
            }
          });
          
          if (products.length > 0) break;
        } catch (e) {
          // Try next link
        }
      }
      
    } catch (error) {
      console.log(`   Fallback scraper failed: ${error.message}`);
    }
    
    return products;
  }

  async scrapeMalls(malls, options = {}) {
    const { 
      concurrent = 1, 
      delay = 2000,
      retryFailed = true,
      saveProgress = true 
    } = options;
    
    this.stats.totalMalls = malls.length;
    const startTime = Date.now();
    
    console.log(`🚀 Starting scraping of ${malls.length} malls`);
    console.log(`   Concurrent: ${concurrent}`);
    console.log(`   Delay: ${delay}ms`);
    console.log(`   Retry failed: ${retryFailed}`);
    
    // Process malls in batches
    for (let i = 0; i < malls.length; i += concurrent) {
      const batch = malls.slice(i, i + concurrent);
      
      await Promise.all(
        batch.map(mall => this.scrapeMall(mall))
      );
      
      // Save progress if enabled
      if (saveProgress && i % 10 === 0) {
        await this.saveProgress();
      }
      
      // Delay between batches
      if (i + concurrent < malls.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Retry failed malls if enabled
    if (retryFailed && this.errors.length > 0) {
      console.log(`\n🔁 Retrying ${this.errors.length} failed malls...`);
      const failedMalls = malls.filter(mall => 
        this.errors.some(e => e.url === mall.url)
      );
      
      for (const mall of failedMalls) {
        await this.scrapeMall(mall);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const endTime = Date.now();
    this.stats.scrapingTime = (endTime - startTime) / 1000;
    
    return this.getResults();
  }

  async saveProgress() {
    const fs = require('fs').promises;
    const progressFile = './data/scraping-progress.json';
    
    try {
      await fs.writeFile(
        progressFile,
        JSON.stringify({
          stats: this.stats,
          results: this.results.map(r => ({
            mall: r.mall.name,
            productCount: r.products.length,
            error: r.error,
            timestamp: r.timestamp
          })),
          savedAt: new Date().toISOString()
        }, null, 2)
      );
    } catch (error) {
      console.error('Failed to save progress:', error.message);
    }
  }

  getResults() {
    return {
      stats: this.stats,
      results: this.results,
      errors: this.errors,
      summary: {
        successRate: (this.stats.successfulMalls / this.stats.totalMalls * 100).toFixed(2) + '%',
        averageProductsPerMall: (this.stats.totalProducts / this.stats.successfulMalls).toFixed(2),
        totalScrapingTime: this.stats.scrapingTime.toFixed(2) + 's',
        averageTimePerMall: (this.stats.scrapingTime / this.stats.totalMalls).toFixed(2) + 's'
      }
    };
  }

  async saveResults(filename = './data/scraping-results.json') {
    const fs = require('fs').promises;
    const results = this.getResults();
    
    try {
      await fs.writeFile(filename, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to ${filename}`);
    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
  }
}

module.exports = ScraperManager;