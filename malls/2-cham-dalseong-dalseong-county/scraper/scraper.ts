import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';
import config from './config.json';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  category: string;
  mallId: number;
  mallName: string;
}

interface ScraperConfig {
  mallId: number;
  mallName: string;
  baseUrl: string;
  status: string;
  selectors: {
    productList: string;
    productItem: string;
    productName: string;
    productPrice: string;
    productImage: string;
    productLink: string;
  };
  pagination: {
    type: string;
    parameter: string;
    maxPages: number;
  };
  timeout: {
    page: number;
    navigation: number;
  };
}

const scraperConfig: ScraperConfig = config as ScraperConfig;

async function checkMallAvailability(url: string): Promise<boolean> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: scraperConfig.timeout.navigation 
    });
    
    // Check if the page shows an error
    const hasError = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('error') || 
             bodyText.includes('찾을 수 없') || 
             bodyText.includes('존재하지 않');
    });
    
    await browser.close();
    return !hasError;
  } catch (error) {
    await browser.close();
    return false;
  }
}

async function scrapeProducts(): Promise<Product[]> {
  console.log(`Starting scraper for ${scraperConfig.mallName} (ID: ${scraperConfig.mallId})`);
  
  // Check if mall is accessible
  console.log('Checking mall availability...');
  const isAvailable = await checkMallAvailability(scraperConfig.baseUrl);
  
  if (!isAvailable) {
    console.error('❌ Mall is not accessible. The store may be closed or moved.');
    
    const errorInfo = {
      mallId: scraperConfig.mallId,
      mallName: scraperConfig.mallName,
      baseUrl: scraperConfig.baseUrl,
      status: 'failed',
      error: 'Mall is not accessible',
      timestamp: new Date().toISOString(),
      recommendations: [
        'Verify if the mall has moved to a different URL',
        'Contact Dalseong County for current mall information',
        'Check if the mall is temporarily closed'
      ]
    };
    
    writeFileSync(
      join(__dirname, 'error.json'),
      JSON.stringify(errorInfo, null, 2)
    );
    
    return [];
  }
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const products: Product[] = [];
  
  try {
    // Navigate to the store
    await page.goto(scraperConfig.baseUrl, { 
      waitUntil: 'networkidle2',
      timeout: scraperConfig.timeout.navigation 
    });
    
    // Wait for product list to load
    await page.waitForSelector(scraperConfig.selectors.productList, {
      timeout: scraperConfig.timeout.page
    });
    
    // Extract products from all pages
    let currentPage = 1;
    let hasMorePages = true;
    
    while (hasMorePages && currentPage <= scraperConfig.pagination.maxPages) {
      console.log(`Scraping page ${currentPage}...`);
      
      const pageProducts = await page.evaluate((selectors) => {
        const products: any[] = [];
        const items = document.querySelectorAll(selectors.productItem);
        
        items.forEach((item: Element) => {
          const nameElement = item.querySelector(selectors.productName);
          const priceElement = item.querySelector(selectors.productPrice);
          const imageElement = item.querySelector(selectors.productImage);
          const linkElement = item.querySelector(selectors.productLink);
          
          if (nameElement && priceElement) {
            const name = nameElement.textContent?.trim() || '';
            const priceText = priceElement.textContent?.trim() || '0';
            const price = parseInt(priceText.replace(/[^0-9]/g, ''));
            const image = imageElement?.getAttribute('src') || '';
            const link = linkElement?.getAttribute('href') || '';
            
            products.push({
              name,
              price,
              image,
              link: link.startsWith('http') ? link : `https://smartstore.naver.com${link}`
            });
          }
        });
        
        return products;
      }, scraperConfig.selectors);
      
      // Add mall information to products
      const productsWithMallInfo = pageProducts.map((p, index) => ({
        ...p,
        id: `${scraperConfig.mallId}-${currentPage}-${index}`,
        category: 'General',
        mallId: scraperConfig.mallId,
        mallName: scraperConfig.mallName
      }));
      
      products.push(...productsWithMallInfo);
      console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
      
      // Check for next page
      const nextPageUrl = `${scraperConfig.baseUrl}?${scraperConfig.pagination.parameter}=${currentPage + 1}`;
      
      try {
        await page.goto(nextPageUrl, { 
          waitUntil: 'networkidle2',
          timeout: scraperConfig.timeout.navigation 
        });
        
        await page.waitForSelector(scraperConfig.selectors.productList, {
          timeout: 5000
        });
        
        currentPage++;
      } catch (error) {
        hasMorePages = false;
      }
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
  
  return products;
}

async function main() {
  if (scraperConfig.status !== 'active') {
    console.error(`⚠️  Scraper is not active. Current status: ${scraperConfig.status}`);
    console.error('Please update the configuration once the mall URL is confirmed.');
    process.exit(1);
  }
  
  try {
    const products = await scrapeProducts();
    
    if (products.length > 0) {
      // Save products
      const outputPath = join(__dirname, 'products.json');
      writeFileSync(outputPath, JSON.stringify(products, null, 2));
      console.log(`✅ Scraped ${products.length} products`);
      console.log(`Results saved to: ${outputPath}`);
      
      // Save summary
      const summary = {
        mallId: scraperConfig.mallId,
        mallName: scraperConfig.mallName,
        totalProducts: products.length,
        scrapedAt: new Date().toISOString(),
        status: 'success'
      };
      
      const summaryPath = join(__dirname, 'summary.json');
      writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    } else {
      console.log('❌ No products found');
    }
  } catch (error) {
    console.error('Scraper failed:', error);
    process.exit(1);
  }
}

// Run the scraper
main();