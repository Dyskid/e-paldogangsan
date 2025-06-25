import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testDanpoongCategory() {
  const baseUrl = 'https://www.danpoongmall.kr';
  // Test 쌀/잡곡 category
  const categoryUrl = `${baseUrl}/product-category/%ec%8c%80-%ec%9e%a1%ea%b3%a1/`;
  
  console.log(`Testing category page: ${categoryUrl}`);
  
  try {
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    // Save the HTML for analysis
    fs.writeFileSync('./scripts/output/danpoong-category-sample.html', response.data);
    
    const $ = cheerio.load(response.data);
    
    console.log('Category Page Analysis:');
    console.log('Page Title:', $('title').text().trim());
    
    // Look for product listings - WooCommerce patterns
    console.log('\n=== Product Listing Analysis ===');
    
    // Common WooCommerce product selectors
    const productSelectors = [
      '.product', '.woocommerce-loop-product__link', '.product-item',
      '.shop_table', '.products .product', '.product-box',
      '[class*="product"]'
    ];
    
    let foundProducts = false;
    productSelectors.forEach(selector => {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items with selector: ${selector}`);
        foundProducts = true;
        
        // Analyze first few items
        items.slice(0, 3).each((index, item) => {
          const title = $(item).find('h2, h3, .product-title, .woocommerce-loop-product__title').text().trim() ||
                       $(item).find('a').first().attr('title') ||
                       $(item).text().trim().slice(0, 50);
          const link = $(item).find('a').first().attr('href') || $(item).attr('href');
          const price = $(item).find('.price, .woocommerce-Price-amount, .amount').text().trim();
          console.log(`  Item ${index + 1}: ${title}`);
          if (link) console.log(`    Link: ${link}`);
          if (price) console.log(`    Price: ${price}`);
        });
      }
    });
    
    // Look for specific product links
    console.log('\n=== Link Analysis ===');
    const allLinks = $('a');
    const productLinks: string[] = [];
    
    allLinks.each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && (
        href.includes('/product/') || 
        href.includes('/?product=') ||
        href.includes('/상품/') ||
        href.match(/\/\d+\/$/) // WordPress post ID pattern
      )) {
        productLinks.push(`${text.slice(0, 30)} -> ${href}`);
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
        src.includes('product') ||
        src.includes('upload') ||
        src.includes('wp-content') ||
        alt?.includes('상품') ||
        alt?.includes('제품')
      )) {
        productImages.push(`${alt || 'No alt'} -> ${src}`);
      }
    });
    
    console.log(`Found ${productImages.length} potential product images:`);
    productImages.slice(0, 5).forEach(img => {
      console.log(`  - ${img}`);
    });
    
    // Look for pagination
    console.log('\n=== Pagination Analysis ===');
    const paginationLinks = $('a').filter((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      return href.includes('page') || text.includes('다음') || text.includes('이전') || 
             /^\d+$/.test(text) || text.includes('→') || text.includes('←');
    });
    
    console.log(`Found ${paginationLinks.length} pagination links`);
    paginationLinks.slice(0, 5).each((_, el) => {
      console.log(`  - ${$(el).text().trim()} -> ${$(el).attr('href')}`);
    });
    
    // Check if this is actually a shop/category page
    console.log('\n=== Page Structure Analysis ===');
    console.log(`Has .woocommerce class: ${$('.woocommerce').length > 0}`);
    console.log(`Has .shop class: ${$('.shop').length > 0}`);
    console.log(`Has product grid: ${$('.products').length > 0}`);
    console.log(`Has WC loop: ${$('.woocommerce-loop-product').length > 0}`);
    
  } catch (error) {
    console.error('Error testing category:', error.message);
  }
}

testDanpoongCategory();