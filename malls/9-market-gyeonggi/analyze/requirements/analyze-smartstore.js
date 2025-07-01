const https = require('https');
const fs = require('fs');

function fetchSmartStore() {
    const options = {
        hostname: 'smartstore.naver.com',
        path: '/marketgyeonggi',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Headers:', res.headers);

        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            fs.writeFileSync('smartstore-nodejs.html', data);
            console.log('Response saved to smartstore-nodejs.html');
            analyzeHTML(data);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error);
    });

    req.end();
}

function analyzeHTML(html) {
    console.log('\n=== Analyzing HTML Content ===');
    
    // Extract store ID patterns
    const storeIdPatterns = [
        /channelNo["\s:]+(\d+)/,
        /storeId["\s:]+["']([^"']+)["']/,
        /sellerId["\s:]+["']([^"']+)["']/,
        /marketgyeonggi/g
    ];
    
    // Extract API endpoints
    const apiPatterns = [
        /https?:\/\/[^"'\s]+api[^"'\s]+/g,
        /\/i\/v\d\/[^"'\s]+/g,
        /shopping\.naver\.com\/v\d\/[^"'\s]+/g
    ];
    
    const findings = {
        storeIds: {},
        apiEndpoints: [],
        dataStructures: []
    };
    
    // Search for store IDs
    storeIdPatterns.forEach((pattern, index) => {
        const matches = html.match(pattern);
        if (matches) {
            findings.storeIds[`pattern_${index}`] = matches;
        }
    });
    
    // Search for API endpoints
    apiPatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
            findings.apiEndpoints.push(...matches);
        }
    });
    
    // Look for JSON data structures
    const jsonPattern = /window\.__[A-Z_]+__\s*=\s*({[\s\S]+?});/g;
    let jsonMatch;
    while ((jsonMatch = jsonPattern.exec(html)) !== null) {
        try {
            const jsonData = JSON.parse(jsonMatch[1]);
            findings.dataStructures.push({
                variable: jsonMatch[0].split('=')[0].trim(),
                sample: JSON.stringify(jsonData, null, 2).substring(0, 500) + '...'
            });
        } catch (e) {
            // Not valid JSON, skip
        }
    }
    
    fs.writeFileSync('smartstore-analysis.json', JSON.stringify(findings, null, 2));
    console.log('Analysis saved to smartstore-analysis.json');
    console.log('\nFindings:', findings);
}

// Run the fetcher
fetchSmartStore();