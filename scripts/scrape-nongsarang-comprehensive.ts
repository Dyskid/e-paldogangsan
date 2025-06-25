import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

interface NongsarangProduct {
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

async function scrapeNongsarangComprehensive() {
  try {
    console.log('Starting comprehensive scraping of 농사랑...');
    
    const baseUrl = 'https://nongsarang.co.kr';
    const products: NongsarangProduct[] = [];
    const productUrls: string[] = [];
    
    // Step 1: Extract all product URLs from homepage
    console.log('Extracting product URLs from homepage...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 30000,
      responseType: 'arraybuffer'
    });
    
    const homeHtml = iconv.decode(Buffer.from(homeResponse.data), 'euc-kr');
    const $ = cheerio.load(homeHtml);
    
    // Extract product URLs from homepage
    $('a[href*="shopdetail.html"]').each((_, element) => {
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
      baseUrl + '/shop/shopbrand.html?type=X&xcode=003', // 채소
      baseUrl + '/shop/shopbrand.html?type=X&xcode=005', // 과일
      baseUrl + '/shop/shopbrand.html?type=X&xcode=006', // 양념/장류
      baseUrl + '/shop/shopbrand.html?type=X&xcode=010', // 가공식품
      baseUrl + '/shop/shopbrand.html?type=X&xcode=130', // 기타
    ];
    
    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`Checking category: ${categoryUrl}`);
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000,
          responseType: 'arraybuffer'
        });
        
        const categoryHtml = iconv.decode(Buffer.from(categoryResponse.data), 'euc-kr');
        const c$ = cheerio.load(categoryHtml);
        
        c$('a[href*="shopdetail.html"]').each((_, element) => {
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
          timeout: 15000,
          responseType: 'arraybuffer'
        });
        
        const productHtml = iconv.decode(Buffer.from(productResponse.data), 'euc-kr');
        const p$ = cheerio.load(productHtml);
        
        // Extract product details
        let title = '';
        const titleSelectors = [
          '.item_detail_tit',
          '.product-title',
          '.prd-name',
          'h1',
          '.productname',
          '.goods_name'
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
          '.item_detail_price b',
          '.price',
          '.cost',
          '.amount',
          '.sale-price',
          '.prd-price b',
          '.productprice'
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
          '.item_detail_tit img',
          '.product-image img',
          '.prd-img img',
          '.productimg img',
          '.goods_img img'
        ];
        
        for (const selector of imageSelectors) {
          const imgElement = p$(selector).first();
          if (imgElement.length > 0) {
            const imgSrc = imgElement.attr('src');
            if (imgSrc) {
              image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
              break;
            }
          }
        }
        
        // If no specific image found, try any img tag
        if (!image) {
          const anyImg = p$('img').first();
          if (anyImg.length > 0) {
            const imgSrc = anyImg.attr('src');
            if (imgSrc && !imgSrc.includes('common') && !imgSrc.includes('icon')) {
              image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
            }
          }
        }
        
        // Determine category from URL parameters
        const urlParams = new URL(productUrl).searchParams;
        const xcode = urlParams.get('xcode');
        let category = '기타';
        
        switch (xcode) {
          case '003':
            category = '채소류';
            break;
          case '005':
            category = '과일류';
            break;
          case '006':
            category = '양념/장류';
            break;
          case '010':
            category = '가공식품';
            break;
          case '130':
            category = '기타';
            break;
          default:
            if (title.includes('채소') || title.includes('시금치') || title.includes('배추')) {
              category = '채소류';
            } else if (title.includes('과일') || title.includes('사과') || title.includes('딸기')) {
              category = '과일류';
            } else if (title.includes('고추장') || title.includes('된장') || title.includes('간장')) {
              category = '양념/장류';
            } else if (title.includes('떡') || title.includes('과자') || title.includes('가공')) {
              category = '가공식품';
            }
        }
        
        // Generate product ID from URL
        const branduidMatch = productUrl.match(/branduid=([0-9]+)/);
        const productId = branduidMatch ? `nongsarang_${branduidMatch[1]}` : `nongsarang_${Date.now()}_${i}`;
        
        // Only save products with valid title and price
        if (title && price && title.length > 2 && !title.includes('카테고리')) {
          const product: NongsarangProduct = {
            id: productId,
            title: title,
            price: price,
            image: image || '',
            url: productUrl,
            category: category,
            mall: '농사랑',
            region: '충청남도',
            tags: ['농사랑', '충남특산품', '지역특산품', '농산물'],
            inStock: true
          };
          
          products.push(product);
          successCount++;
          
          console.log(`✓ Product scraped: ${title} (${price})`);
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
    
    const productsPath = path.join(outputDir, 'nongsarang-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '농사랑',
      baseUrl,
      totalUrlsFound: uniqueProductUrls.length,
      successfullyScraped: successCount,
      errors: errorCount,
      products: products.length,
      categories: [...new Set(products.map(p => p.category))],
      priceRange: {
        min: Math.min(...products.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        max: Math.max(...products.map(p => parseInt(p.price.replace(/[^0-9]/g, '')) || 0)),
        average: Math.round(products.reduce((sum, p) => sum + (parseInt(p.price.replace(/[^0-9]/g, '')) || 0), 0) / products.length)
      },
      sampleProducts: products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    const summaryPath = path.join(outputDir, 'nongsarang-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== 농사랑 SCRAPING SUMMARY ===');
    console.log(`Total URLs found: ${summary.totalUrlsFound}`);
    console.log(`Successfully scraped: ${summary.successfullyScraped}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Valid products: ${summary.products}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    
    if (summary.products > 0) {
      console.log(`Price range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
      console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
      
      console.log('\nSample products:');
      summary.sampleProducts.forEach(product => {
        console.log(`- ${product.title} (${product.price}) [${product.category}]`);
      });
    }
    
    console.log(`\nProducts saved to: ${productsPath}`);
    console.log(`Summary saved to: ${summaryPath}`);
    console.log('농사랑 comprehensive scraping completed!');
    
  } catch (error) {
    console.error('Error during comprehensive scraping:', error);
    process.exit(1);
  }
}

scrapeNongsarangComprehensive();