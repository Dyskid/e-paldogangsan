import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeChamdsDetailed() {
  console.log('🔍 Detailed analysis of Chamds (Cafe24) mall structure...');
  
  const baseUrl = 'https://chamds.com';
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  
  const analysis = {
    timestamp: new Date().toISOString(),
    baseUrl,
    platform: 'Cafe24',
    pages: [],
    productPages: [],
    findings: []
  };

  try {
    // 1. Check common Cafe24 product listing URLs
    console.log('📋 Checking Cafe24 product listing patterns...');
    
    const cafe24Patterns = [
      '/product/list.html',
      '/product/list.html?cate_no=1',
      '/product/list.html?cate_no=2', 
      '/product/list.html?cate_no=3',
      '/product/list.html?cate_no=4',
      '/product/list.html?cate_no=5',
      '/category/',
      '/category/list/',
      '/shop/shopbrand.html',
      '/shop/category.html'
    ];

    for (const pattern of cafe24Patterns) {
      try {
        const testUrl = baseUrl + pattern;
        console.log(`  Testing: ${testUrl}`);
        
        const response = await axios.get(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          },
          httpsAgent,
          timeout: 20000
        });

        if (response.status === 200) {
          console.log(`    ✅ Found accessible page: ${testUrl}`);
          
          const $ = cheerio.load(response.data);
          
          // Save this page for inspection
          const filename = pattern.replace(/[^a-zA-Z0-9]/g, '_');
          writeFileSync(`./scripts/output/chamds-page-${filename}.html`, response.data);
          
          // Look for product elements in this page
          const productSelectors = [
            '.item', '.product', '.goods', '.prdItem', '.productItem',
            '[class*="item"]', '[class*="product"]', '[class*="goods"]',
            '.xans-product-listitem', '.ec-base-product',
            '.thumbnail', '.prd_item', '.list_item'
          ];

          let foundProducts = 0;
          let foundPrices = 0;
          const sampleProducts = [];

          for (const selector of productSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
              console.log(`    📦 Found ${elements.length} elements with selector: ${selector}`);
              foundProducts += elements.length;
              
              // Check first few products for price information
              elements.slice(0, 5).each((i, elem) => {
                const $elem = $(elem);
                
                // Look for prices
                const priceSelectors = [
                  '.price', '.cost', '.prd_price', '.item_price',
                  '[class*="price"]', 'span:contains("원")', 'strong:contains("원")'
                ];
                
                let productPrice = '';
                let productTitle = '';
                let productImage = '';
                let productLink = '';
                
                for (const priceSelector of priceSelectors) {
                  const priceElem = $elem.find(priceSelector);
                  if (priceElem.length > 0) {
                    const priceText = priceElem.text().trim();
                    if (priceText.includes('원') && /\d{1,3}(?:,\d{3})*원/.test(priceText)) {
                      productPrice = priceText;
                      foundPrices++;
                      break;
                    }
                  }
                }
                
                // Look for title
                const titleSelectors = [
                  '.name', '.title', '.prd_name', '.item_name',
                  'a[href*="product"]', '[class*="name"]', '[class*="title"]'
                ];
                
                for (const titleSelector of titleSelectors) {
                  const titleElem = $elem.find(titleSelector);
                  if (titleElem.length > 0) {
                    productTitle = titleElem.text().trim();
                    if (productTitle) break;
                  }
                }
                
                // Look for image
                const img = $elem.find('img').first();
                if (img.length > 0) {
                  productImage = img.attr('src') || '';
                }
                
                // Look for product link
                const link = $elem.find('a[href*="product"]').first();
                if (link.length > 0) {
                  productLink = link.attr('href') || '';
                }
                
                if (productTitle || productPrice || productImage) {
                  sampleProducts.push({
                    selector,
                    title: productTitle,
                    price: productPrice,
                    image: productImage,
                    link: productLink
                  });
                }
              });
            }
          }
          
          analysis.productPages.push({
            url: testUrl,
            pattern: pattern,
            foundProducts,
            foundPrices,
            sampleProducts: sampleProducts.slice(0, 3)
          });
          
          // Stop after finding a few working pages
          if (analysis.productPages.length >= 3) break;
        }

      } catch (error) {
        console.log(`    ❌ ${pattern}: ${error.response?.status || 'Not accessible'}`);
      }
      
      await delay(1000); // Delay between requests
    }

    // 2. Try to find navigation/menu structure
    console.log('\n📂 Analyzing site navigation...');
    try {
      const mainResponse = await axios.get(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        httpsAgent,
        timeout: 20000
      });

      const $ = cheerio.load(mainResponse.data);
      
      // Look for navigation menus
      const navSelectors = [
        '.gnb', '.menu', '.nav', '.navigation', 
        '[class*="menu"]', '[class*="nav"]',
        '.category_list', '.cate_list'
      ];

      for (const navSelector of navSelectors) {
        const navElem = $(navSelector);
        if (navElem.length > 0) {
          console.log(`  Found navigation with selector: ${navSelector}`);
          
          const links = navElem.find('a[href*="product"], a[href*="category"], a[href*="list"]');
          links.each((i, link) => {
            if (i < 10) { // Limit to first 10 links
              const href = $(link).attr('href');
              const text = $(link).text().trim();
              if (href && text) {
                const fullUrl = href.startsWith('http') ? href : baseUrl + href;
                analysis.pages.push({
                  url: fullUrl,
                  title: text,
                  source: 'navigation'
                });
              }
            }
          });
        }
      }

    } catch (navError) {
      console.log(`⚠️ Could not analyze navigation: ${navError.message}`);
    }

  } catch (error) {
    console.error(`❌ Error in detailed analysis: ${error.message}`);
    analysis.findings.push({
      type: 'error',
      message: error.message
    });
  }

  // Save analysis results
  writeFileSync('./scripts/output/chamds-detailed-analysis.json', JSON.stringify(analysis, null, 2));

  console.log('\n📊 Detailed Analysis Summary:');
  console.log(`🏪 Platform: ${analysis.platform}`);
  console.log(`📦 Working product pages found: ${analysis.productPages.length}`);
  console.log(`🔗 Navigation links found: ${analysis.pages.length}`);
  
  if (analysis.productPages.length > 0) {
    console.log('\n📦 Product pages with data:');
    analysis.productPages.forEach((page, i) => {
      console.log(`  ${i + 1}. ${page.url}`);
      console.log(`     Products: ${page.foundProducts}, Prices: ${page.foundPrices}`);
      if (page.sampleProducts.length > 0) {
        page.sampleProducts.forEach((product, j) => {
          console.log(`     Sample ${j + 1}: ${product.title} - ${product.price}`);
        });
      }
    });
  }

  return analysis;
}

// Run the detailed analysis
analyzeChamdsDetailed()
  .then(() => console.log('\n✅ Chamds detailed analysis completed!'))
  .catch(console.error);