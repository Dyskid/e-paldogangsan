const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Naver Smart Store Scraper
// This scraper handles Naver Smart Store URLs with rate limiting protection

const NAVER_MALLS = [
  {
    id: 43,
    engname: 'sunchang-local-food-shopping-mall',
    name: '순창로컬푸드쇼핑몰',
    url: 'https://smartstore.naver.com/schfarm',
    region: '전북'
  },
  {
    id: 47,
    engname: 'happy-good-farm',
    name: '해피굿팜',
    url: 'https://smartstore.naver.com/hgoodfarm',
    region: '전남'
  }
];

async function scrapeNaverSmartStore(mall, maxProducts = 50) {
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
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Add extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
    });
    
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`\nScraping ${mall.name} (${mall.url})...`);
    
    // Navigate with longer timeout
    await page.goto(mall.url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    
    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if we hit rate limit
    const pageContent = await page.content();
    if (pageContent.includes('429') || pageContent.includes('Too Many Requests')) {
      console.log('Rate limited by Naver. Will retry with longer delay...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    }
    
    // Wait for product list to load
    try {
      await page.waitForSelector('._3BkKgDHq3l', { timeout: 10000 });
    } catch (e) {
      console.log('Product list not found with primary selector, trying alternatives...');
    }
    
    // Scroll to load more products
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrollAttempts = 0;
    
    while (previousHeight !== currentHeight && scrollAttempts < 5) {
      previousHeight = currentHeight;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 3000));
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      scrollAttempts++;
    }
    
    // Extract products
    const products = await page.evaluate((mallInfo, maxProd) => {
      const productElements = document.querySelectorAll('._3BkKgDHq3l, .ProductList__item, li[class*="product"]');
      const extractedProducts = [];
      
      productElements.forEach((element, index) => {
        if (index >= maxProd) return;
        
        try {
          // Find product link
          const linkEl = element.querySelector('a');
          if (!linkEl) return;
          
          const productUrl = linkEl.href;
          
          // Extract product ID from URL
          const urlMatch = productUrl.match(/products\/(\d+)/);
          const productId = urlMatch ? urlMatch[1] : `${Date.now()}-${index}`;
          
          // Find product name
          const nameEl = element.querySelector('._26YxgX-Nu5, .ProductItem__title, [class*="name"]');
          const name = nameEl ? nameEl.textContent.trim() : 'Unknown Product';
          
          // Find price
          const priceEl = element.querySelector('._3_FVkrm9hL, .ProductItem__price, [class*="price"]');
          let price = 0;
          if (priceEl) {
            const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
            price = parseInt(priceText) || 0;
          }
          
          // Find image
          const imgEl = element.querySelector('img');
          const imageUrl = imgEl ? imgEl.src : '';
          
          // Find category if available
          const categoryEl = element.querySelector('[class*="category"]');
          const category = categoryEl ? categoryEl.textContent.trim() : '전체상품';
          
          extractedProducts.push({
            id: `${mallInfo.engname}-${productId}`,
            name: name,
            price: price,
            imageUrl: imageUrl,
            productUrl: productUrl,
            category: category,
            mallId: mallInfo.engname,
            mallName: mallInfo.name,
            mallUrl: mallInfo.url,
            region: mallInfo.region
          });
        } catch (error) {
          console.error('Error extracting product:', error);
        }
      });
      
      return extractedProducts;
    }, mall, maxProducts);
    
    console.log(`Found ${products.length} products for ${mall.name}`);
    return products;
    
  } catch (error) {
    console.error(`Error scraping ${mall.name}:`, error);
    
    // Try alternative approach for Naver Smart Store
    if (error.message.includes('429') || error.message.includes('rate')) {
      console.log('Rate limited. Returning empty array. Manual intervention may be needed.');
      return [];
    }
    
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAllNaverMalls() {
  console.log('Starting Naver Smart Store Scraping...');
  console.log(`Total malls to scrape: ${NAVER_MALLS.length}`);
  console.log('\nNOTE: Naver Smart Store has strict rate limiting.');
  console.log('This scraper includes delays to avoid being blocked.\n');
  
  const allProducts = [];
  const results = {
    success: [],
    failed: []
  };
  
  for (const mall of NAVER_MALLS) {
    try {
      // Longer delay for Naver to avoid rate limiting
      if (allProducts.length > 0) {
        console.log('Waiting 30 seconds before next mall to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      
      const products = await scrapeNaverSmartStore(mall);
      
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
          reason: 'No products found or rate limited'
        });
      }
      
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
    platform: 'Naver Smart Store',
    totalMalls: NAVER_MALLS.length,
    successCount: results.success.length,
    failedCount: results.failed.length,
    totalProducts: allProducts.length,
    results: results,
    notes: 'Naver Smart Store has strict rate limiting. Failed malls may need manual scraping or proxy rotation.'
  };
  
  const reportPath = path.join(__dirname, '..', 'output', 'naver-smartstore-scraping-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== Naver Smart Store Scraping Summary ===');
  console.log(`Total malls: ${NAVER_MALLS.length}`);
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log(`Total products collected: ${allProducts.length}`);
  console.log(`\nReport saved to: ${reportPath}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed malls may require:');
    console.log('1. Manual scraping through browser');
    console.log('2. Using proxy rotation');
    console.log('3. Scraping during off-peak hours');
  }
}

// Run the scraper
if (require.main === module) {
  scrapeAllNaverMalls().catch(console.error);
}

module.exports = { scrapeNaverSmartStore, scrapeAllNaverMalls };