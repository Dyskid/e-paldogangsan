import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function exploreChamdsCategories(): Promise<void> {
  const baseUrl = 'https://chamds.com';
  
  // Try different category numbers and patterns
  const categoryTests = [
    '/product/list.html?cate_no=24',
    '/product/list.html?cate_no=25',
    '/product/list.html?cate_no=26',
    '/product/list.html?cate_no=27',
    '/product/list.html?cate_no=28',
    '/product/list.html?cate_no=1',
    '/product/list.html?cate_no=2',
    '/product/list.html?cate_no=3',
    '/product/list.html?category=1',
    '/goods/list.html',
    '/shop/goods.html',
    '/product/?category=food',
    '/product/?category=농산물',
    '/search.html?keyword=쌀',
    '/search.html?keyword=농산물'
  ];

  console.log('🔍 Exploring 참달성 category pages...');

  for (const testPath of categoryTests) {
    try {
      const testUrl = `${baseUrl}${testPath}`;
      console.log(`\n🧪 Testing: ${testUrl}`);
      
      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        timeout: 15000
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        console.log(`📋 Title: ${title}`);
        
        // Look for products using Cafe24 specific selectors
        const cafe24Selectors = [
          '.xans-product-normalpackage .thumbnail',
          '.xans-product-listnormal .thumbnail', 
          '.xans-product .thumbnail',
          '.thumbnail',
          '.listItem',
          '.item',
          '.prdList li',
          '.goods_list li'
        ];
        
        let foundProducts = false;
        for (const selector of cafe24Selectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`🎯 Found ${elements.length} products with: ${selector}`);
            foundProducts = true;
            
            // Extract sample product info
            elements.slice(0, 3).each((i, elem) => {
              const $elem = $(elem);
              const link = $elem.find('a').first().attr('href');
              const title = $elem.find('.name, .title, .prdName, strong').text().trim();
              const price = $elem.find('.price, .cost, .won').text().trim();
              const image = $elem.find('img').attr('src');
              
              console.log(`  ${i + 1}. ${title || 'No title'} - ${price || 'No price'}`);
              if (link) console.log(`     Link: ${link}`);
            });
            
            if (foundProducts) break;
          }
        }
        
        if (!foundProducts) {
          // Look for category navigation
          const categoryLinks = $('a[href*="cate_no"], a[href*="category"], .category a, .menu a');
          if (categoryLinks.length > 0) {
            console.log(`📂 Found ${categoryLinks.length} category links:`);
            categoryLinks.slice(0, 5).each((i, elem) => {
              const href = $(elem).attr('href');
              const text = $(elem).text().trim();
              if (href && text) {
                console.log(`  - ${text}: ${href}`);
              }
            });
          }
        }
        
        // Check for "no products" messages
        const noProductsMessages = [
          '등록된 상품이 없습니다',
          '상품이 없습니다',
          'no products',
          '검색결과가 없습니다'
        ];
        
        const pageText = $('body').text();
        const hasNoProductsMessage = noProductsMessages.some(msg => 
          pageText.includes(msg)
        );
        
        if (hasNoProductsMessage) {
          console.log('⚠️ Page indicates no products available');
        }
        
      } else {
        console.log(`❌ HTTP ${response.status}`);
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Run exploration
exploreChamdsCategories().then(() => {
  console.log('\n✅ Category exploration complete!');
}).catch(console.error);