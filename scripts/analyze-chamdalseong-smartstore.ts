import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import * as fs from 'fs';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosConfig: AxiosRequestConfig = {
  httpsAgent,
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

async function analyzeSmartStore(): Promise<void> {
  console.log('🔍 Analyzing 참달성 Naver Smart Store structure...');
  
  try {
    const storeUrl = 'https://smartstore.naver.com/chamdalseong';
    const response = await axios.get(storeUrl, axiosConfig);
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/chamdalseong-smartstore-homepage.html', response.data);
    console.log('✅ Homepage saved for analysis');
    
    // Analyze page structure
    console.log('\n📋 Page Structure Analysis:');
    
    // Look for product listing patterns
    const productElements = [
      '.item',
      '.product',
      '[data-product-id]',
      '.goods',
      '.list-item',
      '.item-wrap',
      '.product-item'
    ];
    
    productElements.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`   ${selector}: ${count} elements`);
      }
    });
    
    // Look for category links
    console.log('\n📂 Category Analysis:');
    const categoryLinks: string[] = [];
    
    $('a[href*="category"], a[href*="products"], a[href*="goods"]').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text) {
        const fullUrl = href.startsWith('http') ? href : `https://smartstore.naver.com${href}`;
        if (!categoryLinks.includes(fullUrl)) {
          categoryLinks.push(fullUrl);
          console.log(`   ${text} -> ${fullUrl}`);
        }
      }
    });
    
    // Look for pagination or product count indicators
    console.log('\n📊 Product Count Analysis:');
    const productCountTexts = $('*').filter((_, el) => {
      const text = $(el).text();
      return text.includes('개') || text.includes('상품') || text.includes('총') || text.includes('product');
    });
    
    productCountTexts.slice(0, 10).each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.length < 100) {
        console.log(`   Count indicator: "${text}"`);
      }
    });
    
    // Check for AJAX/API endpoints
    console.log('\n⚡ Script Analysis:');
    let hasProductApi = false;
    let apiEndpoints: string[] = [];
    
    $('script').each((_, elem) => {
      const scriptContent = $(elem).html() || '';
      
      // Look for API endpoints
      const apiMatches = scriptContent.match(/["']\/[^"']*api[^"']*["']/g);
      if (apiMatches) {
        apiMatches.forEach(match => {
          const endpoint = match.replace(/["']/g, '');
          if (!apiEndpoints.includes(endpoint)) {
            apiEndpoints.push(endpoint);
          }
        });
      }
      
      if (scriptContent.includes('product') || scriptContent.includes('goods')) {
        hasProductApi = true;
      }
    });
    
    console.log(`   Has product-related scripts: ${hasProductApi}`);
    if (apiEndpoints.length > 0) {
      console.log('   API endpoints found:');
      apiEndpoints.slice(0, 5).forEach(endpoint => {
        console.log(`     ${endpoint}`);
      });
    }
    
    // Look for store ID or channel ID
    console.log('\n🏪 Store Information:');
    const storeId = response.data.match(/channelNo['"]\s*:\s*['"]([^'"]+)['"]/);
    const channelId = response.data.match(/channel['"]\s*:\s*['"]([^'"]+)['"]/);
    
    if (storeId) {
      console.log(`   Store/Channel ID: ${storeId[1]}`);
    }
    if (channelId) {
      console.log(`   Channel ID: ${channelId[1]}`);
    }
    
    // Check if this is a redirect or the actual store page
    console.log('\n🔗 Page Type:');
    const title = $('title').text();
    const isStorePage = title.includes('스마트스토어') || title.includes('smartstore');
    console.log(`   Title: ${title}`);
    console.log(`   Is actual store page: ${isStorePage}`);
    
    // Look for product listing URLs
    console.log('\n🛍️ Product Listing URLs:');
    const possibleListUrls = [
      '/chamdalseong/products',
      '/chamdalseong/category',
      '/chamdalseong/goods'
    ];
    
    for (const path of possibleListUrls) {
      const testUrl = `https://smartstore.naver.com${path}`;
      console.log(`   Testing: ${testUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing Smart Store:', error);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Headers:`, error.response.headers);
    }
  }
}

analyzeSmartStore().catch(console.error);