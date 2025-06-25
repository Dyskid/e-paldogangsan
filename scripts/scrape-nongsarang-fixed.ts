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

async function scrapeNongsarangFixed() {
  try {
    console.log('Starting fixed scraping of 농사랑...');
    
    const baseUrl = 'https://nongsarang.co.kr';
    const products: NongsarangProduct[] = [];
    
    // Get product URLs from homepage
    console.log('Extracting product URLs from homepage...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000,
      responseType: 'arraybuffer'
    });
    
    const homeHtml = iconv.decode(Buffer.from(homeResponse.data), 'euc-kr');
    const $ = cheerio.load(homeHtml);
    
    const productUrls: string[] = [];
    $('a[href*="shopdetail.html"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        productUrls.push(fullUrl);
      }
    });
    
    const uniqueProductUrls = [...new Set(productUrls)].slice(0, 50); // Limit to 50 for testing
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
          timeout: 15000,
          responseType: 'arraybuffer'
        });
        
        const productHtml = iconv.decode(Buffer.from(productResponse.data), 'euc-kr');
        const p$ = cheerio.load(productHtml);
        
        // Extract title from page title or h3
        let title = '';
        const pageTitle = p$('title').text().trim();
        if (pageTitle && pageTitle.includes(' - ')) {
          // Extract product name from page title (format: "충남 농사랑 - (company)product name")
          const titleParts = pageTitle.split(' - ');
          if (titleParts.length > 1) {
            title = titleParts[1].trim();
          }
        }
        
        // Fallback to h3 element
        if (!title) {
          const h3Element = p$('h3').first();
          if (h3Element.length > 0) {
            title = h3Element.text().trim();
          }
        }
        
        // Extract price
        let price = '';
        const priceElement = p$('.price').first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          // Extract the first price (main price)
          const priceMatch = priceText.match(/([0-9,]+원)/);
          if (priceMatch) {
            price = priceMatch[1];
          }
        }
        
        // Extract image
        let image = '';
        const imgElement = p$('img[src*="shopimages"]').first();
        if (imgElement.length > 0) {
          const imgSrc = imgElement.attr('src');
          if (imgSrc) {
            image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
          }
        }
        
        // Determine category from URL or title
        const urlParams = new URL(productUrl).searchParams;
        const xcode = urlParams.get('xcode');
        let category = '기타';
        
        switch (xcode) {
          case '003':
            category = '채소류';
            break;
          case '004':
            category = '축산물';
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
          case '032':
            category = '수산물';
            break;
          case '130':
            category = '기타';
            break;
          default:
            if (title.includes('한우') || title.includes('돼지') || title.includes('닭')) {
              category = '축산물';
            } else if (title.includes('채소') || title.includes('배추') || title.includes('무')) {
              category = '채소류';
            } else if (title.includes('과일') || title.includes('사과') || title.includes('배')) {
              category = '과일류';
            } else if (title.includes('고추장') || title.includes('된장') || title.includes('간장')) {
              category = '양념/장류';
            } else if (title.includes('가공') || title.includes('떡') || title.includes('과자')) {
              category = '가공식품';
            }
        }
        
        // Generate product ID
        const branduidMatch = productUrl.match(/branduid=([0-9]+)/);
        const productId = branduidMatch ? `nongsarang_${branduidMatch[1]}` : `nongsarang_${Date.now()}_${i}`;
        
        // Only save valid products
        if (title && price && title.length > 5 && !title.includes('농사랑 -')) {
          const product: NongsarangProduct = {
            id: productId,
            title: title,
            price: price,
            image: image || '',
            url: productUrl,
            category: category,
            mall: '농사랑',
            region: '충청남도',
            tags: ['농사랑', '충남특산품', '지역특산품', '농축산물'],
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
    
    const productsPath = path.join(outputDir, 'nongsarang-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: '농사랑',
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
    
    const summaryPath = path.join(outputDir, 'nongsarang-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== 농사랑 SCRAPING SUMMARY ===');
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
    console.log('농사랑 fixed scraping completed!');
    
  } catch (error) {
    console.error('Error during fixed scraping:', error);
    process.exit(1);
  }
}

scrapeNongsarangFixed();