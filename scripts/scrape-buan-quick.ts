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

async function scrapeBuanQuick() {
  const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Select key categories for quick scraping
  const quickCategories = [
    { name: '쌀/잡곡', id: '1010' },
    { name: '과일/채소류', id: '1020' },
    { name: '가공식품', id: '1040' },
    { name: '선물세트', id: '1050' }
  ];
  
  // Collect product URLs from first page of each category
  const allProductUrls = new Map<string, string>(); // id -> url to prevent duplicates
  
  console.log('Collecting product URLs from category pages...');
  
  for (const category of quickCategories) {
    try {
      console.log(`Getting products from ${category.name} category...`);
      
      const categoryUrl = `${baseUrl}/board/shop/list.php?ca_id=${category.id}&page=1`;
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const productLinks = $('a[href*="item.php?it_id="]');
      
      productLinks.each((_, element) => {
        let href = $(element).attr('href');
        if (href) {
          // Extract product ID
          const match = href.match(/it_id=(\d+)/);
          if (match) {
            const productId = match[1];
            
            // Convert to item2.php URL format
            if (href.startsWith('../shop/')) {
              href = `${baseUrl}/board${href.substring(2)}`;
            }
            href = href.replace('/item.php?', '/item2.php?');
            
            allProductUrls.set(productId, href);
          }
        }
      });
      
      console.log(`  ${category.name}: Found ${productLinks.length} products`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error with category ${category.name}: ${error.message}`);
    }
  }
  
  console.log(`\nTotal unique product URLs found: ${allProductUrls.size}`);
  
  // Limit to first 80 products for quick scraping
  const productEntries = Array.from(allProductUrls.entries()).slice(0, 80);
  let successCount = 0;
  
  for (let i = 0; i < productEntries.length; i++) {
    const [productId, url] = productEntries[i];
    
    try {
      console.log(`[${i + 1}/${productEntries.length}] Scraping product ${productId}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract title from h1
      let title = $('h1').first().text().trim();
      
      // Fallback to page title
      if (!title) {
        const pageTitle = $('title').text().trim();
        if (pageTitle && pageTitle !== '텃밭할매') {
          title = pageTitle.split(' < ')[0].trim();
        }
      }
      
      // Extract price from shop_view_list table
      let price = '';
      const priceElement = $('.shop_view_list .mem_won');
      if (priceElement.length > 0) {
        price = priceElement.text().trim();
      }
      
      // Extract image
      let image = '';
      const imgElement = $('.shop_view_img img[src*="data/shop/item"]').first();
      if (imgElement.length > 0) {
        image = imgElement.attr('src') || '';
        if (image && !image.startsWith('http')) {
          if (image.startsWith('../../')) {
            image = `${baseUrl}/${image.substring(6)}`;
          } else {
            image = `${baseUrl}${image}`;
          }
        }
      }
      
      // Extract category from breadcrumb
      let category = '';
      const breadcrumbElement = $('.path strong');
      if (breadcrumbElement.length > 0) {
        category = breadcrumbElement.text().trim();
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
      await new Promise(resolve => setTimeout(resolve, 600));
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      errors.push(`${url}: ${error.message}`);
    }
  }
  
  console.log(`\n=== QUICK SCRAPING SUMMARY ===`);
  console.log(`Total unique URLs found: ${allProductUrls.size}`);
  console.log(`Successfully scraped: ${successCount}`);
  console.log(`Errors: ${errors.length}`);
  
  // Save results
  fs.writeFileSync(
    `./scripts/output/buan-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp: Date.now(),
    mall: '부안 텃밭할매',
    url: baseUrl,
    totalFound: allProductUrls.size,
    totalScraped: successCount,
    errors: errors.length,
    sampleProducts: results.slice(0, 5)
  };
  
  fs.writeFileSync(
    `./scripts/output/buan-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to buan-products.json`);
  
  return results;
}

scrapeBuanQuick().catch(console.error);