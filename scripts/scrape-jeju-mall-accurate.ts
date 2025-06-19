import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  categoryId?: string;
  description: string;
  tags: string[];
}

async function scrapeJejuMallAccurate() {
  console.log('🚀 Starting accurate Jeju Mall scraper...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Go to main page
    console.log('📄 Navigating to https://mall.ejeju.net/main/index.do');
    await page.goto('https://mall.ejeju.net/main/index.do', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const allProducts: Product[] = [];

    // Method 1: Get products from main page sections
    console.log('\n🔍 Looking for products on main page...');
    
    // Look for product links on the main page
    const mainPageProducts = await page.evaluate(() => {
      const products: any[] = [];
      
      // Find all product links that match the pattern
      const productLinks = document.querySelectorAll('a[href*="goods/detail.do?gno="]');
      
      productLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Extract full URL
        const fullUrl = href.startsWith('http') ? href : 
                       href.startsWith('/') ? `https://mall.ejeju.net${href}` : 
                       `https://mall.ejeju.net/${href}`;
        
        // Find product info near the link
        const container = link.closest('.product-item, .goods-box, .item, li, div[class*="product"], div[class*="goods"]');
        if (!container) return;
        
        // Extract product name
        const nameEl = container.querySelector('.name, .goods-name, .product-name, .title, h3, h4, dt');
        const name = nameEl?.textContent?.trim() || link.getAttribute('title')?.trim() || '';
        
        // Extract price
        const priceEl = container.querySelector('.price, .sell-price, .product-price, span[class*="price"]');
        const price = priceEl?.textContent?.trim() || '';
        
        // Extract image
        const imgEl = container.querySelector('img');
        const imgSrc = imgEl?.getAttribute('src') || '';
        const imageUrl = imgSrc.startsWith('http') ? imgSrc : 
                        imgSrc.startsWith('/') ? `https://mall.ejeju.net${imgSrc}` : 
                        `https://mall.ejeju.net/${imgSrc}`;
        
        if (name && fullUrl.includes('gno=')) {
          products.push({
            url: fullUrl,
            name,
            price,
            imageUrl
          });
        }
      });
      
      return products;
    });

    console.log(`✅ Found ${mainPageProducts.length} products on main page`);

    // Method 2: Navigate to category pages
    console.log('\n📂 Looking for category pages...');
    
    // Get category links
    const categoryLinks = await page.evaluate(() => {
      const links: string[] = [];
      
      // Look for category menu
      const categoryMenuItems = document.querySelectorAll('.gnb a[href*="goods/list.do"], .category-menu a, .lnb a[href*="cate="], a[href*="category"]');
      
      categoryMenuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && (href.includes('cate=') || href.includes('category'))) {
          const fullUrl = href.startsWith('http') ? href : 
                         href.startsWith('/') ? `https://mall.ejeju.net${href}` : 
                         `https://mall.ejeju.net/${href}`;
          links.push(fullUrl);
        }
      });
      
      return [...new Set(links)]; // Remove duplicates
    });

    console.log(`📑 Found ${categoryLinks.length} category pages`);

    // Visit each category page
    for (const categoryUrl of categoryLinks.slice(0, 5)) { // Limit to first 5 categories for now
      try {
        console.log(`\n🔗 Visiting category: ${categoryUrl}`);
        await page.goto(categoryUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Extract products from category page
        const categoryProducts = await page.evaluate(() => {
          const products: any[] = [];
          
          // Find product items in list
          const productItems = document.querySelectorAll('.goods-list li, .product-list li, .item-list li, ul[class*="goods"] li, ul[class*="product"] li');
          
          productItems.forEach(item => {
            // Find the product link
            const linkEl = item.querySelector('a[href*="goods/detail.do?gno="]');
            if (!linkEl) return;
            
            const href = linkEl.getAttribute('href');
            if (!href) return;
            
            const fullUrl = href.startsWith('http') ? href : 
                           href.startsWith('/') ? `https://mall.ejeju.net${href}` : 
                           `https://mall.ejeju.net/${href}`;
            
            // Extract product details
            const name = item.querySelector('.name, .goods-name, .product-name, .title')?.textContent?.trim() || '';
            const price = item.querySelector('.price, .sell-price')?.textContent?.trim() || '';
            const originalPrice = item.querySelector('.consumer-price, .original-price')?.textContent?.trim();
            
            const imgEl = item.querySelector('img');
            const imgSrc = imgEl?.getAttribute('src') || '';
            const imageUrl = imgSrc.startsWith('http') ? imgSrc : 
                            imgSrc.startsWith('/') ? `https://mall.ejeju.net${imgSrc}` : 
                            `https://mall.ejeju.net/${imgSrc}`;
            
            if (name && fullUrl.includes('gno=')) {
              products.push({
                url: fullUrl,
                name,
                price,
                originalPrice,
                imageUrl
              });
            }
          });
          
          return products;
        });
        
        console.log(`  ✅ Found ${categoryProducts.length} products in this category`);
        
        // Add to all products (avoid duplicates)
        categoryProducts.forEach(prod => {
          if (!mainPageProducts.find(p => p.url === prod.url)) {
            mainPageProducts.push(prod);
          }
        });
        
      } catch (error) {
        console.error(`  ❌ Error visiting category: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Process all found products
    console.log(`\n📊 Total unique products found: ${mainPageProducts.length}`);
    
    // Convert to our product format
    mainPageProducts.forEach((prod, index) => {
      // Extract gno and cate from URL
      const urlMatch = prod.url.match(/gno=(\d+)(?:&cate=(\d+))?/);
      if (!urlMatch) return;
      
      const gno = urlMatch[1];
      const cate = urlMatch[2];
      
      // Determine category from URL or default
      let category = '기타';
      if (cate) {
        // Map category IDs to names (you can expand this mapping)
        const categoryMap: Record<string, string> = {
          '31043': '전통식품',
          '31041': '농산물',
          '31042': '수산물',
          '31044': '가공식품',
          '31045': '건강식품',
          '31046': '축산물'
        };
        category = categoryMap[cate] || '기타';
      }
      
      // Clean price
      const cleanPrice = prod.price.replace(/[^0-9]/g, '') || '0';
      const cleanOriginalPrice = prod.originalPrice?.replace(/[^0-9]/g, '');
      
      const product: Product = {
        id: `jeju_${gno}`,
        name: prod.name,
        price: `${parseInt(cleanPrice).toLocaleString('ko-KR')}원`,
        originalPrice: cleanOriginalPrice ? `${parseInt(cleanOriginalPrice).toLocaleString('ko-KR')}원` : undefined,
        imageUrl: prod.imageUrl,
        productUrl: prod.url,
        category,
        categoryId: cate,
        description: `${prod.name} - 제주몰 직배송 상품`,
        tags: ['제주', '제주몰', category, prod.name.split(' ')[0]]
      };
      
      allProducts.push(product);
    });

    // Save results
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'jeju-mall-accurate-products.json');
    await fs.writeFile(outputPath, JSON.stringify(allProducts, null, 2));
    
    // Save summary
    const summary = {
      totalProducts: allProducts.length,
      scrapedAt: new Date().toISOString(),
      categories: [...new Set(allProducts.map(p => p.category))],
      sampleProducts: allProducts.slice(0, 5),
      urlPattern: 'All URLs include both gno and cate parameters when available'
    };
    
    const summaryPath = path.join(outputDir, 'jeju-mall-accurate-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n✅ Scraping complete!');
    console.log(`📁 Results saved to: ${outputPath}`);
    console.log(`📊 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeJejuMallAccurate();