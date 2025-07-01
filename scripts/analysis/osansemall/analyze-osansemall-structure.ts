import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryInfo {
  name: string;
  url: string;
  productCount?: number;
}

async function analyzeOsansemallStructure() {
  try {
    console.log('📋 Fetching osansemall.com homepage...');
    
    const response = await axios.get('http://www.osansemall.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 30000,
      maxRedirects: 5,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Save homepage for debugging
    fs.writeFileSync(
      path.join(__dirname, 'output', 'osansemall-homepage.html'),
      html
    );
    
    console.log('🔍 Analyzing page structure...');
    
    // Extract categories from navigation
    const categories: CategoryInfo[] = [];
    
    // Look for navigation menus - common patterns
    const navSelectors = [
      '.gnb a', '.menu a', '.nav a', '.category a',
      'nav a', '[class*="menu"] a', '[class*="nav"] a',
      '.header a', '#header a', '.top_menu a',
      'ul.nav a', 'ul.menu a', 'div.category a'
    ];
    
    for (const selector of navSelectors) {
      $(selector).each((_, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        if (href && text && !href.startsWith('#') && !href.includes('javascript:')) {
          const fullUrl = href.startsWith('http') 
            ? href 
            : `http://www.osansemall.com${href.startsWith('/') ? '' : '/'}${href}`;
          
          // Filter out non-product links
          if (!href.includes('login') && !href.includes('join') && 
              !href.includes('member') && !href.includes('cart') &&
              !href.includes('order') && !href.includes('mypage') &&
              !href.includes('board') && !href.includes('notice')) {
            categories.push({ name: text, url: fullUrl });
          }
        }
      });
    }
    
    // Look for product listing patterns
    const productSelectors = [
      '.product', '.item', '.goods', '.prd',
      '[class*="product"]', '[class*="item"]', '[class*="goods"]',
      '.list_item', '.product_list', '.goods_list',
      'li.item', 'div.item', 'td.item'
    ];
    
    let productElements = 0;
    let foundProductSelector = '';
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > productElements) {
        productElements = elements.length;
        foundProductSelector = selector;
      }
    }
    
    console.log(`Found ${productElements} potential product elements with selector: ${foundProductSelector}`);
    
    // Check for product URLs
    const productUrls: string[] = [];
    $('a[href*="product"], a[href*="goods"], a[href*="item"], a[href*="detail"], a[href*="view"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.startsWith('#') && !href.includes('javascript:')) {
        const fullUrl = href.startsWith('http') 
          ? href 
          : `http://www.osansemall.com${href.startsWith('/') ? '' : '/'}${href}`;
        productUrls.push(fullUrl);
      }
    });
    
    // Look for price elements
    const priceSelectors = [
      '.price', '.cost', '[class*="price"]', '[class*="cost"]',
      'span:contains("원")', 'div:contains("원")', 'td:contains("원")'
    ];
    
    let priceElements = 0;
    for (const selector of priceSelectors) {
      try {
        const elements = $(selector);
        priceElements += elements.length;
      } catch (e) {
        // Skip invalid selectors
      }
    }
    
    // Check for pagination
    const paginationExists = $('.pagination, .paging, [class*="page"]').length > 0;
    
    // Look for form or search functionality
    const hasSearchForm = $('form[action*="search"], input[name*="search"]').length > 0;
    
    // Check for common shopping mall indicators
    const indicators = {
      hasCart: $('[href*="cart"], [class*="cart"]').length > 0,
      hasLogin: $('[href*="login"], [class*="login"]').length > 0,
      hasMember: $('[href*="member"], [class*="member"]').length > 0,
      hasOrder: $('[href*="order"], [class*="order"]').length > 0,
      hasMypage: $('[href*="mypage"], [class*="mypage"]').length > 0
    };
    
    // Save analysis results
    const analysis = {
      mallName: '오산함께장터',
      baseUrl: 'http://www.osansemall.com',
      categories: [...new Set(categories.map(c => c.url))].map(url => 
        categories.find(c => c.url === url)!
      ),
      productElementsFound: productElements,
      productSelector: foundProductSelector,
      sampleProductUrls: productUrls.slice(0, 10),
      priceElementsFound: priceElements,
      hasPagination: paginationExists,
      hasSearchForm,
      indicators,
      pageTitle: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content'),
      isEcommerce: productElements > 0 || priceElements > 0 || indicators.hasCart
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'output', 'osansemall-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n📊 Analysis Summary:');
    console.log(`Page Title: ${analysis.pageTitle}`);
    console.log(`Categories found: ${analysis.categories.length}`);
    console.log(`Product elements: ${productElements}`);
    console.log(`Price elements: ${priceElements}`);
    console.log(`Product URLs found: ${productUrls.length}`);
    console.log(`Is e-commerce: ${analysis.isEcommerce}`);
    console.log(`Has search form: ${hasSearchForm}`);
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing mall:', error);
    throw error;
  }
}

// Run the analysis
analyzeOsansemallStructure()
  .then(() => console.log('\n✅ Initial analysis complete'))
  .catch(error => console.error('❌ Analysis failed:', error));