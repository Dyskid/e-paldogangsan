import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function testHaegaramProduct() {
  try {
    // Test a specific product URL
    const productUrl = 'https://haegaram.com/product/부안수협뽕잎간고등어10미/38/category/23/display/1/';
    
    console.log('Fetching product:', productUrl);
    const response = await axios.get(productUrl, {
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
    
    const html = response.data;
    await fs.writeFile('scripts/output/haegaram-test-product.html', html);
    
    const $ = cheerio.load(html);
    
    console.log('\nTesting selectors...');
    
    // Test various title selectors
    const titleSelectors = [
      '.headingArea h2',
      '.headingArea h3',
      '.infoArea h2',
      '.infoArea h3',
      'h1',
      'h2',
      'h3',
      '.product_name',
      '.name',
      '.title',
      '.prd-name',
      '.item_name',
      '.goods_name',
      '.xans-product-detail .name',
      '[class*="product_name"]',
      '[class*="item_name"]'
    ];
    
    console.log('\nTitle selectors:');
    for (const selector of titleSelectors) {
      const elem = $(selector);
      if (elem.length > 0) {
        console.log(`  ${selector}: Found ${elem.length} elements`);
        elem.each((i, el) => {
          const text = $(el).text().trim();
          if (text) {
            console.log(`    [${i}]: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          }
        });
      }
    }
    
    // Test price selectors
    const priceSelectors = [
      '#span_product_price_text',
      '#span_product_price_sale',
      '.price',
      '.product-price',
      '.selling-price',
      '.sale-price',
      '.real-price',
      'span[class*="price"]',
      'div[class*="price"]',
      '.xans-product-detail .price',
      '.infoArea .price',
      '[id*="product_price"]',
      'strong:contains("원")',
      'span:contains("원")'
    ];
    
    console.log('\nPrice selectors:');
    for (const selector of priceSelectors) {
      const elem = $(selector);
      if (elem.length > 0 && elem.length < 10) { // Limit to avoid too many matches
        console.log(`  ${selector}: Found ${elem.length} elements`);
        elem.each((i, el) => {
          const text = $(el).text().trim();
          if (text && text.includes('원')) {
            console.log(`    [${i}]: "${text}"`);
          }
        });
      }
    }
    
    // Test image selectors
    const imageSelectors = [
      '.bigImage img',
      '.keyImg img',
      '.imgArea img',
      '.product-image img',
      '.detail-image img',
      '#prdDetail img',
      '.xans-product-image img',
      'img[alt*="상품"]',
      'img[src*="/product/"]',
      '.thumbnail img'
    ];
    
    console.log('\nImage selectors:');
    for (const selector of imageSelectors) {
      const elem = $(selector);
      if (elem.length > 0 && elem.length < 5) { // Limit to first few images
        console.log(`  ${selector}: Found ${elem.length} elements`);
        elem.each((i, el) => {
          const src = $(el).attr('src');
          const alt = $(el).attr('alt');
          if (src) {
            console.log(`    [${i}]: src="${src.substring(0, 50)}${src.length > 50 ? '...' : ''}" alt="${alt || ''}"`);
          }
        });
      }
    }
    
    // Look for structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      console.log('\nFound structured data:');
      jsonLdScripts.each((i, script) => {
        try {
          const data = JSON.parse($(script).html() || '{}');
          console.log(`  Script ${i}:`, JSON.stringify(data, null, 2).substring(0, 500));
        } catch (e) {
          console.log(`  Script ${i}: Failed to parse`);
        }
      });
    }
    
    // Check meta tags
    console.log('\nMeta tags:');
    $('meta[property^="og:"], meta[name^="twitter:"]').each((_, meta) => {
      const property = $(meta).attr('property') || $(meta).attr('name');
      const content = $(meta).attr('content');
      if (property && content) {
        console.log(`  ${property}: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testHaegaramProduct();