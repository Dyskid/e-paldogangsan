/**
 * Final Yangyang Mall Scraper with Improved Product Name Detection
 * URL: https://yangyang-mall.com/
 * Strategy: Extract product URLs from homepage and scrape individual product pages with improved selectors
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

async function scrapeYangyangMallFinal(): Promise<void> {
  console.log('🕸️ Starting Yangyang Mall final scraper with improved selectors...');
  
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
      path.join(outputDir, 'yangyang-final-product-urls.txt'), 
      productUrls.join('\n')
    );

    if (productUrls.length === 0) {
      throw new Error('No product URLs found on homepage');
    }

    // Step 2: Scrape each product page with improved selectors
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
        
        // Extract product name using improved selector
        let productName = '';
        
        // First try the specific selector that worked in testing
        const nameElement = product$('[class*="name"]').first();
        if (nameElement.length > 0) {
          productName = nameElement.text().trim();
        }
        
        // If that doesn't work, try other selectors
        if (!productName || productName === '추천 상품' || productName.length < 3) {
          const fallbackSelectors = [
            'h1',
            '.goods-name', 
            '.product-name',
            '.subject',
            '.detail-title',
            '.goods-title'
          ];
          
          for (const selector of fallbackSelectors) {
            const element = product$(selector).first();
            if (element.length > 0) {
              const text = element.text().trim();
              if (text && text !== '추천 상품' && text.length > 3) {
                productName = text;
                break;
              }
            }
          }
        }

        // Extract price with improved selector
        let productPrice = 0;
        let priceText = '';
        
        const priceElement = product$('[class*="price"]').first();
        if (priceElement.length > 0) {
          priceText = priceElement.text().trim();
          // Extract numeric price
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            productPrice = parseInt(priceMatch[0].replace(/,/g, ''), 10);
          }
        }

        // Extract image with improved selector
        let productImage = '';
        const imageElement = product$('img[src*="goods"]').first();
        if (imageElement.length > 0) {
          const imgSrc = imageElement.attr('src') || '';
          if (imgSrc) {
            productImage = imgSrc.startsWith('http') ? imgSrc : `https://yangyang-mall.com${imgSrc}`;
          }
        }

        // Extract category from product context
        let category = '양양특산품';
        const bodyText = product$('body').text();
        if (bodyText.includes('농산물')) category = '농산물';
        else if (bodyText.includes('수산물') || bodyText.includes('해산물')) category = '수산물';
        else if (bodyText.includes('가공품')) category = '가공품';
        else if (bodyText.includes('꿀') || bodyText.includes('벌꿀')) category = '양봉제품';

        // Extract manufacturer/description for better product details
        let description = productName;
        const manufacturerElement = product$('li.td').filter((index, element) => {
          return product$(element).text().includes('설악산') || product$(element).text().includes('양양');
        }).first();
        
        if (manufacturerElement.length > 0) {
          const manufacturerText = manufacturerElement.text().trim();
          if (manufacturerText && manufacturerText.length > 5) {
            description = `${productName} - ${manufacturerText.substring(0, 100)}`;
          }
        }

        // Only create product if we have essential data and a real product name
        if (productName && 
            productName.length > 3 && 
            productName !== '추천 상품' && 
            productName !== 'aside menu' &&
            productPrice > 0) {
          
          const productId = `yangyang_${Date.now()}_${i}`;
          
          const product: Product = {
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            link: productUrl,
            mall: '양양몰',
            mallId: 'mall_22',
            category: category,
            description: description,
            inStock: true, // Assume in stock unless specified otherwise
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          result.products.push(product);
          result.successfulScrapes++;
          console.log(`✅ Scraped: ${productName} - ${productPrice.toLocaleString()}원`);
        } else {
          console.log(`⚠️ Insufficient data - Name: "${productName}", Price: ${productPrice}`);
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
    console.log('💾 Saving final scraping results...');
    
    const productsFile = path.join(outputDir, 'yangyang-final-products.json');
    const summaryFile = path.join(outputDir, 'yangyang-final-scrape-summary.json');
    
    await fs.writeFile(productsFile, JSON.stringify(result.products, null, 2));
    await fs.writeFile(summaryFile, JSON.stringify({
      mallId: 'mall_22',
      mallName: '양양몰',
      totalUrls: result.totalProducts,
      successfulScrapes: result.successfulScrapes,
      errors: result.errors,
      productsWithValidData: result.products.length,
      scrapedAt: new Date().toISOString(),
      errorDetails: result.errorDetails,
      categories: [...new Set(result.products.map(p => p.category))],
      priceRange: {
        min: Math.min(...result.products.map(p => p.price)),
        max: Math.max(...result.products.map(p => p.price)),
        average: Math.round(result.products.reduce((sum, p) => sum + p.price, 0) / result.products.length)
      }
    }, null, 2));

    console.log('\n🎉 Yangyang Mall final scraping completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total URLs found: ${result.totalProducts}`);
    console.log(`   Successful scrapes: ${result.successfulScrapes}`);
    console.log(`   Valid products: ${result.products.length}`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`📁 Files saved:`);
    console.log(`   Products: ${productsFile}`);
    console.log(`   Summary: ${summaryFile}`);

    if (result.products.length > 0) {
      console.log(`\n🛍️ Sample products scraped:`);
      result.products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price.toLocaleString()}원 (${product.category})`);
      });

      console.log(`\n📊 Categories found: ${[...new Set(result.products.map(p => p.category))].join(', ')}`);
      
      const priceRange = {
        min: Math.min(...result.products.map(p => p.price)),
        max: Math.max(...result.products.map(p => p.price))
      };
      console.log(`💰 Price range: ${priceRange.min.toLocaleString()}원 - ${priceRange.max.toLocaleString()}원`);
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
      path.join(outputDir, 'yangyang-final-error-summary.json'), 
      JSON.stringify(errorSummary, null, 2)
    );
  }
}

// Run the scraper
if (require.main === module) {
  scrapeYangyangMallFinal().catch(console.error);
}

export { scrapeYangyangMallFinal };