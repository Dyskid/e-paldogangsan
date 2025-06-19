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

interface ScrapingResult {
  totalProducts: number;
  products: Product[];
  categories: string[];
  timestamp: string;
  errors: string[];
}

// Food/Agricultural categories to scrape
const FOOD_CATEGORIES = [
  { id: '001', name: '식품/농산품' },
  { id: '001013', name: '쌀/농축산물' },
  { id: '001021', name: '차/음료/과자/가공식품' },
  { id: '001022', name: '건강식품/다이어트' }
];

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeProductsFromCategory(categoryId: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  const baseUrl = 'https://wemall.kr';
  let page = 1;
  let hasMorePages = true;

  console.log(`\n📂 Scraping category: ${categoryName} (${categoryId})`);

  while (hasMorePages && page <= 10) { // Limit to 10 pages per category
    try {
      const url = `${baseUrl}/product/product.html?category=${categoryId}&page=${page}`;
      console.log(`  📄 Page ${page}: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': baseUrl
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Find product items
      const productItems = $('.product-item, .goods-item, .item, [class*="product"]').filter((_, el) => {
        const $el = $(el);
        return $el.find('a').length > 0 && ($el.find('img').length > 0 || $el.find('.price').length > 0);
      });

      if (productItems.length === 0) {
        console.log(`  ⚠️ No products found on page ${page}`);
        hasMorePages = false;
        break;
      }

      productItems.each((index, element) => {
        try {
          const $item = $(element);
          
          // Extract product URL
          const linkElem = $item.find('a').first();
          const productUrl = linkElem.attr('href');
          if (!productUrl) return;

          // Extract product ID from URL
          const idMatch = productUrl.match(/product_id=(\d+)|pid=(\d+)|id=(\d+)/);
          const productId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : `${categoryId}-${page}-${index}`;

          // Extract title
          const title = $item.find('.product-name, .name, .title, [class*="name"]').first().text().trim() ||
                       $item.find('a').attr('title') ||
                       $item.find('img').attr('alt') ||
                       '';

          if (!title) return;

          // Extract image
          const imageUrl = $item.find('img').first().attr('src') || '';
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;

          // Extract price
          const priceText = $item.find('.price, .sale-price, [class*="price"]').first().text();
          const price = priceText.replace(/[^0-9,]/g, '') || '0';

          // Extract original price (for discounts)
          const originalPriceText = $item.find('.original-price, .old-price, .list-price').first().text();
          const originalPrice = originalPriceText ? originalPriceText.replace(/[^0-9,]/g, '') : undefined;

          // Check for badges
          const isNew = $item.find('.new, .badge-new, [class*="new"]').length > 0;
          const isBest = $item.find('.best, .badge-best, [class*="best"]').length > 0;

          const product: Product = {
            id: `wemall-${productId}`,
            title: title,
            description: title, // Use title as description if not available
            price: price,
            originalPrice: originalPrice,
            discountPercent: originalPrice && price ? 
              Math.round((1 - parseInt(price.replace(/,/g, '')) / parseInt(originalPrice.replace(/,/g, ''))) * 100).toString() : 
              undefined,
            imageUrl: fullImageUrl,
            externalUrl: productUrl.startsWith('http') ? productUrl : `${baseUrl}${productUrl}`,
            category: categoryName,
            isNew: isNew,
            isBest: isBest,
            mallId: 'wemall',
            mallName: '우리몰',
            region: '대구광역시',
            tags: ['지역특산품', categoryName]
          };

          products.push(product);
        } catch (err) {
          console.error(`  ❌ Error parsing product: ${err}`);
        }
      });

      console.log(`  ✅ Found ${productItems.length} products on page ${page}`);

      // Check for next page
      const hasNextPage = $('.pagination .next, .paging .next, [class*="next"]').not('.disabled').length > 0 ||
                         $(`.pagination a:contains("${page + 1}")`).length > 0;
      
      if (!hasNextPage || productItems.length < 10) {
        hasMorePages = false;
      } else {
        page++;
        await delay(1000); // Be respectful with requests
      }

    } catch (error) {
      console.error(`  ❌ Error scraping page ${page}: ${error}`);
      hasMorePages = false;
    }
  }

  return products;
}

async function scrapeWemallFoodComprehensive(): Promise<void> {
  const result: ScrapingResult = {
    totalProducts: 0,
    products: [],
    categories: FOOD_CATEGORIES.map(c => c.name),
    timestamp: new Date().toISOString(),
    errors: []
  };

  try {
    console.log('🔍 Starting comprehensive food product scraping of 우리몰...');
    console.log(`📂 Categories to scrape: ${FOOD_CATEGORIES.length}`);

    // Scrape each food category
    for (const category of FOOD_CATEGORIES) {
      try {
        const categoryProducts = await scrapeProductsFromCategory(category.id, category.name);
        result.products.push(...categoryProducts);
        console.log(`  📦 Total products in ${category.name}: ${categoryProducts.length}`);
        await delay(2000); // Delay between categories
      } catch (error) {
        const errorMsg = `Failed to scrape category ${category.name}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // Remove duplicates based on product ID
    const uniqueProducts = new Map<string, Product>();
    result.products.forEach(product => {
      if (!uniqueProducts.has(product.id) || product.price !== '0') {
        uniqueProducts.set(product.id, product);
      }
    });

    result.products = Array.from(uniqueProducts.values());
    result.totalProducts = result.products.length;

    // Save results
    writeFileSync('./scripts/output/wemall-food-products-comprehensive.json', JSON.stringify(result, null, 2));

    // Generate summary
    const summary = {
      timestamp: result.timestamp,
      totalProducts: result.totalProducts,
      categoriesScraped: result.categories,
      productsByCategory: result.products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      productsWithPrices: result.products.filter(p => p.price && p.price !== '0').length,
      productsWithImages: result.products.filter(p => p.imageUrl).length,
      productsWithDiscounts: result.products.filter(p => p.originalPrice).length,
      errors: result.errors,
      sampleProducts: result.products.slice(0, 5)
    };

    writeFileSync('./scripts/output/wemall-food-scrape-summary.json', JSON.stringify(summary, null, 2));

    console.log('\n📊 Scraping Summary:');
    console.log(`✅ Total food products found: ${result.totalProducts}`);
    console.log(`💰 Products with prices: ${summary.productsWithPrices}`);
    console.log(`🖼️ Products with images: ${summary.productsWithImages}`);
    console.log(`🏷️ Products with discounts: ${summary.productsWithDiscounts}`);
    
    console.log('\n📂 Products by category:');
    Object.entries(summary.productsByCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });

    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
  }
}

// Run the scraper
scrapeWemallFoodComprehensive().then(() => {
  console.log('\n✅ Food product scraping complete!');
}).catch(console.error);