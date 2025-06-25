import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  url: string;
  price: string;
  image: string;
  category?: string;
}

async function scrapeSeosanttreMall() {
  const baseUrl = 'https://seosanttre.com';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Category pages to scrape (MakeShop format)
  const categories = [
    { name: '쌀/잡곡', code: 'xcode=001&type=X' },
    { name: '과일/채소', code: 'xcode=002&type=X' },
    { name: '축산물', code: 'xcode=003&type=X' },
    { name: '가공식품', code: 'xcode=004&type=X' },
    { name: '건강식품', code: 'xcode=005&type=X' },
    { name: '김치/반찬', code: 'xcode=006&type=X' },
    { name: '선물세트', code: 'xcode=007&type=X' },
    { name: '전통주/음료', code: 'xcode=008&type=X' },
    { name: '제과/제빵', code: 'xcode=009&type=X' },
    { name: '차/음료', code: 'xcode=010&type=X' },
    { name: '수산물', code: 'xcode=011&type=X' }
  ];
  
  // First collect all product URLs from category pages
  const allProductUrls = new Set<string>();
  
  console.log('Collecting product URLs from category pages...');
  
  for (const category of categories) {
    try {
      console.log(`Checking category: ${category.name}`);
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= 5) { // Limit to 5 pages per category for initial scraping
        const categoryUrl = `${baseUrl}/shop/shopbrand.html?${category.code}&page=${page}`;
        
        try {
          const response = await axios.get(categoryUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
          });
          
          const $ = cheerio.load(response.data);
          
          // Look for product links in MakeShop format
          const productLinks = $('a[href*="shopdetail.html?branduid="]');
          
          if (productLinks.length === 0) {
            hasMorePages = false;
            break;
          }
          
          productLinks.each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
              allProductUrls.add(fullUrl);
            }
          });
          
          console.log(`  Page ${page}: Found ${productLinks.length} products`);
          page++;
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`  Error on page ${page}: ${error.message}`);
          hasMorePages = false;
        }
      }
      
    } catch (error) {
      console.error(`Error with category ${category.name}: ${error.message}`);
    }
  }
  
  // Also get products from homepage
  console.log('Getting products from homepage...');
  try {
    const homeResponse = await axios.get(`${baseUrl}/index.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(homeResponse.data);
    const homeProductLinks = $('a[href*="shopdetail.html?branduid="]');
    
    homeProductLinks.each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
        allProductUrls.add(fullUrl);
      }
    });
    
    console.log(`Homepage: Found ${homeProductLinks.length} additional products`);
    
  } catch (error) {
    console.error('Error scraping homepage:', error.message);
  }
  
  console.log(`\nTotal unique product URLs found: ${allProductUrls.size}`);
  
  // Now scrape each product
  const productUrlsArray = Array.from(allProductUrls);
  let successCount = 0;
  
  for (let i = 0; i < productUrlsArray.length; i++) {
    const url = productUrlsArray[i];
    
    try {
      // Extract product ID from URL
      const match = url.match(/branduid=(\d+)/);
      if (!match) {
        console.log(`Skipping URL without branduid: ${url}`);
        continue;
      }
      
      const productId = match[1];
      
      console.log(`\n[${i + 1}/${productUrlsArray.length}] Scraping product ${productId}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract title - MakeShop patterns
      let title = '';
      
      // Try page title first
      const pageTitle = $('title').text().trim();
      if (pageTitle) {
        title = pageTitle.replace(/^\[|\]$/g, ''); // Remove surrounding brackets
      }
      
      // Try script variable
      if (!title) {
        const scriptContent = response.data;
        const nameMatch = scriptContent.match(/product_name\s*=\s*['"]([^'"]+)['"]/);
        if (nameMatch) {
          title = nameMatch[1];
        }
      }
      
      // Try common selectors
      if (!title) {
        title = $('.board-title').text().trim() || 
                $('.prd-title').text().trim() || 
                $('.prd_title').text().trim();
      }
      
      // Extract price
      let price = '';
      
      // Try script variable first (most reliable)
      const scriptContent = response.data;
      const priceMatch = scriptContent.match(/product_price\s*=\s*['"](\d+)['"]/);
      if (priceMatch) {
        price = parseInt(priceMatch[1]).toLocaleString() + '원';
      }
      
      // Try visible price elements
      if (!price) {
        const priceElement = $('.sale_price, .prd-price, .price').first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          if (priceText) {
            price = priceText.includes('원') ? priceText : priceText + '원';
          }
        }
      }
      
      // Extract image
      let image = '';
      
      // Look for product images
      const imgElement = $('.prd-thumb img, .board-thumb img, img[src*="shopimages"]').first();
      if (imgElement.length > 0) {
        image = imgElement.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = baseUrl + image;
        }
      }
      
      // Extract category from URL parameters
      let category = '';
      const xcodeMatch = url.match(/xcode=(\d+)/);
      if (xcodeMatch) {
        const xcode = xcodeMatch[1];
        const categoryMap: { [key: string]: string } = {
          '001': '쌀/잡곡',
          '002': '과일/채소',
          '003': '축산물',
          '004': '가공식품',
          '005': '건강식품',
          '006': '김치/반찬',
          '007': '선물세트',
          '008': '전통주/음료',
          '009': '제과/제빵',
          '010': '차/음료',
          '011': '수산물'
        };
        category = categoryMap[xcode] || '';
      }
      
      // Validate that we have essential data
      if (!title) {
        console.log(`  Skipping: No title found`);
        errors.push(`${productId}: No title`);
        continue;
      }
      
      if (!price) {
        console.log(`  Skipping: No price found`);
        errors.push(`${productId}: No price`);
        continue;
      }
      
      const product: Product = {
        id: productId,
        title: title,
        url: url,
        price: price,
        image: image,
        category: category
      };
      
      results.push(product);
      successCount++;
      
      console.log(`  ✓ Success: ${title} - ${price}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      errors.push(`${url}: ${error.message}`);
    }
  }
  
  console.log(`\n=== SCRAPING SUMMARY ===`);
  console.log(`Total URLs found: ${allProductUrls.size}`);
  console.log(`Successfully scraped: ${successCount}`);
  console.log(`Errors: ${errors.length}`);
  
  // Save results
  const timestamp = Date.now();
  fs.writeFileSync(
    `./scripts/output/seosanttre-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp,
    mall: '서산뜨레',
    url: baseUrl,
    totalFound: allProductUrls.size,
    totalScraped: successCount,
    errors: errors.length,
    errorDetails: errors,
    sampleProducts: results.slice(0, 3)
  };
  
  fs.writeFileSync(
    `./scripts/output/seosanttre-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to seosanttre-products.json`);
  
  return results;
}

scrapeSeosanttreMall().catch(console.error);