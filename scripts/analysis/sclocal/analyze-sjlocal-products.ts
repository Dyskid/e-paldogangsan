import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeSjlocalProducts() {
  try {
    console.log('📋 Fetching sjlocal product search page...');
    
    const response = await axios.get('https://www.sjlocal.or.kr/sj/search_product', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 30000,
      maxRedirects: 5,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Save product page for debugging
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-product-page.html'),
      html
    );
    
    console.log('🔍 Analyzing product page structure...');
    
    // Look for product containers
    const productSelectors = [
      '.product', '.item', '.goods', 
      '[class*="product"]', '[class*="item"]', '[class*="goods"]',
      '.card', '.box', '.list-item',
      'article', '.article', 'li'
    ];
    
    let productsFound = false;
    let productData: any[] = [];
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        // Try to extract product information
        elements.each((index, elem) => {
          if (index < 5) { // Analyze first 5 items
            const $elem = $(elem);
            const text = $elem.text().trim();
            const html = $elem.html();
            
            // Look for product indicators
            const hasPrice = text.match(/[0-9,]+원/) || html?.includes('price') || html?.includes('원');
            const hasImage = $elem.find('img').length > 0;
            const hasLink = $elem.find('a').length > 0;
            
            if (hasPrice || hasImage) {
              productsFound = true;
              
              const product = {
                selector,
                index,
                hasPrice,
                hasImage,
                hasLink,
                priceText: text.match(/[0-9,]+원/)?.[0],
                imageUrl: $elem.find('img').first().attr('src'),
                linkUrl: $elem.find('a').first().attr('href'),
                title: $elem.find('h1, h2, h3, h4, h5, h6, .title, .name').first().text().trim() || 
                       $elem.find('a').first().text().trim() ||
                       text.substring(0, 50)
              };
              
              productData.push(product);
            }
          }
        });
        
        if (productsFound) break;
      }
    }
    
    // Look for AJAX endpoints
    const scripts = $('script').map((_, elem) => $(elem).html()).get().join('\n');
    const ajaxPatterns = [
      /ajax.*url.*['"](.*?)['"]/gi,
      /fetch\s*\(['"](.*?)['"]/gi,
      /axios.*['"](.*?)['"]/gi,
      /\.post\s*\(['"](.*?)['"]/gi,
      /\.get\s*\(['"](.*?)['"]/gi,
      /api.*['"](.*?)['"]/gi
    ];
    
    const endpoints: Set<string> = new Set();
    ajaxPatterns.forEach(pattern => {
      const matches = scripts.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          endpoints.add(match[1]);
        }
      }
    });
    
    // Check for forms
    const forms = $('form');
    const formData: any[] = [];
    
    forms.each((_, elem) => {
      const $form = $(elem);
      formData.push({
        action: $form.attr('action'),
        method: $form.attr('method'),
        id: $form.attr('id'),
        class: $form.attr('class')
      });
    });
    
    // Check for pagination
    const paginationSelectors = [
      '.pagination', '.paging', '.page-link',
      '[class*="page"]', 'nav[aria-label*="pagination"]'
    ];
    
    let hasPagination = false;
    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        hasPagination = true;
        break;
      }
    }
    
    // Save analysis results
    const analysis = {
      pageUrl: 'https://www.sjlocal.or.kr/sj/search_product',
      productsFound,
      productData,
      totalProductElements: productData.length,
      possibleEndpoints: Array.from(endpoints),
      forms: formData,
      hasPagination,
      pageStructure: {
        hasTable: $('table').length > 0,
        hasGrid: $('.grid, .row, .col').length > 0,
        hasList: $('ul, ol').length > 0,
        hasCards: $('.card').length > 0
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-product-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n📊 Product Page Analysis:');
    console.log(`Products found: ${productsFound}`);
    console.log(`Product elements analyzed: ${productData.length}`);
    console.log(`Possible AJAX endpoints: ${endpoints.size}`);
    console.log(`Forms found: ${forms.length}`);
    console.log(`Has pagination: ${hasPagination}`);
    
    if (endpoints.size > 0) {
      console.log('\n🔗 Possible endpoints:');
      endpoints.forEach(endpoint => console.log(`  - ${endpoint}`));
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing products:', error);
    throw error;
  }
}

// Run the analysis
analyzeSjlocalProducts()
  .then(() => console.log('\n✅ Product analysis complete'))
  .catch(error => console.error('❌ Analysis failed:', error));