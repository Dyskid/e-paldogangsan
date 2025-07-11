const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function loadMallsData() {
  try {
    const mallsPath = path.join(__dirname, '..', 'assets', 'malls.json');
    const content = await fs.readFile(mallsPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading malls.json:', error);
    return [];
  }
}

async function loadScrapedMalls() {
  const scrapedMalls = new Set();
  
  try {
    // Load the main products.json file
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
    const content = await fs.readFile(productsPath, 'utf-8');
    const products = JSON.parse(content);
    
    // Extract unique mall IDs from products
    for (const product of products) {
      if (product.mallId) {
        scrapedMalls.add(product.mallId);
      }
    }
    
    // Also check individual product files in scripts/output
    const outputDir = path.join(__dirname, 'output');
    try {
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        if (file.endsWith('-products.json')) {
          // Extract mall ID from filename pattern like "1-we-mall-products.json"
          const match = file.match(/^\d+-(.+)-products\.json$/);
          if (match) {
            scrapedMalls.add(match[1]);
          }
        }
      }
    } catch (err) {
      // Output directory might not exist
    }
  } catch (error) {
    console.error('Error loading scraped malls:', error);
  }
  
  return scrapedMalls;
}

async function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'HEAD',
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        // Allow self-signed certificates
        rejectUnauthorized: false
      };
      
      const req = protocol.request(parsedUrl, options, (res) => {
        const statusCode = res.statusCode;
        
        // Follow redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          checkUrl(res.headers.location, timeout).then(resolve);
        } else if (statusCode >= 200 && statusCode < 400) {
          resolve({
            success: true,
            status: statusCode,
            finalUrl: url,
            headers: res.headers
          });
        } else {
          resolve({
            success: false,
            status: statusCode,
            error: `HTTP ${statusCode}`,
            finalUrl: url
          });
        }
      });
      
      req.on('error', (error) => {
        let errorMessage = error.message;
        
        if (error.code === 'ENOTFOUND') {
          errorMessage = 'DNS lookup failed - domain does not exist';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = 'Connection timeout';
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused';
        } else if (error.code === 'CERT_HAS_EXPIRED') {
          errorMessage = 'SSL certificate expired';
        } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          errorMessage = 'SSL certificate verification failed';
        }
        
        resolve({
          success: false,
          error: errorMessage,
          errorCode: error.code,
          finalUrl: url
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          finalUrl: url
        });
      });
      
      req.end();
    } catch (error) {
      resolve({
        success: false,
        error: error.message,
        finalUrl: url
      });
    }
  });
}

function detectPlatform(url, headers) {
  const urlLower = url.toLowerCase();
  
  // Check URL patterns
  if (urlLower.includes('smartstore.naver.com')) {
    return 'Naver Smart Store';
  } else if (urlLower.includes('.cafe24.com') || urlLower.includes('cafe24')) {
    return 'Cafe24';
  } else if (urlLower.includes('.makeshop.co.kr') || urlLower.includes('makeshop')) {
    return 'Makeshop';
  } else if (urlLower.includes('.godomall.com') || urlLower.includes('godo')) {
    return 'Godomall';
  } else if (urlLower.includes('wix.com')) {
    return 'Wix';
  } else if (urlLower.includes('imweb.me')) {
    return 'Imweb';
  } else if (urlLower.includes('.cyso.co.kr')) {
    return 'CYSO';
  } else if (urlLower.includes('mangotree.co.kr')) {
    return 'Mangotree';
  } else if (urlLower.includes('.kr')) {
    return 'Custom Korean Platform';
  }
  
  // Check headers
  if (headers) {
    const serverHeader = headers['server'] || headers['x-powered-by'] || '';
    if (serverHeader.toLowerCase().includes('cafe24')) {
      return 'Cafe24';
    } else if (serverHeader.toLowerCase().includes('makeshop')) {
      return 'Makeshop';
    } else if (serverHeader.toLowerCase().includes('godomall')) {
      return 'Godomall';
    }
  }
  
  return 'Unknown';
}

async function validateUrls() {
  console.log(`${colors.bright}${colors.cyan}URL Validation Report${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const malls = await loadMallsData();
  const scrapedMalls = await loadScrapedMalls();
  
  // Filter out already scraped malls
  const unscrapedMalls = malls.filter(mall => !scrapedMalls.has(mall.engname));
  
  console.log(`Total malls: ${colors.bright}${malls.length}${colors.reset}`);
  console.log(`Already scraped: ${colors.green}${scrapedMalls.size}${colors.reset}`);
  console.log(`To validate: ${colors.yellow}${unscrapedMalls.length}${colors.reset}\n`);
  
  const results = {
    valid: [],
    invalid: [],
    platforms: {}
  };
  
  for (let i = 0; i < unscrapedMalls.length; i++) {
    const mall = unscrapedMalls[i];
    console.log(`[${i + 1}/${unscrapedMalls.length}] Checking ${mall.name}...`);
    
    const result = await checkUrl(mall.url);
    const platform = detectPlatform(result.finalUrl || mall.url, result.headers);
    
    if (result.success) {
      const finalUrl = result.finalUrl !== mall.url ? result.finalUrl : null;
      results.valid.push({
        ...mall,
        finalUrl,
        platform,
        status: result.status
      });
      
      console.log(`  ${colors.green}✓ Valid${colors.reset} - ${platform} (Status: ${result.status})`);
      if (finalUrl) {
        console.log(`  ${colors.yellow}→ Redirected to: ${finalUrl}${colors.reset}`);
      }
    } else {
      results.invalid.push({
        ...mall,
        error: result.error,
        errorCode: result.errorCode,
        platform
      });
      
      console.log(`  ${colors.red}✗ Invalid${colors.reset} - ${result.error}`);
    }
    
    // Track platforms
    if (!results.platforms[platform]) {
      results.platforms[platform] = { valid: 0, invalid: 0 };
    }
    if (result.success) {
      results.platforms[platform].valid++;
    } else {
      results.platforms[platform].invalid++;
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  console.log(`\n${colors.bright}${colors.cyan}Summary${colors.reset}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Valid URLs: ${colors.green}${results.valid.length}${colors.reset}`);
  console.log(`Invalid URLs: ${colors.red}${results.invalid.length}${colors.reset}\n`);
  
  console.log(`${colors.bright}Platform Distribution:${colors.reset}`);
  for (const [platform, counts] of Object.entries(results.platforms)) {
    console.log(`  ${platform}: ${colors.green}${counts.valid} valid${colors.reset}, ${colors.red}${counts.invalid} invalid${colors.reset}`);
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: unscrapedMalls.length,
      valid: results.valid.length,
      invalid: results.invalid.length,
      alreadyScraped: scrapedMalls.size
    },
    platforms: results.platforms,
    validMalls: results.valid,
    invalidMalls: results.invalid
  };
  
  const reportPath = path.join(__dirname, '..', 'data', 'validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.bright}Detailed report saved to:${colors.reset} ${reportPath}`);
  
  // Create platform-specific scraper recommendations
  console.log(`\n${colors.bright}${colors.cyan}Scraper Recommendations${colors.reset}`);
  console.log(`${'='.repeat(80)}`);
  
  const platformGroups = {};
  for (const mall of results.valid) {
    if (!platformGroups[mall.platform]) {
      platformGroups[mall.platform] = [];
    }
    platformGroups[mall.platform].push(mall);
  }
  
  for (const [platform, malls] of Object.entries(platformGroups)) {
    console.log(`\n${colors.bright}${platform}${colors.reset} (${malls.length} malls):`);
    const sampleMalls = malls.slice(0, 3);
    for (const mall of sampleMalls) {
      console.log(`  - ${mall.name}: ${mall.finalUrl || mall.url}`);
    }
    if (malls.length > 3) {
      console.log(`  ... and ${malls.length - 3} more`);
    }
  }
  
  // List specific issues
  if (results.invalid.length > 0) {
    console.log(`\n${colors.bright}${colors.red}Failed URLs requiring attention:${colors.reset}`);
    const errorGroups = {};
    
    for (const mall of results.invalid) {
      const errorKey = mall.errorCode || mall.error;
      if (!errorGroups[errorKey]) {
        errorGroups[errorKey] = [];
      }
      errorGroups[errorKey].push(mall);
    }
    
    for (const [error, malls] of Object.entries(errorGroups)) {
      console.log(`\n${colors.yellow}${error}:${colors.reset}`);
      for (const mall of malls) {
        console.log(`  - ${mall.name} (${mall.id}): ${mall.url}`);
      }
    }
  }
}

// Run validation
validateUrls().catch(console.error);