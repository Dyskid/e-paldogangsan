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

async function scrapeEHongseongMallQuick() {
  const baseUrl = 'https://ehongseong.com';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Get products from homepage first for a quick sample
  console.log('Getting products from homepage...');
  let allProductUrls = new Set<string>();
  
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
    
    console.log(`Homepage: Found ${homeProductLinks.length} products`);
    
  } catch (error) {
    console.error('Error scraping homepage:', error.message);
  }
  
  // Add a few category pages for diversity
  const quickCategories = [
    { name: '농산물', code: 'xcode=002&type=Y' },
    { name: '축산', code: 'xcode=009&type=Y' },
    { name: '특산품', code: 'xcode=010&type=Y' }
  ];
  
  for (const category of quickCategories) {
    try {
      console.log(`Getting products from ${category.name} category...`);
      
      const categoryUrl = `${baseUrl}/shop/shopbrand.html?${category.code}&page=1`;
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const productLinks = $('a[href*="shopdetail.html?branduid="]');
      
      productLinks.each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          allProductUrls.add(fullUrl);
        }
      });
      
      console.log(`  ${category.name}: Found ${productLinks.length} products`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error with category ${category.name}: ${error.message}`);
    }
  }
  
  console.log(`\nTotal unique product URLs found: ${allProductUrls.size}`);
  
  // Limit to first 100 products for quick scraping
  const productUrlsArray = Array.from(allProductUrls).slice(0, 100);
  let successCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < productUrlsArray.length; i++) {
    const url = productUrlsArray[i];
    
    try {
      // Extract product ID from URL
      const match = url.match(/branduid=(\d+)/);
      if (!match) {
        continue;
      }
      
      const productId = match[1];
      console.log(`[${i + 1}/${productUrlsArray.length}] Scraping product ${productId}...`);
      
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
      
      // Extract title from page title
      let title = '';
      const pageTitle = $('title').text().trim();
      if (pageTitle && pageTitle !== 'e홍성장터') {
        title = pageTitle.replace(/^\[|\]$/g, ''); // Remove surrounding brackets
      }
      
      // Fallback to script variable
      if (!title) {
        const scriptContent = response.data;
        const nameMatch = scriptContent.match(/var product_name = '([^']+)'/);
        if (nameMatch) {
          title = nameMatch[1];
        }
      }
      
      // Extract price from hidden input
      let price = '';
      const priceInput = $('input#price').attr('value');
      if (priceInput) {
        price = priceInput.includes('원') ? priceInput : priceInput + '원';
      }
      
      // Fallback to script variable
      if (!price) {
        const scriptContent = response.data;
        const priceMatch = scriptContent.match(/var product_price = '(\d+)'/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]).toLocaleString() + '원';
        }
      }
      
      // Extract image
      let image = '';
      const imgElement = $('img[src*="shopimages"]').first();
      if (imgElement.length > 0) {
        image = imgElement.attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = baseUrl + image;
        }
      }
      
      // Extract category from breadcrumb
      let category = '';
      const breadcrumb = $('.loc-navi').text().trim();
      if (breadcrumb) {
        const parts = breadcrumb.split('>').map(p => p.trim()).filter(p => p && p !== 'HOME');
        if (parts.length > 0) {
          category = parts[0];
        }
      }
      
      // Validate that we have essential data
      if (!title || !price) {
        console.log(`  Skipping: Missing title or price`);
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
      
      console.log(`  ✓ ${title} - ${price}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      errors.push(`${url}: ${error.message}`);
    }
  }
  
  console.log(`\n=== QUICK SCRAPING SUMMARY ===`);
  console.log(`Successfully scraped: ${successCount}`);
  console.log(`Skipped (adult verification): ${skipCount}`);
  console.log(`Errors: ${errors.length}`);
  
  // Save results
  fs.writeFileSync(
    `./scripts/output/ehongseong-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp: Date.now(),
    mall: 'e홍성장터',
    url: baseUrl,
    totalScraped: successCount,
    skippedAdult: skipCount,
    errors: errors.length,
    sampleProducts: results.slice(0, 5)
  };
  
  fs.writeFileSync(
    `./scripts/output/ehongseong-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to ehongseong-products.json`);
  
  return results;
}

scrapeEHongseongMallQuick().catch(console.error);