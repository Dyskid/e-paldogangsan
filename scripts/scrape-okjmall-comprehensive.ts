import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category?: string;
  tags?: string[];
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .substring(0, 200);
}

function cleanPrice(price: string): string {
  return price
    .replace(/[^\d,원]/g, '')
    .replace(/,+/g, ',')
    .trim();
}

function generateProductId(title: string, index: number): string {
  const cleaned = title.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 30);
  return `okjmall_${cleaned}_${Date.now()}_${index}`;
}

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('한우') || titleLower.includes('소고기')) {
    return { category: '한우', tags: ['축산물', '전남', '장흥', '한우'] };
  } else if (titleLower.includes('홍차') || titleLower.includes('차')) {
    return { category: '홍차', tags: ['음료', '전남', '장흥', '홍차'] };
  } else if (titleLower.includes('표고버섯') || titleLower.includes('버섯')) {
    return { category: '버섯', tags: ['농산물', '전남', '장흥', '표고버섯'] };
  } else if (titleLower.includes('쌀') || titleLower.includes('곡물') || titleLower.includes('현미')) {
    return { category: '곡물', tags: ['곡물', '쌀', '전남', '장흥'] };
  } else if (titleLower.includes('김치') || titleLower.includes('젓갈')) {
    return { category: '김치', tags: ['가공식품', '김치', '전남', '장흥'] };
  } else if (titleLower.includes('물') || titleLower.includes('음료')) {
    return { category: '음료', tags: ['음료', '전남', '장흥'] };
  } else if (titleLower.includes('고구마') || titleLower.includes('양파') || titleLower.includes('배추') || titleLower.includes('채소')) {
    return { category: '농산물', tags: ['농산물', '채소', '전남', '장흥'] };
  } else {
    return { category: '장흥특산품', tags: ['농산물', '전남', '장흥'] };
  }
}

async function scrapeOkjMallComprehensive() {
  try {
    console.log('🚀 Starting 장흥몰 (OKJ Mall) comprehensive scraping...');
    
    const baseUrl = 'https://okjmall.com';
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      'Connection': 'keep-alive'
    };

    let allProducts: Product[] = [];
    const uniqueUrls = new Set<string>();

    console.log('🏠 Scraping homepage products...');
    
    const homepageResponse = await axios.get(baseUrl, { headers, timeout: 30000 });
    const $homepage = cheerio.load(homepageResponse.data);

    // Godo Mall typical selectors for homepage products
    const homepageSelectors = [
      '.goods_list .item_wrap',
      '.item_list .item_wrap',
      '.goods_wrap .item',
      '.product_list .item',
      '.item_wrap',
      '.goods_item',
      '.product_item'
    ];

    let homepageProducts = 0;
    for (const selector of homepageSelectors) {
      const products = $homepage(selector);
      if (products.length > 0) {
        console.log(`🎯 Found ${products.length} products on homepage with selector: ${selector}`);
        
        products.each((index, element) => {
          const $item = $homepage(element);
          
          // Extract title from various possible locations
          const titleSources = [
            $item.find('.goods_name').text().trim(),
            $item.find('.item_name').text().trim(),
            $item.find('.product_name').text().trim(),
            $item.find('img').first().attr('alt') || '',
            $item.find('a').first().attr('title') || '',
            $item.find('.name').text().trim()
          ];
          
          let title = '';
          for (const source of titleSources) {
            if (source && source.length > 0) {
              title = cleanTitle(source);
              break;
            }
          }
          
          // Extract price from various possible locations
          const priceElements = $item.find('.price, .cost, .won, [class*="price"], .item_price, .goods_price');
          let price = '';
          if (priceElements.length > 0) {
            price = cleanPrice(priceElements.first().text().trim());
          }
          
          // Extract image
          let image = $item.find('img').first().attr('src') || '';
          if (image && !image.startsWith('http')) {
            if (image.startsWith('//')) {
              image = `https:${image}`;
            } else {
              image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
            }
          }
          
          // Extract link
          let link = $item.find('a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
          }
          
          if (title && price && !uniqueUrls.has(link)) {
            const { category, tags } = categorizeProduct(title);
            
            const product: Product = {
              id: generateProductId(title, allProducts.length),
              title: title,
              price: price,
              image: image || `${baseUrl}/images/default.jpg`,
              url: link || `${baseUrl}/product/${allProducts.length}`,
              category: category,
              tags: tags
            };
            
            allProducts.push(product);
            uniqueUrls.add(link);
            homepageProducts++;
          }
        });
        
        break; // Found products, no need to try other selectors
      }
    }
    
    console.log(`✅ Found ${homepageProducts} products from homepage`);

    // Try to find and scrape category pages
    console.log('📦 Looking for category pages...');
    
    // Common Godo Mall category URLs
    const categoryUrls = [
      `${baseUrl}/goods/goods_list.php?cateCd=001`,
      `${baseUrl}/goods/goods_list.php?cateCd=002`,
      `${baseUrl}/goods/goods_list.php?cateCd=003`,
      `${baseUrl}/goods/goods_list.php?cateCd=004`,
      `${baseUrl}/goods/goods_list.php?cateCd=005`,
      `${baseUrl}/category/한우/`,
      `${baseUrl}/category/홍차/`,
      `${baseUrl}/category/버섯/`,
      `${baseUrl}/category/농산물/`,
      `${baseUrl}/goods/catalog.php?cid=001`,
      `${baseUrl}/goods/catalog.php?cid=002`,
      `${baseUrl}/goods/catalog.php?cid=003`
    ];

    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`📂 Checking category: ${categoryUrl}`);
        
        const categoryResponse = await axios.get(categoryUrl, { 
          headers, 
          timeout: 15000,
          validateStatus: (status) => status < 500 // Accept 404 but not server errors
        });
        
        if (categoryResponse.status === 200) {
          const $category = cheerio.load(categoryResponse.data);
          
          // Use same selectors as homepage
          for (const selector of homepageSelectors) {
            const categoryProducts = $category(selector);
            if (categoryProducts.length > 0) {
              console.log(`  ✅ Found ${categoryProducts.length} products in category`);
              
              categoryProducts.each((index, element) => {
                const $item = $category(element);
                
                const titleSources = [
                  $item.find('.goods_name').text().trim(),
                  $item.find('.item_name').text().trim(),
                  $item.find('.product_name').text().trim(),
                  $item.find('img').first().attr('alt') || '',
                  $item.find('a').first().attr('title') || '',
                  $item.find('.name').text().trim()
                ];
                
                let title = '';
                for (const source of titleSources) {
                  if (source && source.length > 0) {
                    title = cleanTitle(source);
                    break;
                  }
                }
                
                const priceElements = $item.find('.price, .cost, .won, [class*="price"], .item_price, .goods_price');
                let price = '';
                if (priceElements.length > 0) {
                  price = cleanPrice(priceElements.first().text().trim());
                }
                
                let image = $item.find('img').first().attr('src') || '';
                if (image && !image.startsWith('http')) {
                  if (image.startsWith('//')) {
                    image = `https:${image}`;
                  } else {
                    image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
                  }
                }
                
                let link = $item.find('a').first().attr('href') || '';
                if (link && !link.startsWith('http')) {
                  link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
                }
                
                if (title && price && !uniqueUrls.has(link)) {
                  const { category, tags } = categorizeProduct(title);
                  
                  const product: Product = {
                    id: generateProductId(title, allProducts.length),
                    title: title,
                    price: price,
                    image: image || `${baseUrl}/images/default.jpg`,
                    url: link || `${baseUrl}/product/${allProducts.length}`,
                    category: category,
                    tags: tags
                  };
                  
                  allProducts.push(product);
                  uniqueUrls.add(link);
                }
              });
              
              break; // Found products, move to next category
            }
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed to scrape category: ${categoryUrl}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🎯 Total unique products found: ${allProducts.length}`);

    // Enhance product details by visiting individual product pages (sample)
    console.log('🔍 Enhancing product details...');
    
    const sampleSize = Math.min(20, allProducts.length);
    for (let i = 0; i < sampleSize; i++) {
      try {
        const product = allProducts[i];
        console.log(`✅ Enhanced product ${i + 1}/${sampleSize}: ${product.title}`);
        
        const productResponse = await axios.get(product.url, { 
          headers, 
          timeout: 10000,
          validateStatus: (status) => status < 500
        });
        
        if (productResponse.status === 200) {
          const $product = cheerio.load(productResponse.data);
          
          // Try to get more accurate title from product page
          const pageTitle = $product('meta[property="og:title"]').attr('content') ||
                           $product('.product_name, .goods_name, h1').first().text().trim();
          
          if (pageTitle && pageTitle.length > product.title.length) {
            product.title = cleanTitle(pageTitle);
            
            // Re-categorize with better title
            const { category, tags } = categorizeProduct(product.title);
            product.category = category;
            product.tags = tags;
          }
          
          // Try to get more accurate price
          const pagePrice = $product('.price, .item_price, .goods_price, [class*="price"]').first().text().trim();
          if (pagePrice) {
            const cleanedPagePrice = cleanPrice(pagePrice);
            if (cleanedPagePrice) {
              product.price = cleanedPagePrice;
            }
          }
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`⚠️ Failed to enhance product ${i + 1}: ${allProducts[i].title}`);
      }
    }

    // Save results
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '장흥몰',
      baseUrl,
      totalProducts: allProducts.length,
      homepageProducts,
      categoryProducts: allProducts.length - homepageProducts,
      categories: [...new Set(allProducts.map(p => p.category))],
      errors: 0,
      sampleProducts: allProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };

    fs.writeFileSync(
      path.join(outputDir, 'okjmall-products.json'),
      JSON.stringify(allProducts, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, 'okjmall-scrape-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('📊 Scraping Summary:');
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Homepage products: ${homepageProducts}`);
    console.log(`Category products: ${summary.categoryProducts}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Sample products:`);
    summary.sampleProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} - ${p.price} (${p.category})`);
    });
    console.log(`✅ Results saved to okjmall-products.json and okjmall-scrape-summary.json`);

    console.log(`🎉 Successfully scraped ${allProducts.length} products from 장흥몰 (OKJ Mall)!`);

    return allProducts;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    // Create error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      mall: '장흥몰',
      error: (error as Error).message,
      status: 'Failed'
    };
    
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'okjmall-scraping-error.json'),
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
  }
}

scrapeOkjMallComprehensive();