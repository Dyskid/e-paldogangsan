import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeJinanStructure() {
  // Korean domain URL
  const baseUrl = 'https://xn--299az5xoii3qb66f.com';
  const readableUrl = 'https://진안고원몰.com';
  console.log('Analyzing 진안고원몰 structure...');
  console.log(`Using punycode URL: ${baseUrl}`);
  console.log(`Readable URL: ${readableUrl}`);
  
  const outputDir = path.join(__dirname, '../../output/jinan');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Test the main page
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      timeout: 30000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync(path.join(outputDir, 'jinan-homepage.html'), response.data);
    console.log('✅ Homepage saved for analysis');
    
    // Analyze page structure
    console.log('\n📄 Page Analysis:');
    const title = $('title').text();
    console.log(`   Title: ${title}`);
    
    // Check for common Korean e-commerce platforms
    const platformIndicators = {
      cafe24: response.data.includes('cafe24') || response.data.includes('ec-base-'),
      makeshop: response.data.includes('makeshop') || response.data.includes('makeshop.kr'),
      godo: response.data.includes('godo') || response.data.includes('goods_view.php'),
      sixshop: response.data.includes('sixshop'),
      imweb: response.data.includes('imweb') || response.data.includes('im-'),
      custom: true // default
    };
    
    let platform = 'custom';
    for (const [name, detected] of Object.entries(platformIndicators)) {
      if (detected && name !== 'custom') {
        platform = name;
        console.log(`   Platform detected: ${name}`);
        break;
      }
    }
    
    // Look for product links based on platform
    let productSelectors = [
      'a[href*="product"]',
      'a[href*="goods"]',
      'a[href*="item"]',
      'a[href*="detail"]',
      '.product-item a',
      '.goods-list a',
      '.item-link'
    ];
    
    // Add platform-specific selectors
    if (platform === 'cafe24') {
      productSelectors.push('.xans-product-listnormal a', '.prdList a');
    } else if (platform === 'makeshop') {
      productSelectors.push('.item a', '.product a');
    } else if (platform === 'godo') {
      productSelectors.push('a[href*="goods_view.php"]');
    }
    
    let productLinks: string[] = [];
    let workingProductSelector = '';
    
    for (const selector of productSelectors) {
      const links = $(selector);
      if (links.length > 0) {
        console.log(`   ✅ Found ${links.length} potential product links with selector: ${selector}`);
        links.each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && !href.includes('javascript:') && !href.startsWith('#')) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
            if (!productLinks.includes(fullUrl)) {
              productLinks.push(fullUrl);
            }
          }
        });
        if (productLinks.length > 0) {
          workingProductSelector = selector;
          break;
        }
      }
    }
    
    // Look for categories
    const categorySelectors = [
      'a[href*="category"]',
      'a[href*="cate"]',
      '.menu a',
      '.nav a',
      '.gnb a',
      '.category-list a',
      '#category a',
      '.xans-layout-category a' // Cafe24 specific
    ];
    
    const categories: { name: string; url: string }[] = [];
    let workingCategorySelector = '';
    
    for (const selector of categorySelectors) {
      const catLinks = $(selector);
      if (catLinks.length > 0) {
        console.log(`   ✅ Found ${catLinks.length} potential category links with selector: ${selector}`);
        catLinks.each((i, elem) => {
          const text = $(elem).text().trim();
          const href = $(elem).attr('href');
          if (text && href && text.length < 50 && !href.includes('javascript:')) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
            categories.push({
              name: text,
              url: fullUrl
            });
          }
        });
        if (categories.length > 0) {
          workingCategorySelector = selector;
          break;
        }
      }
    }
    
    console.log(`\n📊 Found ${productLinks.length} product links`);
    console.log(`📂 Found ${categories.length} categories`);
    
    // Test a sample product page if found
    let sampleProductData = null;
    if (productLinks.length > 0) {
      const sampleUrl = productLinks[0];
      console.log(`\n🔍 Testing sample product page: ${sampleUrl}`);
      
      try {
        const productResponse = await axios.get(sampleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': baseUrl,
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          },
          timeout: 30000
        });
        
        const $product = cheerio.load(productResponse.data);
        fs.writeFileSync(path.join(outputDir, 'jinan-product-sample.html'), productResponse.data);
        
        // Try to extract product data with platform-specific selectors
        let nameSelectors = ['h1', 'h2', '.product-name', '.goods-name', '.item-name'];
        let priceSelectors = ['.price', '.product-price', '.goods-price'];
        let imageSelectors = ['img.product-image', '.product-img img', '.goods-img img'];
        
        if (platform === 'cafe24') {
          nameSelectors.push('.xans-product-detail .name', '.headingArea h2');
          priceSelectors.push('#span_product_price_text', '.xans-product-detail .price');
          imageSelectors.push('.xans-product-image img', '.keyImg img');
        }
        
        let productName = '';
        let productPrice = '';
        let productImage = '';
        
        for (const selector of nameSelectors) {
          const name = $product(selector).first().text().trim();
          if (name && name.length > 2 && name.length < 200) {
            productName = name;
            break;
          }
        }
        
        for (const selector of priceSelectors) {
          const priceElem = $product(selector).first();
          const price = priceElem.text();
          if (price && (price.includes('원') || price.includes('₩') || /\d/.test(price))) {
            productPrice = price.trim();
            break;
          }
        }
        
        for (const selector of imageSelectors) {
          const img = $product(selector).first().attr('src');
          if (img) {
            productImage = img.startsWith('http') ? img : new URL(img, sampleUrl).href;
            break;
          }
        }
        
        sampleProductData = {
          url: sampleUrl,
          name: productName,
          price: productPrice,
          image: productImage
        };
        
        console.log('   ✅ Sample product extracted:', sampleProductData);
        
      } catch (error: any) {
        console.log(`   ❌ Failed to fetch sample product: ${error.message}`);
      }
    }
    
    // Check for search functionality
    const searchSelectors = ['input[name*="search"]', 'input[name*="keyword"]', 'input[type="search"]', '#search', '.search-input'];
    let hasSearch = false;
    let searchInputName = '';
    
    for (const selector of searchSelectors) {
      const searchInput = $(selector).first();
      if (searchInput.length > 0) {
        hasSearch = true;
        searchInputName = searchInput.attr('name') || '';
        console.log(`\n🔍 Found search input: ${selector} (name: ${searchInputName})`);
        break;
      }
    }
    
    // Save analysis results
    const analysisResult = {
      mallName: '진안고원몰',
      url: baseUrl,
      readableUrl: readableUrl,
      platform: platform,
      analyzedAt: new Date().toISOString(),
      pageStructure: {
        title: title,
        hasProducts: productLinks.length > 0,
        productCount: productLinks.length,
        categoryCount: categories.length,
        hasSearch: hasSearch
      },
      selectors: {
        products: workingProductSelector || 'Not found',
        categories: workingCategorySelector || 'Not found',
        searchInput: searchInputName || 'Not found',
        productName: sampleProductData?.name ? 'Found' : 'Not found',
        productPrice: sampleProductData?.price ? 'Found' : 'Not found',
        productImage: sampleProductData?.image ? 'Found' : 'Not found'
      },
      sampleData: {
        product: sampleProductData
      },
      categories: categories.slice(0, 10), // First 10 categories
      recommendations: [
        `Platform detected: ${platform}`,
        productLinks.length === 0 ? 'No products found - check if site uses JavaScript rendering' : 'Products found successfully',
        categories.length === 0 ? 'No categories found - manual category discovery may be needed' : 'Categories found successfully',
        hasSearch ? 'Search functionality available' : 'No search functionality found',
        'Korean domain (한글 도메인) - use punycode for API calls'
      ]
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'jinan-analysis.json'),
      JSON.stringify(analysisResult, null, 2)
    );
    
    console.log('\n✅ Analysis complete! Results saved to:');
    console.log(`   ${outputDir}/jinan-analysis.json`);
    console.log(`   ${outputDir}/jinan-homepage.html`);
    if (sampleProductData) {
      console.log(`   ${outputDir}/jinan-product-sample.html`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error analyzing 진안고원몰:', error.message);
    
    // Save error information
    const errorInfo = {
      mallName: '진안고원몰',
      url: baseUrl,
      readableUrl: readableUrl,
      error: error.message,
      analyzedAt: new Date().toISOString(),
      recommendations: [
        'Check if the URL is correct and accessible',
        'Korean domains require punycode conversion',
        'The site may require special headers or cookies',
        'Consider using Puppeteer/Playwright for JavaScript-heavy sites',
        'Check for anti-scraping measures'
      ]
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'jinan-error-analysis.json'),
      JSON.stringify(errorInfo, null, 2)
    );
  }
}

// Run the analysis
if (require.main === module) {
  analyzeJinanStructure();
}

export { analyzeJinanStructure };