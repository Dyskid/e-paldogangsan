import axios from 'axios';
import * as fs from 'fs';

async function discoverNHNCommerceAPI() {
  console.log('=== Discovering NHN Commerce API Endpoints ===');
  
  const baseUrl = 'https://freshjb.com';
  
  // NHN Commerce / CAFE24 style API endpoints
  const nhnEndpoints = [
    // Product related
    '/exec/front/Product/ListProduct',
    '/exec/front/Product/ProductList',
    '/exec/front/Product/GetProduct',
    '/api/front/product/list',
    '/api/front/product/search',
    '/api/product',
    '/api/products',
    
    // Category related
    '/exec/front/Category/ListCategory',
    '/exec/front/Category/CategoryList',
    '/api/front/category/list',
    '/api/category',
    '/api/categories',
    
    // Search
    '/exec/front/Product/SearchProduct',
    '/api/search',
    '/search',
    
    // Common storefront APIs
    '/storefront/products',
    '/storefront/categories',
    '/storefront/search'
  ];
  
  // Test with different request methods and parameters
  for (const endpoint of nhnEndpoints) {
    // Test GET with common parameters
    const testParams = [
      {},
      { page: 1, limit: 20 },
      { category_no: 1 },
      { product_no: 1 },
      { display_group: 1 },
      { cate_no: 1 }
    ];
    
    for (const params of testParams) {
      try {
        const url = `${baseUrl}${endpoint}`;
        console.log(`Testing: ${url} with params:`, params);
        
        const response = await axios.get(url, {
          params,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://freshjb.com/'
          },
          timeout: 15000
        });
        
        if (response.data && typeof response.data === 'object' && !response.data.includes?.('<!doctype html')) {
          console.log(`✓ Success: ${endpoint} with params`, params);
          console.log('Response type:', typeof response.data);
          
          if (typeof response.data === 'object') {
            console.log('Keys:', Object.keys(response.data));
          }
          
          // Save successful API response
          const filename = `freshjb-api-success-${endpoint.replace(/[\/]/g, '-')}-${JSON.stringify(params).replace(/[{}":,]/g, '')}.json`;
          fs.writeFileSync(
            `scripts/output/${filename}`,
            JSON.stringify(response.data, null, 2),
            'utf8'
          );
          
          return { endpoint, params, data: response.data };
        }
        
      } catch (error: any) {
        // Silently continue - we expect many 404s
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  console.log('No successful API endpoints found yet');
  return null;
}

async function testStorefrontPatterns() {
  console.log('\n=== Testing Storefront-specific Patterns ===');
  
  // Based on the CDN URL, this looks like a custom NHN Commerce storefront
  // The bundle files suggest API endpoints might be different
  
  const storeFrontId = 'freshjb-4293'; // From the CDN URL
  const teamId = 'team-523';
  
  const customEndpoints = [
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v2/products',
    '/api/v2/categories',
    '/rest/products',
    '/rest/categories',
    '/graphql',
    '/gql'
  ];
  
  for (const endpoint of customEndpoints) {
    try {
      const response = await axios.get(`https://freshjb.com${endpoint}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data && !response.data.includes?.('<!doctype html')) {
        console.log(`✓ Found API: ${endpoint}`);
        console.log('Response:', typeof response.data === 'object' ? Object.keys(response.data) : 'String response');
        
        fs.writeFileSync(
          `scripts/output/freshjb-custom-api-${endpoint.replace(/[\/]/g, '-')}.json`,
          JSON.stringify(response.data, null, 2),
          'utf8'
        );
      }
      
    } catch (error) {
      // Continue silently
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function analyzeJSBundles() {
  console.log('\n=== Analyzing JavaScript Bundles for API Endpoints ===');
  
  const bundleUrls = [
    'https://storefront.cdn-nhncommerce.com/custom/team-523/kdellaorange-custom/freshjb-4293/pc/5734.4c697d449defcdbfebb4.bundle.js',
    'https://storefront.cdn-nhncommerce.com/custom/team-523/kdellaorange-custom/freshjb-4293/pc/index.362e967acd5874b33548.bundle.js'
  ];
  
  for (const bundleUrl of bundleUrls) {
    try {
      console.log(`Analyzing: ${bundleUrl}`);
      const response = await axios.get(bundleUrl, { timeout: 30000 });
      const jsCode = response.data;
      
      // Look for API endpoint patterns in the minified JS
      const apiPatterns = [
        /['"](\/api\/[^'"]+)['"]/g,
        /['"](\/exec\/[^'"]+)['"]/g,
        /['"](\/rest\/[^'"]+)['"]/g,
        /['"](\/graphql[^'"]*)['"]/g,
        /baseURL['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/g,
        /apiUrl['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/g
      ];
      
      const foundEndpoints = new Set<string>();
      
      apiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(jsCode)) !== null) {
          foundEndpoints.add(match[1]);
        }
      });
      
      if (foundEndpoints.size > 0) {
        console.log('Found API endpoints in bundle:');
        Array.from(foundEndpoints).slice(0, 20).forEach(endpoint => {
          console.log(`  ${endpoint}`);
        });
        
        // Save found endpoints
        fs.writeFileSync(
          'scripts/output/freshjb-discovered-endpoints.json',
          JSON.stringify(Array.from(foundEndpoints), null, 2),
          'utf8'
        );
      }
      
    } catch (error) {
      console.log(`Failed to analyze bundle: ${error}`);
    }
  }
}

async function testAlternativeApproach() {
  console.log('\n=== Testing Alternative Data Sources ===');
  
  // Sometimes React apps load initial data in window.__INITIAL_STATE__ or similar
  // Or have server-side rendered data in script tags
  
  try {
    const response = await axios.get('https://freshjb.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Look for embedded JSON data
    const jsonPatterns = [
      /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
      /window\.__APP_STATE__\s*=\s*({.+?});/s,
      /window\.APP_DATA\s*=\s*({.+?});/s,
      /<script[^>]*>\s*({.+?})\s*<\/script>/gs
    ];
    
    for (const pattern of jsonPatterns) {
      const match = html.match(pattern);
      if (match) {
        console.log('Found embedded JSON data!');
        try {
          const data = JSON.parse(match[1]);
          console.log('Data keys:', Object.keys(data));
          
          fs.writeFileSync(
            'scripts/output/freshjb-embedded-data.json',
            JSON.stringify(data, null, 2),
            'utf8'
          );
          
          return data;
        } catch (e) {
          console.log('Failed to parse embedded JSON');
        }
      }
    }
    
    console.log('No embedded JSON data found in initial HTML');
    
  } catch (error) {
    console.log('Failed to analyze initial HTML:', error);
  }
}

async function main() {
  try {
    console.log('Starting comprehensive API discovery for freshjb.com');
    
    const apiResult = await discoverNHNCommerceAPI();
    if (apiResult) {
      console.log('Found working API endpoint!');
      return apiResult;
    }
    
    await testStorefrontPatterns();
    await analyzeJSBundles();
    await testAlternativeApproach();
    
    console.log('\n=== Discovery Complete ===');
    console.log('Check output files for any discovered endpoints or data');
    
  } catch (error) {
    console.error('Discovery failed:', error);
  }
}

if (require.main === module) {
  main();
}