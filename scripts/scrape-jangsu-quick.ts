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
  const match = url.match(/it_id=([^&]+)/);
  return match ? match[1] : Math.random().toString(36).substr(2, 9);
};

async function scrapeProductsFromHomepage(): Promise<Product[]> {
  const products: Product[] = [];

  try {
    console.log('Scraping products from homepage...');
    
    const response = await axios.get('https://www.장수몰.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract product links from the homepage
    const productLinks: Array<{url: string, title: string}> = [];
    
    $('a[href*="item.php"]').each((index, element) => {
      const href = $(element).attr('href');
      let title = $(element).text().trim() || $(element).find('img').attr('alt') || '';
      
      if (href && href.includes('it_id=')) {
        let fullUrl = href.startsWith('http') ? href : `https://www.장수몰.com${href}`;
        // Fix relative URLs
        fullUrl = fullUrl.replace('/board/shop/./', '/board/shop/');
        
        // Clean up title from homepage
        title = cleanText(title);
        
        if (!productLinks.find(p => p.url === fullUrl) && title.length > 3) {
          productLinks.push({ url: fullUrl, title });
        }
      }
    });

    console.log(`Found ${productLinks.length} product links to process`);

    // Limit to first 40 products for quick processing
    const limitedLinks = productLinks.slice(0, 40);

    // Scrape each product
    for (const productLink of limitedLinks) {
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
        
        // Extract product information with multiple strategies
        let title = '';
        
        // Try multiple selectors for title
        const titleSelectors = [
          'h1',
          '.item_name',
          '.product_name',
          '.goods_name',
          '.product_title'
        ];
        
        for (const selector of titleSelectors) {
          const titleText = cleanText(product$(selector).text());
          if (titleText && titleText.length > 5 && !titleText.includes('장수몰')) {
            title = titleText;
            break;
          }
        }
        
        // Fallback to page title
        if (!title) {
          title = cleanText(product$('title').text().replace('| 장수몰', '').trim());
        }
        
        // Final fallback to homepage title
        if (!title || title.length < 5) {
          title = productLink.title;
        }

        if (!title || title.length < 3) {
          console.log(`Skipping product with invalid title: ${productLink.url}`);
          continue;
        }

        // Extract image
        let imageUrl = '';
        const imgSelectors = [
          '.item_photo img',
          '.product_img img',
          '.goods_img img',
          '.view_img img',
          'img[src*="item"]',
          'img[src*="product"]'
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

        // Determine category based on title content
        let category = '농산물';
        if (title.includes('사과')) {
          category = '사과';
        } else if (title.includes('한우') || title.includes('고기')) {
          category = '한우';
        } else if (title.includes('과일') || title.includes('블루베리') || title.includes('오미자')) {
          category = '과일';
        } else if (title.includes('채소') || title.includes('나물') || title.includes('감자')) {
          category = '채소/나물';
        } else if (title.includes('쌀') || title.includes('잡곡')) {
          category = '쌀/잡곡';
        } else if (title.includes('김치') || title.includes('발효')) {
          category = '전통식품';
        }

        const productId = extractProductId(productLink.url);

        const product: Product = {
          id: productId,
          title: title,
          image: imageUrl,
          price: price,
          originalPrice: originalPrice,
          description: description.substring(0, 500),
          category: category,
          mall: '장수몰',
          url: productLink.url,
          region: '전라북도 장수군',
          tags: ['장수군', '전라북도', '장수몰', '농산물', '특산품']
        };

        // Add category-specific tags
        if (category.includes('사과')) {
          product.tags.push('사과', '과일', '장수사과');
        }
        if (category.includes('한우')) {
          product.tags.push('한우', '축산물', '고기', '장수한우');
        }
        if (category.includes('과일')) {
          product.tags.push('과일', '생과일');
        }
        if (category.includes('채소') || category.includes('나물')) {
          product.tags.push('채소', '나물');
        }
        if (category.includes('쌀') || category.includes('잡곡')) {
          product.tags.push('쌀', '잡곡', '곡물');
        }

        products.push(product);
        console.log(`✓ ${products.length}: ${title} - ₩${price}`);

      } catch (error) {
        console.error(`Error scraping product ${productLink.url}:`, error);
      }
    }

  } catch (error) {
    console.error(`Error scraping homepage:`, error);
  }

  return products;
}

async function main() {
  console.log('=== 장수몰 Quick Scraping ===');
  
  const startTime = Date.now();
  const allProducts: Product[] = [];
  const errors: string[] = [];
  let errorCount = 0;

  try {
    console.log(`\nStarting to scrape products from homepage...\n`);

    const homepageProducts = await scrapeProductsFromHomepage();
    
    if (homepageProducts.length > 0) {
      allProducts.push(...homepageProducts);
      console.log(`✓ Successfully scraped ${homepageProducts.length} products from homepage`);
    } else {
      console.log(`⚠ No products found on homepage`);
    }

    // Create summary
    const summary: ScrapeSummary = {
      timestamp: new Date().toISOString(),
      mall: '장수몰',
      totalProducts: allProducts.length,
      successCount: allProducts.length,
      errorCount,
      errors,
      sampleProducts: allProducts.slice(0, 5)
    };

    // Save products
    if (allProducts.length > 0) {
      fs.writeFileSync(
        'scripts/output/jangsu-products.json',
        JSON.stringify(allProducts, null, 2),
        'utf8'
      );
      console.log(`\n✓ Saved ${allProducts.length} products to jangsu-products.json`);
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
    console.log(`Total Products: ${allProducts.length}`);
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