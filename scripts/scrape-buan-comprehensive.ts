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

async function scrapeBuanMall() {
  const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
  const results: Product[] = [];
  const errors: string[] = [];
  
  // Category pages to scrape - based on analysis
  const categories = [
    { name: '쌀/잡곡', id: '1010' },
    { name: '과일/채소류', id: '1020' },
    { name: '수산물', id: '1030' },
    { name: '가공식품', id: '1040' },
    { name: '선물세트', id: '1050' },
    { name: '축산물', id: '1060' },
    { name: '할매반찬', id: '1070' },
    { name: '기타식품', id: '1080' }
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
        const categoryUrl = `${baseUrl}/board/shop/list.php?ca_id=${category.id}&page=${page}`;
        
        try {
          const response = await axios.get(categoryUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
          });
          
          const $ = cheerio.load(response.data);
          
          // Look for product links - pattern: ../shop/item.php?it_id=...
          const productLinks = $('a[href*="item.php?it_id="]');
          
          if (productLinks.length === 0) {
            hasMorePages = false;
            break;
          }
          
          productLinks.each((_, element) => {
            let href = $(element).attr('href');
            if (href) {
              // Convert relative URLs to absolute URLs
              if (href.startsWith('../shop/')) {
                href = `${baseUrl}/board${href.substring(2)}`;
              } else if (href.startsWith('./')) {
                href = `${baseUrl}/board/shop${href.substring(1)}`;
              } else if (!href.startsWith('http')) {
                href = `${baseUrl}${href}`;
              }
              
              // Convert item.php to item2.php since item.php redirects
              href = href.replace('/item.php?', '/item2.php?');
              
              allProductUrls.add(href);
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
  
  console.log(`\nTotal unique product URLs found: ${allProductUrls.size}`);
  
  // Now scrape each product
  const productUrlsArray = Array.from(allProductUrls);
  let successCount = 0;
  
  for (let i = 0; i < productUrlsArray.length; i++) {
    const url = productUrlsArray[i];
    
    try {
      // Extract product ID from URL
      const match = url.match(/it_id=(\d+)/);
      if (!match) {
        console.log(`Skipping URL without it_id: ${url}`);
        continue;
      }
      
      const productId = match[1];
      
      console.log(`\n[${i + 1}/${productUrlsArray.length}] Scraping product ${productId}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract title - from h1 in shopview section
      let title = $('h1').first().text().trim();
      
      // Fallback to page title
      if (!title) {
        const pageTitle = $('title').text().trim();
        if (pageTitle && pageTitle !== '텃밭할매') {
          title = pageTitle.split(' < ')[0].trim();
        }
      }
      
      // Extract price - look for the price in the table
      let price = '';
      
      // Try to find price from the shop_view_list table
      const priceElement = $('.shop_view_list .mem_won');
      if (priceElement.length > 0) {
        price = priceElement.text().trim();
      }
      
      // Fallback to any element containing 원
      if (!price) {
        $('*').each((_, element) => {
          const text = $(element).text().trim();
          if (text.match(/^\d{1,3}(,\d{3})*원$/) && !price) {
            price = text;
          }
        });
      }
      
      // Extract image - look for product image in shop_view_img
      let image = '';
      const imgElement = $('.shop_view_img img[src*="data/shop/item"]').first();
      if (imgElement.length > 0) {
        image = imgElement.attr('src') || '';
        if (image && !image.startsWith('http')) {
          // Handle relative paths
          if (image.startsWith('../../')) {
            image = `${baseUrl}/${image.substring(6)}`;
          } else if (image.startsWith('./')) {
            image = `${baseUrl}/board/shop${image.substring(1)}`;
          } else if (!image.startsWith('/')) {
            image = `${baseUrl}/${image}`;
          } else {
            image = `${baseUrl}${image}`;
          }
        }
      }
      
      // Extract category from breadcrumb or URL pattern
      let category = '';
      const breadcrumbElement = $('.path strong');
      if (breadcrumbElement.length > 0) {
        category = breadcrumbElement.text().trim();
      }
      
      // Fallback to category from URL or known categories
      if (!category) {
        const categoryMatch = url.match(/ca_id=(\d+)/);
        if (categoryMatch) {
          const categoryMap: { [key: string]: string } = {
            '1010': '쌀/잡곡',
            '1020': '과일/채소류',
            '1030': '수산물',
            '1040': '가공식품',
            '1050': '선물세트',
            '1060': '축산물',
            '1070': '할매반찬',
            '1080': '기타식품'
          };
          category = categoryMap[categoryMatch[1]] || '';
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    `./scripts/output/buan-products.json`,
    JSON.stringify(results, null, 2)
  );
  
  const summary = {
    timestamp,
    mall: '부안 텃밭할매',
    url: baseUrl,
    totalFound: allProductUrls.size,
    totalScraped: successCount,
    errors: errors.length,
    errorDetails: errors,
    sampleProducts: results.slice(0, 3)
  };
  
  fs.writeFileSync(
    `./scripts/output/buan-scrape-summary.json`,
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`Results saved to buan-products.json`);
  
  return results;
}

scrapeBuanMall().catch(console.error);