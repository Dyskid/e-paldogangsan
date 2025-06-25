import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testBuanCategory() {
  const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
  const categoryUrl = `${baseUrl}/board/shop/list.php?ca_id=1010`; // 쌀·잡곡 category
  
  console.log(`Testing category page: ${categoryUrl}`);
  
  try {
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    // Save the HTML for analysis
    fs.writeFileSync('./scripts/output/buan-category-sample.html', response.data);
    
    const $ = cheerio.load(response.data);
    
    console.log('Category Page Analysis:');
    console.log('Page Title:', $('title').text().trim());
    
    // Look for product listings
    console.log('\n=== Product Listing Analysis ===');
    
    // Common product selectors
    const productSelectors = [
      '.item', '.product', '.goods', '.list-item', '.shop-item',
      '[class*="item"]', '[class*="product"]', '[class*="goods"]'
    ];
    
    let foundProducts = false;
    productSelectors.forEach(selector => {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items with selector: ${selector}`);
        foundProducts = true;
        
        // Analyze first few items
        items.slice(0, 3).each((index, item) => {
          const title = $(item).find('a').first().text().trim() || 
                       $(item).text().trim().slice(0, 50);
          const link = $(item).find('a').first().attr('href');
          console.log(`  Item ${index + 1}: ${title}`);
          if (link) console.log(`    Link: ${link}`);
        });
      }
    });
    
    // Look for links that might be products
    console.log('\n=== Link Analysis ===');
    const allLinks = $('a');
    const productLinks: string[] = [];
    
    allLinks.each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && (
        href.includes('view.php') || 
        href.includes('detail.php') ||
        href.includes('it_id=') ||
        href.includes('item') ||
        href.includes('product')
      )) {
        productLinks.push(`${text} -> ${href}`);
      }
    });
    
    console.log(`Found ${productLinks.length} potential product links:`);
    productLinks.slice(0, 10).forEach(link => {
      console.log(`  - ${link}`);
    });
    
    // Look for images that might be product thumbnails
    console.log('\n=== Image Analysis ===');
    const images = $('img');
    const productImages: string[] = [];
    
    images.each((_, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt');
      
      if (src && (
        src.includes('item') ||
        src.includes('product') ||
        src.includes('goods') ||
        src.includes('thumb') ||
        src.includes('data/item')
      )) {
        productImages.push(`${alt || 'No alt'} -> ${src}`);
      }
    });
    
    console.log(`Found ${productImages.length} potential product images:`);
    productImages.slice(0, 5).forEach(img => {
      console.log(`  - ${img}`);
    });
    
    // Look for pagination or more pages
    console.log('\n=== Pagination Analysis ===');
    const paginationLinks = $('a').filter((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      return href.includes('page=') || text.includes('다음') || text.includes('이전') || /^\d+$/.test(text);
    });
    
    console.log(`Found ${paginationLinks.length} pagination links`);
    paginationLinks.slice(0, 5).each((_, el) => {
      console.log(`  - ${$(el).text().trim()} -> ${$(el).attr('href')}`);
    });
    
  } catch (error) {
    console.error('Error testing category:', error.message);
  }
}

testBuanCategory();