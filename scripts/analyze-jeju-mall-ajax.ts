import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

interface JejuProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  category?: string;
  tags?: string[];
}

async function analyzeJejuMallAjax() {
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable request interception to capture AJAX calls
    await page.setRequestInterception(true);
    
    const ajaxRequests: any[] = [];
    const ajaxResponses: any[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('mainIndicatorGoodsList.do') || 
          url.includes('goodsList.do') ||
          url.includes('main.do') ||
          url.includes('ajax') ||
          url.includes('json')) {
        ajaxRequests.push({
          url: url,
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('mainIndicatorGoodsList.do') || 
          url.includes('goodsList.do') ||
          url.includes('ajax') ||
          url.includes('json')) {
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && (contentType.includes('json') || contentType.includes('html'))) {
            const responseData = await response.text();
            ajaxResponses.push({
              url: url,
              status: response.status(),
              headers: response.headers(),
              data: responseData
            });
          }
        } catch (e) {
          console.log('Error reading response:', e);
        }
      }
    });
    
    // Navigate to main page
    console.log('Navigating to main page...');
    await page.goto('https://mall.ejeju.net/main/index.do', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Try to trigger product loading by scrolling
    console.log('Scrolling to trigger lazy loading...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(3000);
    
    // Check for any JavaScript functions we can call
    const jsInfo = await page.evaluate(() => {
      const info: any = {};
      
      // Check for global functions
      if (typeof fn_selectMainIndicator !== 'undefined') {
        info.hasFnSelectMainIndicator = true;
      }
      
      // Try to find product containers
      const productSelectors = [
        '.goods-list li',
        '.product-item',
        '.item-box',
        '[class*="product"]',
        '[class*="goods"]',
        '.list_goods li',
        '.goods_list li'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          info.productSelector = selector;
          info.productCount = elements.length;
          
          // Get sample product data
          const firstProduct = elements[0];
          info.sampleHTML = firstProduct.innerHTML.substring(0, 500);
          break;
        }
      }
      
      return info;
    });
    
    console.log('JavaScript Info:', jsInfo);
    
    // Now navigate to a category page
    console.log('\nNavigating to category page...');
    await page.goto('https://mall.ejeju.net/goods/main.do?cate=1', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    // Extract products from the category page
    const products = await page.evaluate(() => {
      const productList: any[] = [];
      
      // Try multiple selectors
      const selectors = [
        '.goods-list li',
        '.list_goods li',
        '.goods_list li',
        '.product-list li',
        '[class*="goods"] li',
        '.item-list li'
      ];
      
      let productElements: NodeListOf<Element> | null = null;
      let usedSelector = '';
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          productElements = elements;
          usedSelector = selector;
          break;
        }
      }
      
      if (productElements) {
        productElements.forEach((element, index) => {
          try {
            // Extract image
            const imgElement = element.querySelector('img');
            const imageUrl = imgElement?.src || imgElement?.getAttribute('data-src') || '';
            
            // Extract title
            const titleElement = element.querySelector('.goods-name, .product-name, .item-name, [class*="name"], a[title]');
            const title = titleElement?.textContent?.trim() || 
                         titleElement?.getAttribute('title') || 
                         imgElement?.alt || '';
            
            // Extract price
            const priceElement = element.querySelector('.price, .sale-price, [class*="price"]');
            const priceText = priceElement?.textContent || '';
            const price = parseInt(priceText.replace(/[^0-9]/g, '') || '0');
            
            // Extract URL
            const linkElement = element.querySelector('a');
            const productUrl = linkElement?.href || '';
            
            productList.push({
              index,
              title,
              price,
              imageUrl,
              productUrl,
              html: element.innerHTML.substring(0, 300),
              selector: usedSelector
            });
          } catch (e) {
            console.error('Error extracting product:', e);
          }
        });
      }
      
      return {
        products: productList,
        totalFound: productList.length,
        pageInfo: {
          url: window.location.href,
          title: document.title
        }
      };
    });
    
    // Save all captured data
    const outputDir = path.join(process.cwd(), 'scripts/output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save AJAX requests and responses
    await fs.writeFile(
      path.join(outputDir, 'jeju-mall-ajax-analysis.json'),
      JSON.stringify({
        ajaxRequests,
        ajaxResponses,
        jsInfo,
        products,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    // Save page HTML
    const pageHtml = await page.content();
    await fs.writeFile(
      path.join(outputDir, 'jeju-mall-category-page.html'),
      pageHtml
    );
    
    console.log('\nAnalysis Summary:');
    console.log('- AJAX Requests captured:', ajaxRequests.length);
    console.log('- AJAX Responses captured:', ajaxResponses.length);
    console.log('- Products found:', products.products.length);
    console.log('- Used selector:', products.products[0]?.selector);
    
    if (ajaxRequests.length > 0) {
      console.log('\nAJAX Endpoints found:');
      ajaxRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`    POST Data: ${req.postData}`);
        }
      });
    }
    
    if (products.products.length > 0) {
      console.log('\nSample product:');
      console.log(products.products[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeJejuMallAjax().catch(console.error);