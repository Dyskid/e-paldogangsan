import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosConfig: AxiosRequestConfig = {
  httpsAgent,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

async function findChamdsCategories(): Promise<void> {
  console.log('🔍 Finding Chamds product categories...');
  
  try {
    // Fetch homepage
    const response = await axios.get('https://chamds.com/', axiosConfig);
    const $ = cheerio.load(response.data);
    
    console.log('✅ Homepage fetched successfully');
    
    // Look for navigation menus and category links
    const categoryLinks: string[] = [];
    
    // Check main navigation
    $('#header a, .gnb a, .category a, .menu a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && (
        href.includes('/product/') || 
        href.includes('/category/') ||
        href.includes('cate=') ||
        href.includes('?ca_id=')
      )) {
        const fullUrl = href.startsWith('http') ? href : `https://chamds.com${href}`;
        if (!categoryLinks.includes(fullUrl)) {
          categoryLinks.push(fullUrl);
          console.log(`📂 Found category link: ${text} -> ${fullUrl}`);
        }
      }
    });
    
    // Look for product links in any sections
    $('a[href*="/product/"]').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://chamds.com${href}`;
        if (!categoryLinks.includes(fullUrl)) {
          categoryLinks.push(fullUrl);
          console.log(`🛍️ Found product link: ${text} -> ${fullUrl}`);
        }
      }
    });
    
    console.log(`\n📊 Found ${categoryLinks.length} potential category/product pages`);
    
    // Test a few category pages to see if they contain products
    const testUrls = categoryLinks.slice(0, 5); // Test first 5
    
    for (const url of testUrls) {
      try {
        console.log(`\n🧪 Testing: ${url}`);
        const catResponse = await axios.get(url, axiosConfig);
        const cat$ = cheerio.load(catResponse.data);
        
        // Look for product items
        const productItems = cat$('.xans-product-listitem, .item, .product-item, .prdItem').length;
        const productImages = cat$('img[src*="product"], img[alt*="product"]').length;
        const priceElements = cat$('.price, .won, [class*="price"]').length;
        
        console.log(`   Products found: ${productItems} items, ${productImages} images, ${priceElements} prices`);
        
        if (productItems > 0 || (productImages > 0 && priceElements > 0)) {
          console.log(`   ✅ This page appears to have products!`);
          
          // Sample some product info
          cat$('.xans-product-listitem, .item, .product-item, .prdItem').slice(0, 3).each((i, elem) => {
            const name = cat$(elem).find('a, .name, .title').text().trim();
            const price = cat$(elem).find('.price, .won, [class*="price"]').text().trim();
            console.log(`     Sample ${i+1}: ${name} - ${price}`);
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        
      } catch (error) {
        console.log(`   ❌ Error fetching ${url}: ${error}`);
      }
    }
    
    // Also try common Cafe24 category patterns
    const commonPatterns = [
      '/category/농산물/25/',
      '/category/과일/26/',
      '/category/채소/27/',
      '/product/list.html?cate_no=25',
      '/product/list.html?cate_no=26',
      '/product/list.html?cate_no=27'
    ];
    
    console.log('\n🔍 Testing common Cafe24 category patterns...');
    
    for (const pattern of commonPatterns) {
      try {
        const testUrl = `https://chamds.com${pattern}`;
        console.log(`\n🧪 Testing pattern: ${testUrl}`);
        
        const response = await axios.get(testUrl, axiosConfig);
        const $ = cheerio.load(response.data);
        
        const productCount = $('.xans-product-listitem').length;
        const registeredProducts = $('text()').filter((_, el) => 
          $(el).text().includes('등록 제품')
        ).text();
        
        console.log(`   Product items: ${productCount}`);
        console.log(`   Registration info: ${registeredProducts}`);
        
        if (productCount > 0) {
          console.log(`   ✅ Found products at: ${testUrl}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        // Pattern doesn't exist, that's OK
        console.log(`   ⚠️ Pattern ${pattern} not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding categories:', error);
  }
}

findChamdsCategories().catch(console.error);