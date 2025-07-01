const https = require('https');
const fs = require('fs');

// Alternative URLs to check based on search results
const urls = [
    'https://smartstore.naver.com/dndnsang',
    'https://smartstore.naver.com/marketgyeonggi',
    'https://m.smartstore.naver.com/marketgyeonggi',
    'https://m.smartstore.naver.com/dndnsang'
];

async function checkUrl(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
                'Cache-Control': 'no-cache'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            // Handle redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                resolve({
                    url: url,
                    status: res.statusCode,
                    redirect: res.headers.location,
                    storeId: null
                });
                return;
            }

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                // Extract store ID from various sources
                let storeId = null;
                let storeName = null;
                
                // Common patterns for store ID
                const patterns = [
                    /"channelNo":\s*"?(\d+)"?/,
                    /channelNo\s*=\s*"?(\d+)"?/,
                    /"storeId":\s*"([^"]+)"/,
                    /stores\/(\d+)/,
                    /"sellerId":\s*"([^"]+)"/
                ];
                
                for (const pattern of patterns) {
                    const match = data.match(pattern);
                    if (match) {
                        storeId = match[1];
                        break;
                    }
                }
                
                // Extract store name
                const nameMatch = data.match(/<meta property="og:title" content="([^"]+)"/);
                if (nameMatch) {
                    storeName = nameMatch[1];
                }
                
                resolve({
                    url: url,
                    status: res.statusCode,
                    storeId: storeId,
                    storeName: storeName,
                    dataSnippet: data.substring(0, 500)
                });
            });
        });

        req.on('error', (error) => {
            resolve({
                url: url,
                error: error.message
            });
        });

        req.end();
    });
}

async function analyzeStores() {
    console.log('=== Checking Alternative SmartStore URLs ===\n');
    
    const results = [];
    
    for (const url of urls) {
        console.log(`Checking ${url}...`);
        const result = await checkUrl(url);
        results.push(result);
        
        if (result.status === 200 && result.storeId) {
            console.log(`✓ Found store ID: ${result.storeId}`);
            console.log(`  Store name: ${result.storeName}`);
            
            // Save successful response
            const filename = `store-${url.split('/').pop()}.html`;
            fs.writeFileSync(filename, result.dataSnippet);
        } else if (result.redirect) {
            console.log(`→ Redirects to: ${result.redirect}`);
        } else {
            console.log(`✗ Status: ${result.status || result.error}`);
        }
        
        console.log('');
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save analysis results
    const analysis = {
        timestamp: new Date().toISOString(),
        results: results.map(r => ({
            url: r.url,
            status: r.status,
            storeId: r.storeId,
            storeName: r.storeName,
            redirect: r.redirect
        }))
    };
    
    fs.writeFileSync('store-url-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\nAnalysis saved to store-url-analysis.json');
    
    // If we found a store ID, try to get its API data
    const successfulStore = results.find(r => r.storeId);
    if (successfulStore) {
        console.log(`\n=== Testing API with Store ID: ${successfulStore.storeId} ===\n`);
        await testStoreAPI(successfulStore.storeId);
    }
}

async function testStoreAPI(storeId) {
    const apiUrl = `https://smartstore.naver.com/i/v2/stores/${storeId}/categories/ALL/products?categoryId=ALL&sortType=POPULAR&page=1&pageSize=20`;
    
    const options = {
        hostname: 'smartstore.naver.com',
        path: `/i/v2/stores/${storeId}/categories/ALL/products?categoryId=ALL&sortType=POPULAR&page=1&pageSize=20`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'application/json',
            'Referer': `https://m.smartstore.naver.com/`
        }
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`API Response Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        fs.writeFileSync('store-products-api.json', JSON.stringify(jsonData, null, 2));
                        console.log('Product data saved to store-products-api.json');
                        
                        if (jsonData.products && jsonData.products.length > 0) {
                            console.log(`\nFound ${jsonData.products.length} products`);
                            console.log('Sample product structure:');
                            console.log(JSON.stringify(jsonData.products[0], null, 2).substring(0, 500) + '...');
                        }
                    } catch (e) {
                        console.log('Failed to parse JSON response');
                    }
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('API request error:', error.message);
            resolve();
        });
        
        req.end();
    });
}

analyzeStores();