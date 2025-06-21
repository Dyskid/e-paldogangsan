import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor: string;
  description: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
}

async function scrapeSamcheokMall() {
  console.log('🚀 Starting Samcheok Mall comprehensive scraper...');
  
  const baseUrl = 'https://samcheok-mall.com';
  const products: Product[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    // Step 1: Get all product URLs from homepage
    console.log('🏠 Getting product links from homepage...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $homepage = cheerio.load(homepageResponse.data);
    const productUrls: string[] = [];

    // Extract product URLs using the pattern found in testing
    $homepage('a[href*="/goods/view"]').each((i, elem) => {
      const href = $homepage(elem).attr('href');
      if (href) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = baseUrl + href;
        }
        // Handle both samcheok-mall.com and www.samcheok-mall.com
        fullUrl = fullUrl.replace('www.samcheok-mall.com', 'samcheok-mall.com');
        
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    console.log(`Found ${productUrls.length} product links`);

    // Step 2: Scrape each product
    for (let i = 0; i < Math.min(productUrls.length, 60); i++) {
      const url = productUrls[i];
      
      try {
        console.log(`⏳ ${i + 1}/${Math.min(productUrls.length, 60)} Processing: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // Extract product data using the selectors found in testing
        const title = $('.name').first().text().trim() ||
                     $('h1').text().trim() ||
                     $('.title').text().trim() ||
                     $('.product-name').text().trim() ||
                     'Unknown Product';

        const priceText = $('[class*="price"]').first().text().trim() ||
                         $('.price').text().trim() ||
                         '';

        const imageUrl = $('img[src*="goods"]').first().attr('src') ||
                        $('.product-image img').first().attr('src') ||
                        $('img').first().attr('src') ||
                        '';

        // Make image URL absolute
        let fullImageUrl = imageUrl;
        if (imageUrl && imageUrl.startsWith('/')) {
          fullImageUrl = baseUrl + imageUrl;
        } else if (imageUrl && !imageUrl.startsWith('http')) {
          fullImageUrl = baseUrl + '/' + imageUrl;
        }

        // Extract product ID from URL
        const urlMatch = url.match(/no=(\d+)/);
        const productId = urlMatch ? urlMatch[1] : `unknown-${i}`;

        // Skip products without meaningful titles or prices
        if (!title || title === 'Unknown Product' || title === '추천 상품' || 
            !priceText || priceText.length === 0) {
          console.log(`⏭️ Skipping product with insufficient data: ${title || 'No title'}`);
          errorCount++;
          continue;
        }

        const product: Product = {
          id: productId,
          title: title,
          price: priceText,
          imageUrl: fullImageUrl,
          productUrl: url,
          category: '삼척특산품',
          vendor: '상호명 : 삼척몰',
          description: title, // Use title as description for now
          mallId: 'samcheok',
          mallName: '삼척몰',
          mallUrl: baseUrl,
          region: '강원도 삼척시'
        };

        products.push(product);
        successCount++;

        console.log(`✅ ${successCount} Scraped: ${title} - ${priceText.replace(/\s+/g, ' ')}`);

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMsg = `Failed to scrape ${url}: ${error.message}`;
        errors.push(errorMsg);
        errorCount++;
        console.log(`❌ Error: ${errorMsg}`);
        
        // Continue with next product
        continue;
      }
    }

    // Step 3: Save results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const productsPath = path.join(outputDir, 'samcheok-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');

    const summary = {
      timestamp: new Date().toISOString(),
      mallName: '삼척몰',
      mallUrl: baseUrl,
      totalProductUrls: productUrls.length,
      processedProducts: Math.min(productUrls.length, 60),
      successfullyScraped: successCount,
      errors: errorCount,
      savedProducts: products.length,
      errorDetails: errors,
      sampleProducts: products.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        id: p.id
      }))
    };

    const summaryPath = path.join(outputDir, 'samcheok-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log('\n📊 Scraping Summary:');
    console.log(`🔗 Total product URLs found: ${productUrls.length}`);
    console.log(`⚡ Products processed: ${Math.min(productUrls.length, 60)}`);
    console.log(`✅ Successfully scraped: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`💾 Products saved: ${products.length}`);
    console.log(`📄 Results saved to: ${productsPath}`);
    console.log(`📋 Summary saved to: ${summaryPath}`);

    if (errors.length > 0) {
      console.log('\n⚠️ Error details:');
      errors.slice(0, 5).forEach(error => console.log(`  ${error}`));
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
    }

    return products;

  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    throw error;
  }
}

// Run scraper
scrapeSamcheokMall()
  .then((products) => {
    console.log(`\n🎉 Samcheok Mall scraping completed! Found ${products.length} products.`);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });