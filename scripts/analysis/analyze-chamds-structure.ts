import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeChamdsStructure() {
  console.log('🔍 Analyzing Chamds mall structure for product and price extraction...');
  
  const baseUrl = 'https://chamds.com';
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  
  const analysis = {
    timestamp: new Date().toISOString(),
    baseUrl,
    pages: [],
    productStructure: {},
    pricePatterns: [],
    findings: []
  };

  try {
    // 1. Analyze main page
    console.log('📋 Analyzing main page...');
    const mainResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      httpsAgent,
      timeout: 30000
    });

    const $ = cheerio.load(mainResponse.data);

    // Save HTML for inspection
    writeFileSync('./scripts/output/chamds-main-analysis.html', mainResponse.data);

    // Look for product containers
    const productContainers = $('.item, .product, .goods, [class*="product"], [class*="item"]');
    console.log(`Found ${productContainers.length} potential product containers on main page`);

    // Analyze product structure
    const productStructure = {
      containers: productContainers.length,
      selectors: [],
      priceElements: [],
      linkPatterns: [],
      imagePatterns: []
    };

    productContainers.each((i, elem) => {
      if (i < 10) { // Analyze first 10 products
        const $elem = $(elem);
        
        // Look for product links
        const links = $elem.find('a[href*="product"], a[href*="goods"], a[href*="item"]');
        links.each((j, link) => {
          const href = $(link).attr('href');
          if (href) {
            productStructure.linkPatterns.push(href);
          }
        });

        // Look for price elements
        const priceElements = $elem.find('.price, .cost, [class*="price"], span:contains("원"), strong:contains("원"), em:contains("원")');
        priceElements.each((j, priceElem) => {
          const text = $(priceElem).text().trim();
          const className = $(priceElem).attr('class') || '';
          if (text.includes('원') && /\d/.test(text)) {
            productStructure.priceElements.push({
              selector: priceElem.tagName + (className ? '.' + className.split(' ')[0] : ''),
              text: text,
              html: $(priceElem).html()
            });
          }
        });

        // Look for images
        const images = $elem.find('img');
        images.each((j, img) => {
          const src = $(img).attr('src');
          const alt = $(img).attr('alt');
          if (src) {
            productStructure.imagePatterns.push({
              src: src,
              alt: alt || ''
            });
          }
        });
      }
    });

    analysis.productStructure = productStructure;

    // 2. Look for category/product listing pages
    console.log('📂 Looking for product category pages...');
    const categoryLinks = $('a[href*="category"], a[href*="product"], a[href*="goods"], .menu a, .nav a, [class*="menu"] a');
    const potentialPages = [];

    categoryLinks.each((i, link) => {
      const href = $(link).attr('href');
      const text = $(link).text().trim();
      if (href && text && !href.includes('javascript:') && !href.includes('#')) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        potentialPages.push({
          type: 'category',
          url: fullUrl,
          title: text
        });
      }
    });

    // Remove duplicates and add to analysis
    const uniquePages = potentialPages.filter((page, index, self) =>
      index === self.findIndex(p => p.url === page.url)
    );
    analysis.pages = uniquePages.slice(0, 20); // Limit to first 20 pages

    console.log(`Found ${analysis.pages.length} potential product pages`);

    // 3. Try to access a product listing page
    if (analysis.pages.length > 0) {
      console.log('📦 Analyzing product listing page...');
      
      // Try the first potential category page
      const testPage = analysis.pages[0];
      
      try {
        const listResponse = await axios.get(testPage.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Referer': baseUrl
          },
          httpsAgent,
          timeout: 20000
        });

        const $list = cheerio.load(listResponse.data);
        
        // Save this page for inspection
        writeFileSync('./scripts/output/chamds-category-page.html', listResponse.data);

        // Look for products on this page
        const listProducts = $list('.item, .product, .goods, [class*="product"], [class*="item"]');
        console.log(`Found ${listProducts.length} products on category page: ${testPage.title}`);

        // Analyze price patterns on listing page
        listProducts.each((i, elem) => {
          if (i < 5) { // Analyze first 5 products
            const $elem = $list(elem);
            const priceElements = $elem.find('*').filter((j, el) => {
              const text = $list(el).text();
              return text.includes('원') && /\d{1,3}(?:,\d{3})*원/.test(text);
            });

            priceElements.each((j, priceElem) => {
              const $priceElem = $list(priceElem);
              const text = $priceElem.text().trim();
              const className = $priceElem.attr('class') || '';
              const tagName = priceElem.tagName;
              
              analysis.pricePatterns.push({
                page: 'category',
                tagName,
                className,
                text: text.substring(0, 100),
                selector: `${tagName}${className ? '.' + className.split(' ')[0] : ''}`
              });
            });
          }
        });

      } catch (listError) {
        console.log(`⚠️ Could not access category page: ${listError.message}`);
        analysis.findings.push({
          type: 'error',
          message: `Category page access failed: ${listError.message}`
        });
      }
    }

    // 4. Check for common Korean shopping mall patterns
    console.log('🔄 Checking for common shopping mall patterns...');
    
    // Look for common selectors
    const commonSelectors = [
      '/product_list.php',
      '/goods.php', 
      '/shop/goods.php',
      '/product/',
      '/goods/',
      '/category/',
      '/list/',
      '/shop/'
    ];

    for (const selector of commonSelectors) {
      try {
        const testUrl = baseUrl + selector;
        const testResponse = await axios.head(testUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          httpsAgent,
          timeout: 10000
        });
        
        if (testResponse.status === 200) {
          analysis.findings.push({
            type: 'accessible_endpoint',
            url: testUrl,
            status: testResponse.status
          });
        }
      } catch (e) {
        // Endpoint not accessible, which is normal
      }
    }

  } catch (error) {
    console.error(`❌ Error analyzing structure: ${error.message}`);
    analysis.findings.push({
      type: 'error',
      message: error.message
    });
  }

  // Save analysis results
  writeFileSync('./scripts/output/chamds-structure-analysis.json', JSON.stringify(analysis, null, 2));

  console.log('\n📊 Structure Analysis Summary:');
  console.log(`🏪 Product containers found: ${analysis.productStructure.containers || 0}`);
  console.log(`💰 Price patterns identified: ${analysis.pricePatterns.length}`);
  console.log(`📂 Product pages found: ${analysis.pages.length}`);
  console.log(`🔍 Findings recorded: ${analysis.findings.length}`);

  if (analysis.pricePatterns.length > 0) {
    console.log('\n💰 Sample price patterns:');
    analysis.pricePatterns.slice(0, 5).forEach((pattern, i) => {
      console.log(`  ${i + 1}. ${pattern.selector}: ${pattern.text}`);
    });
  }

  return analysis;
}

// Run the analysis
analyzeChamdsStructure()
  .then(() => console.log('\n✅ Chamds structure analysis completed!'))
  .catch(console.error);