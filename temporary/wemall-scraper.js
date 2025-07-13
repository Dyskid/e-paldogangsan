#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const https = require('https');

async function scrapeWemall() {
  console.log('Scraping 우리몰 (wemall.kr)...');
  
  const results = {
    mallId: 3,
    mallName: '우리몰',
    url: 'https://wemall.kr',
    products: [],
    scrapedAt: new Date().toISOString(),
    success: false,
    error: null
  };

  try {
    // Launch puppeteer for dynamic content
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Common product listing URLs to try
    const urlsToTry = [
      'https://wemall.kr/shop/shopbrand.html',
      'https://wemall.kr/shop/shopbrand.html?type=Y',
      'https://wemall.kr/shop/shopbrand.html?type=N', 
      'https://wemall.kr/shop/shopbrand.html?xcode=001',
      'https://wemall.kr/goods/goods_list.php',
      'https://wemall.kr/product/list.html',
      'https://wemall.kr'
    ];
    
    for (const url of urlsToTry) {
      console.log(`Trying: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for common product elements
        await page.waitForSelector('body', { timeout: 5000 });
        
        // Get page content
        const content = await page.content();
        const $ = cheerio.load(content);
        
        // Multiple selectors for different e-commerce platforms
        const productSelectors = [
          // MakeShop patterns
          '.item-list .item',
          '.prd-list .prd-item',
          '.product-list .product-item',
          '.goods-list .goods-item',
          
          // Cafe24 patterns
          '.xans-product-listnormal li',
          '.xans-product-normalpackage li',
          '.prdList li',
          
          // Generic patterns
          '[class*="product"] li',
          '[class*="goods"] li',
          '[class*="item"] li',
          '.shop-list li',
          '.mall-list li',
          
          // Table patterns
          'table.product-list tr',
          'table.goods-list tr',
          
          // Grid patterns
          '.product-grid > div',
          '.item-grid > div'
        ];
        
        let products = [];
        
        for (const selector of productSelectors) {
          const items = $(selector);
          if (items.length > 0) {
            console.log(`Found ${items.length} items with selector: ${selector}`);
            
            items.each((i, elem) => {
              if (i >= 50) return; // Limit to 50 products
              
              const $item = $(elem);
              
              // Extract product name
              let name = '';
              const nameSelectors = ['.name', '.prd-name', '.product-name', '.goods-name', '.item-name', '.title', 'h3', 'h4', 'strong'];
              for (const sel of nameSelectors) {
                name = $item.find(sel).first().text().trim();
                if (name) break;
              }
              
              // Extract price
              let price = '';
              const priceSelectors = ['.price', '.cost', '.prd-price', '.product-price', '.goods-price', '.item-price', '.sale-price', 'span:contains("원")'];
              for (const sel of priceSelectors) {
                const priceText = $item.find(sel).first().text();
                if (priceText && priceText.includes('원')) {
                  price = priceText.trim();
                  break;
                }
              }
              
              // Extract URL
              let productUrl = $item.find('a').first().attr('href');
              if (productUrl && !productUrl.startsWith('http')) {
                productUrl = new URL(productUrl, url).href;
              }
              
              // Extract image
              let image = $item.find('img').first().attr('src') || 
                         $item.find('img').first().attr('data-src') ||
                         $item.find('img').first().attr('data-original');
              if (image && !image.startsWith('http')) {
                image = new URL(image, url).href;
              }
              
              if (name && name.length > 2) {
                products.push({
                  name: name,
                  price: price || '가격 정보 없음',
                  url: productUrl || url,
                  image: image,
                  scrapedAt: new Date().toISOString()
                });
              }
            });
            
            if (products.length > 0) break;
          }
        }
        
        // If no products found with selectors, try finding product links
        if (products.length === 0) {
          console.log('Trying to find product links...');
          
          const links = await page.evaluate(() => {
            const productLinks = [];
            const allLinks = document.querySelectorAll('a[href*="product"], a[href*="goods"], a[href*="view"], a[href*="detail"]');
            
            allLinks.forEach(link => {
              const text = link.textContent.trim();
              const href = link.href;
              const img = link.querySelector('img');
              
              if (text && text.length > 3 && text.length < 200) {
                productLinks.push({
                  name: text,
                  url: href,
                  image: img ? img.src : null
                });
              }
            });
            
            return productLinks;
          });
          
          products = links.slice(0, 50).map(link => ({
            ...link,
            price: '가격 정보는 상품 페이지에서 확인',
            scrapedAt: new Date().toISOString()
          }));
        }
        
        if (products.length > 0) {
          console.log(`Successfully scraped ${products.length} products from ${url}`);
          results.products = products;
          results.success = true;
          break;
        }
        
      } catch (error) {
        console.log(`Error on ${url}: ${error.message}`);
      }
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('Scraping error:', error);
    results.error = error.message;
  }
  
  return results;
}

// Export for use in other modules
module.exports = { scrapeWemall };

// Run if called directly
if (require.main === module) {
  scrapeWemall().then(results => {
    console.log('\nFinal Results:');
    console.log(`Mall: ${results.mallName}`);
    console.log(`Products found: ${results.products.length}`);
    console.log(`Success: ${results.success}`);
    if (results.error) {
      console.log(`Error: ${results.error}`);
    }
    
    if (results.products.length > 0) {
      console.log('\nSample products:');
      results.products.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - ${p.price}`);
      });
    }
  });
}