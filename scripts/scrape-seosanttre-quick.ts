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

async function scrapeSeosanttreQuick() {
  const baseUrl = 'https://seosanttre.com';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Get products from homepage first
  console.log('Getting products from homepage...');
  let allProductUrls = new Set<string>();
  
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
    
    console.log(`Homepage: Found ${homeProductLinks.length} products`);
    
  } catch (error) {
    console.error('Error scraping homepage:', error.message);
  }
  
  // Add a few key category pages for diversity
  const quickCategories = [
    { name: '쌀/잡곡', code: 'xcode=001&type=X' },
    { name: '축산물', code: 'xcode=003&type=X' },
    { name: '김치/반찬', code: 'xcode=006&type=X' },
    { name: '수산물', code: 'xcode=011&type=X' }
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
      
      const $ = cheerio.load(response.data);
      
      // Extract title from page title
      let title = '';
      const pageTitle = $('title').text().trim();
      if (pageTitle) {
        title = pageTitle.replace(/^\[|\]$/g, '');
      }
      
      // Fallback to script variable
      if (!title) {
        const scriptContent = response.data;
        const nameMatch = scriptContent.match(/product_name\s*=\s*['"]([^'"]+)['"]/);
        if (nameMatch) {
          title = nameMatch[1];
        }
      }
      
      // Extract price from script
      let price = '';
      const scriptContent = response.data;
      const priceMatch = scriptContent.match(/product_price\s*=\s*['"](\d+)['"]/);
      if (priceMatch) {
        price = parseInt(priceMatch[1]).toLocaleString() + '원';
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
      
      // Extract category from URL
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
      
      // Validate essential data
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
  console.log(`Errors: ${errors.length}`);
  
  // Save results
  fs.writeFileSync(
    `./scripts/output/seosanttre-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp: Date.now(),
    mall: '서산뜨레',
    url: baseUrl,
    totalScraped: successCount,
    errors: errors.length,
    sampleProducts: results.slice(0, 5)
  };
  
  fs.writeFileSync(
    `./scripts/output/seosanttre-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to seosanttre-products.json`);
  
  return results;
}

scrapeSeosanttreQuick().catch(console.error);