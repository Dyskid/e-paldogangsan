import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

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
}

async function scrapeWemallPriority(): Promise<void> {
  const baseUrl = 'https://wemall.kr';
  const mallInfo = {
    id: 'wemall',
    name: '우리몰',
    region: '대구광역시',
    tags: ['장애인기업', '관공서구매', '공동구매', '사무용품', '식품', '생활용품']
  };

  // Priority categories with most products
  const priorityCategories: Category[] = [
    { id: '001', name: '식품/농산품', url: '/product/product.html?category=001' },
    { id: '002', name: '생활용품', url: '/product/product.html?category=002' },
    { id: '002014', name: '가구/인테리어', url: '/product/product.html?category=002014' },
    { id: '006', name: '청소용품', url: '/product/product.html?category=006' },
    { id: '011', name: '관공서구매상품', url: '/product/product.html?category=011' },
    { id: '039', name: '장애인 기업 제품', url: '/product/product.html?category=039' },
    { id: '040', name: '장애인기업 시공업체', url: '/product/product.html?category=040' },
    { id: '041', name: '토너.복사용지.사무용품.제지류.청소용품', url: '/product/product.html?category=041' },
    { id: '001021', name: '차/음료/과자/가공식품', url: '/product/product.html?category=001021' },
    { id: '002023', name: '침구/커튼/소품', url: '/product/product.html?category=002023' },
    { id: '002024', name: '주방/생활/수납용품', url: '/product/product.html?category=002024' },
    { id: '003', name: '사무용품', url: '/product/product.html?category=003' },
    { id: '005', name: '공사/인쇄', url: '/product/product.html?category=005' },
    { id: '006033', name: '마대', url: '/product/product.html?category=006033' },
    { id: '006034', name: '세제/제지/일용잡화', url: '/product/product.html?category=006034' },
    { id: '010', name: 'BEST상품', url: '/product/product.html?category=010' }
  ];

  const allProducts: Product[] = [];
  let totalErrors = 0;

  console.log('🔍 Starting priority scraping of 우리몰...');
  console.log(`📂 Scraping ${priorityCategories.length} priority categories`);

  for (const category of priorityCategories) {
    try {
      console.log(`\n🔍 Scraping ${category.name}...`);
      
      const categoryUrl = `${baseUrl}${category.url}`;
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        timeout: 20000
      });

      const $ = cheerio.load(response.data);
      
      // Get product count
      const totalText = $('.total p').text();
      const totalMatch = totalText.match(/총\s+(\d+)개의\s+상품/);
      const totalProducts = totalMatch ? parseInt(totalMatch[1]) : 0;
      
      console.log(`📊 ${totalProducts} products found`);

      if (totalProducts === 0) {
        console.log(`⏭️ Skipping empty category`);
        continue;
      }

      // Scrape first 3 pages max (36 products) to keep it fast
      const maxPages = Math.min(3, Math.ceil(totalProducts / 12));
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          let pageUrl = categoryUrl;
          if (page > 1) {
            pageUrl = `${categoryUrl}&page=${page}`;
            console.log(`📄 Scraping page ${page}...`);
          }

          const pageResponse = page === 1 ? response : await axios.get(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 15000
          });

          const page$ = cheerio.load(pageResponse.data);
          const products = scrapeProductsFromPage(page$, category, mallInfo, baseUrl);
          
          allProducts.push(...products);
          console.log(`✅ Added ${products.length} products`);

          // Short delay between pages
          if (page < maxPages) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (pageError) {
          console.log(`⚠️ Error on page ${page}: ${pageError}`);
          totalErrors++;
        }
      }

      // Short delay between categories
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) {
      console.log(`❌ Error scraping ${category.name}: ${error}`);
      totalErrors++;
    }
  }

  // Remove duplicates
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  );

  // Save results
  writeFileSync('./scripts/output/wemall-products.json', JSON.stringify(uniqueProducts, null, 2));
  writeFileSync('./scripts/output/wemall-scrape-summary.json', JSON.stringify({
    totalProducts: uniqueProducts.length,
    totalCategories: priorityCategories.length,
    errors: totalErrors,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('\n📊 Priority Scraping Summary:');
  console.log(`✅ Total products scraped: ${uniqueProducts.length}`);
  console.log(`📂 Categories processed: ${priorityCategories.length}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
}

function scrapeProductsFromPage($: cheerio.CheerioAPI, category: Category, mallInfo: any, baseUrl: string): Product[] {
  const products: Product[] = [];
  
  const productList = $('ul[data-shop-list="default"]');
  if (productList.length === 0) {
    return products;
  }

  productList.find('li').each((index, element) => {
    try {
      const $product = $(element);
      
      // Extract product ID
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

      // Skip if missing essential data
      if (!title || !productId) {
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

// Run the priority scraper
scrapeWemallPriority().then(() => {
  console.log('✅ Wemall priority scraping completed!');
}).catch(console.error);