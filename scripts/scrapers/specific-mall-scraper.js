#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Get mall name from command line
const mallName = process.argv[2];

if (!mallName) {
  console.log('Usage: node specific-mall-scraper.js "Mall Name"');
  console.log('Example: node specific-mall-scraper.js "의성몰"');
  process.exit(1);
}

const axiosConfig = {
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  maxRedirects: 5,
  validateStatus: function (status) {
    return status < 500;
  }
};

async function loadMalls() {
  const mallsPath = path.join(__dirname, '../../data/malls.json');
  const data = await fs.readFile(mallsPath, 'utf-8');
  return JSON.parse(data);
}

async function extractProducts($, baseUrl, mallInfo) {
  const products = [];
  
  // Extended list of selectors to try
  const productSelectors = [
    // CYSO specific
    '.item-display-list .box',
    '.prd-list > li',
    '.item-wrap .item-cont',
    '.goods-list-item',
    '.xans-product-listnormal li',
    '.xans-product-normalpackage li',
    
    // Cafe24
    '.prdList li',
    '.product-list li',
    'ul.prdList > li',
    
    // General Korean e-commerce
    '.goods_list li',
    '.product_list li',
    '.item_list li',
    '.prod-list li',
    '.product-item',
    '.goods-item',
    
    // Table based layouts
    'table.product-list tr:has(td)',
    'table.goods-list tr:has(td)',
    
    // Grid layouts
    '.product-grid > div',
    '.item-grid > div',
    '[class*="product-card"]',
    '[class*="goods-card"]',
  ];
  
  console.log('Trying product selectors...');
  
  for (const selector of productSelectors) {
    const items = $(selector);
    if (items.length > 0) {
      console.log(`✓ Found ${items.length} items with selector: ${selector}`);
      
      items.each((i, elem) => {
        if (i >= 100) return; // Limit to 100 products
        
        try {
          const $item = $(elem);
          
          // Name extraction strategies
          const nameSelectors = [
            '.name a', '.prd-name', '.item-name', '.goods-name',
            '.product-name', 'strong.name', '.title', 'h3', 'h4',
            '.prd_name', '.prd-info .name', '.info .name'
          ];
          
          let name = '';
          for (const sel of nameSelectors) {
            name = $item.find(sel).first().text().trim();
            if (name) break;
          }
          
          // Price extraction strategies
          const priceSelectors = [
            '.price', '.cost', '.prd-price', '.item-price',
            '.product-price', '.goods-price', '.selling-price',
            '.prd_price', '.consumer', 'strong:contains("원")'
          ];
          
          let price = '';
          for (const sel of priceSelectors) {
            price = $item.find(sel).first().text().trim();
            if (price && price.includes('원')) break;
          }
          
          // URL extraction
          let productUrl = $item.find('a').first().attr('href') ||
                          $item.find('.name a, .prd-name a').attr('href');
          
          if (productUrl && !productUrl.startsWith('http')) {
            productUrl = new URL(productUrl, baseUrl).href;
          }
          
          // Image extraction
          let image = $item.find('img').first().attr('src') ||
                     $item.find('img').first().attr('data-src') ||
                     $item.find('img').first().attr('data-original');
          
          if (image && !image.startsWith('http')) {
            image = new URL(image, baseUrl).href;
          }
          
          // Clean up and validate
          name = name.replace(/\s+/g, ' ').trim();
          price = price.replace(/\s+/g, ' ').trim();
          
          if (name && name.length > 3 && name.length < 300) {
            products.push({
              name: name,
              price: price || '가격 정보 없음',
              url: productUrl || baseUrl,
              image: image,
              category: $item.closest('[class*="category"]').attr('class') || '',
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          // Silent fail for individual items
        }
      });
      
      if (products.length > 0) break; // Stop after finding products
    }
  }
  
  // If no products found, try finding any links that might be products
  if (products.length === 0) {
    console.log('No products found with standard selectors, trying link analysis...');
    
    const links = $('a[href*="product"], a[href*="goods"], a[href*="item"], a[href*="view"]');
    const uniqueLinks = new Set();
    
    links.each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href && text && text.length > 5 && text.length < 200 && !uniqueLinks.has(text)) {
        uniqueLinks.add(text);
        
        let url = href;
        if (!url.startsWith('http')) {
          url = new URL(href, baseUrl).href;
        }
        
        products.push({
          name: text,
          price: '가격 정보는 상품 페이지에서 확인',
          url: url,
          scrapedAt: new Date().toISOString()
        });
        
        if (products.length >= 50) return false; // Stop at 50
      }
    });
  }
  
  return products;
}

async function scrapeMall(mall) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Scraping: ${mall.name}`);
  console.log(`URL: ${mall.url}`);
  console.log(`Region: ${mall.region}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const results = {
    mall: mall.name,
    url: mall.url,
    region: mall.region,
    products: [],
    pagesChecked: [],
    success: false,
    error: null,
    scrapedAt: new Date().toISOString()
  };
  
  try {
    // Common patterns to try
    const urlPatterns = [
      '', // Base URL
      '/shop/shopbrand.html',
      '/shop/shopbrand.html?type=Y',
      '/shop/shopbrand.html?type=P',
      '/goods/goods_list.php',
      '/product/list.html',
      '/product',
      '/products',
      '/shop',
      '/mall',
      '/goods',
    ];
    
    for (const pattern of urlPatterns) {
      const url = pattern ? new URL(pattern, mall.url).href : mall.url;
      console.log(`\nChecking: ${url}`);
      results.pagesChecked.push(url);
      
      try {
        const response = await axios.get(url, axiosConfig);
        const $ = cheerio.load(response.data);
        
        // Extract title for context
        const pageTitle = $('title').text();
        console.log(`Page title: ${pageTitle}`);
        
        // Check if it's an e-commerce page
        const hasProducts = response.data.includes('상품') || 
                          response.data.includes('product') ||
                          response.data.includes('goods') ||
                          response.data.includes('가격');
        
        if (hasProducts) {
          console.log('✓ Detected e-commerce content');
          
          const products = await extractProducts($, url, mall);
          
          if (products.length > 0) {
            console.log(`✓ Found ${products.length} products!`);
            results.products.push(...products);
            results.success = true;
            
            // Stop after finding products
            if (products.length >= 20) {
              break;
            }
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`✗ Error: ${error.message}`);
      }
    }
    
    // Remove duplicates
    const uniqueProducts = {};
    results.products.forEach(p => {
      const key = p.name + p.price;
      if (!uniqueProducts[key]) {
        uniqueProducts[key] = p;
      }
    });
    results.products = Object.values(uniqueProducts);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FINAL RESULTS:`);
    console.log(`Total unique products found: ${results.products.length}`);
    console.log(`Pages checked: ${results.pagesChecked.length}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    results.error = error.message;
    console.error('Scraping error:', error.message);
  }
  
  return results;
}

async function main() {
  const malls = await loadMalls();
  const targetMall = malls.find(m => 
    m.name.toLowerCase().includes(mallName.toLowerCase()) ||
    m.url.includes(mallName.toLowerCase())
  );
  
  if (!targetMall) {
    console.log(`Mall "${mallName}" not found!`);
    console.log('\nAvailable malls:');
    malls.forEach(m => console.log(`  - ${m.name} (${m.region})`));
    process.exit(1);
  }
  
  const results = await scrapeMall(targetMall);
  
  // Save results
  const outputDir = path.join(__dirname, '../../data/scraped-products');
  await fs.mkdir(outputDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${targetMall.name.replace(/[^\w가-힣]/g, '-')}-${timestamp}.json`;
  const outputPath = path.join(outputDir, filename);
  
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  // Also save as latest for this mall
  const latestPath = path.join(outputDir, `${targetMall.name.replace(/[^\w가-힣]/g, '-')}-latest.json`);
  await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
  
  // Display sample products
  if (results.products.length > 0) {
    console.log('\nSample products:');
    results.products.slice(0, 5).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   URL: ${p.url}`);
    });
  }
}

main().catch(console.error);