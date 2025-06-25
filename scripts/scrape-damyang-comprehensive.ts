import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

interface Product {
  name: string;
  price: string;
  image: string;
  link: string;
  mall: string;
  category?: string;
}

async function scrapeDamyangProducts() {
  const baseUrl = 'https://damyangmk.kr';
  const products: Product[] = [];
  const scrapedUrls = new Set<string>();
  
  // Categories from the structure analysis
  const categories = [
    { name: '신선식품', url: '/product/list.html?cate_no=26' },
    { name: '가공식품', url: '/product/list.html?cate_no=28' },
    { name: '전통식품', url: '/product/list.html?cate_no=87' },
    { name: '인기상품', url: '/product/list.html?cate_no=99' },
    { name: '전체상품', url: '/product/list.html?cate_no=62' }
  ];
  
  try {
    console.log('Starting 담양장터 product scraping...');
    
    for (const category of categories) {
      console.log(`\nProcessing category: ${category.name}`);
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= 10) { // Limit to 10 pages per category
        try {
          const categoryUrl = `${baseUrl}${category.url}&page=${page}`;
          console.log(`Fetching page ${page}: ${categoryUrl}`);
          
          const response = await axios.get(categoryUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
          });
          
          const $ = cheerio.load(response.data);
          
          // Cafe24 structure: li[id^="anchorBoxId"]
          const productElements = $('li[id^="anchorBoxId"]').toArray();
          console.log(`Found ${productElements.length} product elements on page ${page}`);
          
          if (productElements.length === 0) {
            hasMorePages = false;
            continue;
          }
          
          for (const element of productElements) {
            try {
              const $product = $(element);
              
              // Get product link
              const linkElement = $product.find('a').first();
              const relativeLink = linkElement.attr('href');
              if (!relativeLink) continue;
              
              const productUrl = relativeLink.startsWith('http') ? relativeLink : `${baseUrl}${relativeLink}`;
              
              // Skip if already scraped
              if (scrapedUrls.has(productUrl)) continue;
              scrapedUrls.add(productUrl);
              
              // Get product name from image alt or link text
              let name = '';
              const imgElement = $product.find('img').first();
              if (imgElement.length > 0) {
                name = imgElement.attr('alt') || '';
              }
              if (!name) {
                name = $product.find('.name, .prdName, [class*="name"]').text().trim();
              }
              if (!name) {
                // Try getting from link title or text
                name = linkElement.attr('title') || linkElement.text().trim();
              }
              if (!name) continue;
              
              // Get product image
              const image = imgElement.attr('src') || '';
              const fullImageUrl = image.startsWith('http') ? image : 
                                 image.startsWith('//') ? `https:${image}` : `${baseUrl}${image}`;
              
              // Get price - Look for pattern like "판매가 : 20,000원"
              let price = '';
              
              // First try to find the price in the description
              const descriptionElement = $product.find('.description');
              if (descriptionElement.length > 0) {
                const fullText = descriptionElement.text();
                // Look for "판매가 : 20,000원" pattern
                const priceMatch = fullText.match(/판매가\s*:\s*([\d,]+원)/);
                if (priceMatch) {
                  price = priceMatch[1];
                }
              }
              
              // Fallback to other selectors
              if (!price) {
                const priceSelectors = [
                  '.xans-product-listitem',
                  'span:contains("원")',
                  '.price',
                  '[class*="price"]',
                  'ul.spec li:contains("원")',
                  'li:contains("원")',
                  '.description strong'
                ];
                
                for (const selector of priceSelectors) {
                  const priceElement = $product.find(selector);
                  if (priceElement.length > 0) {
                    const text = priceElement.text();
                    if (text.includes('원') && !text.includes('할인')) {
                      const priceMatch = text.match(/[\d,]+원/);
                      if (priceMatch) {
                        price = priceMatch[0];
                        break;
                      }
                    }
                  }
                }
              }
              
              // Skip if no price found
              if (!price) {
                console.log(`No price found for: ${name}`);
                continue;
              }
              
              const product: Product = {
                name: name.trim(),
                price: price.trim(),
                image: fullImageUrl,
                link: productUrl,
                mall: '담양장터',
                category: category.name
              };
              
              products.push(product);
              console.log(`Scraped: ${product.name} - ${product.price}`);
              
            } catch (error) {
              console.error('Error processing product element:', error);
            }
          }
          
          // Check if there's a next page
          const nextPageLink = $('.xans-product-listmore a:contains("다음"), .xans-product-normalpaging a:contains("다음")');
          hasMorePages = nextPageLink.length > 0;
          page++;
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error fetching category ${category.name} page ${page}:`, error);
          hasMorePages = false;
        }
      }
    }
    
    console.log(`\nTotal products scraped: ${products.length}`);
    
    // Save the results
    const output = {
      mall: '담양장터',
      url: baseUrl,
      scraped_at: new Date().toISOString(),
      total_products: products.length,
      categories: categories.map(c => c.name),
      products: products
    };
    
    writeFileSync('./scripts/output/damyang-products.json', JSON.stringify(output, null, 2));
    console.log('Results saved to damyang-products.json');
    
    // Summary by category
    const categorySummary = products.reduce((acc, product) => {
      acc[product.category || 'Unknown'] = (acc[product.category || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nProducts by category:');
    Object.entries(categorySummary).forEach(([cat, count]) => {
      console.log(`${cat}: ${count}`);
    });
    
    return products;
    
  } catch (error) {
    console.error('Error in main scraping process:', error);
    return [];
  }
}

// Main execution
scrapeDamyangProducts().then(products => {
  console.log(`\nScraping completed. Total products: ${products.length}`);
  
  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_products: products.length,
    categories: [...new Set(products.map(p => p.category))].filter(Boolean),
    products_with_prices: products.filter(p => p.price).length,
    products_without_prices: products.filter(p => !p.price).length
  };
  
  writeFileSync('./scripts/output/damyang-scrape-summary.json', JSON.stringify(summary, null, 2));
}).catch(console.error);