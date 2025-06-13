import { chromium } from 'playwright';
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

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function scrapeJejuMall() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  const page = await context.newPage();
  
  const allProducts: Product[] = [];
  
  try {
    console.log('Starting Jeju Mall scraper...');
    
    // Navigate to main page
    await page.goto(`${JEJU_MALL_BASE_URL}/main/index.do`, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Get category links
    const categoryLinks = await page.evaluate(() => {
      const links: { name: string; url: string }[] = [];
      
      // Look for category menu items
      const categoryElements = document.querySelectorAll('.gnb_menu li a, .category-menu a, .lnb_menu a');
      categoryElements.forEach(el => {
        const href = el.getAttribute('href');
        const text = el.textContent?.trim();
        if (href && text && (href.includes('category') || href.includes('goods'))) {
          links.push({
            name: text,
            url: href.startsWith('http') ? href : `https://mall.ejeju.net${href}`
          });
        }
      });
      
      return links;
    });
    
    console.log(`Found ${categoryLinks.length} category links`);
    
    // If no category links found, try to find products on the main page
    if (categoryLinks.length === 0) {
      console.log('No category links found, searching for products on main page...');
      
      // Look for product listings on the main page
      const mainPageProducts = await page.evaluate(() => {
        const products: any[] = [];
        
        // Common selectors for product items
        const productSelectors = [
          '.product-item',
          '.goods-item',
          '.item-box',
          '.product-box',
          '[class*="product"]',
          '[class*="goods"]'
        ];
        
        for (const selector of productSelectors) {
          const items = document.querySelectorAll(selector);
          if (items.length > 0) {
            console.log(`Found ${items.length} items with selector: ${selector}`);
            items.forEach(item => {
              const nameEl = item.querySelector('.product-name, .goods-name, .item-name, [class*="name"]');
              const priceEl = item.querySelector('.product-price, .goods-price, .item-price, [class*="price"]');
              const imgEl = item.querySelector('img');
              const linkEl = item.querySelector('a');
              
              if (nameEl && priceEl) {
                products.push({
                  name: nameEl.textContent?.trim(),
                  price: priceEl.textContent?.trim(),
                  imageUrl: imgEl?.src || imgEl?.getAttribute('data-src'),
                  productUrl: linkEl?.href
                });
              }
            });
            break;
          }
        }
        
        return products;
      });
      
      console.log(`Found ${mainPageProducts.length} products on main page`);
      
      // Process main page products
      for (const product of mainPageProducts) {
        if (product.name && product.price) {
          allProducts.push({
            id: `jeju_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl || '',
            productUrl: product.productUrl || '',
            category: 'Main Page',
            tags: ['제주', 'jeju']
          });
        }
      }
    }
    
    // Try alternative approach - look for AJAX endpoints
    console.log('Checking for AJAX product loading...');
    
    // Intercept network requests to find API endpoints
    const apiEndpoints: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('product') || url.includes('goods') || url.includes('list')) {
        apiEndpoints.push(url);
      }
    });
    
    // Trigger any lazy loading by scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(3000);
    
    console.log(`Found ${apiEndpoints.length} potential API endpoints`);
    
    // Save scraped products
    const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
    
    console.log(`Scraping complete! Found ${allProducts.length} products`);
    console.log(`Results saved to: ${outputPath}`);
    
    // Also save a summary
    const summary = {
      totalProducts: allProducts.length,
      categories: [...new Set(allProducts.map(p => p.category))],
      scrapedAt: new Date().toISOString(),
      source: JEJU_MALL_BASE_URL
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'jeju-mall-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeJejuMall().catch(console.error);