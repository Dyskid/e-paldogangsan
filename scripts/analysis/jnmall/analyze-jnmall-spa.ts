import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function analyzeJnmallWithPuppeteer() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set up request interception to log API calls
    const apiCalls: any[] = [];
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('api') || url.includes('product') || url.includes('goods')) {
        apiCalls.push({
          url,
          method: request.method(),
          headers: request.headers()
        });
      }
      request.continue();
    });
    
    console.log('Loading jnmall recommend page...');
    await page.goto('https://www.jnmall.kr/category/recommend', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for products to load
    await page.waitForTimeout(5000);
    
    // Save the rendered HTML
    const html = await page.content();
    await fs.writeFile('scripts/output/jnmall-rendered-page.html', html);
    
    // Analyze the page structure
    const analysis = await page.evaluate(() => {
      const result: any = {
        products: [],
        selectors: {},
        dataStructure: {}
      };
      
      // Look for product elements
      const productSelectors = [
        'a[href*="/product/"][href*="/detail"]',
        '[onclick*="product"]',
        '[data-product]',
        '.product-item',
        '.item-box',
        'div[class*="grid"] > div > a',
        'ul[class*="grid"] > li > a',
        'section a[href*="/product/"]'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          result.selectors[selector] = elements.length;
          
          // Get details from first few elements
          elements.forEach((elem, index) => {
            if (index < 5) {
              const link = elem as HTMLAnchorElement;
              const img = elem.querySelector('img');
              const priceElem = elem.querySelector('[class*="price"], span:contains("원")');
              const titleElem = elem.querySelector('h3, h4, p, span[class*="title"], span[class*="name"]');
              
              result.products.push({
                href: link.href || elem.getAttribute('onclick'),
                imgSrc: img?.src,
                title: titleElem?.textContent?.trim() || img?.alt,
                price: priceElem?.textContent?.trim(),
                selector
              });
            }
          });
        }
      }
      
      // Look for Next.js or React data
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData) {
        result.dataStructure.framework = 'Next.js';
        result.dataStructure.props = nextData.props?.pageProps;
      }
      
      // Look for Vue data
      const vueApps = document.querySelectorAll('[id^="app"], #app, [data-v-]');
      if (vueApps.length > 0) {
        result.dataStructure.framework = 'Vue.js';
      }
      
      return result;
    });
    
    console.log('\nAnalysis Results:');
    console.log('Found selectors:', Object.keys(analysis.selectors));
    console.log('Products found:', analysis.products.length);
    
    if (analysis.products.length > 0) {
      console.log('\nSample products:');
      analysis.products.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\nProduct ${i + 1}:`);
        console.log(`  URL: ${p.href}`);
        console.log(`  Title: ${p.title}`);
        console.log(`  Price: ${p.price}`);
        console.log(`  Image: ${p.imgSrc}`);
        console.log(`  Selector: ${p.selector}`);
      });
    }
    
    console.log('\nAPI Calls captured:');
    apiCalls.slice(0, 10).forEach(call => {
      console.log(`  ${call.method} ${call.url}`);
    });
    
    // Save analysis
    await fs.writeFile(
      'scripts/output/jnmall-spa-analysis.json',
      JSON.stringify({ analysis, apiCalls }, null, 2)
    );
    
    // Try to navigate to a product if we found any
    if (analysis.products.length > 0 && analysis.products[0].href) {
      console.log('\nNavigating to product page:', analysis.products[0].href);
      await page.goto(analysis.products[0].href, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await page.waitForTimeout(3000);
      
      const productHtml = await page.content();
      await fs.writeFile('scripts/output/jnmall-product-detail.html', productHtml);
      
      // Analyze product page
      const productInfo = await page.evaluate(() => {
        const info: any = {};
        
        // Title selectors
        const titleSelectors = ['h1', 'h2', '[class*="title"]', '[class*="name"]'];
        for (const selector of titleSelectors) {
          const elem = document.querySelector(selector);
          if (elem && elem.textContent?.trim()) {
            info.title = elem.textContent.trim();
            info.titleSelector = selector;
            break;
          }
        }
        
        // Price selectors
        const priceSelectors = ['[class*="price"]', 'span:contains("원")', 'p:contains("원")'];
        for (const selector of priceSelectors) {
          const elems = document.querySelectorAll(selector);
          elems.forEach(elem => {
            const text = elem.textContent || '';
            if (text.includes('원') && /\d/.test(text)) {
              info.price = text.trim();
              info.priceSelector = selector;
            }
          });
        }
        
        // Image
        const mainImg = document.querySelector('img[class*="main"], img[class*="detail"], .swiper-slide img');
        if (mainImg) {
          info.imageSrc = (mainImg as HTMLImageElement).src;
        }
        
        return info;
      });
      
      console.log('\nProduct page info:', productInfo);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

analyzeJnmallWithPuppeteer().catch(console.error);