import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractPrice(priceText: string): string | null {
  // Remove whitespace and extract numeric price
  const cleanText = priceText.replace(/\s+/g, ' ').trim();
  
  // Look for price patterns like "32,900원" or just "32,900"
  const priceMatch = cleanText.match(/([0-9,]+)/);
  if (priceMatch) {
    return priceMatch[1].replace(/,/g, '');
  }
  
  return null;
}

function generateProductId(url: string): string {
  const match = url.match(/\/([^\/]+)$/);
  return match ? `esjang_${match[1]}` : `esjang_${Date.now()}`;
}

async function scrapeProductDetails(productUrl: string): Promise<Product | null> {
  try {
    await delay(1000); // Respectful delay
    
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract product name from title tag
    let productName = '';
    const pageTitle = $('title').text().trim();
    if (pageTitle) {
      productName = pageTitle;
    }
    
    if (!productName) {
      console.log(`❌ No product name found for: ${productUrl}`);
      return null;
    }
    
    // Extract price from .sale span
    let price = '';
    const priceElement = $('.sale span').first();
    if (priceElement.length > 0) {
      const priceText = priceElement.text().trim();
      const extracted = extractPrice(priceText);
      if (extracted) {
        price = extracted;
      }
    }
    
    if (!price) {
      console.log(`❌ No price found for: ${productUrl}`);
      return null;
    }
    
    // Extract main product image
    let image = '';
    const productImages = $('img[src*="/upload/item/"]');
    if (productImages.length > 0) {
      const imgSrc = productImages.first().attr('src');
      if (imgSrc) {
        image = imgSrc.startsWith('http') ? imgSrc : `https://www.esjang.go.kr${imgSrc}`;
      }
    }
    
    const product: Product = {
      id: generateProductId(productUrl),
      name: productName,
      price: price,
      image: image,
      url: productUrl
    };
    
    return product;
    
  } catch (error) {
    console.error(`❌ Error scraping ${productUrl}:`, error);
    return null;
  }
}

async function getProductUrlsFromCategory(categoryUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const urls: string[] = [];
    
    $('a[href*="/products/view/"]').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.esjang.go.kr${href}`;
        urls.push(fullUrl);
      }
    });
    
    return [...new Set(urls)]; // Remove duplicates
  } catch (error) {
    console.error(`❌ Error fetching category ${categoryUrl}:`, error);
    return [];
  }
}

async function scrapeEsjangProducts(): Promise<void> {
  console.log('🚀 Starting ESJang Mall comprehensive scraping...');
  
  try {
    const baseUrl = 'https://www.esjang.go.kr';
    
    // Define categories to scrape
    const categories = [
      '/categories/index/allItem',  // All items
      '/categories/index/fruit',    // Fruits
      '/categories/index/grain',    // Grains
      '/categories/index/meet',     // Meat
      '/categories/index/pepper',   // Peppers
      '/categories/index/process',  // Processed foods
      '/categories/index/vegetable' // Vegetables
    ];
    
    // Collect all product URLs from categories
    const productUrls = new Set<string>();
    
    for (const category of categories) {
      const categoryUrl = `${baseUrl}${category}`;
      console.log(`\nFetching category: ${categoryUrl}`);
      
      const urls = await getProductUrlsFromCategory(categoryUrl);
      urls.forEach(url => productUrls.add(url));
      
      console.log(`Found ${urls.length} products in this category`);
      await delay(2000); // Delay between category requests
    }
    
    const urlsArray = Array.from(productUrls);
    console.log(`\n📋 Total unique product URLs found: ${urlsArray.length}`);
    
    if (urlsArray.length === 0) {
      console.log('❌ No product URLs found');
      return;
    }
    
    // Scrape each product
    const products: Product[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < urlsArray.length; i++) {
      const url = urlsArray[i];
      console.log(`\nProgress: ${i + 1}/${urlsArray.length}`);
      console.log(`Scraping: ${url}`);
      
      const product = await scrapeProductDetails(url);
      if (product) {
        products.push(product);
        console.log(`✓ Scraped: ${product.name} - ${product.price}원`);
      } else {
        errors.push(url);
      }
      
      // Respectful delay between requests
      if (i < urlsArray.length - 1) {
        await delay(2000);
      }
    }
    
    // Save results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save products
    const productsPath = path.join(outputDir, 'esjang-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');
    
    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: {
        name: '이천시장',
        url: baseUrl,
        region: '경기도'
      },
      scraping: {
        categoriesScraped: categories.length,
        totalUrlsFound: urlsArray.length,
        successfulScrapes: products.length,
        failedScrapes: errors.length,
        successRate: ((products.length / urlsArray.length) * 100).toFixed(1)
      },
      products: {
        withPrices: products.filter(p => p.price).length,
        withImages: products.filter(p => p.image).length,
        withDiscounts: products.filter(p => p.originalPrice).length,
        averagePrice: products.length > 0 ? 
          (products.reduce((sum, p) => sum + parseInt(p.price || '0'), 0) / products.length).toFixed(0) : '0',
        priceRange: {
          min: products.length > 0 ? Math.min(...products.map(p => parseInt(p.price || '0'))).toString() : '0',
          max: products.length > 0 ? Math.max(...products.map(p => parseInt(p.price || '0'))).toString() : '0'
        }
      },
      sampleProducts: products.slice(0, 5).map(p => ({
        name: p.name,
        price: p.price + '원',
        hasDiscount: !!p.originalPrice
      })),
      failedUrls: errors
    };
    
    const summaryPath = path.join(outputDir, 'esjang-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    // Console summary
    console.log('\n🎉 ESJang Mall scraping completed!');
    console.log('📊 Results:');
    console.log(`   • Categories scraped: ${categories.length}`);
    console.log(`   • Total URLs processed: ${urlsArray.length}`);
    console.log(`   • Successful scrapes: ${products.length}`);
    console.log(`   • Products with prices: ${products.filter(p => p.price).length}`);
    console.log(`   • Failed scrapes: ${errors.length}`);
    
    console.log('\n📁 Files saved:');
    console.log(`   • Products: ${productsPath}`);
    console.log(`   • Summary: ${summaryPath}`);
    
    if (products.length > 0) {
      console.log('\n🔍 Sample products:');
      products.slice(0, 3).forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} - ${product.price}원`);
      });
    }
    
    console.log('✅ Scraping completed successfully');
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  }
}

// Run scraper
scrapeEsjangProducts()
  .then(() => {
    console.log('🎉 Scraping process completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });