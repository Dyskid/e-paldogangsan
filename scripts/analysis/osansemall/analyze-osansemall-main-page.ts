import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeOsansemallMainPage() {
  try {
    console.log('🔍 Analyzing osansemall main page for products...');
    
    const response = await axios.get('http://www.osansemall.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('🔍 Looking for product links on main page...');
    
    // Look for any goods links
    const productLinks: Array<{href: string, text: string, context: string}> = [];
    
    $('a').each((_, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().trim();
      const parent = $link.parent().text().trim();
      
      if (href && (
          href.includes('goods') ||
          href.includes('product') ||
          href.includes('item') ||
          href.includes('view') ||
          href.includes('detail')
        ) && !href.includes('catalog') && !href.includes('search')) {
        
        productLinks.push({
          href: href.startsWith('http') ? href : `http://www.osansemall.com${href}`,
          text,
          context: parent.substring(0, 100)
        });
      }
    });
    
    console.log(`🔗 Found ${productLinks.length} potential product links`);
    productLinks.slice(0, 10).forEach((link, idx) => {
      console.log(`${idx + 1}. ${link.text}: ${link.href}`);
    });
    
    // Look for specific product sections
    const productSections = [
      '.goods-list', '.product-list', '.item-list',
      '.main-goods', '.featured-products', '.new-products',
      '[class*="goods"]', '[class*="product"]', '[class*="item"]'
    ];
    
    for (const selector of productSections) {
      const section = $(selector);
      if (section.length > 0) {
        console.log(`\n📦 Found section with selector: ${selector} (${section.length} elements)`);
        
        section.each((idx, elem) => {
          const $section = $(elem);
          const links = $section.find('a');
          const images = $section.find('img');
          const text = $section.text().trim().substring(0, 200);
          
          console.log(`  Section ${idx + 1}: ${links.length} links, ${images.length} images`);
          console.log(`  Text: ${text}`);
        });
      }
    }
    
    // Try to find a specific product page pattern
    if (productLinks.length > 0) {
      console.log('\n🔍 Testing first product link...');
      const testLink = productLinks[0];
      
      try {
        const productResponse = await axios.get(testLink.href, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 15000,
        });
        
        const productPage = cheerio.load(productResponse.data);
        
        // Look for price information
        const priceElements = productPage('.price, .cost, [class*="price"]');
        const priceText = priceElements.text();
        
        console.log(`💰 Price elements found: ${priceElements.length}`);
        console.log(`💰 Price text: ${priceText.substring(0, 100)}`);
        
        // Look for product name
        const nameElements = productPage('h1, h2, h3, .product-name, .goods-name, [class*="name"]');
        console.log(`📝 Name elements: ${nameElements.length}`);
        
        // Look for images
        const imageElements = productPage('img');
        console.log(`🖼️ Images: ${imageElements.length}`);
        
        // Save sample product page
        fs.writeFileSync(
          path.join(__dirname, 'output', 'osansemall-sample-product.html'),
          productResponse.data
        );
        
      } catch (error) {
        console.log(`❌ Error testing product link: ${error.message}`);
      }
    }
    
    // Save results
    const analysis = {
      productLinksFound: productLinks.length,
      productLinks: productLinks.slice(0, 20),
      analyzedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'output', 'osansemall-main-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing main page:', error);
    throw error;
  }
}

// Run the analysis
analyzeOsansemallMainPage()
  .then(() => console.log('\n✅ Main page analysis complete'))
  .catch(error => console.error('❌ Analysis failed:', error));