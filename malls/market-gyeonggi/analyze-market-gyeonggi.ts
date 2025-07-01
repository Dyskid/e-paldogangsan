import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosConfig: AxiosRequestConfig = {
  httpsAgent,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Attempt ${i + 1}/${maxRetries} for ${url}`);
      
      if (i > 0) {
        const waitTime = Math.min(3000 * Math.pow(2, i - 1), 15000);
        console.log(`   ⏳ Waiting ${waitTime / 1000} seconds before retry...`);
        await sleep(waitTime);
      }
      
      const response = await axios.get(url, axiosConfig);
      console.log(`   ✅ Success! Status: ${response.status}`);
      return response;
      
    } catch (error: any) {
      console.log(`   ❌ Attempt ${i + 1} failed: ${error.response?.status || error.message}`);
      
      if (error.response?.status === 429) {
        console.log('   🚫 Rate limited, will retry with longer delay...');
        if (i < maxRetries - 1) {
          await sleep(10000 + (i * 5000));
        }
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        console.log('   🛑 Client error, not retrying');
        throw error;
      } else if (i === maxRetries - 1) {
        throw error;
      }
    }
  }
}

async function analyzeMarketGyeonggiStructure(): Promise<void> {
  console.log('🔍 Analyzing 마켓경기 (MarketGyeonggi) Smart Store structure...');
  
  const outputDir = path.join(__dirname, '../../output/marketgyeonggi');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Main store URL
    const storeUrl = 'https://smartstore.naver.com/marketgyeonggi';
    console.log(`\n📋 Fetching main store page: ${storeUrl}`);
    
    const response = await fetchWithRetry(storeUrl);
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync(path.join(outputDir, 'marketgyeonggi-homepage.html'), response.data);
    console.log('✅ Main page saved for analysis');
    
    // Check if this is an error page or actual store
    const title = $('title').text();
    const isErrorPage = title.includes('에러') || title.includes('error') || response.data.includes('module_error');
    
    console.log(`\n📄 Page Analysis:`);
    console.log(`   Title: ${title}`);
    console.log(`   Is error page: ${isErrorPage}`);
    
    // Look for product data in various possible locations
    console.log('\n🔍 Looking for product data structures...');
    
    // Try to find product elements
    const productSelectors = [
      'li[class*="product"]',
      'div[class*="product"]',
      'article[class*="product"]',
      'a[href*="/products/"]',
      '[data-shp-page-key*="product"]',
      '.N\\=a\\:lst\\.product',
      '._3BkKgDHq'
    ];
    
    let productElements: any[] = [];
    let workingSelector = '';
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   ✅ Found ${elements.length} elements with selector: ${selector}`);
        productElements = elements.toArray();
        workingSelector = selector;
        break;
      }
    }
    
    if (productElements.length === 0) {
      console.log('   ❌ No product elements found on main page');
      
      // Try alternative URLs
      const alternativeUrls = [
        'https://smartstore.naver.com/marketgyeonggi/products',
        'https://smartstore.naver.com/marketgyeonggi/category',
        'https://m.smartstore.naver.com/marketgyeonggi'
      ];
      
      console.log('\n🔄 Trying alternative URLs...');
      
      for (const altUrl of alternativeUrls) {
        try {
          console.log(`\n🧪 Testing: ${altUrl}`);
          await sleep(3000);
          
          const altResponse = await fetchWithRetry(altUrl, 2);
          const alt$ = cheerio.load(altResponse.data);
          
          const altTitle = alt$('title').text();
          console.log(`   Alternative page title: ${altTitle}`);
          
          // Save alternative page
          const filename = altUrl.includes('products') ? 'products-page.html' : 
                          altUrl.includes('category') ? 'category-page.html' : 
                          'mobile-page.html';
          fs.writeFileSync(path.join(outputDir, `marketgyeonggi-${filename}`), altResponse.data);
          
          // Check for products again
          for (const selector of productSelectors) {
            const elements = alt$(selector);
            if (elements.length > 0) {
              console.log(`   ✅ Found ${elements.length} products in alternative page`);
              break;
            }
          }
          
        } catch (altError: any) {
          console.log(`   ❌ Alternative URL failed: ${altError.message}`);
        }
      }
    }
    
    // Analyze store structure
    const analysisResult = {
      mallName: '마켓경기',
      url: storeUrl,
      type: 'Naver SmartStore',
      analyzedAt: new Date().toISOString(),
      pageStructure: {
        title: title,
        isErrorPage: isErrorPage,
        hasProducts: productElements.length > 0,
        productCount: productElements.length,
        workingSelector: workingSelector
      },
      selectors: {
        products: workingSelector || 'Not found',
        productName: 'strong.Vy4pN4p_Gu, ._26YxgX-Nu5, .name',
        productPrice: 'strong.zNJmIAQtGI, ._2DywKu0J_8, .price',
        productImage: 'img._25CKxIKjAk, img[src*="shop-phinf"], .thumb img',
        productLink: 'a.baby-product-link, a[href*="/products/"]'
      },
      recommendations: [
        'Use Puppeteer or Playwright for better JavaScript rendering',
        'Check if store requires special headers or cookies',
        'Monitor for rate limiting (429 errors)',
        'Consider using mobile version for simpler HTML structure'
      ]
    };
    
    // Save analysis result
    fs.writeFileSync(
      path.join(outputDir, 'marketgyeonggi-analysis.json'),
      JSON.stringify(analysisResult, null, 2)
    );
    
    console.log('\n✅ Analysis complete! Results saved to:');
    console.log(`   ${outputDir}/marketgyeonggi-analysis.json`);
    console.log(`   ${outputDir}/marketgyeonggi-homepage.html`);
    
  } catch (error: any) {
    console.error('\n❌ Error analyzing MarketGyeonggi:', error.message);
    
    // Save error information
    const errorInfo = {
      mallName: '마켓경기',
      url: 'https://smartstore.naver.com/marketgyeonggi',
      error: error.message,
      analyzedAt: new Date().toISOString(),
      recommendations: [
        'This is a Naver SmartStore which may require special handling',
        'Consider using Puppeteer/Playwright for JavaScript rendering',
        'Check if the store URL is correct and active',
        'Some SmartStores restrict access or require authentication'
      ]
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'marketgyeonggi-error-analysis.json'),
      JSON.stringify(errorInfo, null, 2)
    );
  }
}

// Run the analysis
if (require.main === module) {
  analyzeMarketGyeonggiStructure();
}

export { analyzeMarketGyeonggiStructure };