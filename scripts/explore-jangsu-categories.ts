import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function exploreCategories() {
  console.log('=== Exploring 장수몰 Categories ===');
  
  // Test multiple categories to find one with products
  const categoriesToTest = [
    { name: '사과', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=101010' },
    { name: '한우', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=102010' },
    { name: '농산물', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103010' },
    { name: '과일', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103020' },
    { name: '채소/나물', url: 'https://www.장수몰.com/board/shop/list.php?ca_id=103030' },
    // Also try broader categories
    { name: '전체상품', url: 'https://www.장수몰.com/board/shop/list.php' }
  ];
  
  const results = [];
  
  for (const category of categoriesToTest) {
    try {
      console.log(`\nTesting category: ${category.name} (${category.url})`);
      
      const response = await axios.get(category.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Look for product links
      const productLinks: string[] = [];
      $('a[href*="item.php"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('it_id=')) {
          productLinks.push(href);
        }
      });
      
      // Look for text that might indicate products
      const pageText = $('body').text();
      const hasProductKeywords = pageText.includes('상품') || 
                                 pageText.includes('제품') || 
                                 pageText.includes('원') ||
                                 pageText.includes('가격');
      
      // Look for images that might be products
      const productImages = $('img[src*="item"], img[src*="product"], img[src*="goods"]').length;
      
      const result = {
        category: category.name,
        url: category.url,
        productLinks: productLinks.length,
        hasProductKeywords,
        productImages,
        title: $('title').text(),
        sampleLinks: productLinks.slice(0, 5)
      };
      
      results.push(result);
      
      console.log(`  Product links found: ${productLinks.length}`);
      console.log(`  Has product keywords: ${hasProductKeywords}`);
      console.log(`  Product images: ${productImages}`);
      console.log(`  Page title: ${$('title').text()}`);
      
      if (productLinks.length > 0) {
        console.log(`  Sample links:`, productLinks.slice(0, 3));
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error testing ${category.name}:`, error);
      results.push({
        category: category.name,
        url: category.url,
        productLinks: 0,
        hasProductKeywords: false,
        productImages: 0,
        title: 'Error',
        sampleLinks: [],
        error: error.message
      });
    }
  }
  
  // Save results
  fs.writeFileSync(
    'scripts/output/jangsu-category-exploration.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log('\n=== Category Exploration Complete ===');
  console.log('Results:');
  results.forEach(result => {
    console.log(`${result.category}: ${result.productLinks} products found`);
  });
  
  // Find the best category with products
  const bestCategory = results
    .filter(r => r.productLinks > 0)
    .sort((a, b) => b.productLinks - a.productLinks)[0];
  
  if (bestCategory) {
    console.log(`\nBest category found: ${bestCategory.category} with ${bestCategory.productLinks} products`);
    return bestCategory;
  } else {
    console.log('\nNo categories with products found. Will try homepage product extraction.');
    return null;
  }
}

async function testProductPage() {
  console.log('\n=== Testing Individual Product Page ===');
  
  // Test a specific product URL from the homepage analysis
  const testProductUrl = 'https://www.장수몰.com/board/shop/item.php?it_id=1750210211';
  
  try {
    console.log(`Testing product URL: ${testProductUrl}`);
    
    const response = await axios.get(testProductUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract product information
    const title = $('h1, .item_name, .product_name, .goods_name').text().trim() ||
                 $('title').text().replace('| 장수몰', '').trim();
    
    const priceElement = $('.item_price, .price, .cost, .amount');
    const priceText = priceElement.text();
    
    const imageElement = $('.item_photo img, .product_img img, .goods_img img').first();
    const imageUrl = imageElement.attr('src');
    
    console.log('Product Title:', title);
    console.log('Price Text:', priceText);
    console.log('Image URL:', imageUrl);
    
    // Save product page for analysis
    fs.writeFileSync('scripts/output/jangsu-product-sample.html', response.data, 'utf8');
    
    const productTest = {
      url: testProductUrl,
      title,
      priceText,
      imageUrl,
      hasData: !!(title && priceText)
    };
    
    fs.writeFileSync(
      'scripts/output/jangsu-product-test.json',
      JSON.stringify(productTest, null, 2),
      'utf8'
    );
    
    console.log('Product data found:', productTest.hasData);
    return productTest;
    
  } catch (error) {
    console.error('Error testing product page:', error);
    return null;
  }
}

async function main() {
  try {
    const categoryResult = await exploreCategories();
    const productResult = await testProductPage();
    
    console.log('\n=== Exploration Summary ===');
    console.log('Category exploration completed');
    console.log('Product page test completed');
    console.log('Check output files for detailed results');
    
  } catch (error) {
    console.error('Exploration failed:', error);
  }
}

if (require.main === module) {
  main();
}