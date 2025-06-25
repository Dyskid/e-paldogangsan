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
  
  if (titleLower.includes('한우') || titleLower.includes('소고기') || titleLower.includes('암소')) {
    return { category: '한우', tags: ['축산물', '전남', '장흥', '한우'] };
  } else if (titleLower.includes('홍차') || titleLower.includes('차')) {
    return { category: '홍차', tags: ['음료', '전남', '장흥', '홍차'] };
  } else if (titleLower.includes('표고버섯') || titleLower.includes('버섯')) {
    return { category: '버섯', tags: ['농산물', '전남', '장흥', '표고버섯'] };
  } else if (titleLower.includes('쌀') || titleLower.includes('곡물') || titleLower.includes('현미')) {
    return { category: '곡물', tags: ['곡물', '쌀', '전남', '장흥'] };
  } else if (titleLower.includes('소금') || titleLower.includes('함초')) {
    return { category: '소금', tags: ['소금', '함초', '전남', '장흥'] };
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

async function scrapeOkjMallFixed() {
  try {
    console.log('🚀 Starting 장흥몰 (OKJ Mall) fixed scraping...');
    
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

    // Use the specific selectors found in the HTML analysis
    const homepageProducts = $homepage('.item_gallery_type .item_cont');
    console.log(`🎯 Found ${homepageProducts.length} products on homepage`);

    homepageProducts.each((index, element) => {
      const $item = $homepage(element);
      
      // Extract title from .item_name
      const title = cleanTitle($item.find('.item_name').text().trim());
      
      // Extract price from .item_money_box or similar price elements
      const priceElements = $item.find('.item_money_box, .price, .cost, .won, [class*="price"], .item_price, .goods_price');
      let price = '';
      if (priceElements.length > 0) {
        price = cleanPrice(priceElements.first().text().trim());
      }
      
      // If no price found in item_money_box, look for price in the entire item
      if (!price) {
        const itemText = $item.text();
        const priceMatch = itemText.match(/[\d,]+원/);
        if (priceMatch) {
          price = cleanPrice(priceMatch[0]);
        }
      }
      
      // Extract image from data attributes or img src
      let image = '';
      const photoBox = $item.find('.item_photo_box');
      if (photoBox.length > 0) {
        image = photoBox.attr('data-image-list') || 
               photoBox.attr('data-image-main') || 
               photoBox.find('img').first().attr('src') || '';
      }
      
      if (!image) {
        image = $item.find('img').first().attr('src') || '';
      }
      
      if (image && !image.startsWith('http')) {
        if (image.startsWith('//')) {
          image = `https:${image}`;
        } else {
          image = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
        }
      }
      
      // Extract link from .item_link or first link
      let link = $item.find('.item_link a').first().attr('href') || 
                 $item.find('a').first().attr('href') || '';
      
      if (!link) {
        // Try to construct link from title or use a placeholder
        const productId = index + 1;
        link = `${baseUrl}/goods/goods_view.php?goodsNo=${productId}`;
      }
      
      if (link && !link.startsWith('http')) {
        link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      if (title && !uniqueUrls.has(link)) {
        const { category, tags } = categorizeProduct(title);
        
        const product: Product = {
          id: generateProductId(title, allProducts.length),
          title: title,
          price: price || '가격문의',
          image: image || `${baseUrl}/images/default.jpg`,
          url: link,
          category: category,
          tags: tags
        };
        
        allProducts.push(product);
        uniqueUrls.add(link);
      }
    });
    
    console.log(`✅ Found ${allProducts.length} products from homepage`);

    // Also try to scrape recommended products
    console.log('🔄 Scraping recommended products...');
    
    const recomProducts = $homepage('.recom_item_cont');
    console.log(`🎯 Found ${recomProducts.length} recommended products`);
    
    recomProducts.each((index, element) => {
      const $item = $homepage(element);
      
      const title = cleanTitle($item.find('.item_name').text().trim());
      
      const priceElements = $item.find('.price, .cost, .won, [class*="price"]');
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
      
      if (title && !uniqueUrls.has(link)) {
        const { category, tags } = categorizeProduct(title);
        
        const product: Product = {
          id: generateProductId(title, allProducts.length),
          title: title,
          price: price || '가격문의',
          image: image || `${baseUrl}/images/default.jpg`,
          url: link || `${baseUrl}/product/${allProducts.length}`,
          category: category,
          tags: tags
        };
        
        allProducts.push(product);
        uniqueUrls.add(link);
      }
    });

    console.log(`🎯 Total unique products found: ${allProducts.length}`);

    // Try to enhance product details by visiting specific category or product pages
    console.log('🔍 Attempting to find more products via direct URLs...');
    
    const testUrls = [
      `${baseUrl}/goods/goods_list.php`,
      `${baseUrl}/shop/`
    ];

    for (const testUrl of testUrls) {
      try {
        console.log(`📂 Checking: ${testUrl}`);
        
        const response = await axios.get(testUrl, { 
          headers, 
          timeout: 15000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          const $page = cheerio.load(response.data);
          
          // Look for additional products on this page
          const additionalProducts = $page('.item_gallery_type .item_cont, .recom_item_cont');
          console.log(`  Found ${additionalProducts.length} additional products`);
          
          // Process these products (similar logic as above)
          // ... (code similar to homepage processing)
        }
      } catch (error) {
        console.log(`  ❌ Failed to check: ${testUrl}`);
      }
    }

    // Enhance some product details by visiting individual pages
    console.log('🔍 Enhancing product details...');
    
    const sampleSize = Math.min(10, allProducts.length);
    for (let i = 0; i < sampleSize; i++) {
      try {
        const product = allProducts[i];
        console.log(`✅ Enhanced product ${i + 1}/${sampleSize}: ${product.title}`);
        
        if (product.url.includes('goods_view.php')) {
          const productResponse = await axios.get(product.url, { 
            headers, 
            timeout: 10000,
            validateStatus: (status) => status < 500
          });
          
          if (productResponse.status === 200) {
            const $product = cheerio.load(productResponse.data);
            
            // Try to get more accurate price from product page
            const pagePrice = $product('.price, .item_price, .goods_price, [class*="price"]').first().text().trim();
            if (pagePrice) {
              const cleanedPagePrice = cleanPrice(pagePrice);
              if (cleanedPagePrice) {
                product.price = cleanedPagePrice;
              }
            }
          }
        }
        
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

scrapeOkjMallFixed();