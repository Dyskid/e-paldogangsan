import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function testOkjMallProduct() {
  try {
    console.log('🔍 Testing OKJ Mall (장흥몰) product structure...');
    
    const baseUrl = 'https://okjmall.com';
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
    };

    // Test homepage first
    console.log('📡 Fetching homepage...');
    const homepageResponse = await axios.get(baseUrl, { headers, timeout: 30000 });
    const $homepage = cheerio.load(homepageResponse.data);

    // Save a portion of homepage for analysis
    fs.writeFileSync(
      path.join(outputDir, 'okjmall-homepage-sample.html'),
      homepageResponse.data.substring(0, 100000)
    );

    // Test different selectors
    const testSelectors = [
      '.goods_list .item_wrap',
      '.item_list .item_wrap',
      '.goods_wrap .item',
      '.product_list .item',
      '.item_wrap',
      '.goods_item',
      '.product_item',
      '.item',
      '.goods',
      '.product',
      '[class*="goods"]',
      '[class*="item"]',
      '[class*="product"]'
    ];

    console.log('🔍 Testing product selectors on homepage:');
    for (const selector of testSelectors) {
      const elements = $homepage(selector);
      console.log(`${selector}: ${elements.length} elements found`);
      
      if (elements.length > 0 && elements.length < 100) {
        console.log(`  Analyzing first element with ${selector}:`);
        const $first = $homepage(elements.first());
        
        console.log(`    HTML length: ${$first.html()?.length || 0}`);
        console.log(`    Text preview: ${$first.text().trim().substring(0, 100)}`);
        console.log(`    Has image: ${$first.find('img').length > 0}`);
        console.log(`    Has link: ${$first.find('a').length > 0}`);
        console.log(`    Has price text: ${$first.text().includes('원') || $first.text().includes('₩')}`);
        
        // Try to extract details
        const imgSrc = $first.find('img').first().attr('src') || '';
        const imgAlt = $first.find('img').first().attr('alt') || '';
        const linkHref = $first.find('a').first().attr('href') || '';
        const titleElements = $first.find('.goods_name, .item_name, .product_name, .name');
        const priceElements = $first.find('.price, .cost, .won, [class*="price"], .item_price, .goods_price');
        
        console.log(`    Image src: "${imgSrc}"`);
        console.log(`    Image alt: "${imgAlt}"`);
        console.log(`    Link href: "${linkHref}"`);
        console.log(`    Title elements found: ${titleElements.length}`);
        console.log(`    Price elements found: ${priceElements.length}`);
        
        if (titleElements.length > 0) {
          titleElements.each((i, el) => {
            console.log(`      Title ${i + 1}: "${$homepage(el).text().trim()}"`);
          });
        }
        
        if (priceElements.length > 0) {
          priceElements.each((i, el) => {
            console.log(`      Price ${i + 1}: "${$homepage(el).text().trim()}"`);
          });
        }
        
        // Save first element HTML for detailed analysis
        fs.writeFileSync(
          path.join(outputDir, `okjmall-element-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.html`),
          $first.html() || ''
        );
        
        if (elements.length > 5) break; // Only analyze promising selectors
      }
    }

    // Look for product URLs manually
    console.log('\n🔍 Looking for product URLs...');
    $homepage('a[href]').each((i, el) => {
      if (i < 10) { // Only show first 10
        const href = $homepage(el).attr('href');
        const text = $homepage(el).text().trim();
        if (href && (href.includes('goods') || href.includes('product') || text.includes('상품'))) {
          console.log(`  Product link ${i + 1}: ${text.substring(0, 50)} -> ${href}`);
        }
      }
    });

    // Test a specific goods URL pattern if it exists
    console.log('\n📂 Testing specific goods URL patterns...');
    const testUrls = [
      `${baseUrl}/goods/goods_view.php?goodsNo=1`,
      `${baseUrl}/goods/goods_view.php?goodsNo=10`,
      `${baseUrl}/goods/goods_list.php`,
      `${baseUrl}/goods/catalog.php`,
      `${baseUrl}/product/`,
      `${baseUrl}/shop/`
    ];

    for (const testUrl of testUrls) {
      try {
        console.log(`📡 Testing: ${testUrl}`);
        const testResponse = await axios.get(testUrl, { 
          headers, 
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (testResponse.status === 200 && testResponse.data.length > 1000) {
          console.log(`  ✅ SUCCESS: ${testUrl} (${testResponse.data.length} chars)`);
          
          // Save a sample for analysis
          fs.writeFileSync(
            path.join(outputDir, `okjmall-test-${testUrl.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '_') || 'page'}.html`),
            testResponse.data.substring(0, 50000)
          );
          
          // Quick analysis of this page
          const $test = cheerio.load(testResponse.data);
          const testProducts = $test('.item_wrap, .goods_item, .product_item');
          if (testProducts.length > 0) {
            console.log(`    Found ${testProducts.length} potential products on this page`);
          }
        } else {
          console.log(`  ❌ FAILED: ${testUrl} - Status ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ERROR: ${testUrl} - ${(error as Error).message}`);
      }
    }

    console.log('\n✅ Test completed. Check output files for detailed HTML analysis.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOkjMallProduct();