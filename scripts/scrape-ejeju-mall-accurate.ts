import axios from 'axios';
import * as cheerio from 'cheerio';
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

async function scrapeEjejuMallAccurate() {
  console.log('Starting 이제주몰 accurate scraper...');
  
  const allProducts: EjejuProduct[] = [];
  const errors: any[] = [];

  // Updated categories based on actual site structure
  const categories: Category[] = [
    { id: '26', name: '농산품' },
    { id: '27', name: '수산품' },
    { id: '28', name: '축산품' },
    { id: '29', name: '가공식품' },
    { id: '30', name: '음료/주류' },
    { id: '31', name: '공예품/생활용품' },
    { id: '31008', name: '건강식품' },
    { id: '32', name: '기타' }
  ];

  const axiosConfig = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://mall.ejeju.net/main/index.do'
    },
    timeout: 30000
  };

  try {
    for (const category of categories) {
      console.log(`\nScraping category: ${category.name} (ID: ${category.id})`);
      
      let currentPage = 1;
      let hasMorePages = true;
      let categoryProductCount = 0;

      while (hasMorePages) {
        try {
          const categoryUrl = `https://mall.ejeju.net/goods/main.do?cate=${category.id}&page=${currentPage}`;
          console.log(`Loading page ${currentPage}: ${categoryUrl}`);
          
          const response = await axios.get(categoryUrl, axiosConfig);
          const $ = cheerio.load(response.data);

          // Extract products using the actual HTML structure
          const products: EjejuProduct[] = [];
          
          // The products are in li elements within ul#viewType
          $('#viewType li').each((index, element) => {
            try {
              const $elem = $(element);
              
              // Extract product URL and ID from the main link
              const mainLink = $elem.find('a.thum').first();
              const href = mainLink.attr('href') || '';
              
              // Extract product ID from href
              const gnoMatch = href.match(/gno=(\d+)/);
              if (!gnoMatch) return;
              
              const productId = gnoMatch[1];
              const cateMatch = href.match(/cate=(\d+)/);
              const categoryIdFromUrl = cateMatch ? cateMatch[1] : category.id;
              
              // Build absolute product URL
              const productUrl = href.startsWith('http') 
                ? href 
                : `https://mall.ejeju.net${href.startsWith('/') ? href : '/goods/' + href}`;

              // Extract title from .pro_name
              const title = $elem.find('.pro_name').text().trim();
              if (!title) return;

              // Extract prices
              const priceContainer = $elem.find('.price').first();
              const priceText = priceContainer.text();
              
              // Extract current price (after ▶)
              let price = 0;
              const currentPriceMatch = priceText.match(/▶\s*([0-9,]+)원/);
              if (currentPriceMatch) {
                price = parseInt(currentPriceMatch[1].replace(/,/g, ''));
              } else {
                // Try to find any price
                const anyPriceMatch = priceText.match(/([0-9,]+)원/);
                if (anyPriceMatch) {
                  price = parseInt(anyPriceMatch[1].replace(/,/g, ''));
                }
              }

              // Extract original price from del tag
              let originalPrice: number | undefined;
              const delPrice = priceContainer.find('del').text();
              const originalPriceMatch = delPrice.match(/([0-9,]+)원/);
              if (originalPriceMatch) {
                originalPrice = parseInt(originalPriceMatch[1].replace(/,/g, ''));
              }

              // Extract image URL
              const imgElement = $elem.find('.thum img').first();
              let imageUrl = imgElement.attr('src') || '';
              
              // Make image URL absolute
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = new URL(imageUrl, 'https://mall.ejeju.net').href;
              }

              // Check availability (look for sold out indicators)
              const soldOutIndicators = [
                $elem.find('.sold_out').length > 0,
                $elem.find('.soldout').length > 0,
                $elem.find('.품절').length > 0,
                $elem.hasClass('sold_out'),
                $elem.hasClass('soldout')
              ];
              const isAvailable = !soldOutIndicators.some(indicator => indicator);

              // Extract brand from icons or title
              let brand: string | undefined;
              const titleMatch = title.match(/\[(.*?)\]/);
              if (titleMatch) {
                brand = titleMatch[1];
              }

              products.push({
                id: productId,
                url: productUrl,
                title,
                price,
                originalPrice,
                imageUrl,
                category: category.name,
                categoryId: categoryIdFromUrl,
                isAvailable,
                brand,
                mallName: '이제주몰',
                mallUrl: 'https://mall.ejeju.net',
                scrapedAt: new Date().toISOString()
              });
            } catch (err) {
              console.error('Error extracting product:', err);
            }
          });

          if (products.length > 0) {
            console.log(`Found ${products.length} products on page ${currentPage}`);
            allProducts.push(...products);
            categoryProductCount += products.length;

            // Check for pagination
            const paginationExists = $('.paging').length > 0;
            const currentPageActive = $('.paging .on').text().trim();
            const lastPageLink = $('.paging a').last().text().trim();
            
            // Check if there are more pages
            if (paginationExists && currentPageActive && lastPageLink && 
                parseInt(currentPageActive) < parseInt(lastPageLink)) {
              currentPage++;
              await delay(1500); // Rate limiting
            } else {
              hasMorePages = false;
            }
          } else {
            console.log(`No products found on page ${currentPage}`);
            
            // Save HTML for debugging if no products found
            if (currentPage === 1) {
              const debugDir = path.join(__dirname, 'output', 'debug');
              if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
              }
              fs.writeFileSync(
                path.join(debugDir, `ejeju-cat${category.id}-page${currentPage}.html`),
                response.data
              );
            }
            
            hasMorePages = false;
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error scraping category ${category.name}, page ${currentPage}:`, error);
          errors.push({
            category: category.name,
            page: currentPage,
            error: errorMessage
          });
          hasMorePages = false;
        }
      }

      console.log(`Completed category ${category.name}: ${categoryProductCount} products`);
      category.productCount = categoryProductCount;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fatal error:', error);
    errors.push({ type: 'fatal', error: errorMessage });
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
  scrapeEjejuMallAccurate().catch(console.error);
}

export { scrapeEjejuMallAccurate };
export type { EjejuProduct };