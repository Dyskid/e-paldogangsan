/**
 * Test Yeongwol Mall product page and category page to find best selectors
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testYeongwolPages(): Promise<void> {
  console.log('🔍 Testing Yeongwol Mall pages...');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
  };

  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  try {
    // 1. Test a category page first
    console.log('\n📂 Testing category page...');
    const categoryUrl = 'https://yeongwol-mall.com/goods/catalog?code=0017'; // 과일/견과
    console.log(`🔗 Testing: ${categoryUrl}`);
    
    const categoryResponse = await axios.get(categoryUrl, { headers, timeout: 30000 });
    await fs.writeFile(path.join(outputDir, 'yeongwol-category-sample.html'), categoryResponse.data);
    
    const category$ = cheerio.load(categoryResponse.data);
    
    console.log('🛍️ Testing product selectors on category page:');
    const productSelectors = [
      '.goods-list .goods-item',
      '.product-list .product-item', 
      '.item-list .item',
      '.goods-item',
      '.product-item',
      '.list-item',
      '.goods',
      '.product',
      'li[class*="goods"]',
      'li[class*="product"]',
      'div[class*="goods"]',
      'div[class*="product"]',
      '.shop-item',
      '.catalog-item'
    ];

    let foundProducts = false;
    for (const selector of productSelectors) {
      const products = category$(selector);
      if (products.length > 0) {
        console.log(`  ✅ ${selector}: Found ${products.length} products`);
        
        // Test first product for details
        const firstProduct = products.first();
        console.log(`\n🔍 Analyzing first product with selector: ${selector}`);
        
        // Name selectors
        const nameSelectors = ['.name', '.title', '.goods-name', '.product-name', 'h3', 'h4', 'strong', '.subject'];
        for (const nameSelector of nameSelectors) {
          const nameEl = firstProduct.find(nameSelector);
          if (nameEl.length > 0 && nameEl.text().trim()) {
            console.log(`    Name (${nameSelector}): "${nameEl.text().trim()}"`);
          }
        }

        // Price selectors
        const priceSelectors = ['.price', '.cost', '.amount', '.money', '.won', '[class*="price"]', '.sale-price'];
        for (const priceSelector of priceSelectors) {
          const priceEl = firstProduct.find(priceSelector);
          if (priceEl.length > 0 && priceEl.text().trim()) {
            console.log(`    Price (${priceSelector}): "${priceEl.text().trim()}"`);
          }
        }

        // Image selectors
        const imgEl = firstProduct.find('img');
        if (imgEl.length > 0) {
          console.log(`    Image: "${imgEl.attr('src')}"`);
        }

        // Link selectors
        const linkEl = firstProduct.find('a');
        if (linkEl.length > 0) {
          console.log(`    Link: "${linkEl.attr('href')}"`);
        }
        
        foundProducts = true;
        break;
      }
    }

    if (!foundProducts) {
      console.log('❌ No products found with standard selectors');
    }

    // 2. Test a specific product page
    console.log('\n📦 Testing individual product page...');
    const productUrl = 'https://yeongwol-mall.com/goods/view?no=26929';
    console.log(`🔗 Testing: ${productUrl}`);
    
    const productResponse = await axios.get(productUrl, { headers, timeout: 30000 });
    await fs.writeFile(path.join(outputDir, 'yeongwol-product-test.html'), productResponse.data);
    
    const product$ = cheerio.load(productResponse.data);
    
    console.log('\n📋 Product page analysis:');
    console.log(`Page title: "${product$('title').text()}"`);
    
    // Test various selectors for product name
    console.log('\n🏷️ Testing name selectors:');
    const nameSelectors = [
      'h1',
      '.goods-name',
      '.product-name', 
      '.subject',
      '.title',
      'h2',
      '.item-name',
      '[class*="name"]',
      '.detail-title',
      '.goods-title'
    ];
    
    nameSelectors.forEach(selector => {
      const element = product$(selector);
      if (element.length > 0) {
        console.log(`  ${selector}: "${element.first().text().trim()}"`);
      }
    });

    // Test price selectors
    console.log('\n💰 Testing price selectors:');
    const priceSelectors = [
      '.price',
      '.cost',
      '.amount',
      '.sale-price',
      '.selling-price',
      '.money',
      '[class*="price"]',
      '.goods-price'
    ];
    
    priceSelectors.forEach(selector => {
      const element = product$(selector);
      if (element.length > 0) {
        console.log(`  ${selector}: "${element.first().text().trim()}"`);
      }
    });

    // Test image selectors
    console.log('\n🖼️ Testing image selectors:');
    const imageSelectors = [
      '.goods-image img',
      '.product-image img',
      '.main-image img',
      '.detail-image img',
      '.thumb img',
      'img[src*="goods"]'
    ];
    
    imageSelectors.forEach(selector => {
      const element = product$(selector);
      if (element.length > 0) {
        const src = element.first().attr('src');
        console.log(`  ${selector}: "${src}"`);
      }
    });

    // Look for specific patterns in text
    console.log('\n🔍 Looking for product-specific content:');
    const bodyText = product$('body').text();
    const keywords = ['영월', '특산', '농산', '수산', '한우', '쌀', '감자', '옥수수', '토마토'];
    
    keywords.forEach(keyword => {
      if (bodyText.includes(keyword)) {
        console.log(`  Found keyword: "${keyword}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error testing pages:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testYeongwolPages().catch(console.error);
}

export { testYeongwolPages };