import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testGmsocialAccess() {
  console.log('🔍 Testing Gmsocial.or.kr access...');
  
  try {
    // Test main page
    console.log('Testing main page...');
    const mainResponse = await axios.get('https://gmsocial.or.kr/mall/', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log(`✅ Main page: ${mainResponse.status} ${mainResponse.statusText}`);
    
    // Test food category page
    console.log('Testing food category page...');
    const foodResponse = await axios.get('https://gmsocial.or.kr/mall/goods/list.php?category_code=0006', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log(`✅ Food category: ${foodResponse.status} ${foodResponse.statusText}`);
    
    // Parse the food category page to find products
    const $ = cheerio.load(foodResponse.data);
    
    // Look for product links
    const productLinks: string[] = [];
    $('a[href*="view.php?product_id="], a[href*="product_id="]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('product_id=')) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = 'https://gmsocial.or.kr' + href;
        } else if (!href.startsWith('http')) {
          fullUrl = 'https://gmsocial.or.kr/mall/goods/' + href;
        }
        productLinks.push(fullUrl);
      }
    });
    
    console.log(`Found ${productLinks.length} product links in food category`);
    
    if (productLinks.length > 0) {
      // Test first few product pages
      for (let i = 0; i < Math.min(3, productLinks.length); i++) {
        try {
          console.log(`Testing product page ${i + 1}: ${productLinks[i]}`);
          const productResponse = await axios.get(productLinks[i], {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          console.log(`✅ Product ${i + 1}: ${productResponse.status} ${productResponse.statusText}`);
          
          // Try to extract basic info
          const product$ = cheerio.load(productResponse.data);
          const title = product$('h1, .goods_name, .product_name').first().text().trim();
          const price = product$('.price, .goods_price, .product_price').first().text().trim();
          
          console.log(`   Title: ${title || 'Not found'}`);
          console.log(`   Price: ${price || 'Not found'}`);
          
          // Save sample HTML for analysis
          if (i === 0) {
            const outputDir = path.join(__dirname, 'output');
            fs.writeFileSync(path.join(outputDir, 'gmsocial-test-product.html'), productResponse.data);
          }
          
        } catch (error) {
          console.error(`❌ Product ${i + 1} failed: ${error.message}`);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Save the food category HTML for manual inspection
    const outputDir = path.join(__dirname, 'output');
    fs.writeFileSync(path.join(outputDir, 'gmsocial-test-food-category.html'), foodResponse.data);
    
    console.log('\n📊 Test completed. Check output files for details.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmsocialAccess();