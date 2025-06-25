import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testCategoryPage() {
  console.log('=== Testing 장수몰 Category Page ===');
  
  // Test one of the main categories (사과 category)
  const testUrl = 'https://www.장수몰.com/board/shop/list.php?ca_id=101010';
  
  try {
    console.log(`Testing URL: ${testUrl}`);
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    console.log('Page Title:', $('title').text());
    
    // Save the page for analysis
    fs.writeFileSync('scripts/output/jangsu-category-sample.html', response.data, 'utf8');
    
    console.log('\n=== Product Listing Analysis ===');
    
    // Look for product containers
    const productSelectors = [
      '.product', '.goods', '.item', '.prod',
      '.product-item', '.goods-item', '.item-box',
      '.product-list li', '.goods-list li',
      '.shop-item', '.shop-goods',
      '[class*="product"]', '[class*="goods"]', '[id*="product"]',
      '.sct_li', '.li_item'
    ];
    
    let foundProducts: Array<{
      selector: string;
      count: number;
      sampleTitle: string;
      samplePrice: string;
      sampleLink: string;
    }> = [];
    
    productSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        const firstElement = elements.first();
        const title = firstElement.find('*').text().trim() || firstElement.text().trim();
        const price = firstElement.find('*').text().match(/\d+(?:,\d{3})*원?/) || [''];
        const link = firstElement.find('a').attr('href') || '';
        
        foundProducts.push({
          selector,
          count: elements.length,
          sampleTitle: title.substring(0, 50),
          samplePrice: price[0],
          sampleLink: link
        });
      }
    });
    
    console.log('Product containers found:');
    foundProducts.forEach(product => {
      console.log(`  ${product.selector}: ${product.count} items`);
      if (product.sampleTitle) {
        console.log(`    Sample: ${product.sampleTitle}`);
      }
      if (product.samplePrice) {
        console.log(`    Price: ${product.samplePrice}`);
      }
      if (product.sampleLink) {
        console.log(`    Link: ${product.sampleLink}`);
      }
    });
    
    // Look for pagination
    console.log('\n=== Pagination Analysis ===');
    const paginationSelectors = [
      '.pagination', '.paging', '.page', '.pageNum',
      'a[href*="page"]', 'a[href*="pageNum"]',
      '.next', '.prev', '.first', '.last',
      '.pg_page'
    ];
    
    let paginationInfo: Array<{selector: string, count: number}> = [];
    
    paginationSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        paginationInfo.push({ selector, count: elements.length });
      }
    });
    
    console.log('Pagination elements:', paginationInfo);
    
    // Extract all product links
    console.log('\n=== Product Link Extraction ===');
    const productLinks: Array<{text: string, url: string}> = [];
    
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && href.includes('item.php?it_id=')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.장수몰.com${href}`;
        productLinks.push({ text, url: fullUrl });
      }
    });
    
    console.log(`Found ${productLinks.length} potential product links`);
    productLinks.slice(0, 10).forEach((link, index) => {
      console.log(`  ${index + 1}. ${link.text} -> ${link.url}`);
    });
    
    // Create test summary
    const testSummary = {
      timestamp: new Date().toISOString(),
      testUrl,
      pageTitle: $('title').text(),
      foundProducts,
      paginationInfo,
      productLinks: productLinks.slice(0, 20),
      recommendations: []
    };
    
    if (foundProducts.length > 0) {
      testSummary.recommendations.push('Product containers identified - can extract product data');
    }
    if (paginationInfo.length > 0) {
      testSummary.recommendations.push('Pagination detected - need to handle multiple pages');
    }
    if (productLinks.length > 0) {
      testSummary.recommendations.push('Product detail links found - can scrape individual products');
    }
    
    fs.writeFileSync(
      'scripts/output/jangsu-category-test-results.json',
      JSON.stringify(testSummary, null, 2),
      'utf8'
    );
    
    console.log('\n=== Test Complete ===');
    console.log('Results saved to jangsu-category-test-results.json');
    
    return testSummary;
    
  } catch (error) {
    console.error('Error testing category page:', error);
    throw error;
  }
}

async function main() {
  try {
    await testCategoryPage();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}