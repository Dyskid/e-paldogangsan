const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// Import existing scrapers
// Note: specific-mall-scraper is a CLI tool, not a module
const { scrapeRegionalMall } = require('./regional-mall-scraper');

// Import custom scraper functions for malls 1-10
let scraperFunctions = {};
let mallScraperMapping = {};
try {
  const customScrapers = require('./scraper-functions-1-10');
  scraperFunctions = customScrapers.scraperFunctions;
  mallScraperMapping = customScrapers.mallScraperMapping;
} catch (error) {
  console.log('No custom scraper functions found for malls 1-10');
}

// Import custom scraper functions for malls 61-70
try {
  const customScrapers6170 = require('./scraper-functions-61-70');
  // Merge scraper functions
  Object.assign(scraperFunctions, customScrapers6170.scraperFunctions);
  // Merge mall mappings
  Object.assign(mallScraperMapping, customScrapers6170.mallScraperMapping);
} catch (error) {
  console.log('No custom scraper functions found for malls 61-70');
}

// Import custom scraper functions for malls 71-80
try {
  const customScrapers7180 = require('./scraper-functions-71-80');
  // Merge scraper functions
  Object.assign(scraperFunctions, customScrapers7180.scraperFunctions);
  // Merge mall mappings
  Object.assign(mallScraperMapping, customScrapers7180.mallScraperMapping);
} catch (error) {
  console.log('No custom scraper functions found for malls 71-80');
}

// Add regional mall scraper to scraperFunctions
scraperFunctions['regional-mall'] = scrapeRegionalMall;

// Mall data
const CYSO_MALLS = [
  { id: 66, engname: 'andong-market', name: '안동장터', url: 'https://andongjang.cyso.co.kr/' },
  { id: 76, engname: 'uiseong-market-day', name: '의성장날', url: 'https://esmall.cyso.co.kr/' },
  { id: 77, engname: 'uljin-mall', name: '울진몰', url: 'https://ujmall.cyso.co.kr/' },
  { id: 78, engname: 'yeongdeok-market', name: '영덕장터', url: 'https://ydmall.cyso.co.kr/' },
  { id: 79, engname: 'gyeongsan-mall', name: '경산몰', url: 'https://gsmall.cyso.co.kr/' },
  { id: 80, engname: 'gyeongju-mall', name: '경주몰', url: 'https://gjmall.cyso.co.kr/' },
  { id: 81, engname: 'gumi-farm', name: '구미팜', url: 'https://gmmall.cyso.co.kr/' },
  { id: 82, engname: 'yeongcheon-star', name: '별빛촌장터(영천)', url: 'https://01000.cyso.co.kr/' }
];

const NAVER_MALLS = [
  { id: 43, engname: 'sunchang-local-food-shopping-mall', name: '순창로컬푸드쇼핑몰', url: 'https://smartstore.naver.com/schfarm' },
  { id: 47, engname: 'happy-good-farm', name: '해피굿팜', url: 'https://smartstore.naver.com/hgoodfarm' }
];

// Success criteria
const SUCCESS_CRITERIA = {
  minProducts: 3,  // Lowered from 5 to 3
  minProductFields: 2,  // Lowered from 3 to 2 (name and url are enough)
  validPriceRatio: 0.5,  // Lowered from 0.7 to 0.5
};

class IntelligentMasterScraper {
  constructor() {
    this.mappingFile = path.join(__dirname, 'data', 'scraper-mappings.json');
    this.mappings = new Map();
    this.scraperRegistry = new Map();
    this.scraperRegistryFile = path.join(__dirname, 'data', 'scraper-registry.json');
  }

  async initialize() {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Load scraper registry
    await this.loadScraperRegistry();
    
    // Load mappings from mall-scraper-mapping.json
    await this.loadMappings();
  }

  async loadScraperRegistry() {
    try {
      const data = await fs.readFile(this.scraperRegistryFile, 'utf-8');
      const registry = JSON.parse(data);
      
      if (registry.scrapers) {
        Object.entries(registry.scrapers).forEach(([scraperId, info]) => {
          this.scraperRegistry.set(scraperId, info);
        });
        console.log(`Loaded ${this.scraperRegistry.size} scrapers from registry`);
      }
    } catch (error) {
      console.error('Failed to load scraper registry:', error.message);
    }
  }

  async loadMappings() {
    try {
      // First try to load from mall-scraper-mapping.json
      const mappingFile = path.join(__dirname, 'data', 'mall-scraper-mapping.json');
      const data = await fs.readFile(mappingFile, 'utf-8');
      const mappingData = JSON.parse(data);
      
      // Convert to the format expected by this class
      if (mappingData.mappings) {
        Object.entries(mappingData.mappings).forEach(([mallId, info]) => {
          this.mappings.set(parseInt(mallId), {
            mallId: parseInt(mallId),
            bestScraperId: info.scraperId,
            notes: info.notes
          });
        });
        console.log(`Loaded ${this.mappings.size} scraper mappings from mall-scraper-mapping.json`);
      }
    } catch (error) {
      console.log('Loading from scraper-mappings.json...');
      // Fallback to old format
      try {
        const data = await fs.readFile(this.mappingFile, 'utf-8');
        const mappingsArray = JSON.parse(data);
        mappingsArray.forEach(m => this.mappings.set(m.mallId, m));
        console.log(`Loaded ${this.mappings.size} existing scraper mappings`);
      } catch (error) {
        console.log('No existing mappings found, starting fresh');
      }
    }
  }

  evaluateSuccess(products) {
    if (!products || products.length < SUCCESS_CRITERIA.minProducts) {
      return { success: false, reason: `Only ${products?.length || 0} products found` };
    }

    let validProducts = 0;
    let productsWithPrice = 0;

    for (const product of products) {
      let fieldCount = 0;
      if (product.name || product.title) fieldCount++;
      if (product.url) fieldCount++;
      if (product.price) {
        // Check if price is a string with numbers or a numeric value
        const priceStr = String(product.price);
        if (priceStr && (priceStr.match(/\d/) || product.price > 0)) {
          fieldCount++;
          productsWithPrice++;
        }
      }
      if (product.imageUrl || product.image) fieldCount++;

      if (fieldCount >= SUCCESS_CRITERIA.minProductFields) {
        validProducts++;
      }
    }

    const validRatio = validProducts / products.length;
    const priceRatio = productsWithPrice / products.length;

    if (validRatio < 0.5) {
      return { success: false, reason: 'Too many incomplete products' };
    }

    // Don't enforce price ratio for now since many sites don't show prices on listing pages
    // if (priceRatio < SUCCESS_CRITERIA.validPriceRatio) {
    //   return { success: false, reason: 'Too many products missing prices' };
    // }

    return { success: true };
  }

  // Generic axios scraper
  async scrapeWithAxios(mall) {
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

      const evaluation = this.evaluateSuccess(products);
      return {
        success: evaluation.success,
        productCount: products.length,
        products,
        error: evaluation.reason,
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

  // CYSO platform scraper
  async scrapeCysoPlatform(mall) {
    const startTime = Date.now();
    
    if (!mall.url.includes('cyso.co.kr')) {
      return {
        success: false,
        productCount: 0,
        products: [],
        error: 'Not a CYSO platform mall',
        executionTime: Date.now() - startTime,
        scraperId: 'S002'
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

      const evaluation = this.evaluateSuccess(products);
      return {
        success: evaluation.success,
        productCount: products.length,
        products,
        error: evaluation.reason,
        executionTime: Date.now() - startTime,
        scraperId: 'S002'
      };
    } catch (error) {
      return {
        success: false,
        productCount: 0,
        products: [],
        error: error.message,
        executionTime: Date.now() - startTime,
        scraperId: 'S002'
      };
    } finally {
      await browser.close();
    }
  }

  // Naver Smart Store scraper
  async scrapeNaverSmartStore(mall) {
    const startTime = Date.now();
    
    if (!mall.url.includes('smartstore.naver.com')) {
      return {
        success: false,
        productCount: 0,
        products: [],
        error: 'Not a Naver Smart Store',
        executionTime: Date.now() - startTime,
        scraperId: 'S004'
      };
    }

    // Use specific-mall-scraper for Naver stores as it has better handling
    try {
      const products = await scrapeSpecificMall(mall.name);
      const evaluation = this.evaluateSuccess(products);
      
      return {
        success: evaluation.success,
        productCount: products.length,
        products,
        error: evaluation.reason,
        executionTime: Date.now() - startTime,
        scraperId: 'S004'
      };
    } catch (error) {
      return {
        success: false,
        productCount: 0,
        products: [],
        error: error.message,
        executionTime: Date.now() - startTime,
        scraperId: 'S004'
      };
    }
  }

  // Custom platform scraper using existing specific-mall-scraper
  async scrapeCustomPlatform(mall) {
    const startTime = Date.now();
    
    try {
      const products = await scrapeSpecificMall(mall.name);
      const evaluation = this.evaluateSuccess(products);
      
      return {
        success: evaluation.success,
        productCount: products.length,
        products,
        error: evaluation.reason,
        executionTime: Date.now() - startTime,
        scraperId: 'S015'
      };
    } catch (error) {
      return {
        success: false,
        productCount: 0,
        products: [],
        error: error.message,
        executionTime: Date.now() - startTime,
        scraperId: 'S015'
      };
    }
  }

  // Determine which scraper ID to use based on URL patterns
  determineScraperId(mall) {
    if (mall.url.includes('cyso.co.kr')) return 'S002'; // CYSO platform
    if (mall.url.includes('smartstore.naver.com')) return 'S004'; // Naver Smart Store
    if (mall.url.includes('mangotree.co.kr')) return 'S009'; // Mangotree platform
    if (mall.url.includes('ezwel')) return 'S008'; // Ezwel platform
    // Check if it's a regional mall (IDs 11-26 based on mapping)
    if (mall.id >= 11 && mall.id <= 26) return 'S006'; // Regional mall
    if (mall.url.includes('-mall.com') || mall.url.includes('-mall.co.kr')) return 'S006'; // Regional mall
    return 'S001'; // Generic axios scraper
  }
  
  // Get scraper info by ID
  getScraperInfo(scraperId) {
    return this.scraperRegistry.get(scraperId);
  }
  
  // Get scraper method by ID
  getScraperMethod(scraperId) {
    switch (scraperId) {
      case 'S001': return this.scrapeWithAxios.bind(this);
      case 'S002': return this.scrapeCysoPlatform.bind(this);
      case 'S003': return scraperFunctions['cyso-enhanced'] || this.scrapeCysoPlatform.bind(this);
      case 'S004': return this.scrapeNaverSmartStore.bind(this);
      case 'S005': return scraperFunctions['cafe24'] || this.scrapeWithAxios.bind(this);
      case 'S006': return async (mall) => await scrapeRegionalMall(mall);
      case 'S007': return scraperFunctions['government'] || this.scrapeWithAxios.bind(this);
      case 'S008': return scraperFunctions['ezwel'] || this.scrapeWithAxios.bind(this);
      case 'S009': return scraperFunctions['mangotree'] || this.scrapeWithAxios.bind(this);
      case 'S010': return scraperFunctions['wordpress'] || this.scrapeWithAxios.bind(this);
      case 'S011': return scraperFunctions['gimcheon-custom'] || this.scrapeWithAxios.bind(this);
      case 'S012': return scraperFunctions['gokseong-custom'] || this.scrapeWithAxios.bind(this);
      case 'S013': return scraperFunctions['andong-custom'] || this.scrapeWithAxios.bind(this);
      case 'S014': return scraperFunctions['puppeteer'] || this.scrapeCysoPlatform.bind(this);
      case 'S015': return this.scrapeCustomPlatform.bind(this);
      default: return this.scrapeWithAxios.bind(this);
    }
  }

  // Find best scraper for a mall
  async findBestScraper(mall) {
    console.log(`\nFinding best scraper for ${mall.name} (${mall.url})`);
    
    const scrapers = [];
    
    // Add scrapers based on URL pattern
    const suggestedScraperId = this.determineScraperId(mall);
    const scraperInfo = this.getScraperInfo(suggestedScraperId);
    
    if (scraperInfo) {
      scrapers.push({ 
        id: suggestedScraperId, 
        type: scraperInfo.name, 
        method: this.getScraperMethod(suggestedScraperId) 
      });
    }
    
    // Add fallback scrapers
    if (suggestedScraperId !== 'S001') {
      scrapers.push({ 
        id: 'S001', 
        type: 'generic-axios', 
        method: this.getScraperMethod('S001') 
      });
    }
    if (suggestedScraperId !== 'S015') {
      scrapers.push({ 
        id: 'S015', 
        type: 'custom-platform', 
        method: this.getScraperMethod('S015') 
      });
    }

    let bestResult = null;
    let bestScraperId = null;
    const attempts = [];

    for (const scraper of scrapers) {
      console.log(`  Trying ${scraper.type} (${scraper.id})...`);
      const result = await scraper.method(mall);
      
      attempts.push({
        scraperId: scraper.id,
        scraperType: scraper.type,
        timestamp: new Date().toISOString(),
        success: result.success,
        productCount: result.productCount,
        executionTime: result.executionTime,
        error: result.error
      });

      console.log(`    Result: ${result.success ? 'Success' : 'Failed'} - ${result.productCount} products found`);

      if (result.success && (!bestResult || result.productCount > bestResult.productCount)) {
        bestResult = result;
        bestScraperId = scraper.id;
      }

      // If we found a good scraper with many products, no need to try others
      if (result.success && result.productCount > 50) {
        break;
      }
    }

    // Update mapping
    if (bestScraperId && bestResult) {
      const existingMapping = this.mappings.get(mall.id);
      const newMapping = {
        mallId: mall.id,
        mallName: mall.name,
        url: mall.url,
        bestScraperId,
        lastSuccess: new Date().toISOString(),
        productCount: bestResult.productCount,
        successRate: existingMapping && existingMapping.attempts ? 
          (existingMapping.attempts.filter(a => a.success).length + 1) / (existingMapping.attempts.length + attempts.length) :
          attempts.filter(a => a.success).length / attempts.length,
        attempts: [...(existingMapping?.attempts || []), ...attempts]
      };

      this.mappings.set(mall.id, newMapping);
      console.log(`✓ Best scraper for ${mall.name}: ${bestScraperId} (${bestResult.productCount} products)`);
      return bestResult;
    } else {
      console.log(`✗ No successful scraper found for ${mall.name}`);
      
      // Still save the failed attempts
      const existingMapping = this.mappings.get(mall.id);
      const newMapping = {
        mallId: mall.id,
        mallName: mall.name,
        url: mall.url,
        bestScraperId: existingMapping?.bestScraperId || '',
        lastSuccess: existingMapping?.lastSuccess || '',
        productCount: 0,
        successRate: existingMapping && existingMapping.attempts ? 
          existingMapping.attempts.filter(a => a.success).length / (existingMapping.attempts.length + attempts.length) :
          0,
        attempts: [...(existingMapping?.attempts || []), ...attempts]
      };
      this.mappings.set(mall.id, newMapping);
      
      return { success: false, products: [], productCount: 0, error: 'No successful scraper found' };
    }
  }

  // Get best scraper ID for a mall
  getBestScraperId(mallId) {
    return this.mappings.get(mallId)?.bestScraperId || null;
  }

  // Scrape using the best known scraper
  async scrapeWithBestMethod(mall) {
    const mapping = this.mappings.get(mall.id);
    
    // Check if we have a custom scraper function for this mall (1-10)
    if (mallScraperMapping[mall.id]) {
      const scraperFunctionName = mallScraperMapping[mall.id];
      const scraperFunction = scraperFunctions[scraperFunctionName];
      
      if (scraperFunction) {
        console.log(`Using custom scraper ${scraperFunctionName} for ${mall.name}`);
        const result = await scraperFunction(mall);
        
        if (result.success) {
          const evaluation = this.evaluateSuccess(result.products);
          if (evaluation.success) {
            return {
              success: true,
              scraper: scraperFunctionName,
              products: result.products,
              executionTime: Date.now()
            };
          }
        }
        
        console.log(`Custom scraper failed for ${mall.name}, trying other methods...`);
      }
    }
    
    if (!mapping || !mapping.bestScraperId) {
      console.log(`No known best scraper for ${mall.name}, finding one...`);
      return await this.findBestScraper(mall);
    }

    console.log(`Using scraper ${mapping.bestScraperId} for ${mall.name}`);
    
    // Get the scraper method by ID
    const scraperMethod = this.getScraperMethod(mapping.bestScraperId);
    if (scraperMethod) {
      return await scraperMethod(mall);
    } else {
      console.log(`Unknown scraper ID: ${mapping.bestScraperId}, finding best scraper...`);
      return await this.findBestScraper(mall);
    }
  }

  // Save mappings
  async saveMappings() {
    const mappingsArray = Array.from(this.mappings.values());
    await fs.writeFile(
      this.mappingFile,
      JSON.stringify(mappingsArray, null, 2)
    );
  }

  // Generate report
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalMalls: this.mappings.size,
      successfulMalls: Array.from(this.mappings.values()).filter(m => m.bestScraperId).length,
      scraperDistribution: {},
      topPerformers: [],
      problematicMalls: []
    };

    // Calculate scraper distribution
    for (const mapping of this.mappings.values()) {
      if (mapping.bestScraperId) {
        report.scraperDistribution[mapping.bestScraperId] = 
          (report.scraperDistribution[mapping.bestScraperId] || 0) + 1;
      }
    }

    // Find top performers and problematic malls
    const sortedMappings = Array.from(this.mappings.values())
      .sort((a, b) => b.productCount - a.productCount);

    report.topPerformers = sortedMappings.slice(0, 10).map(m => ({
      name: m.mallName,
      productCount: m.productCount,
      scraperId: m.bestScraperId
    }));

    report.problematicMalls = sortedMappings
      .filter(m => !m.bestScraperId || m.productCount === 0)
      .map(m => ({
        name: m.mallName,
        url: m.url,
        attempts: m.attempts.length
      }));

    await fs.writeFile(
      path.join(__dirname, 'data', 'scraper-performance-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== Scraper Performance Report ===');
    console.log(`Total malls: ${report.totalMalls}`);
    console.log(`Successful: ${report.successfulMalls}`);
    console.log('\nScraper distribution:');
    for (const [scraper, count] of Object.entries(report.scraperDistribution)) {
      console.log(`  ${scraper}: ${count} malls`);
    }
  }
}

// Main execution
async function main() {
  const system = new IntelligentMasterScraper();
  await system.initialize();

  // Load malls
  const mallsData = await fs.readFile(
    path.join(__dirname, '..', 'src', 'data', 'malls', 'malls.json'),
    'utf-8'
  );
  const malls = JSON.parse(mallsData);

  // Option 1: Find best scrapers for all malls
  if (process.argv[2] === 'discover') {
    for (const mall of malls) {
      await system.findBestScraper(mall);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    await system.saveMappings();
    await system.generateReport();
  }
  
  // Option 2: Scrape using known best methods
  else if (process.argv[2] === 'scrape') {
    // Create products directory
    const productsDir = path.join(__dirname, '..', 'src', 'data', 'products');
    await fs.mkdir(productsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    const results = [];
    let totalProductCount = 0;
    let successCount = 0;
    
    console.log(`\n=== Starting Intelligent Scraping Session ===`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Total malls to scrape: ${malls.length}\n`);
    
    for (let i = 0; i < malls.length; i++) {
      const mall = malls[i];
      console.log(`\n[${i + 1}/${malls.length}] Scraping ${mall.name}...`);
      
      const result = await system.scrapeWithBestMethod(mall);
      results.push({
        mall: mall.name,
        ...result
      });
      
      // Save individual mall products with new naming convention
      if (result.success && result.products.length > 0) {
        const filename = `${mall.id}-${mall.engname}-products-${timestamp}.json`;
        const filepath = path.join(productsDir, filename);
        
        const productData = {
          mallId: mall.id,
          mallName: mall.name,
          mallEngName: mall.engname,
          mallUrl: mall.url,
          region: mall.region,
          scrapedAt: timestamp,
          scraperId: result.scraperId || system.getBestScraperId(mall.id) || 'unknown',
          productCount: result.products.length,
          products: result.products
        };
        
        await fs.writeFile(filepath, JSON.stringify(productData, null, 2));
        console.log(`  ✓ Saved ${result.products.length} products to ${filename}`);
        
        totalProductCount += result.products.length;
        successCount++;
      } else {
        console.log(`  ✗ Failed: ${result.error || 'No products found'}`);
      }
      
      // Add delay between malls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save mappings
    await system.saveMappings();
    
    // Save overall results summary
    const summaryPath = path.join(productsDir, `scraping-summary-${timestamp}.json`);
    const summary = {
      timestamp,
      totalMalls: malls.length,
      successfulMalls: successCount,
      failedMalls: malls.length - successCount,
      totalProducts: totalProductCount,
      averageProductsPerMall: Math.round(totalProductCount / successCount) || 0,
      results
    };
    
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`\n=== Scraping Complete ===`);
    console.log(`Successfully scraped: ${successCount}/${malls.length} malls`);
    console.log(`Total products collected: ${totalProductCount}`);
    console.log(`Results saved to: ${productsDir}`);
    console.log(`Summary saved to: ${summaryPath}`);
  }
  
  // Option 3: Test specific mall
  else if (process.argv[2] === 'test' && process.argv[3]) {
    const mallName = process.argv[3];
    const mall = malls.find(m => 
      m.name.toLowerCase().includes(mallName.toLowerCase()) ||
      m.engname.toLowerCase().includes(mallName.toLowerCase())
    );
    
    if (mall) {
      const result = await system.findBestScraper(mall);
      await system.saveMappings();
      
      if (result.success) {
        console.log(`\nSuccessfully scraped ${result.productCount} products`);
        console.log('Sample products:');
        result.products.slice(0, 5).forEach((p, i) => {
          console.log(`${i + 1}. ${p.name} - ${p.price}원`);
        });
      }
    } else {
      console.log(`Mall "${mallName}" not found`);
    }
  }
  
  else {
    console.log('Usage:');
    console.log('  node intelligent-master-scraper.js discover  # Find best scrapers for all malls');
    console.log('  node intelligent-master-scraper.js scrape    # Scrape using best known methods');
    console.log('  node intelligent-master-scraper.js test "mall name"  # Test specific mall');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { IntelligentMasterScraper };