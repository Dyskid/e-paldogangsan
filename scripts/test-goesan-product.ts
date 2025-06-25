import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testGoesanProduct() {
  console.log('🧪 Testing Goesan Marketplace product page structure...');
  
  // Test a specific product URL
  const testUrl = 'https://www.gsjangter.go.kr/products/view/G2000484012';
  
  try {
    const response = await axios.get(testUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('📄 Page title:', $('title').text());
    
    // Test various selectors for product information
    const selectors = {
      title: [
        'h1',
        '.product-name',
        '.product_name',
        '.goods-name',
        '.goods_name',
        '.item-name',
        '.item_name',
        '.prdName',
        '.product-title',
        '.product_title',
        '.title',
        'h2',
        'h3',
        '.name',
        '.product-info h1',
        '.product-info .name',
        '.detail-name',
        '.detail-title'
      ],
      price: [
        '.price',
        '.product-price',
        '.product_price',
        '.goods-price',
        '.goods_price',
        '.item-price',
        '.item_price',
        '.prdPrice',
        '.sale-price',
        '.sale_price',
        '.selling-price',
        '.selling_price',
        '.cost',
        '.amount',
        '.won',
        '.money',
        'span[class*="price"]',
        'div[class*="price"]',
        '.price-box',
        '.price_box',
        '.final-price',
        '.current-price'
      ],
      image: [
        '.product-image img',
        '.product_image img',
        '.goods-image img',
        '.goods_image img',
        '.item-image img',
        '.item_image img',
        '.prdImg img',
        '.main-image img',
        '.main_image img',
        '.thumbnail img',
        '.product-thumb img',
        '.product_thumb img',
        '#product-image img',
        '#product_image img',
        '.zoom img',
        'img[src*="product"]',
        'img[src*="goods"]',
        'img[src*="item"]',
        '.detail-image img'
      ]
    };

    console.log('\n🔍 Testing selectors:');
    
    // Test title selectors
    console.log('\n📝 Title selectors:');
    for (const selector of selectors.title) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) {
          console.log(`✅ ${selector}: "${text}"`);
        }
      }
    }

    // Test price selectors
    console.log('\n💰 Price selectors:');
    for (const selector of selectors.price) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) {
          console.log(`✅ ${selector}: "${text}"`);
        }
      }
    }

    // Test image selectors
    console.log('\n🖼️ Image selectors:');
    for (const selector of selectors.image) {
      const element = $(selector).first();
      if (element.length > 0) {
        const src = element.attr('src');
        if (src) {
          console.log(`✅ ${selector}: "${src}"`);
        }
      }
    }

    // Save HTML for manual inspection
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/goesan-product-sample.html',
      response.data
    );
    console.log('\n💾 HTML saved to: goesan-product-sample.html');

    // Try to extract the product ID from URL patterns
    const urlPatterns = [
      /products\/view\/([A-Z0-9]+)/,
      /product_id=([A-Z0-9]+)/,
      /goods_no=([A-Z0-9]+)/,
      /item_id=([A-Z0-9]+)/
    ];

    console.log('\n🔗 URL pattern analysis:');
    for (const pattern of urlPatterns) {
      const match = testUrl.match(pattern);
      if (match) {
        console.log(`✅ Pattern ${pattern} matches: ${match[1]}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error testing product page:', error.message);
  }
}

// Run the test
testGoesanProduct().catch(console.error);