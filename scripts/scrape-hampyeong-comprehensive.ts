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

async function scrapeHampyeongProducts() {
  const baseUrl = 'https://hampyeongm.com';
  const products: Product[] = [];
  const scrapedUrls = new Set<string>();
  
  // Categories from the structure analysis
  const categories = [
    { name: '베스트', url: '/product/list.html?cate_no=81' },
    { name: '농산물', url: '/product/list.html?cate_no=84' },
    { name: '축수산물', url: '/product/list.html?cate_no=75' },
    { name: '가공식품', url: '/product/list.html?cate_no=27' },
    { name: '공예품', url: '/product/list.html?cate_no=78' }
  ];
  
  try {
    console.log('Starting 함평천지몰 product scraping...');
    
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
          
          // Cafe24 structure: .prd-item
          const productElements = $('.prd-item').toArray();
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
              
              // Get product name from description
              let name = '';
              const descElement = $product.find('.description');
              if (descElement.length > 0) {
                // Extract name from "상품명 : [천지달콤키위] 3+1 건조 골드 키위 100g"
                const fullText = descElement.text();
                const nameMatch = fullText.match(/상품명\s*:\s*(.+?)(?=\s*판매가|$)/);
                if (nameMatch) {
                  name = nameMatch[1].trim();
                }
              }
              
              // Fallback to image alt
              if (!name) {
                const imgElement = $product.find('img').first();
                if (imgElement.length > 0) {
                  name = imgElement.attr('alt') || '';
                }
              }
              if (!name) continue;
              
              // Get product image
              const imgElement = $product.find('img').first();
              const image = imgElement.attr('src') || '';
              const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
              
              // Get price from description 
              let price = '';
              
              // First try to get from description where we found the name
              if (descElement.length > 0) {
                const fullText = descElement.text();
                // Extract price from "판매가 : 9,900원"
                const priceMatch = fullText.match(/판매가\s*:\s*([\d,]+원)/);
                if (priceMatch) {
                  price = priceMatch[1];
                }
              }
              
              // Fallback to other selectors
              if (!price) {
                const priceSelectors = [
                  '.price',
                  '[class*="price"]',
                  'span:contains("원")',
                  'li:contains("원")'
                ];
                
                for (const selector of priceSelectors) {
                  const priceElement = $product.find(selector);
                  if (priceElement.length > 0) {
                    const text = priceElement.text();
                    const priceMatch = text.match(/[\d,]+원/);
                    if (priceMatch) {
                      price = priceMatch[0];
                      break;
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
                mall: '함평천지몰',
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
      mall: '함평천지몰',
      url: baseUrl,
      scraped_at: new Date().toISOString(),
      total_products: products.length,
      categories: categories.map(c => c.name),
      products: products
    };
    
    writeFileSync('./scripts/output/hampyeong-products.json', JSON.stringify(output, null, 2));
    console.log('Results saved to hampyeong-products.json');
    
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
scrapeHampyeongProducts().then(products => {
  console.log(`\nScraping completed. Total products: ${products.length}`);
  
  // Save summary
  const summary = {
    timestamp: new Date().toISOString(),
    total_products: products.length,
    categories: [...new Set(products.map(p => p.category))].filter(Boolean),
    products_with_prices: products.filter(p => p.price).length,
    products_without_prices: products.filter(p => !p.price).length
  };
  
  writeFileSync('./scripts/output/hampyeong-scrape-summary.json', JSON.stringify(summary, null, 2));
}).catch(console.error);