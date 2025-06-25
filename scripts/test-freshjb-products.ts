import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testProductURLPatterns() {
  console.log('=== Testing Product URL Patterns for 전북생생장터 ===');
  
  const baseUrl = 'https://freshjb.com';
  
  // Common product URL patterns for Korean e-commerce sites
  const urlPatterns = [
    // NHN Commerce / CAFE24 patterns
    '/product/detail.html?product_no=',
    '/product/상품명',
    '/goods/view?no=',
    '/item/',
    '/product/',
    '/shop/shopdetail.html?branduid=',
    
    // Generic patterns
    '/p/',
    '/products/',
    '/goods/',
    '/items/',
    
    // Korean specific
    '/상품/',
    '/제품/',
    '/농산물/',
    '/특산품/'
  ];
  
  // Test with sample IDs/numbers
  const testIds = ['1', '2', '3', '100', '1001', 'sample', 'test'];
  
  for (const pattern of urlPatterns) {
    for (const id of testIds) {
      try {
        const testUrl = `${baseUrl}${pattern}${id}`;
        console.log(`Testing: ${testUrl}`);
        
        const response = await axios.get(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        // Check if this looks like a product page
        const $ = cheerio.load(response.data);
        const title = $('title').text();
        
        // Look for e-commerce indicators
        const hasPrice = $('*').text().includes('원') || $('*').text().includes('₩') || $('*').text().includes('price');
        const hasCart = $('*').text().includes('장바구니') || $('*').text().includes('cart');
        const hasBuy = $('*').text().includes('구매') || $('*').text().includes('buy');
        
        if (hasPrice || hasCart || hasBuy) {
          console.log(`✓ Potential product page: ${testUrl}`);
          console.log(`  Title: ${title}`);
          console.log(`  Has price: ${hasPrice}, Has cart: ${hasCart}, Has buy: ${hasBuy}`);
          
          // Save the page for analysis
          fs.writeFileSync(
            `scripts/output/freshjb-potential-product-${pattern.replace(/[\/]/g, '-')}-${id}.html`,
            response.data,
            'utf8'
          );
        }
        
      } catch (error) {
        // Continue silently - expect many 404s
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

async function checkSitemap() {
  console.log('\n=== Checking for Sitemap ===');
  
  const sitemapUrls = [
    'https://freshjb.com/sitemap.xml',
    'https://freshjb.com/sitemap.txt',
    'https://freshjb.com/robots.txt'
  ];
  
  for (const url of sitemapUrls) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✓ Found: ${url}`);
      console.log('Content type:', response.headers['content-type']);
      
      if (url.includes('robots.txt')) {
        console.log('Robots.txt content:');
        console.log(response.data);
        
        // Look for sitemap references in robots.txt
        const sitemapRefs = response.data.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
        if (sitemapRefs) {
          console.log('Found sitemap references:', sitemapRefs);
        }
      }
      
      fs.writeFileSync(
        `scripts/output/freshjb-${url.split('/').pop()}`,
        response.data,
        'utf8'
      );
      
    } catch (error) {
      console.log(`✗ Not found: ${url}`);
    }
  }
}

async function testCommonSearchTerms() {
  console.log('\n=== Testing Search Functionality ===');
  
  const searchTerms = ['쌀', '농산물', '특산품', '과일', '채소'];
  const searchPatterns = [
    '/search?q=',
    '/search?keyword=',
    '/search?term=',
    '/?search=',
    '/?q='
  ];
  
  for (const pattern of searchPatterns) {
    for (const term of searchTerms) {
      try {
        const searchUrl = `https://freshjb.com${pattern}${encodeURIComponent(term)}`;
        console.log(`Testing search: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Look for search results
        const hasResults = $('*').text().includes('검색결과') || 
                          $('*').text().includes('결과') ||
                          $('*').text().includes('상품') ||
                          response.data.includes('product') ||
                          response.data.includes('goods');
        
        if (hasResults && response.data.length > 2000) {
          console.log(`✓ Search may work: ${searchUrl}`);
          
          fs.writeFileSync(
            `scripts/output/freshjb-search-${pattern.replace(/[\/\?]/g, '-')}-${term}.html`,
            response.data,
            'utf8'
          );
        }
        
      } catch (error) {
        // Continue silently
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function exploreKnownCategories() {
  console.log('\n=== Exploring Known Category Patterns ===');
  
  // Based on other Korean local mall patterns
  const categoryPatterns = [
    '/category/',
    '/categories/',
    '/cate/',
    '/list/',
    '/goods/',
    '/products/',
    '/농산물/',
    '/특산품/',
    '/식품/'
  ];
  
  const categoryIds = ['1', '2', '3', '10', '100', 'food', 'farm', 'special'];
  
  for (const pattern of categoryPatterns) {
    for (const id of categoryIds) {
      try {
        const categoryUrl = `https://freshjb.com${pattern}${id}`;
        console.log(`Testing category: ${categoryUrl}`);
        
        const response = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Look for product listings
        const productIndicators = [
          'product', 'goods', 'item', '상품', '제품',
          'price', '가격', '원', '₩', 
          'cart', '장바구니', 'buy', '구매'
        ];
        
        const hasProducts = productIndicators.some(indicator => 
          response.data.toLowerCase().includes(indicator)
        );
        
        if (hasProducts && response.data.length > 2000) {
          console.log(`✓ Potential category page: ${categoryUrl}`);
          
          fs.writeFileSync(
            `scripts/output/freshjb-category-${pattern.replace(/[\/]/g, '-')}-${id}.html`,
            response.data,
            'utf8'
          );
        }
        
      } catch (error) {
        // Continue silently
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
}

async function main() {
  try {
    console.log('Starting comprehensive product discovery for freshjb.com');
    
    await testProductURLPatterns();
    await checkSitemap();
    await testCommonSearchTerms();
    await exploreKnownCategories();
    
    console.log('\n=== Product Discovery Complete ===');
    console.log('Check output files for any discovered product or category pages');
    
  } catch (error) {
    console.error('Discovery failed:', error);
  }
}

if (require.main === module) {
  main();
}