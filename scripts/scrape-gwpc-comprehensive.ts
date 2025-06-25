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
  
  // Look for price patterns like "72,000₩" or "72000원"
  const priceMatch = cleanText.match(/([0-9,]+)[₩원]/);
  if (priceMatch) {
    return priceMatch[1].replace(/,/g, '');
  }
  
  return null;
}

function generateProductId(url: string): string {
  const match = url.match(/no=(\d+)/);
  return match ? `gwpc_${match[1]}` : `gwpc_${Date.now()}`;
}

async function scrapeProductDetails(productUrl: string): Promise<Product | null> {
  try {
    await delay(1000); // Respectful delay
    
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Check if product exists
    if (response.data.includes('해당상품이 존재하지 않습니다')) {
      console.log(`❌ Product not found: ${productUrl}`);
      return null;
    }
    
    // Extract product name (use .name as primary, h3 as fallback)
    let productName = '';
    const nameFromClass = $('.name').first().text().trim();
    const nameFromH3 = $('h3').first().text().trim();
    
    productName = nameFromClass || nameFromH3;
    
    if (!productName) {
      console.log(`❌ No product name found for: ${productUrl}`);
      return null;
    }
    
    // Extract price information
    let price = '';
    let originalPrice = '';
    
    const priceElements = $('[class*="price"]');
    if (priceElements.length > 0) {
      const priceTexts = priceElements.map((i, el) => $(el).text().trim()).get();
      
      // Look for valid price text
      for (const priceText of priceTexts) {
        if (priceText.includes('₩') && priceText.length < 50) { // Avoid long text blocks
          const extractedPrice = extractPrice(priceText);
          if (extractedPrice) {
            price = extractedPrice;
            break;
          }
        }
      }
    }
    
    if (!price) {
      console.log(`❌ No price found for: ${productUrl}`);
      return null;
    }
    
    // Extract main product image
    let image = '';
    const productImages = $('img[src*="goods"]');
    if (productImages.length > 0) {
      const imgSrc = productImages.first().attr('src');
      if (imgSrc) {
        image = imgSrc.startsWith('http') ? imgSrc : `https://gwpc-mall.com${imgSrc}`;
      }
    }
    
    const product: Product = {
      id: generateProductId(productUrl),
      name: productName,
      price: price,
      image: image,
      url: productUrl
    };
    
    if (originalPrice) {
      product.originalPrice = originalPrice;
    }
    
    return product;
    
  } catch (error) {
    console.error(`❌ Error scraping ${productUrl}:`, error);
    return null;
  }
}

async function scrapeGwpcProducts(): Promise<void> {
  console.log('🚀 Starting GWPC Mall comprehensive scraping...');
  
  try {
    const baseUrl = 'https://gwpc-mall.com';
    console.log(`Fetching homepage: ${baseUrl}`);
    
    // Get homepage to extract product URLs
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract all product URLs
    const productUrls = new Set<string>();
    
    $('a[href*="goods/view"]').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        productUrls.add(fullUrl);
      }
    });
    
    const urlsArray = Array.from(productUrls);
    console.log(`Found ${urlsArray.length} product URLs on homepage`);
    
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
    const productsPath = path.join(outputDir, 'gwpc-products.json');
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');
    
    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      mall: {
        name: '평창몰',
        url: baseUrl,
        region: '강원도'
      },
      scraping: {
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
    
    const summaryPath = path.join(outputDir, 'gwpc-scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    
    // Console summary
    console.log('\n🎉 GWPC Mall scraping completed!');
    console.log('📊 Results:');
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
scrapeGwpcProducts()
  .then(() => {
    console.log('🎉 Scraping process completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });