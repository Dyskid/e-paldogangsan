import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function exploreNongsarangShop() {
  try {
    console.log('Exploring 농사랑 shop page...');
    
    const shopUrl = 'https://nongsarang.co.kr/shop';
    
    console.log('Fetching shop page...');
    const response = await axios.get(shopUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save shop page for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'nongsarang-shop-page.html'),
      response.data
    );
    
    console.log('Shop page saved. Analyzing for products...');
    
    // Look for product links on shop page
    const productUrls: string[] = [];
    const categoryUrls: string[] = [];
    
    // Common product link patterns
    const productSelectors = [
      'a[href*="/shop/item.html"]',
      'a[href*="/shop/goods"]',
      'a[href*="/item"]',
      'a[href*="num="]',
      '.product a',
      '.goods a',
      '.item a'
    ];
    
    for (const selector of productSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : 'https://nongsarang.co.kr' + href;
          productUrls.push(fullUrl);
        }
      });
    }
    
    // Look for category links
    const categorySelectors = [
      'a[href*="/shop/list.html"]',
      'a[href*="category"]',
      'a[href*="cate"]',
      '.category a',
      '.menu a'
    ];
    
    for (const selector of categorySelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : 'https://nongsarang.co.kr' + href;
          categoryUrls.push(fullUrl);
        }
      });
    }
    
    // Remove duplicates
    const uniqueProductUrls = [...new Set(productUrls)];
    const uniqueCategoryUrls = [...new Set(categoryUrls)];
    
    console.log(`Found ${uniqueProductUrls.length} potential product URLs`);
    console.log(`Found ${uniqueCategoryUrls.length} potential category URLs`);
    
    // Test a few product URLs to understand the structure
    const testedProducts: any[] = [];
    
    for (let i = 0; i < Math.min(3, uniqueProductUrls.length); i++) {
      const productUrl = uniqueProductUrls[i];
      try {
        console.log(`Testing product URL: ${productUrl}`);
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const p$ = cheerio.load(productResponse.data);
        
        // Extract product information
        const title = p$('title').text() || p$('h1').first().text() || p$('.product-title').text();
        const price = p$('.price').text() || p$('.cost').text() || p$('.amount').text();
        const image = p$('img').first().attr('src');
        
        testedProducts.push({
          url: productUrl,
          title: title.trim(),
          price: price.trim(),
          image: image ? (image.startsWith('http') ? image : 'https://nongsarang.co.kr' + image) : null,
          status: 'accessible'
        });
        
        console.log(`✓ Product accessible: ${title.trim()}`);
        
      } catch (error) {
        console.log(`✗ Product not accessible: ${productUrl}`);
        testedProducts.push({
          url: productUrl,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test category URLs to find more products
    const categoryProducts: string[] = [];
    
    for (let i = 0; i < Math.min(2, uniqueCategoryUrls.length); i++) {
      const categoryUrl = uniqueCategoryUrls[i];
      try {
        console.log(`Testing category URL: ${categoryUrl}`);
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const c$ = cheerio.load(categoryResponse.data);
        
        // Look for product links in category page
        for (const selector of productSelectors) {
          c$(selector).each((_, element) => {
            const href = c$(element).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : 'https://nongsarang.co.kr' + href;
              categoryProducts.push(fullUrl);
            }
          });
        }
        
        console.log(`✓ Category accessible, found ${categoryProducts.length} product links`);
        
      } catch (error) {
        console.log(`✗ Category not accessible: ${categoryUrl}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate exploration report
    const exploration = {
      timestamp: new Date().toISOString(),
      shopUrl,
      findings: {
        productUrls: uniqueProductUrls,
        categoryUrls: uniqueCategoryUrls,
        categoryProducts: [...new Set(categoryProducts)],
        testedProducts,
        totalUniqueProducts: [...new Set([...uniqueProductUrls, ...categoryProducts])].length
      },
      recommendations: []
    };
    
    // Add recommendations
    if (uniqueProductUrls.length > 0) {
      exploration.recommendations.push(`Found ${uniqueProductUrls.length} direct product URLs on shop page`);
    }
    
    if (uniqueCategoryUrls.length > 0) {
      exploration.recommendations.push(`Found ${uniqueCategoryUrls.length} category URLs to explore for more products`);
    }
    
    if (testedProducts.filter(p => p.status === 'accessible').length > 0) {
      exploration.recommendations.push(`${testedProducts.filter(p => p.status === 'accessible').length} test products successfully accessed`);
    }
    
    // Save exploration results
    const explorationPath = path.join(outputDir, 'nongsarang-shop-exploration.json');
    fs.writeFileSync(explorationPath, JSON.stringify(exploration, null, 2));
    
    console.log('\n=== 농사랑 SHOP EXPLORATION RESULTS ===');
    console.log(`Direct product URLs found: ${uniqueProductUrls.length}`);
    console.log(`Category URLs found: ${uniqueCategoryUrls.length}`);
    console.log(`Additional products from categories: ${categoryProducts.length}`);
    console.log(`Total unique products: ${exploration.findings.totalUniqueProducts}`);
    console.log(`Successfully tested products: ${testedProducts.filter(p => p.status === 'accessible').length}`);
    
    if (testedProducts.filter(p => p.status === 'accessible').length > 0) {
      console.log('\nSample accessible products:');
      testedProducts.filter(p => p.status === 'accessible').forEach(product => {
        console.log(`  - ${product.title} (${product.price})`);
        console.log(`    URL: ${product.url}`);
      });
    }
    
    console.log(`\nExploration results saved to: ${explorationPath}`);
    console.log('농사랑 shop exploration completed!');
    
  } catch (error) {
    console.error('Error exploring 농사랑 shop:', error);
    process.exit(1);
  }
}

exploreNongsarangShop();