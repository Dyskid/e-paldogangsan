import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeBuanStructure() {
  const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
  const homeUrl = baseUrl;
  
  console.log(`Analyzing 부안 텃밭할매 mall structure...`);
  console.log(`Homepage: ${homeUrl}`);
  
  try {
    // Fetch homepage
    const response = await axios.get(homeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    // Save homepage HTML for inspection
    fs.writeFileSync('./scripts/output/buan-homepage.html', response.data);
    console.log('Homepage HTML saved to buan-homepage.html');
    
    const $ = cheerio.load(response.data);
    
    // Look for navigation links and product categories
    const navLinks = new Set<string>();
    const productLinks = new Set<string>();
    
    // Find all links
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        // Look for shop/product related links
        if (href.includes('shop') || href.includes('product') || href.includes('goods') || 
            href.includes('item') || href.includes('category') || href.includes('list')) {
          navLinks.add(href);
        }
        
        // Look for specific product URLs
        if (href.includes('detail') || href.includes('view') || href.includes('product_no') ||
            href.includes('branduid') || href.includes('goodsno') || href.includes('itemid') ||
            href.includes('prod') || href.includes('idx')) {
          productLinks.add(href);
        }
      }
    });
    
    console.log(`\nFound ${navLinks.size} shop-related links`);
    console.log('Sample shop links:');
    Array.from(navLinks).slice(0, 10).forEach(link => {
      console.log(`  - ${link}`);
    });
    
    console.log(`\nFound ${productLinks.size} potential product links`);
    console.log('Sample product links:');
    Array.from(productLinks).slice(0, 10).forEach(link => {
      console.log(`  - ${link}`);
    });
    
    // Check for common e-commerce patterns
    console.log('\n=== Checking for e-commerce patterns ===');
    
    // Check for CAFE24
    if (response.data.includes('cafe24') || response.data.includes('CAFE24')) {
      console.log('✓ CAFE24 platform detected');
    }
    
    // Check for MakeShop
    if (response.data.includes('makeshop') || response.data.includes('makeshopde')) {
      console.log('✓ MakeShop platform detected');
    }
    
    // Check for Godo
    if (response.data.includes('godo') || response.data.includes('godomall')) {
      console.log('✓ Godo platform detected');
    }
    
    // Check for shopping mall builder
    if (response.data.includes('imweb') || response.data.includes('wix') || response.data.includes('squarespace')) {
      console.log('✓ Website builder platform detected');
    }
    
    // Look for category menus
    console.log('\n=== Category Analysis ===');
    const categories: string[] = [];
    
    // Common category selectors
    const categorySelectors = [
      '.category', '.menu', '.nav', '.gnb', '.lnb',
      '#category', '#menu', '#nav', '#gnb', '#lnb',
      '[class*="category"]', '[class*="menu"]', '[id*="category"]',
      '.mainmenu', '.submenu', '.product-category'
    ];
    
    categorySelectors.forEach(selector => {
      $(selector).find('a').each((_, element) => {
        const text = $(element).text().trim();
        const href = $(element).attr('href');
        if (text && href && text.length > 1) {
          categories.push(`${text} -> ${href}`);
        }
      });
    });
    
    if (categories.length > 0) {
      console.log('Found categories:');
      categories.slice(0, 15).forEach(cat => console.log(`  - ${cat}`));
    }
    
    // Look for product patterns in HTML
    console.log('\n=== Product Pattern Analysis ===');
    const productPatterns = [
      'product_no=', 'branduid=', 'goodsno=', 'itemid=', 'goods_id=',
      'prd_no=', 'prod_no=', 'item_no=', 'pid=', 'idx=', 'id='
    ];
    
    productPatterns.forEach(pattern => {
      if (response.data.includes(pattern)) {
        console.log(`✓ Found product pattern: ${pattern}`);
        
        // Extract sample IDs
        const regex = new RegExp(`${pattern}(\\d+)`, 'g');
        const matches = response.data.match(regex);
        if (matches) {
          console.log(`  Sample IDs: ${matches.slice(0, 3).join(', ')}`);
        }
      }
    });
    
    // Look for image patterns
    console.log('\n=== Image Pattern Analysis ===');
    const images = $('img').filter((_, el) => {
      const src = $(el).attr('src') || '';
      return src.includes('product') || src.includes('goods') || src.includes('item') ||
             src.includes('upload') || src.includes('data') || src.includes('thumb');
    });
    
    console.log(`Found ${images.length} potential product images`);
    images.slice(0, 5).each((_, el) => {
      console.log(`  - ${$(el).attr('src')}`);
    });
    
    // Check for specific Korean shopping mall patterns
    console.log('\n=== Korean Shopping Mall Patterns ===');
    const koreanPatterns = [
      '상품', '제품', '쇼핑', '장터', '마켓', '몰',
      '농산물', '특산품', '직판', '농장', '농협'
    ];
    
    koreanPatterns.forEach(pattern => {
      if (response.data.includes(pattern)) {
        console.log(`✓ Found Korean pattern: ${pattern}`);
      }
    });
    
    // Look for forms that might indicate product pages
    console.log('\n=== Form Analysis ===');
    const forms = $('form');
    console.log(`Found ${forms.length} forms`);
    
    forms.slice(0, 3).each((_, form) => {
      const action = $(form).attr('action');
      const method = $(form).attr('method');
      if (action) {
        console.log(`  Form: ${method || 'GET'} -> ${action}`);
      }
    });
    
    // Save analysis results
    const analysis = {
      timestamp: Date.now(),
      url: homeUrl,
      platform: {
        cafe24: response.data.includes('cafe24') || response.data.includes('CAFE24'),
        makeshop: response.data.includes('makeshop') || response.data.includes('makeshopde'),
        godo: response.data.includes('godo') || response.data.includes('godomall'),
        builder: response.data.includes('imweb') || response.data.includes('wix')
      },
      navigation: {
        shopLinks: Array.from(navLinks).slice(0, 20),
        productLinks: Array.from(productLinks).slice(0, 20)
      },
      categories: categories.slice(0, 20),
      productPatterns: productPatterns.filter(p => response.data.includes(p)),
      sampleImages: images.slice(0, 10).map((_, el) => $(el).attr('src')).get(),
      pageTitle: $('title').text().trim(),
      hasKoreanContent: koreanPatterns.some(p => response.data.includes(p))
    };
    
    fs.writeFileSync('./scripts/output/buan-structure-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\nAnalysis saved to buan-structure-analysis.json');
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing structure:', error.message);
    throw error;
  }
}

analyzeBuanStructure().catch(console.error);