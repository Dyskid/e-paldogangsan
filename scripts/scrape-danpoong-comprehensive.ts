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
  const priceMatch = priceText.match(/₩([\d,]+)/);
  return priceMatch ? priceMatch[1].replace(/,/g, '') : '';
};

const extractProductId = (url: string): string => {
  const match = url.match(/\/product\/([^\/]+)/);
  return match ? match[1] : Math.random().toString(36).substr(2, 9);
};

async function scrapeCategoryProducts(categoryUrl: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  let page = 1;
  const maxPages = 10; // Limit to prevent infinite loops

  while (page <= maxPages) {
    try {
      console.log(`Scraping ${categoryName} - Page ${page}`);
      
      const response = await axios.get(categoryUrl, {
        params: page > 1 ? { page } : {},
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const productElements = $('.product');

      if (productElements.length === 0) {
        console.log(`No products found on page ${page}, stopping pagination`);
        break;
      }

      console.log(`Found ${productElements.length} products on page ${page}`);

      productElements.each((index, element) => {
        try {
          const $product = $(element);
          
          // Extract product link
          const productLink = $product.find('a').first().attr('href');
          if (!productLink) return;

          // Extract title
          const titleElement = $product.find('.woocommerce-loop-product__title, h2, h3, .product-title');
          const title = cleanText(titleElement.text());
          if (!title || title.includes('옵션 선택')) return;

          // Extract image
          const imgElement = $product.find('img').first();
          let imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
          if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = 'https://www.danpoongmall.kr' + imageUrl;
          }

          // Extract price
          const priceElement = $product.find('.price, .woocommerce-Price-amount');
          const priceText = priceElement.text();
          const price = cleanPrice(priceText);

          // Skip if no price found
          if (!price) {
            console.log(`Skipping product without price: ${title}`);
            return;
          }

          // Extract original price if on sale
          let originalPrice: string | undefined;
          const originalPriceElement = $product.find('.price del .woocommerce-Price-amount');
          if (originalPriceElement.length > 0) {
            originalPrice = cleanPrice(originalPriceElement.text());
          }

          const productId = extractProductId(productLink);

          const product: Product = {
            id: productId,
            title: title,
            image: imageUrl,
            price: price,
            originalPrice: originalPrice,
            description: title, // Will be enhanced with detailed description if needed
            category: categoryName,
            mall: '단풍미인',
            url: productLink.startsWith('http') ? productLink : 'https://www.danpoongmall.kr' + productLink,
            region: '전라북도 정읍시',
            tags: ['정읍시', '전라북도', '단풍미인', '농산물', '쌀', '잡곡']
          };

          // Add category-specific tags
          if (categoryName.includes('쌀') || categoryName.includes('잡곡')) {
            product.tags.push('쌀', '잡곡', '곡물');
          }
          if (categoryName.includes('축산') || categoryName.includes('수산')) {
            product.tags.push('축산물', '수산물');
          }

          products.push(product);
          console.log(`✓ ${products.length}: ${title} - ₩${price}`);

        } catch (error) {
          console.error(`Error processing product ${index}:`, error);
        }
      });

      // Check for next page
      const nextPageExists = $('.next').length > 0 || $(`a[href*="page=${page + 1}"]`).length > 0;
      if (!nextPageExists) {
        console.log('No more pages found');
        break;
      }

      page++;
      await delay(1000); // Rate limiting

    } catch (error) {
      console.error(`Error scraping page ${page} of ${categoryName}:`, error);
      break;
    }
  }

  return products;
}

async function getAllCategories(): Promise<CategoryInfo[]> {
  console.log('Discovering categories...');
  
  try {
    const response = await axios.get('https://www.danpoongmall.kr/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    const categories: CategoryInfo[] = [];

    // Find product category links
    $('a[href*="/product-category/"]').each((index, element) => {
      const url = $(element).attr('href');
      const name = cleanText($(element).text());
      
      if (url && name && !categories.find(c => c.url === url)) {
        categories.push({
          name: name,
          url: url.startsWith('http') ? url : 'https://www.danpoongmall.kr' + url
        });
      }
    });

    // Add known main categories if not found
    const knownCategories = [
      { name: '쌀/잡곡', url: 'https://www.danpoongmall.kr/product-category/%ec%8c%80-%ec%9e%a1%ea%b3%a1/' },
      { name: '농축/수산물', url: 'https://www.danpoongmall.kr/product-category/%ec%b6%95%ec%82%b0%eb%ac%bc/' }
    ];

    for (const knownCat of knownCategories) {
      if (!categories.find(c => c.url === knownCat.url)) {
        categories.push(knownCat);
      }
    }

    console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
    return categories;

  } catch (error) {
    console.error('Error discovering categories:', error);
    // Fallback to known categories
    return [
      { name: '쌀/잡곡', url: 'https://www.danpoongmall.kr/product-category/%ec%8c%80-%ec%9e%a1%ea%b3%a1/' },
      { name: '농축/수산물', url: 'https://www.danpoongmall.kr/product-category/%ec%b6%95%ec%82%b0%eb%ac%bc/' }
    ];
  }
}

async function main() {
  console.log('=== 단풍미인 Mall Comprehensive Scraping ===');
  
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

        await delay(2000); // Rate limiting between categories

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
      mall: '단풍미인',
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
        'scripts/output/danpoong-products.json',
        JSON.stringify(allProducts, null, 2),
        'utf8'
      );
      console.log(`\n✓ Saved ${allProducts.length} products to danpoong-products.json`);
    }

    // Save summary
    fs.writeFileSync(
      'scripts/output/danpoong-scrape-summary.json',
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
      allProducts.slice(0, 3).forEach((product, index) => {
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