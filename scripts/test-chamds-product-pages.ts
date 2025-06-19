import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function testChamdsProductPages(): Promise<void> {
  const baseUrl = 'https://chamds.com';
  
  // Common Cafe24 product listing URLs
  const testUrls = [
    '/product/list.html',
    '/product/list.html?cate_no=24',
    '/goods/list.html',
    '/category/list.html',
    '/shop/goods/goods_list.php',
    '/shop_goods/goods_list.php',
    '/product/product_list.php',
    '/goods/goods_main.php',
    '/product/',
    '/goods/',
    '/category/',
    '/shop/'
  ];

  console.log('🔍 Testing 참달성 product page URLs...');

  for (const testPath of testUrls) {
    try {
      const testUrl = `${baseUrl}${testPath}`;
      console.log(`\n🧪 Testing: ${testUrl}`);
      
      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Accept redirects and 4xx errors
        }
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        console.log(`📋 Page title: ${title}`);
        
        // Look for products
        const productSelectors = [
          '.xans-product', '.thumbnail', '.item', '.listItem',
          '.product', '.goods', '.prdInfo', '.item-container',
          '.displayItemWrap', '.EC-productWrap'
        ];
        
        let productCount = 0;
        let bestSelector = '';
        
        for (const selector of productSelectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`🎯 Found ${elements.length} products with selector: ${selector}`);
            if (elements.length > productCount) {
              productCount = elements.length;
              bestSelector = selector;
            }
          }
        }
        
        if (productCount > 0) {
          console.log(`✅ FOUND PRODUCTS! Best selector: ${bestSelector} (${productCount} items)`);
          
          // Save this page for analysis
          writeFileSync(`./scripts/output/chamds-products-${testPath.replace(/[\/\\]/g, '_')}.html`, response.data);
          
          // Extract sample product data
          const products: any[] = [];
          $(bestSelector).slice(0, 5).each((i, elem) => {
            const $elem = $(elem);
            const productInfo = {
              title: $elem.find('a').attr('title') || $elem.find('.name, .title, .prdName').text().trim(),
              link: $elem.find('a').attr('href'),
              image: $elem.find('img').attr('src'),
              price: $elem.find('.price, .cost, .won').text().trim()
            };
            products.push(productInfo);
          });
          
          console.log('📦 Sample products:');
          products.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.title.substring(0, 40)}... - ${product.price}`);
          });
          
          return; // Found products, exit early
        }
        
        // Look for category links
        const categoryLinks = $('a[href*="cate"], a[href*="category"], a[href*="goods"]');
        if (categoryLinks.length > 0) {
          console.log(`📂 Found ${categoryLinks.length} potential category links`);
          categoryLinks.slice(0, 5).each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            console.log(`  - ${text}: ${href}`);
          });
        }
      } else {
        console.log(`⚠️ Response status: ${response.status}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n📊 Finished testing product page URLs');
}

// Run test
testChamdsProductPages().then(() => {
  console.log('✅ Product page testing complete!');
}).catch(console.error);