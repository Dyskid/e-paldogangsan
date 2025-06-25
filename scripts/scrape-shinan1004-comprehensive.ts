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
  return `shinan1004_${cleaned}_${Date.now()}_${index}`;
}

async function scrapeShinan1004Comprehensive() {
  try {
    console.log('🚀 Starting Shinan 1004 Mall comprehensive scraping...');
    
    const baseUrl = 'https://shinan1004mall.kr';
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

    // Cafe24 typical selectors for homepage products
    const homepageSelectors = [
      '.xans-product-listmain .xans-record-',
      '.prdList .xans-record-',
      '.main_prd_list .item',
      '.goods_list .item',
      '.product_list .item',
      '.item_list .item'
    ];

    let homepageProducts = 0;
    for (const selector of homepageSelectors) {
      const products = $homepage(selector);
      if (products.length > 0) {
        console.log(`🎯 Found ${products.length} products on homepage with selector: ${selector}`);
        
        products.each((index, element) => {
          const $item = $homepage(element);
          
          // Extract title from img alt or product name
          const imgAlt = $item.find('img').first().attr('alt') || '';
          const productName = $item.find('.name, .title, .prd_name').first().text().trim();
          const title = cleanTitle(imgAlt || productName);
          
          // Extract price
          const priceText = $item.find('.price, .cost, li.product_price, .won').first().text().trim();
          const price = cleanPrice(priceText);
          
          // Extract image
          let image = $item.find('img').first().attr('src') || '';
          if (image && !image.startsWith('http')) {
            image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
          }
          
          // Extract link
          let link = $item.find('a').first().attr('href') || '';
          if (link && !link.startsWith('http')) {
            link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
          }
          
          if (title && price && !uniqueUrls.has(link)) {
            const product: Product = {
              id: generateProductId(title, allProducts.length),
              title: title,
              price: price,
              image: image || `${baseUrl}/images/default.jpg`,
              url: link || `${baseUrl}/product/${allProducts.length}`,
              category: '신안특산품',
              tags: ['농산물', '전남', '신안', '1004섬']
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
    
    const categoryUrls = [
      `${baseUrl}/category/농산물/24/`,
      `${baseUrl}/category/수산물/25/`,
      `${baseUrl}/category/가공식품/26/`,
      `${baseUrl}/category/특산품/27/`,
      `${baseUrl}/product/list.html?cate_no=24`,
      `${baseUrl}/product/list.html?cate_no=25`,
      `${baseUrl}/product/list.html?cate_no=26`,
      `${baseUrl}/product/list.html?cate_no=27`,
      `${baseUrl}/goods/catalog?code=001`,
      `${baseUrl}/goods/catalog?code=002`,
      `${baseUrl}/goods/catalog?code=003`
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
                
                const imgAlt = $item.find('img').first().attr('alt') || '';
                const productName = $item.find('.name, .title, .prd_name').first().text().trim();
                const title = cleanTitle(imgAlt || productName);
                
                const priceText = $item.find('.price, .cost, li.product_price, .won').first().text().trim();
                const price = cleanPrice(priceText);
                
                let image = $item.find('img').first().attr('src') || '';
                if (image && !image.startsWith('http')) {
                  image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
                }
                
                let link = $item.find('a').first().attr('href') || '';
                if (link && !link.startsWith('http')) {
                  link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
                }
                
                if (title && price && !uniqueUrls.has(link)) {
                  const product: Product = {
                    id: generateProductId(title, allProducts.length),
                    title: title,
                    price: price,
                    image: image || `${baseUrl}/images/default.jpg`,
                    url: link || `${baseUrl}/product/${allProducts.length}`,
                    category: '신안특산품',
                    tags: ['농산물', '전남', '신안', '1004섬']
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
    
    const sampleSize = Math.min(30, allProducts.length);
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
                           $product('.product_name, .goods_name').first().text().trim();
          
          if (pageTitle && pageTitle.length > product.title.length) {
            product.title = cleanTitle(pageTitle);
          }
          
          // Try to get more accurate price
          const pagePrice = $product('#span_product_price_text, .price_sale, .product_price').first().text().trim();
          if (pagePrice) {
            const cleanedPagePrice = cleanPrice(pagePrice);
            if (cleanedPagePrice) {
              product.price = cleanedPagePrice;
            }
          }
          
          // Categorize based on content
          const productText = $product.text().toLowerCase();
          if (productText.includes('소금') || productText.includes('천일염')) {
            product.category = '소금';
            product.tags = ['소금', '천일염', '전남', '신안'];
          } else if (productText.includes('김') || productText.includes('미역') || productText.includes('다시마')) {
            product.category = '수산물';
            product.tags = ['수산물', '김', '전남', '신안'];
          } else if (productText.includes('쌀') || productText.includes('곡물')) {
            product.category = '곡물';
            product.tags = ['곡물', '쌀', '전남', '신안'];
          } else if (productText.includes('고구마') || productText.includes('양파') || productText.includes('마늘')) {
            product.category = '농산물';
            product.tags = ['농산물', '채소', '전남', '신안'];
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
      mall: '신안1004몰',
      baseUrl,
      totalProducts: allProducts.length,
      homepageProducts,
      categoryProducts: allProducts.length - homepageProducts,
      categories: [...new Set(allProducts.map(p => p.category))],
      sampleProducts: allProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };

    fs.writeFileSync(
      path.join(outputDir, 'shinan1004-products.json'),
      JSON.stringify(allProducts, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, 'shinan1004-scrape-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('📊 Scraping Summary:');
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Homepage products: ${homepageProducts}`);
    console.log(`Category products: ${summary.categoryProducts}`);
    console.log(`Sample products:`);
    summary.sampleProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} - ${p.price} (${p.category})`);
    });
    console.log(`✅ Results saved to shinan1004-products.json and shinan1004-scrape-summary.json`);

    console.log(`🎉 Successfully scraped ${allProducts.length} products from Shinan 1004 Mall!`);

    return allProducts;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    // Create error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      mall: '신안1004몰',
      error: (error as Error).message,
      status: 'Failed'
    };
    
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'shinan1004-scraping-error.json'),
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
  }
}

scrapeShinan1004Comprehensive();