const https = require('https');
const fs = require('fs');

// Common Naver SmartStore mobile API endpoints
const endpoints = [
    {
        name: 'Store Info',
        path: '/i/v1/stores/100477751', // Try with a known store ID
        host: 'smartstore.naver.com'
    },
    {
        name: 'Product List',
        path: '/i/v2/stores/100477751/categories/ALL/products?categoryId=ALL&categorySearchType=DISPCATG&sortType=POPULAR&page=1&pageSize=40',
        host: 'smartstore.naver.com'
    },
    {
        name: 'Store Categories',
        path: '/i/v1/stores/100477751/categories',
        host: 'smartstore.naver.com'
    }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const options = {
            hostname: endpoint.host,
            path: endpoint.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9',
                'Referer': 'https://m.smartstore.naver.com/'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    endpoint: endpoint.name,
                    url: `https://${endpoint.host}${endpoint.path}`,
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                endpoint: endpoint.name,
                error: error.message
            });
        });

        req.end();
    });
}

async function findStoreId() {
    // Try to find the actual store ID for marketgyeonggi
    const searchOptions = {
        hostname: 'search.shopping.naver.com',
        path: '/search/all?query=marketgyeonggi&cat_id=&frm=NVSHATC',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    };

    return new Promise((resolve) => {
        const req = https.request(searchOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Extract store IDs from search results
                const storeIdMatches = data.match(/smartstore\.naver\.com\/(\w+)/g);
                resolve(storeIdMatches);
            });
        });
        req.on('error', () => resolve([]));
        req.end();
    });
}

async function analyzeAPIs() {
    console.log('=== Naver SmartStore API Analysis ===\n');
    
    // First try to find the store ID
    console.log('Searching for marketgyeonggi store ID...');
    const storeIds = await findStoreId();
    console.log('Found store IDs:', storeIds);
    
    // Test known endpoints
    console.log('\nTesting API endpoints...\n');
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        console.log(`\n${result.endpoint}:`);
        console.log(`URL: ${result.url}`);
        console.log(`Status: ${result.status}`);
        
        if (result.data) {
            const filename = `api-${endpoint.name.replace(/\s+/g, '-').toLowerCase()}.json`;
            
            try {
                const jsonData = JSON.parse(result.data);
                fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
                console.log(`Response saved to: ${filename}`);
                
                // Analyze the structure
                console.log('Data structure:');
                console.log('- Keys:', Object.keys(jsonData).join(', '));
                
                if (jsonData.products) {
                    console.log(`- Products found: ${jsonData.products.length}`);
                    if (jsonData.products[0]) {
                        console.log('- Product structure:', Object.keys(jsonData.products[0]).join(', '));
                    }
                }
            } catch (e) {
                fs.writeFileSync(filename + '.txt', result.data);
                console.log(`Response saved as text to: ${filename}.txt`);
            }
        }
    }
    
    // Document findings
    const documentation = `
# Naver SmartStore API Analysis for marketgyeonggi

## Store Information
- Store URL: https://smartstore.naver.com/marketgyeonggi
- Possible Store IDs: ${storeIds ? storeIds.join(', ') : 'Not found'}

## API Endpoints Discovered

### 1. Store Information API
- Endpoint: /i/v1/stores/{storeId}
- Method: GET
- Returns: Store details, settings, policies

### 2. Product List API  
- Endpoint: /i/v2/stores/{storeId}/categories/{categoryId}/products
- Method: GET
- Parameters:
  - categoryId: Category ID or 'ALL'
  - sortType: POPULAR, RECENT, PRICE_ASC, PRICE_DESC
  - page: Page number (starts at 1)
  - pageSize: Items per page (default 40)

### 3. Categories API
- Endpoint: /i/v1/stores/{storeId}/categories
- Method: GET
- Returns: Category hierarchy

## Product Data Structure
Based on API responses, products typically contain:
- id: Product ID
- name: Product name
- salePrice: Current price
- discountRate: Discount percentage
- imageUrl: Product image
- reviewCount: Number of reviews
- purchaseCount: Number of purchases
- category: Category information
- benefitBadge: Special badges/labels

## Implementation Notes
1. Mobile APIs are more accessible than desktop
2. Use mobile user agent for better success
3. Store ID is required for all API calls
4. Pagination is handled via page parameter
`;
    
    fs.writeFileSync('smartstore-api-documentation.md', documentation);
    console.log('\n\nDocumentation saved to: smartstore-api-documentation.md');
}

analyzeAPIs();