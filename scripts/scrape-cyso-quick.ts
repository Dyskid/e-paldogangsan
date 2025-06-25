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

async function scrapeCysoProductsQuick() {
  const baseUrl = 'https://www.cyso.co.kr';
  const products: Product[] = [];
  let productCount = 0;
  let errorCount = 0;

  // Focus on main categories for quicker completion
  const categories = [
    { name: '쌀/잡곡', url: 'shop/list.php?ca_id=10' },
    { name: '과일류', url: 'shop/list.php?ca_id=20' },
    { name: '채소류', url: 'shop/list.php?ca_id=30' },
    { name: '축산물', url: 'shop/list.php?ca_id=40' },
    { name: '가공식품', url: 'shop/list.php?ca_id=60' }
  ];

  console.log(`Starting quick scrape of 사이소(경북몰) with ${categories.length} categories...`);

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
      
      // Look for product links with pattern shop/item.php?it_id=
      const productLinks: string[] = [];
      
      $('a[href*="shop/item.php?it_id="]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('shop/item.php?it_id=')) {
          // Clean the URL and ensure it doesn't have anchor fragments for deduplication
          const cleanHref = href.split('#')[0];
          const fullUrl = cleanHref.startsWith('http') ? cleanHref : `${baseUrl}/${cleanHref}`;
          if (!productLinks.includes(fullUrl)) {
            productLinks.push(fullUrl);
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
          
          console.log(`Scraping product: ${productLink}`);
          
          const productResponse = await axios.get(productLink, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // Shorter timeout
          });

          const productPage = cheerio.load(productResponse.data);
          
          // Extract product details
          const title = productPage('h1').first().text().trim() || 
                       productPage('title').text().trim() ||
                       productPage('.it_name').text().trim() ||
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
            '.it_image img',
            '.product_image img',
            '.item_image img',
            '[class*="image"] img',
            'img[src*="item"]'
          ];

          for (const selector of imageSelectors) {
            const imgSrc = productPage(selector).first().attr('src');
            if (imgSrc) {
              image = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
              break;
            }
          }

          // Extract product ID from URL (shop/item.php?it_id={id})
          const urlMatch = productLink.match(/it_id=([^&]+)/);
          const productId = urlMatch ? urlMatch[1] : `${productCount + 1}`;

          if (title) {
            const product: Product = {
              id: `cyso-${productId}`,
              title: title,
              price: price || '',
              image: image,
              url: productLink,
              category: category.name,
              mall: '사이소(경북몰)',
              mallId: 'cyso'
            };

            products.push(product);
            productCount++;
            console.log(`✓ Product ${productCount}: ${title} - ${price}`);
          } else {
            console.log(`✗ Could not extract title for ${productLink}`);
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
  const outputFile = `./scripts/output/cyso-products.json`;
  
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

  const summaryFile = `./scripts/output/cyso-scrape-summary.json`;
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
  scrapeCysoProductsQuick().catch(console.error);
}

export { scrapeCysoProductsQuick };