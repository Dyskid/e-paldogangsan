import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
}

async function scrapeMgmallProducts() {
  console.log('🕸️ Starting comprehensive scraping of 문경몰...\n');

  const baseUrl = 'https://mgmall.cyso.co.kr';
  const mallId = 'mgmall';
  const mallName = '문경몰';
  const products: Product[] = [];
  const errors: string[] = [];

  try {
    // First, get the homepage to extract all product URLs
    console.log('📥 Fetching homepage for product URLs...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(homepageResponse.data);
    
    // Extract all product URLs
    const productUrls: string[] = [];
    $('a[href*="shop/item.php?it_id="]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? href : '/' + href}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    console.log(`🔗 Found ${productUrls.length} unique product URLs`);

    // Limit to 50 products for initial scraping
    const limitedUrls = productUrls.slice(0, 50);
    console.log(`📦 Processing first ${limitedUrls.length} products...\n`);

    // Process each product
    for (let i = 0; i < limitedUrls.length; i++) {
      const productUrl = limitedUrls[i];
      console.log(`[${i + 1}/${limitedUrls.length}] Processing: ${productUrl}`);

      try {
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 8000
        });

        const productPage = cheerio.load(productResponse.data);
        
        // Extract product ID from URL
        const idMatch = productUrl.match(/it_id=([^&]+)/);
        const productId = idMatch ? idMatch[1] : '';

        // Extract product name - CYSO platform typically uses #sit_title
        let productName = '';
        const nameSelectors = ['#sit_title', 'h2#sit_title', '#sit_desc', 'p#sit_desc', 'h1', 'title'];
        for (const selector of nameSelectors) {
          const name = productPage(selector).first().text().trim();
          if (name && name.length > 0) {
            productName = name;
            break;
          }
        }

        // Clean up title tag content
        if (productName.includes('::')) {
          productName = productName.split('::')[0].trim();
        }
        if (productName.includes(' - ')) {
          productName = productName.split(' - ')[0].trim();
        }

        // Extract price using JavaScript variables (most reliable for CYSO platforms)
        let price = '';
        const scriptContent = productResponse.data;
        
        // Check JavaScript variables first (most reliable for CYSO platforms)
        const priceMatch = scriptContent.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]).toLocaleString() + '원';
        }

        // Fallback price extraction methods
        if (!price) {
          const pricePatterns = [
            /(\d{1,3}(?:,\d{3})*)\s*원/,
            /판매가\s*:\s*([\d,]+원)/,
            /가격\s*:\s*([\d,]+원)/,
            /소비자가\s*:\s*([\d,]+원)/
          ];

          for (const pattern of pricePatterns) {
            const match = scriptContent.match(pattern);
            if (match && match[0]) {
              price = match[0];
              break;
            }
          }
        }

        // Extract product image
        let imageUrl = '';
        const imageSelectors = ['img[src*="/data/item/"]', '#sit_pvi img', '.it_image img', '.product_image img', '.item_image img'];
        for (const selector of imageSelectors) {
          const img = productPage(selector).first();
          const src = img.attr('src');
          if (src) {
            imageUrl = src.startsWith('http') ? src : `${baseUrl}${src.startsWith('/') ? src : '/' + src}`;
            break;
          }
        }

        // Only add product if we have essential data
        if (productId && productName && price && imageUrl) {
          const product: Product = {
            id: productId,
            name: productName,
            price: price,
            image: imageUrl,
            mallId: mallId,
            mallName: mallName,
            url: productUrl
          };

          products.push(product);
          console.log(`✅ ${productName} - ${price}`);
        } else {
          const missing = [];
          if (!productId) missing.push('ID');
          if (!productName) missing.push('name');
          if (!price) missing.push('price');
          if (!imageUrl) missing.push('image');
          console.log(`⚠️ Skipped - Missing: ${missing.join(', ')}`);
          errors.push(`${productUrl}: Missing ${missing.join(', ')}`);
        }

        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.log(`❌ Error processing ${productUrl}: ${error}`);
        errors.push(`${productUrl}: ${error}`);
      }
    }

    console.log('\n📊 Scraping Summary:');
    console.log('====================');
    console.log(`✅ Successfully scraped: ${products.length} products`);
    console.log(`❌ Errors encountered: ${errors.length}`);

    // Save products
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const productsPath = path.join(outputDir, 'mgmall-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

    // Save scraping summary
    const summary = {
      mallName,
      mallId,
      baseUrl,
      totalProductsScraped: products.length,
      totalErrors: errors.length,
      scrapeDate: new Date().toISOString(),
      productSample: products.slice(0, 3),
      errors: errors.slice(0, 10) // Save first 10 errors for analysis
    };

    const summaryPath = path.join(outputDir, 'mgmall-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n💾 Products saved: ${productsPath}`);
    console.log(`📋 Summary saved: ${summaryPath}`);

    // Display sample products
    console.log('\n🔍 Sample Products:');
    console.log('==================');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   💰 ${product.price}`);
      console.log(`   🔗 ${product.url}`);
      console.log();
    });

    return products;

  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  }
}

// Run scraper
scrapeMgmallProducts()
  .then((products) => {
    console.log(`\n✅ Successfully scraped ${products.length} products from 문경몰!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  });