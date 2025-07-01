import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeJCMallStructure() {
  console.log('🔍 Starting JC Mall structure analysis...');
  
  const baseUrl = 'https://jcmall.net';
  const analysis: any = {
    baseUrl,
    timestamp: new Date().toISOString(),
    pages: {},
    productUrls: [],
    categories: [],
    structure: {}
  };

  try {
    // Analyze homepage
    console.log('📋 Fetching homepage...');
    const homeResponse = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(homeResponse.data);
    
    // Save homepage HTML for debugging
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-homepage.html',
      homeResponse.data
    );

    analysis.pages.homepage = {
      title: $('title').text(),
      description: $('meta[name="description"]').attr('content'),
      status: 'success'
    };

    // Look for product links and categories
    console.log('🔍 Analyzing page structure...');
    
    // Check common product URL patterns
    const productLinks = new Set<string>();
    
    // Look for various link patterns
    $('a[href*="/product"], a[href*="/goods"], a[href*="/item"], a[href*="product_no"], a[href*="goods_no"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
        productLinks.add(fullUrl);
      }
    });

    // Look for category links
    $('a[href*="/category"], a[href*="/cate"], a[href*="category_no"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text) {
        analysis.categories.push({
          name: text,
          url: href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`
        });
      }
    });

    analysis.productUrls = Array.from(productLinks);
    
    console.log(`📦 Found ${analysis.productUrls.length} potential product URLs`);
    console.log(`🏷️ Found ${analysis.categories.length} categories`);

    // Analyze structure
    analysis.structure = {
      hasProducts: analysis.productUrls.length > 0,
      hasCategories: analysis.categories.length > 0,
      mainElements: {
        navigation: $('nav, .nav, #nav, .navigation').length > 0,
        productGrid: $('.product, .goods, .item, .product-item').length,
        searchBox: $('input[type="search"], .search, #search').length > 0
      }
    };

    // Try to find a products page or shop page
    const shopLinks = $('a[href*="/shop"], a[href*="/product"], a[href*="/goods"], a[href*="/mall"]').first();
    if (shopLinks.length > 0) {
      const shopUrl = shopLinks.attr('href');
      if (shopUrl) {
        const fullShopUrl = shopUrl.startsWith('http') ? shopUrl : `${baseUrl}${shopUrl.startsWith('/') ? '' : '/'}${shopUrl}`;
        console.log(`🛍️ Found shop page: ${fullShopUrl}`);
        
        try {
          const shopResponse = await axios.get(fullShopUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const $shop = cheerio.load(shopResponse.data);
          
          // Look for more product links on shop page
          $shop('a[href*="/product"], a[href*="/goods"], a[href*="/item"], a[href*="product_no"], a[href*="goods_no"]').each((i, el) => {
            const href = $shop(el).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
              productLinks.add(fullUrl);
            }
          });
          
          analysis.productUrls = Array.from(productLinks);
          console.log(`📦 Updated product URLs count: ${analysis.productUrls.length}`);
          
        } catch (error) {
          console.log('⚠️ Could not fetch shop page');
        }
      }
    }

    // If we still don't have many products, try common paths
    if (analysis.productUrls.length < 5) {
      const commonPaths = ['/shop', '/products', '/goods', '/mall', '/store'];
      
      for (const path of commonPaths) {
        try {
          console.log(`🔍 Trying path: ${path}`);
          const pathResponse = await axios.get(`${baseUrl}${path}`, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const $path = cheerio.load(pathResponse.data);
          
          $path('a[href*="/product"], a[href*="/goods"], a[href*="/item"], a[href*="product_no"], a[href*="goods_no"]').each((i, el) => {
            const href = $path(el).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
              productLinks.add(fullUrl);
            }
          });
          
          if (productLinks.size > analysis.productUrls.length) {
            analysis.productUrls = Array.from(productLinks);
            console.log(`📦 Found more products at ${path}: ${analysis.productUrls.length} total`);
            break;
          }
          
        } catch (error) {
          console.log(`❌ Path ${path} not accessible`);
        }
      }
    }

    // Sample a few product URLs to understand the structure
    if (analysis.productUrls.length > 0) {
      console.log('\n📋 Sample product URLs:');
      analysis.productUrls.slice(0, 5).forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
    }

    console.log('\n📊 Analysis Summary:');
    console.log(`- Product URLs found: ${analysis.productUrls.length}`);
    console.log(`- Categories found: ${analysis.categories.length}`);
    console.log(`- Has navigation: ${analysis.structure.mainElements.navigation}`);
    console.log(`- Product grid elements: ${analysis.structure.mainElements.productGrid}`);

  } catch (error: any) {
    console.error('❌ Error analyzing JC Mall:', error.message);
    analysis.error = error.message;
  }

  // Save analysis
  const outputPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-analysis.json';
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`💾 Analysis saved to: ${outputPath}`);

  return analysis;
}

// Run the analysis
analyzeJCMallStructure().catch(console.error);