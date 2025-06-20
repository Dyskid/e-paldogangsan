import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
  isFood?: boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function extractOntongDaejeonPrices() {
  console.log('🚀 Starting Ontong Daejeon price extraction with Puppeteer...');

  // Read existing food products
  const foodProducts: Product[] = JSON.parse(
    readFileSync('./scripts/output/ontongdaejeon-food-products.json', 'utf-8')
  );
  
  console.log(`📦 Found ${foodProducts.length} food products to process`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials'
    ]
  });

  const updatedProducts: Product[] = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Process each product
    for (let i = 0; i < foodProducts.length; i++) {
      const product = foodProducts[i];
      console.log(`\n📦 Processing ${i + 1}/${foodProducts.length}: ${product.title}`);

      try {
        // Navigate to product page
        await page.goto(product.productUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for page to load
        await delay(2000);

        // Extract price information
        const priceData = await page.evaluate(() => {
          let price = '';
          let originalPrice = '';

          // Method 1: Look for price in common selectors
          const priceSelectors = [
            '.goods_price',
            '.detail_price',
            '.price_area',
            '.selling_price',
            '.product_price',
            '.item_price',
            'dd.price',
            '.cost',
            '[class*="price"]:not([class*="original"])',
            'span:contains("원")',
            'strong:contains("원")',
            'em:contains("원")'
          ];

          for (const selector of priceSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              for (const elem of elements) {
                const text = elem.textContent || '';
                // Look for price pattern
                const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
                if (match && !price) {
                  price = match[1] + '원';
                  break;
                }
              }
              if (price) break;
            } catch (e) {}
          }

          // Method 2: Look in table cells
          const tables = document.querySelectorAll('table');
          for (const table of tables) {
            const rows = table.querySelectorAll('tr');
            for (const row of rows) {
              const th = row.querySelector('th');
              const td = row.querySelector('td');
              if (th && td) {
                const label = th.textContent || '';
                if (label.includes('판매가') || label.includes('가격') || label.includes('금액')) {
                  const text = td.textContent || '';
                  const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
                  if (match) {
                    price = match[1] + '원';
                    break;
                  }
                }
              }
            }
            if (price) break;
          }

          // Method 3: Look for price in all text nodes
          if (!price) {
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );

            let node;
            while (node = walker.nextNode()) {
              const text = node.textContent || '';
              if (text.includes('원') && !text.includes('배송비')) {
                const match = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
                if (match) {
                  const priceNum = parseInt(match[1].replace(/,/g, ''));
                  // Filter out unrealistic prices
                  if (priceNum > 1000 && priceNum < 10000000) {
                    price = match[1] + '원';
                    break;
                  }
                }
              }
            }
          }

          // Method 4: Check meta tags
          if (!price) {
            const metaPrice = document.querySelector('meta[property="product:price:amount"]');
            if (metaPrice) {
              const content = metaPrice.getAttribute('content');
              if (content) {
                const priceNum = parseInt(content);
                if (priceNum > 0) {
                  price = priceNum.toLocaleString('ko-KR') + '원';
                }
              }
            }
          }

          // Method 5: Check structured data
          if (!price) {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
              try {
                const data = JSON.parse(script.textContent || '{}');
                if (data.offers && data.offers.price) {
                  const priceNum = parseInt(data.offers.price);
                  if (priceNum > 0) {
                    price = priceNum.toLocaleString('ko-KR') + '원';
                    break;
                  }
                }
              } catch (e) {}
            }
          }

          return { price, originalPrice };
        });

        if (priceData.price) {
          console.log(`    ✅ Found price: ${priceData.price}`);
          successCount++;
          product.price = priceData.price;
          if (priceData.originalPrice) {
            product.originalPrice = priceData.originalPrice;
          }
        } else {
          console.log(`    ⚠️ No price found`);
        }

        updatedProducts.push(product);

      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        errorCount++;
        updatedProducts.push(product);
      }

      // Add delay between requests
      await delay(1500);
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }

  // Save updated products
  writeFileSync(
    './scripts/output/ontongdaejeon-food-products-with-prices.json',
    JSON.stringify(updatedProducts, null, 2)
  );

  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    totalProducts: foodProducts.length,
    successfulExtractions: successCount,
    errors: errorCount,
    productsWithPrices: updatedProducts.filter(p => p.price).length,
    sampleProductsWithPrices: updatedProducts
      .filter(p => p.price)
      .slice(0, 10)
      .map(p => ({
        title: p.title,
        price: p.price
      }))
  };

  writeFileSync(
    './scripts/output/ontongdaejeon-price-extraction-summary.json',
    JSON.stringify(summary, null, 2)
  );

  console.log('\n📊 Price Extraction Summary:');
  console.log(`✅ Successful extractions: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`💰 Products with prices: ${summary.productsWithPrices}`);

  if (summary.sampleProductsWithPrices.length > 0) {
    console.log('\n💰 Products with prices found:');
    summary.sampleProductsWithPrices.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - ${p.price}`);
    });
  }
}

// Run the price extractor
extractOntongDaejeonPrices()
  .then(() => console.log('\n✅ Price extraction completed!'))
  .catch(console.error);