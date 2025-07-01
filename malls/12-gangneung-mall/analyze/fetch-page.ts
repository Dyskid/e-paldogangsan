import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

async function fetchPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Fetch category page
    console.log('Navigating to category page...');
    await page.goto('https://gangneung-mall.com/goods/catalog?category=c00060003', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the page content
    const content = await page.content();
    
    // Save the content
    const outputPath = path.join(__dirname, 'requirements', 'category_page.html');
    fs.writeFileSync(outputPath, content);
    
    console.log(`Category page content saved to ${outputPath}`);
    console.log(`Content length: ${content.length} characters`);
    
    // Extract category structure information
    const categoryInfo = await page.evaluate(() => {
      const info: any = {
        productCount: 0,
        products: [],
        pagination: null,
        categories: []
      };
      
      // Count products
      const productElements = document.querySelectorAll('.goods_list li, .item_list li, .product_list li');
      info.productCount = productElements.length;
      
      // Extract first few products
      productElements.forEach((el, idx) => {
        if (idx < 3) {
          const product: any = {};
          const nameEl = el.querySelector('[class*="name"], .goods_name, .item_name');
          const priceEl = el.querySelector('[class*="price"], .goods_price, .item_price');
          const linkEl = el.querySelector('a');
          
          if (nameEl) product.name = nameEl.textContent?.trim();
          if (priceEl) product.price = priceEl.textContent?.trim();
          if (linkEl) product.url = linkEl.getAttribute('href');
          
          info.products.push(product);
        }
      });
      
      // Check for pagination
      const paginationEl = document.querySelector('.paging, .pagination, [class*="page"]');
      if (paginationEl) {
        info.pagination = paginationEl.className;
      }
      
      // Get categories
      const categoryLinks = document.querySelectorAll('a[href*="category="]');
      categoryLinks.forEach((link) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim();
        if (href && text) {
          info.categories.push({ text, href });
        }
      });
      
      return info;
    });
    
    console.log('Category page info:', JSON.stringify(categoryInfo, null, 2));
    
  } catch (error) {
    console.error('Error fetching page:', error);
  } finally {
    await browser.close();
  }
}

fetchPage();