import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercent?: string;
  imageUrl: string;
  externalUrl: string;
  category: string;
  isNew: boolean;
  isBest: boolean;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  url: string;
  hasSubcategories: boolean;
  subcategories?: Category[];
}

interface ScrapingResult {
  totalProducts: number;
  products: Product[];
  categories: Category[];
  timestamp: string;
  errors: string[];
}

async function scrapeWemallComprehensive(): Promise<void> {
  const baseUrl = 'https://wemall.kr';
  const mallInfo = {
    id: 'wemall',
    name: '우리몰',
    region: '대구광역시',
    tags: ['장애인기업', '관공서구매', '공동구매', '사무용품', '식품', '생활용품']
  };

  const result: ScrapingResult = {
    totalProducts: 0,
    products: [],
    categories: [],
    timestamp: new Date().toISOString(),
    errors: []
  };

  try {
    console.log('🔍 Starting comprehensive scraping of 우리몰...');

    // First, get all categories from the main page analysis
    const categories: Category[] = [
      { id: '001', name: '식품/농산품', url: '/product/product.html?category=001', hasSubcategories: true },
      { id: '001013', name: '쌀/농축산물', url: '/product/product.html?category=001013', hasSubcategories: false },
      { id: '001021', name: '차/음료/과자/가공식품', url: '/product/product.html?category=001021', hasSubcategories: false },
      { id: '001022', name: '건강식품/다이어트', url: '/product/product.html?category=001022', hasSubcategories: false },
      { id: '002', name: '생활용품', url: '/product/product.html?category=002', hasSubcategories: true },
      { id: '002014', name: '가구/인테리어', url: '/product/product.html?category=002014', hasSubcategories: false },
      { id: '002023', name: '침구/커튼/소품', url: '/product/product.html?category=002023', hasSubcategories: false },
      { id: '002024', name: '주방/생활/수납용품', url: '/product/product.html?category=002024', hasSubcategories: false },
      { id: '002025', name: '원예/선물', url: '/product/product.html?category=002025', hasSubcategories: false },
      { id: '002049', name: '건강/미용', url: '/product/product.html?category=002049', hasSubcategories: false },
      { id: '003', name: '사무용품', url: '/product/product.html?category=003', hasSubcategories: true },
      { id: '003015', name: '복사용지/토너류', url: '/product/product.html?category=003015', hasSubcategories: false },
      { id: '003026', name: '문구/팬시', url: '/product/product.html?category=003026', hasSubcategories: false },
      { id: '003045', name: '사무지류', url: '/product/product.html?category=003045', hasSubcategories: false },
      { id: '003046', name: '일반사무', url: '/product/product.html?category=003046', hasSubcategories: false },
      { id: '003047', name: '사무기기', url: '/product/product.html?category=003047', hasSubcategories: false },
      { id: '003048', name: '하드웨어', url: '/product/product.html?category=003048', hasSubcategories: false },
      { id: '003050', name: '청소/위생', url: '/product/product.html?category=003050', hasSubcategories: false },
      { id: '004', name: '디지털/가전', url: '/product/product.html?category=004', hasSubcategories: true },
      { id: '004016', name: '생활가전', url: '/product/product.html?category=004016', hasSubcategories: false },
      { id: '004027', name: '휴대폰/스마트용품', url: '/product/product.html?category=004027', hasSubcategories: false },
      { id: '004028', name: '컴퓨터/주변기기', url: '/product/product.html?category=004028', hasSubcategories: false },
      { id: '004029', name: '주방가전', url: '/product/product.html?category=004029', hasSubcategories: false },
      { id: '005', name: '공사/인쇄', url: '/product/product.html?category=005', hasSubcategories: true },
      { id: '005017', name: '공사', url: '/product/product.html?category=005017', hasSubcategories: false },
      { id: '005030', name: '광고/디자인', url: '/product/product.html?category=005030', hasSubcategories: false },
      { id: '005031', name: '인쇄', url: '/product/product.html?category=005031', hasSubcategories: false },
      { id: '005032', name: '산업/안전용품', url: '/product/product.html?category=005032', hasSubcategories: false },
      { id: '006', name: '청소용품', url: '/product/product.html?category=006', hasSubcategories: true },
      { id: '006018', name: '소독/방역', url: '/product/product.html?category=006018', hasSubcategories: false },
      { id: '006033', name: '마대', url: '/product/product.html?category=006033', hasSubcategories: false },
      { id: '006034', name: '세제/제지/일용잡화', url: '/product/product.html?category=006034', hasSubcategories: false },
      { id: '006035', name: '위생용품', url: '/product/product.html?category=006035', hasSubcategories: false },
      { id: '007', name: '스포츠/건강', url: '/product/product.html?category=007', hasSubcategories: true },
      { id: '007019', name: '자전거/헬스/다이어트', url: '/product/product.html?category=007019', hasSubcategories: false },
      { id: '007036', name: '등산/아우도어/캠핑', url: '/product/product.html?category=007036', hasSubcategories: false },
      { id: '008', name: '아동용품/취미', url: '/product/product.html?category=008', hasSubcategories: true },
      { id: '008020', name: '유아/간식', url: '/product/product.html?category=008020', hasSubcategories: false },
      { id: '008037', name: '장난감/유아교육/인형', url: '/product/product.html?category=008037', hasSubcategories: false },
      { id: '008038', name: '취미/자동차/공구', url: '/product/product.html?category=008038', hasSubcategories: false },
      { id: '009', name: '기타', url: '/product/product.html?category=009', hasSubcategories: false },
      { id: '010', name: 'BEST상품', url: '/product/product.html?category=010', hasSubcategories: false },
      { id: '011', name: '관공서구매상품', url: '/product/product.html?category=011', hasSubcategories: false },
      { id: '012', name: '공동구매상품', url: '/product/product.html?category=012', hasSubcategories: false },
      { id: '039', name: '장애인 기업 제품', url: '/product/product.html?category=039', hasSubcategories: false },
      { id: '040', name: '장애인기업 시공업체', url: '/product/product.html?category=040', hasSubcategories: false },
      { id: '041', name: '토너.복사용지.사무용품.제지류.청소용품', url: '/product/product.html?category=041', hasSubcategories: false }
    ];

    result.categories = categories;

    console.log(`📂 Found ${categories.length} categories to scrape`);

    // Scrape each category
    for (const category of categories) {
      try {
        console.log(`\n🔍 Scraping category: ${category.name} (${category.id})`);
        
        const categoryUrl = `${baseUrl}${category.url}`;
        const response = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 30000
        });

        const $ = cheerio.load(response.data);
        
        // Check total products count
        const totalText = $('.total p').text();
        const totalMatch = totalText.match(/총\s+(\d+)개의\s+상품/);
        const totalProducts = totalMatch ? parseInt(totalMatch[1]) : 0;
        
        console.log(`📊 Category ${category.name}: ${totalProducts} products found`);

        if (totalProducts === 0) {
          console.log(`⏭️ Skipping empty category: ${category.name}`);
          continue;
        }

        // Scrape products from current page
        const products = await scrapeProductsFromPage($, category, mallInfo, baseUrl);
        result.products.push(...products);
        
        console.log(`✅ Scraped ${products.length} products from ${category.name}`);

        // Check for pagination and scrape additional pages
        let hasNextPage = true;
        let currentPage = 1;
        const maxPages = Math.ceil(totalProducts / 12); // Assuming 12 products per page
        
        while (hasNextPage && currentPage < maxPages && currentPage < 10) { // Limit to 10 pages per category
          currentPage++;
          const nextPageUrl = `${categoryUrl}&page=${currentPage}`;
          
          try {
            console.log(`📄 Scraping page ${currentPage} of ${category.name}...`);
            
            const pageResponse = await axios.get(nextPageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
              },
              timeout: 30000
            });

            const page$ = cheerio.load(pageResponse.data);
            const pageProducts = await scrapeProductsFromPage(page$, category, mallInfo, baseUrl);
            
            if (pageProducts.length === 0) {
              hasNextPage = false;
            } else {
              result.products.push(...pageProducts);
              console.log(`✅ Scraped ${pageProducts.length} products from page ${currentPage}`);
            }
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (pageError) {
            console.log(`⚠️ Error scraping page ${currentPage}: ${pageError}`);
            hasNextPage = false;
          }
        }

        // Add delay between categories
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        const errorMsg = `Error scraping category ${category.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.log(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    result.totalProducts = result.products.length;

    // Remove duplicates based on product ID
    const uniqueProducts = result.products.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    result.products = uniqueProducts;
    result.totalProducts = uniqueProducts.length;

    // Save results
    writeFileSync('./scripts/output/wemall-products.json', JSON.stringify(result.products, null, 2));
    writeFileSync('./scripts/output/wemall-scrape-summary.json', JSON.stringify({
      totalProducts: result.totalProducts,
      totalCategories: result.categories.length,
      errors: result.errors,
      timestamp: result.timestamp
    }, null, 2));

    console.log('\n📊 Scraping Summary:');
    console.log(`✅ Total products scraped: ${result.totalProducts}`);
    console.log(`📂 Categories processed: ${result.categories.length}`);
    console.log(`❌ Errors encountered: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
  }
}

async function scrapeProductsFromPage($: cheerio.CheerioAPI, category: Category, mallInfo: any, baseUrl: string): Promise<Product[]> {
  const products: Product[] = [];
  
  // Find product list container
  const productList = $('ul[data-shop-list="default"]');
  
  if (productList.length === 0) {
    console.log('⚠️ No product list found on page');
    return products;
  }

  // Extract products
  productList.find('li').each((index, element) => {
    try {
      const $product = $(element);
      
      // Extract product ID from onclick
      const marketLink = $product.find('a.market');
      const onclickText = marketLink.attr('onclick') || '';
      const idMatch = onclickText.match(/market_cnt\('([^']+)'\)/);
      const productId = idMatch ? idMatch[1] : `wemall-${category.id}-${index}`;

      // Extract image
      const imageElement = $product.find('span.img img');
      let imageUrl = imageElement.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }

      // Extract title
      const title = $product.find('em').text().trim();
      
      // Extract description
      const description = $product.find('i').first().text().trim();

      // Extract prices
      const priceSpan = $product.find('span.price');
      const priceElements = priceSpan.find('i');
      let price = '';
      let originalPrice = '';
      
      if (priceElements.length >= 2) {
        originalPrice = priceElements.eq(0).text().trim();
        price = priceElements.eq(1).text().trim();
      } else if (priceElements.length === 1) {
        price = priceElements.eq(0).text().trim();
      }

      // Extract discount percentage
      const discountSpan = $product.find('span.percent');
      const discountPercent = discountSpan.find('i').last().text().trim();

      // Extract external URL
      const viewLink = $product.find('div[data-shop-list="util"] a.view');
      const externalUrl = viewLink.attr('href') || '';

      // Check for NEW/BEST badges
      const isNew = $product.find('[data-shop-icon="new"]').length > 0;
      const isBest = $product.find('[data-shop-icon="best"]').length > 0;

      // Skip if essential data is missing
      if (!title || !productId) {
        console.log(`⚠️ Skipping product due to missing essential data: ${title || 'No title'}`);
        return;
      }

      const product: Product = {
        id: `wemall-${productId}`,
        title: title,
        description: description,
        price: price,
        originalPrice: originalPrice || undefined,
        discountPercent: discountPercent || undefined,
        imageUrl: imageUrl,
        externalUrl: externalUrl,
        category: category.name,
        isNew: isNew,
        isBest: isBest,
        mallId: mallInfo.id,
        mallName: mallInfo.name,
        region: mallInfo.region,
        tags: [...mallInfo.tags, category.name.split('/')[0]]
      };

      products.push(product);
      
    } catch (error) {
      console.log(`⚠️ Error parsing product ${index}: ${error}`);
    }
  });

  return products;
}

// Run the scraper
scrapeWemallComprehensive().then(() => {
  console.log('✅ Wemall comprehensive scraping completed!');
}).catch(console.error);