import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

async function exploreKkimchiShop(): Promise<void> {
  const baseUrl = 'https://www.k-kimchi.kr';
  
  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });
  
  // Common shop/product page patterns
  const testUrls = [
    '/shop_goods/shop_goods_list.php',
    '/shop_goods/goods_list.php',
    '/shop/goods_list.php',
    '/shop/list.php',
    '/goods/list.php',
    '/product/list.php',
    '/index.php?cate=shop',
    '/index.php?cate=goods',
    '/index.php?cate=product',
    '/index.php?type=shop',
    '/index.php?type=goods',
    '/index.php?menu=shop',
    '/shop_goods/',
    '/shop/',
    '/mall/',
    '/store/'
  ];

  console.log('🔍 Exploring 광주김치몰 shop pages...');

  for (const testPath of testUrls) {
    try {
      const testUrl = `${baseUrl}${testPath}`;
      console.log(`\n🧪 Testing: ${testUrl}`);
      
      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        httpsAgent,
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        console.log(`📋 Title: ${title}`);
        
        // Look for products
        const productSelectors = [
          '.goods_list', '.product_list', '.item_list',
          '.pd_list', '.pd_item', '.prd_list',
          'a[href*="goods_detail"]', 'a[href*="product_detail"]',
          '.shop_item', '.shop_product', '.shop_goods',
          '.good_item', '.good-item', '.goods-item'
        ];
        
        let foundProducts = false;
        for (const selector of productSelectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`🎯 Found ${elements.length} elements with: ${selector}`);
            foundProducts = true;
            
            // Save this page for further analysis
            writeFileSync(`./scripts/output/kkimchi-shop-${testPath.replace(/[\/\\?=]/g, '_')}.html`, response.data);
            
            // Extract sample links
            const productLinks = $('a[href*="goods_detail"], a[href*="product_detail"], a[href*="shop_goods"]');
            if (productLinks.length > 0) {
              console.log(`🔗 Found ${productLinks.length} product links:`);
              productLinks.slice(0, 5).each((i, elem) => {
                const href = $(elem).attr('href');
                const text = $(elem).text().trim() || $(elem).find('img').attr('alt') || 'No text';
                console.log(`  - ${text.substring(0, 40)}... → ${href}`);
              });
            }
            
            break;
          }
        }
        
        if (!foundProducts) {
          // Look for any links that might lead to products
          const links = $('a[href*="shop"], a[href*="goods"], a[href*="product"], a[href*="김치"]');
          if (links.length > 0) {
            console.log(`📂 Found ${links.length} potential shop links`);
            links.slice(0, 5).each((i, elem) => {
              const href = $(elem).attr('href');
              const text = $(elem).text().trim();
              if (href && text) {
                console.log(`  - ${text}: ${href}`);
              }
            });
          }
        }
      } else if (response.status === 404) {
        console.log(`❌ 404 Not Found`);
      } else {
        console.log(`⚠️ Unexpected status: ${response.status}`);
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log('\n✅ Shop exploration complete!');
}

// Run exploration
exploreKkimchiShop().then(() => {
  console.log('Done!');
}).catch(console.error);