import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function testShinan1004Product() {
  try {
    console.log('🔍 Testing Shinan 1004 Mall product structure...');
    
    const baseUrl = 'https://shinan1004mall.kr';
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
      path.join(outputDir, 'shinan1004-homepage-sample.html'),
      homepageResponse.data.substring(0, 50000)
    );

    // Test different selectors
    const testSelectors = [
      '.xans-product-listmain .xans-record-',
      '.prdList .xans-record-',
      '.xans-product-normalpackage .xans-record-',
      '.main_prd_list .item',
      '.goods_list .item',
      '.product_list .item',
      '.item_list .item',
      '.prd_item',
      '.goods_item',
      '.product_item'
    ];

    console.log('🔍 Testing product selectors on homepage:');
    for (const selector of testSelectors) {
      const elements = $homepage(selector);
      console.log(`${selector}: ${elements.length} elements found`);
      
      if (elements.length > 0 && elements.length < 50) {
        console.log(`  Analyzing first element with ${selector}:`);
        const $first = $homepage(elements.first());
        
        console.log(`    HTML length: ${$first.html()?.length || 0}`);
        console.log(`    Text preview: ${$first.text().trim().substring(0, 100)}`);
        console.log(`    Has image: ${$first.find('img').length > 0}`);
        console.log(`    Has link: ${$first.find('a').length > 0}`);
        console.log(`    Has price text: ${$first.text().includes('원') || $first.text().includes('₩')}`);
        
        // Try to extract details
        const imgAlt = $first.find('img').first().attr('alt') || '';
        const imgSrc = $first.find('img').first().attr('src') || '';
        const linkHref = $first.find('a').first().attr('href') || '';
        const priceElements = $first.find('.price, .cost, li.product_price, .won, [class*="price"]');
        
        console.log(`    Image alt: "${imgAlt}"`);
        console.log(`    Image src: "${imgSrc}"`);
        console.log(`    Link href: "${linkHref}"`);
        console.log(`    Price elements found: ${priceElements.length}`);
        
        if (priceElements.length > 0) {
          priceElements.each((i, el) => {
            console.log(`      Price ${i + 1}: "${$homepage(el).text().trim()}"`);
          });
        }
        
        // Save first element HTML for detailed analysis
        fs.writeFileSync(
          path.join(outputDir, `shinan1004-element-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.html`),
          $first.html() || ''
        );
        
        break; // Only analyze the first working selector
      }
    }

    // Test a category page
    console.log('\n📂 Testing category page...');
    const categoryUrl = `${baseUrl}/category/농산물/24/`;
    
    try {
      const categoryResponse = await axios.get(categoryUrl, { headers, timeout: 15000 });
      const $category = cheerio.load(categoryResponse.data);
      
      // Save category page sample
      fs.writeFileSync(
        path.join(outputDir, 'shinan1004-category-sample.html'),
        categoryResponse.data.substring(0, 50000)
      );
      
      console.log(`Category page loaded successfully (${categoryResponse.data.length} chars)`);
      
      // Test selectors on category page
      for (const selector of testSelectors) {
        const elements = $category(selector);
        if (elements.length > 0) {
          console.log(`Category ${selector}: ${elements.length} elements found`);
          
          if (elements.length > 0) {
            const $first = $category(elements.first());
            console.log(`  First element text: ${$first.text().trim().substring(0, 150)}`);
            
            // Try to extract detailed info from first product
            const imgAlt = $first.find('img').first().attr('alt') || '';
            const priceText = $first.find('.price, .cost, li.product_price, .won').first().text().trim();
            const linkHref = $first.find('a').first().attr('href') || '';
            
            console.log(`  Image alt: "${imgAlt}"`);
            console.log(`  Price text: "${priceText}"`);
            console.log(`  Link: "${linkHref}"`);
            
            break;
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed to load category page: ${(error as Error).message}`);
    }

    // Try to find a specific product URL and test it
    console.log('\n🔍 Looking for product URLs...');
    $homepage('a[href*="product"], a[href*="goods"]').each((i, el) => {
      if (i < 5) { // Only show first 5
        const href = $homepage(el).attr('href');
        const text = $homepage(el).text().trim();
        console.log(`  Product link ${i + 1}: ${text.substring(0, 50)} -> ${href}`);
      }
    });

    console.log('\n✅ Test completed. Check output files for detailed HTML analysis.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShinan1004Product();