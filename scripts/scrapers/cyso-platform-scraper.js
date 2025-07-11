const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// CYSO Platform Mall Scraper
// This scraper is designed for malls using the CYSO e-commerce platform
// Identified patterns: https://[subdomain].cyso.co.kr/

const CYSO_MALLS = [
  {
    id: 66,
    engname: 'andong-market',
    name: '안동장터',
    url: 'https://andongjang.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 76,
    engname: 'uiseong-market-day',
    name: '의성장날',
    url: 'https://esmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 77,
    engname: 'uljin-mall',
    name: '울진몰',
    url: 'https://ujmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 78,
    engname: 'yeongdeok-market',
    name: '영덕장터',
    url: 'https://ydmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 79,
    engname: 'gyeongsan-mall',
    name: '경산몰',
    url: 'https://gsmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 80,
    engname: 'gyeongju-mall',
    name: '경주몰',
    url: 'https://gjmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 81,
    engname: 'gumi-farm',
    name: '구미팜',
    url: 'https://gmmall.cyso.co.kr/',
    region: '경북'
  },
  {
    id: 82,
    engname: 'starlight-village-market-yeongcheon',
    name: '별빛촌장터(영천)',
    url: 'https://01000.cyso.co.kr/',
    region: '경북'
  }
];

async function scrapeCysoMall(mall) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`\nScraping ${mall.name} (${mall.url})...`);
    
    // Go to the main page
    await page.goto(mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Common CYSO selectors - may need adjustment per site
    const productSelectors = [
      '.goods_list li',
      '.item_list li',
      '.product_list li',
      '.prd_list li',
      '.goods-list li',
      'ul.list li.item',
      '.product-item',
      '.goods-item'
    ];
    
    let products = [];
    let productSelector = null;
    
    // Find which selector works
    for (const selector of productSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        productSelector = selector;
        console.log(`Found products using selector: ${selector}`);
        break;
      }
    }
    
    if (!productSelector) {
      console.log('No products found on main page, trying category pages...');
      
      // Try to find category links
      const categorySelectors = [
        '.gnb a',
        '.category_menu a',
        '.menu_list a',
        '.nav_menu a',
        '#gnb a'
      ];
      
      let categoryLinks = [];
      for (const selector of categorySelectors) {
        categoryLinks = await page.evaluate((sel) => {
          const links = document.querySelectorAll(sel);
          return Array.from(links)
            .map(a => ({ href: a.href, text: a.textContent.trim() }))
            .filter(link => 
              link.href.includes('/goods/') || 
              link.href.includes('/product/') ||
              link.href.includes('/shop/') ||
              link.href.includes('/category/')
            )
            .slice(0, 5); // Limit to first 5 categories
        }, selector);
        
        if (categoryLinks.length > 0) break;
      }
      
      // Scrape each category
      for (const category of categoryLinks) {
        console.log(`Scraping category: ${category.text}`);
        await page.goto(category.href, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to find products in this category
        for (const selector of productSelectors) {
          const categoryProducts = await page.evaluate((sel, mallInfo, cat) => {
            const items = document.querySelectorAll(sel);
            return Array.from(items).map(item => {
              const link = item.querySelector('a');
              const img = item.querySelector('img');
              const nameEl = item.querySelector('.name, .prd_name, .item_name, .goods_name, .title');
              const priceEl = item.querySelector('.price, .cost, .prd_price, .sale_price');
              
              if (!link || !nameEl) return null;
              
              const name = nameEl.textContent.trim();
              const url = link.href;
              const imageUrl = img ? img.src : '';
              
              // Extract price
              let price = 0;
              if (priceEl) {
                const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
                price = parseInt(priceText) || 0;
              }
              
              // Generate product ID
              const urlMatch = url.match(/[?&]no=(\d+)/) || url.match(/\/(\d+)$/);
              const productId = urlMatch ? urlMatch[1] : url.split('/').pop().split('?')[0];
              
              return {
                id: `${mallInfo.engname}-${productId}`,
                name: name,
                price: price,
                imageUrl: imageUrl,
                productUrl: url,
                category: cat.text,
                mallId: mallInfo.engname,
                mallName: mallInfo.name,
                mallUrl: mallInfo.url,
                region: mallInfo.region
              };
            }).filter(item => item && item.name);
          }, selector, mall, category);
          
          if (categoryProducts.length > 0) {
            products = products.concat(categoryProducts);
            console.log(`Found ${categoryProducts.length} products in ${category.text}`);
            break;
          }
        }
      }
    } else {
      // Scrape products from main page
      products = await page.evaluate((selector, mallInfo) => {
        const items = document.querySelectorAll(selector);
        return Array.from(items).map(item => {
          const link = item.querySelector('a');
          const img = item.querySelector('img');
          const nameEl = item.querySelector('.name, .prd_name, .item_name, .goods_name, .title');
          const priceEl = item.querySelector('.price, .cost, .prd_price, .sale_price');
          
          if (!link || !nameEl) return null;
          
          const name = nameEl.textContent.trim();
          const url = link.href;
          const imageUrl = img ? img.src : '';
          
          // Extract price
          let price = 0;
          if (priceEl) {
            const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
            price = parseInt(priceText) || 0;
          }
          
          // Generate product ID
          const urlMatch = url.match(/[?&]no=(\d+)/) || url.match(/\/(\d+)$/);
          const productId = urlMatch ? urlMatch[1] : url.split('/').pop().split('?')[0];
          
          return {
            id: `${mallInfo.engname}-${productId}`,
            name: name,
            price: price,
            imageUrl: imageUrl,
            productUrl: url,
            category: '전체상품',
            mallId: mallInfo.engname,
            mallName: mallInfo.name,
            mallUrl: mallInfo.url,
            region: mallInfo.region
          };
        }).filter(item => item && item.name);
      }, productSelector, mall);
    }
    
    console.log(`Found ${products.length} products for ${mall.name}`);
    return products;
    
  } catch (error) {
    console.error(`Error scraping ${mall.name}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAllCysoMalls() {
  console.log('Starting CYSO Platform Mall Scraping...');
  console.log(`Total malls to scrape: ${CYSO_MALLS.length}`);
  
  const allProducts = [];
  const results = {
    success: [],
    failed: []
  };
  
  for (const mall of CYSO_MALLS) {
    try {
      const products = await scrapeCysoMall(mall);
      
      if (products.length > 0) {
        allProducts.push(...products);
        results.success.push({
          mall: mall.name,
          productCount: products.length
        });
        
        // Save individual mall results
        const outputPath = path.join(__dirname, '..', 'output', `${mall.id}-${mall.engname}-products.json`);
        await fs.writeFile(outputPath, JSON.stringify(products, null, 2));
        console.log(`Saved ${products.length} products to ${outputPath}`);
      } else {
        results.failed.push({
          mall: mall.name,
          reason: 'No products found'
        });
      }
      
      // Delay between malls to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      results.failed.push({
        mall: mall.name,
        reason: error.message
      });
    }
  }
  
  // Save summary report
  const report = {
    timestamp: new Date().toISOString(),
    platform: 'CYSO',
    totalMalls: CYSO_MALLS.length,
    successCount: results.success.length,
    failedCount: results.failed.length,
    totalProducts: allProducts.length,
    results: results
  };
  
  const reportPath = path.join(__dirname, '..', 'output', 'cyso-platform-scraping-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== CYSO Platform Scraping Summary ===');
  console.log(`Total malls: ${CYSO_MALLS.length}`);
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log(`Total products collected: ${allProducts.length}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

// Run the scraper
if (require.main === module) {
  scrapeAllCysoMalls().catch(console.error);
}

module.exports = { scrapeCysoMall, scrapeAllCysoMalls };