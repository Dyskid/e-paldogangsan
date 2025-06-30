import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeNajuMallStructure() {
  const baseUrl = 'https://najumall.kr';
  
  try {
    console.log('📊 Analyzing Naju Mall structure...');
    
    // Analyze homepage
    console.log('\n🏠 Fetching homepage...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(homepageResponse.data);
    
    // Save homepage for analysis
    fs.writeFileSync('./scripts/output/najumall-homepage.html', homepageResponse.data);
    console.log('✅ Homepage saved to najumall-homepage.html');
    
    // Analyze structure
    const analysis = {
      url: baseUrl,
      title: $('title').text().trim(),
      platform: 'Unknown',
      structure: {
        navigation: [] as any[],
        productListings: [] as any[],
        categoryLinks: [] as any[],
        productLinks: [] as string[]
      },
      selectors: {
        productList: '',
        productLink: '',
        productTitle: '',
        productPrice: '',
        productImage: ''
      }
    };
    
    // Check for common e-commerce platforms
    const bodyHtml = $('body').html() || '';
    const headHtml = $('head').html() || '';
    
    if (bodyHtml.includes('cafe24') || headHtml.includes('cafe24')) {
      analysis.platform = 'Cafe24';
    } else if (bodyHtml.includes('makeshop') || headHtml.includes('makeshop')) {
      analysis.platform = 'MakeShop';
    } else if (bodyHtml.includes('godomall') || headHtml.includes('godomall')) {
      analysis.platform = 'Godomall';
    } else if (bodyHtml.includes('shopify')) {
      analysis.platform = 'Shopify';
    } else if (bodyHtml.includes('woocommerce')) {
      analysis.platform = 'WooCommerce';
    } else if (bodyHtml.includes('xans-product') || headHtml.includes('xans-product')) {
      analysis.platform = 'Cafe24';
    }
    
    // Find navigation and category links
    $('nav a, .gnb a, .category a, .menu a, .nav a, .lnb a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && !href.startsWith('#') && !href.startsWith('javascript')) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        analysis.structure.categoryLinks.push({
          text,
          url: fullUrl
        });
      }
    });
    
    // Find product listings on homepage
    const productSelectors = [
      '.product-list .product',
      '.goods-list .goods',
      '.item-list .item',
      '.product_list .product',
      '.goods_list .goods',
      '.prd-list .prd',
      '.list-product .product',
      '.product-item',
      '.goods-item',
      '.item',
      '.prd_list .prd',
      '.xans-product-listmain .xans-record-',
      '.product_box',
      '.goods_box',
      'ul.prdList li',
      '.thumbnail'
    ];
    
    for (const selector of productSelectors) {
      const products = $(selector);
      if (products.length > 0) {
        console.log(`🎯 Found ${products.length} products with selector: ${selector}`);
        analysis.structure.productListings.push({
          selector: selector,
          count: products.length
        });
        
        // Analyze first product for structure
        const firstProduct = products.first();
        const titleSelectors = ['.title', '.name', '.prd-name', '.goods-name', '.product-name', 'h3', 'h4', '.subject', '.prd_name', '.pname'];
        const priceSelectors = ['.price', '.cost', '.amount', '.prd-price', '.goods-price', '.product-price', '.prd_price'];
        const imageSelectors = ['img', '.thumb img', '.image img', '.prd-img img', '.prd_thumb img'];
        const linkSelectors = ['a', '.link', 'a.prd_link'];
        
        titleSelectors.forEach(sel => {
          if (firstProduct.find(sel).length > 0) {
            analysis.selectors.productTitle = sel;
          }
        });
        
        priceSelectors.forEach(sel => {
          if (firstProduct.find(sel).length > 0) {
            analysis.selectors.productPrice = sel;
          }
        });
        
        imageSelectors.forEach(sel => {
          if (firstProduct.find(sel).length > 0) {
            analysis.selectors.productImage = sel;
          }
        });
        
        linkSelectors.forEach(sel => {
          if (firstProduct.find(sel).length > 0) {
            analysis.selectors.productLink = sel;
          }
        });
        
        break;
      }
    }
    
    // Find category pages to explore
    const commonCategoryPaths = [
      '/product/list.html',
      '/goods/catalog',
      '/shop/goods',
      '/category',
      '/products',
      '/goods',
      '/shop/list',
      '/shop'
    ];
    
    for (const path of commonCategoryPaths) {
      try {
        const categoryUrl = new URL(path, baseUrl).href;
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000,
          maxRedirects: 5
        });
        
        if (categoryResponse.status === 200) {
          analysis.structure.navigation.push({
            type: 'category_page',
            url: categoryUrl,
            status: 'accessible'
          });
          console.log(`✅ Found accessible category page: ${categoryUrl}`);
        }
      } catch (error) {
        // Ignore failed category page attempts
      }
    }
    
    // Try to find actual product links
    $('a[href*="product"], a[href*="goods"], a[href*="view"], a[href*="detail"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        if (analysis.structure.productLinks.length < 10) { // Limit to first 10
          analysis.structure.productLinks.push(fullUrl);
        }
      }
    });
    
    console.log('\n📋 Analysis Results:');
    console.log(`Title: ${analysis.title}`);
    console.log(`Platform: ${analysis.platform}`);
    console.log(`Category Links: ${analysis.structure.categoryLinks.length}`);
    console.log(`Product Listings: ${analysis.structure.productListings.length}`);
    console.log(`Product Links: ${analysis.structure.productLinks.length}`);
    console.log(`Selectors found: ${Object.values(analysis.selectors).filter(s => s).length}/4`);
    
    // Save analysis
    fs.writeFileSync('./scripts/output/najumall-structure-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('✅ Analysis saved to najumall-structure-analysis.json');
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error analyzing Naju Mall structure:', error);
    throw error;
  }
}

// Run the analysis
analyzeNajuMallStructure()
  .then(() => {
    console.log('\n🎉 Naju Mall structure analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error.message);
    process.exit(1);
  });