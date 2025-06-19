import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function testWemallCategory(): Promise<void> {
  try {
    console.log('🔍 Testing wemall category page structure...');
    
    // Test with BEST products category
    const testUrl = 'https://wemall.kr/product/product.html?category=010';
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });

    console.log(`✅ Successfully fetched category page (${response.status})`);
    
    const $ = cheerio.load(response.data);
    
    // Save HTML for analysis
    writeFileSync('./scripts/output/wemall-category-010.html', response.data);
    console.log('💾 Saved category page HTML');

    console.log(`📋 Page title: ${$('title').text().trim()}`);

    // Look for different product selectors
    const productSelectors = [
      'table[cellpadding] tr', 'table tr',
      '.product-item', '.item', '.goods-item', '.product', 
      '.prd-item', '.prd_item', '.pro-item',
      'td a[href*="mode=view"]', 'a[href*="mode=view"]',
      'table td', 'td[height]',
      '[class*="product"]', '[class*="goods"]', '[class*="item"]'
    ];

    let productsFound = 0;
    let bestSelector = '';
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`🎯 Found ${elements.length} elements with selector: ${selector}`);
        
        // Check if these contain product links
        let productLinks = 0;
        elements.each((i, elem) => {
          const $elem = $(elem);
          if ($elem.find('a[href*="mode=view"]').length > 0 || $elem.is('a[href*="mode=view"]')) {
            productLinks++;
          }
        });
        
        if (productLinks > productsFound) {
          productsFound = productLinks;
          bestSelector = selector;
        }
        
        if (productLinks > 0) {
          console.log(`  └─ Contains ${productLinks} product links`);
        }
      }
    }

    console.log(`\n🏆 Best selector: ${bestSelector} (${productsFound} products)`);

    // Extract sample product data using best selector
    if (bestSelector && productsFound > 0) {
      const productElements = $(bestSelector);
      const sampleProducts: any[] = [];
      
      productElements.slice(0, 5).each((i, elem) => {
        const $elem = $(elem);
        const productLink = $elem.find('a[href*="mode=view"]').first();
        
        if (productLink.length > 0) {
          const href = productLink.attr('href');
          const fullUrl = href?.startsWith('http') ? href : `https://wemall.kr${href}`;
          
          // Extract product info from surrounding elements
          const productInfo = {
            url: fullUrl,
            linkText: productLink.text().trim(),
            parentHtml: $elem.html()?.substring(0, 300) + '...',
            images: $elem.find('img').map((_, img) => $(img).attr('src')).get()
          };
          
          sampleProducts.push(productInfo);
          console.log(`📦 Sample product ${i + 1}: ${productInfo.linkText.substring(0, 50)}...`);
        }
      });
      
      // Save sample data
      writeFileSync('./scripts/output/wemall-category-sample.json', JSON.stringify(sampleProducts, null, 2));
    }

    // Look for pagination
    const paginationElements = $('a[href*="page="]');
    console.log(`📄 Pagination links found: ${paginationElements.length}`);
    
    if (paginationElements.length > 0) {
      console.log('📄 Pagination URLs:');
      paginationElements.slice(0, 5).each((i, elem) => {
        const href = $(elem).attr('href');
        console.log(`  - ${href}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing category:', error);
  }
}

// Run test
testWemallCategory().then(() => {
  console.log('✅ Category test complete!');
}).catch(console.error);