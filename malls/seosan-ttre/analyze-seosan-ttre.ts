import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeSeosanttreStructure() {
  const baseUrl = 'https://seosanttre.com';
  const homeUrl = `${baseUrl}/index.html`;
  
  console.log(`Analyzing 서산뜨레 mall structure...`);
  console.log(`Homepage: ${homeUrl}`);
  
  try {
    // Fetch homepage
    const response = await axios.get(homeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    // Save homepage HTML for inspection
    fs.writeFileSync('./seosanttre-homepage.html', response.data);
    console.log('Homepage HTML saved to seosanttre-homepage.html');
    
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
            href.includes('branduid') || href.includes('goodsno') || href.includes('itemid')) {
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
    
    // Look for category menus
    console.log('\n=== Category Analysis ===');
    const categories: string[] = [];
    
    // Common category selectors
    const categorySelectors = [
      '.category', '.menu', '.nav', '.gnb', '.lnb',
      '#category', '#menu', '#nav', '#gnb', '#lnb',
      '[class*="category"]', '[class*="menu"]', '[id*="category"]'
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
      categories.slice(0, 10).forEach(cat => console.log(`  - ${cat}`));
    }
    
    // Look for product patterns in HTML
    console.log('\n=== Product Pattern Analysis ===');
    const productPatterns = [
      'product_no=', 'branduid=', 'goodsno=', 'itemid=', 'goods_id=',
      'prd_no=', 'prod_no=', 'item_no=', 'pid='
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
             src.includes('upload') || src.includes('data');
    });
    
    console.log(`Found ${images.length} potential product images`);
    images.slice(0, 5).each((_, el) => {
      console.log(`  - ${$(el).attr('src')}`);
    });
    
    // Save analysis results
    const analysis = {
      timestamp: Date.now(),
      url: homeUrl,
      platform: {
        cafe24: response.data.includes('cafe24') || response.data.includes('CAFE24'),
        makeshop: response.data.includes('makeshop') || response.data.includes('makeshopde'),
        godo: response.data.includes('godo') || response.data.includes('godomall')
      },
      navigation: {
        shopLinks: Array.from(navLinks).slice(0, 20),
        productLinks: Array.from(productLinks).slice(0, 20)
      },
      categories: categories.slice(0, 20),
      productPatterns: productPatterns.filter(p => response.data.includes(p)),
      sampleImages: images.slice(0, 10).map((_, el) => $(el).attr('src')).get()
    };
    
    fs.writeFileSync('./seosanttre-structure-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('\nAnalysis saved to seosanttre-structure-analysis.json');
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing structure:', error.message);
    throw error;
  }
}

analyzeSeosanttreStructure().catch(console.error);