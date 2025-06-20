import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import * as https from 'https';

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

async function extractPriceFromPage(url: string, httpsAgent: https.Agent): Promise<{ price: string; originalPrice?: string }> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      httpsAgent,
      timeout: 30000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    let price = '';
    let originalPrice = '';

    // Debug: Save HTML for inspection
    if (!price) {
      const debugPath = `./scripts/output/debug/ontongdaejeon-product-${Date.now()}.html`;
      writeFileSync(debugPath, response.data);
      console.log(`    📄 HTML saved to ${debugPath}`);
    }

    // Method 1: Look for price in script tags
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      
      // Look for price variables
      const patterns = [
        /goodsAmt[\s]*[:=][\s]*["']?(\d+)["']?/,
        /price[\s]*[:=][\s]*["']?(\d+)["']?/i,
        /판매가[\s]*[:=][\s]*["']?(\d+)["']?/,
        /amount[\s]*[:=][\s]*["']?(\d+)["']?/i,
        /salePrice[\s]*[:=][\s]*["']?(\d+)["']?/i
      ];

      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match && !price) {
          const priceNum = parseInt(match[1]);
          if (priceNum > 1000 && priceNum < 10000000) {
            price = priceNum.toLocaleString('ko-KR') + '원';
            console.log(`    💡 Found price in script: ${price}`);
            break;
          }
        }
      }
    });

    // Method 2: Look for price in specific elements
    if (!price) {
      const priceSelectors = [
        '.goods_price',
        '.detail_price',
        '.price_box',
        '.price_area',
        '.product_price',
        '.selling_price',
        '.sale_price',
        'dd.price',
        '.cost',
        'span.price',
        'strong.price',
        'em.price',
        '[class*="price"]:not([class*="origin"]):not([class*="before"])',
        'td:contains("원")',
        'span:contains("원")',
        'strong:contains("원")'
      ];

      for (const selector of priceSelectors) {
        const elements = $(selector);
        elements.each((i, elem) => {
          const text = $(elem).text();
          const matches = text.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/g);
          if (matches && !price) {
            // Get the largest price (usually the selling price)
            const prices = matches.map(m => {
              const num = parseInt(m.replace(/[^\d]/g, ''));
              return { text: m.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/)[1] + '원', num };
            }).filter(p => p.num > 1000 && p.num < 10000000);
            
            if (prices.length > 0) {
              prices.sort((a, b) => b.num - a.num);
              price = prices[0].text;
              console.log(`    💡 Found price in element: ${price}`);
              return false; // break each loop
            }
          }
        });
        if (price) break;
      }
    }

    // Method 3: Look in table structure
    if (!price) {
      $('table tr').each((i, row) => {
        const $row = $(row);
        const label = $row.find('th').text().trim();
        if (label.includes('판매가') || label.includes('가격') || label.includes('금액')) {
          const valueText = $row.find('td').text();
          const match = valueText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
          if (match) {
            price = match[1] + '원';
            console.log(`    💡 Found price in table: ${price}`);
            return false;
          }
        }
      });
    }

    // Method 4: Look for structured data
    if (!price) {
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const data = JSON.parse($(elem).html() || '{}');
          if (data['@type'] === 'Product' && data.offers) {
            const offerPrice = data.offers.price || data.offers.lowPrice;
            if (offerPrice) {
              price = parseInt(offerPrice).toLocaleString('ko-KR') + '원';
              console.log(`    💡 Found price in structured data: ${price}`);
            }
          }
        } catch (e) {}
      });
    }

    // Method 5: Look in meta tags
    if (!price) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content');
      if (metaPrice) {
        const priceNum = parseInt(metaPrice);
        if (priceNum > 0) {
          price = priceNum.toLocaleString('ko-KR') + '원';
          console.log(`    💡 Found price in meta tag: ${price}`);
        }
      }
    }

    // Method 6: Extract from all text containing 원
    if (!price) {
      const allText = $('body').text();
      const priceMatches = allText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/g);
      if (priceMatches) {
        const validPrices = priceMatches
          .map(m => {
            const match = m.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*원/);
            const num = parseInt(match[1].replace(/,/g, ''));
            return { text: match[1] + '원', num };
          })
          .filter(p => p.num > 1000 && p.num < 10000000 && !m.includes('배송비'));
        
        if (validPrices.length > 0) {
          // Sort by frequency or take the most reasonable price
          price = validPrices[0].text;
          console.log(`    💡 Found price in text: ${price}`);
        }
      }
    }

    return { price, originalPrice };

  } catch (error) {
    console.log(`    ❌ Error fetching page: ${error.message}`);
    return { price: '', originalPrice: '' };
  }
}

async function extractOntongDaejeonPrices() {
  console.log('🚀 Starting Ontong Daejeon price extraction with axios...');

  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  // Read existing food products
  const foodProducts: Product[] = JSON.parse(
    readFileSync('./scripts/output/ontongdaejeon-food-products.json', 'utf-8')
  );
  
  console.log(`📦 Found ${foodProducts.length} food products to process`);

  const updatedProducts: Product[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Create debug directory
  const debugDir = './scripts/output/debug';
  if (!require('fs').existsSync(debugDir)) {
    require('fs').mkdirSync(debugDir, { recursive: true });
  }

  // Process first few products as a test
  const productsToProcess = foodProducts.slice(0, 5); // Test with first 5 products

  for (let i = 0; i < productsToProcess.length; i++) {
    const product = productsToProcess[i];
    console.log(`\n📦 Processing ${i + 1}/${productsToProcess.length}: ${product.title}`);
    console.log(`    URL: ${product.productUrl}`);

    const priceData = await extractPriceFromPage(product.productUrl, httpsAgent);

    if (priceData.price) {
      successCount++;
      product.price = priceData.price;
      if (priceData.originalPrice) {
        product.originalPrice = priceData.originalPrice;
      }
    } else {
      console.log(`    ⚠️ No price found`);
    }

    updatedProducts.push(product);

    // Add delay between requests
    await delay(2000);
  }

  // Save results
  writeFileSync(
    './scripts/output/ontongdaejeon-price-test-results.json',
    JSON.stringify(updatedProducts, null, 2)
  );

  const summary = {
    timestamp: new Date().toISOString(),
    totalProcessed: productsToProcess.length,
    successfulExtractions: successCount,
    errors: errorCount,
    productsWithPrices: updatedProducts.filter(p => p.price).length,
    results: updatedProducts.map(p => ({
      title: p.title,
      price: p.price || '가격정보없음',
      url: p.productUrl
    }))
  };

  writeFileSync(
    './scripts/output/ontongdaejeon-price-test-summary.json',
    JSON.stringify(summary, null, 2)
  );

  console.log('\n📊 Test Extraction Summary:');
  console.log(`✅ Successful extractions: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`💰 Products with prices: ${summary.productsWithPrices}`);

  if (summary.productsWithPrices > 0) {
    console.log('\n💰 Products with prices found:');
    updatedProducts.filter(p => p.price).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - ${p.price}`);
    });
  }
}

// Run the price extractor
extractOntongDaejeonPrices()
  .then(() => console.log('\n✅ Price extraction test completed!'))
  .catch(console.error);