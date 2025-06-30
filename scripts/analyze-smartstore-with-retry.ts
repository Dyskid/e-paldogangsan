import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import * as fs from 'fs';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosConfig: AxiosRequestConfig = {
  httpsAgent,
  timeout: 20000,
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
        const waitTime = Math.min(5000 * Math.pow(2, i - 1), 30000);
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
          await sleep(10000 + (i * 5000)); // Progressive backoff
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

async function analyzeSmartStoreWithRetry(): Promise<void> {
  console.log('🔍 Analyzing 참달성 Naver Smart Store with retry logic...');
  
  try {
    // Try the main store URL first
    const storeUrl = 'https://smartstore.naver.com/chamdalseong';
    console.log(`\n📋 Fetching main store page: ${storeUrl}`);
    
    const response = await fetchWithRetry(storeUrl);
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/chamdalseong-smartstore-main.html', response.data);
    console.log('✅ Main page saved for analysis');
    
    // Check if this is an error page or actual store
    const title = $('title').text();
    const isErrorPage = title.includes('에러') || title.includes('error') || response.data.includes('module_error');
    
    console.log(`\n📄 Page Analysis:`);
    console.log(`   Title: ${title}`);
    console.log(`   Is error page: ${isErrorPage}`);
    
    if (isErrorPage) {
      console.log('❌ Main page shows error. This store may be inactive or restricted.');
      
      // Try alternative URLs that might work
      const alternativeUrls = [
        'https://smartstore.naver.com/chamdalseong/products',
        'https://smartstore.naver.com/chamdalseong/category',
        'https://store.naver.com/chamdalseong'
      ];
      
      console.log('\n🔄 Trying alternative URLs...');
      
      for (const altUrl of alternativeUrls) {
        try {
          console.log(`\n🧪 Testing: ${altUrl}`);
          await sleep(3000); // Wait between requests
          
          const altResponse = await fetchWithRetry(altUrl, 2);
          const alt$ = cheerio.load(altResponse.data);
          const altTitle = alt$('title').text();
          const altIsError = altTitle.includes('에러') || altTitle.includes('error');
          
          console.log(`   Title: ${altTitle}`);
          console.log(`   Is error: ${altIsError}`);
          
          if (!altIsError) {
            console.log(`   ✅ Found working URL: ${altUrl}`);
            fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/chamdalseong-working-page.html', altResponse.data);
            
            // Analyze this working page
            await analyzeWorkingPage(alt$, altUrl);
            return;
          }
          
        } catch (error) {
          console.log(`   ❌ ${altUrl} failed: ${error}`);
        }
      }
      
      console.log('\n💡 Recommendation: The Naver Smart Store may be:');
      console.log('   1. Temporarily closed or inactive');
      console.log('   2. Restricted access (requires login)');
      console.log('   3. Moved to a different URL');
      console.log('   4. Rate limiting our requests');
      
    } else {
      console.log('✅ Main page loaded successfully');
      await analyzeWorkingPage($, storeUrl);
    }
    
  } catch (error) {
    console.error('❌ Failed to analyze Smart Store:', error);
  }
}

async function analyzeWorkingPage($: cheerio.CheerioAPI, url: string): Promise<void> {
  console.log(`\n🔍 Analyzing working page: ${url}`);
  
  // Look for product elements
  const productSelectors = [
    '.item',
    '.product',
    '[data-product-id]',
    '.goods_item',
    '.list_item',
    '.item_inner',
    '.product_item',
    '.goods_area'
  ];
  
  console.log('\n🛍️ Product Elements:');
  productSelectors.forEach(selector => {
    const count = $(selector).length;
    if (count > 0) {
      console.log(`   ${selector}: ${count} elements`);
    }
  });
  
  // Look for navigation or category links
  console.log('\n📂 Navigation Analysis:');
  const navLinks: string[] = [];
  
  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    const text = $(elem).text().trim();
    
    if (href && text && (
      href.includes('category') || 
      href.includes('products') || 
      href.includes('goods') ||
      text.includes('상품') ||
      text.includes('카테고리')
    )) {
      const fullUrl = href.startsWith('http') ? href : `https://smartstore.naver.com${href}`;
      if (!navLinks.includes(fullUrl) && navLinks.length < 10) {
        navLinks.push(fullUrl);
        console.log(`   ${text} -> ${fullUrl}`);
      }
    }
  });
  
  // Check for any data attributes that might indicate product IDs
  console.log('\n📊 Data Attributes:');
  $('[data-product-id], [data-goods-id], [data-item-id]').each((i, elem) => {
    if (i < 5) { // Show first 5
      const productId = $(elem).attr('data-product-id') || $(elem).attr('data-goods-id') || $(elem).attr('data-item-id');
      console.log(`   Product ID: ${productId}`);
    }
  });
  
  // Look for JSON data or API endpoints
  console.log('\n⚡ API/JSON Analysis:');
  $('script').each((_, elem) => {
    const content = $(elem).html() || '';
    if (content.includes('productList') || content.includes('goodsList') || content.includes('"products"')) {
      console.log('   Found script with product data');
      
      // Try to extract JSON data
      const jsonMatch = content.match(/\{[^{}]*"product[^{}]*\}/g);
      if (jsonMatch) {
        console.log(`   JSON objects found: ${jsonMatch.length}`);
      }
    }
  });
}

analyzeSmartStoreWithRetry().catch(console.error);