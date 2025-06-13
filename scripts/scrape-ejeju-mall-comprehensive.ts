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

async function scrapeEjejuMallComprehensive() {
  console.log('Starting 이제주몰 comprehensive scraper...');
  
  const allProducts: EjejuProduct[] = [];
  const errors: any[] = [];

  // Comprehensive list of all categories found
  const categories: Category[] = [
    // Main categories
    { id: '1', name: '제주 농산품' },
    { id: '2', name: '제주 수산품' },
    { id: '1671', name: '제주 축산품' },
    { id: '4', name: '제주 가공식품' },
    { id: '6', name: '제주 화장품' },
    { id: '31069', name: '제주 공예품' },
    
    // Additional categories found from product links
    { id: '1625', name: '카테고리 1625' },
    { id: '1672', name: '카테고리 1672' },
    { id: '1789', name: '카테고리 1789' },
    { id: '1854', name: '카테고리 1854' },
    { id: '31004', name: '카테고리 31004' },
    { id: '31017', name: '카테고리 31017' },
    { id: '31019', name: '카테고리 31019' },
    { id: '31021', name: '카테고리 31021' },
    { id: '31040', name: '카테고리 31040' },
    { id: '31041', name: '카테고리 31041' },
    { id: '31042', name: '카테고리 31042' },
    { id: '31043', name: '카테고리 31043' },
    { id: '31046', name: '카테고리 31046' },
    { id: '31059', name: '카테고리 31059' },
    { id: '31115', name: '카테고리 31115' },
    { id: '31143', name: '카테고리 31143' },
    { id: '31154', name: '카테고리 31154' },
    { id: '45', name: '카테고리 45' },
    
    // Previously tried categories
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

  // Keep track of unique products by ID
  const uniqueProducts = new Map<string, EjejuProduct>();

  try {
    for (const category of categories) {
      console.log(`\nScraping category: ${category.name} (ID: ${category.id})`);
      
      let currentPage = 1;
      let hasMorePages = true;
      let categoryProductCount = 0;

      while (hasMorePages && currentPage <= 10) { // Limit pages to prevent infinite loops
        try {
          const categoryUrl = `https://mall.ejeju.net/goods/main.do?cate=${category.id}&page=${currentPage}`;
          console.log(`  Loading page ${currentPage}`);
          
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
                : `https://mall.ejeju.net${href.startsWith('/') ? href : '/goods/' + href.replace('../', '')}`;

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
              const imgElement = $elem.find('.thum img, .images img').first();
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

              // Extract brand from title
              let brand: string | undefined;
              const titleMatch = title.match(/\[(.*?)\]/);
              if (titleMatch) {
                brand = titleMatch[1];
              }

              // Extract description from summary
              const description = $elem.find('.pro_summary').text().trim();

              const product: EjejuProduct = {
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
                description,
                mallName: '이제주몰',
                mallUrl: 'https://mall.ejeju.net',
                scrapedAt: new Date().toISOString()
              };

              products.push(product);
              
              // Add to unique products map
              uniqueProducts.set(productId, product);
            } catch (err) {
              console.error('Error extracting product:', err);
            }
          });

          if (products.length > 0) {
            console.log(`    Found ${products.length} products`);
            categoryProductCount += products.length;

            // Check for pagination
            const paginationExists = $('.paging').length > 0;
            const currentPageActive = $('.paging .on').text().trim();
            const lastPageLink = $('.paging a').last().text().trim();
            
            // Check if there are more pages
            if (paginationExists && currentPageActive && lastPageLink && 
                parseInt(currentPageActive) < parseInt(lastPageLink)) {
              currentPage++;
              await delay(1000); // Rate limiting
            } else if (products.length >= 12) {
              // If no pagination but full page of products, try next page
              currentPage++;
              await delay(1000);
            } else {
              hasMorePages = false;
            }
          } else {
            hasMorePages = false;
          }

        } catch (error) {
          console.error(`  Error on page ${currentPage}:`, error.message);
          errors.push({
            category: category.name,
            page: currentPage,
            error: error.message
          });
          hasMorePages = false;
        }
      }

      console.log(`  Total for category: ${categoryProductCount} products`);
      category.productCount = categoryProductCount;
    }

  } catch (error) {
    console.error('Fatal error:', error);
    errors.push({ type: 'fatal', error: error.message });
  }

  // Convert unique products map to array
  const allUniqueProducts = Array.from(uniqueProducts.values());

  // Save results
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save all products
  fs.writeFileSync(
    path.join(outputDir, 'ejeju-mall-products-comprehensive.json'),
    JSON.stringify(allUniqueProducts, null, 2)
  );

  // Save summary
  const summary = {
    mallName: '이제주몰',
    mallUrl: 'https://mall.ejeju.net',
    totalProducts: allUniqueProducts.length,
    totalProductsScraped: allProducts.length,
    duplicatesRemoved: allProducts.length - allUniqueProducts.length,
    categories: categories.filter(c => c.productCount && c.productCount > 0),
    scrapedAt: new Date().toISOString(),
    errors: errors.length > 0 ? errors : undefined
  };

  fs.writeFileSync(
    path.join(outputDir, 'ejeju-mall-summary-comprehensive.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n=== Scraping Complete ===');
  console.log(`Total unique products: ${allUniqueProducts.length}`);
  console.log(`Total products scraped (including duplicates): ${allProducts.length}`);
  console.log(`Duplicates removed: ${allProducts.length - allUniqueProducts.length}`);
  console.log(`Errors encountered: ${errors.length}`);
  console.log('\nCategory breakdown:');
  categories.forEach(cat => {
    if (cat.productCount && cat.productCount > 0) {
      console.log(`  ${cat.name}: ${cat.productCount} products`);
    }
  });

  return { products: allUniqueProducts, summary };
}

// Run the scraper
if (require.main === module) {
  scrapeEjejuMallComprehensive().catch(console.error);
}

export { scrapeEjejuMallComprehensive, EjejuProduct };