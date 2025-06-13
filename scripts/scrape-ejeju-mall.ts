import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface EjejuProduct {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  categoryId: string;
  isAvailable: boolean;
  brand?: string;
  description?: string;
  mallName: string;
  mallUrl: string;
  scrapedAt: string;
}

interface Category {
  id: string;
  name: string;
  productCount?: number;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeEjejuMall() {
  console.log('Starting 이제주몰 scraper...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allProducts: EjejuProduct[] = [];
  const errors: any[] = [];

  // Categories from analysis
  const categories: Category[] = [
    { id: '1', name: '제주 농산품' },
    { id: '2', name: '제주 수산품' },
    { id: '3', name: '제주 축산품' },
    { id: '4', name: '가공식품' },
    { id: '5', name: '화장품' },
    { id: '6', name: '공예품' },
    { id: '7', name: '생활용품' },
    { id: '8', name: '반려용품' }
  ];

  try {
    for (const category of categories) {
      console.log(`\nScraping category: ${category.name} (ID: ${category.id})`);
      
      let currentPage = 1;
      let hasMorePages = true;
      let categoryProductCount = 0;

      while (hasMorePages) {
        const page = await browser.newPage();
        
        try {
          // Set viewport and user agent
          await page.setViewport({ width: 1920, height: 1080 });
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

          // Navigate to category page
          const categoryUrl = `https://mall.ejeju.net/goods/main.do?cate=${category.id}&page=${currentPage}`;
          console.log(`Loading page ${currentPage}: ${categoryUrl}`);
          
          await page.goto(categoryUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          // Wait for products to load
          await page.waitForSelector('.goods_list, .no-data', { timeout: 10000 });

          // Check if there are no products
          const noData = await page.$('.no-data');
          if (noData) {
            console.log(`No products found in category ${category.name}`);
            hasMorePages = false;
            await page.close();
            continue;
          }

          // Extract products from the current page
          const products = await page.evaluate((categoryId, categoryName) => {
            const productElements = document.querySelectorAll('.goods_list .item');
            const extractedProducts: any[] = [];

            productElements.forEach((element) => {
              try {
                // Extract product ID from onclick or href
                const linkElement = element.querySelector('a');
                const onclickAttr = linkElement?.getAttribute('onclick') || '';
                const hrefAttr = linkElement?.getAttribute('href') || '';
                
                let productId = '';
                // Try to extract from onclick first
                const gnoMatch = onclickAttr.match(/gno=(\d+)/);
                if (gnoMatch) {
                  productId = gnoMatch[1];
                } else {
                  // Try to extract from href
                  const hrefMatch = hrefAttr.match(/gno=(\d+)/);
                  if (hrefMatch) {
                    productId = hrefMatch[1];
                  }
                }

                if (!productId) return;

                // Build product URL
                const productUrl = `https://mall.ejeju.net/goods/detail.do?gno=${productId}&cate=${categoryId}`;

                // Extract title
                const titleElement = element.querySelector('.goods_name, .name, .title');
                const title = titleElement?.textContent?.trim() || '';

                // Extract price
                const priceElement = element.querySelector('.price, .goods_price');
                const priceText = priceElement?.textContent || '';
                const priceMatch = priceText.match(/[\d,]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;

                // Extract original price if exists
                const originalPriceElement = element.querySelector('.original_price, .del');
                const originalPriceText = originalPriceElement?.textContent || '';
                const originalPriceMatch = originalPriceText.match(/[\d,]+/);
                const originalPrice = originalPriceMatch ? parseInt(originalPriceMatch[0].replace(/,/g, '')) : undefined;

                // Extract image URL
                const imgElement = element.querySelector('img');
                let imageUrl = imgElement?.src || imgElement?.getAttribute('data-src') || '';
                
                // Make image URL absolute
                if (imageUrl && !imageUrl.startsWith('http')) {
                  imageUrl = new URL(imageUrl, 'https://mall.ejeju.net').href;
                }

                // Check availability (look for sold out indicators)
                const soldOutElement = element.querySelector('.sold_out, .soldout, .품절');
                const isAvailable = !soldOutElement;

                // Extract brand if available
                const brandElement = element.querySelector('.brand, .maker');
                const brand = brandElement?.textContent?.trim();

                extractedProducts.push({
                  id: productId,
                  url: productUrl,
                  title,
                  price,
                  originalPrice,
                  imageUrl,
                  category: categoryName,
                  categoryId,
                  isAvailable,
                  brand,
                  mallName: '이제주몰',
                  mallUrl: 'https://mall.ejeju.net'
                });
              } catch (err) {
                console.error('Error extracting product:', err);
              }
            });

            return extractedProducts;
          }, category.id, category.name);

          if (products.length > 0) {
            console.log(`Found ${products.length} products on page ${currentPage}`);
            
            // Add scrapedAt timestamp
            const timestampedProducts = products.map(p => ({
              ...p,
              scrapedAt: new Date().toISOString()
            }));
            
            allProducts.push(...timestampedProducts);
            categoryProductCount += products.length;

            // Check if there's a next page
            const nextPageExists = await page.evaluate(() => {
              const nextButton = document.querySelector('.pagination .next:not(.disabled), .paging .next:not(.disabled)');
              const pageNumbers = document.querySelectorAll('.pagination a, .paging a');
              
              // Check if current page is the last page number
              if (pageNumbers.length > 0) {
                const currentPageNum = document.querySelector('.pagination .active, .paging .on')?.textContent;
                const lastPageNum = pageNumbers[pageNumbers.length - 1]?.textContent;
                return currentPageNum !== lastPageNum;
              }
              
              return !!nextButton;
            });

            if (nextPageExists && products.length >= 10) { // Assuming at least 10 products per page
              currentPage++;
              await delay(1500); // Rate limiting
            } else {
              hasMorePages = false;
            }
          } else {
            console.log(`No products found on page ${currentPage}`);
            hasMorePages = false;
          }

        } catch (error) {
          console.error(`Error scraping category ${category.name}, page ${currentPage}:`, error);
          errors.push({
            category: category.name,
            page: currentPage,
            error: error.message
          });
          hasMorePages = false;
        } finally {
          await page.close();
        }
      }

      console.log(`Completed category ${category.name}: ${categoryProductCount} products`);
      category.productCount = categoryProductCount;
    }

  } catch (error) {
    console.error('Fatal error:', error);
    errors.push({ type: 'fatal', error: error.message });
  } finally {
    await browser.close();
  }

  // Save results
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save all products
  fs.writeFileSync(
    path.join(outputDir, 'ejeju-mall-products.json'),
    JSON.stringify(allProducts, null, 2)
  );

  // Save summary
  const summary = {
    mallName: '이제주몰',
    mallUrl: 'https://mall.ejeju.net',
    totalProducts: allProducts.length,
    categories: categories.filter(c => c.productCount && c.productCount > 0),
    scrapedAt: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined
  };

  fs.writeFileSync(
    path.join(outputDir, 'ejeju-mall-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n=== Scraping Complete ===');
  console.log(`Total products scraped: ${allProducts.length}`);
  console.log(`Errors encountered: ${errors.length}`);
  console.log('\nCategory breakdown:');
  categories.forEach(cat => {
    if (cat.productCount) {
      console.log(`  ${cat.name}: ${cat.productCount} products`);
    }
  });

  return { products: allProducts, summary };
}

// Run the scraper
if (require.main === module) {
  scrapeEjejuMall().catch(console.error);
}

export { scrapeEjejuMall };
export type { EjejuProduct };