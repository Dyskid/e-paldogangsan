import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testNajuMallProduct() {
  try {
    console.log('🧪 Testing Naju Mall product pages...');
    
    // Test main product listing page
    console.log('\n📦 Testing product listing page...');
    const listUrl = 'https://najumall.kr/product/list.html';
    const listResponse = await axios.get(listUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $list = cheerio.load(listResponse.data);
    fs.writeFileSync('./scripts/output/najumall-product-list.html', listResponse.data);
    console.log('✅ Product list page saved');
    
    // Find product items using Cafe24 selectors
    const productSelectors = [
      '.xans-product-listmain .xans-record-',
      '.xans-product-normalpackage .xans-record-',
      'ul.prdList li.xans-record-',
      '.prdList .item',
      '.product-item',
      '.goods-item'
    ];
    
    let foundProducts = false;
    for (const selector of productSelectors) {
      const products = $list(selector);
      if (products.length > 0) {
        console.log(`🎯 Found ${products.length} products with selector: ${selector}`);
        foundProducts = true;
        
        // Analyze first product
        const firstProduct = products.first();
        console.log('\n🔍 Analyzing first product structure:');
        
        // Find title using common Cafe24 patterns
        const titleSelectors = ['.pname', '.name', '.title', '.prd-name', '.goods-name', '.product-name', 'strong', 'img'];
        let title = '';
        for (const sel of titleSelectors) {
          const titleText = firstProduct.find(sel).text().trim();
          const titleAlt = firstProduct.find(sel).attr('alt');
          if (titleText) {
            title = titleText;
            console.log(`Title (${sel} text): ${titleText}`);
            break;
          } else if (titleAlt) {
            title = titleAlt;
            console.log(`Title (${sel} alt): ${titleAlt}`);
            break;
          }
        }
        
        // Find price using Cafe24 patterns
        const priceSelectors = ['.price', '.cost', '.amount', '.xans-product-baseprice', '.prd-price'];
        let price = '';
        for (const sel of priceSelectors) {
          const priceText = firstProduct.find(sel).text().trim();
          if (priceText && priceText.includes('원')) {
            price = priceText;
            console.log(`Price (${sel}): ${priceText}`);
            break;
          }
        }
        
        const image = firstProduct.find('img').attr('src');
        const link = firstProduct.find('a').attr('href');
        
        console.log('Image:', image);
        console.log('Link:', link);
        
        break;
      }
    }
    
    if (!foundProducts) {
      console.log('❌ No products found with common selectors. Checking page structure...');
      console.log('Available classes:', $list('[class]').get().map(el => $list(el).attr('class')).filter(Boolean).slice(0, 20));
    }
    
    // Test individual product page if we found a link
    console.log('\n🔍 Testing individual product page...');
    const productLinks = $list('a[href*="product"]').map((i, el) => $list(el).attr('href')).get();
    
    if (productLinks.length > 0) {
      const productUrl = productLinks[0].startsWith('http') ? productLinks[0] : `https://najumall.kr${productLinks[0]}`;
      
      try {
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 30000
        });
        
        const $product = cheerio.load(productResponse.data);
        fs.writeFileSync('./scripts/output/najumall-product-sample.html', productResponse.data);
        console.log('✅ Product page sample saved');
        
        // Extract product details
        const productTitle = $product('.xans-product-detail .title, .xans-product-detail h2, .product_name, .goods_name, h1').text().trim() ||
                             $product('title').text().replace('나주몰', '').replace('나주시 지자체몰', '').trim();
        const productPrice = $product('.xans-product-baseprice, .price, .cost, .amount, #span_product_price_text').text().trim();
        const productImage = $product('.xans-product-detail img, .product_img img, .goods_img img').first().attr('src');
        
        console.log('\n📋 Individual Product Details:');
        console.log('Title:', productTitle);
        console.log('Price:', productPrice);
        console.log('Image:', productImage);
        
      } catch (error) {
        console.log('❌ Could not access individual product page:', error.message);
      }
    }
    
    // Save test results
    const testResults = {
      listPage: {
        url: listUrl,
        productsFound: foundProducts,
        selectors: productSelectors
      },
      platform: 'Cafe24'
    };
    
    fs.writeFileSync('./scripts/output/najumall-product-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('✅ Test results saved');
    
  } catch (error) {
    console.error('❌ Error testing Naju Mall product:', error);
  }
}

testNajuMallProduct();