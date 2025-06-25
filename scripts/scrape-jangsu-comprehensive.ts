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
  ca_id: string;
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
  const match = url.match(/it_id=([^&]+)/);
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
      $('a[href*="item.php"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('it_id=')) {
          let fullUrl = href.startsWith('http') ? href : `https://www.장수몰.com/board/shop/${href}`;
          // Fix relative URLs
          fullUrl = fullUrl.replace('/board/shop/./', '/board/shop/');
          if (!productLinks.includes(fullUrl)) {
            productLinks.push(fullUrl);
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
          let title = cleanText(
            product$('h1').text() ||
            product$('.item_name').text() ||
            product$('.product_name').text() ||
            product$('.goods_name').text() ||
            product$('title').text().replace('| 장수몰', '').trim()
          );

          if (!title || title.length < 3) {
            console.log(`Skipping product with invalid title: ${productUrl}`);
            continue;
          }

          // Extract image
          let imageUrl = '';
          const imgSelectors = [
            '.item_photo img',
            '.product_img img',
            '.goods_img img',
            '.view_img img',
            'img[src*="item"]'
          ];
          
          for (const selector of imgSelectors) {
            const imgElement = product$(selector).first();
            if (imgElement.length > 0) {
              const imgSrc = imgElement.attr('src');
              if (imgSrc) {
                imageUrl = imgSrc.startsWith('http') ? imgSrc : `https://www.장수몰.com${imgSrc}`;
                break;
              }
            }
          }

          // Extract price
          let priceText = '';
          const priceSelectors = [
            '.item_price',
            '.price',
            '.cost',
            '.amount',
            '.selling_price',
            '[class*="price"]'
          ];

          for (const selector of priceSelectors) {
            const priceEl = product$(selector);
            if (priceEl.length > 0) {
              priceText = priceEl.text();
              if (priceText.includes('원') || priceText.match(/\d/)) {
                break;
              }
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
          const originalPriceEl = product$('.consumer_price, .original_price, .was_price');
          if (originalPriceEl.length > 0) {
            originalPrice = cleanPrice(originalPriceEl.text());
          }

          // Extract description
          const description = cleanText(
            product$('.item_info').text() ||
            product$('.product_description').text() ||
            product$('.goods_info').text() ||
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
            mall: '장수몰',
            url: productUrl,
            region: '전라북도 장수군',
            tags: ['장수군', '전라북도', '장수몰', '농산물', '특산품']
          };

          // Add category-specific tags
          if (categoryName.includes('사과')) {
            product.tags.push('사과', '과일', '장수사과');
          }
          if (categoryName.includes('한우')) {
            product.tags.push('한우', '축산물', '고기', '장수한우');
          }
          if (categoryName.includes('과일')) {
            product.tags.push('과일', '생과일');
          }
          if (categoryName.includes('채소') || categoryName.includes('나물')) {
            product.tags.push('채소', '나물');
          }
          if (categoryName.includes('쌀') || categoryName.includes('잡곡')) {
            product.tags.push('쌀', '잡곡', '곡물');
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
    { name: '한우', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=102010', ca_id: '102010' },
    { name: '과일', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103020', ca_id: '103020' },
    { name: '채소/나물', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103030', ca_id: '103030' },
    { name: '쌀/잡곡', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103010', ca_id: '103010' },
    // Get more from all products listing
    { name: '전체상품', url: 'https://www.장수몰.com/board/shop/list.php', ca_id: 'all' }
  ];

  console.log(`Found ${categories.length} categories to scrape`);
  return categories;
}

async function main() {
  console.log('=== 장수몰 Comprehensive Scraping ===');
  
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

    // Remove duplicates based on URL
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.url === product.url)
    );

    // Create summary
    const summary: ScrapeSummary = {
      timestamp: new Date().toISOString(),
      mall: '장수몰',
      totalProducts: uniqueProducts.length,
      totalCategories: categories.length,
      categories: categories,
      successCount: uniqueProducts.length,
      errorCount,
      errors,
      sampleProducts: uniqueProducts.slice(0, 5)
    };

    // Save products
    if (uniqueProducts.length > 0) {
      fs.writeFileSync(
        'scripts/output/jangsu-products.json',
        JSON.stringify(uniqueProducts, null, 2),
        'utf8'
      );
      console.log(`\n✓ Saved ${uniqueProducts.length} unique products to jangsu-products.json`);
    }

    // Save summary
    fs.writeFileSync(
      'scripts/output/jangsu-scrape-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    // Final results
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n=== SCRAPING COMPLETE ===');
    console.log(`Total Products: ${uniqueProducts.length}`);
    console.log(`Categories Processed: ${categories.length}`);
    console.log(`Success Rate: ${uniqueProducts.length}/${uniqueProducts.length + errorCount} (${((uniqueProducts.length / (uniqueProducts.length + errorCount)) * 100).toFixed(1)}%)`);
    console.log(`Duration: ${duration.toFixed(1)} seconds`);
    
    if (errors.length > 0) {
      console.log(`\nErrors encountered: ${errors.length}`);
      errors.forEach(error => console.log(`- ${error}`));
    }

    // Show sample products
    if (uniqueProducts.length > 0) {
      console.log('\nSample products:');
      uniqueProducts.slice(0, 5).forEach((product, index) => {
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