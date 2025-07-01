import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeGmsocialLive() {
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Analyzing 광명가치몰 (gmsocial.or.kr) structure...');
    
    // First, check if we can access the main site
    await page.goto('https://gmsocial.or.kr/mall/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Analyze main page structure
    const mainPageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasProducts: !!document.querySelector('[href*="product_id"], [href*="goods/view"]'),
        productLinks: Array.from(document.querySelectorAll('a[href*="product_id"], a[href*="goods/view"]')).map(a => ({
          text: (a as HTMLElement).textContent?.trim(),
          href: (a as HTMLElement).getAttribute('href')
        })).slice(0, 10),
        categoryLinks: Array.from(document.querySelectorAll('a[href*="category"], a[href*="goods/list"]')).map(a => ({
          text: (a as HTMLElement).textContent?.trim(),
          href: (a as HTMLElement).getAttribute('href')
        })).slice(0, 10),
        allImages: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt
        })).slice(0, 5)
      };
    });
    
    console.log('📋 Main page analysis:', mainPageAnalysis);
    
    // Try to access the goods list page
    let goodsListStructure = null;
    try {
      await page.goto('https://gmsocial.or.kr/mall/mall/goods/', { 
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await page.waitForTimeout(2000);
      
      goodsListStructure = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          productLinks: Array.from(document.querySelectorAll('a')).filter(a => 
            a.href.includes('view') || a.href.includes('product_id')
          ).map(a => ({
            text: a.textContent?.trim(),
            href: a.href
          })).slice(0, 20),
          productElements: Array.from(document.querySelectorAll('*')).filter(el => {
            const classes = el.className;
            return typeof classes === 'string' && (
              classes.includes('product') || 
              classes.includes('goods') || 
              classes.includes('item')
            );
          }).map(el => ({
            className: el.className,
            tagName: el.tagName,
            text: el.textContent?.trim().substring(0, 100)
          })).slice(0, 10)
        };
      });
      
      console.log('🛍️ Goods list structure:', goodsListStructure);
      
    } catch (error) {
      console.log('⚠️ Could not access goods list page');
    }
    
    // Test individual product page access
    let productPageStructure = null;
    try {
      // From existing data, we know product 103 exists
      await page.goto('https://gmsocial.or.kr/mall/mall/goods/view.php?product_id=103', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await page.waitForTimeout(2000);
      
      productPageStructure = await page.evaluate(() => {
        // Look for product title
        const titleSelectors = [
          'h1', '.product-title', '.goods-title', '.title',
          '[class*="title"]', '[class*="name"]'
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            title = element.textContent.trim();
            break;
          }
        }
        
        // Look for price
        const priceSelectors = [
          '.price', '.cost', '.sale-price', '[class*="price"]', '[class*="cost"]'
        ];
        
        let price = '';
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector);
          if (element && /[0-9,]+원/.test(element.textContent || '')) {
            price = element.textContent?.trim() || '';
            break;
          }
        }
        
        // If no price found with selector, search in all text
        if (!price) {
          const allElements = Array.from(document.querySelectorAll('*'));
          const priceElement = allElements.find(el => /[0-9,]+원/.test(el.textContent || ''));
          price = priceElement?.textContent?.trim() || '';
        }
        
        // Look for main product image
        const imageSelectors = [
          'img[src*="goods"]', 'img[src*="product"]', '.product-image img', '.goods-image img'
        ];
        
        let image = '';
        for (const selector of imageSelectors) {
          const element = document.querySelector(selector) as HTMLImageElement;
          if (element && element.src) {
            image = element.src;
            break;
          }
        }
        
        // Get first image if no specific product image found
        if (!image) {
          const firstImg = document.querySelector('img') as HTMLImageElement;
          image = firstImg?.src || '';
        }
        
        // Look for vendor/brand
        const vendorSelectors = [
          '.vendor', '.brand', '.company', '[class*="vendor"]', '[class*="brand"]'
        ];
        
        let vendor = '';
        for (const selector of vendorSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent?.trim()) {
            vendor = element.textContent.trim();
            break;
          }
        }
        
        return {
          title: title || document.title,
          price,
          image,
          vendor,
          url: window.location.href,
          allImages: Array.from(document.querySelectorAll('img')).map(img => img.src).slice(0, 10),
          pageStructure: {
            hasForm: !!document.querySelector('form'),
            hasTables: !!document.querySelector('table'),
            scriptTags: document.querySelectorAll('script').length,
            hasAjax: document.documentElement.innerHTML.includes('ajax') || document.documentElement.innerHTML.includes('XMLHttpRequest')
          }
        };
      });
      
      console.log('🏷️ Product page structure:', productPageStructure);
      
    } catch (error) {
      console.log('⚠️ Could not access product page');
    }
    
    // Save analysis results
    const analysis = {
      timestamp: new Date().toISOString(),
      mallInfo: {
        name: '광명가치몰',
        url: 'https://gmsocial.or.kr/mall/',
        region: '경기도 광명시'
      },
      mainPageAnalysis,
      goodsListStructure,
      productPageStructure,
      scrapingStrategy: {
        approach: 'Direct product ID enumeration',
        reason: 'Product URLs follow predictable pattern with sequential IDs',
        steps: [
          '1. Start with known product ID range (103-200)',
          '2. Test each product_id sequentially',
          '3. Extract product details from individual pages',
          '4. Handle missing/invalid products gracefully',
          '5. Collect all valid products'
        ],
        estimatedProducts: '38+ (based on existing data)',
        technicalNotes: [
          'Uses PHP-based system with clean URLs',
          'Product IDs are numeric and sequential',
          'No apparent rate limiting',
          'Server-side rendered content',
          'Images hosted on Naver CDN (shop-phinf.pstatic.net)'
        ]
      }
    };
    
    // Save analysis
    const outputPath = path.join(__dirname, 'gmsocial-live-analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.log(`✅ Analysis saved to: ${outputPath}`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeGmsocialLive().catch(console.error);
}

export { analyzeGmsocialLive };