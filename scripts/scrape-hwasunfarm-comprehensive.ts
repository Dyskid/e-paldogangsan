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

async function scrapeHwasunfarmProducts() {
  const baseUrl = 'https://www.hwasunfarm.com';
  const products: Product[] = [];
  let productCount = 0;
  let errorCount = 0;

  // Category URLs with their names based on the analysis
  const categories = [
    { name: '농산물', url: 'kwa-ABS_goods_l-1003' },
    { name: '축산물', url: 'kwa-ABS_goods_l-1004' },
    { name: '화순쌀', url: 'kwa-ABS_goods_l-1002' },
    { name: '수산물', url: 'kwa-ABS_goods_l-1005' },
    { name: '가공상품', url: 'kwa-ABS_goods_l-1006' },
    { name: '설레는 날', url: 'kwa-ABS_goods_l-1009' },
    { name: '기타제품', url: 'kwa-ABS_goods_l-1011' },
    { name: '화훼류', url: 'kwa-ABS_goods_l-1013' },
    { name: '로컬푸드', url: 'kwa-ABS_goods_l-1010' },
    { name: '상생 마켓', url: 'kwa-ABS_goods_l-1016' }
  ];

  console.log(`Starting scrape of 화순팜 with ${categories.length} categories...`);

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

      // Scrape each product
      for (const productLink of productLinks) {
        try {
          await delay(1000); // Rate limiting
          
          const fullUrl = productLink.startsWith('http') ? productLink : `${baseUrl}/${productLink}`;
          console.log(`Scraping product: ${fullUrl}`);
          
          const productResponse = await axios.get(fullUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
          });

          const productPage = cheerio.load(productResponse.data);
          
          // Extract product details
          const title = productPage('h1').first().text().trim() || 
                       productPage('title').text().trim() ||
                       productPage('.goods_name').text().trim() ||
                       productPage('[class*="title"]').first().text().trim() ||
                       productPage('[class*="name"]').first().text().trim();

          // Extract price with multiple selectors
          let price = '';
          
          // Try different price selectors
          const priceSelectors = [
            '.price',
            '[class*="price"]',
            '.goods_price',
            '.sale_price',
            '.final_price',
            '.current_price'
          ];

          for (const selector of priceSelectors) {
            const priceText = productPage(selector).text().trim();
            if (priceText && (priceText.includes('원') || priceText.includes(','))) {
              price = priceText;
              break;
            }
          }

          // If no structured price found, search in text content
          if (!price) {
            const pageText = productPage('body').text();
            const priceMatch = pageText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
            if (priceMatch) {
              price = priceMatch[0];
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
          const productId = urlMatch ? urlMatch[1] : `hwasunfarm-${productCount + 1}`;

          if (title) {
            const product: Product = {
              id: `hwasunfarm-${productId}`,
              title: title,
              price: price || '',
              image: image,
              url: fullUrl,
              category: category.name,
              mall: '화순팜',
              mallId: 'hwasunfarm'
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
  const outputFile = `./scripts/output/hwasunfarm-products.json`;
  
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

  const summaryFile = `./scripts/output/hwasunfarm-scrape-summary.json`;
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
  scrapeHwasunfarmProducts().catch(console.error);
}

export { scrapeHwasunfarmProducts };