import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testAjaxEndpoints() {
  console.log('=== Testing 전북생생장터 AJAX Endpoints ===');
  
  const baseUrl = 'https://freshjb.com';
  
  // Common API endpoints for e-commerce sites
  const testEndpoints = [
    '/api/products',
    '/api/categories',
    '/api/goods',
    '/api/items',
    '/products.json',
    '/categories.json',
    '/goods.json',
    '/shop/products',
    '/shop/categories',
    '/product/list',
    '/category/list',
    // NHN Commerce specific endpoints
    '/exec/front/Product/ApiProductList',
    '/exec/front/Category/ApiCategoryList',
    '/api/product/list',
    '/api/category/list'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing: ${baseUrl}${endpoint}`);
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        console.log(`✓ Success: ${endpoint} - Status ${response.status}`);
        
        // Save successful response
        fs.writeFileSync(
          `scripts/output/freshjb-api-${endpoint.replace(/[\/]/g, '-')}.json`,
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
          'utf8'
        );
        
        // Analyze response
        if (typeof response.data === 'object') {
          console.log('  Response type: JSON object');
          console.log('  Keys:', Object.keys(response.data));
        } else {
          console.log('  Response type:', typeof response.data);
          console.log('  Length:', response.data.length);
        }
      }
      
    } catch (error: any) {
      if (error.response?.status) {
        console.log(`✗ ${endpoint} - Status ${error.response.status}`);
      } else {
        console.log(`✗ ${endpoint} - ${error.message}`);
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testCommonPaths() {
  console.log('\n=== Testing Common Product Pages ===');
  
  const baseUrl = 'https://freshjb.com';
  
  // Common page paths
  const testPaths = [
    '/',
    '/product',
    '/products',
    '/shop',
    '/goods',
    '/category',
    '/categories',
    '/list',
    '/product/list',
    '/shop/list',
    '/goods/list'
  ];
  
  for (const path of testPaths) {
    try {
      console.log(`Testing: ${baseUrl}${path}`);
      const response = await axios.get(`${baseUrl}${path}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const title = $('title').text();
      
      console.log(`✓ ${path} - Status ${response.status} - Title: ${title}`);
      
      // Look for React app or dynamic content indicators
      const hasReactApp = response.data.includes('id="app"') || response.data.includes('React');
      const hasVueApp = response.data.includes('id="app"') || response.data.includes('Vue');
      const hasAngular = response.data.includes('ng-app') || response.data.includes('Angular');
      
      if (hasReactApp) console.log('  → React app detected');
      if (hasVueApp) console.log('  → Vue app detected');
      if (hasAngular) console.log('  → Angular app detected');
      
      // Save interesting pages
      if (path !== '/' && response.data.length > 1000) {
        fs.writeFileSync(
          `scripts/output/freshjb-page-${path.replace(/[\/]/g, '-')}.html`,
          response.data,
          'utf8'
        );
      }
      
    } catch (error: any) {
      if (error.response?.status) {
        console.log(`✗ ${path} - Status ${error.response.status}`);
      } else {
        console.log(`✗ ${path} - ${error.message}`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function inspectNetworkRequests() {
  console.log('\n=== Inspecting for Dynamic Content Patterns ===');
  
  try {
    const response = await axios.get('https://freshjb.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const content = response.data;
    
    // Look for API endpoint patterns in the source
    const apiPatterns = [
      /\/api\/[^"'\s]+/g,
      /\/exec\/[^"'\s]+/g,
      /https?:\/\/[^"'\s]*api[^"'\s]*/g,
      /https?:\/\/[^"'\s]*cdn[^"'\s]*/g
    ];
    
    console.log('Found API patterns:');
    apiPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1}:`, [...new Set(matches)].slice(0, 5));
      }
    });
    
    // Look for specific commerce platform indicators
    const commercePatterns = {
      'NHN Commerce': /nhncommerce\.com/g,
      'CAFE24': /cafe24\.com/g,
      'MakeShop': /makeshop\.co\.kr/g,
      'Shopify': /shopify\.com/g,
      'WooCommerce': /woocommerce/g
    };
    
    console.log('\nCommerce platform indicators:');
    Object.entries(commercePatterns).forEach(([platform, pattern]) => {
      if (content.match(pattern)) {
        console.log(`✓ ${platform} detected`);
      }
    });
    
  } catch (error) {
    console.error('Error inspecting content:', error);
  }
}

async function main() {
  try {
    await testAjaxEndpoints();
    await testCommonPaths();
    await inspectNetworkRequests();
    
    console.log('\n=== Analysis Complete ===');
    console.log('Check the output files for detailed responses');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

if (require.main === module) {
  main();
}