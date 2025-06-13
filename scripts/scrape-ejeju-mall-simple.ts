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

async function scrapeEjejuMallSimple() {
  console.log('Starting 이제주몰 scraper (simple version)...');
  
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

  const axiosConfig = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
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

          // Check if there are no products
          if ($('.no-data').length > 0 || $('.no_data').length > 0) {
            console.log(`No products found in category ${category.name}`);
            hasMorePages = false;
            continue;
          }

          // Extract products
          const products: EjejuProduct[] = [];
          
          // Try different possible selectors
          const productSelectors = [
            '.goods_list .item',
            '.product-list .product-item',
            '.item_list li',
            '.product_list li',
            '.goods-list li'
          ];
          
          let productElements = null;
          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              productElements = elements;
              console.log(`Found products with selector: ${selector}`);
              break;
            }
          }

          if (!productElements || productElements.length === 0) {
            console.log('No products found with any selector');
            
            // Save HTML for debugging
            const debugDir = path.join(__dirname, 'output', 'debug');
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
            }
            fs.writeFileSync(
              path.join(debugDir, `ejeju-cat${category.id}-page${currentPage}.html`),
              response.data
            );
            
            hasMorePages = false;
            continue;
          }

          productElements.each((index, element) => {
            try {
              const $elem = $(element);
              
              // Extract product URL and ID
              const linkElement = $elem.find('a').first();
              const href = linkElement.attr('href') || '';
              const onclick = linkElement.attr('onclick') || '';
              
              let productId = '';
              // Try to extract from onclick or href
              const gnoMatch = (onclick + href).match(/gno=(\d+)/);
              if (gnoMatch) {
                productId = gnoMatch[1];
              }

              if (!productId) return;

              const productUrl = `https://mall.ejeju.net/goods/detail.do?gno=${productId}&cate=${category.id}`;

              // Extract title
              const titleSelectors = ['.goods_name', '.name', '.title', '.product-name', '.item_name'];
              let title = '';
              for (const selector of titleSelectors) {
                const titleElem = $elem.find(selector).first();
                if (titleElem.length > 0) {
                  title = titleElem.text().trim();
                  break;
                }
              }

              // Extract price
              const priceSelectors = ['.price', '.goods_price', '.product-price', '.item_price'];
              let price = 0;
              for (const selector of priceSelectors) {
                const priceElem = $elem.find(selector).first();
                if (priceElem.length > 0) {
                  const priceText = priceElem.text();
                  const priceMatch = priceText.match(/[\d,]+/);
                  if (priceMatch) {
                    price = parseInt(priceMatch[0].replace(/,/g, ''));
                    break;
                  }
                }
              }

              // Extract image URL
              const imgElement = $elem.find('img').first();
              let imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
              
              // Make image URL absolute
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = new URL(imageUrl, 'https://mall.ejeju.net').href;
              }

              // Check availability
              const soldOutSelectors = ['.sold_out', '.soldout', '.품절'];
              let isAvailable = true;
              for (const selector of soldOutSelectors) {
                if ($elem.find(selector).length > 0) {
                  isAvailable = false;
                  break;
                }
              }

              products.push({
                id: productId,
                url: productUrl,
                title,
                price,
                imageUrl,
                category: category.name,
                categoryId: category.id,
                isAvailable,
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

            // Check for next page
            const hasNext = $('.pagination .next:not(.disabled)').length > 0 || 
                          $('.paging .next:not(.disabled)').length > 0 ||
                          $(`a[href*="page=${currentPage + 1}"]`).length > 0;

            if (hasNext && products.length >= 10) {
              currentPage++;
              await delay(1500); // Rate limiting
            } else {
              hasMorePages = false;
            }
          } else {
            console.log(`No products extracted from page ${currentPage}`);
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
        }
      }

      console.log(`Completed category ${category.name}: ${categoryProductCount} products`);
      category.productCount = categoryProductCount;
    }

  } catch (error) {
    console.error('Fatal error:', error);
    errors.push({ type: 'fatal', error: error.message });
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
  scrapeEjejuMallSimple().catch(console.error);
}

export { scrapeEjejuMallSimple };
export type { EjejuProduct };