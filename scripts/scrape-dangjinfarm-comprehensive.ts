import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface DangjinfarmProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  region: string;
  tags: string[];
  inStock: boolean;
}

async function scrapeDangjinfarmComprehensive() {
  try {
    console.log('Starting comprehensive scraping of 당진팜...');
    
    const baseUrl = 'https://dangjinfarm.com';
    const products: DangjinfarmProduct[] = [];
    const productUrls: string[] = [];
    
    // Step 1: Extract product URLs from homepage
    console.log('Extracting product URLs from homepage...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(homeResponse.data);
    
    // Extract product URLs from homepage
    $('a[href*="product/detail.html"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        productUrls.push(fullUrl);
      }
    });
    
    // Remove duplicates
    const uniqueProductUrls = [...new Set(productUrls)];
    console.log(`Found ${uniqueProductUrls.length} unique product URLs on homepage`);
    
    // Step 2: Try to find more products from category pages
    const categoryUrls = [
      baseUrl + '/product/list.html?cate_no=50', // 해나루상품
      baseUrl + '/product/list.html?cate_no=44', // 가공상품
      baseUrl + '/product/list.html?cate_no=46', // 쌀/잡곡
      baseUrl + '/product/list.html?cate_no=48', // 과일/채소
      baseUrl + '/product/list.html?cate_no=49'  // 농가별 상품
    ];
    
    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`Checking category: ${categoryUrl}`);
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });
        
        const c$ = cheerio.load(categoryResponse.data);
        
        c$('a[href*="product/detail.html"]').each((_, element) => {
          const href = c$(element).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!uniqueProductUrls.includes(fullUrl)) {
              uniqueProductUrls.push(fullUrl);
            }
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`Could not access category: ${categoryUrl}`);
      }
    }
    
    console.log(`Total unique product URLs found: ${uniqueProductUrls.length}`);
    
    // Step 3: Scrape each product page
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < uniqueProductUrls.length; i++) {
      const productUrl = uniqueProductUrls[i];
      
      try {
        console.log(`Scraping product ${i + 1}/${uniqueProductUrls.length}: ${productUrl}`);
        
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });
        
        const p$ = cheerio.load(productResponse.data);
        
        // Extract product details
        let title = '';
        const titleSelectors = [
          '.xans-product-detail .itemname',
          '.product-name',
          '.product_name',
          '.goods_name',
          '.item_name',
          'h1',
          '.product-title'
        ];
        
        for (const selector of titleSelectors) {
          const titleElement = p$(selector).first();
          if (titleElement.length > 0) {
            title = titleElement.text().trim();
            if (title) break;
          }
        }
        
        // Extract price
        let price = '';
        const priceSelectors = [
          '.xans-product-detail .price',
          '.product-price',
          '.price',
          '.cost',
          '.amount',
          '.sale-price',
          '.selling-price'
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = p$(selector).first();
          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim();
            if (priceText && priceText.includes('원')) {
              price = priceText;
              break;
            }
          }
        }
        
        // Extract image
        let image = '';
        const imageSelectors = [
          '.xans-product-detail img',
          '.product-image img',
          '.product_image img',
          '.goods_image img'
        ];
        
        for (const selector of imageSelectors) {
          const imgElement = p$(selector).first();
          if (imgElement.length > 0) {
            const imgSrc = imgElement.attr('src');
            if (imgSrc && !imgSrc.includes('common') && !imgSrc.includes('icon')) {
              image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
              break;
            }
          }
        }
        
        // Determine category from URL parameters or content
        const urlParams = new URL(productUrl).searchParams;
        const cateNo = urlParams.get('cate_no');
        let category = '기타';
        
        switch (cateNo) {
          case '50':
            category = '해나루상품';
            break;
          case '44':
            category = '가공식품';
            break;
          case '46':
            category = '쌀/잡곡';
            break;
          case '48':
            category = '과일/채소';
            break;
          case '49':
            category = '농가별상품';
            break;
          default:
            if (title.includes('쌀') || title.includes('잡곡')) {
              category = '쌀/잡곡';
            } else if (title.includes('과일') || title.includes('채소')) {
              category = '과일/채소';
            } else if (title.includes('가공') || title.includes('즙') || title.includes('분말')) {
              category = '가공식품';
            }
        }
        
        // Generate product ID from URL
        const productNoMatch = productUrl.match(/product_no=([0-9]+)/);
        const productId = productNoMatch ? `dangjinfarm_${productNoMatch[1]}` : `dangjinfarm_${Date.now()}_${i}`;
        
        // Only save products with valid title and price
        if (title && price && title.length > 2 && !title.includes('카테고리')) {
          const product: DangjinfarmProduct = {
            id: productId,
            title: title,
            price: price,
            image: image || '',
            url: productUrl,
            category: category,
            mall: '당진팜',
            region: '충청남도',
            tags: ['당진팜', '충남특산품', '당진특산품', '농산물', '직거래'],
            inStock: true
          };
          
          products.push(product);
          successCount++;
          
          console.log(`✓ Product scraped: ${title} (${price}) [${category}]`);
        } else {
          console.log(`✗ Invalid product data: ${title} | ${price}`);
          errorCount++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.log(`✗ Error scraping ${productUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
        
        // Continue with next product
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Save results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const productsPath = path.join(outputDir, 'dangjinfarm-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '당진팜',
      baseUrl,
      totalUrlsFound: uniqueProductUrls.length,
      successfullyScraped: successCount,
      errors: errorCount,
      products: products.length,
      categories: [...new Set(products.map(p => p.category))],
      priceRange: products.length > 0 ? {
        min: Math.min(...products.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        max: Math.max(...products.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        average: Math.round(products.reduce((sum, p) => sum + (parseInt(p.price.replace(/[^0-9]/g, '')) || 0), 0) / products.length)
      } : null,
      sampleProducts: products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    const summaryPath = path.join(outputDir, 'dangjinfarm-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== 당진팜 SCRAPING SUMMARY ===');
    console.log(`Total URLs found: ${summary.totalUrlsFound}`);
    console.log(`Successfully scraped: ${summary.successfullyScraped}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Valid products: ${summary.products}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    
    if (summary.priceRange) {
      console.log(`Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
      console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
    }
    
    if (summary.sampleProducts.length > 0) {
      console.log('\nSample products:');
      summary.sampleProducts.forEach(product => {
        console.log(`- ${product.title} (${product.price}) [${product.category}]`);
      });
    }
    
    console.log(`\nProducts saved to: ${productsPath}`);
    console.log(`Summary saved to: ${summaryPath}`);
    console.log('당진팜 comprehensive scraping completed!');
    
  } catch (error) {
    console.error('Error during comprehensive scraping:', error);
    process.exit(1);
  }
}

scrapeDangjinfarmComprehensive();