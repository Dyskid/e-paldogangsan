import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountRate?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller?: string;
  description?: string;
  tags: string[];
}

const JEJU_MALL_BASE_URL = 'https://mall.ejeju.net';
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeJejuMallWithPuppeteer() {
  console.log('Starting Jeju Mall scraper with Puppeteer...');
  const allProducts: Product[] = [];
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception to capture AJAX calls
    await page.setRequestInterception(true);
    const capturedResponses: any[] = [];
    
    page.on('request', (request) => {
      request.continue();
    });
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('goods') || url.includes('product') || url.includes('list')) {
        try {
          const data = await response.json();
          capturedResponses.push({ url, data });
        } catch (e) {
          // Not JSON response
        }
      }
    });
    
    console.log('Navigating to main page...');
    await page.goto(`${JEJU_MALL_BASE_URL}/main/index.do`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for dynamic content to load
    await delay(5000);
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await delay(2000);
    
    // Extract products from the page
    const products = await page.evaluate(() => {
      const productList: any[] = [];
      
      // Try multiple selectors
      const selectors = [
        '.goods_list li',
        '.product_list li',
        '.item_list li',
        '[class*="goods"] li',
        '[class*="product"] li',
        '.list_goods > li',
        '.goods-item',
        '.product-item'
      ];
      
      for (const selector of selectors) {
        const items = document.querySelectorAll(selector);
        if (items.length > 0) {
          console.log(`Found ${items.length} items with selector: ${selector}`);
          
          items.forEach((item: Element) => {
            const nameEl = item.querySelector('[class*="name"], .tit, .title, a[title]');
            const priceEl = item.querySelector('[class*="price"], .cost');
            const imgEl = item.querySelector('img');
            const linkEl = item.querySelector('a');
            
            const name = nameEl?.textContent?.trim() || 
                        linkEl?.getAttribute('title') || 
                        imgEl?.getAttribute('alt');
            
            const priceText = priceEl?.textContent?.trim() || '';
            
            if (name && priceText) {
              productList.push({
                name: name,
                price: priceText,
                imageUrl: imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src'),
                productUrl: linkEl?.getAttribute('href'),
                selector: selector
              });
            }
          });
          
          if (productList.length > 0) break;
        }
      }
      
      return productList;
    });
    
    console.log(`Found ${products.length} products on the page`);
    
    // Process found products
    products.forEach((product, index) => {
      const cleanPrice = product.price.replace(/[^\d,]/g, '');
      if (cleanPrice) {
        allProducts.push({
          id: `jeju_${Date.now()}_${index}`,
          name: product.name,
          price: cleanPrice + '원',
          imageUrl: product.imageUrl && !product.imageUrl.startsWith('http') 
            ? JEJU_MALL_BASE_URL + product.imageUrl 
            : product.imageUrl || '',
          productUrl: product.productUrl && !product.productUrl.startsWith('http')
            ? JEJU_MALL_BASE_URL + product.productUrl
            : product.productUrl || '',
          category: 'Main Page',
          tags: ['제주', '제주도', 'jeju'],
          seller: '제주몰'
        });
      }
    });
    
    // Check captured AJAX responses
    console.log(`\nCaptured ${capturedResponses.length} AJAX responses`);
    for (const response of capturedResponses) {
      console.log(`Response from: ${response.url}`);
      if (response.data && response.data.result && Array.isArray(response.data.result)) {
        console.log(`Found ${response.data.result.length} items in AJAX response`);
      }
    }
    
    // Try to navigate to a category page
    console.log('\nTrying to navigate to a category...');
    const categoryLinks = await page.evaluate(() => {
      const links: string[] = [];
      document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href.includes('category') || href.includes('goods/list'))) {
          links.push(href);
        }
      });
      return links.slice(0, 3); // Get first 3 category links
    });
    
    console.log(`Found ${categoryLinks.length} category links`);
    
    for (const link of categoryLinks) {
      try {
        const fullUrl = link.startsWith('http') ? link : JEJU_MALL_BASE_URL + link;
        console.log(`Navigating to: ${fullUrl}`);
        
        await page.goto(fullUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        await delay(3000);
        
        const categoryProducts = await page.evaluate(() => {
          const productList: any[] = [];
          const items = document.querySelectorAll('[class*="goods"], [class*="product"]');
          
          items.forEach((item: Element) => {
            const nameEl = item.querySelector('[class*="name"], .tit');
            const priceEl = item.querySelector('[class*="price"], .cost');
            
            if (nameEl && priceEl) {
              productList.push({
                name: nameEl.textContent?.trim(),
                price: priceEl.textContent?.trim()
              });
            }
          });
          
          return productList;
        });
        
        console.log(`Found ${categoryProducts.length} products in category`);
        
      } catch (error) {
        console.error(`Error navigating to category: ${error instanceof Error ? error.message : error}`);
      }
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
  
  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products-final.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`\nScraping complete!`);
  console.log(`Total products found: ${allProducts.length}`);
  console.log(`Results saved to: ${outputPath}`);
  
  // Save summary
  const summary = {
    totalProducts: allProducts.length,
    scrapedAt: new Date().toISOString(),
    source: JEJU_MALL_BASE_URL
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'jeju-mall-summary-final.json'),
    JSON.stringify(summary, null, 2)
  );
}

// Alternative: Create sample data based on the website structure
async function createSampleProductData() {
  console.log('\nCreating sample product data based on Jeju Mall categories...');
  
  const categories = [
    { name: '농산품', id: 'agricultural' },
    { name: '수산품', id: 'seafood' },
    { name: '축산품', id: 'livestock' },
    { name: '가공식품', id: 'processed' },
    { name: '화장품', id: 'cosmetics' },
    { name: '공예품', id: 'crafts' },
    { name: '생활용품', id: 'household' },
    { name: '반려동물용품', id: 'pet' }
  ];
  
  const sampleProducts: Product[] = [];
  const jejuProducts = [
    { name: '제주 한라봉', category: '농산품', price: '25000' },
    { name: '제주 천혜향', category: '농산품', price: '30000' },
    { name: '제주 흑돼지 선물세트', category: '축산품', price: '80000' },
    { name: '제주 갈치 선물세트', category: '수산품', price: '50000' },
    { name: '제주 옥돔', category: '수산품', price: '45000' },
    { name: '제주 감귤 초콜릿', category: '가공식품', price: '15000' },
    { name: '제주 오메기떡', category: '가공식품', price: '12000' },
    { name: '제주 동백 화장품 세트', category: '화장품', price: '65000' },
    { name: '제주 현무암 공예품', category: '공예품', price: '35000' },
    { name: '제주 감귤 비누', category: '생활용품', price: '8000' }
  ];
  
  jejuProducts.forEach((product, index) => {
    sampleProducts.push({
      id: `jeju_sample_${index + 1}`,
      name: product.name,
      price: product.price + '원',
      imageUrl: `${JEJU_MALL_BASE_URL}/images/product_${index + 1}.jpg`,
      productUrl: `${JEJU_MALL_BASE_URL}/goods/detail.do?gno=${index + 1}`,
      category: product.category,
      seller: '제주몰',
      tags: ['제주', '제주도', 'jeju', product.category]
    });
  });
  
  const samplePath = path.join(OUTPUT_DIR, 'jeju-mall-products-sample.json');
  fs.writeFileSync(samplePath, JSON.stringify(sampleProducts, null, 2));
  
  console.log(`Sample data created with ${sampleProducts.length} products`);
  console.log(`Saved to: ${samplePath}`);
}

// Run the scraper
(async () => {
  try {
    // Try Puppeteer first
    await scrapeJejuMallWithPuppeteer();
  } catch (error) {
    console.error('Puppeteer failed:', error instanceof Error ? error.message : error);
    console.log('\nFalling back to sample data creation...');
    await createSampleProductData();
  }
})();