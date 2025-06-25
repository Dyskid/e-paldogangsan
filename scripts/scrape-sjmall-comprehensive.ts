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

async function scrapeSjmallProducts() {
  const baseUrl = 'https://sjmall.cyso.co.kr';
  const products: Product[] = [];
  let productCount = 0;
  let errorCount = 0;

  console.log(`Starting scrape of 상주몰...`);

  try {
    // Get the homepage first to extract product links
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(homepageResponse.data);
    
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

    console.log(`Found ${productLinks.length} product links on homepage`);

    // Also try to find category or listing pages for more products
    const potentialCategoryPages = [
      'shop/list.php',
      'shop/itemlist.php',
      'shop/search.php'
    ];

    // Try some common search terms to find more products
    const searchTerms = ['상주', '곶감', '쌀', '사과', '복숭아', '한우'];
    
    for (const term of searchTerms) {
      try {
        const searchUrl = `${baseUrl}/shop/search.php?sfl=wr_subject&sop=and&q=${encodeURIComponent(term)}`;
        console.log(`Searching for: ${term}`);
        
        const searchResponse = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 20000
        });

        const searchPage = cheerio.load(searchResponse.data);
        
        searchPage('a[href*="shop/item.php?it_id="]').each((index, element) => {
          const href = searchPage(element).attr('href');
          if (href && href.includes('shop/item.php?it_id=')) {
            const cleanHref = href.split('#')[0];
            const fullUrl = cleanHref.startsWith('http') ? cleanHref : `${baseUrl}/${cleanHref}`;
            if (!productLinks.includes(fullUrl)) {
              productLinks.push(fullUrl);
            }
          }
        });

        await delay(500); // Rate limiting between searches
      } catch (error) {
        console.log(`Search failed for term: ${term}`);
      }
    }

    console.log(`Total unique product links found: ${productLinks.length}`);

    // Limit products for manageable scraping
    const limitedLinks = productLinks.slice(0, 50);
    console.log(`Scraping ${limitedLinks.length} products...`);

    // Scrape each product
    for (const productLink of limitedLinks) {
      try {
        await delay(500); // Rate limiting
        
        console.log(`Scraping product: ${productLink}`);
        
        const productResponse = await axios.get(productLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
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
          /가격\s*:\s*([\d,]+원)/g,
          /소비자가\s*:\s*([\d,]+원)/g,
          /할인가\s*:\s*([\d,]+원)/g
        ];

        for (const pattern of pricePatterns) {
          const match = bodyText.match(pattern);
          if (match && match[0]) {
            price = match[0];
            break;
          }
        }

        // Also try specific price selectors
        if (!price) {
          const priceSelectors = [
            '.it_price',
            '.price',
            '[class*="price"]',
            '.sell_price',
            '.final_price'
          ];
          
          for (const selector of priceSelectors) {
            const priceText = productPage(selector).text().trim();
            if (priceText && (priceText.includes('원') || priceText.includes(','))) {
              price = priceText;
              break;
            }
          }
        }

        // Extract image
        let image = '';
        const imageSelectors = [
          '.it_image img',
          '.product_image img',
          '.item_image img',
          '[class*="image"] img',
          'img[src*="item"]',
          'img[src*="product"]'
        ];

        for (const selector of imageSelectors) {
          const imgSrc = productPage(selector).first().attr('src');
          if (imgSrc && imgSrc.length > 0) {
            image = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
            break;
          }
        }

        // Extract product ID from URL (shop/item.php?it_id={id})
        const urlMatch = productLink.match(/it_id=([^&]+)/);
        const productId = urlMatch ? urlMatch[1] : `${productCount + 1}`;

        // Determine category from product title or description (상주 specialties)
        let category = '상주특산물';
        if (title) {
          if (title.includes('곶감')) category = '곶감';
          else if (title.includes('쌀') || title.includes('현미')) category = '쌀/곡류';
          else if (title.includes('사과')) category = '과일';
          else if (title.includes('복숭아')) category = '과일';
          else if (title.includes('한우') || title.includes('축협')) category = '축산물';
          else if (title.includes('꿀')) category = '가공식품';
          else if (title.includes('버섯')) category = '농산물';
          else if (title.includes('감자') || title.includes('당근')) category = '채소';
        }

        if (title) {
          const product: Product = {
            id: `sjmall-${productId}`,
            title: title,
            price: price || '',
            image: image,
            url: productLink,
            category: category,
            mall: '상주몰',
            mallId: 'sjmall'
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
    console.error(`Error in main scraping process:`, error);
    errorCount++;
  }

  // Save results
  const timestamp = Date.now();
  const outputFile = `./scripts/output/sjmall-products.json`;
  
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));

  // Create summary
  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summary = {
    timestamp,
    totalProducts: products.length,
    totalErrors: errorCount,
    categoryCounts: Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    })),
    productsWithPrices: products.filter(p => p.price).length,
    productsWithImages: products.filter(p => p.image).length,
    sampleProducts: products.slice(0, 5)
  };

  const summaryFile = `./scripts/output/sjmall-scrape-summary.json`;
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
  scrapeSjmallProducts().catch(console.error);
}

export { scrapeSjmallProducts };