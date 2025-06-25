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

async function scrapeEHongseongMall() {
  const baseUrl = 'https://ehongseong.com';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Category pages to scrape
  const categories = [
    { name: '친환경', code: 'xcode=007&type=Y' },
    { name: '축산', code: 'xcode=009&type=Y' },
    { name: '농산물', code: 'xcode=002&type=Y' },
    { name: '가공품', code: 'xcode=002&mcode=003&type=Y' },
    { name: '특산품', code: 'xcode=010&type=Y' },
    { name: '수산물', code: 'xcode=011&type=Y' },
    { name: '선물세트', code: 'xcode=004&type=Y' },
    { name: '홍성한우', code: 'xcode=001&type=Y' },
    { name: '홍성한돈', code: 'xcode=003&type=Y' },
    { name: '홍성쌀', code: 'xcode=005&type=Y' },
    { name: '홍주', code: 'xcode=006&type=Y' }
  ];
  
  // First collect all product URLs from category pages
  const allProductUrls = new Set<string>();
  
  console.log('Collecting product URLs from category pages...');
  
  for (const category of categories) {
    try {
      console.log(`Checking category: ${category.name}`);
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= 10) { // Limit to 10 pages per category
        const categoryUrl = `${baseUrl}/shop/shopbrand.html?${category.code}&page=${page}`;
        
        try {
          const response = await axios.get(categoryUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
          });
          
          const $ = cheerio.load(response.data);
          
          // Look for product links
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
    const homeResponse = await axios.get(baseUrl, {
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
  let skipCount = 0;
  
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
      
      // Check for adult verification redirect
      if (response.data.includes('성인인증이 필요합니다') || response.data.includes('adult.html')) {
        console.log(`  Skipping: Adult verification required`);
        skipCount++;
        continue;
      }
      
      const $ = cheerio.load(response.data);
      
      // Extract title from multiple possible locations
      let title = '';
      
      // Try page title first (most reliable)
      const pageTitle = $('title').text().trim();
      if (pageTitle && pageTitle !== 'e홍성장터') {
        title = pageTitle.replace(/^\[|\]$/g, ''); // Remove surrounding brackets
      }
      
      // Try product name from script
      if (!title) {
        const scriptContent = response.data;
        const nameMatch = scriptContent.match(/var product_name = '([^']+)'/);
        if (nameMatch) {
          title = nameMatch[1];
        }
      }
      
      // Try h3.tit-prd
      if (!title) {
        title = $('h3.tit-prd').text().trim();
      }
      
      // Extract price
      let price = '';
      
      // Try hidden input price
      const priceInput = $('input#price').attr('value');
      if (priceInput && priceInput.includes('원')) {
        price = priceInput;
      } else if (priceInput) {
        price = priceInput + '원';
      }
      
      // Try visible price display
      if (!price) {
        const priceElement = $('#pricevalue, .price').first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          if (priceText) {
            price = priceText.includes('원') ? priceText : priceText + '원';
          }
        }
      }
      
      // Try script variable
      if (!price) {
        const scriptContent = response.data;
        const priceMatch = scriptContent.match(/var product_price = '(\d+)'/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]).toLocaleString() + '원';
        }
      }
      
      // Extract image
      let image = '';
      
      // Look for shopimages
      const imgElement = $('img[src*="shopimages"]').first();
      if (imgElement.length > 0) {
        image = imgElement.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = baseUrl + image;
        }
      }
      
      // Extract category from breadcrumb or URL
      let category = '';
      const breadcrumb = $('.loc-navi').text().trim();
      if (breadcrumb) {
        const parts = breadcrumb.split('>').map(p => p.trim()).filter(p => p && p !== 'HOME');
        if (parts.length > 0) {
          category = parts[0];
        }
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
  console.log(`Skipped (adult verification): ${skipCount}`);
  console.log(`Errors: ${errors.length}`);
  
  // Save results
  const timestamp = Date.now();
  fs.writeFileSync(
    `./scripts/output/ehongseong-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp,
    mall: 'e홍성장터',
    url: baseUrl,
    totalFound: allProductUrls.size,
    totalScraped: successCount,
    skippedAdult: skipCount,
    errors: errors.length,
    errorDetails: errors,
    sampleProducts: results.slice(0, 3)
  };
  
  fs.writeFileSync(
    `./scripts/output/ehongseong-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to ehongseong-products.json`);
  
  return results;
}

scrapeEHongseongMall().catch(console.error);