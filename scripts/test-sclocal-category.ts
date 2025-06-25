import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testSCLocalCategory() {
  try {
    console.log('🧪 Testing SC Local category page...');
    
    // Test a product category page
    const categoryUrl = 'https://sclocal.kr/?pn=product.list&cuid=436'; // 농산물 category
    console.log(`\n📦 Fetching category page: ${categoryUrl}`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    fs.writeFileSync('./scripts/output/sclocal-category-page.html', response.data);
    console.log('✅ Category page saved');
    
    // Try various product selectors
    const productSelectors = [
      '.item_list .item_box',
      '.item_list .item',
      '.product_list .product',
      '.goods_list .goods',
      '.prd_list .prd',
      'ul.item_list li',
      '.c_item_list .c_item_box',
      '.item_area',
      '[class*="item"] [class*="box"]',
      '.list_box .item',
      '.prd_item'
    ];
    
    let foundProducts = false;
    let productData = [];
    
    for (const selector of productSelectors) {
      const products = $(selector);
      if (products.length > 0) {
        console.log(`\n🎯 Found ${products.length} products with selector: ${selector}`);
        foundProducts = true;
        
        // Analyze first few products
        products.slice(0, 3).each((index, element) => {
          const $item = $(element);
          console.log(`\n📦 Product ${index + 1}:`);
          
          // Try to find product name
          const nameSelectors = ['.name', '.title', '.prd_name', '.item_name', '.c_pname', 'strong.name', '.tit'];
          let productName = '';
          for (const sel of nameSelectors) {
            const name = $item.find(sel).text().trim();
            if (name) {
              productName = name;
              console.log(`  Name (${sel}): ${name}`);
              break;
            }
          }
          
          // Try to find price
          const priceSelectors = ['.price', '.cost', '.prd_price', '.item_price', '.price_box', '.c_price'];
          let productPrice = '';
          for (const sel of priceSelectors) {
            const price = $item.find(sel).text().trim();
            if (price && (price.includes('원') || price.includes(','))) {
              productPrice = price;
              console.log(`  Price (${sel}): ${price}`);
              break;
            }
          }
          
          // Try to find image
          const img = $item.find('img').first();
          if (img.length > 0) {
            console.log(`  Image: ${img.attr('src')}`);
          }
          
          // Try to find link
          const link = $item.find('a').first().attr('href');
          if (link) {
            console.log(`  Link: ${link}`);
          }
          
          productData.push({
            name: productName,
            price: productPrice,
            image: img.attr('src'),
            link: link,
            selector: selector
          });
        });
        
        break;
      }
    }
    
    if (!foundProducts) {
      console.log('\n❌ No products found with common selectors');
      console.log('🔍 Looking for any elements that might be products...');
      
      // Try to find by common class patterns
      const classPatterns = ['item', 'product', 'goods', 'prd'];
      $('[class]').each((i, el) => {
        const className = $(el).attr('class') || '';
        for (const pattern of classPatterns) {
          if (className.includes(pattern) && $(el).find('img').length > 0) {
            console.log(`  Found potential product element: .${className}`);
            return false; // Break after finding first match
          }
        }
      });
    }
    
    // Save test results
    const results = {
      url: categoryUrl,
      productsFound: foundProducts,
      productCount: productData.length,
      products: productData,
      pageTitle: $('title').text().trim()
    };
    
    fs.writeFileSync('./scripts/output/sclocal-category-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Test results saved');
    
  } catch (error) {
    console.error('❌ Error testing category page:', error);
  }
}

testSCLocalCategory();