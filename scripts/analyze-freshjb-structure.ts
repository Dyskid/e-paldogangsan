import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeHomepage() {
  console.log('=== Analyzing 전북생생장터 (freshjb.com) Homepage ===');
  
  try {
    const response = await axios.get('https://freshjb.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Save homepage HTML
    fs.writeFileSync('scripts/output/freshjb-homepage.html', response.data, 'utf8');
    
    console.log('Page Title:', $('title').text());
    console.log('Meta Description:', $('meta[name="description"]').attr('content'));
    
    // Look for navigation menus and category links
    console.log('\n=== Navigation Analysis ===');
    
    const navigationSelectors = [
      '.menu', '.nav', '.navigation', '.gnb', '.lnb', '.category',
      '#menu', '#nav', '#navigation', '#gnb', '#lnb', '#category',
      '.main-menu', '.main-nav', '.primary-menu', '.header-menu',
      '.product-category', '.shop-category', '.category-menu'
    ];
    
    let foundCategories: Array<{name: string, url: string}> = [];
    
    navigationSelectors.forEach(selector => {
      $(selector).find('a').each((index, element) => {
        const link = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (link && text && text.length > 0) {
          // Look for product/shop related links
          if (link.includes('product') || link.includes('shop') || link.includes('goods') || 
              link.includes('item') || text.includes('상품') || text.includes('제품') ||
              text.includes('농산물') || text.includes('특산품')) {
            const fullUrl = link.startsWith('http') ? link : `https://freshjb.com${link}`;
            foundCategories.push({ name: text, url: fullUrl });
          }
        }
      });
    });
    
    // Look for direct product links
    console.log('\n=== Product Link Analysis ===');
    const productSelectors = [
      'a[href*="product"]', 'a[href*="goods"]', 'a[href*="item"]', 'a[href*="shop"]',
      '.product a', '.goods a', '.item a', '.shop a'
    ];
    
    let productLinks: Array<{text: string, url: string}> = [];
    
    productSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const link = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (link && text) {
          const fullUrl = link.startsWith('http') ? link : `https://freshjb.com${link}`;
          productLinks.push({ text, url: fullUrl });
        }
      });
    });
    
    // Look for common e-commerce patterns
    console.log('\n=== E-commerce Platform Detection ===');
    const bodyHtml = response.data.toLowerCase();
    
    let platform = 'Unknown';
    if (bodyHtml.includes('cafe24')) {
      platform = 'CAFE24';
    } else if (bodyHtml.includes('makeshop')) {
      platform = 'MakeShop';
    } else if (bodyHtml.includes('wordpress') || bodyHtml.includes('woocommerce')) {
      platform = 'WordPress/WooCommerce';
    } else if (bodyHtml.includes('shopify')) {
      platform = 'Shopify';
    } else if (bodyHtml.includes('godo')) {
      platform = 'GoDoMall';
    }
    
    console.log('Detected Platform:', platform);
    
    // Look for specific URL patterns
    console.log('\n=== URL Pattern Analysis ===');
    const allLinks = $('a').map((index, element) => $(element).attr('href')).get();
    const uniqueLinks = [...new Set(allLinks)].filter(link => link && link.startsWith('/'));
    
    const patterns = {
      products: uniqueLinks.filter(link => 
        link.includes('product') || link.includes('goods') || link.includes('item')
      ),
      categories: uniqueLinks.filter(link => 
        link.includes('category') || link.includes('list') || link.includes('cate')
      ),
      shops: uniqueLinks.filter(link => 
        link.includes('shop') || link.includes('store')
      )
    };
    
    console.log('Product URL patterns:', patterns.products.slice(0, 10));
    console.log('Category URL patterns:', patterns.categories.slice(0, 10));
    console.log('Shop URL patterns:', patterns.shops.slice(0, 10));
    
    // Create analysis summary
    const analysis = {
      timestamp: new Date().toISOString(),
      mall: '전북생생장터',
      url: 'https://freshjb.com/',
      platform: platform,
      title: $('title').text(),
      foundCategories: foundCategories.slice(0, 20),
      productLinks: productLinks.slice(0, 20),
      urlPatterns: patterns,
      recommendations: []
    };
    
    // Add recommendations based on findings
    if (foundCategories.length > 0) {
      analysis.recommendations.push('Category links found - explore these for product listings');
    }
    if (productLinks.length > 0) {
      analysis.recommendations.push('Direct product links found - can extract product details');
    }
    if (patterns.products.length > 0) {
      analysis.recommendations.push('Product URL patterns identified - use for systematic scraping');
    }
    
    // Save analysis
    fs.writeFileSync(
      'scripts/output/freshjb-structure-analysis.json',
      JSON.stringify(analysis, null, 2),
      'utf8'
    );
    
    console.log('\n=== Analysis Complete ===');
    console.log(`Found ${foundCategories.length} category links`);
    console.log(`Found ${productLinks.length} product links`);
    console.log(`Platform: ${platform}`);
    console.log('Analysis saved to freshjb-structure-analysis.json');
    
    // Show top categories found
    if (foundCategories.length > 0) {
      console.log('\nTop Categories Found:');
      foundCategories.slice(0, 10).forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} -> ${cat.url}`);
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing homepage:', error);
    throw error;
  }
}

async function main() {
  try {
    await analyzeHomepage();
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}