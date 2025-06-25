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

async function scrapeDangjinfarmFixed() {
  try {
    console.log('Starting fixed scraping of 당진팜...');
    
    const baseUrl = 'https://dangjinfarm.com';
    const products: DangjinfarmProduct[] = [];
    
    // Get product URLs from homepage
    console.log('Extracting product URLs from homepage...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(homeResponse.data);
    
    const productUrls: string[] = [];
    $('a[href*="product/detail.html"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        productUrls.push(fullUrl);
      }
    });
    
    const uniqueProductUrls = [...new Set(productUrls)].slice(0, 30); // Limit to 30 for testing
    console.log(`Found ${uniqueProductUrls.length} unique product URLs`);
    
    // Scrape each product
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
        
        // Extract title from page title
        let title = '';
        const pageTitle = p$('title').text().trim();
        if (pageTitle && pageTitle.includes(' - 당진팜')) {
          // Extract product name from page title (format: "Product Name - 당진팜")
          title = pageTitle.replace(' - 당진팜', '').trim();
        }
        
        // Fallback: look for product name in divs/spans
        if (!title || title === '게시글 신고하기') {
          p$('div, span, td').each((_, element) => {
            const text = p$(element).text().trim();
            if (text.length > 10 && text.length < 100 && !text.includes('\n') && 
                !text.includes('게시글') && !text.includes('신고') &&
                (text.includes('kg') || text.includes('g') || text.includes('개') || text.includes('포') || text.includes('병'))) {
              title = text;
              return false; // Break the loop
            }
          });
        }
        
        // Extract price
        let price = '';
        const priceElement = p$('.xans-product-detail .price').first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          if (priceText && priceText.includes('원')) {
            price = priceText;
          }
        }
        
        // Extract image
        let image = '';
        const imgElement = p$('.xans-product-detail img').first();
        if (imgElement.length > 0) {
          const imgSrc = imgElement.attr('src');
          if (imgSrc && !imgSrc.includes('common') && !imgSrc.includes('icon')) {
            image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
          }
        }
        
        // Determine category from URL or title
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
            } else if (title.includes('과일') || title.includes('채소') || title.includes('배추') || title.includes('무')) {
              category = '과일/채소';
            } else if (title.includes('분말') || title.includes('즙') || title.includes('엑기스') || title.includes('가공')) {
              category = '가공식품';
            }
        }
        
        // Generate product ID
        const productNoMatch = productUrl.match(/product_no=([0-9]+)/);
        const productId = productNoMatch ? `dangjinfarm_${productNoMatch[1]}` : `dangjinfarm_${Date.now()}_${i}`;
        
        // Only save valid products
        if (title && price && title.length > 5 && !title.includes('게시글') && !title.includes('당진팜')) {
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
          console.log(`✗ Invalid product data: "${title}" | ${price}`);
          errorCount++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.log(`✗ Error scraping ${productUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
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
      totalUrlsTested: uniqueProductUrls.length,
      successfullyScraped: successCount,
      errors: errorCount,
      validProducts: products.length,
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
    console.log(`Total URLs tested: ${summary.totalUrlsTested}`);
    console.log(`Successfully scraped: ${summary.successfullyScraped}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Valid products: ${summary.validProducts}`);
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
    console.log('당진팜 fixed scraping completed!');
    
  } catch (error) {
    console.error('Error during fixed scraping:', error);
    process.exit(1);
  }
}

scrapeDangjinfarmFixed();