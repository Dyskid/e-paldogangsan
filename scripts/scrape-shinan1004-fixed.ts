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

function categorizeProduct(title: string): { category: string; tags: string[] } {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('소금') || titleLower.includes('천일염')) {
    return { category: '소금', tags: ['소금', '천일염', '전남', '신안'] };
  } else if (titleLower.includes('김') || titleLower.includes('미역') || titleLower.includes('다시마') || titleLower.includes('장어')) {
    return { category: '수산물', tags: ['수산물', '김', '전남', '신안'] };
  } else if (titleLower.includes('쌀') || titleLower.includes('곡물') || titleLower.includes('현미')) {
    return { category: '곡물', tags: ['곡물', '쌀', '전남', '신안'] };
  } else if (titleLower.includes('고구마') || titleLower.includes('양파') || titleLower.includes('마늘') || titleLower.includes('배추')) {
    return { category: '농산물', tags: ['농산물', '채소', '전남', '신안'] };
  } else if (titleLower.includes('젓갈') || titleLower.includes('액젓')) {
    return { category: '젓갈', tags: ['수산물', '젓갈', '전남', '신안'] };
  } else {
    return { category: '신안특산품', tags: ['농산물', '전남', '신안', '1004섬'] };
  }
}

async function scrapeShinan1004Fixed() {
  try {
    console.log('🚀 Starting Shinan 1004 Mall fixed scraping...');
    
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

    // Use the working selector from our test
    const homepageProducts = $homepage('.xans-product-listmain .xans-record-');
    console.log(`🎯 Found ${homepageProducts.length} products on homepage`);

    homepageProducts.each((index, element) => {
      const $item = $homepage(element);
      
      // Extract title from img alt (most reliable)
      const imgAlt = $item.find('img').first().attr('alt') || '';
      const title = cleanTitle(imgAlt);
      
      // Extract price from the specific span we found in analysis
      const priceSpan = $item.find('ul.spec li.xans-record- span').last();
      const priceText = priceSpan.text().trim();
      const price = cleanPrice(priceText);
      
      // Extract image
      let image = $item.find('img').first().attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = `https:${image}`;
      }
      
      // Extract link
      let link = $item.find('a').first().attr('href') || '';
      if (link && !link.startsWith('http')) {
        link = `${baseUrl}${link}`;
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
    
    console.log(`✅ Found ${allProducts.length} products from homepage`);

    // Try to scrape category pages for more products
    console.log('📦 Scraping category pages...');
    
    const categoryUrls = [
      `${baseUrl}/category/농산물/24/`,
      `${baseUrl}/category/수산물/25/`,
      `${baseUrl}/category/가공식품/26/`,
      `${baseUrl}/category/특산품/27/`
    ];

    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`📂 Scraping category: ${categoryUrl}`);
        
        const categoryResponse = await axios.get(categoryUrl, { 
          headers, 
          timeout: 15000,
          validateStatus: (status) => status < 500
        });
        
        if (categoryResponse.status === 200) {
          const $category = cheerio.load(categoryResponse.data);
          
          // Use the working selector for category pages
          const categoryProducts = $category('.prdList .xans-record-');
          console.log(`  ✅ Found ${categoryProducts.length} products in category`);
          
          categoryProducts.each((index, element) => {
            const $item = $category(element);
            
            const imgAlt = $item.find('img').first().attr('alt') || '';
            const title = cleanTitle(imgAlt);
            
            // Same price extraction method
            const priceSpan = $item.find('ul.spec li.xans-record- span').last();
            const priceText = priceSpan.text().trim();
            const price = cleanPrice(priceText);
            
            let image = $item.find('img').first().attr('src') || '';
            if (image && !image.startsWith('http')) {
              image = `https:${image}`;
            }
            
            let link = $item.find('a').first().attr('href') || '';
            if (link && !link.startsWith('http')) {
              link = `${baseUrl}${link}`;
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
        }
      } catch (error) {
        console.log(`  ❌ Failed to scrape category: ${categoryUrl}`);
      }
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🎯 Total unique products found: ${allProducts.length}`);

    // Enhance some product details by visiting individual pages
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
          
          // Try to get better title if available
          const pageTitle = $product('meta[property="og:title"]').attr('content') ||
                           $product('.product_name, .goods_name, h1').first().text().trim();
          
          if (pageTitle && pageTitle.length > product.title.length) {
            product.title = cleanTitle(pageTitle);
            
            // Re-categorize with better title
            const { category, tags } = categorizeProduct(product.title);
            product.category = category;
            product.tags = tags;
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
      categories: [...new Set(allProducts.map(p => p.category))],
      errors: 0,
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
    console.log(`Errors: ${summary.errors}`);
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

scrapeShinan1004Fixed();