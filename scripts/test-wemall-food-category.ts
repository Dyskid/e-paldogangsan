import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function testWemallFoodCategory(): Promise<void> {
  try {
    console.log('🔍 Testing wemall food category (001)...');
    
    // Test with food category which is more likely to have products
    const testUrl = 'https://wemall.kr/product/product.html?category=001';
    
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

    console.log(`✅ Successfully fetched food category (${response.status})`);
    
    const $ = cheerio.load(response.data);
    
    // Save HTML for analysis
    writeFileSync('./scripts/output/wemall-category-001.html', response.data);
    console.log('💾 Saved food category HTML');

    console.log(`📋 Page title: ${$('title').text().trim()}`);

    // Search more specifically for table-based layout which is common in older Korean malls
    const tableCells = $('table td');
    console.log(`📊 Found ${tableCells.length} table cells`);

    // Look for links containing product view
    const viewLinks = $('a[href*="mode=view"]');
    console.log(`🔗 Found ${viewLinks.length} product view links`);

    if (viewLinks.length > 0) {
      console.log('\n📦 Sample product links:');
      viewLinks.slice(0, 10).each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const text = $elem.text().trim();
        const fullUrl = href?.startsWith('http') ? href : `https://wemall.kr${href}`;
        
        console.log(`  ${i + 1}. ${text.substring(0, 40)}... → ${fullUrl}`);
      });
    }

    // Look for images that might be product thumbnails
    const images = $('img[src*="upload"], img[src*="thumb"], img[src*="product"]');
    console.log(`🖼️ Found ${images.length} potential product images`);

    // Look for table structure more specifically
    const productTables = $('table[cellpadding], table[border], table[width]');
    console.log(`📋 Found ${productTables.length} structured tables`);

    if (productTables.length > 0) {
      console.log('\n📋 Analyzing table structure:');
      productTables.each((i, table) => {
        const $table = $(table);
        const rows = $table.find('tr');
        const cells = $table.find('td');
        const links = $table.find('a[href*="mode=view"]');
        
        console.log(`  Table ${i + 1}: ${rows.length} rows, ${cells.length} cells, ${links.length} product links`);
        
        if (links.length > 0) {
          console.log(`    First product link: ${links.first().attr('href')}`);
        }
      });
    }

    // Check for pagination specifically
    const pageLinks = $('a[href*="page="]');
    console.log(`📄 Found ${pageLinks.length} pagination links`);

    if (pageLinks.length > 0) {
      console.log('\n📄 Pagination structure:');
      pageLinks.slice(0, 5).each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        console.log(`  ${text}: ${href}`);
      });
    }

    // Look for any JavaScript that might load products dynamically
    const scripts = $('script').map((i, elem) => $(elem).html()).get();
    const hasAjax = scripts.some(script => script && (script.includes('ajax') || script.includes('xhr')));
    console.log(`⚡ AJAX loading detected: ${hasAjax}`);

  } catch (error) {
    console.error('❌ Error testing food category:', error);
  }
}

// Run test
testWemallFoodCategory().then(() => {
  console.log('✅ Food category test complete!');
}).catch(console.error);