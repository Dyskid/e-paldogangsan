import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeJpsStructure() {
  const baseUrl = 'https://jpsmall.com';
  console.log('Analyzing 지평선몰(김제) structure...');
  
  const outputDir = path.join(__dirname, '../../output/jps');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Test the main page
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync(path.join(outputDir, 'jps-homepage.html'), response.data);
    console.log('✅ Homepage saved for analysis');
    
    // Analyze page structure
    console.log('\n📄 Page Analysis:');
    const title = $('title').text();
    console.log(`   Title: ${title}`);
    
    // Look for product links
    const productSelectors = [
      'a[href*="product"]',
      'a[href*="item"]',
      'a[href*="goods"]',
      'a[href*="detail"]',
      '.product-item a',
      '.goods-list a',
      '.item-link',
      '[class*="product"] a',
      '[class*="item"] a'
    ];
    
    let productLinks: string[] = [];
    let workingProductSelector = '';
    
    for (const selector of productSelectors) {
      const links = $(selector);
      if (links.length > 0) {
        console.log(`   ✅ Found ${links.length} potential product links with selector: ${selector}`);
        links.each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && !href.includes('javascript:') && !href.startsWith('#')) {
            productLinks.push(href.startsWith('http') ? href : new URL(href, baseUrl).href);
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
      '[class*="category"] a',
      '[class*="menu"] a'
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
            categories.push({
              name: text,
              url: href.startsWith('http') ? href : new URL(href, baseUrl).href
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
            'Referer': baseUrl
          },
          timeout: 30000
        });
        
        const $product = cheerio.load(productResponse.data);
        fs.writeFileSync(path.join(outputDir, 'jps-product-sample.html'), productResponse.data);
        
        // Try to extract product data
        const nameSelectors = ['h1', 'h2', '.product-name', '.goods-name', '.item-name', '[class*="title"]'];
        const priceSelectors = ['.price', '.product-price', '.goods-price', '[class*="price"]', 'strong'];
        const imageSelectors = ['img.product-image', '.product-img img', '.goods-img img', '[class*="thumb"] img', 'img[src*="product"]'];
        
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
          const price = $product(selector).text();
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
    
    // Test a sample category page if found
    let sampleCategoryData = null;
    if (categories.length > 0) {
      const sampleCategory = categories[0];
      console.log(`\n🔍 Testing sample category page: ${sampleCategory.url}`);
      
      try {
        const categoryResponse = await axios.get(sampleCategory.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': baseUrl
          },
          timeout: 30000
        });
        
        const $category = cheerio.load(categoryResponse.data);
        fs.writeFileSync(path.join(outputDir, 'jps-category-sample.html'), categoryResponse.data);
        
        // Count products in category
        let categoryProductCount = 0;
        for (const selector of productSelectors) {
          const products = $category(selector);
          if (products.length > categoryProductCount) {
            categoryProductCount = products.length;
          }
        }
        
        sampleCategoryData = {
          name: sampleCategory.name,
          url: sampleCategory.url,
          productCount: categoryProductCount
        };
        
        console.log('   ✅ Sample category analyzed:', sampleCategoryData);
        
      } catch (error: any) {
        console.log(`   ❌ Failed to fetch sample category: ${error.message}`);
      }
    }
    
    // Analyze pagination
    const paginationSelectors = ['.pagination', '.paging', '.page-list', '[class*="page"]'];
    let hasPagination = false;
    
    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        hasPagination = true;
        console.log(`\n📄 Found pagination with selector: ${selector}`);
        break;
      }
    }
    
    // Save analysis results
    const analysisResult = {
      mallName: '지평선몰(김제)',
      url: baseUrl,
      analyzedAt: new Date().toISOString(),
      pageStructure: {
        title: title,
        hasProducts: productLinks.length > 0,
        productCount: productLinks.length,
        categoryCount: categories.length,
        hasPagination: hasPagination
      },
      selectors: {
        products: workingProductSelector || 'Not found',
        categories: workingCategorySelector || 'Not found',
        productName: sampleProductData?.name ? 'Found' : 'Not found',
        productPrice: sampleProductData?.price ? 'Found' : 'Not found',
        productImage: sampleProductData?.image ? 'Found' : 'Not found'
      },
      sampleData: {
        product: sampleProductData,
        category: sampleCategoryData
      },
      categories: categories.slice(0, 10), // First 10 categories
      recommendations: [
        productLinks.length === 0 ? 'No products found - check if site uses JavaScript rendering' : 'Products found successfully',
        categories.length === 0 ? 'No categories found - manual category discovery may be needed' : 'Categories found successfully',
        hasPagination ? 'Pagination found - implement page traversal' : 'No pagination found - all products may be on one page'
      ]
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'jps-analysis.json'),
      JSON.stringify(analysisResult, null, 2)
    );
    
    console.log('\n✅ Analysis complete! Results saved to:');
    console.log(`   ${outputDir}/jps-analysis.json`);
    console.log(`   ${outputDir}/jps-homepage.html`);
    if (sampleProductData) {
      console.log(`   ${outputDir}/jps-product-sample.html`);
    }
    if (sampleCategoryData) {
      console.log(`   ${outputDir}/jps-category-sample.html`);
    }
    
  } catch (error: any) {
    console.error('\n❌ Error analyzing 지평선몰:', error.message);
    
    // Save error information
    const errorInfo = {
      mallName: '지평선몰(김제)',
      url: baseUrl,
      error: error.message,
      analyzedAt: new Date().toISOString(),
      recommendations: [
        'Check if the URL is correct and accessible',
        'The site may require special headers or cookies',
        'Consider using Puppeteer/Playwright for JavaScript-heavy sites',
        'Check for anti-scraping measures like Cloudflare'
      ]
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'jps-error-analysis.json'),
      JSON.stringify(errorInfo, null, 2)
    );
  }
}

// Run the analysis
if (require.main === module) {
  analyzeJpsStructure();
}

export { analyzeJpsStructure };