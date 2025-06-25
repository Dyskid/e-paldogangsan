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

interface ScrapeSummary {
  timestamp: string;
  mall: string;
  totalProducts: number;
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

async function scrapeProductsFromCategory(categoryUrl: string, categoryName: string, maxProducts: number = 15): Promise<Product[]> {
  const products: Product[] = [];

  try {
    console.log(`Scraping ${categoryName} (max ${maxProducts} products)...`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract product links from the category page
    const productLinks: Array<{url: string, title: string}> = [];
    
    $('a[href*="goods_view.php"]').each((index, element) => {
      if (productLinks.length >= maxProducts) return false;
      
      const href = $(element).attr('href');
      const title = $(element).text().trim() || $(element).find('img').attr('alt') || '';
      
      if (href && href.includes('goodsNo=') && title) {
        let fullUrl = href.startsWith('http') ? href : `https://iksanmall.com${href}`;
        // Fix the URL if it has ../ prefix
        fullUrl = fullUrl.replace('iksanmall.com..', 'iksanmall.com');
        
        if (!productLinks.find(p => p.url === fullUrl)) {
          productLinks.push({ url: fullUrl, title });
        }
      }
    });

    console.log(`Found ${productLinks.length} product links to process`);

    // Scrape each product
    for (const productLink of productLinks.slice(0, maxProducts)) {
      try {
        await delay(800); // Rate limiting
        
        console.log(`Scraping: ${productLink.title}`);
        
        const productResponse = await axios.get(productLink.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        });

        const product$ = cheerio.load(productResponse.data);
        
        // Extract product information with multiple selectors
        let title = '';
        const titleSelectors = [
          '.view_tit',
          '.goods_tit',
          '.goodsName',
          '.product-title',
          '.item_name',
          'h1',
          '.view-title'
        ];
        
        for (const selector of titleSelectors) {
          const titleText = cleanText(product$(selector).text());
          if (titleText && titleText.length > 3 && !titleText.includes('익산몰')) {
            title = titleText;
            break;
          }
        }
        
        // Fallback to category page title if product page title not found
        if (!title || title.includes('익산몰')) {
          title = productLink.title;
        }

        if (!title || title.length < 3) {
          console.log(`Skipping product with invalid title: ${productLink.url}`);
          continue;
        }

        // Extract image
        let imageUrl = '';
        const imgSelectors = [
          '.view_img img',
          '.goods-image img',
          '.product-image img',
          '.item_photo img',
          'img[src*="goods"]'
        ];
        
        for (const selector of imgSelectors) {
          const imgElement = product$(selector).first();
          if (imgElement.length > 0) {
            const imgSrc = imgElement.attr('src');
            if (imgSrc) {
              imageUrl = imgSrc.startsWith('http') ? imgSrc : `https://iksanmall.com${imgSrc}`;
              break;
            }
          }
        }

        // Extract price
        let priceText = '';
        const priceSelectors = [
          '.selling_price',
          '.price',
          '.goods-price',
          '.view_price',
          '.item_price',
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

        const productId = extractProductId(productLink.url);

        const product: Product = {
          id: productId,
          title: title,
          image: imageUrl,
          price: price,
          originalPrice: originalPrice,
          description: description.substring(0, 500),
          category: categoryName,
          mall: '익산몰',
          url: productLink.url,
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
          product.tags.push('채소', '나물');
        }
        if (categoryName.includes('버섯')) {
          product.tags.push('버섯');
        }
        if (categoryName.includes('잡곡')) {
          product.tags.push('잡곡', '곡물');
        }

        products.push(product);
        console.log(`✓ ${products.length}: ${title} - ₩${price}`);

      } catch (error) {
        console.error(`Error scraping product ${productLink.url}:`, error);
      }
    }

  } catch (error) {
    console.error(`Error scraping ${categoryName}:`, error);
  }

  return products;
}

async function main() {
  console.log('=== 익산몰 Quick Scraping ===');
  
  const startTime = Date.now();
  const allProducts: Product[] = [];
  const errors: string[] = [];
  let errorCount = 0;

  // Main categories to scrape with product limits
  const categories = [
    { name: '쌀', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=001001', maxProducts: 15 },
    { name: '잡곡류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=001002', maxProducts: 15 },
    { name: '과일류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=002', maxProducts: 20 },
    { name: '채소/나물류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=003', maxProducts: 15 },
    { name: '버섯류', url: 'https://iksanmall.com/goods/goods_list.php?cateCd=004', maxProducts: 10 }
  ];

  try {
    console.log(`\nStarting to scrape ${categories.length} main categories...\n`);

    // Scrape each category
    for (const category of categories) {
      try {
        console.log(`\n=== Scraping Category: ${category.name} ===`);
        const categoryProducts = await scrapeProductsFromCategory(category.url, category.name, category.maxProducts);
        
        if (categoryProducts.length > 0) {
          allProducts.push(...categoryProducts);
          console.log(`✓ Successfully scraped ${categoryProducts.length} products from ${category.name}`);
        } else {
          console.log(`⚠ No products found in ${category.name}`);
        }

        await delay(2000); // Rate limiting

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
      successCount: allProducts.length,
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
    console.log(`Success Rate: ${allProducts.length}/${allProducts.length + errorCount} (${((allProducts.length / (allProducts.length + errorCount)) * 100).toFixed(1)}%)`);
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