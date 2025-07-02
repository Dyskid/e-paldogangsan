import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  seller: string;
  category: string;
  categoryId: string;
  mallId: number;
  mallName: string;
}

interface Category {
  id: string;
  name: string;
  url: string;
  level: number;
  parentId?: string;
}

const MALL_ID = 4;
const MALL_NAME = '대전사랑몰';
const BASE_URL = 'https://ontongdaejeon.ezwel.com';
const ITEMS_PER_PAGE = 100; // Max items per page

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    id: "100101714",
    name: "대전 로컬상품관",
    url: "/onnuri/goods/goodsSearchList?ctgrNo=100101714",
    level: 1
  },
  {
    id: "100100868",
    name: "특가 ON",
    url: "/onnuri/goods/goodsSearchList?ctgrNo=100100868",
    level: 1
  },
  {
    id: "100100324",
    name: "농산물",
    url: "/onnuri/goods/goodsSearchList?ctgrNo=100100324",
    level: 1
  },
  {
    id: "100100326",
    name: "수산물",
    url: "/onnuri/goods/goodsSearchList?ctgrNo=100100326",
    level: 1
  },
  {
    id: "100100442",
    name: "대전우수 상품판매장",
    url: "/onnuri/goods/goodsSearchList?ctgrNo=100100442",
    level: 1
  }
];

async function waitForProducts(page: puppeteer.Page): Promise<void> {
  // Wait for the product list container
  await page.waitForSelector('.goodsList#goodsListItem', { timeout: 30000 });
  
  // Wait for at least one product item
  await page.waitForSelector('.card_list ul li', { timeout: 30000 });
  
  // Wait a bit more for all products to load
  await page.waitForTimeout(2000);
}

async function extractProducts(page: puppeteer.Page, categoryName: string, categoryId: string): Promise<Product[]> {
  return await page.evaluate((mallId, mallName, categoryName, categoryId) => {
    const products: any[] = [];
    const items = document.querySelectorAll('.card_list ul li');
    
    items.forEach((item, index) => {
      // Extract product ID from tag or data attribute
      const productId = item.getAttribute('data-goodsCd') || 
                       item.querySelector('[data-goodsCd]')?.getAttribute('data-goodsCd') ||
                       `${mallId}-${categoryId}-${index}`;
      
      // Extract product name
      const nameElement = item.querySelector('.ellipsis_2');
      const name = nameElement?.textContent?.trim() || '';
      
      // Extract price
      const priceElement = item.querySelector('.price span');
      const priceText = priceElement?.textContent?.trim() || '0';
      const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
      
      // Extract image
      const imgElement = item.querySelector('img.lazy') || item.querySelector('img');
      const image = imgElement?.getAttribute('data-src') || 
                   imgElement?.getAttribute('src') || '';
      const fullImage = image.startsWith('http') ? image : `https://ontongdaejeon.ezwel.com${image}`;
      
      // Extract seller/market name
      const sellerElement = item.querySelector('.market_name');
      const seller = sellerElement?.textContent?.trim() || '';
      
      // Build product link
      const linkElement = item.querySelector('a');
      const href = linkElement?.getAttribute('href') || '';
      const link = href.startsWith('http') ? href : `https://ontongdaejeon.ezwel.com${href}`;
      
      if (name && price > 0) {
        products.push({
          id: productId,
          name,
          price,
          image: fullImage,
          link,
          seller,
          category: categoryName,
          categoryId,
          mallId,
          mallName
        });
      }
    });
    
    return products;
  }, MALL_ID, MALL_NAME, categoryName, categoryId);
}

async function scrapeCategory(browser: puppeteer.Browser, category: Category): Promise<Product[]> {
  const page = await browser.newPage();
  const allProducts: Product[] = [];
  
  try {
    console.log(`Scraping category: ${category.name}`);
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    let pageNo = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `${BASE_URL}${category.url}&pageNo=${pageNo}&pageRecordCount=${ITEMS_PER_PAGE}`;
      console.log(`  Fetching page ${pageNo}: ${url}`);
      
      try {
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for products to load
        await waitForProducts(page);
        
        // Extract products
        const products = await extractProducts(page, category.name, category.id);
        
        if (products.length === 0) {
          hasMorePages = false;
        } else {
          allProducts.push(...products);
          console.log(`  Found ${products.length} products (total: ${allProducts.length})`);
          
          // Check if there's a next page
          const hasNextPage = await page.evaluate(() => {
            // Look for next page button or check pagination
            const nextButton = document.querySelector('.pagination a.next:not(.disabled)');
            const pageLinks = document.querySelectorAll('.pagination a[data-page]');
            const currentPage = document.querySelector('.pagination .active');
            
            return nextButton !== null || (pageLinks.length > 0 && !currentPage?.classList.contains('last'));
          });
          
          if (!hasNextPage || products.length < ITEMS_PER_PAGE) {
            hasMorePages = false;
          } else {
            pageNo++;
          }
        }
        
        // Add delay between pages
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error(`  Error scraping page ${pageNo}:`, error);
        hasMorePages = false;
      }
    }
  } catch (error) {
    console.error(`Error scraping category ${category.name}:`, error);
  } finally {
    await page.close();
  }
  
  return allProducts;
}

async function main() {
  console.log(`Starting scraper for ${MALL_NAME} (ID: ${MALL_ID})`);
  console.log(`Base URL: ${BASE_URL}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const allProducts: Product[] = [];
    
    // Scrape all categories
    for (const category of CATEGORIES) {
      const categoryProducts = await scrapeCategory(browser, category);
      allProducts.push(...categoryProducts);
      
      // Add delay between categories
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Remove duplicates based on product ID
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );
    
    console.log(`\nTotal products scraped: ${uniqueProducts.length}`);
    
    // Save results
    const outputPath = join(__dirname, `products-${MALL_ID}.json`);
    writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
    console.log(`Results saved to: ${outputPath}`);
    
    // Save summary
    const summary = {
      mallId: MALL_ID,
      mallName: MALL_NAME,
      totalProducts: uniqueProducts.length,
      scrapedAt: new Date().toISOString(),
      categories: CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        productCount: uniqueProducts.filter(p => p.categoryId === c.id).length
      }))
    };
    
    const summaryPath = join(__dirname, `summary-${MALL_ID}.json`);
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Summary saved to: ${summaryPath}`);
  } catch (error) {
    console.error('Scraper failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the scraper
main();