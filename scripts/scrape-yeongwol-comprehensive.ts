/**
 * Comprehensive Yeongwol Mall Scraper
 * URL: https://yeongwol-mall.com/
 * Strategy: Extract product URLs from homepage and categories, then scrape individual product pages
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
  categories: string[];
}

async function scrapeYeongwolMall(): Promise<void> {
  console.log('🕸️ Starting Yeongwol Mall comprehensive scraper...');
  
  const result: ScrapingResult = {
    totalProducts: 0,
    successfulScrapes: 0,
    errors: 0,
    products: [],
    errorDetails: [],
    categories: []
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
    const homeResponse = await axios.get('https://yeongwol-mall.com/', { headers, timeout: 30000 });
    const $ = cheerio.load(homeResponse.data);
    
    const productUrls: string[] = [];
    
    // Extract product URLs from homepage
    $('a[href*="/goods/view"]').each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://yeongwol-mall.com${href}`;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });

    console.log(`🔗 Found ${productUrls.length} product URLs from homepage`);

    // Step 2: Extract additional product URLs from category pages
    console.log('📂 Extracting product URLs from category pages...');
    
    const categoryUrls = [
      'https://yeongwol-mall.com/goods/catalog?code=0030', // 축산물
      'https://yeongwol-mall.com/goods/catalog?code=0017', // 과일/견과
      'https://yeongwol-mall.com/goods/catalog?code=0021', // 채소/나물
      'https://yeongwol-mall.com/goods/catalog?code=0005', // 장/소금/기름/양념
      'https://yeongwol-mall.com/goods/catalog?code=00170009', // 과일류
      'https://yeongwol-mall.com/goods/catalog?code=00170008', // 견과류
      'https://yeongwol-mall.com/goods/catalog?code=00170005', // 즙/분말/잼류
      'https://yeongwol-mall.com/goods/catalog?code=00210001', // 절임배추
      'https://yeongwol-mall.com/goods/catalog?code=00210002', // 감자
      'https://yeongwol-mall.com/goods/catalog?code=00210004', // 옥수수
      'https://yeongwol-mall.com/goods/catalog?code=00210005', // 토마토
      'https://yeongwol-mall.com/goods/catalog?code=00210003'  // 건나물/냉동나물
    ];

    for (const categoryUrl of categoryUrls) {
      try {
        console.log(`📂 Checking category: ${categoryUrl}`);
        const categoryResponse = await axios.get(categoryUrl, { 
          headers, 
          timeout: 20000,
          validateStatus: (status) => status < 400
        });
        
        if (categoryResponse.status === 200) {
          const category$ = cheerio.load(categoryResponse.data);
          
          // Extract product URLs from category page
          category$('a[href*="/goods/view"]').each((index, element) => {
            const href = category$(element).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http') ? href : `https://yeongwol-mall.com${href}`;
              if (!productUrls.includes(fullUrl)) {
                productUrls.push(fullUrl);
              }
            }
          });
        }
        
        // Small delay between category requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ Failed to access category ${categoryUrl}: ${error.message}`);
      }
    }

    console.log(`🔗 Total unique product URLs found: ${productUrls.length}`);
    result.totalProducts = productUrls.length;

    // Save product URLs for reference
    await fs.writeFile(
      path.join(outputDir, 'yeongwol-product-urls.txt'), 
      productUrls.join('\n')
    );

    if (productUrls.length === 0) {
      throw new Error('No product URLs found');
    }

    // Step 3: Scrape each product page
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
        
        // Extract product name using the correct selector
        let productName = '';
        const nameElement = product$('[class*="name"]').first();
        if (nameElement.length > 0) {
          productName = nameElement.text().trim();
        }
        
        // If no name found, try alternative selectors
        if (!productName || productName === '추천 상품' || productName.length < 3) {
          const fallbackSelectors = [
            'h1',
            '.goods-name', 
            '.product-name',
            '.subject',
            '.detail-title'
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

        // Extract price using the correct selector
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

        // Extract image using the correct selector
        let productImage = '';
        const imageElement = product$('img[src*="goods"]').first();
        if (imageElement.length > 0) {
          const imgSrc = imageElement.attr('src') || '';
          if (imgSrc) {
            productImage = imgSrc.startsWith('http') ? imgSrc : `https://yeongwol-mall.com${imgSrc}`;
          }
        }

        // Determine category based on product context or URL
        let category = '영월특산품';
        const bodyText = product$('body').text().toLowerCase();
        
        if (bodyText.includes('축산') || bodyText.includes('한우') || bodyText.includes('돼지')) {
          category = '축산물';
        } else if (bodyText.includes('과일') || bodyText.includes('사과') || bodyText.includes('배')) {
          category = '과일';
        } else if (bodyText.includes('채소') || bodyText.includes('나물') || bodyText.includes('감자') || bodyText.includes('옥수수')) {
          category = '채소/나물';
        } else if (bodyText.includes('견과') || bodyText.includes('호두') || bodyText.includes('땅콩')) {
          category = '견과류';
        } else if (bodyText.includes('장') || bodyText.includes('기름') || bodyText.includes('양념')) {
          category = '가공품';
        }

        // Create description
        let description = productName;
        if (productName.includes('영월')) {
          description = `${productName} - 영월 지역 특산품`;
        }

        // Only create product if we have essential data
        if (productName && 
            productName.length > 3 && 
            productName !== '추천 상품' && 
            productName !== 'aside menu' &&
            productPrice > 0) {
          
          const productId = `yeongwol_${Date.now()}_${i}`;
          
          const product: Product = {
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            link: productUrl,
            mall: '영월몰',
            mallId: 'mall_23',
            category: category,
            description: description,
            inStock: true,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
          };

          result.products.push(product);
          result.successfulScrapes++;
          
          if (!result.categories.includes(category)) {
            result.categories.push(category);
          }
          
          console.log(`✅ Scraped: ${productName} - ${productPrice.toLocaleString()}원 (${category})`);
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

    // Step 4: Save results
    console.log('💾 Saving scraping results...');
    
    const productsFile = path.join(outputDir, 'yeongwol-products.json');
    const summaryFile = path.join(outputDir, 'yeongwol-scrape-summary.json');
    
    await fs.writeFile(productsFile, JSON.stringify(result.products, null, 2));
    await fs.writeFile(summaryFile, JSON.stringify({
      mallId: 'mall_23',
      mallName: '영월몰',
      totalUrls: result.totalProducts,
      successfulScrapes: result.successfulScrapes,
      errors: result.errors,
      productsWithValidData: result.products.length,
      scrapedAt: new Date().toISOString(),
      errorDetails: result.errorDetails,
      categories: result.categories,
      priceRange: result.products.length > 0 ? {
        min: Math.min(...result.products.map(p => p.price)),
        max: Math.max(...result.products.map(p => p.price)),
        average: Math.round(result.products.reduce((sum, p) => sum + p.price, 0) / result.products.length)
      } : null
    }, null, 2));

    console.log('\n🎉 Yeongwol Mall scraping completed!');
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

      console.log(`\n📊 Categories found: ${result.categories.join(', ')}`);
      
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
      mallId: 'mall_23',
      mallName: '영월몰',
      error: error.message,
      scrapedAt: new Date().toISOString(),
      partialResults: result
    };
    
    await fs.writeFile(
      path.join(outputDir, 'yeongwol-error-summary.json'), 
      JSON.stringify(errorSummary, null, 2)
    );
  }
}

// Run the scraper
if (require.main === module) {
  scrapeYeongwolMall().catch(console.error);
}

export { scrapeYeongwolMall };