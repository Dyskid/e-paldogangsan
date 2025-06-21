import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testDonghaeProduct() {
  console.log('🧪 Testing Donghae Mall product page structure...');
  
  const baseUrl = 'https://donghae-mall.com';
  
  try {
    // First, get the homepage and look for actual product view URLs
    console.log('🏠 Getting homepage to find product URLs...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(homepageResponse.data);
    
    // Look for individual product view URLs
    const productUrls: string[] = [];
    
    // Common product view patterns
    $('a[href*="view"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.includes('view') && !href.includes('catalog')) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = baseUrl + href;
        } else if (!href.startsWith('http')) {
          fullUrl = baseUrl + '/' + href;
        }
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    // Also look for goods/view pattern specifically
    $('a[href*="/goods/view"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = baseUrl + href;
        }
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    console.log(`🔍 Found ${productUrls.length} potential product URLs`);
    productUrls.slice(0, 5).forEach(url => console.log(`  ${url}`));

    // If no direct product URLs, try to access a category page and find products there
    if (productUrls.length === 0) {
      console.log('📋 No direct product URLs found, trying category pages...');
      
      // Look for category links
      const categoryUrls: string[] = [];
      $('a[href*="catalog"]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('category')) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = baseUrl + href;
          }
          if (!categoryUrls.includes(fullUrl)) {
            categoryUrls.push(fullUrl);
          }
        }
      });

      if (categoryUrls.length > 0) {
        console.log(`📂 Found ${categoryUrls.length} category URLs, checking first one...`);
        const categoryResponse = await axios.get(categoryUrls[0], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });

        const $cat = cheerio.load(categoryResponse.data);
        
        // Look for product links in category page
        $cat('a[href*="view"]').each((i, elem) => {
          const href = $cat(elem).attr('href');
          if (href && href.includes('view') && !href.includes('catalog')) {
            let fullUrl = href;
            if (href.startsWith('/')) {
              fullUrl = baseUrl + href;
            }
            if (!productUrls.includes(fullUrl)) {
              productUrls.push(fullUrl);
            }
          }
        });

        console.log(`🔍 Found ${productUrls.length} product URLs from category page`);
      }
    }

    // Test the first few product URLs
    const testUrls = productUrls.slice(0, 3);
    
    if (testUrls.length === 0) {
      // Try some common product URL patterns manually
      testUrls.push(
        `${baseUrl}/goods/view?no=1`,
        `${baseUrl}/goods/view?no=100`,
        `${baseUrl}/product/view?no=1`
      );
      console.log('🔧 No product URLs found, trying common patterns...');
    }

    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      console.log(`\n🔍 Testing product ${i + 1}: ${url}`);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });

        const $prod = cheerio.load(response.data);
        
        // Test various selectors for title
        const titleSelectors = [
          '.product-name', '.goods-name', '.item-name',
          'h1', 'h2', '.title', '.name',
          '[class*="name"]', '[class*="title"]',
          '.product_name', '.goods_name'
        ];
        
        console.log('🏷️ Testing title selectors:');
        for (const selector of titleSelectors) {
          const title = $prod(selector).first().text().trim();
          if (title && title.length > 3) {
            console.log(`  ✅ ${selector}: "${title}"`);
          }
        }
        
        // Test various selectors for price
        const priceSelectors = [
          '.price', '.cost', '.amount', '.value',
          '[class*="price"]', '[class*="cost"]', '[class*="amount"]',
          '.product-price', '.goods-price', '.item-price'
        ];
        
        console.log('\n💰 Testing price selectors:');
        for (const selector of priceSelectors) {
          const price = $prod(selector).first().text().trim();
          if (price && (price.includes('원') || price.includes(',') || /\d+/.test(price))) {
            console.log(`  ✅ ${selector}: "${price}"`);
          }
        }
        
        // Test various selectors for image
        const imageSelectors = [
          '.product-image img', '.goods-image img', '.item-image img',
          '.main-image img', '.big-image img', '.detail-image img',
          'img[src*="goods"]', 'img[src*="product"]', 'img[src*="item"]'
        ];
        
        console.log('\n🖼️ Testing image selectors:');
        for (const selector of imageSelectors) {
          const imgSrc = $prod(selector).first().attr('src');
          if (imgSrc) {
            console.log(`  ✅ ${selector}: "${imgSrc}"`);
          }
        }

        // Save this specific product page for analysis
        const outputPath = path.join(__dirname, 'output', `donghae-product-${i + 1}.html`);
        fs.writeFileSync(outputPath, response.data, 'utf-8');
        console.log(`💾 Saved to: ${outputPath}`);
        
        if (i === 0) break; // Test only first URL that works

      } catch (error) {
        console.error(`❌ Error testing ${url}:`, error.message);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

testDonghaeProduct()
  .then(() => {
    console.log('\n🎉 Product testing completed!');
  })
  .catch((error) => {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  });