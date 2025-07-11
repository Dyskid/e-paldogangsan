#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configure axios with lenient SSL settings and timeouts
const axiosConfig = {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Allow self-signed certificates
  }),
  maxRedirects: 5,
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  }
};

// Common CYSO mall patterns to try
const CYSO_PATTERNS = [
  '/shop/shopbrand.html',
  '/shop/shopbrand.html?type=Y',
  '/shop/shopbrand.html?type=X',
  '/goods/goods_list.php',
  '/goods/goods_list.php?cateCd=001',
  '/product/list.html',
  '/product/list.html?cate_no=24',
  '/product/list.html?cate_no=42',
];

// Other common e-commerce patterns
const COMMON_PATTERNS = [
  '/product',
  '/products',
  '/shop',
  '/item',
  '/goods',
  '/mall',
  '/category',
  '/list',
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, axiosConfig);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function extractCYSOProducts($, baseUrl) {
  const products = [];
  
  // Common CYSO selectors
  const selectors = [
    '.item-display-list .box', // CYSO standard
    '.prd-list li',
    '.item-list li',
    '.goods-list li',
    '.product-list li',
    '.xans-product-listnormal li',
    '.xans-product li',
  ];
  
  for (const selector of selectors) {
    const items = $(selector);
    if (items.length > 0) {
      console.log(`Found ${items.length} items with selector: ${selector}`);
      
      items.each((i, elem) => {
        try {
          const $item = $(elem);
          
          // Extract product name
          let name = $item.find('.name a').text().trim() ||
                    $item.find('.prd-name').text().trim() ||
                    $item.find('.item-name').text().trim() ||
                    $item.find('strong.name').text().trim() ||
                    $item.find('.title').text().trim();
          
          // Extract price
          let price = $item.find('.price').text().trim() ||
                     $item.find('.cost').text().trim() ||
                     $item.find('.prd-price').text().trim() ||
                     $item.find('.item-price').text().trim();
          
          // Extract URL
          let productUrl = $item.find('a').first().attr('href') ||
                          $item.find('.name a').attr('href') ||
                          $item.find('.thumb a').attr('href');
          
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = new URL(productUrl, baseUrl).href;
          }
          
          // Extract image
          let image = $item.find('img').first().attr('src') ||
                     $item.find('img').first().attr('data-src');
          
          if (image && !image.startsWith('http')) {
            image = new URL(image, baseUrl).href;
          }
          
          if (name && price) {
            products.push({
              name: name.substring(0, 200),
              price: price,
              url: productUrl || baseUrl,
              image: image,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('Error parsing product:', err.message);
        }
      });
      
      if (products.length > 0) break; // Stop if we found products
    }
  }
  
  return products;
}

async function extractGenericProducts($, baseUrl) {
  const products = [];
  
  // Generic product selectors
  const selectors = [
    'a[href*="product"]',
    'a[href*="goods"]',
    'a[href*="item"]',
    '.product',
    '.item',
    '.goods',
    '[class*="product"]',
    '[class*="item"]',
  ];
  
  for (const selector of selectors) {
    const items = $(selector);
    if (items.length > 0 && products.length === 0) {
      console.log(`Found ${items.length} potential items with selector: ${selector}`);
      
      items.slice(0, 50).each((i, elem) => { // Limit to first 50
        try {
          const $item = $(elem);
          const $parent = $item.parent();
          
          // Try to find product info nearby
          let name = $item.text().trim() ||
                    $parent.find('h2, h3, h4, .title, .name').first().text().trim();
          
          let price = $parent.find('.price, .cost, [class*="price"]').first().text().trim();
          
          let productUrl = $item.attr('href');
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = new URL(productUrl, baseUrl).href;
          }
          
          // Basic validation
          if (name && name.length > 5 && name.length < 200 && !name.includes('<')) {
            if (!price) {
              price = '가격 정보 없음';
            }
            
            products.push({
              name: name,
              price: price,
              url: productUrl || baseUrl,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          // Silent fail for individual items
        }
      });
    }
  }
  
  // Deduplicate by name
  const unique = {};
  products.forEach(p => {
    if (!unique[p.name]) {
      unique[p.name] = p;
    }
  });
  
  return Object.values(unique);
}

async function scrapeMall(mall) {
  console.log(`\n=== Scraping ${mall.name} ===`);
  console.log(`URL: ${mall.url}`);
  
  const products = [];
  let foundProducts = false;
  
  // First try the base URL
  const basePage = await fetchPage(mall.url);
  if (basePage) {
    const $ = cheerio.load(basePage);
    
    // Check if it's a CYSO mall
    const isCYSO = basePage.includes('cyso.co.kr') || 
                   basePage.includes('CYSO') ||
                   basePage.includes('shopbrand.html');
    
    if (isCYSO) {
      console.log('Detected CYSO mall, trying CYSO patterns...');
      
      // Try CYSO patterns
      for (const pattern of CYSO_PATTERNS) {
        if (foundProducts) break;
        
        const url = new URL(pattern, mall.url).href;
        const html = await fetchPage(url);
        
        if (html) {
          const $ = cheerio.load(html);
          const cysoProducts = await extractCYSOProducts($, mall.url);
          
          if (cysoProducts.length > 0) {
            console.log(`Found ${cysoProducts.length} products at ${url}`);
            products.push(...cysoProducts);
            foundProducts = true;
          }
        }
        
        await delay(500); // Be polite
      }
    }
    
    // If no products found yet, try generic extraction
    if (!foundProducts) {
      console.log('Trying generic product extraction...');
      const genericProducts = await extractGenericProducts($, mall.url);
      
      if (genericProducts.length > 0) {
        console.log(`Found ${genericProducts.length} products with generic extraction`);
        products.push(...genericProducts);
        foundProducts = true;
      }
    }
    
    // Try common patterns as last resort
    if (!foundProducts) {
      console.log('Trying common URL patterns...');
      
      for (const pattern of COMMON_PATTERNS) {
        if (foundProducts) break;
        
        const url = new URL(pattern, mall.url).href;
        const html = await fetchPage(url);
        
        if (html) {
          const $ = cheerio.load(html);
          const pageProducts = await extractGenericProducts($, mall.url);
          
          if (pageProducts.length > 0) {
            console.log(`Found ${pageProducts.length} products at ${url}`);
            products.push(...pageProducts);
            foundProducts = true;
          }
        }
        
        await delay(500);
      }
    }
  }
  
  // Limit products per mall
  const limitedProducts = products.slice(0, 100);
  
  console.log(`Total products found: ${limitedProducts.length}`);
  
  return {
    mall: mall.name,
    url: mall.url,
    productsCount: limitedProducts.length,
    products: limitedProducts,
    scrapedAt: new Date().toISOString(),
    success: limitedProducts.length > 0
  };
}

async function loadMalls() {
  try {
    const mallsPath = path.join(__dirname, '../../assets/malls.json');
    const data = await fs.readFile(mallsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading malls:', error);
    return [];
  }
}

async function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, '../../data/scraped-products');
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `simple-scrape-${timestamp}.json`);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
    
    // Also save a latest.json for easy access
    const latestPath = path.join(outputDir, 'latest.json');
    await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
    
    // Generate summary
    const summary = results.map(r => ({
      mall: r.mall,
      productsCount: r.productsCount,
      success: r.success
    }));
    
    const summaryPath = path.join(outputDir, `summary-${timestamp}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Print summary
    console.log('\n=== SCRAPING SUMMARY ===');
    console.log(`Total malls: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Total products: ${results.reduce((sum, r) => sum + r.productsCount, 0)}`);
    
  } catch (error) {
    console.error('Error saving results:', error);
  }
}

async function main() {
  console.log('Starting simple batch scraper...');
  console.log('This scraper uses HTTP requests for faster, more reliable scraping.\n');
  
  const malls = await loadMalls();
  console.log(`Loaded ${malls.length} malls\n`);
  
  const results = [];
  const batchSize = 5; // Process in small batches
  
  // Process malls in batches
  for (let i = 0; i < malls.length; i += batchSize) {
    const batch = malls.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(malls.length/batchSize)}`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(mall => scrapeMall(mall).catch(err => {
        console.error(`Failed to scrape ${mall.name}:`, err.message);
        return {
          mall: mall.name,
          url: mall.url,
          productsCount: 0,
          products: [],
          error: err.message,
          success: false
        };
      }))
    );
    
    results.push(...batchResults);
    
    // Save progress after each batch
    await saveResults(results);
    
    // Delay between batches
    if (i + batchSize < malls.length) {
      console.log('\nWaiting before next batch...');
      await delay(2000);
    }
  }
  
  console.log('\n=== SCRAPING COMPLETE ===');
  await saveResults(results);
}

// Run the scraper
main().catch(console.error);