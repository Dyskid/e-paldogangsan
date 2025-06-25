import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallId: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeGokseongmallProductsQuick() {
  const baseUrl = 'https://gokseongmall.com';
  const products: Product[] = [];
  let productCount = 0;
  let errorCount = 0;

  // Focus on main categories for quicker completion
  const categories = [
    { name: '농산물', url: 'kwa-ABS_goods_l-1003' },
    { name: '축수산물', url: 'kwa-ABS_goods_l-1006' },
    { name: '가공식품', url: 'kwa-ABS_goods_l-1007' },
    { name: '생활', url: 'kwa-ABS_goods_l-1009' },
    { name: '베스트상품', url: 'kwa-ABS_goods_l-1004' }
  ];

  console.log(`Starting quick scrape of 곡성몰 with ${categories.length} categories...`);

  for (const category of categories) {
    console.log(`\nScraping category: ${category.name} (${category.url})`);
    
    try {
      // Get category page
      const categoryResponse = await axios.get(`${baseUrl}/${category.url}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(categoryResponse.data);
      
      // Look for product links with pattern kwa-ABS_goods_v-{id}-{category}
      const productLinks: string[] = [];
      
      $('a[href*="kwa-ABS_goods_v-"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('kwa-ABS_goods_v-')) {
          // Clean the URL and ensure it doesn't have query params for deduplication
          const cleanHref = href.split('?')[0];
          if (!productLinks.includes(cleanHref)) {
            productLinks.push(cleanHref);
          }
        }
      });

      console.log(`Found ${productLinks.length} product links in ${category.name}`);

      // Limit to first 10 products per category for speed
      const limitedLinks = productLinks.slice(0, 10);

      // Scrape each product
      for (const productLink of limitedLinks) {
        try {
          await delay(300); // Faster rate limiting
          
          const fullUrl = productLink.startsWith('http') ? productLink : `${baseUrl}/${productLink}`;
          console.log(`Scraping product: ${fullUrl}`);
          
          const productResponse = await axios.get(fullUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // Shorter timeout
          });

          const productPage = cheerio.load(productResponse.data);
          
          // Extract product details
          const title = productPage('h1').first().text().trim() || 
                       productPage('title').text().trim() ||
                       productPage('.goods_name').text().trim() ||
                       productPage('[class*="title"]').first().text().trim() ||
                       productPage('[class*="name"]').first().text().trim();

          // Extract price - look for Korean won amounts
          let price = '';
          const bodyText = productPage('body').text();
          
          // Look for price patterns in Korean text
          const pricePatterns = [
            /(\d{1,3}(?:,\d{3})*)\s*원/g,
            /판매가\s*:\s*([\d,]+원)/g,
            /가격\s*:\s*([\d,]+원)/g
          ];

          for (const pattern of pricePatterns) {
            const match = bodyText.match(pattern);
            if (match && match[0]) {
              price = match[0];
              break;
            }
          }

          // Extract image
          let image = '';
          const imageSelectors = [
            '.goods_image img',
            '.product_image img',
            '.main_image img',
            '[class*="image"] img',
            'img[src*="goods"]'
          ];

          for (const selector of imageSelectors) {
            const imgSrc = productPage(selector).first().attr('src');
            if (imgSrc) {
              image = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
              break;
            }
          }

          // Extract product ID from URL (kwa-ABS_goods_v-{id}-{category})
          const urlMatch = productLink.match(/kwa-ABS_goods_v-(\d+)-/);
          const productId = urlMatch ? urlMatch[1] : `${productCount + 1}`;

          if (title) {
            const product: Product = {
              id: `gokseongmall-${productId}`,
              title: title,
              price: price || '',
              image: image,
              url: fullUrl,
              category: category.name,
              mall: '곡성몰',
              mallId: 'gokseongmall'
            };

            products.push(product);
            productCount++;
            console.log(`✓ Product ${productCount}: ${title} - ${price}`);
          } else {
            console.log(`✗ Could not extract title for ${fullUrl}`);
            errorCount++;
          }

        } catch (error) {
          console.error(`Error scraping product ${productLink}:`, error);
          errorCount++;
        }
      }

    } catch (error) {
      console.error(`Error scraping category ${category.name}:`, error);
      errorCount++;
    }
  }

  // Save results
  const timestamp = Date.now();
  const outputFile = `./scripts/output/gokseongmall-products.json`;
  
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));

  // Create summary
  const summary = {
    timestamp,
    totalProducts: products.length,
    totalErrors: errorCount,
    categoryCounts: categories.map(cat => ({
      category: cat.name,
      count: products.filter(p => p.category === cat.name).length
    })),
    productsWithPrices: products.filter(p => p.price).length,
    productsWithImages: products.filter(p => p.image).length,
    sampleProducts: products.slice(0, 5)
  };

  const summaryFile = `./scripts/output/gokseongmall-scrape-summary.json`;
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  console.log(`\n=== SCRAPING SUMMARY ===`);
  console.log(`Total products scraped: ${products.length}`);
  console.log(`Products with prices: ${summary.productsWithPrices}`);
  console.log(`Products with images: ${summary.productsWithImages}`);
  console.log(`Total errors: ${errorCount}`);
  console.log(`\nResults saved to:`);
  console.log(`- Products: ${outputFile}`);
  console.log(`- Summary: ${summaryFile}`);

  return products;
}

if (require.main === module) {
  scrapeGokseongmallProductsQuick().catch(console.error);
}

export { scrapeGokseongmallProductsQuick };