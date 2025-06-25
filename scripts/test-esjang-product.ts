import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testEsjangProduct() {
  console.log('🧪 Testing ESJang Mall product page structure...');
  
  try {
    // Test with a product URL found
    const testUrl = 'https://www.esjang.go.kr/products/view/G2000000068';
    console.log(`Testing URL: ${testUrl}`);
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save sample page for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'esjang-product-sample.html'),
      response.data,
      'utf-8'
    );
    
    console.log('📄 Sample product page saved');
    
    // Test various selectors for product information
    const selectorTests = {
      // Product name selectors
      productNames: {
        '[class*="name"]': $('[class*="name"]').map((i, el) => $(el).text().trim()).get(),
        '.name': $('.name').map((i, el) => $(el).text().trim()).get(),
        '.title': $('.title').map((i, el) => $(el).text().trim()).get(),
        'h1': $('h1').map((i, el) => $(el).text().trim()).get(),
        'h2': $('h2').map((i, el) => $(el).text().trim()).get(),
        'h3': $('h3').map((i, el) => $(el).text().trim()).get(),
        '.product-name': $('.product-name').map((i, el) => $(el).text().trim()).get(),
        '.goods-name': $('.goods-name').map((i, el) => $(el).text().trim()).get(),
        '.prd_name': $('.prd_name').map((i, el) => $(el).text().trim()).get(),
        '.product_name': $('.product_name').map((i, el) => $(el).text().trim()).get()
      },
      
      // Price selectors
      prices: {
        '[class*="price"]': $('[class*="price"]').map((i, el) => $(el).text().trim()).get(),
        '.price': $('.price').map((i, el) => $(el).text().trim()).get(),
        '.cost': $('.cost').map((i, el) => $(el).text().trim()).get(),
        '.amount': $('.amount').map((i, el) => $(el).text().trim()).get(),
        '[class*="won"]': $('[class*="won"]').map((i, el) => $(el).text().trim()).get(),
        '.sale_price': $('.sale_price').map((i, el) => $(el).text().trim()).get(),
        '.product_price': $('.product_price').map((i, el) => $(el).text().trim()).get()
      },
      
      // Image selectors
      images: {
        'img[src*="product"]': $('img[src*="product"]').map((i, el) => $(el).attr('src')).get(),
        'img[src*="goods"]': $('img[src*="goods"]').map((i, el) => $(el).attr('src')).get(),
        'img[alt*="상품"]': $('img[alt*="상품"]').map((i, el) => $(el).attr('src')).get(),
        '.product-img img': $('.product-img img').map((i, el) => $(el).attr('src')).get(),
        '.goods-img img': $('.goods-img img').map((i, el) => $(el).attr('src')).get(),
        '.product_image img': $('.product_image img').map((i, el) => $(el).attr('src')).get(),
        '#product_image img': $('#product_image img').map((i, el) => $(el).attr('src')).get()
      }
    };
    
    // Display results
    console.log('\n🔍 Product Name Selectors:');
    Object.entries(selectorTests.productNames).forEach(([selector, values]) => {
      if (values.length > 0) {
        console.log(`  ${selector}: ${JSON.stringify(values.slice(0, 2))}`);
      }
    });
    
    console.log('\n💰 Price Selectors:');
    Object.entries(selectorTests.prices).forEach(([selector, values]) => {
      if (values.length > 0) {
        console.log(`  ${selector}: ${JSON.stringify(values.slice(0, 3))}`);
      }
    });
    
    console.log('\n🖼️ Image Selectors:');
    Object.entries(selectorTests.images).forEach(([selector, values]) => {
      if (values.length > 0) {
        console.log(`  ${selector}: ${values.length} images found`);
        console.log(`    Sample: ${values[0]}`);
      }
    });
    
    // Look for specific product information
    const pageTitle = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    console.log('\n📋 Page Information:');
    console.log(`  Title: ${pageTitle}`);
    console.log(`  Meta description: ${metaDescription.substring(0, 100)}...`);
    
    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      testUrl,
      pageTitle,
      metaDescription,
      selectorTests,
      recommendations: {
        nameSelector: '',
        priceSelector: '',
        imageSelector: ''
      }
    };
    
    // Determine best selectors
    if (selectorTests.productNames['.product_name'].length > 0) {
      testResults.recommendations.nameSelector = '.product_name';
    } else if (selectorTests.productNames['.prd_name'].length > 0) {
      testResults.recommendations.nameSelector = '.prd_name';
    } else if (selectorTests.productNames['h2'].length > 0) {
      testResults.recommendations.nameSelector = 'h2';
    }
    
    if (selectorTests.prices['.sale_price'].length > 0) {
      testResults.recommendations.priceSelector = '.sale_price';
    } else if (selectorTests.prices['[class*="price"]'].length > 0) {
      testResults.recommendations.priceSelector = '[class*="price"]';
    }
    
    if (selectorTests.images['#product_image img'].length > 0) {
      testResults.recommendations.imageSelector = '#product_image img';
    } else if (selectorTests.images['.product_image img'].length > 0) {
      testResults.recommendations.imageSelector = '.product_image img';
    }
    
    const testResultsPath = path.join(outputDir, 'esjang-product-test-results.json');
    fs.writeFileSync(testResultsPath, JSON.stringify(testResults, null, 2), 'utf-8');
    
    console.log('\n✅ Recommended selectors:');
    console.log(`  Name: ${testResults.recommendations.nameSelector}`);
    console.log(`  Price: ${testResults.recommendations.priceSelector}`);
    console.log(`  Image: ${testResults.recommendations.imageSelector}`);
    
    console.log(`\n💾 Test results saved to: ${testResultsPath}`);
    
    return testResults;
    
  } catch (error) {
    console.error('❌ Error testing product page:', error);
    throw error;
  }
}

// Run test
testEsjangProduct()
  .then(() => {
    console.log('🎉 Product page test completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Product page test failed:', error);
    process.exit(1);
  });