import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  description: string;
  category: string;
  subcategory?: string;
  mall: string;
  url: string;
  region: string;
  tags: string[];
}

interface CategoryInfo {
  name: string;
  url: string;
  cateCd: string;
}

interface ScrapeSummary {
  timestamp: string;
  mall: string;
  totalProducts: number;
  totalCategories: number;
  categories: CategoryInfo[];
  successCount: number;
  errorCount: number;
  errors: string[];
  sampleProducts: Product[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

const cleanPrice = (priceText: string): string => {
  const priceMatch = priceText.match(/(\d+(?:,\d{3})*)/);
  return priceMatch ? priceMatch[1].replace(/,/g, '') : '';
};

const extractProductId = (url: string): string => {
  const match = url.match(/goodsNo=(\d+)/);
  return match ? match[1] : Math.random().toString(36).substr(2, 9);
};

async function scrapeCategoryProducts(categoryUrl: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  let page = 1;
  const maxPages = 10; // Limit to prevent infinite loops

  while (page <= maxPages) {
    try {
      console.log(`Scraping ${categoryName} - Page ${page}`);
      
      const pageUrl = page > 1 ? `${categoryUrl}&page=${page}` : categoryUrl;
      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      
      // Extract product links
      const productLinks: string[] = [];
      $('a[href*="goods_view.php"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('goodsNo=')) {
          const fullUrl = href.startsWith('http') ? href : `https://iksanmall.com${href}`;
          // Fix the URL if it has ../ prefix
          const cleanUrl = fullUrl.replace('iksanmall.com..', 'iksanmall.com');
          if (!productLinks.includes(cleanUrl)) {
            productLinks.push(cleanUrl);
          }
        }
      });

      if (productLinks.length === 0) {
        console.log(`No products found on page ${page}, stopping pagination`);
        break;
      }

      console.log(`Found ${productLinks.length} products on page ${page}`);

      // Scrape each product
      for (const productUrl of productLinks) {
        try {
          await delay(1000); // Rate limiting
          
          const productResponse = await axios.get(productUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
          });

          const product$ = cheerio.load(productResponse.data);
          
          // Extract product information
          const title = cleanText(
            product$('.view_tit').text() ||
            product$('h1').text() ||
            product$('.goodsName').text() ||
            product$('.product-title').text() ||
            product$('title').text()
          );

          if (!title || title.length < 3) {
            console.log(`Skipping product with invalid title: ${productUrl}`);
            continue;
          }

          // Extract image
          let imageUrl = '';
          const imgElement = product$('.view_img img').first() ||
                            product$('.product-image img').first() ||
                            product$('.goods-image img').first() ||
                            product$('img[src*="goods"]').first();
          
          if (imgElement.length > 0) {
            const imgSrc = imgElement.attr('src');
            if (imgSrc) {
              imageUrl = imgSrc.startsWith('http') ? imgSrc : `https://iksanmall.com${imgSrc}`;
            }
          }

          // Extract price
          const priceElements = [
            product$('.price'),
            product$('.selling_price'),
            product$('.goods-price'),
            product$('[class*="price"]'),
            product$('.view_price')
          ];

          let priceText = '';
          for (const priceEl of priceElements) {
            if (priceEl.length > 0) {
              priceText = priceEl.text();
              break;
            }
          }

          const price = cleanPrice(priceText);
          
          // Skip if no price found
          if (!price) {
            console.log(`Skipping product without price: ${title}`);
            continue;
          }

          // Extract original price if on sale
          let originalPrice: string | undefined;
          const originalPriceEl = product$('.consumer_price') || product$('.original-price');
          if (originalPriceEl.length > 0) {
            originalPrice = cleanPrice(originalPriceEl.text());
          }

          // Extract description
          const description = cleanText(
            product$('.goods_info').text() ||
            product$('.product-description').text() ||
            product$('.view_cont').text() ||
            title
          );

          const productId = extractProductId(productUrl);

          const product: Product = {
            id: productId,
            title: title,
            image: imageUrl,
            price: price,
            originalPrice: originalPrice,
            description: description.substring(0, 500), // Limit description length
            category: categoryName,
            mall: '익산몰',
            url: productUrl,
            region: '전라북도 익산시',
            tags: ['익산시', '전라북도', '익산몰', '농산물']
          };

          // Add category-specific tags
          if (categoryName.includes('쌀') || categoryName.includes('곡류')) {
            product.tags.push('쌀', '곡물', '곡류');
          }
          if (categoryName.includes('과일')) {
            product.tags.push('과일', '생과일');
          }
          if (categoryName.includes('채소') || categoryName.includes('나물')) {
            product.tags.push('채소', '나물', '농산물');
          }
          if (categoryName.includes('버섯')) {
            product.tags.push('버섯', '농산물');
          }

          products.push(product);
          console.log(`✓ ${products.length}: ${title} - ₩${price}`);

        } catch (error) {
          console.error(`Error scraping product ${productUrl}:`, error);
        }
      }

      // Check for next page
      const hasNextPage = $('a[href*="page="]').length > 0 || 
                         $('.pagination a').length > page + 1;
      
      if (!hasNextPage) {
        console.log('No more pages found');
        break;
      }

      page++;
      await delay(2000); // Rate limiting between pages

    } catch (error) {
      console.error(`Error scraping page ${page} of ${categoryName}:`, error);
      break;
    }
  }

  return products;
}

async function getAllCategories(): Promise<CategoryInfo[]> {
  console.log('Discovering categories...');
  
  const categories: CategoryInfo[] = [
    { name: '쌀', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=001001', cateCd: '001001' },
    { name: '잡곡류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=001002', cateCd: '001002' },
    { name: '과일류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=002', cateCd: '002' },
    { name: '사과', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=002001', cateCd: '002001' },
    { name: '배', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=002002', cateCd: '002002' },
    { name: '딸기', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=002003', cateCd: '002003' },
    { name: '채소/나물류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=003', cateCd: '003' },
    { name: '버섯류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=004', cateCd: '004' }
  ];

  console.log(`Found ${categories.length} categories to scrape`);
  return categories;
}

async function main() {
  console.log('=== 익산몰 Comprehensive Scraping ===');
  
  const startTime = Date.now();
  const allProducts: Product[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    // Get all categories
    const categories = await getAllCategories();
    console.log(`\nStarting to scrape ${categories.length} categories...\n`);

    // Scrape each category
    for (const category of categories) {
      try {
        console.log(`\n=== Scraping Category: ${category.name} ===`);
        const categoryProducts = await scrapeCategoryProducts(category.url, category.name);
        
        if (categoryProducts.length > 0) {
          allProducts.push(...categoryProducts);
          successCount += categoryProducts.length;
          console.log(`✓ Successfully scraped ${categoryProducts.length} products from ${category.name}`);
        } else {
          console.log(`⚠ No products found in ${category.name}`);
        }

        await delay(3000); // Rate limiting between categories

      } catch (error) {
        errorCount++;
        const errorMsg = `Error scraping category ${category.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Create summary
    const summary: ScrapeSummary = {
      timestamp: new Date().toISOString(),
      mall: '익산몰',
      totalProducts: allProducts.length,
      totalCategories: categories.length,
      categories: categories,
      successCount,
      errorCount,
      errors,
      sampleProducts: allProducts.slice(0, 5)
    };

    // Save products
    if (allProducts.length > 0) {
      fs.writeFileSync(
        'scripts/output/iksan-products.json',
        JSON.stringify(allProducts, null, 2),
        'utf8'
      );
      console.log(`\n✓ Saved ${allProducts.length} products to iksan-products.json`);
    }

    // Save summary
    fs.writeFileSync(
      'scripts/output/iksan-scrape-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    // Final results
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n=== SCRAPING COMPLETE ===');
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Categories Processed: ${categories.length}`);
    console.log(`Success Rate: ${successCount}/${successCount + errorCount} (${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%)`);
    console.log(`Duration: ${duration.toFixed(1)} seconds`);
    
    if (errors.length > 0) {
      console.log(`\nErrors encountered: ${errors.length}`);
      errors.forEach(error => console.log(`- ${error}`));
    }

    // Show sample products
    if (allProducts.length > 0) {
      console.log('\nSample products:');
      allProducts.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} - ₩${product.price} (${product.category})`);
      });
    }

  } catch (error) {
    console.error('Fatal error during scraping:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}