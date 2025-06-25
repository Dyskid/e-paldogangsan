/**
 * Comprehensive Yangyang Mall Scraper
 * URL: https://yangyang-mall.com/
 * Strategy: Extract product URLs from homepage and scrape individual product pages
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  mall: string;
  mallId: string;
  category: string;
  description: string;
  inStock: boolean;
  lastUpdated: string;
  createdAt: string;
}

interface ScrapingResult {
  totalProducts: number;
  successfulScrapes: number;
  errors: number;
  products: Product[];
  errorDetails: Array<{url: string, error: string}>;
}

async function scrapeYangyangMall(): Promise<void> {
  console.log('🕸️ Starting Yangyang Mall comprehensive scraper...');
  
  const result: ScrapingResult = {
    totalProducts: 0,
    successfulScrapes: 0,
    errors: 0,
    products: [],
    errorDetails: []
  };

  const outputDir = path.join(__dirname, 'output');
  await fs.mkdir(outputDir, { recursive: true });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  };

  try {
    // Step 1: Extract all product URLs from homepage
    console.log('📱 Extracting product URLs from homepage...');
    const homeResponse = await axios.get('https://yangyang-mall.com/', { headers, timeout: 30000 });
    const $ = cheerio.load(homeResponse.data);
    
    const productUrls: string[] = [];
    $('a[href*="/goods/view"]').each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://yangyang-mall.com${href}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    console.log(`🔗 Found ${productUrls.length} unique product URLs`);
    result.totalProducts = productUrls.length;

    // Save product URLs for reference
    await fs.writeFile(
      path.join(outputDir, 'yangyang-product-urls.txt'), 
      productUrls.join('\n')
    );

    if (productUrls.length === 0) {
      throw new Error('No product URLs found on homepage');
    }

    // Step 2: Scrape each product page
    console.log('🛍️ Starting to scrape individual product pages...');
    
    for (let i = 0; i < productUrls.length; i++) {
      const productUrl = productUrls[i];
      console.log(`📦 Scraping product ${i + 1}/${productUrls.length}: ${productUrl}`);
      
      try {
        const productResponse = await axios.get(productUrl, { 
          headers, 
          timeout: 20000,
          validateStatus: (status) => status < 400
        });
        
        if (productResponse.status !== 200) {
          throw new Error(`HTTP ${productResponse.status}`);
        }

        const product$ = cheerio.load(productResponse.data);
        
        // Extract product details using multiple selector strategies
        let productName = '';
        const nameSelectors = [
          'h1.goods-name',
          'h1',
          '.goods-name', 
          '.product-name',
          '.subject',
          '.title',
          'h2',
          '[class*="name"]'
        ];
        
        for (const selector of nameSelectors) {
          const nameEl = product$(selector).first();
          if (nameEl.length > 0) {
            productName = nameEl.text().trim();
            if (productName && productName.length > 2) break;
          }
        }

        // Extract price
        let productPrice = 0;
        let priceText = '';
        const priceSelectors = [
          '.goods-price .price',
          '.price',
          '.cost',
          '.amount',
          '.sale-price',
          '.selling-price',
          '.money',
          '[class*="price"]'
        ];
        
        for (const selector of priceSelectors) {
          const priceEl = product$(selector).first();
          if (priceEl.length > 0) {
            priceText = priceEl.text().trim();
            // Extract numeric price
            const priceMatch = priceText.match(/[\d,]+/);
            if (priceMatch) {
              productPrice = parseInt(priceMatch[0].replace(/,/g, ''), 10);
              if (productPrice > 0) break;
            }
          }
        }

        // Extract image
        let productImage = '';
        const imageSelectors = [
          '.goods-image img',
          '.product-image img',
          '.main-image img',
          '.detail-image img',
          '.thumb img',
          'img[src*="goods"]',
          'img[src*="product"]'
        ];
        
        for (const selector of imageSelectors) {
          const imgEl = product$(selector).first();
          if (imgEl.length > 0) {
            const imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || '';
            if (imgSrc) {
              productImage = imgSrc.startsWith('http') ? imgSrc : `https://yangyang-mall.com${imgSrc}`;
              break;
            }
          }
        }

        // Extract description
        let description = '';
        const descSelectors = [
          '.goods-description',
          '.product-description', 
          '.description',
          '.summary',
          '.content'
        ];
        
        for (const selector of descSelectors) {
          const descEl = product$(selector).first();
          if (descEl.length > 0) {
            description = descEl.text().trim().substring(0, 200);
            if (description) break;
          }
        }

        // Check if product is in stock
        let inStock = true;
        const stockIndicators = product$('.sold-out, .out-of-stock, .no-stock');
        if (stockIndicators.length > 0) {
          inStock = false;
        }

        // Only create product if we have essential data
        if (productName && productName.length > 1) {
          const productId = `yangyang_${Date.now()}_${i}`;
          
          const product: Product = {
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            link: productUrl,
            mall: '양양몰',
            mallId: 'mall_22',
            category: '지역특산품',
            description: description || productName,
            inStock,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          // Only add products with prices for registration
          if (productPrice > 0) {
            result.products.push(product);
            result.successfulScrapes++;
            console.log(`✅ Scraped: ${productName} - ${productPrice.toLocaleString()}원`);
          } else {
            console.log(`⚠️ No price found for: ${productName}`);
          }
        } else {
          console.log(`⚠️ No product name found for: ${productUrl}`);
        }

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`❌ Error scraping ${productUrl}: ${error.message}`);
        result.errors++;
        result.errorDetails.push({
          url: productUrl,
          error: error.message
        });
      }
    }

    // Step 3: Save results
    console.log('💾 Saving scraping results...');
    
    const productsFile = path.join(outputDir, 'yangyang-products.json');
    const summaryFile = path.join(outputDir, 'yangyang-scrape-summary.json');
    
    await fs.writeFile(productsFile, JSON.stringify(result.products, null, 2));
    await fs.writeFile(summaryFile, JSON.stringify({
      mallId: 'mall_22',
      mallName: '양양몰',
      totalUrls: result.totalProducts,
      successfulScrapes: result.successfulScrapes,
      errors: result.errors,
      productsWithPrices: result.products.length,
      scrapedAt: new Date().toISOString(),
      errorDetails: result.errorDetails
    }, null, 2));

    console.log('\n🎉 Yangyang Mall scraping completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total URLs found: ${result.totalProducts}`);
    console.log(`   Successful scrapes: ${result.successfulScrapes}`);
    console.log(`   Products with prices: ${result.products.length}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`📁 Files saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);

    if (result.products.length > 0) {
      console.log(`\n🛍️ Sample products scraped:`);
      result.products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price.toLocaleString()}원`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    
    // Save error summary
    const errorSummary = {
      mallId: 'mall_22',
      mallName: '양양몰',
      error: error.message,
      scrapedAt: new Date().toISOString(),
      partialResults: result
    };
    
    await fs.writeFile(
      path.join(outputDir, 'yangyang-error-summary.json'), 
      JSON.stringify(errorSummary, null, 2)
    );
  }
}

// Run the scraper
if (require.main === module) {
  scrapeYangyangMall().catch(console.error);
}

export { scrapeYangyangMall };