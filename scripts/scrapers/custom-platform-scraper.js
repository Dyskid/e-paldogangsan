const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Custom Platform Mall Scraper
// This scraper handles various custom Korean e-commerce platforms

const CUSTOM_MALLS = [
  // Mangotree Platform
  {
    id: 7,
    engname: 'gwangmyeong-value-mall',
    name: '광명가치몰',
    url: 'http://gmsocial.mangotree.co.kr/mall/',
    region: '경기',
    platform: 'Mangotree'
  },
  // Custom Korean Platforms
  {
    id: 42,
    engname: 'imsil-mall',
    name: '임실몰',
    url: 'https://www.imsilin.kr/home',
    region: '전북',
    platform: 'Custom'
  },
  {
    id: 84,
    engname: 'e-gyeongnam-mall',
    name: 'e경남몰',
    url: 'https://egnmall.kr',
    region: '경남',
    platform: 'Custom'
  },
  {
    id: 86,
    engname: 'namhae-mall',
    name: '남해몰',
    url: 'https://enamhae.co.kr/',
    region: '경남',
    platform: 'Custom'
  },
  {
    id: 89,
    engname: 'hamyang-mall',
    name: '함양몰',
    url: 'https://2900.co.kr/',
    region: '경남',
    platform: 'Custom'
  },
  {
    id: 92,
    engname: 'gimhae-on-mall',
    name: '김해온몰',
    url: 'https://gimhaemall.kr',
    region: '경남',
    platform: 'Custom'
  },
  // Unknown platforms - need specific handling
  {
    id: 39,
    engname: 'jinan-highland-mall',
    name: '진안고원몰',
    url: 'https://xn--299az5xoii3qb66f.com/',
    region: '전북',
    platform: 'Unknown'
  },
  {
    id: 57,
    engname: 'haenam-smile',
    name: '해남미소',
    url: 'https://www.hnmiso.com/kwa-home',
    region: '전남',
    platform: 'Unknown'
  },
  {
    id: 72,
    engname: 'gimcheon-nodaji-market',
    name: '김천노다지장터',
    url: 'http://gcnodaji.com/',
    region: '경북',
    platform: 'Unknown'
  },
  {
    id: 85,
    engname: 'toyoae-uiryeong',
    name: '토요애 (의령)',
    url: 'https://toyoae.com/',
    region: '경남',
    platform: 'Unknown'
  },
  {
    id: 87,
    engname: 'san-n-cheong-sancheong',
    name: '산엔청 (산청)',
    url: 'https://sanencheong.com/',
    region: '경남',
    platform: 'Unknown'
  },
  {
    id: 88,
    engname: 'dinosaur-land-goseong',
    name: '공룡나라 (고성)',
    url: 'https://www.edinomall.com/shop/smain/index.php',
    region: '경남',
    platform: 'Unknown'
  },
  {
    id: 90,
    engname: 'jinju-dream',
    name: '진주드림',
    url: 'https://jinjudream.com/',
    region: '경남',
    platform: 'Unknown'
  },
  {
    id: 91,
    engname: 'haman-mall',
    name: '함안몰',
    url: 'https://hamanmall.com',
    region: '경남',
    platform: 'Unknown'
  },
  {
    id: 93,
    engname: 'e-jeju-mall',
    name: '이제주몰',
    url: 'https://mall.ejeju.net/main/index.do',
    region: '제주',
    platform: 'Unknown'
  }
];

// Mall-specific configurations
const MALL_CONFIGS = {
  'gwangmyeong-value-mall': {
    productSelectors: ['.product-item', '.goods-item', '.item-box'],
    nameSelectors: ['.product-name', '.item-name', '.goods-name'],
    priceSelectors: ['.product-price', '.item-price', '.price'],
    imageSelectors: ['img.product-image', '.item-image img', 'img'],
    categoryPath: '/shop/goods/goods_list.php'
  },
  'e-jeju-mall': {
    productSelectors: ['.product_list li', '.prd_list li', '.item_list li'],
    nameSelectors: ['.prd_name', '.name', '.title'],
    priceSelectors: ['.prd_price', '.price', '.cost'],
    imageSelectors: ['.prd_img img', '.thumb img', 'img'],
    ajaxEndpoint: '/product/getProductList.do'
  },
  'default': {
    productSelectors: [
      '.product-item', '.goods-item', '.item', 
      '.product_list li', '.goods_list li', '.item_list li',
      'ul.list li', '.prd-item', '.prd-list li'
    ],
    nameSelectors: [
      '.product-name', '.goods-name', '.item-name',
      '.prd_name', '.name', '.title', 'h3', 'h4'
    ],
    priceSelectors: [
      '.product-price', '.price', '.cost',
      '.prd_price', '.sale_price', '.item-price'
    ],
    imageSelectors: [
      'img.product-image', '.thumb img', '.item-image img',
      '.prd_img img', 'img[src*="product"]', 'img[src*="goods"]', 'img'
    ]
  }
};

async function scrapeCustomMall(mall) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`\nScraping ${mall.name} (${mall.url})...`);
    
    // Get mall-specific config or use default
    const config = MALL_CONFIGS[mall.engname] || MALL_CONFIGS.default;
    
    // Go to the main page
    await page.goto(mall.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    let products = [];
    
    // Special handling for specific malls
    if (mall.engname === 'e-jeju-mall') {
      // Handle AJAX-based product loading
      try {
        // Check if there's an API endpoint
        const apiResponse = await page.evaluate(async (endpoint) => {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ page: 1, pageSize: 100 })
            });
            return await response.json();
          } catch (e) {
            return null;
          }
        }, mall.url.replace('/main/index.do', config.ajaxEndpoint));
        
        if (apiResponse && apiResponse.list) {
          products = apiResponse.list.map(item => ({
            id: `${mall.engname}-${item.productNo || item.id}`,
            name: item.productNm || item.name,
            price: item.price || 0,
            imageUrl: item.imageUrl || '',
            productUrl: `${mall.url.replace('/main/index.do', '')}/product/detail.do?productNo=${item.productNo}`,
            category: item.category || '전체상품',
            mallId: mall.engname,
            mallName: mall.name,
            mallUrl: mall.url,
            region: mall.region
          }));
        }
      } catch (e) {
        console.log('API approach failed, trying DOM scraping...');
      }
    }
    
    // If no products found via API, try DOM scraping
    if (products.length === 0) {
      // Try each product selector until we find one that works
      for (const selector of config.productSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found products using selector: ${selector}`);
          
          products = await page.evaluate((sel, conf, mallInfo) => {
            const items = document.querySelectorAll(sel);
            const extractedProducts = [];
            
            items.forEach((item, index) => {
              try {
                // Find product URL
                const link = item.querySelector('a');
                if (!link) return;
                
                const productUrl = link.href;
                
                // Find name using multiple selectors
                let name = '';
                for (const nameSelector of conf.nameSelectors) {
                  const nameEl = item.querySelector(nameSelector);
                  if (nameEl && nameEl.textContent.trim()) {
                    name = nameEl.textContent.trim();
                    break;
                  }
                }
                if (!name) return;
                
                // Find price
                let price = 0;
                for (const priceSelector of conf.priceSelectors) {
                  const priceEl = item.querySelector(priceSelector);
                  if (priceEl) {
                    const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
                    price = parseInt(priceText) || 0;
                    if (price > 0) break;
                  }
                }
                
                // Find image
                let imageUrl = '';
                for (const imgSelector of conf.imageSelectors) {
                  const img = item.querySelector(imgSelector);
                  if (img && img.src) {
                    imageUrl = img.src;
                    break;
                  }
                }
                
                // Generate product ID from URL
                const urlMatch = productUrl.match(/[?&](?:no|id|code)=([^&]+)/) || 
                               productUrl.match(/\/(\d+)(?:\/|$)/);
                const productId = urlMatch ? urlMatch[1] : `${Date.now()}-${index}`;
                
                extractedProducts.push({
                  id: `${mallInfo.engname}-${productId}`,
                  name: name,
                  price: price,
                  imageUrl: imageUrl,
                  productUrl: productUrl,
                  category: '전체상품',
                  mallId: mallInfo.engname,
                  mallName: mallInfo.name,
                  mallUrl: mallInfo.url,
                  region: mallInfo.region
                });
              } catch (error) {
                console.error('Error extracting product:', error);
              }
            });
            
            return extractedProducts;
          }, selector, config, mall);
          
          if (products.length > 0) break;
        }
      }
    }
    
    // If still no products, try navigating to product listing pages
    if (products.length === 0) {
      console.log('No products on main page, looking for product listing links...');
      
      const listingLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(a => {
            const href = a.href.toLowerCase();
            const text = a.textContent.toLowerCase();
            return (
              href.includes('product') || href.includes('goods') || 
              href.includes('shop') || href.includes('list') ||
              text.includes('상품') || text.includes('전체')
            );
          })
          .map(a => ({ href: a.href, text: a.textContent.trim() }))
          .slice(0, 3);
      });
      
      for (const link of listingLinks) {
        console.log(`Checking listing: ${link.text}`);
        await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to find products again
        for (const selector of config.productSelectors) {
          const pageProducts = await page.evaluate((sel, conf, mallInfo) => {
            const items = document.querySelectorAll(sel);
            const products = [];
            
            items.forEach((item, index) => {
              const link = item.querySelector('a');
              if (!link) return;
              
              let name = '';
              for (const nameSelector of conf.nameSelectors) {
                const nameEl = item.querySelector(nameSelector);
                if (nameEl && nameEl.textContent.trim()) {
                  name = nameEl.textContent.trim();
                  break;
                }
              }
              if (!name) return;
              
              products.push({
                id: `${mallInfo.engname}-${Date.now()}-${index}`,
                name: name,
                price: 0,
                imageUrl: '',
                productUrl: link.href,
                category: '전체상품',
                mallId: mallInfo.engname,
                mallName: mallInfo.name,
                mallUrl: mallInfo.url,
                region: mallInfo.region
              });
            });
            
            return products;
          }, selector, config, mall);
          
          if (pageProducts.length > 0) {
            products = products.concat(pageProducts.slice(0, 50));
            break;
          }
        }
        
        if (products.length >= 20) break;
      }
    }
    
    console.log(`Found ${products.length} products for ${mall.name}`);
    return products;
    
  } catch (error) {
    console.error(`Error scraping ${mall.name}:`, error);
    return [];
  } finally {
    await browser.close();
  }
}

async function scrapeAllCustomMalls() {
  console.log('Starting Custom Platform Mall Scraping...');
  console.log(`Total malls to scrape: ${CUSTOM_MALLS.length}`);
  
  const allProducts = [];
  const results = {
    success: [],
    failed: []
  };
  
  for (const mall of CUSTOM_MALLS) {
    try {
      const products = await scrapeCustomMall(mall);
      
      if (products.length > 0) {
        allProducts.push(...products);
        results.success.push({
          mall: mall.name,
          platform: mall.platform,
          productCount: products.length
        });
        
        // Save individual mall results
        const outputPath = path.join(__dirname, '..', 'output', `${mall.id}-${mall.engname}-products.json`);
        await fs.writeFile(outputPath, JSON.stringify(products, null, 2));
        console.log(`Saved ${products.length} products to ${outputPath}`);
      } else {
        results.failed.push({
          mall: mall.name,
          platform: mall.platform,
          reason: 'No products found'
        });
      }
      
      // Delay between malls
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      results.failed.push({
        mall: mall.name,
        platform: mall.platform,
        reason: error.message
      });
    }
  }
  
  // Save summary report
  const report = {
    timestamp: new Date().toISOString(),
    platform: 'Custom/Unknown Platforms',
    totalMalls: CUSTOM_MALLS.length,
    successCount: results.success.length,
    failedCount: results.failed.length,
    totalProducts: allProducts.length,
    results: results
  };
  
  const reportPath = path.join(__dirname, '..', 'output', 'custom-platform-scraping-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n=== Custom Platform Scraping Summary ===');
  console.log(`Total malls: ${CUSTOM_MALLS.length}`);
  console.log(`Successful: ${results.success.length}`);
  console.log(`Failed: ${results.failed.length}`);
  console.log(`Total products collected: ${allProducts.length}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

// Run the scraper
if (require.main === module) {
  scrapeAllCustomMalls().catch(console.error);
}

module.exports = { scrapeCustomMall, scrapeAllCustomMalls };