import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testBoseongProduct() {
  try {
    console.log('🧪 Testing Boseong Mall product pages...');
    
    // Test main product listing page
    console.log('\n📦 Testing product listing page...');
    const listUrl = 'https://boseongmall.co.kr/product/list.html';
    const listResponse = await axios.get(listUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $list = cheerio.load(listResponse.data);
    fs.writeFileSync('./scripts/output/boseong-product-list.html', listResponse.data);
    console.log('✅ Product list page saved');
    
    // Find product items
    const productSelectors = [
      '.prdList .item',
      '.xans-product-listmain .item',
      '.xans-product-normalpackage .item',
      '.product-item',
      '.goods-item',
      '.prd-item',
      '.list-item',
      '.thumbnail'
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
        console.log('HTML:', firstProduct.html()?.substring(0, 500) + '...');
        
        // Find title, price, image, link
        const title = firstProduct.find('.name, .title, .prd-name, .goods-name, .pname, .thumbnail .pname').text().trim() ||
                     firstProduct.find('strong, .strong').text().trim();
        const price = firstProduct.find('.price, .cost, .amount, .prd-price, .goods-price, .xans-product-baseprice, .xans-element-product-baseprice').text().trim();
        const image = firstProduct.find('img').attr('src');
        const link = firstProduct.find('a').attr('href');
        
        console.log('Title:', title);
        console.log('Price:', price);
        console.log('Image:', image);
        console.log('Link:', link);
        
        break;
      }
    }
    
    if (!foundProducts) {
      console.log('❌ No products found with common selectors. Checking page structure...');
      console.log('Available classes:', $list('[class]').get().map(el => $list(el).attr('class')).filter(Boolean).slice(0, 20));
    }
    
    // Test individual product page
    console.log('\n🔍 Testing individual product page...');
    const productUrl = 'https://boseongmall.co.kr/product/%ED%9A%8C%EC%B2%9C%ED%96%87%EC%82%B4%EB%86%8D%EC%9E%A5-%EB%B3%B4%EC%84%B1%ED%96%87%EA%B0%90%EC%9E%90-10kg-20kg/2612/category/1/display/13/';
    
    const productResponse = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $product = cheerio.load(productResponse.data);
    fs.writeFileSync('./scripts/output/boseong-product-sample.html', productResponse.data);
    console.log('✅ Product page sample saved');
    
    // Extract product details
    const productTitle = $product('.xans-product-detail .title, .xans-product-detail h2, .product_name, .goods_name, h1').text().trim() ||
                         $product('title').text().replace('보성몰', '').trim();
    const productPrice = $product('.xans-product-baseprice, .price, .cost, .amount, #span_product_price_text').text().trim();
    const productImage = $product('.xans-product-detail img, .product_img img, .goods_img img').first().attr('src');
    
    console.log('\n📋 Individual Product Details:');
    console.log('Title:', productTitle);
    console.log('Price:', productPrice);
    console.log('Image:', productImage);
    
    // Save test results
    const testResults = {
      listPage: {
        url: listUrl,
        productsFound: foundProducts,
        selectors: productSelectors
      },
      productPage: {
        url: productUrl,
        title: productTitle,
        price: productPrice,
        image: productImage
      }
    };
    
    fs.writeFileSync('./scripts/output/boseong-product-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('✅ Test results saved');
    
  } catch (error) {
    console.error('❌ Error testing Boseong product:', error);
  }
}

testBoseongProduct();